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

The CLI (`nai`) exposes all of this from the terminal. These skills teach your AI agent how to use the CLI so you can manage your job search by talking to it.

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
| [`nextloom-help`](skills/nextloom-help/SKILL.md) | CLI discovery & help — find commands at runtime | "What can nai do?" / any unknown command |

## Usage Examples

After installing, just talk to your AI agent naturally:

- **"Apply to the Staff Engineer role at Vercel"** → `nextloom-apply` handles auth, job parsing, and resume generation
- **"Show my active applications"** → `nextloom-track` lists and filters applications
- **"Generate a thank-you note for my Stripe interview"** → `nextloom-docs` generates the document
- **"Add React and TypeScript to my skills"** → `nextloom-profile` updates your profile
- **"What else can nai do?"** → `nextloom-help` discovers CLI commands at runtime

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

All commands support `--json` for structured output and `--env dev|prod` for environment switching.

| Command | Description |
|---------|-------------|
| `nai auth login` | Browser-based OAuth login |
| `nai auth whoami` | Show current user |
| `nai profile view` | View your profile |
| `nai profile edit --field <key> <value>` | Edit a profile field |
| `nai profile skill add <skill>` | Add a skill |
| `nai app list` | List applications (supports --status, --search, --sort) |
| `nai app add <url>` | Add a job from URL (AI-parsed) |
| `nai app view <id>` | View application details |
| `nai app update <id> --status <status>` | Update application status |
| `nai resume view` | View your master resume |
| `nai generate resume <app-id>` | Generate a tailored resume |
| `nai generate cover-letter <app-id>` | Generate a tailored cover letter |
| `nai generate follow-up <app-id>` | Generate a follow-up email |
| `nai generate thank-you <app-id>` | Generate a thank-you note |

## License

MIT — see [LICENSE](LICENSE).
