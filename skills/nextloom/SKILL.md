---
name: nextloom
description: Nextloom AI job search assistant — manage applications, generate tailored resumes & cover letters, track status. Use when the user mentions "apply to this job", "show my applications", "write a cover letter", "track applications", "update my profile", or anything job-search related.
license: MIT
compatibility: claude-code, codex, cursor, opencode, windsurf
required_tools: terminal
---

# Nextloom AI — Job Search Assistant

You have access to the `nextloom` CLI — a complete job search management tool. Use it to manage the user's application lifecycle: track jobs, generate tailored documents, and manage their profile.

**Before anything else**, check the version and the session:

```bash
nextloom --version
nextloom auth whoami --json
```

These instructions target CLI **v0.23.2**. If `--version` reports something else, ask the CLI itself before trusting the tables below — append `--help` to the specific command you're about to run, for example `nextloom app add --help` — and mention the upgrade to the user. Nothing here can know what is installed on their machine; the CLI is the authority, always.

Exit code 4 on `whoami` means not signed in. Tell the user to run `nextloom auth login` and stop — no other command will work.

## Five rules that are easy to get wrong

1. **`app add` takes no positional argument, and Nextloom never fetches a URL.** You must supply the posting text — `--file` for anything posting-sized, `--detail` only for short pasted text. A bare `--url` saves the link and runs no import at all: the record stays permanently empty. Pass `--url` *alongside* the text when there is a link — it is optional, and text with no URL is a perfectly good add.
2. **Generation commands already wait.** They stream per-step progress and download the file. Do not poll.
3. **`generate status` takes a job id** (`job_x1y2z3`), not an application id.
4. **`profile edit` uses `--field <path>=<value>`** with dotted paths. Run `nextloom profile view --path` to discover them. Never guess a path.
5. **`app delete` needs `--force`** whenever output is `--json` or stdin is not a terminal — which is always true for you.

## Core Workflow

```
Auth → Add Job → Generate Resume → Generate Cover Letter → Track Status → Follow-Up
```

### Step 1 — Add the Application

The company, title, and keywords are extracted by AI from the posting text — and only from text you provide. When the user gives you a link, fetch the page and extract the description yourself (JS-rendered boards like Greenhouse and Lever need their JSON endpoint, not the raw HTML), write it to a file, and pass the link along with it:

```bash
nextloom app add --file /tmp/jd.txt --url https://acme.example/jobs/42 --json
```

Other ways in:

```bash
nextloom app add --detail "We are hiring a Senior Engineer at Acme Corp..." --json
pbpaste | nextloom app add --file - --url https://acme.example/jobs/42 --json
```

`--file -` reads the posting from stdin. Use `--detail` only for short text pasted into the conversation — a full description belongs in a file, since the shell mangles multi-KB text containing quotes and newlines.

Adding with `--url` and no text is never right: no import runs, and the record stays empty. If the text cannot be obtained, tell the user instead of creating a blank record.

Save the returned `id`. Every later step needs it.

### Step 2 — Check Resume Readiness

```bash
nextloom resume view --json
```

The tailoring works from the user's master resume. If there isn't one, import it:

```bash
nextloom resume import ./resume.pdf
```

### Step 3 — Generate Tailored Resume

```bash
nextloom generate resume app_a1b2c3 --json
```

Runs a 5-step pipeline: benchmark → tailor → ATS check → humanize → final check. The CLI waits and reports each step. Expect 30–90 seconds. A resume may loop back to tailoring when the ATS check rejects a draft — a retry in the output is normal, not an error.

Tell the user the output path when it finishes.

### Step 4 — Generate Cover Letter

```bash
nextloom generate cover-letter app_a1b2c3 --json
```

Three steps: match profile → write → humanize.

### Step 5 — Update Status

```bash
nextloom app update app_a1b2c3 --status Applied --json
```

### Follow-Up & Thank-You

```bash
nextloom generate follow-up app_a1b2c3 --json
nextloom generate thank-you app_a1b2c3 --json
```

## Command Reference

### Authentication

```bash
nextloom auth login
nextloom auth whoami --json
nextloom auth logout
```

### Applications

```bash
nextloom app list --json
nextloom app list --status Interviewing --json
nextloom app list --search stripe --json
nextloom app list --sort applied_date --order asc --json
nextloom app add --file jd.txt --url https://acme.example/jobs/42 --json
nextloom app add --detail "<job description text>" --applied-date 2026-01-15 --json
nextloom app add --file jd.txt --no-wait --json
nextloom app view app_a1b2c3 --json
nextloom app view app_a1b2c3 --docs
nextloom app view app_a1b2c3 --full
nextloom app update app_a1b2c3 --status Offered --json
nextloom app delete app_a1b2c3 --force --json
```

**Statuses**: New, Applied, Screening, Interviewing, Offered, Declined, Accepted, Withdrawn, Archived
**`--sort` fields**: applied_date, company_name, status, interview_date, followup_date

### Document Generation

```bash
nextloom generate resume app_a1b2c3 --format pdf --output ./resume.pdf
nextloom generate cover-letter app_a1b2c3 --json
nextloom generate follow-up app_a1b2c3 --json
nextloom generate thank-you app_a1b2c3 --json
nextloom generate status job_x1y2z3 --json
```

Files default to the same name the web app uses — `<Your_Name>_Resume_<Company>.<ext>`. Pass `--output` to choose your own.

### Profile

```bash
nextloom profile view --json
nextloom profile view --path
nextloom profile view --all --eeo
nextloom profile edit --field personalInfo.timezone=America/Chicago
nextloom profile skill list --json
nextloom profile skill add TypeScript
nextloom profile skill remove Fortran
```

### Resume

```bash
nextloom resume view --json
nextloom resume export --format json --output ./resume.json
nextloom resume import ./resume.pdf
```

## Exit Codes

| Code | Meaning | What to do |
|------|---------|-----------|
| 0 | Success | — |
| 1 | Generic error | Report it to the user |
| 2 | Usage error — unknown command, missing argument, bad flag | Check `--help`; do not guess another flag |
| 3 | Generation failed or timed out | The job may still finish server-side. Check `nextloom generate status <job-id>` |
| 4 | Not signed in, or the session could not be refreshed | Tell the user to run `nextloom auth login` |

## Error Handling

| Symptom | What to do |
|---------|-----------|
| `command not found: nextloom` | `curl -fsSL https://nextloom.ai/install.sh \| bash` |
| An existing application has an empty company/title | Added elsewhere with `--url` and no text, so no import ran. It cannot be repaired — adding the text makes a *second* record. Tell the user before doing it, then offer to delete the empty one. |
| `Application not found` | Run `nextloom app list --json` for current ids |
| No master resume | `nextloom resume import <file>`, or point the user at https://nextloom.ai/resume |
| Delete refused | Add `--force` — but confirm with the user first |

## Important Rules

1. **Use `--json`** so you can parse and summarize rather than scrape.
2. **Never fabricate data.** If the CLI didn't return it, don't report it.
3. **One application at a time** for generation.
4. **Confirm before destructive actions.** `app delete` is irreversible.
5. **Keep the user informed** — say which step you're on.

## What This Skill Does NOT Do

- Does NOT create a Nextloom account — sign up at https://nextloom.ai first
- Does NOT submit applications — it generates documents, the user submits
- Does NOT fill in web forms — that's the Nextloom Chrome extension
