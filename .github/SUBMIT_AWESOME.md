# Submitting to Awesome Claude Skills

This file contains the content needed to submit Nextloom AI Skills to [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills).

## Step 1: Fork & Clone

```bash
gh repo fork ComposioHQ/awesome-claude-skills --clone
cd awesome-claude-skills
```

## Step 2: Add Entry

Add the following under the **Productivity & Organization** section in `README.md`:

```markdown
- [nextloom-ai-skill](https://github.com/steven-zhc/nextloom-ai-skill) - AI-powered job search assistant — track applications across companies, generate tailored resumes & cover letters per role, and manage your entire application lifecycle from your AI agent. Uses the Nextloom AI CLI (`nai`). *By [@steven-zhc](https://github.com/steven-zhc)*
```

## Step 3: Commit & PR

```bash
git add README.md
git commit -m "Add nextloom-ai-skill: AI job search assistant"
git push
gh pr create --title "Add nextloom-ai-skill: AI job search assistant" --body "## Description

Adds the [nextloom-ai-skill](https://github.com/steven-zhc/nextloom-ai-skill) plugin to the Productivity & Organization section.

### What it does

Nextloom AI Skills turn your AI agent (Claude Code, Codex, Cursor) into a job search assistant. 7 skills covering the full application lifecycle:

- **nextloom**: Full workflow — auth → add job → generate tailored documents → track status
- **nextloom-auth**: OAuth authentication management
- **nextloom-apply**: End-to-end application workflow (job parsing + resume + cover letter)
- **nextloom-track**: List, filter, and update application status
- **nextloom-docs**: Generate tailored resumes, cover letters, follow-ups, thank-you notes
- **nextloom-profile**: Profile and skill management
- **nextloom-help**: CLI self-discovery at runtime

### Requirements

- [Nextloom AI CLI](https://nextloom.ai) (free tier available)
- Follows the [Agent Skills](https://agentskills.io) standard
- Compatible with Claude Code, Codex, Cursor, Windsurf, OpenCode

### Installation

```bash
npx skills add steven-zhc/nextloom-ai-skill
```

### License

MIT"
```

---

## Alternative: Submit via Skills CLI

The `skills` CLI may have its own discovery registry. After publishing, the skill should be findable via:

```bash
npx skills find nextloom
```
