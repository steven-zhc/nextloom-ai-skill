---
name: nextloom
description: Nextloom AI job search assistant — manage applications, generate tailored resumes & cover letters, track status. Use when the user mentions "apply to this job", "show my applications", "write a cover letter", "track applications", "update my profile", or anything job-search related.
license: MIT
compatibility: claude-code, codex, cursor, opencode, windsurf
required_tools: terminal
---

# Nextloom AI — Job Search Assistant

You have access to the `nextloom` (Nextloom AI) CLI — a complete job search management tool. Use it to help the user manage their entire application lifecycle: track jobs, generate tailored documents, and manage their profile.

**Before anything else**: always run `nextloom auth whoami --json 2>/dev/null` to check authentication status. If the user is not logged in (exit code 4), tell them to run `nextloom auth login` and pause — you cannot proceed without auth.

## Core Workflow

The typical job search flow follows this path:

```
Auth → Add Job → Generate Resume → Generate Cover Letter → Track Status → Follow-Up
```

When the user wants to apply to a job, follow this exact sequence:

### Step 1 — Add the Application

```bash
nextloom app add "<job-url-or-description>" --json
```

This parses the job posting and creates an application. Save the returned `id` — you'll need it for all subsequent steps. If no URL is available, ask the user for the company name and role title at minimum.

### Step 2 — Check Resume Readiness

```bash
nextloom resume view --json
```

Verify the user has a master resume. If empty or minimal, tell the user to upload one via the web app at https://nextloom.ai/resume. The AI tailoring works best with a solid base resume.

### Step 3 — Generate Tailored Resume

```bash
nextloom generate resume <app-id> --json
```

This runs an async pipeline (queue → benchmark → tailor → ATS check → humanize → final check). It may take 30–60 seconds. Use `--json` and poll until complete. If ATS check rejects, the system auto-retries.

After generation, tell the user the output file path. They can open it or you can read it back to them.

### Step 4 — Generate Cover Letter

```bash
nextloom generate cover-letter <app-id> --json
```

Same async pipeline, generates a role-tailored cover letter. Present the file path when done.

### Step 5 — Update Status

```bash
nextloom app update <app-id> --status Applied --json
```

After the user confirms they've submitted, update the application status.

### Follow-Up & Thank-You (when needed)

```bash
nextloom generate follow-up <app-id> --json   # Follow-up email after no response
nextloom generate thank-you <app-id> --json   # Thank-you note after interview
```

## Command Reference

### Authentication
```bash
nextloom auth login          # Browser-based OAuth login
nextloom auth whoami --json  # Check who's logged in
nextloom auth logout         # Log out
```

### Applications
```bash
nextloom app list --json                              # All applications
nextloom app list --status Interviewing --json        # Filter by status
nextloom app list --search "stripe" --json            # Search by company
nextloom app add "<url>" --json                       # Add from job posting URL
nextloom app add "Company Name - Role Title" --json   # Add manually
nextloom app view <id> --json                         # View details
nextloom app update <id> --status Offered --json      # Update status
nextloom app delete <id>                              # Delete an application
```

**Status values**: New, Applied, Screening, Interviewing, Offered, Declined, Accepted, Withdrawn, Archived

### Document Generation
```bash
nextloom generate resume <app-id> --json         # Tailored resume
nextloom generate cover-letter <app-id> --json   # Tailored cover letter
nextloom generate follow-up <app-id> --json      # Follow-up email
nextloom generate thank-you <app-id> --json      # Thank-you note
nextloom generate status <app-id> --json         # Check generation job status
```

**Output formats**: md, json, docx, pdf (default: md)

### Profile Management
```bash
nextloom profile view --json                       # View full profile
nextloom profile edit --field <key> <value>        # Edit a field
nextloom profile skill list                        # List skills
nextloom profile skill add "React"                 # Add a skill
nextloom profile skill remove "jQuery"             # Remove a skill
```

### Resume Management
```bash
nextloom resume view --json      # View master resume
nextloom resume export --json    # Export as JSON
```

## Error Handling

| Error | What to do |
|-------|-----------|
| `exit code 4` (unauthenticated) | Tell user: "You're not logged in. Run `nextloom auth login` to authenticate." |
| `exit code 3` (generation failed) | Generation timed out or failed. Ask if they want to retry or check `nextloom generate status <id>`. |
| `Application not found` | The app-id is wrong or was deleted. Run `nextloom app list --json` to get the current list. |
| `No resume found` | User hasn't uploaded a master resume. Direct them to https://nextloom.ai/resume. |
| `--json` produces no output | Try without `--json` for human-readable output instead. |
| CLI not installed | Direct user to: `curl -fsSL https://nextloom.ai/install.sh \| bash` |

## Important Rules

1. **Always use `--json`** for structured output that you can parse and summarize for the user.
2. **Never fabricate data** — if the CLI doesn't return something, don't make it up.
3. **One app-id at a time** — generation commands work on one application. If the user wants to apply to multiple jobs, do them sequentially.
4. **Status progression** — guide the user through the natural status flow: New → Applied → Screening → Interviewing → Offered → Accepted.
5. **Respect rate limits** — the generation pipeline is async. Don't spam status checks; wait at least 5 seconds between polls.
6. **Keep the user informed** — tell them what step you're on and what's happening next.

## What This Skill Does NOT Do

- Does NOT create a Nextloom account — users must sign up at https://nextloom.ai first
- Does NOT submit applications — it generates documents, the user submits
- Does NOT schedule interviews — it tracks status, it doesn't interact with employers
- Does NOT bypass the async generation pipeline — be patient with `nextloom generate`
