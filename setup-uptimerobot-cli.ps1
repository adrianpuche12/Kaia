# =============================================================================
# SCRIPT: Setup UptimeRobot Monitors via CLI (PowerShell)
# Proyecto: Kaia
# Fecha: 18 de Octubre, 2025
# =============================================================================

# IMPORTANTE: Reemplaza con tu API key real de UptimeRobot
# La obtienes en: https://uptimerobot.com/dashboard#mySettings
$API_KEY = "YOUR_API_KEY_HERE"

# Base URL de la API
$BASE_URL = "https://api.uptimerobot.com/v2"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🤖 UptimeRobot Setup - Proyecto Kaia" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que API_KEY esté configurada
if ($API_KEY -eq "YOUR_API_KEY_HERE") {
    Write-Host "❌ ERROR: Debes configurar tu API_KEY primero" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pasos:"
    Write-Host "1. Ve a https://uptimerobot.com/dashboard#mySettings"
    Write-Host "2. En 'API Settings' → copia tu 'Main API Key'"
    Write-Host "3. Edita este script y reemplaza YOUR_API_KEY_HERE"
    Write-Host ""
    exit 1
}

# =============================================================================
# FUNCIÓN: Crear Monitor
# =============================================================================
function Create-Monitor {
    param(
        [string]$FriendlyName,
        [string]$Url,
        [int]$Interval = 300,  # Default: 5 minutos
        [int]$Type = 1         # Default: HTTP(s)
    )

    Write-Host "Creando monitor: $FriendlyName" -ForegroundColor Yellow

    $body = @{
        api_key = $API_KEY
        format = "json"
        type = $Type
        friendly_name = $FriendlyName
        url = $Url
        interval = $Interval
    }

    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/newMonitor" -Method Post -Body $body

        if ($response.stat -eq "ok") {
            Write-Host "✅ Monitor creado exitosamente (ID: $($response.monitor.id))" -ForegroundColor Green
            Write-Host "   URL: $Url"
            Write-Host "   Interval: $Interval segundos"
            Write-Host ""
        } else {
            Write-Host "❌ Error: $($response.error.message)" -ForegroundColor Red
            Write-Host ""
        }
    } catch {
        Write-Host "❌ Error en la petición: $_" -ForegroundColor Red
        Write-Host ""
    }
}

# =============================================================================
# FUNCIÓN: Listar Monitores Existentes
# =============================================================================
function Get-Monitors {
    Write-Host "📋 Monitores existentes:" -ForegroundColor Yellow
    Write-Host ""

    $body = @{
        api_key = $API_KEY
        format = "json"
    }

    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/getMonitors" -Method Post -Body $body

        if ($response.stat -eq "ok") {
            $response.monitors | ForEach-Object {
                Write-Host "  • $($_.friendly_name)" -ForegroundColor Cyan
                Write-Host "    ID: $($_.id) | Status: $($_.status) | URL: $($_.url)"
            }
            Write-Host ""
            Write-Host "Total: $($response.monitors.Count) monitores" -ForegroundColor Green
        } else {
            Write-Host "❌ Error: $($response.error.message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error en la petición: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# =============================================================================
# FUNCIÓN: Obtener Account Details
# =============================================================================
function Get-AccountInfo {
    Write-Host "👤 Información de la cuenta:" -ForegroundColor Yellow
    Write-Host ""

    $body = @{
        api_key = $API_KEY
        format = "json"
    }

    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/getAccountDetails" -Method Post -Body $body

        if ($response.stat -eq "ok") {
            Write-Host "  Email: $($response.account.email)" -ForegroundColor Cyan
            Write-Host "  Monitor Limit: $($response.account.monitor_limit)"
            Write-Host "  Monitor Interval: $($response.account.monitor_interval) segundos"
            Write-Host "  Up Monitors: $($response.account.up_monitors)"
            Write-Host "  Down Monitors: $($response.account.down_monitors)"
            Write-Host "  Paused Monitors: $($response.account.paused_monitors)"
        } else {
            Write-Host "❌ Error: $($response.error.message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error en la petición: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# =============================================================================
# MAIN SCRIPT
# =============================================================================

Write-Host "Paso 1: Verificando cuenta..." -ForegroundColor Cyan
Get-AccountInfo

Write-Host "Paso 2: Listando monitores existentes..." -ForegroundColor Cyan
Get-Monitors

Write-Host "Paso 3: Creando nuevos monitores para Kaia..." -ForegroundColor Cyan
Write-Host ""

# Monitor 1: Backend Health Check (CRÍTICO)
Create-Monitor `
    -FriendlyName "Kaia Backend - Health Check" `
    -Url "https://kaia-production.up.railway.app/health" `
    -Interval 300

# Monitor 2: API Root
Create-Monitor `
    -FriendlyName "Kaia API - Root" `
    -Url "https://kaia-production.up.railway.app/" `
    -Interval 300

# Monitor 3: Swagger Docs (intervalo más largo)
Create-Monitor `
    -FriendlyName "Kaia API - Swagger Documentation" `
    -Url "https://kaia-production.up.railway.app/api/docs" `
    -Interval 900

# Monitor 4: Auth Login Endpoint (smoke test)
Create-Monitor `
    -FriendlyName "Kaia API - Auth Login (Smoke Test)" `
    -Url "https://kaia-production.up.railway.app/api/auth/login" `
    -Interval 900

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "✅ Setup completado" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Próximos pasos:"
Write-Host "1. Ve a https://uptimerobot.com/dashboard"
Write-Host "2. Verifica que los monitores aparezcan en verde"
Write-Host "3. Configura alertas por email en cada monitor"
Write-Host "4. Opcionalmente, crea un Status Page público"
Write-Host ""
