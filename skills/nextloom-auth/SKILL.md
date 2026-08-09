---
name: nextloom-auth
description: Nextloom AI authentication — login, logout, check who's logged in. Use when the user says "log into Nextloom", "sign in to nextloom", "nextloom login", "check nextloom auth", or auth-related commands.
license: MIT
compatibility: claude-code, codex, cursor, opencode, windsurf
required_tools: terminal
---

# Nextloom AI — Authentication

Manage Nextloom AI authentication via the `nextloom` CLI. Nextloom uses browser-based PKCE OAuth with a local loopback callback — no passwords, no API keys.

Verified against CLI **v0.23.2**.

## Commands

### Check Authentication Status

```bash
nextloom auth whoami --json
```

Exit code 0 plus user info means signed in. Exit code 4 means not signed in.

The `--json` form returns the OIDC userinfo document — `user_id`, `email`, `email_verified`, `given_name`, `family_name`, `name`, `picture`.

### Login

```bash
nextloom auth login
```

Opens the browser. The CLI starts a local server on `127.0.0.1:8976` to receive the OAuth callback, then redirects the browser to a success page.

After login, tokens are written to `$XDG_CONFIG_HOME/nextloom/auth-<env>.json`, falling back to `~/.config/nextloom/auth-<env>.json`, with mode `0600`. Environment is `prod` by default, so the usual path is `~/.config/nextloom/auth-prod.json`.

### Logout

```bash
nextloom auth logout
```

Revokes the token server-side and clears the local session.

### Switch Environment

```bash
nextloom auth whoami --env dev
nextloom auth login --env dev
```

`--env` accepts `dev` or `prod` and defaults to `prod`. It is parsed before anything else and works on every command. `NEXTLOOM_ENV` does the same thing. Anything other than `dev` or `prod` exits 2.

Each environment has its own session file, so a dev login does not disturb a prod one.

## Headless & CI

There is no browser to open, so skip the OAuth flow and supply tokens directly:

```bash
export NEXTLOOM_ACCESS_TOKEN=...
export NEXTLOOM_REFRESH_TOKEN=...
nextloom auth whoami --json
```

Precedence is `NEXTLOOM_ACCESS_TOKEN` → the session file → an auth error. With the refresh token also set, the CLI refreshes in-process when the access token expires.

Get both by running `nextloom auth login` on a machine with a browser and reading them out of the session file.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXTLOOM_ENV` | `dev` or `prod`. Default `prod` |
| `NEXTLOOM_ACCESS_TOKEN` | Bearer token for CI / headless use |
| `NEXTLOOM_REFRESH_TOKEN` | Refresh token, enables in-process renewal |
| `NEXTLOOM_LOOPBACK_PORT` | Override the callback port. Must be 1–65535 |
| `NEXTLOOM_REDIRECT_URI` | Override the whole redirect URI. Default `http://127.0.0.1:8976/callback` |
| `NEXTLOOM_ISSUER` | Override the Clerk OAuth issuer |
| `NEXTLOOM_CLIENT_ID` | Override the public PKCE client id |
| `NEXTLOOM_SCOPES` | Override requested scopes. Default `profile email` |
| `NEXTLOOM_API_BASE_URL` | Override the API host |
| `NEXTLOOM_WEB_BASE_URL` | Override the web app host |

`NEXTLOOM_` is the only supported prefix. The binary is installed as both `nextloom` and `nai`, but the settings are not aliased — there is exactly one name per setting.

The OAuth client id is public by design: it is baked into the shipped binary and visible in the browser URL. PKCE, not a secret, is what proves the client. Do not treat it as a credential.

## Error Handling

| Symptom | What to do |
|---------|-----------|
| Exit code 4 | Not authenticated, or the stored session could not be refreshed. Run `nextloom auth login`. |
| Login hangs | The browser may not have opened. Check for a Clerk sign-in page. If none, interrupt and retry. |
| Port conflict on 8976 | Set `NEXTLOOM_LOOPBACK_PORT` to a free port. The OAuth app must allow the matching redirect URI, so prefer freeing 8976. |
| Headless / SSH / CI | Use `NEXTLOOM_ACCESS_TOKEN` + `NEXTLOOM_REFRESH_TOKEN`. |
| "client id is not configured" | A `NEXTLOOM_CLIENT_ID` override is empty or a placeholder. Unset it to use the built-in value. |
| `unknown environment "..."` | `--env` takes only `dev` or `prod`. |

## What This Skill Does NOT Do

- Does NOT create a Nextloom account — sign up at https://nextloom.ai first
- Does NOT manage API keys — Nextloom uses OAuth, not API keys
- Does NOT handle multi-account switching within one environment — a new login replaces the previous session
