# Guía de Testing con Postman - Kaia API

## 📦 Importar la Colección

### 1. Descargar e Instalar Postman
Si aún no tienes Postman instalado:
- Descarga desde: https://www.postman.com/downloads/
- Instala la aplicación para tu sistema operativo

### 2. Importar Archivos

1. Abre Postman
2. Click en **Import** (botón en la esquina superior izquierda)
3. Arrastra estos dos archivos a la ventana de importación:
   - `Kaia_API.postman_collection.json` - Colección de requests
   - `Kaia_API.postman_environment.json` - Variables de entorno
4. Click en **Import**

### 3. Seleccionar el Environment

1. En la esquina superior derecha, verás un dropdown de environments
2. Selecciona **"Kaia API - Local Development"**
3. Verifica que `base_url` apunte a `http://localhost:3001/api`

---

## 🚀 Flujo de Testing Básico

### Paso 1: Verificar que el backend esté corriendo

**Request:** `00. Health & Info` → `Health Check`

```http
GET http://localhost:3001/health
```

**Respuesta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-10T21:36:42.033Z",
  "uptime": 29.46,
  "environment": "development"
}
```

---

### Paso 2: Registrar un nuevo usuario

**Request:** `01. Auth` → `Register`

```json
{
  "email": "test@kaia.app",
  "password": "Test1234",
  "name": "Usuario Test",
  "lastName": "Apellido",
  "phone": "+34612345678",
  "birthDate": "1990-01-01T00:00:00Z"
}
```

**Respuesta esperada (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id-aqui",
      "email": "test@kaia.app",
      "name": "Usuario Test",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**✨ Nota:** El script de test automáticamente guarda el `token` y `user_id` en las variables de entorno.

---

### Paso 3: Iniciar sesión (si ya tienes cuenta)

**Request:** `01. Auth` → `Login`

```json
{
  "email": "test@kaia.app",
  "password": "Test1234"
}
```

**Respuesta esperada (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "...",
    "refreshToken": "..."
  }
}
```

---

### Paso 4: Probar endpoints autenticados

Una vez que tengas el token guardado, puedes probar cualquier endpoint. El token se incluye automáticamente en el header `Authorization: Bearer {{token}}`.

#### Ejemplo 1: Crear un evento

**Request:** `02. Events` → `Create Event`

```json
{
  "title": "Reunión con cliente",
  "description": "Presentación de proyecto",
  "type": "MEETING",
  "startTime": "2025-10-15T10:00:00Z",
  "endTime": "2025-10-15T11:00:00Z",
  "location": "Oficina central",
  "allDay": false
}
```

#### Ejemplo 2: Enviar un WhatsApp

**Request:** `03. Messages` → `Send WhatsApp Message`

```json
{
  "platform": "WHATSAPP",
  "to": "+34612345678",
  "content": "Hola desde Kaia! Este es un mensaje de prueba por WhatsApp."
}
```

**⚠️ Importante:** Para enviar mensajes reales, debes configurar las API keys de Twilio/SendGrid en el archivo `.env` del backend.

#### Ejemplo 3: Procesar un comando de voz

**Request:** `04. Voice` → `Process Voice Command`

```json
{
  "transcript": "Crea una reunión con el cliente mañana a las 10 de la mañana",
  "language": "es",
  "confidence": 0.95
}
```

---

## 📋 Estructura de la Colección

La colección está organizada en 8 carpetas principales:

### 00. Health & Info
- **Health Check**: Verificar que el servidor esté corriendo
- **API Info**: Obtener información de la API y endpoints disponibles

### 01. Auth
- **Register**: Crear nueva cuenta
- **Login**: Iniciar sesión
- **Get Profile**: Obtener perfil del usuario autenticado
- **Refresh Token**: Renovar token de acceso

### 02. Events
- **Create Event**: Crear nuevo evento
- **List Events**: Listar todos los eventos del usuario
- **Get Event by ID**: Obtener detalles de un evento específico
- **Update Event**: Actualizar un evento existente
- **Delete Event**: Eliminar un evento
- **Get Events by Date Range**: Filtrar eventos por rango de fechas

### 03. Messages
- **Send WhatsApp Message**: Enviar mensaje por WhatsApp
- **Send Email**: Enviar correo electrónico
- **Send SMS**: Enviar mensaje de texto
- **List Messages**: Listar mensajes enviados
- **Get Message Stats**: Estadísticas de mensajería

### 04. Voice
- **Process Voice Command**: Procesar comando de voz
- **Get Voice History**: Historial de comandos de voz
- **Get Voice Stats**: Estadísticas de uso de voz

### 05. Location
- **Update Location**: Actualizar ubicación del usuario
- **Get Last Location**: Obtener última ubicación
- **Create Geofence**: Crear cerca geográfica
- **List Geofences**: Listar todas las geofences
- **Geocode Address**: Convertir dirección a coordenadas
- **Reverse Geocode**: Convertir coordenadas a dirección
- **Calculate Route**: Calcular ruta entre dos puntos

### 06. MCPs
- **List MCPs**: Listar todos los MCPs disponibles
- **Create MCP**: Crear nuevo MCP
- **Get MCP by ID**: Obtener detalles de un MCP
- **Execute MCP**: Ejecutar un MCP con parámetros
- **Toggle MCP**: Activar/desactivar un MCP
- **Delete MCP**: Eliminar un MCP

### 07. Users
- **Get Profile**: Obtener perfil del usuario
- **Update Profile**: Actualizar datos del perfil
- **Get Preferences**: Obtener preferencias del usuario
- **Update Preferences**: Actualizar preferencias
- **Change Password**: Cambiar contraseña

