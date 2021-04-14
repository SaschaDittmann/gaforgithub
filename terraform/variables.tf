variable "prefix" {
    type = string
    description = "The prefix of the resources used by Azure Functions"
}

variable "resource_group_name" {
    type = string
    description = "Name of the Azure Resource Group"
}

variable "resource_group_location" {
    type = string
    description = "Location of the Azure Resource Group"
}

variable "property_id" {
    type = string
    description = "Google Analytics Property ID"
}

variable "custom_hostname" {
    type = string
    description = "Custom Hostname for all Azure Functions Apps"
}

variable "cert_password" {
    type = string
    description = "Password for the SSL/TLS Certificate"
}
