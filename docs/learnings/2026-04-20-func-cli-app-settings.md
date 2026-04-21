---
date: 2026-04-20
topic: func-cli-app-settings-deployment
---

# Using func CLI to push app settings to Azure

## The Problem / Context
Without `az` CLI installed, needed to set GA4 environment variables (`GA_MEASUREMENT_ID`, `GA_API_SECRET`) on 4 Azure Function Apps.

## The Solution / Learning
The `func` CLI supports pushing local settings to Azure via:

```bash
func azure functionapp publish <app-name> --publish-settings-only --overwrite-settings
```

This reads `local.settings.json` and pushes all values under `Values` to the Azure app settings. The `--overwrite-settings` flag (-y) overwrites any conflicting remote values.

**Workflow:**
1. `func azure functionapp fetch-app-settings <app-name>` — merges remote settings into local `local.settings.json`
2. Add/edit the values you need in `local.settings.json`
3. `func azure functionapp publish <app-name> --publish-settings-only --overwrite-settings` — pushes to Azure

**Caveat:** After pushing settings, the Function App restarts. May see transient 503 errors for ~10 seconds.
