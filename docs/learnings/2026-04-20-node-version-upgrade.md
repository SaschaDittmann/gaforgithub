---
date: 2026-04-20
topic: azure-functions-node-version-upgrade
---

# Azure Functions Node.js Version Upgrade

## The Problem / Context
The `func azure functionapp publish` command warned about Node.js 20 EOL (April 30, 2026). The warning message misleadingly said "Upgrade to Node.js 24" but Azure Functions actually supports **Node.js 22** as the GA LTS version.

## The Solution / Learning

### Key Facts
- Azure Functions supports **Node.js 22 (GA)**, supported until April 2027
- Node.js has even-numbered LTS releases: 18 → 20 → 22 → 24 (future)
- The `func` CLI warning about "Node 24" is inaccurate — Azure's supported version is Node 22
- Always verify against [Microsoft's official docs](https://learn.microsoft.com/en-us/azure/azure-functions/update-language-versions)

### Files to Update for a Node.js Version Bump
1. `functions/package.json` — `engines.node`
2. `azuredeploy.json` — `WEBSITE_NODE_DEFAULT_VERSION`
3. `terraform/modules/func/main.tf` — `node_version` in `application_stack` + `WEBSITE_NODE_DEFAULT_VERSION` app setting
4. `.github/workflows/master.yml` — `NODE_VERSION` env var
5. `.github/workflows/ci.yml` — `NODE_VERSION` env var
6. `debug.sh` — version check string
7. `README.md` — prerequisites section

### Pushing the Setting to Azure
For Windows Function Apps, use `WEBSITE_NODE_DEFAULT_VERSION=~22`. Push via:
```bash
func azure functionapp publish <app-name> --publish-settings-only --overwrite-settings
```

### Deployment Gotcha: Australia Region
Australia Southeast sometimes experiences gateway timeouts (504) and deployment conflicts during `func publish`. The workaround is to wait ~60 seconds and retry. The conflict error "Performing continuous deployment" can persist for several minutes.
