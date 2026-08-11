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

**You supply the text. Nothing else will.** Company, title, required skills, and keywords are extracted by AI from the description text you pass in. Nextloom never fetches a job posting — no code path anywhere reads `--url`. Getting the page and turning it into readable text is your job, not the CLI's.

`app add` takes no positional argument — always use a flag.

**The standard flow when the user gives you a link:**

1. Fetch the page yourself and extract the real posting text. Many boards render the description via JavaScript (Greenhouse, Lever, Workday embeds), so the raw HTML is often an empty shell — use the board's JSON/API endpoint when there is one.
2. Write the text to a file.
3. Add it, passing the original link too:

```bash
nextloom app add --file /tmp/jd.txt --url https://acme.example/jobs/42 --json
```

Prefer `--file` over `--detail` for anything posting-sized: a real description runs to several KB with quotes, `$`, and newlines, all of which the shell will mangle or truncate as a command-line argument. Stdin works the same way:

```bash
pbpaste | nextloom app add --file - --url https://acme.example/jobs/42 --json
```

`--detail` is for short text the user pasted straight into the conversation:

```bash
nextloom app add --detail "We are hiring a Senior Engineer at Acme Corp..." --json
```

**Never add with `--url` alone.** It is not "less accurate" — it does nothing. The create handler skips the import pipeline outright when there is no text (`if (!jobDetailText) return`), so no AI ever runs and the record stays empty forever: no company, no title, no skills, no match score. If you cannot get the text, say so and ask the user to paste the description rather than creating a record you know will be blank.

Always pass `--url` alongside the text. It is the only way the posting link is ever stored, and there is no command to add it afterwards (`app update` takes `--status` only). When both are given, the text wins for extraction and the URL is kept on the record.

**`app add` never deduplicates.** Every call creates a new record; the server does not check whether that URL or company already exists. There is also no command to re-parse a posting into an existing record. So a thin record cannot be repaired — it can only be replaced, which means a second extraction and a leftover row to delete.

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
| Application created with no company or title | Added by `--url` alone, so no import ever ran. Fetch the posting text, then re-add with `--file` **and** `--url` together. Tell the user this costs a second extraction and leaves the empty record behind — offer to `app delete` it, and only with their go-ahead. Never re-add silently. |
| No master resume | `nextloom resume import <file>`, or https://nextloom.ai/resume |
| Generation keeps retrying | The ATS check is rejecting drafts. Suggest reviewing the master resume. |

## What This Skill Does NOT Do

- Does NOT submit the application to the employer — it generates documents only
- Does NOT fill in application forms — use the Nextloom Chrome extension
- Does NOT create a Nextloom account — sign up first
