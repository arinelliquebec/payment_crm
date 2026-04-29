# main.tf - Azure Infrastructure Resources for Fradema System

# Data Sources
data "azurerm_client_config" "current" {}

# Local variables
locals {
  project_name = "fradema"
  environment  = var.environment
  location     = var.location

  common_tags = {
    Project     = "Fradema Contracts System"
    Environment = local.environment
    ManagedBy   = "Terraform"
    CreatedDate = formatdate("YYYY-MM-DD", timestamp())
    Owner       = "Fradema"
  }

  name_prefix = "${local.project_name}-${local.environment}"

  # Environment-specific configurations
  env_config = {
    dev = {
      sku_name           = "B1"
      sql_sku           = "S0"
      redis_capacity    = 0
      redis_family      = "C"
      redis_sku         = "Basic"
      retention_days    = 7
      max_size_gb       = 2
      always_on         = false
    }
    staging = {
      sku_name           = "S1"
      sql_sku           = "S1"
      redis_capacity    = 0
      redis_family      = "C"
      redis_sku         = "Basic"
      retention_days    = 30
      max_size_gb       = 5
      always_on         = true
    }
    prod = {
      sku_name           = "P1v3"
      sql_sku           = "S2"
      redis_capacity    = 1
      redis_family      = "P"
      redis_sku         = "Premium"
      retention_days    = 90
      max_size_gb       = 10
      always_on         = true
    }
  }

  # Connection string for SQL database
  sql_connection_string = "Server=tcp:${azurerm_mssql_server.main.fully_qualified_domain_name},1433;Initial Catalog=${azurerm_mssql_database.main.name};Persist Security Info=False;User ID=${azurerm_mssql_server.main.administrator_login};Password=${var.sql_admin_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "rg-${local.name_prefix}"
  location = local.location
  tags     = local.common_tags
}

# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = "vnet-${local.name_prefix}"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.common_tags
}

# Subnets
resource "azurerm_subnet" "webapp" {
  name                 = "snet-webapp"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]

  delegation {
    name = "webapp-delegation"
    service_delegation {
      name    = "Microsoft.Web/serverFarms"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}

resource "azurerm_subnet" "database" {
  name                 = "snet-database"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.2.0/24"]
  service_endpoints    = ["Microsoft.Sql"]
}

# Network Security Groups
resource "azurerm_network_security_group" "webapp" {
  name                = "nsg-webapp-${local.name_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.common_tags

  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowHTTP"
    priority                   = 101
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "webapp" {
  subnet_id                 = azurerm_subnet.webapp.id
  network_security_group_id = azurerm_network_security_group.webapp.id
}

# Storage Account
resource "azurerm_storage_account" "main" {
  name                     = "${local.project_name}storage${local.environment}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = local.environment == "prod" ? "GRS" : "LRS"
  min_tls_version          = "TLS1_2"

  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"]
      allowed_origins    = [
        "https://${local.name_prefix}-frontend.azurewebsites.net",
        "https://www.fradema.com.br",
        "https://fradema.com.br"
      ]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }

    delete_retention_policy {
      days = local.env_config[local.environment].retention_days
    }

    versioning_enabled = local.environment == "prod"
  }

  network_rules {
    default_action = "Allow"
    ip_rules       = var.allowed_ips
    virtual_network_subnet_ids = [
      azurerm_subnet.webapp.id
    ]
  }

  tags = local.common_tags
}

# Storage Containers
resource "azurerm_storage_container" "contracts" {
  name                  = "contracts"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "backups" {
  name                  = "backups"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# Key Vault
resource "azurerm_key_vault" "main" {
  name                       = "kv-${local.name_prefix}-${formatdate("MMDD", timestamp())}"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 30
  purge_protection_enabled   = local.environment == "prod"

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = [
      "Get", "List", "Set", "Delete", "Recover", "Backup", "Restore"
    ]
  }

  network_acls {
    default_action = "Allow"
    bypass         = "AzureServices"
  }

  tags = local.common_tags
}

# Key Vault Secrets
resource "azurerm_key_vault_secret" "sql_password" {
  name         = "sql-admin-password"
  value        = var.sql_admin_password
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_key_vault.main]
}

resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "jwt-secret-key"
  value        = var.jwt_secret_key
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_key_vault.main]
}

resource "azurerm_key_vault_secret" "nextauth_secret" {
  name         = "nextauth-secret"
  value        = var.nextauth_secret
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_key_vault.main]
}

resource "azurerm_key_vault_secret" "sendgrid_key" {
  name         = "sendgrid-api-key"
  value        = var.sendgrid_api_key
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_key_vault.main]
}

# SQL Server
resource "azurerm_mssql_server" "main" {
  name                         = "${local.name_prefix}-sql-server"
  resource_group_name          = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  version                      = "12.0"
  administrator_login          = "frademaadmin"
  administrator_login_password = var.sql_admin_password
  minimum_tls_version          = "1.2"

  azuread_administrator {
    login_username = "AzureAD Admin"
    object_id      = var.azure_ad_admin_object_id
  }

  public_network_access_enabled = true

  tags = local.common_tags
}

