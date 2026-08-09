---
name: nextloom-docs
description: Generate tailored job application documents with Nextloom AI — resumes, cover letters, follow-up emails, thank-you notes. Use when the user says "write a cover letter", "generate a resume for", "create a follow-up", "thank-you note", or any document generation request.
license: MIT
compatibility: claude-code, codex, cursor, opencode, windsurf
required_tools: terminal
---

# Nextloom AI — Document Generation

Generate documents tailored to a specific application, using its job description and the user's master resume.

Verified against CLI **v0.23.2**.

## Prerequisites

```bash
nextloom auth whoami --json
nextloom app list --json
nextloom resume view --json
```

Exit code 4 → `nextloom auth login`. You need an application id from the second. If the third shows no resume, run `nextloom resume import <file>` first — every generator reads from the master resume.

## How Generation Behaves

All four generators share the same contract:

- One positional argument: the **application id**.
- `--output <path>` chooses the destination, `--format <fmt>` the format.
- **The CLI waits, streams each step, and downloads the file before returning.** Do not poll, do not background it.
- Without `--output`, the file is saved under the same name the web app uses, so the two never diverge.

## Document Types

### Tailored Resume

```bash
nextloom generate resume app_a1b2c3 --json
nextloom generate resume app_a1b2c3 --format pdf --output ./resume.pdf
```

Rewrites the master resume against the posting: relevant experience first, skills reordered, keywords aligned for ATS.

Five steps — benchmark → tailor → ATS check → humanize → final check. Typically 30–90 seconds. When the ATS check rejects a draft the pipeline returns to tailoring, so a **retry in the output is expected behavior**, not a failure.

Default name: `<Your_Name>_Resume_<Company>.<ext>`.

**When to use**: before applying to anything.

### Cover Letter

```bash
nextloom generate cover-letter app_a1b2c3 --json
nextloom generate cover-letter app_a1b2c3 --output ./cl.pdf --format pdf
```

Three steps — match profile → write → humanize. Default name: `<Your_Name>_Cover_Letter_<Company>.<ext>`.

**When to use**: whenever the application accepts one.

### Follow-Up

```bash
nextloom generate follow-up app_a1b2c3 --json
```

Single processing step. Renders as JSON and saves as `follow-up-<app-id>.json` — the web app has no download name for these, so the CLI does not invent one.

**When to use**: one to two weeks after applying with no response.

### Thank-You Note

```bash
nextloom generate thank-you app_a1b2c3 --json
```

Single step. Saves as `thank-you-<app-id>.json`.

**When to use**: within 24 hours of an interview.

## Checking an Async Job

```bash
nextloom generate status job_x1y2z3 --json
```

**This takes a job id, not an application id.** The job id appears in the generation command's output (`Generating resume for app_a1b2c3 (job job_x1y2z3)`) and in the `job_id` field of `--json` output.

Use it only to recover — after an exit code 3, or a `--no-wait` import. Not as a polling loop.

The response reports `status`, the current pipeline step, and the `aggregate_id` of the application. Follow-ups and thank-you notes have no pipeline, so they report no step.

## Choosing the Right Application

If the user says "a cover letter for Stripe" and there are several:

```bash
nextloom app list --search stripe --json
```

Show the matches with role and status, and ask which one. Never guess.

## Pro Tips

- **Review before sending.** These are strong drafts, not finished correspondence.
- **Keep the master resume current** — `nextloom resume view --json`.
- **Regenerating replaces the existing document and uses quota.** The CLI warns; pass that warning on before you re-run.
- **Check what already exists** with `nextloom app view <id> --docs` before generating.

## Error Handling

| Symptom | What to do |
|---------|-----------|
| Exit code 4 | Run `nextloom auth login` |
| Exit code 3 | Failed or timed out. The job may still finish — check `nextloom generate status <job-id>`. |
| Exit code 2 | Wrong argument shape. Generators take exactly one application id. |
| No application id | `nextloom app list --json`, or offer to add one |
| No master resume | `nextloom resume import <file>`, or https://nextloom.ai/resume |
| Repeated retries in the pipeline | The ATS check keeps rejecting. Suggest reviewing the master resume. |

## What This Skill Does NOT Do

- Does NOT add applications — use `nextloom-apply` or `nextloom app add`
- Does NOT send email — it writes the text, the user sends it
- Does NOT guarantee any ATS will pass the document
