variable "rg_name" {
  type        = string
  description = "Name of the Azure Resource Group"
}

variable "func_location" {
  type        = string
  description = "Region of the Azure Function resources"
}

variable "func_storage_name" {
  type        = string
  description = "Name of the Storage Account used for Azure Functions"
}

variable "func_appinsights_name" {
  type        = string
  description = "Name of the Application Insights used for Azure Functions"
}

variable "func_appplan_name" {
  type        = string
  description = "Name of the App Service Plan used for Azure Functions"
}

variable "func_name" {
  type        = string
  description = "Name of the Azure Functions App"
}

variable "property_id" {
  type        = string
  description = "Google Analytics Property ID"
}

variable "custom_hostname" {
  type        = string
  description = "Custom Hostname for the Azure Functions App"
}

variable "cert_password" {
  type        = string
  description = "Password for the SSL/TLS Certificate"
}

variable "traffic_manager_profile_name" {
  type        = string
  description = "Name of the Azure Traffic Manager Profile"
}

variable "traffic_manager_endpoint_name" {
  type        = string
  description = "Name of the Azure Traffic Manager Endpoint"
}
