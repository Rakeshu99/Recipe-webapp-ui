variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
  default     = "ae420492-c95a-4e2f-9a32-846c54cb286c"
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
  default     = "rg-recipe-ui"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "northeurope"
}

variable "acr_name" {
  description = "Azure Container Registry name for frontend"
  type        = string
  default     = "recipeuiacr"
}

variable "app_service_name" {
  description = "Frontend App Service name"
  type        = string
  default     = "recipe-ui-dev"
}

variable "app_service_sku" {
  description = "App Service SKU"
  type        = string
  default     = "B1"
}

variable "backend_url" {
  description = "Backend App Service URL for frontend to call"
  type        = string
  default     = "https://recipe-backend-dev.azurewebsites.net"
}