---

## 🔐 Autenticación

### Tokens Automáticos

Los requests de **Register** y **Login** incluyen scripts de test que automáticamente:
1. Extraen el `token` de la respuesta
2. Guardan el token en la variable de entorno `{{token}}`
3. Guardan el `user_id` en la variable de entorno `{{user_id}}`

Esto significa que **no necesitas copiar/pegar tokens manualmente**. Todos los requests autenticados usarán automáticamente el token guardado.

### Ver Tokens Guardados

1. Click en el icono de ojo 👁️ junto al selector de environment
2. Verás las variables actuales, incluyendo `token` y `user_id`

### Refrescar Token Expirado

Si tu token expira (por defecto expira en 15 minutos), usa:

**Request:** `01. Auth` → `Refresh Token`

Necesitarás el `refresh_token` que se obtuvo en el login/register.

---

## 🧪 Escenarios de Testing

### Escenario 1: Flujo Completo de Usuario Nuevo

1. **Health Check** → Verificar backend
2. **Register** → Crear cuenta
3. **Create Event** → Crear primer evento
4. **List Events** → Ver el evento creado
5. **Update Event** → Modificar el evento
6. **Get Profile** → Ver datos del perfil

### Escenario 2: Testing de Mensajería

1. **Login** → Iniciar sesión
2. **Send WhatsApp Message** → Enviar WhatsApp (mock si no hay API key)
3. **Send Email** → Enviar email (mock si no hay API key)
4. **List Messages** → Ver historial
5. **Get Message Stats** → Ver estadísticas

### Escenario 3: Testing de Voz y NLP

1. **Login** → Iniciar sesión
2. **Process Voice Command** → "Crea una reunión mañana a las 10"
3. **Get Voice History** → Ver historial de comandos
4. **List Events** → Verificar que se creó el evento
5. **Get Voice Stats** → Ver estadísticas

### Escenario 4: Testing de Ubicación

1. **Login** → Iniciar sesión
2. **Update Location** → Enviar ubicación actual
3. **Create Geofence** → Crear cerca de "Oficina"
4. **Geocode Address** → Convertir "Gran Vía 1, Madrid" a coordenadas
5. **Calculate Route** → Calcular ruta entre dos puntos

---

## ⚠️ Troubleshooting

### Error: "No token found" o 401 Unauthorized

**Solución:**
1. Asegúrate de haber hecho **Login** o **Register** primero
2. Verifica que el token se guardó: Click en 👁️ junto al environment
3. Si el token expiró, usa **Refresh Token**

### Error: 429 Too Many Requests

**Causa:** Has excedido el rate limit.

**Solución:**
- Espera unos minutos antes de volver a intentar
- Los límites por defecto son:
  - General: 100 requests / 15 minutos
  - Auth: 10 requests / 15 minutos
  - Messages: 20 mensajes / hora
  - Voice: 30 requests / hora
  - Location: 100 requests / hora

### Error: "Backend not responding"

**Solución:**
1. Verifica que el backend esté corriendo: `npm run dev` en la carpeta `backend`
2. Verifica el puerto en el `.env`: debe ser `PORT=3001`
3. Prueba el **Health Check** primero

### Error: "Twilio credentials not configured" o "SendGrid API key not configured"

**Causa:** Intentas enviar mensajes reales pero no hay API keys configuradas.

**Solución:**
- El backend usará implementaciones mock cuando las APIs no estén configuradas
- Los mensajes se "enviarán" pero solo en logs, no a destinatarios reales
- Para envío real, configura las API keys en `.env` (ver `docs/API_INTEGRATIONS.md`)

---

## 📊 Respuestas de la API

### Formato de Respuesta Exitosa

```json
{
  "success": true,
  "data": {
    // Datos solicitados
  }
}
```

### Formato de Respuesta de Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje descriptivo del error"
  }
}
```

### Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Request exitoso |
| 201 | Created - Recurso creado exitosamente |
| 204 | No Content - Exitoso sin contenido (DELETE) |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token inválido o ausente |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Error del servidor |

---

## 🔧 Variables de Entorno Disponibles

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `base_url` | URL base de la API | `http://localhost:3001/api` |
| `token` | JWT token de acceso | `eyJhbGciOiJIUzI1NiIs...` |
| `refresh_token` | Token para refrescar acceso | `eyJhbGciOiJIUzI1NiIs...` |
| `user_id` | ID del usuario autenticado | `user-123-abc-def` |

Estas variables se pueden usar en cualquier request con la sintaxis `{{variable_name}}`.

---

## 📝 Modificar la Colección

### Agregar Nuevos Requests

1. Click derecho en una carpeta
2. **Add Request**
3. Configura el método, URL y body
4. Guarda el request

### Duplicar Requests

1. Click derecho en un request
2. **Duplicate**
3. Modifica los datos según necesites

### Exportar Cambios

Si haces cambios en la colección:
1. Click en los `...` de la colección
2. **Export**
3. Guarda el archivo JSON actualizado

---

## 🚀 Testing Automatizado

### Scripts de Test en Requests

Algunos requests incluyen scripts que:
- Guardan tokens automáticamente
- Validan códigos de respuesta
- Extraen datos de respuestas

Ejemplo de script de test:
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.data.token);
    pm.environment.set("user_id", jsonData.data.user.id);
}
```

### Ejecutar Toda la Colección

1. Click en los `...` de la colección
2. **Run collection**
3. Selecciona el environment
4. **Run Kaia API**

Esto ejecutará todos los requests en secuencia y mostrará un reporte de éxitos/errores.

---

**Última actualización**: Día 19 - Octubre 2025
**Versión**: 1.0.0
