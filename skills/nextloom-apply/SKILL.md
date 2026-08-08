---
name: nextloom-apply
description: Complete Nextloom AI application workflow — add a job, generate tailored resume & cover letter in one flow. Use when the user says "apply to this job", "apply for this role at X", "help me apply to", or shares a job posting URL.
license: MIT
compatibility: claude-code, codex, cursor, opencode, windsurf
required_tools: terminal
---

# Nextloom AI — Apply Workflow

Complete end-to-end job application workflow. Takes the user from a job posting to polished, tailored documents ready for submission.

## Prerequisites Check

Before starting, verify:

1. **Auth**: Run `nai auth whoami --json`. If exit code 4, tell the user to run `nai auth login` first.
2. **Resume**: Run `nai resume view --json`. If no resume exists, direct the user to https://nextloom.ai/resume to upload their master resume.

## Workflow

### Step 1 — Capture the Job

If the user provides a URL:

```bash
nai app add "<job-posting-url>" --json
```

If the user provides a description (company + role):

```bash
nai app add "<Company Name> - <Role Title>" --json
```

The CLI parses the job posting with AI and extracts: company, title, required skills, qualifications, and job description. Save the returned application `id`.

Present a summary to the user before proceeding:

> **Added**: [Role Title] at [Company Name]
> **Skills required**: [extracted skills]
> **App ID**: [id]
>
> Ready to generate tailored documents?

### Step 2 — Generate Tailored Resume

```bash
nai generate resume <app-id> --json
```

This runs an async pipeline:
- **Queue** → job enters the generation queue
- **Benchmark** → scored against current market standards
- **Tailor** → resume rewritten for this specific role
- **ATS Check** → scanned for ATS compatibility
- **Humanize** → natural language polish
- **Final Check** → quality gate

The process takes 30–120 seconds. Poll the status every 5 seconds:

```bash
nai generate status <app-id> --json
```

When complete, share the output file path with the user. The file is named like `Ada_Lovelace_Resume_Acme_Corp.md`.

If the ATS check rejects (score too low), the system auto-retries once. If it fails again, tell the user the ATS score and suggest they review and manually adjust their master resume.

### Step 3 — Generate Cover Letter

```bash
nai generate cover-letter <app-id> --json
```

Same async pipeline, different output. When done, share the file path.

### Step 4 — Mark as Applied

After the user confirms they've submitted their application:

```bash
nai app update <app-id> --status Applied --json
```

### Optional: Generate Additional Documents

```bash
nai generate follow-up <app-id> --json   # If no response after 1-2 weeks
nai generate thank-you <app-id> --json   # After an interview
```

## Pro Tips

- **Multiple applications**: Process one at a time. The generation pipeline is per-application.
- **ATS score is visible**: After generation, `nai app view <id> --json` shows the ATS score in the application details.
- **Resume quality matters**: Better master resume → better tailoring results. Encourage the user to keep their master resume updated.
- **Job descriptions**: Better input (full JD with requirements) → better AI parsing → better tailored output.

## Error Handling

| Error | What to do |
|-------|-----------|
| `exit code 4` | Not authenticated. Direct to `nai auth login`. |
| `exit code 3` | Generation failed. Check `nai generate status <app-id> --json` for details. |
| App add returns empty | The URL may not be parseable. Ask the user for company and role manually. |
| Resume generation loops | ATS score may be persistently low. Suggest the user review their master resume. |
| "No resume found" | User needs to upload a master resume at https://nextloom.ai/resume. |

## What This Skill Does NOT Do

- Does NOT submit the application to the employer — it generates documents only
- Does NOT fill in application forms — use the Nextloom Chrome Extension for that
- Does NOT create a Nextloom account — users must sign up first
- Does NOT bypass the async pipeline — generation takes real time, be patient
