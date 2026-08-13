# Nextloom AI Skills

[![Install with skills CLI](https://img.shields.io/badge/skills.sh-steven--zhc/nextloom--ai--skill-blue?style=flat&logo=github)](https://skills.sh/steven-zhc/nextloom-ai-skill)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Agent Skills](https://img.shields.io/badge/standard-agentskills.io-6e56cf)](https://agentskills.io)

Skills for using [Nextloom AI](https://nextloom.ai) — your AI-powered job search assistant — directly inside Claude Code, Codex, Cursor, Windsurf, OpenCode, and any agent that supports the [Agent Skills](https://agentskills.io) standard.

## What is Nextloom AI?

Nextloom AI helps you manage the entire job application lifecycle:

- **Track** applications across companies
- **Tailor** resumes and cover letters per role (AI-powered)
- **Generate** follow-up emails, thank-you notes, and interview prep
- **Autofill** on 17+ ATS platforms (Greenhouse, Lever, Workday, etc.)

The CLI (`nextloom`, also available as `nai`) exposes all of this from the terminal. These skills teach your AI agent how to use the CLI so you can manage your job search by talking to it.

## Prerequisites

1. **Install the Nextloom CLI**:

   ```bash
   curl -fsSL https://nextloom.ai/install.sh | bash
   ```

2. **Create an account** at [nextloom.ai](https://nextloom.ai) (free tier available).

## Installation

### Option 1: `skills` CLI (recommended — 72+ agents)

The universal skill package manager. Works with Claude Code, Codex, Cursor, and more:

```bash
npx skills add steven-zhc/nextloom-ai-skill
```

Installs all skills into `./.claude/skills/nextloom-*` (project) or use `-g` for global.

### Option 2: Claude Code Plugin Marketplace

```bash
claude
```

Then inside Claude Code:

```
/plugin marketplace add steven-zhc/nextloom-ai-skill
/plugin install nextloom-ai@nextloom-ai-skill
```

### Option 3: Manual Copy

```bash
git clone https://github.com/steven-zhc/nextloom-ai-skill.git
```

Then copy to your agent's skills directory:

```bash
# Claude Code
cp -r nextloom-ai-skill/skills/* .claude/skills/

# Codex
cp -r nextloom-ai-skill/skills/* .codex/skills/

# Cursor
cp -r nextloom-ai-skill/skills/* .cursor/skills/

# OpenCode / Windsurf
cp -r nextloom-ai-skill/skills/* .opencode/skills/
```

## Available Skills

| Skill | Description | Use when... |
|-------|-------------|-------------|
| [`nextloom`](skills/nextloom/SKILL.md) | Main workflow — full job search assistant | "Help me with my job search" |
| [`nextloom-auth`](skills/nextloom-auth/SKILL.md) | Authentication management | "Log me into Nextloom" |
| [`nextloom-apply`](skills/nextloom-apply/SKILL.md) | Complete application workflow | "Apply to this job at Company" |
| [`nextloom-track`](skills/nextloom-track/SKILL.md) | Track & manage applications | "Show my applications" |
| [`nextloom-docs`](skills/nextloom-docs/SKILL.md) | Generate tailored documents | "Write a cover letter for Stripe" |
| [`nextloom-profile`](skills/nextloom-profile/SKILL.md) | Profile management | "Update my profile" |
| [`nextloom-help`](skills/nextloom-help/SKILL.md) | CLI discovery & help — find commands at runtime | "What can nextloom do?" / any unknown command |

## Usage Examples

After installing, just talk to your AI agent naturally:

- **"Apply to the Staff Engineer role at Vercel"** → `nextloom-apply` handles auth, job parsing, and resume generation
- **"Show my active applications"** → `nextloom-track` lists and filters applications
- **"Generate a thank-you note for my Stripe interview"** → `nextloom-docs` generates the document
- **"Add React and TypeScript to my skills"** → `nextloom-profile` updates your profile
- **"What else can nextloom do?"** → `nextloom-help` discovers CLI commands at runtime

## Skill Format

All skills follow the [Agent Skills](https://agentskills.io) standard (`SKILL.md` with YAML frontmatter):

```yaml
---
name: nextloom-apply
description: Complete Nextloom AI application workflow ...
license: MIT
compatibility: claude-code, codex, cursor, opencode, windsurf
required_tools: terminal
---
```

Compatible with any agent that supports the standard — Claude Code, Codex, Cursor, Windsurf, OpenCode, Gemini CLI, Copilot, and 60+ more.

## CLI Reference

Verified against CLI **v0.24.0**. Every command supports `--json` for structured output and `--env dev|prod` for environment switching.

| Command | Description |
|---------|-------------|
| `nextloom auth login` | Browser-based PKCE OAuth login |
| `nextloom auth whoami` | Show the signed-in account |
| `nextloom auth logout` | Revoke and clear the local session |
| `nextloom profile view` | View your profile (`--all`, `--eeo`, `--path`) |
| `nextloom profile edit --field <path>=<value>` | Edit profile fields by dotted path |
| `nextloom profile skill add <skill>` | Add a skill |
| `nextloom profile skill remove <skill>` | Remove a skill |
| `nextloom app list` | List applications (`--status`, `--search`, `--sort`, `--order`) |
| `nextloom app add --file <path>` | Add a job from a job-description file (`--file -` for stdin) |
| `nextloom app add --file <path> --url <url>` | Same, keeping the posting link — Nextloom never fetches it |
| `nextloom app view <id>` | View an application (`--docs`, `--full`) |
| `nextloom app update <id> --status <status>` | Update status, and `--url` / `--company` / dates |
| `nextloom app delete <id> --force` | Delete an application |
| `nextloom resume view` | View your master resume |
| `nextloom resume export --format <fmt>` | Export the resume as md or json |
| `nextloom resume import <file>` | Import a resume file |
| `nextloom doc generate resume <app-id>` | Generate a tailored resume |
| `nextloom doc generate cover-letter <app-id>` | Generate a tailored cover letter |
| `nextloom doc generate follow-up <app-id>` | Generate a follow-up email |
| `nextloom doc generate thank-you <app-id>` | Generate a thank-you note |
| `nextloom doc status <job-id>` | Check an async generation job |
| `nextloom doc list <app-id>` | Show which documents exist |
| `nextloom doc get <type> <app-id>` | Download an existing document — no regeneration, no quota |
| `nextloom completion shell <shell>` | Print a shell completion script |

The full machine-readable reference lives at [nextloom.ai/cli-reference.json](https://nextloom.ai/cli-reference.json), generated from the CLI's own command tree.

### Three things that trip agents up

1. **`app add` requires `--file`, and a bare path is ignored rather than rejected.** Nextloom never fetches a job page, so `--url` alone fails — scrape the posting yourself and pass the text, keeping `--url` for the link.
2. **`doc status` takes a job id**, not an application id.
3. **`app delete` requires `--force`** under `--json` or any non-interactive shell.

## Staying in Sync

`cli-reference.json` in this repo is a pinned snapshot of the CLI's published command tree. `scripts/check-drift.mjs` checks every command written in these skills — in fenced blocks **and** in Markdown tables — against it.

```bash
npm test                 # the guard's own tests
npm run check            # against the pin: hermetic, no network
npm run check:live       # against https://nextloom.ai/cli-reference.json
npm run sync:reference   # refresh the pin after a CLI release
```

CI runs two jobs. On every push and pull request, the **gate** checks the skills against the pin — deterministic and offline, so a nextloom.ai outage can't fail an unrelated PR. Weekly, a **live** job diffs the published reference against the pin and fails if the CLI has moved; refreshing the pin is the moment to re-read the skills.

The check is structural. It verifies command paths, flag names, and positional argument counts — not that an argument is the right *kind* of value, and not prose. Neither job can see which CLI version you have installed; that's why the skills tell your agent to run `nextloom --version` first.

## License

MIT — see [LICENSE](LICENSE).
