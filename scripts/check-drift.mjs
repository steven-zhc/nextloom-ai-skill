#!/usr/bin/env node
/**
 * Drift guard for the Nextloom AI skills.
 *
 * Every `nextloom ...` command written in a SKILL.md is a promise to the agent
 * reading it. This script checks those promises against the CLI's own generated
 * reference, so a CLI release that renames a command or drops a flag fails here
 * instead of failing in a user's terminal.
 *
 * Three structural checks per command line:
 *   1. the command path exists
 *   2. every --flag is declared on that command, or is global
 *   3. the positional count does not exceed the command's declared args
 *
 * Check 3 is the one that matters most: it is what catches `app add "<url>"`
 * and `profile edit --field <key> <value>`, the two bugs that made the original
 * skills unusable. Both parse as a known command with a stray positional.
 *
 * WHAT THIS CANNOT CATCH — do not mistake a green run for correctness:
 *   - a right-shaped argument of the wrong kind. `generate status <app-id>`
 *     passes every check above; the reference only knows the command takes one
 *     string, not that the string must be a job id.
 *   - a flag that is valid but wrong for the job, or a missing-but-needed flag.
 *   - prose. Any claim outside a fenced command block is unverified.
 * Those remain a human review item.
 *
 * Usage:
 *   node scripts/check-drift.mjs                  # fetch the live reference
 *   node scripts/check-drift.mjs --ref path.json  # check against a local file
 *   node scripts/check-drift.mjs --strict         # network failure is fatal
 */

import { readFile, readdir } from 'node:fs/promises'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const REFERENCE_URL = 'https://nextloom.ai/cli-reference.json'
const FETCH_TIMEOUT_MS = 15_000
const FETCH_ATTEMPTS = 3

/**
 * `--env` is real but absent from the reference: `cli.ts` parses it out of argv
 * before CrustJS ever sees it, so the generated command tree cannot know about
 * it. Hard-coded here rather than silently accepting every unknown flag.
 */
const EXTRA_GLOBAL_FLAGS = new Map([['--env', '<env>']])

const argv = process.argv.slice(2)
const strict = argv.includes('--strict')
const refFlagIndex = argv.indexOf('--ref')
const refPath = refFlagIndex !== -1 ? argv[refFlagIndex + 1] : null

const color = process.stdout.isTTY && !process.env.NO_COLOR
const red = (s) => (color ? `[31m${s}[0m` : s)
const yellow = (s) => (color ? `[33m${s}[0m` : s)
const green = (s) => (color ? `[32m${s}[0m` : s)
const dim = (s) => (color ? `[2m${s}[0m` : s)

// ── Load the reference ────────────────────────────────────────────────

/** Fetch with a timeout, retrying on transient failure. */
const fetchReference = async () => {
  let lastError
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(REFERENCE_URL, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { accept: 'application/json' },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      lastError = error
      if (attempt < FETCH_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
      }
    }
  }
  throw lastError
}

const loadReference = async () => {
  if (refPath) {
    return { reference: JSON.parse(await readFile(refPath, 'utf8')), source: refPath }
  }
  return { reference: await fetchReference(), source: REFERENCE_URL }
}

// ── Index the reference ───────────────────────────────────────────────

/**
 * Look up table keyed by the full command string.
 *
 * `commands[].name` is already the full invocation ("nextloom app add"), so the
 * key needs no assembly — and matching on the bare subcommand would miss every
 * entry. `args` is kept as a count because only arity is checkable.
 */
const indexCommands = (reference) => {
  const commands = new Map()
  for (const section of reference.sections ?? []) {
    for (const command of section.commands ?? []) {
      commands.set(command.name, {
        name: command.name,
        flags: new Map((command.flags ?? []).map((flag) => [flag.name, flag.value])),
        maxArgs: (command.args ?? []).length,
      })
    }
  }
  return commands
}

const indexGlobalFlags = (reference) => {
  const flags = new Map(EXTRA_GLOBAL_FLAGS)
  for (const flag of reference.globalFlags ?? []) flags.set(flag.name, flag.value)
  return flags
}

/**
 * The set of command *groups* — every proper prefix of a real command path.
 * `nextloom app --help` is valid even though `nextloom app` is not a command.
 */
const indexGroups = (commands) => {
  const groups = new Set()
  for (const name of commands.keys()) {
    const parts = name.split(' ')
    for (let length = 1; length < parts.length; length++) {
      groups.add(parts.slice(0, length).join(' '))
    }
  }
  return groups
}

