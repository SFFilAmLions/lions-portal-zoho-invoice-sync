# Lions Portal – Zoho Invoice Customer Editor

A fully client-side React SPA (hosted on GitHub Pages) that authenticates with Zoho Invoice via OAuth 2.0 PKCE and lets you view and bulk-edit customer records in an editable table.

---

## Zoho OAuth client setup

Go to <https://api-console.zoho.com> → **Add Client** → **Client-based Applications** and fill in the fields as follows:

| Field                        | Value                                                            |
| ---------------------------- | ---------------------------------------------------------------- |
| **Client Name**              | `lions-portal-zoho-invoice-sync` (or any name you like)          |
| **Homepage URL**             | `https://sffilamlions.github.io/lions-portal-zoho-invoice-sync/` |
| **Authorized Redirect URIs** | `https://sffilamlions.github.io/lions-portal-zoho-invoice-sync/` |
| **JavaScript Domain**        | `https://sffilamlions.github.io`                                 |

**Field notes:**

- **Homepage URL** — The root URL of the app. Zoho displays this on the OAuth consent screen. No functional effect beyond that.
- **Authorized Redirect URIs** — Where Zoho sends the user after they approve access. Must be an **exact match** (including the trailing slash) to the `VITE_ZOHO_REDIRECT_URI` env var. Add `http://localhost:5173/` as a second entry for local development.
- **JavaScript Domain** — The origin that is allowed to make OAuth requests. Use just the origin (scheme + host, no path, no trailing slash).

After saving, copy the **Client ID** from the console. There is no client secret for this app type — PKCE takes its place.

For local dev, add a second Authorized Redirect URI: `http://localhost:5173/`

---

## GitHub repository secrets

Add these secrets under **Settings → Secrets and variables → Actions**:

| Secret                   | Value                                                            |
| ------------------------ | ---------------------------------------------------------------- |
| `VITE_ZOHO_CLIENT_ID`    | Client ID from Zoho API Console                                  |
| `VITE_ZOHO_REDIRECT_URI` | `https://sffilamlions.github.io/lions-portal-zoho-invoice-sync/` |

---

## Local development

This project uses [mise](https://mise.jdx.dev) for tool versioning (Node 22) and `direnv` for automatic environment activation.

```bash
mise install        # install Node 22 (first time only)
direnv allow        # auto-activates mise tools when you cd into this directory
npm install
cp .env.example .env
# fill in VITE_ZOHO_CLIENT_ID and VITE_ZOHO_REDIRECT_URI=http://localhost:5173/
npm run dev
```

Or without direnv:

```bash
mise exec -- npm install
mise exec -- npm run dev
```

---

## Deployment

Pushes to `main` trigger the GitHub Actions workflow which builds and deploys to the `gh-pages` branch automatically.

Manual deploy (requires `gh-pages` branch write access):

```bash
npm run deploy
```

---

## Stack

- **React 18 + Vite** — SPA framework
- **TanStack Table v8** — headless editable table
- **TanStack Query v5** — data fetching + cache invalidation
- **React Router v6 (HashRouter)** — client-side routing compatible with GitHub Pages
- **mise + direnv** — reproducible dev environment (Node 22)
