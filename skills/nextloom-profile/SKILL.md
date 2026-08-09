---
name: nextloom-profile
description: Manage your Nextloom AI profile — view, edit fields, manage skills, import your resume. Use when the user says "update my profile", "add a skill", "change my location", "what's in my profile", or anything about their Nextloom profile.
license: MIT
compatibility: claude-code, codex, cursor, opencode, windsurf
required_tools: terminal
---

# Nextloom AI — Profile Management

The profile is the foundation for every generated document. Better profile, better tailoring.

Verified against CLI **v0.23.2**.

## Prerequisites

```bash
nextloom auth whoami --json
```

Exit code 4 → `nextloom auth login`.

## View Profile

```bash
nextloom profile view
nextloom profile view --json
nextloom profile view --all
nextloom profile view --all --eeo
```

The default view shows personal info, work preferences, links, and metadata. Sensitive fields are hidden unless asked for:

- `--all` reveals home address, postal code, birthday, US-residency, work authorization, and target job function ids.
- `--eeo` reveals the self-identification block (pronouns, gender, race, veteran status, disability, sexual orientation).

**Only surface EEO data when the user explicitly asks for it.** Don't include it in a general profile summary.

## Edit Profile Fields

```bash
nextloom profile edit --field personalInfo.timezone=America/Chicago
```

The form is `--field <dot.path>=<value>`. One `=`, no space. The flag repeats:

```bash
nextloom profile edit --field personalInfo.address.city=Austin --field personalInfo.address.state=Texas
```

### Discover paths — never guess them

```bash
nextloom profile view --path
```

This is the whole point of `--path`: it prints each field's dotted path next to its current value, so you can see exactly what to set. **Run it before any edit.** There is no fixed list of field names to memorize, and inventing a path produces a usage error at best and a silently wrong write at worst.

Four top-level groups are writable. Everything else is server-owned:

| Group | Holds |
|-------|-------|
| `personalInfo` | Name, phone, address, timezone, birthday, residency |
| `workPreferences` | Work mode, employment types, target locations, salary, relocation, start date, work authorization, target roles |
| `links` | Website, LinkedIn, GitHub |
| `eeo` | Self-identification |

Setting a path outside these fails with a message pointing you back at `--path`.

### Values are typed

The value's type must match what is already stored at that path. A field holding a list needs JSON array syntax, quoted for the shell:

```bash
nextloom profile edit --field workPreferences.workMode='["remote","onsite"]'
```

Scalars go in plain:

```bash
nextloom profile edit --field workPreferences.salaryExpectationMin=150000
nextloom profile edit --field links.githubUrl=https://github.com/ada-example
```

Check the current shape with `--path` first — it prints raw values, so a list shows as `["remote"]` and a number as `150000`.

### Confirm the change

The command reports each change as `path: old → new`. With `--json` you get `{"ok":true,"changes":[{"path","from","to"}]}`. Read it back to the user rather than assuming the write landed.

## Manage Skills

```bash
nextloom profile skill list
nextloom profile skill list --json
nextloom profile skill add TypeScript
nextloom profile skill remove Fortran
```

`skill list` groups by category (Cloud, Databases, DevOps, Languages, ML, Other). The `--json` form gives `category` and `display_name` per entry.

Adding matches against a skill dictionary and normalizes the name — `typescript` comes back as `TypeScript`. Use the ordinary name and let the CLI canonicalize:

- Good: `React`, `TypeScript`, `Kubernetes`
- Avoid: `react.js`, `TS`, `k8s`

Removing a skill that isn't on the profile is reported, not an error.

## Master Resume

```bash
nextloom resume view --json
nextloom resume export --format md
nextloom resume export --format json --output ./resume.json
nextloom resume import ./resume.pdf
```

`resume export` writes to stdout unless `--output` is given. Format defaults to `md`.

`resume import` uploads and parses the file, waiting for processing to finish. Add `--no-wait` to queue it and return immediately.

## Common Workflows

### New User Setup

```bash
nextloom profile view --path
nextloom resume import ./resume.pdf
nextloom profile skill add TypeScript
```

Read the paths first, import the resume — which populates much of the profile — then fill gaps and add skills.

### Pre-Application Check

```bash
nextloom profile skill list
nextloom profile view
nextloom resume view --json
```

Confirm the relevant skills are listed, the work preferences are current, and the master resume is up to date.

### Career Pivot

Update target roles and work preferences via `--path`-discovered fields, add skills for the new direction, remove stale ones, and re-import a reframed resume.

## Error Handling

| Symptom | What to do |
|---------|-----------|
| Exit code 4 | Run `nextloom auth login` |
| `"X" is not a writable field group` | Only `personalInfo`, `workPreferences`, `links`, `eeo` are writable. Run `nextloom profile view --path`. |
| `illegal field path segment` | Malformed dotted path. Re-check against `--path`. |
| Type mismatch on edit | The stored value is a list or number. Match its shape — `'["remote"]'`, `150000`. |
| Exit code 2 on edit | Probably a space instead of `=`. The form is `--field path=value`. |
| Resume import fails | Check the file format and that the path exists |

## What This Skill Does NOT Do

- Does NOT create a Nextloom account — sign up at https://nextloom.ai
- Does NOT edit server-owned fields — profile id, timestamps, and match scores are read-only
- Does NOT expose EEO data unless the user asks for it