// ── Extract command lines from Markdown ───────────────────────────────

/**
 * Pull every `nextloom ...` command out of a Markdown file.
 *
 * TWO representations, both checked:
 *   - lines inside fenced code blocks
 *   - inline code spans anywhere else — `` `nextloom app add --url <url>` ``
 *
 * Inline spans are not optional extra credit. The worst bug this repo ever
 * shipped — a fabricated table of `profile edit` field names — lived in a
 * Markdown table, not a fence. A fenced-only extractor rates that file clean.
 * The README's CLI Reference table is the most copy-pasted surface here and is
 * built entirely from inline spans.
 *
 * `nai` is the CLI's second installed name. Normalize it rather than skip it,
 * so a command written that way is verified instead of silently ignored.
 */
const BIN_PATTERN = /^(nextloom|nai)(\s|$)/

const normalizeBin = (text) => text.replace(/^nai(\s|$)/, 'nextloom$1')

const extractCommands = (markdown, file) => {
  const found = []
  let inFence = false
  let fenceMarker = ''

  markdown.split('\n').forEach((rawLine, index) => {
    const line = rawLine.trim()
    const fence = line.match(/^(`{3,}|~{3,})/)

    if (fence) {
      if (!inFence) {
        inFence = true
        fenceMarker = fence[1]
      } else if (line.startsWith(fenceMarker)) {
        inFence = false
        fenceMarker = ''
      }
      return
    }

    if (inFence) {
      const command = line.replace(/^\$\s+/, '') // drop a leading shell prompt
      if (BIN_PATTERN.test(command)) {
        found.push({ file, line: index + 1, text: normalizeBin(command), source: 'block' })
      }
      return
    }

    // Outside a fence: every inline code span is a candidate.
    for (const match of rawLine.matchAll(/`([^`]+)`/g)) {
      const command = match[1].trim().replace(/^\$\s+/, '')
      if (BIN_PATTERN.test(command)) {
        found.push({ file, line: index + 1, text: normalizeBin(command), source: 'inline' })
      }
    }
  })

  return found
}

// ── Parse one command line ────────────────────────────────────────────

/**
 * Split a command line into tokens, honoring quotes so that
 * `app add --detail "a b c"` yields one value token, not three.
 *
 * Everything after a pipe, redirect, or `#` comment belongs to the shell rather
 * than to nextloom, and is dropped.
 */
const tokenize = (text) => {
  const tokens = []
  let current = ''
  let quoted = false
  let quote = null

  const push = () => {
    if (current || quoted) tokens.push(current)
    current = ''
    quoted = false
  }

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (quote) {
      if (char === quote) quote = null
      else current += char // spaces inside quotes stay in the token
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      quoted = true
      continue
    }

    // `<app-id>` is a documentation placeholder, not input redirection. Consume
    // it whole — reading the `<` as a redirect truncated the line and hid every
    // positional-argument bug this script exists to find.
    if (char === '<') {
      const placeholder = text.slice(i).match(/^<[^<>]*>/)
      if (placeholder) {
        current += placeholder[0]
        i += placeholder[0].length - 1
        continue
      }
    }

    // Real shell metacharacters end the nextloom invocation.
    if (char === '|' || char === '>' || char === '<' || char === '&' || char === ';') {
      if (/^\d+$/.test(current)) current = '' // the fd in `2>/dev/null`
      break
    }
    if (char === '#' && current === '' && tokens.length > 0) break
    if (/\s/.test(char)) {
      push()
      continue
    }
    current += char
  }
  push()
  return tokens
}

/**
 * Resolve the longest known command path from the leading tokens.
 *
 * Longest-match matters: `profile view` and `profile skill list` are both real,
 * and a shortest-first match would mis-resolve the three-word forms.
 */
const MAX_PATH_TOKENS = 4 // `nextloom profile skill remove`

const resolveCommand = (tokens, commands) => {
  for (let length = Math.min(tokens.length, MAX_PATH_TOKENS); length >= 2; length--) {
    const candidate = tokens.slice(0, length).join(' ')
    if (commands.has(candidate)) return { command: commands.get(candidate), consumed: length }
  }
  return { command: null, consumed: 0 }
}

// ── Check one command line ────────────────────────────────────────────

const checkCommand = (entry, commands, globalFlags, groups) => {
  const problems = []
  const tokens = tokenize(entry.text)
  const rest0 = tokens.slice(1)

  // `nextloom` alone, or `nextloom --help`, is always fine.
  if (rest0.length === 0 || rest0.every((token) => token.startsWith('-'))) return problems

  const { command, consumed } = resolveCommand(tokens, commands)

  if (!command) {
    // `nextloom app --help` targets a group, not a command. Valid.
    const path = tokens.filter((token) => !token.startsWith('-'))
    if (groups.has(path.join(' '))) return problems

    problems.push(`unknown command: ${red(path.slice(0, 4).join(' '))}`)
    return problems
  }

  const rest = tokens.slice(consumed)
  const positionals = []

  for (let i = 0; i < rest.length; i++) {
    const token = rest[i]

    if (token.startsWith('--')) {
      const [name, inlineValue] = token.split('=', 2)
      const positive = name.replace(/^--no-/, '--') // `--no-wait` negates `--wait`
      const declared = command.flags.has(name)
        ? name
        : command.flags.has(positive)
          ? positive
          : null

      if (declared === null && !globalFlags.has(name)) {
        problems.push(`unknown flag ${red(name)} on ${dim(command.name)}`)
        continue
      }

      // A flag that takes a value consumes the next token, unless it was inline.
      const shape = declared ? command.flags.get(declared) : globalFlags.get(name)
      if (shape && inlineValue === undefined && i + 1 < rest.length) i++
      continue
    }
    if (token.startsWith('-')) continue // short flag, not modelled in the reference
    positionals.push(token)
  }

  if (positionals.length > command.maxArgs) {
    problems.push(
      command.maxArgs === 0
        ? `${dim(command.name)} takes no positional argument, got ${red(positionals.join(' '))}`
        : `${dim(command.name)} takes ${command.maxArgs} positional argument(s), got ${positionals.length}: ${red(positionals.join(' '))}`,
    )
  }

  return problems
}

// ── Collect the files to check ────────────────────────────────────────

const collectFiles = async () => {
  const files = [join(ROOT, 'README.md')]
  const skillsDir = join(ROOT, 'skills')
  for (const entry of await readdir(skillsDir, { withFileTypes: true })) {
    if (entry.isDirectory()) files.push(join(skillsDir, entry.name, 'SKILL.md'))
  }
  return files
}

// ── Main ──────────────────────────────────────────────────────────────

const main = async () => {
  let reference
  let source

  try {
    ;({ reference, source } = await loadReference())
  } catch (error) {
    const message = `could not load the CLI reference (${error.message})`
    if (strict || refPath) {
      console.error(`${red('drift: FAIL')}  ${message}`)
      process.exit(1)
    }
    // Fail soft on PRs. A nextloom.ai outage is not a defect in this repo, and
    // blocking every PR on a third-party fetch trains people to ignore the
    // check. The scheduled run passes --strict, so real drift still surfaces.
    console.warn(`${yellow('drift: SKIPPED')}  ${message}`)
    console.warn(dim('  re-run with --strict to treat this as a failure'))
    process.exit(0)
  }

  const commands = indexCommands(reference)
  const globalFlags = indexGlobalFlags(reference)
  const groups = indexGroups(commands)

  const files = await collectFiles()
  let checked = 0
  const failures = []

  for (const file of files) {
    let markdown
    try {
      markdown = await readFile(file, 'utf8')
    } catch {
      continue
    }
    for (const entry of extractCommands(markdown, file)) {
      checked++
      for (const problem of checkCommand(entry, commands, globalFlags, groups)) {
        failures.push({ ...entry, problem })
      }
    }
  }

  console.log(`${dim('reference')}             ${source}`)
  console.log(`${dim('CLI version')}           ${reference.version}`)
  console.log(`${dim('commands known')}        ${commands.size}`)
  console.log(`${dim('command lines checked')} ${checked}`)
  console.log('')

  if (failures.length === 0) {
    console.log(`${green('drift: PASS')}  every documented command matches CLI v${reference.version}`)
    console.log(dim('  structural only — argument kinds and prose claims are not verified'))
    return
  }

  for (const failure of failures) {
    console.error(`${red('✗')} ${relative(ROOT, failure.file)}:${failure.line}`)
    console.error(`  ${dim(failure.text)}`)
    console.error(`  ${failure.problem}`)
    console.error('')
  }
  console.error(
    `${red('drift: FAIL')}  ${failures.length} problem(s) across ${checked} command line(s)`,
  )
  process.exit(1)
}

await main()
