/**
 * Tests for the drift guard.
 *
 * This file exists because the guard is the only thing protecting the skills
 * from describing a CLI that does not exist, and twice during its own
 * development it had a defect that made it report PASS on plainly broken input:
 *
 *   1. the tokenizer treated `<` as shell input redirection, so every
 *      `nextloom app add "<url>"` line was truncated before the bad argument
 *   2. the extractor read fenced blocks only, so a broken command in a Markdown
 *      table — which is where the original fabricated field table lived — was
 *      never looked at
 *
 * Both were found by hand-injecting bad commands. Those injections are the
 * tests below. A verifier with no tests is a verifier you cannot trust after
 * its first edit.
 *
 * Run: node --test scripts/check-drift.test.mjs
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, writeFile, cp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SCRIPT = join(ROOT, 'scripts', 'check-drift.mjs')
const REFERENCE = join(ROOT, 'cli-reference.json')

/**
 * Run the guard against a throwaway repo containing exactly `files`.
 *
 * The guard resolves the files it scans from its own location, so the script is
 * copied into the fixture rather than pointed at it.
 */
const checkFixture = async (files) => {
  const dir = await mkdtemp(join(tmpdir(), 'drift-'))
  try {
    await mkdir(join(dir, 'scripts'), { recursive: true })
    await cp(SCRIPT, join(dir, 'scripts', 'check-drift.mjs'))
    await cp(REFERENCE, join(dir, 'cli-reference.json'))

    for (const [name, body] of Object.entries(files)) {
      const path = join(dir, name)
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, body)
    }

    try {
      const { stdout } = await run('node', [
        join(dir, 'scripts', 'check-drift.mjs'),
        '--ref',
        join(dir, 'cli-reference.json'),
      ])
      return { code: 0, output: stdout }
    } catch (error) {
      return { code: error.code, output: `${error.stdout ?? ''}${error.stderr ?? ''}` }
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

const fenced = (...lines) => `# Fixture\n\n\`\`\`bash\n${lines.join('\n')}\n\`\`\`\n`

describe('commands that must PASS', () => {
  const good = {
    'a bare command': 'nextloom auth login',
    'a three-word path': 'nextloom profile skill add TypeScript',
    'a global flag': 'nextloom app list --json',
    // Not `app add --url <link>`: that reads as a flag-with-a-value case but is
    // a command the CLI now refuses, since `--file` is required as of v0.24.0.
    // The guard does not check required flags, so it passed either way — which
    // is the point. Do not put an invalid command in the PASS list.
    'a flag with a value': 'nextloom app list --status Interviewing',
    'an inline flag value': 'nextloom doc generate resume app_a1 --format=pdf',
    'the dotted --field form': 'nextloom profile edit --field personalInfo.timezone=America/Chicago',
    'a negated boolean flag': 'nextloom app add --file jd.txt --no-wait',
    'the --env global (absent from the reference)': 'nextloom auth whoami --env dev',
    'group help': 'nextloom app --help',
    'root help': 'nextloom --help',
    'a shell redirect': 'nextloom auth whoami --json 2>/dev/null',
    'a pipe into jq': "nextloom app list --json | jq '.[].company_name'",
    'a trailing comment': 'nextloom app view app_a1 --json   # inspect it',
    'a placeholder argument': 'nextloom doc status <job-id>',
    'the nai alias': 'nai auth whoami --json',
  }

  for (const [label, command] of Object.entries(good)) {
    test(label, async () => {
      const { code, output } = await checkFixture({ 'README.md': fenced(command) })
      assert.equal(code, 0, `expected PASS for \`${command}\`\n${output}`)
    })
  }
})

describe('commands that must FAIL', () => {
  const bad = {
    // The two bugs that made the original skills unusable.
    'a positional argument on app add': 'nextloom app add "<url>"',
    'the space-separated --field form': 'nextloom profile edit --field name "<value>"',
    // UNQUOTED placeholders specifically. The quoted forms above are caught by
    // the quote branch of the tokenizer and would still fail if `<` were once
    // again treated as shell input redirection — these are the cases that
    // actually pin that fix. Deleting the placeholder branch makes both of
    // these silently pass.
    'an unquoted placeholder positional': 'nextloom app add <url>',
    'too many unquoted placeholders': 'nextloom app view <id> <extra>',
    'the unquoted space-separated --field form': 'nextloom profile edit --field <key> <value>',
    // General drift.
    'an unknown command': 'nextloom bogus-command',
    'an unknown subcommand': 'nextloom app frobnicate app_a1',
    'an unknown flag': 'nextloom app list --nope',
    'too many positionals': 'nextloom app view app_a1 app_b2',
  }

  for (const [label, command] of Object.entries(bad)) {
    test(label, async () => {
      const { code, output } = await checkFixture({ 'README.md': fenced(command) })
      assert.equal(code, 1, `expected FAIL for \`${command}\`\n${output}`)
    })
  }
})

describe('extraction coverage', () => {
  test('reads commands out of Markdown table cells, not just fenced blocks', async () => {
    // Regression: the fenced-only extractor rated this file clean.
    const { code, output } = await checkFixture({
      'README.md': [
        '| Command | Description |',
        '|---------|-------------|',
        '| `nextloom app add "<url>"` | broken — positional argument |',
        '',
      ].join('\n'),
    })
    assert.equal(code, 1, `table rows must be checked\n${output}`)
  })

  test('reads commands out of prose', async () => {
    const { code } = await checkFixture({
      'README.md': 'Run `nextloom bogus-command` to do the thing.\n',
    })
    assert.equal(code, 1)
  })

  test('scans Markdown anywhere in the repo, not a hardcoded list', async () => {
    // Regression: only README.md and skills/*/SKILL.md used to be read.
    const { code, output } = await checkFixture({
      'README.md': '# Fine\n',
      'docs/guide.md': fenced('nextloom app add "<url>"'),
    })
    assert.equal(code, 1, `new docs must be checked\n${output}`)
  })

  test('ignores non-Markdown files', async () => {
    const { code } = await checkFixture({
      'README.md': '# Fine\n',
      'notes.txt': 'nextloom app add "<url>"',
    })
    assert.equal(code, 0)
  })
})

describe('argument handling', () => {
  test('--ref without a value is a usage error, not a silent live fetch', async () => {
    const result = await run('node', [SCRIPT, '--ref'], { cwd: ROOT }).then(
      () => ({ code: 0, stderr: '' }),
      (error) => ({ code: error.code, stderr: error.stderr }),
    )
    assert.equal(result.code, 2)
    assert.match(result.stderr, /--ref needs a path/)
  })

  test('a missing --ref file fails hard rather than falling back', async () => {
    const result = await run('node', [SCRIPT, '--ref', '/no/such/file.json'], {
      cwd: ROOT,
    }).then(
      () => ({ code: 0, stderr: '' }),
      (error) => ({ code: error.code, stderr: error.stderr }),
    )
    assert.equal(result.code, 1)
    assert.match(result.stderr, /could not load the CLI reference/)
  })
})

describe('the real repo', () => {
  test('every documented command matches the pinned reference', async () => {
    const { stdout } = await run('node', [SCRIPT, '--ref', REFERENCE], { cwd: ROOT })
    assert.match(stdout, /drift: PASS/)
  })
})