# SQL Database
resource "azurerm_mssql_database" "main" {
  name           = "FrademaDb"
  server_id      = azurerm_mssql_server.main.id
  collation      = "SQL_Latin1_General_CP1_CI_AS"
  license_type   = "LicenseIncluded"
  max_size_gb    = local.env_config[local.environment].max_size_gb
  read_scale     = false
  sku_name       = local.env_config[local.environment].sql_sku
  zone_redundant = local.environment == "prod"

  threat_detection_policy {
    state                      = "Enabled"
    email_account_admins       = true
    email_addresses            = ["it@fradema.com.br"]
    retention_days             = 30
    storage_account_access_key = azurerm_storage_account.main.primary_access_key
    storage_endpoint           = azurerm_storage_account.main.primary_blob_endpoint
  }

  short_term_retention_policy {
    retention_days           = 35
    backup_interval_in_hours = 24
  }

  dynamic "long_term_retention_policy" {
    for_each = local.environment == "prod" ? [1] : []
    content {
      weekly_retention  = "P1W"
      monthly_retention = "P1M"
      yearly_retention  = "P1Y"
      week_of_year      = 1
    }
  }

  tags = local.common_tags
}

# SQL Firewall Rules
resource "azurerm_mssql_firewall_rule" "azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

resource "azurerm_mssql_virtual_network_rule" "webapp" {
  name      = "webapp-vnet-rule"
  server_id = azurerm_mssql_server.main.id
  subnet_id = azurerm_subnet.database.id
}

# Redis Cache
resource "azurerm_redis_cache" "main" {
  name                = "${local.name_prefix}-redis"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = local.env_config[local.environment].redis_capacity
  family              = local.env_config[local.environment].redis_family
  sku_name            = local.env_config[local.environment].redis_sku
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"

  redis_configuration {
    maxmemory_policy = "allkeys-lru"
  }

  tags = local.common_tags
}

# Container Registry
resource "azurerm_container_registry" "main" {
  name                = "${local.project_name}registry${local.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = local.environment == "prod" ? "Premium" : "Basic"
  admin_enabled       = true

  dynamic "georeplications" {
    for_each = local.environment == "prod" ? [1] : []
    content {
      location                = "East US"
      zone_redundancy_enabled = true
    }
  }

  dynamic "retention_policy" {
    for_each = local.environment == "prod" ? [1] : []
    content {
      days    = 30
      enabled = true
    }
  }

  tags = local.common_tags
}

# App Service Plans
resource "azurerm_service_plan" "backend" {
  name                = "asp-${local.name_prefix}-backend"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = local.env_config[local.environment].sku_name

  tags = local.common_tags
}

resource "azurerm_service_plan" "frontend" {
  name                = "asp-${local.name_prefix}-frontend"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = local.env_config[local.environment].sku_name

  tags = local.common_tags
}

# Backend Web App
resource "azurerm_linux_web_app" "backend" {
  name                = "${local.name_prefix}-backend-api"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_service_plan.backend.location
  service_plan_id     = azurerm_service_plan.backend.id
  https_only          = true

  site_config {
    always_on              = local.env_config[local.environment].always_on
    http2_enabled          = true
    minimum_tls_version    = "1.2"
    ftps_state             = "Disabled"
    health_check_path      = "/health"

    application_stack {
      docker_image     = "${azurerm_container_registry.main.login_server}/${local.project_name}-backend"
      docker_image_tag = "latest"
    }

    cors {
      allowed_origins = [
        "https://${local.name_prefix}-frontend.azurewebsites.net",
        "https://www.fradema.com.br",
        "https://fradema.com.br"
      ]
      support_credentials = true
    }
  }

  app_settings = {
    "ASPNETCORE_ENVIRONMENT"                      = local.environment == "prod" ? "Production" : "Development"
    "DOCKER_REGISTRY_SERVER_URL"                  = "https://${azurerm_container_registry.main.login_server}"
    "DOCKER_REGISTRY_SERVER_USERNAME"             = azurerm_container_registry.main.admin_username
    "DOCKER_REGISTRY_SERVER_PASSWORD"             = azurerm_container_registry.main.admin_password
    "ApplicationInsights__ConnectionString"       = azurerm_application_insights.main.connection_string
    "AzureStorage__ConnectionString"              = azurerm_storage_account.main.primary_connection_string
    "AzureStorage__ContainerName"                 = azurerm_storage_container.contracts.name
    "ConnectionStrings__DefaultConnection"        = local.sql_connection_string
    "ConnectionStrings__Redis"                    = azurerm_redis_cache.main.primary_connection_string
    "JwtSettings__SecretKey"                      = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault.main.vault_uri}secrets/jwt-secret-key/)"
    "JwtSettings__Issuer"                         = "https://${local.name_prefix}-backend-api.azurewebsites.net"
    "JwtSettings__Audience"                       = "https://${local.name_prefix}-frontend.azurewebsites.net"
    "SendGrid__ApiKey"                            = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault.main.vault_uri}secrets/sendgrid-api-key/)"
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE"         = "false"
    "DOCKER_ENABLE_CI"                            = "true"
  }

  identity {
    type = "SystemAssigned"
  }

  tags = local.common_tags
}

