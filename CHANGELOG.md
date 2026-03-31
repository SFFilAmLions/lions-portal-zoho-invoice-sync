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
