---
name: nextloom-apply
description: Complete Nextloom AI application workflow — add a job, generate tailored resume & cover letter in one flow. Use when the user says "apply to this job", "apply for this role at X", "help me apply to", or shares a job posting URL.
license: MIT
compatibility: claude-code, codex, cursor, opencode, windsurf
required_tools: terminal
---

# Nextloom AI — Apply Workflow

End-to-end: from a job posting to tailored documents ready for submission.

Verified against CLI **v0.23.2**.

## Prerequisites

```bash
nextloom auth whoami --json
nextloom resume view --json
```

Exit code 4 on the first means the user must run `nextloom auth login` — stop there. If the second shows no resume, import one with `nextloom resume import <file>` before generating anything; tailoring works from the master resume.

## Step 1 — Capture the Job

**The job description text is what matters.** Company, title, required skills, and keywords are extracted from it by AI. `app add` takes no positional argument — always use a flag.

Best, when you have the posting text:

```bash
nextloom app add --file jd.txt --json
```

Piping from the clipboard works too:

```bash
nextloom app add --file - --json
```

Inline text:

```bash
nextloom app add --detail "We are hiring a Senior Engineer at Acme Corp..." --json
```

If the user gives you only a link:

```bash
nextloom app add --url https://acme.example/jobs/42 --json
```

**A bare `--url` does not parse the posting.** It stores the link and creates a near-empty record — no company, no title, no keywords — which produces poor tailoring downstream. When you only have a URL, fetch the posting text yourself and pass it via `--detail`, or tell the user the record will be thin and ask them to paste the description.

Passing both is fine: `--detail` wins over `--url`.

Backdating an application the user already submitted:

```bash
nextloom app add --file jd.txt --applied-date 2026-01-15 --json
```

Extraction runs before the command returns. Add `--no-wait` to return immediately and check later with `nextloom app view <id>`.

Save the returned `id`, then summarize for the user:

> **Added**: Senior Engineer at Acme Corp — `app_a1b2c3`
> **Match**: 71%
> **Skills**: TypeScript · React · PostgreSQL
>
> Generate a tailored resume and cover letter?

## Step 2 — Generate Tailored Resume

```bash
nextloom generate resume app_a1b2c3 --json
```

Five steps: benchmark → tailor → ATS check → humanize → final check. **The CLI waits and streams progress — do not poll.** Typically 30–90 seconds.

A retry in the output is normal. When the ATS check rejects a draft the pipeline loops back to tailoring, which is why a run can exceed a minute.

Choose the format and destination:

```bash
nextloom generate resume app_a1b2c3 --format pdf --output ./resume.pdf
```

Without `--output`, the file lands under the same name the web app uses: `<Your_Name>_Resume_<Company>.<ext>`.

## Step 3 — Generate Cover Letter

```bash
nextloom generate cover-letter app_a1b2c3 --json
```

Three steps: match profile → write → humanize.

## Step 4 — Mark as Applied

After the user confirms they submitted:

```bash
nextloom app update app_a1b2c3 --status Applied --json
```

## Optional Documents

```bash
nextloom generate follow-up app_a1b2c3 --json
nextloom generate thank-you app_a1b2c3 --json
```

Follow-ups and thank-you notes render as JSON and save as `follow-up-<app-id>.json` / `thank-you-<app-id>.json`.

## Recovering an Interrupted Generation

If a generation exits 3, or you used `--no-wait`, the job may still be running server-side. Check it with the **job id** from the command's output — not the application id:

```bash
nextloom generate status job_x1y2z3 --json
```

## Pro Tips

- **Better input, better output.** A full job description with requirements beats a title and company.
- **One application at a time.** Generation is per-application.
- **Fresh per company.** Don't reuse a cover letter written for one employer at another.
- **Regenerating costs quota** and replaces the existing document. The CLI warns first.

## Error Handling

| Symptom | What to do |
|---------|-----------|
| Exit code 4 | Run `nextloom auth login` |
| Exit code 3 | Generation failed or timed out. Check `nextloom generate status <job-id>`. Offer to retry. |
| Exit code 2 on `app add` | Usually a positional argument. Use `--detail`, `--file`, or `--url`. |
| Application created with no company or title | Added by `--url` alone. Re-add with the description text. |
| No master resume | `nextloom resume import <file>`, or https://nextloom.ai/resume |
| Generation keeps retrying | The ATS check is rejecting drafts. Suggest reviewing the master resume. |

## What This Skill Does NOT Do

- Does NOT submit the application to the employer — it generates documents only
- Does NOT fill in application forms — use the Nextloom Chrome extension
- Does NOT create a Nextloom account — sign up first
