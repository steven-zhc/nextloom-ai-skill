---
name: nextloom-track
description: Track and manage Nextloom AI job applications — list, filter, update status, delete. Use when the user asks "show my applications", "what's my application status", "update my Stripe application", "jobs I applied to", or anything about tracking job applications.
license: MIT
compatibility: claude-code, codex, cursor, opencode, windsurf
required_tools: terminal
---

# Nextloom AI — Application Tracking

View, filter, and manage job applications through the `nextloom` CLI.

Verified against CLI **v0.24.0**.

## Prerequisites

```bash
nextloom auth whoami --json
```

Exit code 4 → the user must run `nextloom auth login`.

## List Applications

```bash
nextloom app list --json
nextloom app list --status Interviewing --json
nextloom app list --search stripe --json
nextloom app list --sort applied_date --order asc --json
```

| Flag | Values |
|------|--------|
| `--status` | New, Applied, Screening, Interviewing, Offered, Declined, Accepted, Withdrawn, Archived |
| `--search` | Company name, case-insensitive |
| `--sort` | `applied_date`, `company_name`, `status`, `interview_date`, `followup_date` |
| `--order` | `asc` or `desc`. Default `desc` |

There is no `created` or `updated` sort field — use `applied_date`.

The human-readable table gives id, status, match score, applied date, and company. The `--json` form adds the job url, follow-up and interview dates, source, and timestamps; summarize rather than dumping them:

| Company | Status | Match | Applied |
|---------|--------|-------|---------|
| Acme Corp | Applied | 71% | 2026-08-01 |
| Initech | Interviewing | 100% | 2026-07-14 |

**`app list` carries no job title.** Not in the table, not in `--json`. The title comes from the AI-parsed job detail, which the list endpoint does not return. Summarize by company — never invent or infer a role. If the user wants titles, say they need `nextloom app view <id>` per application, and ask before running it across a long list.

When `company_name` is empty (import still running, or a URL-only record) the CLI prints the posting's hostname instead.

## View One Application

```bash
nextloom app view app_a1b2c3 --json
nextloom app view app_a1b2c3 --docs
nextloom app view app_a1b2c3 --full
```

The default view shows company, job title, status, applied date, location, salary, URL, skills, and requirements — with the long description hidden. This is the only command that returns a job title (`job_detail.job_title` under `--json`), and it is absent until the background import has parsed the posting.

- `--docs` adds which documents exist (resume, cover letter, follow-up, thank-you).
- `--full` adds the complete job description.

## Update Status

```bash
nextloom app update app_a1b2c3 --status Interviewing --json
```

`--status` is required.

| Status | Meaning |
|--------|---------|
| New | Added, not yet applied |
| Applied | Application submitted |
| Screening | Recruiter screen / phone screen |
| Interviewing | In the interview process |
| Offered | Offer received |
| Declined | Rejected |
| Accepted | Offer accepted |
| Withdrawn | The user withdrew |
| Archived | Hidden from the active view |

## Delete an Application

```bash
nextloom app delete app_a1b2c3 --force --json
```

**`--force` is mandatory for you.** The command prompts for interactive confirmation, and refuses outright when output is `--json` or stdin is not a terminal — which is always the case when an agent runs it. Without `--force` you get an error, not a prompt.

Deletion is irreversible. Ask the user first, show them what will be deleted, and only then pass `--force`.

## Common Workflows

### Daily Status Check

```bash
nextloom app list --json
```

Show active applications, exclude Archived, and flag anything that needs action — "applied three weeks ago, no response; want a follow-up?"

### Interview Prep

```bash
nextloom app list --status Interviewing --json
nextloom app view app_g7h8i9 --full
```

Read the requirements and description back to the user, then offer `nextloom generate thank-you` afterwards.

### Pipeline Overview

Count by status from a single `nextloom app list --json` — don't run one call per status.

```
New 3 · Applied 12 · Screening 2 · Interviewing 4 · Offered 1 · Declined 5
```

## Error Handling

| Symptom | What to do |
|---------|-----------|
| Exit code 4 | Run `nextloom auth login` |
| Empty list | "No applications yet. Share a job posting and I'll add it." |
| Delete refused | Add `--force` — after confirming with the user |
| `Application not found` | Re-list; the id may be stale |
| Invalid status | List the nine valid values and suggest the closest |

## What This Skill Does NOT Do

- Does NOT add applications — use `nextloom-apply` or `nextloom app add`
- Does NOT generate documents — use `nextloom-docs` or `nextloom generate`
- Does NOT modify the profile — use `nextloom-profile`
