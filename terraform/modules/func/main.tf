resource "azurerm_storage_account" "func_store" {
  name                     = var.func_storage_name
  resource_group_name      = var.rg_name
  location                 = var.func_location
  account_tier             = "Standard"
  account_kind             = "Storage"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"
}

resource "azurerm_app_service_plan" "func_appplan" {
  name                = var.func_appplan_name
  location            = var.func_location
  resource_group_name = var.rg_name
  kind                = "FunctionApp"

  sku {
    tier = "Dynamic"
    size = "Y1"
  }
}

resource "azurerm_application_insights" "func_appinsights" {
  name                = var.func_appinsights_name
  location            = var.func_location
  resource_group_name = var.rg_name
  application_type    = "web"
  sampling_percentage = 0
}

resource "azurerm_app_service_certificate" "func_certificate" {
  name                = "${var.func_name}-cert"
  resource_group_name = var.rg_name
  location            = var.func_location
  pfx_blob            = filebase64("certificate.pfx")
  password            = var.cert_password
}

resource "azurerm_function_app" "func_app" {
  name                       = var.func_name
  location                   = var.func_location
  resource_group_name        = var.rg_name
  app_service_plan_id        = azurerm_app_service_plan.func_appplan.id
  storage_account_name       = azurerm_storage_account.func_store.name
  storage_account_access_key = azurerm_storage_account.func_store.primary_access_key
  version                    = "~3"
  enable_builtin_logging     = false
  app_settings = {
    ANONYMIZE_IP                          = "1"
    APPINSIGHTS_INSTRUMENTATIONKEY        = azurerm_application_insights.func_appinsights.instrumentation_key
    APPLICATIONINSIGHTS_CONNECTION_STRING = azurerm_application_insights.func_appinsights.connection_string
    FUNCTIONS_WORKER_RUNTIME              = "node"
    NODE_ENV                              = "production"
    PROPERTY_ID                           = var.property_id
    WEBSITE_NODE_DEFAULT_VERSION          = "~14"
  }
}

resource "azurerm_traffic_manager_endpoint" "func_endpoint" {
  name                = var.traffic_manager_endpoint_name
  resource_group_name = var.rg_name
  profile_name        = var.traffic_manager_profile_name
  type                = "azureEndpoints"
  target_resource_id  = azurerm_function_app.func_app.id
}

resource "azurerm_app_service_custom_hostname_binding" "hostname_binding" {
  hostname            = var.custom_hostname
  app_service_name    = azurerm_function_app.func_app.name
  resource_group_name = var.rg_name
  depends_on = [
    azurerm_traffic_manager_endpoint.func_endpoint
  ]
  lifecycle {
    ignore_changes = [ssl_state, thumbprint]
  }
}

resource "azurerm_app_service_certificate_binding" "certificate_binding" {
  hostname_binding_id = azurerm_app_service_custom_hostname_binding.hostname_binding.id
  certificate_id      = azurerm_app_service_certificate.func_certificate.id
  ssl_state           = "SniEnabled"
}
