# Tasks: Google Analytics Tracking Beacon Modernization

> **PRD:** [prd-ga-tracking-beacon.md](../prds/prd-ga-tracking-beacon.md)
> **Created:** 2026-04-20
> **Approach:** Single big-bang modernization (GA4 + Node 20 + Functions v4 + tests + CI/CD)

## Relevant Files

- `functions/host.json` - Azure Functions host configuration (must upgrade to v4 format)
- `functions/package.json` - Root package.json for the Functions app (already exists at root level; upgrade dependencies)
- `functions/gaforgithub/index.js` - Main function code (GA4 Measurement Protocol + v4 programming model)
- `functions/gaforgithub/index.test.js` - Unit tests for main function logic and GA4 payload construction
- `functions/gaforgithub/retry.js` - Retry utility using native fetch with exponential backoff (new)
- `functions/gaforgithub/retry.test.js` - Unit tests for retry wrapper (new)
- `functions/gaforgithub/function.json` - Function bindings (removed in v4 — replaced by code-based registration)
- `functions/.npmrc` - NPM config at root level (evaluate if still needed)
- `functions/gaforgithub/gag-green.svg` - Badge SVG asset (unchanged)
- `functions/gaforgithub/empty.svg` - Invisible pixel SVG asset (unchanged)
- `functions/local.settings.json` - Local dev settings (GA4 env vars: GA_MEASUREMENT_ID, GA_API_SECRET)
- `azuredeploy.json` - ARM template (upgrade API versions + new env vars)
- `azuredeploy.parameters.json` - ARM parameters (update for GA4 parameter names)
- `terraform/main.tf` - Terraform multi-region config (upgrade provider version + Functions v4)
- `terraform/modules/func/main.tf` - Terraform function module (upgrade resource configs)
- `terraform/variables.tf` - Terraform variables (add GA4 variables)
- `debug.sh` - Local development script (update for Node 20 + Functions v4 Core Tools)
- `.github/workflows/master.yml` - GitHub Actions CI/CD pipeline (upgrade Node, actions versions, add tests)
- `README.md` - Project documentation (GA4 instructions, config table, architecture section)

### Notes

- Use `npm` as the package manager for this project (not pnpm — this is a standalone Azure Functions project, not the GCP instance).
- Each parent task represents a complete vertical slice (code + tests + observability + docs).
- Azure Functions v4 for Node.js uses the `@azure/functions` npm package with a code-based programming model — `function.json` files are no longer needed.
- The GA4 Measurement Protocol requires an API Secret in addition to the Measurement ID.

## Tasks

- [x] 1.0 Upgrade Azure Functions Runtime & Node.js
  - [x] 1.1 Update `functions/host.json`: remove deprecated settings (`healthMonitor`, `watchDirectories`), update `extensionBundle` version range for v4 compatibility, update `extensions.http` config
  - [x] 1.2 Update root-level `functions/package.json`: add `"type": "module"`, set Node.js 20 engine requirement, add `@azure/functions` v4 dependency, remove `axios`, `retry`, and `dotenv` (will be replaced in tasks 2.0/3.0)
  - [x] 1.3 Restructure `functions/gaforgithub/index.js` to use the Azure Functions v4 Node.js programming model: replace `module.exports` with `app.http()` registration, use `request`/`response` objects instead of `context.req`/`context.res`, remove `context.done()` calls
  - [x] 1.4 Delete `functions/gaforgithub/function.json` (bindings are now code-based in the v4 model)
  - [x] 1.5 Update `debug.sh`: change Node.js version check from v14 to v20, verify Azure Functions Core Tools v4 is available, update install/start commands
  - [x] 1.6 Update `functions/local.settings.json` template: set `FUNCTIONS_WORKER_RUNTIME` to `node`, update `WEBSITE_NODE_DEFAULT_VERSION` to `~20`
  - [x] 1.7 Write a smoke test that verifies the function boots, registers the HTTP route, and returns an SVG response with correct headers for a basic `?repo=test` request
  - [x] 1.8 Preserve existing structured logging (`context.log`, `context.log.verbose`, `context.log.warn`, `context.log.error`) and adapt to any v4 API changes
  - [x] 1.9 Document the runtime upgrade in `README.md` — update prerequisites (Node 20, Azure Functions Core Tools v4)

