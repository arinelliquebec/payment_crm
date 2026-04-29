# Multi-stage build for .NET 10 API
# Otimizado para Azure Container Apps / Docker

# ============================================
# Stage 1: Build
# ============================================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copiar arquivos de projeto para cache de restore
COPY *.csproj ./
RUN dotnet restore

# Copiar todo o código fonte
COPY . .

# Build em modo Release
RUN dotnet build CadastroPessoas.csproj -c Release -o /app/build

# Publicar
RUN dotnet publish CadastroPessoas.csproj -c Release -o /app/publish /p:UseAppHost=false

# ============================================
# Stage 2: Runtime
# ============================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Criar usuário não-root para segurança
RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup --no-create-home appuser

# Copiar build publicado
COPY --from=build /app/publish .

# Configurações de ambiente
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:5000
ENV DOTNET_RUNNING_IN_CONTAINER=true

# Expor porta
EXPOSE 5000

# Mudar para usuário não-root
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl --fail http://localhost:5000/health || exit 1

# Entrypoint
ENTRYPOINT ["dotnet", "CadastroPessoas.dll"]


