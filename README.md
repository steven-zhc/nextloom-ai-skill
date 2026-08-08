# Nextloom AI Skills

Skills for using [Nextloom AI](https://nextloom.ai) — your AI-powered job search assistant — directly inside Claude Code and Codex.

## What is Nextloom AI?

Nextloom AI helps you manage the entire job application lifecycle:

- **Track** applications across companies
- **Tailor** resumes and cover letters per role (AI-powered)
- **Generate** follow-up emails, thank-you notes, and interview prep
- **Autofill** on 17+ ATS platforms (Greenhouse, Lever, Workday, etc.)

The CLI (`nai`) exposes all of this from the terminal. These skills teach Claude Code / Codex how to use the CLI so you can manage your job search by talking to your AI agent.

## Prerequisites

1. **Install the Nextloom CLI**:

   ```bash
   curl -fsSL https://nextloom.ai/install.sh | bash
   ```

   Or download directly from [GitHub Releases](https://github.com/nextloom-ai/nextloom-ai-cli/releases).

2. **Verify installation**:

   ```bash
   nai --version
   ```

3. **Create an account** at [nextloom.ai](https://nextloom.ai) (free tier available).

## Installation

Clone this repo and copy the skills into your project:

```bash
git clone https://github.com/steven-zhc/nextloom-ai-skill.git
```

### For Claude Code

```bash
cp -r nextloom-ai-skill/skills/* .claude/skills/
```

### For Codex

```bash
cp -r nextloom-ai-skill/skills/* .codex/skills/
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

## Usage Examples

After installing the skills, just talk to Claude Code or Codex naturally:

- **"Apply to the Staff Engineer role at Vercel"** → `nextloom-apply` skill handles auth, job parsing, and resume generation
- **"Show my active applications"** → `nextloom-track` lists and filters applications
- **"Generate a thank-you note for my Stripe interview"** → `nextloom-docs` generates the document
- **"Add React and TypeScript to my skills"** → `nextloom-profile` updates your profile

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
