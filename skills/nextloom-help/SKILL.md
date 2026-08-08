---
name: nextloom-help
description: Discover and look up Nextloom AI CLI commands at runtime. Use when the user asks "what can nai do", "nai help", "help with nextloom", "what commands", or when a user request doesn't match any specific nextloom skill and you need to find the right CLI command.
license: MIT
compatibility: claude-code, codex, cursor, opencode, windsurf
required_tools: terminal
---

# Nextloom AI — CLI Discovery & Help

This skill teaches you how to explore the `nai` CLI at runtime. **Always use this before making up commands** — the CLI's `--help` is the single source of truth.

## When to Load This Skill

- User asks "what can I do with nai?"
- User's request doesn't match an explicit instruction in any other nextloom skill
- You suspect a command exists but don't know its exact flags
- You need to refresh your knowledge of available commands

## Discovery Workflow

### Step 1 — Get the Full Command Tree

```bash
nai --help
```

This shows ALL top-level command groups:

```
auth        Authentication (login, logout, whoami)
profile     Profile management
app         Application management
resume      Resume management
generate    Document generation
completion  Shell completions
```

### Step 2 — Drill Into a Command Group

When the user's request falls into a category, get detailed help:

```bash
nai auth --help
nai profile --help
nai app --help
nai resume --help
nai generate --help
```

Each shows subcommands and flags for that group.

### Step 3 — Get Specific Subcommand Help

For flags, options, and usage details:

```bash
nai app add --help
nai generate resume --help
nai profile edit --help
```

This reveals ALL available flags (including ones not covered in other skills) and exact argument syntax.

### Step 4 — Try `--json` Output

Almost every command supports `--json` for structured, machine-readable output. Always prefer it:

```bash
nai app list --help        # Check if --json is supported
nai app list --json        # Get structured data
```

If `--json` isn't available, parse the human-readable output.

## Global Flags

These work on every command:

| Flag | Purpose |
|------|---------|
| `--json` | Machine-readable JSON output |
| `--env dev\|prod` | Switch environment (default: prod) |
| `--help` | Show help for any command |
| `--version` | Show CLI version |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXTLOOM_ENV` | `dev` or `prod` (default: prod) |
| `NEXTLOOM_DEBUG` | `1` for HTTP timing logs |
| `NEXTLOOM_TIMEOUT` | Request timeout in seconds (default: 30) |
| `NEXTLOOM_ACCESS_TOKEN` | CI/headless auth token |
| `NEXTLOOM_REFRESH_TOKEN` | CI/headless refresh token |

## What to Do When Help's Output Is Unexpected

If `--help` output shows commands or flags not documented in the other skills:

1. **Trust the CLI** — `--help` output is always current
2. **Use the new flag/command** — it may have been added after the skills were written
3. **Test with `--json`** first to understand the output shape before presenting to the user

## Error Handling

| Error | What to do |
|-------|-----------|
| `command not found: nai` | CLI not installed. Direct user to: `curl -fsSL https://nextloom.ai/install.sh \| bash` |
| `exit code 4` | Not authenticated. Direct to `nai auth login`. |
| `--json` not supported | Fall back to human-readable output. Parse it as best you can. |
| Help output truncated | Pipe through `cat` or use `less -R` to avoid pager issues: `nai --help 2>&1 | cat` |

## What This Skill Does NOT Do

- Does NOT execute commands — it only helps you discover them
- Does NOT replace the other skills — use those for proven workflows with error handling
- Does NOT guarantee a command exists — always check `--help` first
