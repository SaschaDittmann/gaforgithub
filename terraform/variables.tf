variable "prefix" {
  type        = string
  description = "The prefix of the resources used by Azure Functions"
}

variable "resource_group_name" {
  type        = string
  description = "Name of the Azure Resource Group"
}

variable "resource_group_location" {
  type        = string
  description = "Location of the Azure Resource Group"
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
  description = "Set to '1' to exclude client IP from the GA4 payload. GA4 handles IP anonymization by default."
}

variable "custom_hostname" {
  type        = string
  description = "Custom Hostname for all Azure Functions Apps"
}

variable "cert_password" {
  type        = string
  sensitive   = true
  description = "Password for the SSL/TLS Certificate"
}
