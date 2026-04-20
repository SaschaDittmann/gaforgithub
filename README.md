[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![](https://ga4gh.datainsights.cloud/api?repo=gaforgithub)](https://github.com/SaschaDittmann/gaforgithub)

# Unofficial Google Analytics tracking for GitHub projects
This is an unofficial Google Analytics for GitHub repositories tracking using [Azure Functions](https://functions.azure.com) and written in Node.js. You can use this to track pageviews in all pages that contain Markdown, like READMEs, wikis etc.

## Motivation
GitHub has a mechanism by which you can see tracking information about your repositories, you can read about it [here](https://help.github.com/articles/viewing-traffic-to-a-repository/). However, it hosts data only for the last 14 days and there is no real time information.

#### Attention
GitHub uses camo to cache and serve images ([details](https://help.github.com/articles/about-anonymized-image-urls/)), so (a) tracking may not be accurate and (b) user details are hidden (IP, referer, etc.). 

## Instructions

1. Click [here](http://www.google.com/analytics/) to visit Google Analytics and create a new **GA4 property**
2. Once your GA4 property is created, note the **Measurement ID** (format: `G-XXXXXXXXXX`). Then go to **Admin → Data Streams → [Your Stream] → Measurement Protocol API secrets** and create a new API secret
3. Click the button below to deploy the project in your Azure subscription

[![Deploy To Azure](https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/1-CONTRIBUTION-GUIDE/images/deploytoazure.svg?sanitize=true)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FSaschaDittmann%2Fgaforgithub%2Fmaster%2Fazuredeploy.json)
[![Visualize](https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/1-CONTRIBUTION-GUIDE/images/visualizebutton.svg?sanitize=true)](http://armviz.io/#/?load=https%3A%2F%2Fraw.githubusercontent.com%2FSaschaDittmann%2Fgaforgithub%2Fmaster%2Fazuredeploy.json)

4. When the deployment is completed, copy your Functions URL (should be something like `https://yourfunctionname.azurewebsites.net`)
5. Edit your README files in your repos that you want to track (or any files that contain markdown) and insert the necessary code.

First, change `YYYYYY` to your Azure Function's URL. Then, change `XXXXXXXX` to a distinctive name to use in order to track this specific page. Might be the name of your repo or whatever you like. If you want to display a button use this code:

```markdown
[![unofficial Google Analytics for GitHub](https://YYYYYY.azurewebsites.net/api?repo=XXXXXXXX)](https://github.com/dgkanatsios/gaforgithub)
```

If you do not want to display the button, use this code:

```markdown
![](https://YYYYYY.azurewebsites.net/api?repo=XXXXXXXX&empty)
```

## Configuration

| Environment Variable | Required | Description |
|---|---|---|
| `GA_MEASUREMENT_ID` | Yes | GA4 Measurement ID (format: `G-XXXXXXXXXX`) |
| `GA_API_SECRET` | Yes | GA4 Measurement Protocol API secret (generated in GA4 Admin → Data Streams → Measurement Protocol API secrets) |
| `ANONYMIZE_IP` | No | Set to `1` to exclude client IP from the GA4 payload entirely. GA4 handles IP anonymization by default, but this prevents any IP-based processing. |
| `APPINSIGHTS_INSTRUMENTATIONKEY` | No | Azure Application Insights key for function-level monitoring |
| `AzureWebJobsStorage` | Yes (Azure) | Azure Storage connection string for the Functions runtime |

## Prerequisites

- **Node.js** 20 or later
- **Azure Functions Core Tools** v4 (`npm i -g azure-functions-core-tools@4 --unsafe-perm true`)

## Local Development

```bash
# Install dependencies
cd functions/
npm install

# Run tests
npm test

# Start the function locally
npm start
# or use the debug script from the repo root:
./debug.sh
```

### Local Settings

Copy `functions/local.settings.json` and fill in your GA4 credentials:

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "",
    "GA_MEASUREMENT_ID": "G-XXXXXXXXXX",
    "GA_API_SECRET": "your-api-secret-here",
    "ANONYMIZE_IP": "1"
  }
}
```

## Architecture

This project uses the **GA4 Measurement Protocol** to send `page_view` events. When a browser or GitHub's Camo image proxy fetches the tracking beacon image:

1. The Azure Function parses the `repo` query parameter and cookie-based client ID
2. A `page_view` event is sent to the GA4 Measurement Protocol (`/mp/collect`) using Node.js native `fetch` with exponential backoff retry
3. An SVG image (badge or invisible pixel) is returned to the caller

### Dependencies

The project uses **zero third-party HTTP libraries** — Node.js 20's built-in `fetch` API replaces `axios`, and a custom retry wrapper replaces the `retry` npm package. The only runtime dependency is `@azure/functions` for the Azure Functions v4 programming model.

## Deployment

### ARM Template ("Deploy to Azure")

The ARM template (`azuredeploy.json`) provisions a single-region Function App with the following parameters:

| Parameter | Type | Description |
|---|---|---|
| `gaMeasurementID` | string | GA4 Measurement ID (format: `G-XXXXXXXXXX`) |
| `gaApiSecret` | securestring | GA4 Measurement Protocol API secret |
| `anonymizeIP` | string | `1` to exclude IP from GA4 payload (default: `1`) |
| `appName` | string | Globally unique name for the Function App |
| `hostingPlanName` | string | Name for the App Service Plan |
| `storageAccountType` | string | Storage SKU (default: `Standard_LRS`) |

### Terraform (Multi-Region)

The Terraform templates (`terraform/`) deploy across 4 Azure regions with Traffic Manager. Requires AzureRM provider >= 4.0.

| Variable | Type | Description |
|---|---|---|
| `ga_measurement_id` | string | GA4 Measurement ID (format: `G-XXXXXXXXXX`) |
| `ga_api_secret` | string (sensitive) | GA4 Measurement Protocol API secret |
| `anonymize_ip` | string | `1` to exclude IP from GA4 payload (default: `1`) |
| `prefix` | string | Resource name prefix |
| `resource_group_name` | string | Azure Resource Group name |
| `resource_group_location` | string | Azure region for the Resource Group |
| `custom_hostname` | string | Custom domain for all Function Apps |
| `cert_password` | string (sensitive) | SSL/TLS certificate password |

> **Note:** When migrating an existing Terraform deployment from AzureRM 2.x/3.x to 4.x, you must use `terraform state rm` and `terraform import` to migrate from the removed `azurerm_function_app` to `azurerm_windows_function_app`, and from `azurerm_app_service_plan` to `azurerm_service_plan`. See the [AzureRM 4.0 upgrade guide](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/guides/4.0-upgrade-guide) for details.

## Cost

The deployment uses Azure Functions' [Consumption Plan](https://docs.microsoft.com/en-us/azure/azure-functions/functions-scale#consumption-plan) so you'll see that it's really cheap to host it for your projects.

## Inspiration

This code is based on Dimitris-Ilias Gkanatsios solution [here](https://github.com/dgkanatsios/gaforgithub), which was inspired by igrorik's solution [here](https://github.com/igrigorik/ga-beacon) that works with Go language and Google App Engine.
