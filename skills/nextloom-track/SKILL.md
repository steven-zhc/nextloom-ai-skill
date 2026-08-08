---
name: nextloom-track
description: Track and manage Nextloom AI job applications — list, filter, update status, delete. Use when the user asks "show my applications", "what's my application status", "update my Stripe application", "jobs I applied to", or anything about tracking job applications.
---

# Nextloom AI — Application Tracking

View, filter, and manage your job applications through the `nai` CLI.

## Prerequisites

Run `nai auth whoami --json` first. If not authenticated (exit code 4), direct the user to `nai auth login`.

## Commands

### List Applications

```bash
# All applications
nai app list --json

# Filter by status
nai app list --status Interviewing --json
nai app list --status Applied --json

# Search by company name
nai app list --search "stripe" --json

# Sort (default: newest first)
nai app list --sort created --json
nai app list --sort updated --json
```

Present applications in a clean table:

| # | Company | Role | Status | Updated |
|---|---------|------|--------|---------|
| 1 | Stripe | Backend Engineer | Interviewing | 2 days ago |
| 2 | Vercel | Staff Engineer | Applied | 1 week ago |

### View Application Details

```bash
nai app view <app-id> --json
```

Shows full details: company, role, status, job description, skills, ATS score, and generated documents. Present the key information — don't dump the full JSON.

### Update Application Status

```bash
nai app update <app-id> --status <new-status> --json
```

Valid status values:
- **New** — just added, not yet applied
- **Applied** — application submitted
- **Screening** — recruiter screening / phone screen
- **Interviewing** — in the interview process
- **Offered** — received an offer
- **Declined** — application rejected
- **Accepted** — offer accepted 🎉
- **Withdrawn** — you withdrew
- **Archived** — hidden from active view

### Delete an Application

```bash
nai app delete <app-id>
```

Ask for confirmation before deleting. This is irreversible.

## Common Workflows

### Daily Status Check

```bash
nai app list --json
```

Show the user their active applications (exclude Archived) sorted by last update. Highlight any that need action (e.g., "Applied 2 weeks ago — time for a follow-up?").

### Interview Prep

```bash
# 1. Find the application
nai app list --status Interviewing --json

# 2. Get full details
nai app view <app-id> --json

# 3. Generate prep materials
nai generate resume <app-id> --json    # Refresh tailored resume
nai generate cover-letter <app-id> --json  # Review your pitch
```

### Pipeline Overview

Show a summary across all statuses:

```
📊 Pipeline Overview
New: 3 | Applied: 12 | Screening: 2 | Interviewing: 4 | Offered: 1 | Declined: 5
```

## Error Handling

| Error | What to do |
|-------|-----------|
| `exit code 4` | Not authenticated. Direct to `nai auth login`. |
| Empty list | "You don't have any applications yet. Want to add one? Share a job posting URL." |
| Invalid status | List the valid status values. Suggest the closest match. |

## What This Skill Does NOT Do

- Does NOT add applications — use `nextloom-apply` or `nai app add`
- Does NOT generate documents — use `nextloom-docs` or `nai generate`
- Does NOT modify profile — use `nextloom-profile` or `nai profile`
