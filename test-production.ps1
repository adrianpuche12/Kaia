# Script de Testing de Producción - Kaia
# Día 23: Testing Exhaustivo

$baseUrl = "https://kaia-production.up.railway.app"
$results = @()

Write-Host "`n=== TESTING DE PRODUCCIÓN - DÍA 23 ===" -ForegroundColor Cyan
Write-Host "Iniciando tests en: $baseUrl`n" -ForegroundColor Yellow

# Función para hacer requests y medir tiempo
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Body = $null,
        [hashtable]$Headers = @{"Content-Type"="application/json"},
        [string]$Description
    )

    Write-Host "Testing: $Description" -ForegroundColor White
    $url = "$baseUrl$Endpoint"

    try {
        $startTime = Get-Date

        if ($Body) {
            $response = Invoke-RestMethod -Uri $url -Method $Method -Headers $Headers -Body $Body -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri $url -Method $Method -Headers $Headers -ErrorAction Stop
        }

        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds

        Write-Host "  ✓ SUCCESS - ${duration}ms" -ForegroundColor Green

        $global:results += [PSCustomObject]@{
            Endpoint = $Endpoint
            Method = $Method
            Description = $Description
            Status = "SUCCESS"
            StatusCode = 200
            ResponseTime = [math]::Round($duration, 2)
            Error = $null
        }

        return $response
    }
    catch {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        $errorMsg = $_.Exception.Message

        Write-Host "  ✗ FAILED - $errorMsg" -ForegroundColor Red

        $global:results += [PSCustomObject]@{
            Endpoint = $Endpoint
            Method = $Method
            Description = $Description
            Status = "FAILED"
            StatusCode = $_.Exception.Response.StatusCode.value__
            ResponseTime = [math]::Round($duration, 2)
            Error = $errorMsg
        }

        return $null
    }
}

# 1. HEALTH & INFO
Write-Host "`n--- 1. HEALTH & INFO ---" -ForegroundColor Cyan
Test-Endpoint -Method "GET" -Endpoint "/health" -Description "Health Check"
Test-Endpoint -Method "GET" -Endpoint "/" -Description "API Info"

# 2. AUTHENTICATION
Write-Host "`n--- 2. AUTHENTICATION ---" -ForegroundColor Cyan

# Register
$registerBody = @{
    email = "testproduction@kaia.app"
    password = "TestPass123"
    name = "Test"
    lastName = "Production"
} | ConvertTo-Json

$registerResponse = Test-Endpoint -Method "POST" -Endpoint "/api/auth/register" -Body $registerBody -Description "Register New User"

if ($registerResponse) {
    $accessToken = $registerResponse.data.tokens.accessToken
    $refreshToken = $registerResponse.data.tokens.refreshToken
    $userId = $registerResponse.data.user.id

    Write-Host "  User ID: $userId" -ForegroundColor Gray

    # Login
    $loginBody = @{
        email = "testproduction@kaia.app"
        password = "TestPass123"
    } | ConvertTo-Json

    Test-Endpoint -Method "POST" -Endpoint "/api/auth/login" -Body $loginBody -Description "Login User"

    # Get Profile (protected)
    $authHeaders = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $accessToken"
    }

    Test-Endpoint -Method "GET" -Endpoint "/api/auth/profile" -Headers $authHeaders -Description "Get User Profile (Protected)"

    # Refresh Token
    $refreshBody = @{
        refreshToken = $refreshToken
    } | ConvertTo-Json

    Test-Endpoint -Method "POST" -Endpoint "/api/auth/refresh" -Body $refreshBody -Description "Refresh Access Token"

    # 3. EVENTS
    Write-Host "`n--- 3. EVENTS ---" -ForegroundColor Cyan

    # Create Event
    $eventBody = @{
        title = "Test Event - Production"
        description = "Event created during Day 23 testing"
        startTime = (Get-Date).AddHours(2).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        endTime = (Get-Date).AddHours(3).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        type = "MEETING"
        priority = "MEDIUM"
    } | ConvertTo-Json

    $eventResponse = Test-Endpoint -Method "POST" -Endpoint "/api/events" -Headers $authHeaders -Body $eventBody -Description "Create Event"

    if ($eventResponse) {
        $eventId = $eventResponse.data.id

        # Get Events (List)
        Test-Endpoint -Method "GET" -Endpoint "/api/events" -Headers $authHeaders -Description "List Events"

        # Get Event by ID
        Test-Endpoint -Method "GET" -Endpoint "/api/events/$eventId" -Headers $authHeaders -Description "Get Event by ID"

        # Update Event
        $updateEventBody = @{
            title = "Test Event - Updated"
            description = "Event updated during testing"
        } | ConvertTo-Json

        Test-Endpoint -Method "PUT" -Endpoint "/api/events/$eventId" -Headers $authHeaders -Body $updateEventBody -Description "Update Event"

        # Delete Event
        Test-Endpoint -Method "DELETE" -Endpoint "/api/events/$eventId" -Headers $authHeaders -Description "Delete Event"
    }

    # 4. USERS
    Write-Host "`n--- 4. USERS ---" -ForegroundColor Cyan

    # Get User Profile
    Test-Endpoint -Method "GET" -Endpoint "/api/users/profile" -Headers $authHeaders -Description "Get User Profile"

    # Update Profile
    $updateProfileBody = @{
        name = "Test Updated"
    } | ConvertTo-Json

    Test-Endpoint -Method "PUT" -Endpoint "/api/users/profile" -Headers $authHeaders -Body $updateProfileBody -Description "Update User Profile"

    # Get Preferences
    Test-Endpoint -Method "GET" -Endpoint "/api/users/preferences" -Headers $authHeaders -Description "Get User Preferences"

    # Update Preferences
    $preferencesBody = @{
        language = "es"
        timezone = "America/Mexico_City"
        notifications = @{
            email = $true
            push = $true
        }
    } | ConvertTo-Json

    Test-Endpoint -Method "PUT" -Endpoint "/api/users/preferences" -Headers $authHeaders -Body $preferencesBody -Description "Update User Preferences"
}

# RESUMEN
Write-Host "`n`n=== RESUMEN DE TESTING ===" -ForegroundColor Cyan

$totalTests = $global:results.Count
$successTests = ($global:results | Where-Object { $_.Status -eq "SUCCESS" }).Count
$failedTests = ($global:results | Where-Object { $_.Status -eq "FAILED" }).Count
$avgResponseTime = [math]::Round(($global:results | Measure-Object -Property ResponseTime -Average).Average, 2)

Write-Host "`nTotal Tests: $totalTests" -ForegroundColor White
Write-Host "Successful: $successTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red
Write-Host "Avg Response Time: ${avgResponseTime}ms" -ForegroundColor Yellow

# Exportar resultados a JSON
$resultsPath = "C:\Users\jorge\OneDrive\Desktop\Kaia\test-results-dia23.json"
$global:results | ConvertTo-Json | Out-File -FilePath $resultsPath -Encoding UTF8
Write-Host "`nResultados guardados en: $resultsPath" -ForegroundColor Cyan

# Tabla de resultados
Write-Host "`n--- DETALLE DE TESTS ---" -ForegroundColor Cyan
$global:results | Format-Table -Property Method, Endpoint, Status, ResponseTime, Error -AutoSize