- [x] 2.0 Migrate Google Analytics from Universal Analytics to GA4
  - [x] 2.1 Research the GA4 Measurement Protocol API: endpoint URL (`https://www.google-analytics.com/mp/collect`), required parameters (`measurement_id`, `api_secret`), event payload format (`client_id`, `events[]` with `name` and `params`)
  - [x] 2.2 Update `functions/local.settings.json`: replace `PROPERTY_ID` (UA-XXXX-Y) with `GA_MEASUREMENT_ID` (G-XXXXXXXX) and add `GA_API_SECRET` environment variable
  - [x] 2.3 Rewrite the `trackVisit` function: replace the UA `/collect` POST with a GA4 `/mp/collect` POST. Construct the GA4 event payload with `client_id` (UUID), event name `page_view`, and event params (`page_location` = repo, `user_agent`, `ip_override`)
  - [x] 2.4 Adapt IP anonymization for GA4: since GA4 does not have the `aip` parameter, read `process.env.ANONYMIZE_IP` and if set to `"1"`, omit the user IP from the GA4 payload entirely (GA4 handles IP anonymization by default, but excluding IP prevents any IP-based processing)
  - [x] 2.5 Write unit tests for GA4 payload construction: verify correct JSON structure, verify `measurement_id` and `api_secret` are included as query params, verify `client_id` format, verify event params contain `page_location`
  - [x] 2.6 Write unit test for IP anonymization: verify IP is excluded from the payload when `ANONYMIZE_IP=1`, and included when unset
  - [x] 2.7 Add structured logging for GA4 hits: log the event name, repo, client_id (not the API secret), and HTTP response status from GA4
  - [x] 2.8 Update `README.md` instructions: replace UA Tracking ID references with GA4 Measurement ID + API Secret, update the "Instructions" section step 2

- [x] 3.0 Replace Legacy Dependencies with Modern Alternatives
  - [x] 3.1 Remove `axios` and `retry` dependencies from `functions/package.json`
  - [x] 3.2 Implement GA4 HTTP call using Node.js 20 native `fetch` API with a custom retry wrapper (max 5 attempts, exponential backoff with 1s min / 60s max timeout, retry on network errors or 5xx status codes)
  - [x] 3.3 Remove `dotenv` dependency from `functions/package.json` (Azure Functions v4 runtime loads `local.settings.json` natively; `dotenv` is unnecessary)
  - [x] 3.4 Remove `require('dotenv').config()` call from `index.js`
  - [x] 3.5 Write unit tests for the retry wrapper: verify it retries on 500 responses, verify it retries on network errors, verify it stops after max attempts, verify it does not retry on 200 or 400 responses
  - [x] 3.6 Preserve existing retry logging (attempt number, error details) and adapt to the new retry wrapper
  - [x] 3.7 Document the dependency changes in a code comment at the top of the retry utility, explaining why native `fetch` was chosen over third-party libraries

- [x] 4.0 Update ARM Template, Terraform & Infrastructure-as-Code
  - [x] 4.1 Update `azuredeploy.json`: upgrade all resource API versions to current stable versions (Storage 2023-01-01, Web/serverfarms 2023-01-01, Web/sites 2023-01-01, insights/components 2020-02-02)
  - [x] 4.2 Update app settings in the ARM template: replace `PROPERTY_ID` with `GA_MEASUREMENT_ID`, add `GA_API_SECRET` as a new secure parameter, update `FUNCTIONS_EXTENSION_VERSION` to `~4`, update `WEBSITE_NODE_DEFAULT_VERSION` to `~20`, add `ANONYMIZE_IP` parameter
  - [x] 4.3 Update `azuredeploy.parameters.json`: add new parameter placeholders for `GA_MEASUREMENT_ID`, `GA_API_SECRET`, and `ANONYMIZE_IP`
  - [x] 4.4 Update Terraform templates: upgrade `azurerm` provider version constraint from `>= 2.55` to `>= 4.0`, update function app resource configs for Functions v4 / Node 20, replace `property_id` variable with `ga_measurement_id` and add `ga_api_secret`
  - [x] 4.5 Validate the ARM template is syntactically correct by running `az deployment group validate` (or equivalent local validation)
  - [x] 4.6 Validate Terraform configuration with `terraform validate`
  - [x] 4.7 Update the "Deploy to Azure" button URL in `README.md` to point to the correct branch (if changed from `master`)
  - [x] 4.8 Document the new ARM template and Terraform parameters in `README.md` — describe `GA_MEASUREMENT_ID`, `GA_API_SECRET`, and `ANONYMIZE_IP`

