# Environment Setup Guide for .NET Backend

## Overview

This guide explains how to set up environment variables for the CRM Arrighi .NET backend.

## Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your actual configuration values

3. The application will automatically load environment variables from `.env` file

## Configuration Options

### Database Configuration

```env
DB_SERVER=your-server.database.windows.net
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password
```

### Frontend Configuration

```env
FRONTEND_URL=http://localhost:3000
```

For production, set this to your actual frontend URL (e.g., `https://yourdomain.com`)

### Email Configuration

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USERNAME=noreply@yourdomain.com
SMTP_PASSWORD=your-email-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=Your App Name
```

### Santander API Configuration

```env
SANTANDER_MODO_SIMULACAO=true
SANTANDER_BASE_URL=https://trust-open.api.santander.com.br
SANTANDER_WORKSPACE_ID=DEVELOPMENT
SANTANDER_CLIENT_ID=your-client-id
SANTANDER_CLIENT_SECRET=your-client-secret
SANTANDER_COVENANT_CODE=your-covenant-code
SANTANDER_BANK_NUMBER=0000
SANTANDER_CERT_PATH=/path/to/certificate.pfx
SANTANDER_CERT_PASSWORD=certificate-password
```

### Azure Storage Configuration

```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=your-account;AccountKey=your-key;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=contratos
```

## Using Environment Variables in .NET

### Option 1: Using appsettings.json (Current Method)

The application currently uses `appsettings.json` and `appsettings.Development.json` for configuration. This is the standard .NET approach.

**Pros:**
- Native .NET configuration system
- Easy to use with IConfiguration
- Supports hierarchical configuration
- Environment-specific files (Development, Production, etc.)

**Cons:**
- Sensitive data might be committed to source control
- Requires separate files for different environments

### Option 2: Using .env Files (Recommended for Sensitive Data)

To use `.env` files with .NET, you need to install a package:

```bash
dotnet add package DotNetEnv
```

Then modify `Program.cs`:

```csharp
// At the top of Program.cs
DotNetEnv.Env.Load();

// Then you can access environment variables:
var dbServer = Environment.GetEnvironmentVariable("DB_SERVER");
```

### Option 3: Hybrid Approach (Recommended)

Use `appsettings.json` for non-sensitive configuration and environment variables for sensitive data:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=${DB_SERVER};Database=${DB_NAME};User Id=${DB_USER};Password=${DB_PASSWORD};..."
  }
}
```

## Environment-Specific Configuration

### Development
- Use `appsettings.Development.json`
- Set `ASPNETCORE_ENVIRONMENT=Development`

### Production
- Use `appsettings.Production.json`
- Set `ASPNETCORE_ENVIRONMENT=Production`
- Use Azure App Service Configuration or environment variables

## Security Best Practices

1. **Never commit sensitive data** to source control
2. **Use .gitignore** to exclude `.env` files
3. **Use Azure Key Vault** for production secrets
4. **Rotate credentials** regularly
5. **Use different credentials** for each environment

## Azure Deployment

When deploying to Azure App Service, set environment variables in:

1. Azure Portal → App Service → Configuration → Application Settings
2. Or use Azure CLI:
   ```bash
   az webapp config appsettings set --name <app-name> --resource-group <group-name> --settings DB_SERVER=<value>
   ```

## Troubleshooting

### Connection String Issues
- Verify server name and database name
- Check firewall rules in Azure SQL
- Ensure user has proper permissions

### Email Issues
- Verify SMTP credentials
- Check if port 587 is open
- Enable "less secure apps" if using Gmail (not recommended)

### Certificate Issues
- Ensure certificate file exists at specified path
- Verify certificate password
- Check certificate expiration date

## Additional Resources

- [.NET Configuration Documentation](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/configuration/)
- [Azure App Service Configuration](https://docs.microsoft.com/en-us/azure/app-service/configure-common)
- [DotNetEnv Package](https://github.com/tonerdo/dotnet-env)
