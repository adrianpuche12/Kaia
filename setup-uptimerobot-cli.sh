#!/bin/bash

# =============================================================================
# SCRIPT: Setup UptimeRobot Monitors via CLI
# Proyecto: Kaia
# Fecha: 18 de Octubre, 2025
# =============================================================================

# IMPORTANTE: Reemplaza con tu API key real de UptimeRobot
# La obtienes en: https://uptimerobot.com/dashboard#mySettings
API_KEY="YOUR_API_KEY_HERE"

# Base URL de la API
BASE_URL="https://api.uptimerobot.com/v2"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=================================================="
echo "🤖 UptimeRobot Setup - Proyecto Kaia"
echo "=================================================="
echo ""

# Verificar que API_KEY esté configurada
if [ "$API_KEY" == "YOUR_API_KEY_HERE" ]; then
    echo -e "${RED}❌ ERROR: Debes configurar tu API_KEY primero${NC}"
    echo ""
    echo "Pasos:"
    echo "1. Ve a https://uptimerobot.com/dashboard#mySettings"
    echo "2. En 'API Settings' → copia tu 'Main API Key'"
    echo "3. Edita este script y reemplaza YOUR_API_KEY_HERE"
    echo ""
    exit 1
fi

# =============================================================================
# FUNCIÓN: Crear Monitor
# =============================================================================
create_monitor() {
    local friendly_name="$1"
    local url="$2"
    local interval="${3:-300}"  # Default: 5 minutos (300 segundos)
    local type="${4:-1}"        # Default: 1 = HTTP(s)

    echo -e "${YELLOW}Creando monitor: $friendly_name${NC}"

    response=$(curl -s -X POST "$BASE_URL/newMonitor" \
        -d "api_key=$API_KEY" \
        -d "format=json" \
        -d "type=$type" \
        -d "friendly_name=$friendly_name" \
        -d "url=$url" \
        -d "interval=$interval")

    # Check si fue exitoso
    stat=$(echo $response | grep -o '"stat":"[^"]*"' | cut -d'"' -f4)

    if [ "$stat" == "ok" ]; then
        monitor_id=$(echo $response | grep -o '"id":[0-9]*' | cut -d':' -f2)
        echo -e "${GREEN}✅ Monitor creado exitosamente (ID: $monitor_id)${NC}"
        echo "   URL: $url"
        echo "   Interval: $interval segundos"
        echo ""
        return 0
    else
        error_msg=$(echo $response | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        echo -e "${RED}❌ Error: $error_msg${NC}"
        echo "   Response: $response"
        echo ""
        return 1
    fi
}

# =============================================================================
# FUNCIÓN: Listar Monitores Existentes
# =============================================================================
list_monitors() {
    echo -e "${YELLOW}📋 Monitores existentes:${NC}"
    echo ""

    response=$(curl -s -X POST "$BASE_URL/getMonitors" \
        -d "api_key=$API_KEY" \
        -d "format=json")

    # Pretty print usando Python (si está disponible)
    if command -v python3 &> /dev/null; then
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    else
        echo "$response"
    fi
    echo ""
}

# =============================================================================
# FUNCIÓN: Obtener Account Details
# =============================================================================
get_account_info() {
    echo -e "${YELLOW}👤 Información de la cuenta:${NC}"
    echo ""

    response=$(curl -s -X POST "$BASE_URL/getAccountDetails" \
        -d "api_key=$API_KEY" \
        -d "format=json")

    if command -v python3 &> /dev/null; then
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    else
        echo "$response"
    fi
    echo ""
}

# =============================================================================
# MAIN SCRIPT
# =============================================================================

echo "Paso 1: Verificando cuenta..."
get_account_info

echo "Paso 2: Listando monitores existentes..."
list_monitors

echo "Paso 3: Creando nuevos monitores para Kaia..."
echo ""

# Monitor 1: Backend Health Check (CRÍTICO)
create_monitor \
    "Kaia Backend - Health Check" \
    "https://kaia-production.up.railway.app/health" \
    300 \
    1

# Monitor 2: API Root
create_monitor \
    "Kaia API - Root" \
    "https://kaia-production.up.railway.app/" \
    300 \
    1

# Monitor 3: Swagger Docs (opcional, intervalo más largo)
create_monitor \
    "Kaia API - Swagger Documentation" \
    "https://kaia-production.up.railway.app/api/docs" \
    900 \
    1

# Monitor 4: Auth Login Endpoint (smoke test)
create_monitor \
    "Kaia API - Auth Login (Smoke Test)" \
    "https://kaia-production.up.railway.app/api/auth/login" \
    900 \
    1

echo "=================================================="
echo -e "${GREEN}✅ Setup completado${NC}"
echo "=================================================="
echo ""
echo "📊 Próximos pasos:"
echo "1. Ve a https://uptimerobot.com/dashboard"
echo "2. Verifica que los monitores aparezcan en verde"
echo "3. Configura alertas por email en cada monitor"
echo "4. Opcionalmente, crea un Status Page público"
echo ""
echo "🔔 Para configurar alertas automáticamente:"
echo "   Edita este script y agrega la sección de Alert Contacts"
echo ""
