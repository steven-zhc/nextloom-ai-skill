---
name: nextloom-docs
description: Generate tailored job application documents with Nextloom AI — resumes, cover letters, follow-up emails, thank-you notes. Use when the user says "write a cover letter", "generate a resume for", "create a follow-up", "thank-you note", or any document generation request.
license: MIT
compatibility: claude-code, codex, cursor, opencode, windsurf
required_tools: terminal
---

# Nextloom AI — Document Generation

Generate AI-tailored documents for your job applications. Each document is customized to the specific role and company using the job description from your application.

## Prerequisites

1. Run `nai auth whoami --json`. If exit code 4 → `nai auth login`.
2. You need an application ID. Run `nai app list --json` to find the right one.
3. A master resume must exist (`nai resume view --json`). If empty, direct to https://nextloom.ai/resume.

## Document Types

### 1. Tailored Resume

```bash
nai generate resume <app-id> --json
```

Rewrites your master resume to match the specific job requirements. Highlights relevant experience, reorders skills to match the job description, and uses keywords from the posting for ATS optimization.

**When to use**: Before applying to any job. Even if you already have a good resume, the AI tailoring improves ATS scores significantly.

**Pipeline**: Queue → Benchmark → Tailor → ATS Check → Humanize → Final Check (30-120 seconds)

**Output**: `FirstName_LastName_Resume_CompanyName.md` (also available as `.docx`, `.pdf`)

### 2. Cover Letter

```bash
nai generate cover-letter <app-id> --json
```

Generates a role-specific cover letter that connects your experience to the company's needs. Written in a professional but warm tone.

**When to use**: When the application requires or accepts a cover letter. Even when optional, a good cover letter sets you apart.

**Output**: `FirstName_LastName_CoverLetter_CompanyName.md`

### 3. Follow-Up Email

```bash
nai generate follow-up <app-id> --json
```

A polite follow-up email for when you haven't heard back after applying. References your application date and expresses continued interest.

**When to use**: 1-2 weeks after applying with no response. Don't send sooner — it can come across as pushy.

**Output**: `FirstName_LastName_FollowUp_CompanyName.md`

### 4. Thank-You Note

```bash
nai generate thank-you <app-id> --json
```

A post-interview thank-you note that references specific topics discussed. Shows engagement and professionalism.

**When to use**: Within 24 hours after an interview. Promptness matters.

**Output**: `FirstName_LastName_ThankYou_CompanyName.md`

### Check Generation Status

```bash
nai generate status <app-id> --json
```

For long-running generations, check the current pipeline stage. Poll every 5 seconds if needed.

## Choosing the Right Application

If the user says "generate a cover letter for Stripe" but has multiple Stripe applications:

1. Run `nai app list --search "stripe" --json`
2. Show the matching applications
3. Ask which one

## Output Formats

Default is Markdown (`.md`). To get other formats, the user can open the generated file and convert it. The Nextloom web app also offers `.docx` and `.pdf` export.

## Pro Tips

- **Review before sending**: AI-generated documents are excellent starting points, but always review and personalize before submitting.
- **Update your master resume**: Better input → better output. Periodically review `nai resume view --json`.
- **Generate fresh per application**: Don't reuse a cover letter generated for Stripe when applying to Vercel. Each company deserves a tailored document.
- **ATS scores are visible**: After generating a resume, `nai app view <id> --json` shows the ATS score. Aim for 80+.

## Error Handling

| Error | What to do |
|-------|-----------|
| `exit code 4` | Not authenticated. Direct to `nai auth login`. |
| `exit code 3` | Generation failed or timed out. Check `nai generate status <app-id> --json`. May need retry. |
| No app-id | Run `nai app list --json` to find applications. Offer to help add one. |
| No resume | "You haven't uploaded a master resume yet. Go to https://nextloom.ai/resume to upload one, then I can generate tailored documents." |
| Generation loops | ATS check may be failing repeatedly. Consider reviewing/reuploading your master resume. |

## What This Skill Does NOT Do

- Does NOT add applications — use `nextloom-apply` or `nai app add`
- Does NOT send emails — it generates the text, you send it
- Does NOT guarantee ATS pass — it optimizes but can't guarantee every system
- Does NOT bypass the async pipeline — generation takes real time