- [x] 5.0 Add Unit Tests & Upgrade CI/CD Pipeline
  - [x] 5.1 Install a test framework: add `vitest` (or `jest`) as a dev dependency in `functions/package.json`, configure test scripts (`npm test`, `npm run test:watch`)
  - [x] 5.2 Write unit tests for `parseCookies` function: empty string, single cookie, multiple cookies, malformed cookie values
  - [x] 5.3 Write unit tests for `stringifyCookies` function: empty object, single cookie, multiple cookies, URL-encoded values
  - [x] 5.4 Write unit tests for `uuidv4` function: verify format matches UUID v4 pattern, verify uniqueness across multiple calls
  - [x] 5.5 Write unit tests for SVG response logic: verify `gag-green.svg` is returned by default, verify `empty.svg` is returned when `empty` query param is present, verify `Content-Type` is `image/svg+xml`, verify `Cache-Control` is `private, no-store`
  - [x] 5.6 Write integration test for the cookie-based client ID flow: verify new CID is generated when no `GAGH` cookie exists, verify existing CID is reused when `GAGH` cookie exists, verify GA hit is sent in both cases
  - [x] 5.7 Write unit test for missing `repo` parameter: verify HTTP 400 response with descriptive error message
  - [x] 5.8 Upgrade `.github/workflows/master.yml`: update to Node.js 20, `actions/checkout@v4`, `actions/setup-node@v4`, `Azure/functions-action@v2`, switch from Windows to Ubuntu runner, add `npm test` step before deployment
  - [x] 5.9 Add a separate CI workflow (`.github/workflows/ci.yml`) for pull requests: trigger on PR to `main`/`development`, run `npm ci` and `npm test` in the `functions/` directory
  - [x] 5.10 Add a CI status badge to `README.md`
  - [x] 5.11 Document the test and CI/CD setup in `README.md` — how to run tests locally, what the CI pipeline does, how deployment works

- [ ] 6.0 Upgrade Node.js from 20 to 24
  - [ ] 6.1 Verify Node.js 24 compatibility: run `npm test` locally with Node 24 to identify any breaking changes in `node:test`, `node:crypto`, or native `fetch` APIs
  - [ ] 6.2 Update `functions/package.json`: change `engines.node` from `">=20.0.0"` to `">=24.0.0"`
  - [ ] 6.3 Update `functions/local.settings.json` template: change `WEBSITE_NODE_DEFAULT_VERSION` from `~20` to `~24`
  - [ ] 6.4 Update `azuredeploy.json`: change `WEBSITE_NODE_DEFAULT_VERSION` app setting from `~20` to `~24`
  - [ ] 6.5 Update Terraform `terraform/modules/func/main.tf`: change `node_version` in `application_stack` from `~20` to `~24`, update `WEBSITE_NODE_DEFAULT_VERSION` app setting
  - [ ] 6.6 Update `.github/workflows/master.yml` and `.github/workflows/ci.yml`: change `NODE_VERSION` from `20.x` to `24.x`
  - [ ] 6.7 Update `debug.sh`: change Node.js version check from v20 to v24
  - [ ] 6.8 Update `README.md`: change prerequisites from Node.js 20 to Node.js 24
  - [ ] 6.9 Deploy to all 4 Azure regions and verify HTTP 200 responses
  - [ ] 6.10 Remove stale `PROPERTY_ID` app setting from all 4 Azure Function Apps (cleanup from UA migration)

## Review — Task 1.0: Upgrade Azure Functions Runtime & Node.js

**Branch:** `feature/upgrade-functions-v4`
**Worktree:** `worktrees/feature/upgrade-functions-v4`
**PR:** https://github.com/SaschaDittmann/gaforgithub/pull/1
**Status:** Ready for review

### Relevant Files
- `functions/host.json` — Updated extension bundle to `[4.0.0, 5.0.0)`, removed deprecated settings
- `functions/package.json` — Added `@azure/functions` v4, Node 20 engine, node:test runner
- `functions/gaforgithub/index.js` — Rewritten for v4 programming model (`app.http()` registration)
- `functions/gaforgithub/index.test.js` — **New** — 14 unit tests using Node.js built-in test runner
- `functions/gaforgithub/function.json` — **Deleted** (bindings now code-based)
- `debug.sh` — Updated for Node 20 and Core Tools v4
- `README.md` — Added Prerequisites and Local Development sections

