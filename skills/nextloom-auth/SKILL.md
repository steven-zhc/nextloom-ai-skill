---
name: nextloom-auth
description: Nextloom AI authentication — login, logout, check who's logged in. Use when the user says "log into Nextloom", "sign in to nextloom", "nextloom login", "check nextloom auth", or auth-related commands.
---

# Nextloom AI — Authentication

Manage Nextloom AI authentication via the `nai` CLI. Nextloom uses browser-based PKCE OAuth with a local loopback callback — no passwords to manage.

## Commands

### Check Authentication Status

```bash
nai auth whoami --json
```

- Exit code 0 + user info → authenticated
- Exit code 4 → not logged in

### Login

```bash
nai auth login
```

This opens your browser for OAuth authentication. The CLI starts a local server to receive the callback. After successful login, tokens are stored at `~/.config/nextloom/auth-prod.json` (0600 permissions).

**CI / headless environments**: Set `NEXTLOOM_ACCESS_TOKEN` and `NEXTLOOM_REFRESH_TOKEN` environment variables instead. Get these tokens by running `nai auth login` on a machine with a browser, then copying the tokens from `~/.config/nextloom/auth-prod.json`.

### Logout

```bash
nai auth logout
```

Removes stored tokens. You'll need to `nai auth login` again to use any other commands.

### Switch Environment

```bash
nai auth whoami --env dev    # Check dev environment
nai auth login --env dev     # Login to dev
```

Default is `prod`. Use `--env dev` for development/staging.

## Error Handling

| Error | What to do |
|-------|-----------|
| `exit code 4` | Not authenticated. Run `nai auth login`. |
| Login hangs | The browser may not have opened. Check if a Nextloom OAuth page is open. If not, kill the process and retry. |
| Port conflict | If port 8080 is in use, set `NEXTLOOM_LOOPBACK_PORT` to an alternative (e.g., `8081`). |
| Headless / SSH | Use token-based auth with `NEXTLOOM_ACCESS_TOKEN` and `NEXTLOOM_REFRESH_TOKEN`. |

## What This Skill Does NOT Do

- Does NOT create a Nextloom account — sign up at https://nextloom.ai first
- Does NOT manage API keys — Nextloom uses OAuth, not API keys
- Does NOT handle multi-account switching (each login replaces the previous session)
