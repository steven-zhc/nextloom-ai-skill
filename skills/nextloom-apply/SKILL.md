---
name: nextloom-apply
description: Complete Nextloom AI application workflow — add a job, generate tailored resume & cover letter in one flow. Use when the user says "apply to this job", "apply for this role at X", "help me apply to", or shares a job posting URL.
license: MIT
compatibility: claude-code, codex, cursor, opencode, windsurf
required_tools: terminal
---

# Nextloom AI — Apply Workflow

End-to-end: from a job posting to tailored documents ready for submission.

Verified against CLI **v0.24.0**.

## Prerequisites

```bash
nextloom auth whoami --json
nextloom resume view --json
```

Exit code 4 on the first means the user must run `nextloom auth login` — stop there. If the second shows no resume, import one with `nextloom resume import <file>` before generating anything; tailoring works from the master resume.

## Step 1 — Capture the Job

**You supply the text. Nothing else will.** Company, title, required skills, and keywords are extracted by AI from the description text you pass in. Nextloom never fetches a job posting — no code path anywhere reads `--url`. Getting the page and turning it into readable text is your job, not the CLI's.

**One job, one `app add` call.** Get the text *before* you touch the CLI, then create and import in that single command. Never add a record and fix it afterwards — there is no follow-up command that can (`app update` takes `--status` only, and nothing re-parses a posting into an existing record), and a second `app add` does not replace the first, it creates another row. If you are not holding the description text, you are not ready to run the command.

`app add` has no positional argument — always use a flag. A bare path is not an error, it is **silently ignored**: `app add jd.txt --file other.txt` imports `other.txt` and says nothing about `jd.txt`. Never write the path twice. Which flags you use depends on what the user gave you:

| The user gives you | You do | Command |
|---|---|---|
| A job link | Scrape the page, extract the description text, pass both | `app add --file <path> --url <link>` |
| A file, email, PDF, or pasted description | Pass the text; there is usually no link, and that is fine | `app add --file <path>` |
| A link you cannot scrape | Ask them to paste the description. Do not add. | — |

### Case 1 — the user has a link

1. Fetch the page and extract the real posting text. Many boards render the description via JavaScript (Greenhouse, Lever, Workday embeds), so the raw HTML is often an empty shell — use the board's JSON/API endpoint when there is one.
2. Write the text to a file.
3. Add it, passing the original link too:

```bash
nextloom app add --file /tmp/jd.txt --url https://acme.example/jobs/42 --json
```

Pass `--url` here even though the text is what gets parsed. It is the only way the posting URL is ever stored, and no command can add it afterwards (`app update` takes `--status` only).

### Case 2 — the user has the description, no link

A JD often arrives with no URL at all — a file, an email, a PDF, text pasted into the conversation. Add it with the text alone; `--url` is optional and inventing one is worse than omitting it.

```bash
nextloom app add --file ~/Downloads/jd.txt --json
pbpaste | nextloom app add --file - --json
```

Text pasted into the conversation goes in the same way — write it to a file, or pipe it. There is no flag for inline text: a real description runs to several KB with quotes, `$`, and newlines, which the shell mangles or truncates as a command-line argument, so `--file` is the only input.

### Case 3 — a link you cannot get the text out of

**Never fall back to `--url` alone.** It is not "less accurate" — it does nothing. The create handler skips the import pipeline outright when there is no text (`if (!jobDetailText) return`), so no AI ever runs and the record stays empty forever: no company, no title, no skills, no match score. Tell the user the page could not be read and ask them to paste the description. Adding a record you know will be blank is worse than not adding one.

