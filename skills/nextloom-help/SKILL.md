---
name: nextloom-help
description: Discover and look up Nextloom AI CLI commands at runtime. Use when the user asks "what can nextloom do", "nextloom help", "what commands", or when a request doesn't match any specific nextloom skill and you need to find the right CLI command.
license: MIT
compatibility: claude-code, codex, cursor, opencode, windsurf
required_tools: terminal
---

# Nextloom AI — CLI Discovery & Help

How to explore the `nextloom` CLI at runtime. **Use this before inventing a command.** The installed binary is the authority — the other skills describe v0.24.0, and the user may have something else.

## When to Load This Skill

- The user asks what nextloom can do
- The request doesn't match an explicit instruction in another nextloom skill
- You suspect a command exists but don't know its flags
- A command failed with exit code 2 (usage error) and you need the real shape

## Step 0 — Know What Version You're Talking To

```bash
nextloom --version
```

The other skills are written against **v0.24.0**. On an older or newer build, verify anything surprising with `--help` before relying on it.

## Step 1 — The Command Tree

```bash
nextloom --help
```

Top-level groups: `auth`, `profile`, `app`, `resume`, `generate`, `completion`.

## Step 2 — Drill Into a Group

```bash
nextloom auth --help
nextloom profile --help
nextloom app --help
nextloom resume --help
nextloom doc --help
```

## Step 3 — A Specific Subcommand

```bash
nextloom app add --help
nextloom doc generate resume --help
nextloom profile edit --help
```

This is the reliable way to get exact argument and flag shapes — including flags no skill documents.

## Step 4 — The Machine-Readable Reference

The CLI's full command tree is published, generated from the same source as `--help`:

```bash
curl -fsSL https://nextloom.ai/cli-reference.json
curl -fsSL https://nextloom.ai/cli-reference.md
```

`cli-reference.json` gives `version`, `bin`, `globalFlags`, `exitCodes`, `install`, and `sections[].commands[]` with `args`, `flags`, and worked `examples` per command. `cli-reference.md` is the same content as prose.

Prefer this when you need the whole surface at once, or want examples. Prefer `--help` when you need to know what *this user's* binary does — the endpoint tracks the latest release, which may be ahead of what they have installed.

The human-readable page is https://nextloom.ai/cli-reference.

## Global Flags

| Flag | Purpose |
|------|---------|
| `--json` | Machine-readable output. Use it. |
| `--help` | Help for any command or group |
| `--version` | CLI version |
| `--env dev\|prod` | Environment. Default `prod`. Anything else exits 2. |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Generic or unexpected error |
| 2 | Usage error — unknown command, missing argument, bad flag |
| 3 | A job failed or timed out. It may still finish server-side — check the output instead of the job: `nextloom doc list <app-id>` for a document, `nextloom resume view` for an import. `nextloom doc status <job-id>` gives the reason, if you still have the id. |
| 4 | Not signed in, or the stored session could not be refreshed |

## Environment Variables

`NEXTLOOM_` is the only supported prefix. The binary installs as both `nextloom` and `nai`, but settings are not aliased.

| Variable | Purpose |
|----------|---------|
| `NEXTLOOM_ENV` | `dev` or `prod`. Default `prod` |
| `NEXTLOOM_DEBUG` | HTTP timing logs |
| `NEXTLOOM_TIMEOUT` | Request timeout |
| `NEXTLOOM_ACCESS_TOKEN` | Bearer token for CI / headless use |
| `NEXTLOOM_REFRESH_TOKEN` | Refresh token for in-process renewal |
| `NEXTLOOM_LOOPBACK_PORT` | OAuth callback port. Default 8976 |
| `NEXTLOOM_REDIRECT_URI` | Full redirect URI override |
| `NEXTLOOM_ISSUER` | Clerk OAuth issuer override |
| `NEXTLOOM_CLIENT_ID` | Public PKCE client id override |
| `NEXTLOOM_SCOPES` | Requested scopes. Default `profile email` |
| `NEXTLOOM_API_BASE_URL` | API host override |
| `NEXTLOOM_WEB_BASE_URL` | Web app host override |

## Shell Completion

```bash
nextloom completion shell bash
nextloom completion shell zsh
nextloom completion shell fish
```

Prints a completion script to stdout for the user to source or install.

## When Help Disagrees With a Skill

1. **Trust the CLI.** `--help` reflects the installed binary; a skill reflects v0.24.0.
2. **Use what `--help` shows**, including commands and flags no skill mentions.
3. **Tell the user** when you hit a real mismatch — it means the skills need updating.

## Error Handling

| Symptom | What to do |
|---------|-----------|
| `command not found: nextloom` | `curl -fsSL https://nextloom.ai/install.sh \| bash` |
| Exit code 4 | Run `nextloom auth login` |
| Exit code 2 | Re-read `--help` for that exact subcommand rather than guessing another flag |
| Help output paged or truncated | Pipe it: `nextloom --help 2>&1 \| cat` |

## What This Skill Does NOT Do

- Does NOT replace the workflow skills — use those for proven flows with error handling
- Does NOT guarantee a command exists — check `--help` first
