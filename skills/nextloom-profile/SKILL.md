---
name: nextloom-profile
description: Manage your Nextloom AI profile — view, edit fields, manage skills. Use when the user says "update my profile", "add a skill", "change my title", "what's in my profile", or anything about their Nextloom profile.
license: MIT
compatibility: claude-code, codex, cursor, opencode, windsurf
required_tools: terminal
---

# Nextloom AI — Profile Management

Manage your Nextloom professional profile through the `nai` CLI. Your profile is the foundation for all AI tailoring — the better your profile, the better your generated documents.

## Prerequisites

Run `nai auth whoami --json`. If exit code 4 → `nai auth login`.

## Commands

### View Profile

```bash
nai profile view --json
```

Shows your complete profile: personal info, work preferences, skills, target roles, target locations, salary expectations, and EEO information.

Present key sections in a clean format:

```
👤 Personal: [Name] | [Email] | [Phone]
💼 Current: [Title] at [Company]
📍 Location: [City, State]
🎯 Target: [Role] | $[min]–$[max] | [Remote/Onsite/Hybrid]
🛠 Skills: [list of skills by category]
```

### Edit Profile Fields

```bash
nai profile edit --field <field> <value>
```

Common fields to edit:

| Field | Example | Description |
|-------|---------|-------------|
| `name` | `"Ada Lovelace"` | Full name |
| `email` | `"ada@example.com"` | Contact email |
| `phone` | `"+1-555-0123"` | Phone number |
| `title` | `"Senior Software Engineer"` | Current job title |
| `company` | `"Acme Corp"` | Current company |
| `location` | `"San Francisco, CA"` | Your location |
| `target_role` | `"Staff Engineer"` | Role you're seeking |
| `target_location` | `"Remote"` | Preferred work location |
| `salary_min` | `"150000"` | Minimum salary |
| `salary_max` | `"220000"` | Maximum salary |
| `bio` | `"Full-stack engineer..."` | Professional summary |
| `linkedin` | `"https://linkedin.com/in/..."` | LinkedIn URL |
| `github` | `"https://github.com/..."` | GitHub URL |
| `website` | `"https://ada.dev"` | Personal website |

Changes take effect immediately for all future document generations.

### Manage Skills

```bash
# List all skills (organized by category)
nai profile skill list

# Add a skill
nai profile skill add "React"

# Remove a skill
nai profile skill remove "jQuery"
```

Skills are organized in a taxonomy. When adding, be specific and use standard names:
- ✅ "React", "TypeScript", "Kubernetes"
- ❌ "react.js", "TS", "k8s"

After adding/removing skills, the next generated resume will reflect the changes.

### Resume Management

```bash
# View your master resume
nai resume view --json

# Export as JSON
nai resume export --json
```

To update your master resume (the foundation for all AI tailoring), go to https://nextloom.ai/resume and upload a new one. The CLI supports import too:

```bash
nai resume import <file.docx|file.pdf|file.md|file.txt>
```

## Common Workflows

### New User Setup

1. `nai profile view --json` — see what's already filled
2. `nai profile edit --field name "<name>"` 
3. `nai profile edit --field title "<current title>"`
4. `nai profile skill add "<skill>"` — add key skills
5. `nai resume import <resume-file>` — upload resume

### Pre-Application Checklist

Before applying:
1. `nai profile skill list` — make sure relevant skills are listed
2. `nai profile view --json` — verify title, target role, and salary range
3. `nai resume view --json` — confirm resume is current

### Career Pivot

When changing roles/industries:
1. Update `target_role` to the new role
2. Add relevant skills for the new direction
3. Remove outdated skills
4. Upload a reframed resume that emphasizes transferable skills

## Error Handling

| Error | What to do |
|-------|-----------|
| `exit code 4` | Not authenticated. Direct to `nai auth login`. |
| Field not found | List the available fields from the table above. |
| Skill already exists | "This skill is already in your profile." |
| Resume import fails | Check file format — supports .txt, .md, .docx, .pdf. |

## What This Skill Does NOT Do

- Does NOT create a Nextloom account — sign up at https://nextloom.ai
- Does NOT upload the actual resume file for parsing — use `nai resume import` or the web app
- Does NOT guarantee interview calls — your profile helps, but it's not magic
