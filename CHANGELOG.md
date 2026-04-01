# [1.7.0](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/compare/v1.6.0...v1.7.0) (2026-04-01)

### Features

- view contact persons for a customer (read-only) ([#28](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/28)) ([c9f8099](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/c9f8099b7a488a10959a9fa3df087907cc7901cc)), closes [#23](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/23)

# [1.6.0](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/compare/v1.5.0...v1.6.0) (2026-04-01)

### Features

- add column types with view/edit rendering and cookie-persisted overrides ([#21](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/21)) ([646036c](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/646036c6d468dee63d95c27da05cfe1e8d591f63)), closes [#9](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/9)

# [1.5.0](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/compare/v1.4.1...v1.5.0) (2026-04-01)

### Features

- split contact_name into first_name / last_name columns ([#20](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/20)) ([a5c606f](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/a5c606f29f2649c70b4c475b19941572205e8f06)), closes [#8](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/8)

## [1.4.1](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/compare/v1.4.0...v1.4.1) (2026-04-01)

### Bug Fixes

- first login no longer stuck on loading screen ([#18](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/18)) ([21127ac](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/21127ac12d16157d904ce442619eddc0dab8795d))

# [1.4.0](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/compare/v1.3.0...v1.4.0) (2026-04-01)

### Features

- add configurable page size selector to customer table ([#19](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/19)) ([89a794d](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/89a794d64c9bd3d964fd9e8ebdfe5e8310e31a3e)), closes [#17](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/17)

# [1.3.0](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/compare/v1.2.0...v1.3.0) (2026-04-01)

### Features

- add read-only view mode with edit/commit flow ([#16](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/16)) ([c6f34bb](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/c6f34bb0995c34a70d52f6d6439a44dfd6d43b56))

# [1.2.0](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/compare/v1.1.4...v1.2.0) (2026-03-31)

### Bug Fixes

- regenerate lockfile with Mantine dependencies ([#15](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/15)) ([3fdf516](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/3fdf516b80b603ce5908ef0b363972620ebd1b57))

### Features

- integrate Mantine UI framework ([#13](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/13)) ([c8e492b](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/c8e492bbcbc1be00bdce5ea98ff472600edbaf8f)), closes [#2](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/2)

## [1.1.4](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/compare/v1.1.3...v1.1.4) (2026-03-31)

### Bug Fixes

- use npx wrangler deploy so PATH includes node_modules/.bin ([0c6776c](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/0c6776c3cc89539623bf8bca7ade57ddbef0ded0))

## [1.1.3](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/compare/v1.1.2...v1.1.3) (2026-03-31)

### Bug Fixes

- pin @eslint/js to v9 to match eslint peer dependency ([6e17aa5](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/6e17aa5aabecb564092189ba477becf1d7f3c67e))
- use npm ci --legacy-peer-deps in CI to match local install ([52df21c](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/52df21c11b82a4209be9db29ae79e371b4f72d58))

## [1.1.2](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/compare/v1.1.1...v1.1.2) (2026-03-31)

### Bug Fixes

- clear hash before handleCallback to prevent stuck loading state ([2cbce16](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/2cbce16822445e352ed272a03e6da8100785ebee))

## [1.1.1](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/compare/v1.1.0...v1.1.1) (2026-03-31)

### Bug Fixes

- pass VITE_ZOHO_PROXY_URL to build; add wrangler devDep; PATH_add node_modules/.bin ([6965934](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/6965934c3fb91a17e9e0b8ec284857339d4b0744))

# [1.1.0](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/compare/v1.0.3...v1.1.0) (2026-03-31)

### Features

- add Cloudflare Worker CORS proxy for Zoho Invoice API ([#1](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/1)) ([1bce1d4](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/1bce1d46b110524aafb936ce0c301bc695bd5503))

## [1.0.3](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/compare/v1.0.2...v1.0.3) (2026-03-30)

### Bug Fixes

- use api_domain from token response for CORS-correct API calls ([e650b9d](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/e650b9d202c24456900697fe6f3f23ff83fe3552))

## [1.0.2](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/compare/v1.0.1...v1.0.2) (2026-03-30)

### Bug Fixes

- use www.zohoapis.com for CORS-enabled API access ([38a19a2](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/38a19a2a7d0db5d383a537b599966c7a8a5abcfa))

## [1.0.1](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/compare/v1.0.0...v1.0.1) (2026-03-30)

### Bug Fixes

- switch to implicit flow (response_type=token) for Zoho client-based apps ([a7b485f](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/a7b485f378c9a7970cf68ee55c8f4adeec405f7e))

# 1.0.0 (2026-03-30)

### Features

- initial Zoho Invoice customer editor SPA ([a670acf](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/a670acf7b755dcca30a9443622aca1b1fc62fb34))
