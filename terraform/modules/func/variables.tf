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

variable "ga_measurement_id" {
  type        = string
  description = "GA4 Measurement ID (format: G-XXXXXXXXXX)"
}

variable "ga_api_secret" {
  type        = string
  sensitive   = true
  description = "GA4 Measurement Protocol API secret"
}

variable "anonymize_ip" {
  type        = string
  default     = "1"
  description = "Set to '1' to exclude client IP from the GA4 payload"
}

variable "custom_hostname" {
  type        = string
  description = "Custom Hostname for the Azure Functions App"
}

variable "cert_password" {
  type        = string
  sensitive   = true
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
