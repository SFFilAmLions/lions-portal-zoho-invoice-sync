# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Environment

This project uses **Nix flake + direnv** for environment management. `mise.toml` pins Node 22, and `.envrc` activates mise and adds `node_modules/.bin` to PATH.

```bash
direnv allow        # activate environment
npm install         # install dependencies
cp .env.example .env  # configure local env vars
npm run dev         # start dev server at http://localhost:5173
```

Required `.env` variables (see `.env.example`):

- `VITE_ZOHO_CLIENT_ID` — from Zoho API Console
- `VITE_ZOHO_REDIRECT_URI` — redirect URI (e.g. `http://localhost:5173/`)
- `VITE_ZOHO_REGION` — `com` | `eu` | `in` | `com.au` | `jp`
- `VITE_ZOHO_PROXY_URL` — Cloudflare Worker URL (optional, needed for API calls)

## Commands

```bash
npm run dev        # Vite dev server
npm run build      # production build → dist/
npm run preview    # preview built dist locally
npm run deploy     # deploy dist/ to gh-pages branch
npm run lint       # ESLint
npm run format     # Prettier (write)
wrangler deploy    # deploy Cloudflare Worker CORS proxy
```

There are no test commands. Commits are validated against Conventional Commits via `commitlint` (Husky hook). `lint-staged` auto-runs ESLint + Prettier on staged files at commit time.

## Architecture

**Client-only React SPA** deployed to GitHub Pages. No backend — uses a Cloudflare Worker as a CORS proxy for Zoho Invoice API. UI is built with **Mantine** (v8).

### Authentication

OAuth 2.0 **implicit flow** (`response_type=token`). Zoho redirects to `redirect_uri#access_token=TOKEN&expires_in=3600`. `OAuthCallback` reads `window.location.hash` (not `search`) and immediately clears it via `history.replaceState` before any async work to prevent re-entry. The token and org info are stored in `sessionStorage`.

### Routing

`HashRouter` is required for GitHub Pages (no server-side routing). Three routes in `App.jsx`: `/login`, `/?code=...` (OAuth callback), and `/` (main table).

### Data Layer

TanStack Query manages all Zoho API state. Key hooks: `useZohoAuth` (session + token), `useCustomers` (paginated contacts list), `useUpdateContact` (PUT mutation). Stale time is 60 seconds; mutations invalidate `['contacts']` on success.

### CORS Proxy (`worker/index.js`)

Cloudflare Worker at `/proxy/{region}/{...rest}` forwards browser requests to `www.zohoapis.com/invoice/v3` and adds CORS headers. Configured via `ALLOWED_ORIGIN` environment variable (set with `wrangler secret put`). Without this, Zoho API calls are blocked by the browser.

### Editable Table

`CustomerTable.jsx` uses TanStack Table (headless) with `EditableCell` components. Custom fields are discovered dynamically from the first contact. Zoho requires full contact objects on every PUT (no PATCH), so `buildPayload()` in `CustomerTable.jsx` always sends the complete record. A `dirtyMap` tracks unsaved cell changes; only successful saves clear entries.

## Workflow

All development should be done on a dedicated branch. Each task should result in a pull request against `main` — never commit directly to `main`.

### Branch & commit

```bash
git checkout -b <branch> main   # create branch from main
# ... implement changes ...
git add <files>
git commit -m "feat: ..."       # Conventional Commits format required
git push -u origin <branch>
```

The `commit-msg` Husky hook runs `commitlint` via `mise`. In environments where `mise` is not on `PATH`, add a shim before committing:

```bash
mkdir -p /tmp/mise-shim
printf '#!/bin/sh\nshift; shift; exec "$@"\n' > /tmp/mise-shim/mise
chmod +x /tmp/mise-shim/mise
PATH="/tmp/mise-shim:$PATH" git commit -m "..."
```

### Open a pull request

After pushing, **always open a PR** using the `mcp__github__create_pull_request` tool (the `gh` CLI is not available in this environment):

- `owner`: `sffilamlions`, `repo`: `lions-portal-zoho-invoice-sync`
- `head`: your branch, `base`: `main`
- Title follows Conventional Commits; body includes a summary and test plan
- Reference the issue number in the body (`Closes #N`)

After opening the PR:

1. Check mergeability via `mcp__github__pull_request_read`
   - If conflicting, rebase the branch onto `main` and resolve conflicts
2. Monitor CI results; if checks fail, apply a fix, push, and re-check
3. If a failure cannot be quickly fixed, warn the user and leave the PR open for manual attention

## Deployment

CI/CD via `.github/workflows/deploy.yml`:

1. `npx semantic-release` — auto-bumps version, generates changelog, creates GitHub release
2. `npm run build` with injected `VITE_*` secrets
3. Deploys `dist/` to `gh-pages` branch

Required GitHub secrets: `VITE_ZOHO_CLIENT_ID`, `VITE_ZOHO_REDIRECT_URI`, `VITE_ZOHO_PROXY_URL`.