# Frontend Web App
resource "azurerm_linux_web_app" "frontend" {
  name                = "${local.name_prefix}-frontend"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_service_plan.frontend.location
  service_plan_id     = azurerm_service_plan.frontend.id
  https_only          = true

  site_config {
    always_on              = local.env_config[local.environment].always_on
    http2_enabled          = true
    minimum_tls_version    = "1.2"
    ftps_state             = "Disabled"
    health_check_path      = "/api/health"

    application_stack {
      docker_image     = "${azurerm_container_registry.main.login_server}/${local.project_name}-frontend"
      docker_image_tag = "latest"
    }
  }

  app_settings = {
    "NODE_ENV"                                    = local.environment == "prod" ? "production" : "development"
    "DOCKER_REGISTRY_SERVER_URL"                  = "https://${azurerm_container_registry.main.login_server}"
    "DOCKER_REGISTRY_SERVER_USERNAME"             = azurerm_container_registry.main.admin_username
    "DOCKER_REGISTRY_SERVER_PASSWORD"             = azurerm_container_registry.main.admin_password
    "NEXTAUTH_URL"                                = "https://${local.name_prefix}-frontend.azurewebsites.net"
    "NEXTAUTH_SECRET"                             = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault.main.vault_uri}secrets/nextauth-secret/)"
    "NEXT_PUBLIC_API_URL"                         = "https://${local.name_prefix}-backend-api.azurewebsites.net/api/v1"
    "NEXT_PUBLIC_AZURE_STORAGE_URL"               = azurerm_storage_account.main.primary_blob_endpoint
    "NEXT_PUBLIC_APPLICATION_INSIGHTS_KEY"        = azurerm_application_insights.main.instrumentation_key
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE"         = "false"
    "DOCKER_ENABLE_CI"                            = "true"
  }

  identity {
    type = "SystemAssigned"
  }

  tags = local.common_tags
}

# Key Vault Access Policies for Web Apps
resource "azurerm_key_vault_access_policy" "backend" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = azurerm_linux_web_app.backend.identity[0].tenant_id
  object_id    = azurerm_linux_web_app.backend.identity[0].principal_id

  secret_permissions = ["Get", "List"]
}

resource "azurerm_key_vault_access_policy" "frontend" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = azurerm_linux_web_app.frontend.identity[0].tenant_id
  object_id    = azurerm_linux_web_app.frontend.identity[0].principal_id

  secret_permissions = ["Get", "List"]
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "ai-${local.name_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_type    = "web"
  retention_in_days   = local.env_config[local.environment].retention_days

  tags = local.common_tags
}

# CDN Profile (Production only)
resource "azurerm_cdn_profile" "main" {
  count               = local.environment == "prod" ? 1 : 0
  name                = "cdn-${local.name_prefix}"
  location            = "global"
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Standard_Microsoft"

  tags = local.common_tags
}

resource "azurerm_cdn_endpoint" "frontend" {
  count               = local.environment == "prod" ? 1 : 0
  name                = "${local.name_prefix}-frontend-cdn"
  profile_name        = azurerm_cdn_profile.main[0].name
  location            = azurerm_cdn_profile.main[0].location
  resource_group_name = azurerm_resource_group.main.name

  origin {
    name      = "frontend-origin"
    host_name = azurerm_linux_web_app.frontend.default_hostname
  }

  is_http_allowed  = false
  is_https_allowed = true

  delivery_rule {
    name  = "EnforceHTTPS"
    order = 1

    request_scheme_condition {
      operator     = "Equal"
      match_values = ["HTTP"]
    }

    url_redirect_action {
      redirect_type = "PermanentRedirect"
      protocol      = "Https"
    }
  }

  global_delivery_rule {
    cache_expiration_action {
      behavior = "BypassCache"
    }
  }

  tags = local.common_tags
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-${local.name_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = local.env_config[local.environment].retention_days

  tags = local.common_tags
}

# Monitoring and Alerts (Production only)
resource "azurerm_monitor_action_group" "main" {
  count               = local.environment == "prod" ? 1 : 0
  name                = "ag-${local.name_prefix}"
  resource_group_name = azurerm_resource_group.main.name
  short_name          = "fradema"

  email_receiver {
    name          = "IT Team"
    email_address = "it@fradema.com.br"
  }

  tags = local.common_tags
}

resource "azurerm_monitor_metric_alert" "backend_response_time" {
  count               = local.environment == "prod" ? 1 : 0
  name                = "alert-backend-response-time"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_linux_web_app.backend.id]
  description         = "Alert when backend response time is too high"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "HttpResponseTime"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 3000
  }

  action {
    action_group_id = azurerm_monitor_action_group.main[0].id
  }

  tags = local.common_tags
}