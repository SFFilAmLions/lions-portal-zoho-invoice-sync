# [1.9.0](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/compare/v1.8.0...v1.9.0) (2026-04-09)

### Bug Fixes

- contact persons panel respects edit mode; expander shows count ([#36](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/36)) ([a20d5a3](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/a20d5a327f4766f8d41b05781d55afbce7a82ef4))
- remove max-width cap so table fills available screen width ([#40](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/40)) ([eb1bfd1](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/eb1bfd1c972b3f2acb49b5ab99c1fc973e4cd415)), closes [#39](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/39)
- trim org objects to id+name before storing in session cookie ([#42](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/42)) ([2c1ff1f](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/2c1ff1f6ee333cca9fb452d8ce8a7d378aff5a23)), closes [#41](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/41)

### Features

- add contact person via customer selection ([#33](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/33)) ([7bc6f16](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/7bc6f169129e37c127acc5064d5c6debf6c0eff3)), closes [#25](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/25)
- add CSV import mode with column mapping and match key ([#52](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/52)) ([822f082](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/822f0822ce0e208c0c5a6de6669b73ae9706cbdb)), closes [#47](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/47)
- add per-field and per-row revert buttons in edit mode ([#48](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/48)) ([7547629](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/7547629ef98569bd35251a84401d134dcce3e0e4)), closes [#44](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/44)
- persist auth token in cookie to survive page reloads ([#38](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/38)) ([1c7f91f](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/1c7f91faa04dae0f27ffa7bea3fd545c28923619)), closes [#37](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/37)
- show contact person count on expander before row is opened ([#49](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/49)) ([fb7d5e1](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/fb7d5e1ded9359a90e152f3a8e9d91f9efd2a67e)), closes [#46](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/46)
- stage contact person edits, adds, and deletes until Commit ([#50](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/50)) ([4b816aa](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/4b816aa7c688d06a5ebe48c97fb320839c8c1efd)), closes [#45](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/45)

# [1.8.0](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/compare/v1.7.1...v1.8.0) (2026-04-03)

### Features

- edit and delete contact persons ([#24](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/24)) ([#32](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/32)) ([48b2cf6](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/48b2cf6b65e7666cea0afc8907027acc25e71b98))

## [1.7.1](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/compare/v1.7.0...v1.7.1) (2026-04-01)

### Bug Fixes

- correct useZohoAuth import extension in useContactPersons ([#30](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/issues/30)) ([dc25c95](https://github.com/SFFilAmLions/lions-portal-zoho-invoice-sync/commit/dc25c9564e399c2450d1092e267a9137be0abd90)), closes [hi#severity](https://github.com/hi/issues/severity)

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