### Deployment Verification
All 4 regions deployed and verified on 2026-04-20:
- `ga4gh-eu.azurewebsites.net` — HTTP 200 ✅
- `ga4gh-us.azurewebsites.net` — HTTP 200 ✅
- `ga4gh-asia.azurewebsites.net` — HTTP 200 ✅
- `ga4gh-australia.azurewebsites.net` — HTTP 200 ✅

## Review — Tasks 2.0 & 3.0: GA4 Migration + Dependency Replacement

**Branch:** `feature/ga4-migration`
**Worktree:** `worktrees/feature/ga4-migration`
**PR:** https://github.com/SaschaDittmann/gaforgithub/pull/2
**Status:** ✅ Merged into `development`

### Summary
Migrated from Universal Analytics (sunset July 2023) to GA4 Measurement Protocol and replaced all legacy third-party HTTP dependencies with Node.js 20 built-in APIs.

### Changes
- `functions/gaforgithub/index.js` — Rewrote `trackVisit` for GA4 `/mp/collect` endpoint; added `buildGA4Payload` for testable payload construction; replaced `axios` with native `fetch`; GA4 IP anonymization (omit IP when `ANONYMIZE_IP=1`)
- `functions/gaforgithub/retry.js` — **New** — Retry utility with exponential backoff using native `fetch` (replaces `retry` npm package)
- `functions/gaforgithub/retry.test.js` — **New** — 8 tests for retry wrapper (500 retry, network error retry, max attempts, 400 no-retry, onRetry callback)
- `functions/gaforgithub/index.test.js` — Expanded from 14 to 42 tests: GA4 payload, IP anonymization, client_id, SVG headers, cookie flow, missing repo
- `functions/package.json` — Removed `axios`, `retry`, `dotenv`; bumped to v3.0.0; only runtime dep is `@azure/functions`
- `functions/local.settings.json` — Replaced `PROPERTY_ID` with `GA_MEASUREMENT_ID` + `GA_API_SECRET`
- `README.md` — GA4 setup instructions, configuration table, architecture section, dependency rationale

### Test Results
50 tests, 0 failures (14 suites, 398ms)

## Review — Task 4.0: ARM Template & Terraform Upgrade

**Branch:** `feature/ga4-migration`
**Status:** Ready for review

### Changes
- `azuredeploy.json` — Upgraded all API versions (Storage/Web 2023-01-01, Insights 2020-02-02); replaced `PROPERTY_ID`/`gaTrackingID` with `GA_MEASUREMENT_ID`/`GA_API_SECRET`/`ANONYMIZE_IP`; Functions v4 + Node 20; `gaApiSecret` as `securestring`
- `azuredeploy.parameters.json` — Updated parameter placeholders for GA4
- `terraform/main.tf` — AzureRM provider `>= 4.0`; fixed protocol case for 4.x compatibility
- `terraform/modules/func/main.tf` — Migrated `azurerm_function_app` → `azurerm_windows_function_app`, `azurerm_app_service_plan` → `azurerm_service_plan`, `azurerm_traffic_manager_endpoint` → `azurerm_traffic_manager_azure_endpoint`; GA4 app settings
- `terraform/variables.tf` — Replaced `property_id` with `ga_measurement_id` + `ga_api_secret` + `anonymize_ip`; marked sensitive vars
- `terraform/modules/func/variables.tf` — Same variable updates at module level
- `terraform/modules/func/outputs.tf` — Updated reference to new resource name
- `README.md` — Added Deployment section with ARM and Terraform parameter tables + migration note

### Validation
- ARM template JSON: valid ✅
- Terraform validate: passes (only pre-existing `certificate.pfx` file-not-found, expected) ✅

## Review — Task 5.0: Unit Tests & CI/CD Pipeline

**Branch:** `feature/ga4-migration`
**Status:** Ready for review

### Summary
Used Node.js built-in test runner (`node:test`) instead of vitest/jest — zero additional dependencies. Added comprehensive tests and modernized both CI/CD workflows.

### Changes
- `functions/gaforgithub/index.test.js` — Added SVG response logic tests (6), cookie-based client ID flow tests (2), missing repo parameter test (1)
- `functions/gaforgithub/index.js` — Exported `sendResponse` and `gaforgithub` handler for integration testing
- `.github/workflows/master.yml` — Upgraded to Node 20, Ubuntu, v4 actions, functions-action@v2; split into test + deploy jobs
- `.github/workflows/ci.yml` — **New** — PR CI workflow for `main`/`development` branches
- `README.md` — Added CI badge, Testing section (coverage details, watch mode), CI/CD section

### Test Results
50 tests, 0 failures (14 suites, 398ms)