**`app add` never deduplicates.** The server does not check whether that URL or company already exists, so a retry is not a retry — it is a second application. This is why the text has to be in hand before the call: an add that turns out wrong cannot be undone or amended, only deleted.

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
nextloom doc generate resume app_a1b2c3 --json
```

Five steps: benchmark → tailor → ATS check → humanize → final check. **The CLI waits and streams progress — do not poll.** Typically 30–90 seconds.

A retry in the output is normal. When the ATS check rejects a draft the pipeline loops back to tailoring, which is why a run can exceed a minute.

Choose the format and destination:

```bash
nextloom doc generate resume app_a1b2c3 --format pdf --output ./resume.pdf
```

Without `--output`, the file lands under the same name the web app uses: `<Your_Name>_Resume_<Company>.<ext>`.

## Step 3 — Generate Cover Letter

```bash
nextloom doc generate cover-letter app_a1b2c3 --json
```

Three steps: match profile → write → humanize.

## Step 4 — Fill the Application Form

When you are filling a form on the company's site, **read the profile before asking the user anything.** Most of what an ATS asks is already stored — asking for it wastes their time and makes the tool look like it does not know them.

```bash
nextloom profile view --all --eeo --json
```

`--eeo` adds the self-identification answers; without it that section is absent and you will think the user never provided them. One call, then answer from it:

| The form asks | Profile path |
|---|---|
| First / last name | `personalInfo.firstName` · `personalInfo.lastName` |
| Email | `personalInfo.email` |
| Phone | `personalInfo.phoneCountryCode` + `personalInfo.phoneNumber` |
| City / state / country / postal code | `personalInfo.address.*` |
| LinkedIn | `links.linkedinUrl` |
| GitHub | `links.githubUrl` |
| Website / portfolio | `links.websiteUrl` |
| Authorized to work in the US? | `workPreferences.authorizedToWorkInUS` |
| Need visa sponsorship, now or later? | `workPreferences.requireVisaSponsorship` |
| Willing to relocate? | `workPreferences.openToRelocate` |
| Earliest start date | `workPreferences.earliestStartDate` |
| Desired salary | `workPreferences.salaryExpectationMin` + `workPreferences.salaryCurrency` |
| Remote / hybrid / onsite | `workPreferences.workMode` |

Run `nextloom profile view --path` for the full list; the paths above are the ones ATS forms actually ask for.

### What the profile cannot answer — ask

- **Have you worked here before?**
- **How did you hear about this role?**
- **Referral name**, and anything else company-specific.
- **Work eligibility in any country other than the US.** `authorizedToWorkInUS` says nothing about Canada, the UK, or the EU. Never infer one from the other — it is a legal declaration the user signs, and a wrong guess is worse than a question.

Ask for these in one batch, not one at a time.

### Voluntary self-identification

Fill this section from the profile like any other. The user supplied these answers on nextloom.ai for exactly this purpose, so asking again is friction, not diligence.

`--eeo` adds an `eeo` object to the JSON:

| The form asks | Profile path |
|---|---|
| Gender | `eeo.gender` |
| Race / ethnicity | `eeo.race` · `eeo.hispanicLatino` |
| Veteran status | `eeo.veteranStatus` |
| Disability status | `eeo.disabilityStatus` |
| Pronouns | `eeo.pronouns` |
| Sexual orientation · transgender experience | `eeo.sexualOrientation` · `eeo.transgenderExperience` |

**Use the stored value verbatim, and never derive one.** A missing answer is a real answer — the user declined that question, and these are voluntary by law. Do not infer gender from a name, veteran status from work history, or anything else from anything else. If the profile has no value and the form demands one, choose its decline option ("prefer not to say"); if it has none, leave the field blank and say so in your summary.

### Fill, then stop

Fill every field you can justify, then hand back for review. **Do not submit.** Say what you filled, what you left blank, and what you guessed at — an application is sent once, and the user is the one whose name is on it.

## Step 5 — Mark as Applied

After the user confirms they submitted:

```bash
nextloom app update app_a1b2c3 --status Applied --json
```

## Optional Documents

```bash
nextloom doc generate follow-up app_a1b2c3 --json
nextloom doc generate thank-you app_a1b2c3 --json
```

Follow-ups and thank-you notes render as JSON and save as `follow-up-<app-id>.json` / `thank-you-<app-id>.json`.

## Recovering an Interrupted Generation

If a generation exits 3 the pipeline may still be running server-side. Ask whether the document landed — no job id needed, so this still works tomorrow:

```bash
nextloom doc list app_a1b2c3
```

If it is there, the generation finished; `doc get` it rather than regenerating. Only when it is missing and you need to know *why* does the job id matter — and it exists solely in the output of the command that started it:

```bash
nextloom doc status job_x1y2z3 --json
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
| Exit code 3 | Generation failed or timed out. Check `nextloom doc list <app-id>` — it may have finished anyway. If it is missing, `nextloom doc status <job-id>` says why. |
| `Missing required flag "--file"` (exit 1) | You passed `--url` alone, a bare path, or nothing. The posting text is mandatory — scrape or ask for it, write it to a file, and re-run with `--file`. Note this is exit **1**, not the usual usage code: the parser rejects it before the command runs. |
| Exit code 2 on `app add` | The command ran and refused its input: an unreadable `--file` path, a file with no usable text, or a bad `--applied-date`. Read the message — it names the problem. |
| An **existing** record has no company or title | It was added elsewhere with a URL and no text, so no import ever ran. You cannot repair it — there is no re-import command. Fetching the text and adding it creates a *second* record, so say that plainly first, and only proceed if the user wants it; then offer to `app delete` the empty one. Never do this silently. Do not create this situation yourself: see Step 1. |
| No master resume | `nextloom resume import <file>`, or https://nextloom.ai/resume |
| Generation keeps retrying | The ATS check is rejecting drafts. Suggest reviewing the master resume. |

## What This Skill Does NOT Do

- Does NOT submit the application to the employer — it generates documents only
- Does NOT fill in application forms — use the Nextloom Chrome extension
- Does NOT create a Nextloom account — sign up first
