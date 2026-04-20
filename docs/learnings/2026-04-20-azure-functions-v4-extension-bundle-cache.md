---
date: 2026-04-20
topic: Azure Functions v4 extension bundle cache
---

# Azure Functions v4 extension bundle cache issue on Windows Consumption Plan

## The Problem / Context

After upgrading Azure Functions from v3 to v4 and changing the `extensionBundle` version in `host.json` from `[1.*, 2.0.0)` to `[4.0.0, 5.0.0)`, the Azure Portal showed:

> "Error building configuration in an external startup class. Referenced bundle Microsoft.Azure.Functions.ExtensionBundle of version 1.8.1 does not meet the required minimum version of 2.6.1."

The function code worked fine (HTTP 200 responses), but the .NET host layer was complaining about the cached extension bundle version.

## The Solution / Learning

1. **Use explicit version ranges** — `[4.0.0, 5.0.0)` instead of `[4.*, 5.0.0)`. The wildcard format may not resolve correctly on Windows consumption plans.
2. **Redeploy with `--force`** — Use `func azure functionapp publish <name> --force` to push fresh code.
3. **Stop/start (not restart)** — `az functionapp stop` followed by `az functionapp start` performs a full cold restart, forcing the runtime to re-download the extension bundle. A simple `restart` may reuse cached state.
4. **The `/usr/local/bin` path** — On this Mac, `node`, `npm`, `func`, `gh`, and `az` are all under `/usr/local/bin` but not in the default shell PATH for non-interactive commands. Always `export PATH="/usr/local/bin:$PATH"` in commands.
