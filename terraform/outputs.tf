output "frontend_url" {
  description = "Frontend App Service default hostname"
  value       = "https://${azurerm_linux_web_app.frontend.default_hostname}"
}

output "acr_login_server" {
  description = "ACR login server URL"
  value       = azurerm_container_registry.acr.login_server
}
