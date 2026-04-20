terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 4.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.resource_group_location
}

resource "azurerm_traffic_manager_profile" "traffic_manager" {
  name                   = var.prefix
  resource_group_name    = azurerm_resource_group.rg.name
  traffic_routing_method = "Performance"
  dns_config {
    relative_name = var.prefix
    ttl           = 60
  }
  monitor_config {
    protocol                     = "HTTP"
    port                         = 80
    path                         = "/"
    interval_in_seconds          = 30
    timeout_in_seconds           = 10
    tolerated_number_of_failures = 3
  }
}

module "func_eu" {
  source = "./modules/func"

  rg_name                       = azurerm_resource_group.rg.name
  func_location                 = "westeurope"
  func_storage_name             = "${lower(var.prefix)}eu"
  func_appinsights_name         = join("-", [var.prefix, "eu"])
  func_appplan_name             = join("-", [var.prefix, "eu", "appplan"])
  func_name                     = join("-", [var.prefix, "eu"])
  ga_measurement_id             = var.ga_measurement_id
  ga_api_secret                 = var.ga_api_secret
  anonymize_ip                  = var.anonymize_ip
  custom_hostname               = var.custom_hostname
  cert_password                 = var.cert_password
  traffic_manager_profile_name  = azurerm_traffic_manager_profile.traffic_manager.name
  traffic_manager_endpoint_name = join("-", [var.prefix, "eu"])
}

module "func_us" {
  source = "./modules/func"

  rg_name                       = azurerm_resource_group.rg.name
  func_location                 = "centralus"
  func_storage_name             = "${lower(var.prefix)}us"
  func_appinsights_name         = join("-", [var.prefix, "us"])
  func_appplan_name             = join("-", [var.prefix, "us", "appplan"])
  func_name                     = join("-", [var.prefix, "us"])
  ga_measurement_id             = var.ga_measurement_id
  ga_api_secret                 = var.ga_api_secret
  anonymize_ip                  = var.anonymize_ip
  custom_hostname               = var.custom_hostname
  cert_password                 = var.cert_password
  traffic_manager_profile_name  = azurerm_traffic_manager_profile.traffic_manager.name
  traffic_manager_endpoint_name = join("-", [var.prefix, "us"])
}

module "func_asia" {
  source = "./modules/func"

  rg_name                       = azurerm_resource_group.rg.name
  func_location                 = "southeastasia"
  func_storage_name             = "${lower(var.prefix)}asia"
  func_appinsights_name         = join("-", [var.prefix, "asia"])
  func_appplan_name             = join("-", [var.prefix, "asia", "appplan"])
  func_name                     = join("-", [var.prefix, "asia"])
  ga_measurement_id             = var.ga_measurement_id
  ga_api_secret                 = var.ga_api_secret
  anonymize_ip                  = var.anonymize_ip
  custom_hostname               = var.custom_hostname
  cert_password                 = var.cert_password
  traffic_manager_profile_name  = azurerm_traffic_manager_profile.traffic_manager.name
  traffic_manager_endpoint_name = join("-", [var.prefix, "asia"])
}

module "func_australia" {
  source = "./modules/func"

  rg_name                       = azurerm_resource_group.rg.name
  func_location                 = "australiasoutheast"
  func_storage_name             = "${lower(var.prefix)}australia"
  func_appinsights_name         = join("-", [var.prefix, "australia"])
  func_appplan_name             = join("-", [var.prefix, "australia", "appplan"])
  func_name                     = join("-", [var.prefix, "australia"])
  ga_measurement_id             = var.ga_measurement_id
  ga_api_secret                 = var.ga_api_secret
  anonymize_ip                  = var.anonymize_ip
  custom_hostname               = var.custom_hostname
  cert_password                 = var.cert_password
  traffic_manager_profile_name  = azurerm_traffic_manager_profile.traffic_manager.name
  traffic_manager_endpoint_name = join("-", [var.prefix, "australia"])
}
