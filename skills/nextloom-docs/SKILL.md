---
name: nextloom-docs
description: Generate tailored job application documents with Nextloom AI — resumes, cover letters, follow-up emails, thank-you notes. Use when the user says "write a cover letter", "generate a resume for", "create a follow-up", "thank-you note", or any document generation request.
license: MIT
compatibility: claude-code, codex, cursor, opencode, windsurf
required_tools: terminal
---

# Nextloom AI — Document Generation

Generate documents tailored to a specific application, using its job description and the user's master resume.

Verified against CLI **v0.24.0**.

## Prerequisites

```bash
nextloom auth whoami --json
nextloom app list --json
nextloom resume view --json
```

Exit code 4 → `nextloom auth login`. You need an application id from the second. If the third shows no resume, run `nextloom resume import <file>` first — every generator reads from the master resume.

## Generating vs Downloading

Everything lives under `nextloom doc`, but the two halves cost very different things:

| Command | Cost | Effect |
|---------|------|--------|
| `doc generate <type> <app-id>` | AI quota, 30–90s | **Replaces** any existing document of that type |
| `doc get <type> <app-id>` | one request | Downloads what is already stored, unchanged |
| `doc list <app-id>` | four HEADs | Shows which documents exist |

**Check before you generate.** If the user wants a PDF of a resume they already have, that is `doc get`, not `doc generate` — the server renders every format from the stored document, so regenerating to change format throws away the existing draft and spends quota for no reason.

```bash
nextloom doc list app_a1b2c3
nextloom doc get resume app_a1b2c3 --format pdf
```

Regenerate only when the user wants *different content* — a fresh take, or after their master resume changed. Say plainly that it replaces the current draft before you do.

## How Generation Behaves

All four generators share the same contract:

- Two positional arguments: the **document type**, then the **application id**.
- `--output <path>` chooses the destination, `--format <fmt>` the format.
- **The CLI waits, streams each step, and downloads the file before returning.** Do not poll, do not background it.
- Without `--output`, the file is saved under the same name the web app uses, so the two never diverge.

## Document Types

### Tailored Resume

```bash
nextloom doc generate resume app_a1b2c3 --json
nextloom doc generate resume app_a1b2c3 --format pdf --output ./resume.pdf
```

Rewrites the master resume against the posting: relevant experience first, skills reordered, keywords aligned for ATS.

Five steps — benchmark → tailor → ATS check → humanize → final check. Typically 30–90 seconds. When the ATS check rejects a draft the pipeline returns to tailoring, so a **retry in the output is expected behavior**, not a failure.

Default name: `<Your_Name>_Resume_<Company>.<ext>`.

**When to use**: before applying to anything.

### Cover Letter

```bash
nextloom doc generate cover-letter app_a1b2c3 --json
nextloom doc generate cover-letter app_a1b2c3 --output ./cl.pdf --format pdf
```

Three steps — match profile → write → humanize. Default name: `<Your_Name>_Cover_Letter_<Company>.<ext>`.

**When to use**: whenever the application accepts one.

### Follow-Up

```bash
nextloom doc generate follow-up app_a1b2c3 --json
```

Single processing step. Renders as JSON and saves as `follow-up-<app-id>.json` — the web app has no download name for these, so the CLI does not invent one.

**When to use**: one to two weeks after applying with no response.

### Thank-You Note

```bash
nextloom doc generate thank-you app_a1b2c3 --json
```

Single step. Saves as `thank-you-<app-id>.json`.

**When to use**: within 24 hours of an interview.

## Recovering an Interrupted Generation

**Ask whether the document exists, not what the job did.** A finished pipeline's only durable output is the document, so this answers the real question and needs no job id — it works tomorrow, from any machine:

```bash
nextloom doc list app_a1b2c3
```

If the document is there, the generation finished regardless of what happened to your terminal. Download it with `doc get`; do not regenerate.

### When you still have the job id

```bash
nextloom doc status job_x1y2z3 --json
```

**This takes a job id, not an application id**, and there is no way to look one up from an application — the id appears only in the generation command's output (`Generating resume for app_a1b2c3 (job job_x1y2z3)`) and in the `job_id` field under `--json`. Once that output is gone, so is the id.

Use it for the one thing `doc list` cannot tell you: *why* a document is missing. An absent document looks the same whether the pipeline failed at the ATS check or was never started; only the job carries the step and the error.

The response reports `status`, the current pipeline step, and `aggregate_id` — which is the **generated document's** id, not the application's. Follow-ups and thank-you notes have no pipeline, so they report no step.

## Choosing the Right Application

If the user says "a cover letter for Stripe" and there are several:

```bash
nextloom app list --search stripe --json
```

Show the matches with company, status, and applied date, and ask which one. Never guess.

`app list` returns no job title, so don't offer one to disambiguate. If company and date aren't enough, run `nextloom app view <id>` on the candidates to get the title.

## Pro Tips

- **Review before sending.** These are strong drafts, not finished correspondence.
- **Keep the master resume current** — `nextloom resume view --json`.
- **Regenerating replaces the existing document and uses quota.** The CLI warns; pass that warning on before you re-run.
- **Check what already exists** with `nextloom doc list <id>` before generating — then `doc get` it instead of regenerating.

## Error Handling

| Symptom | What to do |
|---------|-----------|
| Exit code 4 | Run `nextloom auth login` |
| Exit code 3 | Failed or timed out. The job may still finish — check `nextloom doc list <app-id>`; `doc status <job-id>` gives the reason if it never lands. |
| Exit code 2 | Wrong argument shape. `doc generate` and `doc get` take the document type, then the application id. |
| No application id | `nextloom app list --json`, or offer to add one |
| No master resume | `nextloom resume import <file>`, or https://nextloom.ai/resume |
| Repeated retries in the pipeline | The ATS check keeps rejecting. Suggest reviewing the master resume. |

## What This Skill Does NOT Do

- Does NOT add applications — use `nextloom-apply` or `nextloom app add`
- Does NOT send email — it writes the text, the user sends it
- Does NOT guarantee any ATS will pass the document
