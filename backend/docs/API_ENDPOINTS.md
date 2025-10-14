# Documentación Completa de Endpoints - Kaia API

**Base URL**: `http://localhost:3001/api`

**Autenticación**: Bearer Token (JWT) en header `Authorization`

---

## 📋 Tabla de Contenidos

1. [Auth](#auth)
2. [Events](#events)
3. [Messages](#messages)
4. [Voice](#voice)
5. [Location](#location)
6. [MCPs](#mcps)
7. [Users](#users)
8. [Códigos de Error](#códigos-de-error)

---

## Auth

### POST /auth/register

Crear una nueva cuenta de usuario.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "MiPassword123",
  "name": "Juan",
  "lastName": "Pérez",
  "phone": "+34612345678",
  "birthDate": "1990-05-15T00:00:00Z"
}
```

**Validaciones:**
- `email`: Formato válido de email
- `password`: Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número
- `name`: Mínimo 2 caracteres
- `phone`: Formato internacional (opcional)
- `birthDate`: Fecha en formato ISO (opcional)

**Respuesta 201:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm2abc123xyz",
      "email": "usuario@example.com",
      "name": "Juan",
      "lastName": "Pérez",
      "phone": "+34612345678",
      "avatar": null,
      "createdAt": "2025-10-10T21:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST /auth/login

Iniciar sesión con credenciales.

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "MiPassword123"
}
```

**Respuesta 200:**
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

### GET /auth/profile

Obtener perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "id": "cm2abc123xyz",
    "email": "usuario@example.com",
    "name": "Juan",
    "lastName": "Pérez",
    "phone": "+34612345678",
    "birthDate": "1990-05-15T00:00:00.000Z",
    "avatar": null,
    "onboardingCompleted": true,
    "createdAt": "2025-10-10T21:00:00.000Z"
  }
}
```

---

### POST /auth/refresh

Renovar token de acceso usando refresh token.

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "token": "new-access-token",
    "refreshToken": "new-refresh-token"
  }
}
```

---

## Events

### POST /events

Crear un nuevo evento.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Reunión con cliente",
  "description": "Presentación del nuevo proyecto",
  "type": "MEETING",
  "startTime": "2025-10-15T10:00:00Z",
  "endTime": "2025-10-15T11:30:00Z",
  "location": "Oficina Central, Sala 3",
  "allDay": false
}
```

**Campos:**
- `title` (requerido): Título del evento (max 200 caracteres)
- `description` (opcional): Descripción (max 1000 caracteres)
- `type` (opcional): Tipo de evento (ej: MEETING, TASK, REMINDER)
- `startTime` (requerido): Fecha/hora de inicio (ISO 8601)
- `endTime` (opcional): Fecha/hora de fin (ISO 8601)
- `location` (opcional): Ubicación (max 500 caracteres)
- `allDay` (opcional): Evento de día completo (boolean)

**Respuesta 201:**
```json
{
  "success": true,
  "data": {
    "id": "cm2evt123xyz",
    "title": "Reunión con cliente",
    "description": "Presentación del nuevo proyecto",
    "type": "MEETING",
    "startTime": "2025-10-15T10:00:00.000Z",
    "endTime": "2025-10-15T11:30:00.000Z",
    "location": "Oficina Central, Sala 3",
    "allDay": false,
    "completed": false,
    "userId": "cm2abc123xyz",
    "createdAt": "2025-10-10T21:00:00.000Z"
  }
}
```

---

### GET /events

Listar todos los eventos del usuario.

**Query Parameters:**
- `limit` (opcional): Número de resultados (default: 50, max: 100)
- `offset` (opcional): Offset para paginación (default: 0)

**Ejemplo:**
```
GET /api/events?limit=20&offset=0
```

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "cm2evt123xyz",
        "title": "Reunión con cliente",
        "startTime": "2025-10-15T10:00:00.000Z",
        ...
      }
    ],
    "total": 45,
    "limit": 20,
    "offset": 0
  }
}
```

---

### GET /events/:id

Obtener detalles de un evento específico.

**Parámetros:**
- `id`: ID del evento

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "id": "cm2evt123xyz",
    "title": "Reunión con cliente",
    "description": "Presentación del nuevo proyecto",
    ...
  }
}
```

---

### PUT /events/:id

Actualizar un evento existente.

**Body (todos los campos son opcionales):**
```json
{
  "title": "Reunión con cliente (MODIFICADA)",
  "description": "Nueva descripción",
  "completed": true
}
```

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "id": "cm2evt123xyz",
    "title": "Reunión con cliente (MODIFICADA)",
    ...
  }
}
```

---

### DELETE /events/:id

Eliminar un evento.

**Respuesta 204:**
Sin contenido (evento eliminado exitosamente)

---

### GET /events/range

Obtener eventos en un rango de fechas.

**Query Parameters:**
- `startDate` (requerido): Fecha de inicio (ISO 8601)
- `endDate` (requerido): Fecha de fin (ISO 8601)

**Ejemplo:**
```
GET /api/events/range?startDate=2025-10-01T00:00:00Z&endDate=2025-10-31T23:59:59Z
```

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "events": [...],
    "count": 12,
    "range": {
      "start": "2025-10-01T00:00:00.000Z",
      "end": "2025-10-31T23:59:59.000Z"
    }
  }
}
```

---

## Messages

### POST /messages

Enviar un mensaje por WhatsApp, Email o SMS.

**Body (WhatsApp):**
```json
{
  "platform": "WHATSAPP",
  "to": "+34612345678",
  "content": "Hola! Este es un mensaje de prueba desde Kaia."
}
```

**Body (Email):**
```json
{
  "platform": "EMAIL",
  "to": "destinatario@example.com",
  "subject": "Asunto del email",
  "content": "Contenido del mensaje."
}
```

**Body (SMS):**
```json
{
  "platform": "SMS",
  "to": "+34612345678",
  "content": "Mensaje de texto desde Kaia."
}
```

**Campos:**
- `platform` (requerido): `"WHATSAPP"`, `"EMAIL"`, o `"SMS"`
- `to` (opcional): Destinatario directo
- `contactId` (opcional): ID de contacto en la agenda
- `contactName` (opcional): Nombre de contacto a buscar
- `content` (requerido): Contenido del mensaje (max 5000 caracteres)
- `subject` (opcional, solo EMAIL): Asunto del email (max 200 caracteres)
- `scheduledFor` (opcional): Fecha para envío programado

**Respuesta 201:**
```json
{
  "success": true,
  "data": {
    "id": "cm2msg123xyz",
    "platform": "WHATSAPP",
    "to": "+34612345678",
    "content": "Hola! Este es un mensaje de prueba desde Kaia.",
    "status": "SENT",
    "sentAt": "2025-10-10T21:00:00.000Z",
    "externalId": "twilio-message-sid"
  }
}
```

**Nota:** Si las API keys de Twilio/SendGrid no están configuradas, el backend usará implementaciones mock y los mensajes se registrarán en logs pero no se enviarán realmente.

---

### GET /messages

Listar mensajes enviados.

**Query Parameters:**
- `limit`: Número de resultados (default: 50)
- `offset`: Offset para paginación

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "cm2msg123xyz",
        "platform": "WHATSAPP",
        "to": "+34612345678",
        "content": "...",
        "status": "SENT",
        "sentAt": "2025-10-10T21:00:00.000Z"
      }
    ],
    "total": 23,
    "limit": 50,
    "offset": 0
  }
}
```

---

### GET /messages/stats

Obtener estadísticas de mensajería.

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "total": 156,
    "byPlatform": {
      "WHATSAPP": 89,
      "EMAIL": 52,
      "SMS": 15
    },
    "byStatus": {
      "SENT": 140,
      "PENDING": 12,
      "FAILED": 4
    },
    "last30Days": 67
  }
}
```

---

## Voice

### POST /voice/process

Procesar un comando de voz y extraer intenciones.

**Body:**
```json
{
  "transcript": "Crea una reunión con el cliente mañana a las 10 de la mañana en la oficina",
  "language": "es",
  "confidence": 0.95,
  "duration": 4.2
}
```

**Campos:**
- `transcript` (requerido): Texto transcrito del audio (max 5000 caracteres)
- `language` (opcional): Código de idioma (default: "es")
- `confidence` (opcional): Confianza de la transcripción (0-1)
- `duration` (opcional): Duración del audio en segundos
- `audioUrl` (opcional): URL del audio original

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "id": "cm2voice123xyz",
    "transcript": "Crea una reunión con el cliente mañana a las 10 de la mañana en la oficina",
    "intent": "CREATE_EVENT",
    "confidence": 0.92,
    "entities": {
      "eventType": "reunión",
      "participants": ["cliente"],
      "date": "2025-10-11",
      "time": "10:00",
      "location": "oficina"
    },
    "response": "He creado una reunión con el cliente para mañana a las 10:00 en la oficina.",
    "actionTaken": "EVENT_CREATED",
    "relatedId": "cm2evt456xyz"
  }
}
```

---

### GET /voice/history

Obtener historial de comandos de voz.

**Query Parameters:**
- `limit`: Número de resultados
- `offset`: Offset para paginación

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "cm2voice123xyz",
        "transcript": "...",
        "intent": "CREATE_EVENT",
        "processedAt": "2025-10-10T21:00:00.000Z"
      }
    ],
    "total": 45
  }
}
```

---

### GET /voice/stats

Estadísticas de uso de voz.

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "totalCommands": 234,
    "successRate": 0.89,
    "byIntent": {
      "CREATE_EVENT": 89,
      "SEND_MESSAGE": 67,
      "QUERY_AGENDA": 45,
      "UNKNOWN": 33
    },
    "averageConfidence": 0.87,
    "last7Days": 42
  }
}
```

---

## Location

### POST /location

Actualizar ubicación del usuario.

**Body:**
```json
{
  "latitude": 40.4168,
  "longitude": -3.7038,
  "accuracy": 10.5,
  "altitude": 667,
  "speed": 0,
  "heading": 0
}
```

**Validaciones:**
- `latitude`: -90 a 90
- `longitude`: -180 a 180
- `accuracy`, `speed`: >= 0
- `heading`: 0 a 360

**Respuesta 201:**
```json
{
  "success": true,
  "data": {
    "id": "cm2loc123xyz",
    "latitude": 40.4168,
    "longitude": -3.7038,
    "accuracy": 10.5,
    "timestamp": "2025-10-10T21:00:00.000Z"
  }
}
```

---

### GET /location

Obtener última ubicación registrada.

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "id": "cm2loc123xyz",
    "latitude": 40.4168,
    "longitude": -3.7038,
    "accuracy": 10.5,
    "timestamp": "2025-10-10T21:00:00.000Z"
  }
}
```

---

### POST /location/geofence

Crear una cerca geográfica.

**Body:**
```json
{
  "name": "Oficina",
  "latitude": 40.4168,
  "longitude": -3.7038,
  "radiusMeters": 100,
  "type": "WORK",
  "notifyOnEnter": true,
  "notifyOnExit": true,
  "enabled": true
}
```

**Respuesta 201:**
```json
{
  "success": true,
  "data": {
    "id": "cm2geo123xyz",
    "name": "Oficina",
    "latitude": 40.4168,
    "longitude": -3.7038,
    "radiusMeters": 100,
    "type": "WORK",
    "enabled": true
  }
}
```

---

### POST /location/geocode

Convertir dirección a coordenadas.

**Body:**
```json
{
  "address": "Gran Vía 1, Madrid, España"
}
```

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "address": "Gran Vía 1, Madrid, España",
    "latitude": 40.4200,
    "longitude": -3.7089,
    "formattedAddress": "Gran Vía, 1, 28013 Madrid, España"
  }
}
```

**Nota:** Requiere Google Maps API key configurada. Si no está configurada, retornará un mock.

---

### POST /location/reverse-geocode

Convertir coordenadas a dirección.

**Body:**
```json
{
  "latitude": 40.4168,
  "longitude": -3.7038
}
```

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "latitude": 40.4168,
    "longitude": -3.7038,
    "address": "Puerta del Sol, Madrid, España",
    "city": "Madrid",
    "country": "España"
  }
}
```

---

### POST /location/route

Calcular ruta entre dos puntos.

**Body:**
```json
{
  "from": {
    "latitude": 40.4168,
    "longitude": -3.7038
  },
  "to": {
    "latitude": 40.4165,
    "longitude": -3.7026
  },
  "mode": "DRIVING"
}
```

**Modos disponibles:**
- `"DRIVING"`: Conduciendo
- `"WALKING"`: Caminando
- `"TRANSIT"`: Transporte público
- `"BICYCLING"`: Bicicleta

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "distance": 1250,
    "duration": 240,
    "mode": "DRIVING",
    "polyline": "encoded-polyline-string",
    "steps": [...]
  }
}
```

---

## MCPs

### GET /mcps

Listar MCPs disponibles.

**Query Parameters:**
- `enabled`: Filtrar por estado (true/false)
- `category`: Filtrar por categoría

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "mcps": [
      {
        "id": "cm2mcp123xyz",
        "name": "Weather Checker",
        "type": "SYSTEM",
        "category": "UTILITIES",
        "description": "Consulta el clima de cualquier ciudad",
        "enabled": true,
        "executionCount": 45
      }
    ],
    "total": 8
  }
}
```

---

### POST /mcps

Crear un nuevo MCP.

**Body:**
```json
{
  "name": "Weather Checker",
  "type": "USER_CREATED",
  "category": "UTILITIES",
  "description": "Consulta el clima de cualquier ciudad",
  "capabilities": ["weather", "forecast"],
  "enabled": true
}
```

**Respuesta 201:**
```json
{
  "success": true,
  "data": {
    "id": "cm2mcp123xyz",
    "name": "Weather Checker",
    ...
  }
}
```

---

### POST /mcps/execute

Ejecutar un MCP con parámetros.

**Body:**
```json
{
  "mcpId": "cm2mcp123xyz",
  "input": {
    "city": "Madrid",
    "units": "metric"
  }
}
```

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "output": {
      "temperature": 22,
      "condition": "Soleado",
      "humidity": 45
    },
    "executionTime": 234
  }
}
```

---

## Users

### GET /users/profile

Obtener perfil del usuario (igual que `/auth/profile`).

---

### PUT /users/profile

Actualizar perfil del usuario.

**Body:**
```json
{
  "name": "Juan Carlos",
  "lastName": "Pérez García",
  "phone": "+34612345679",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "id": "cm2abc123xyz",
    "name": "Juan Carlos",
    "lastName": "Pérez García",
    ...
  }
}
```

---

### GET /users/preferences

Obtener preferencias del usuario.

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "notificationsEnabled": true,
    "emailNotifications": true,
    "smsNotifications": false,
    "pushNotifications": true,
    "voiceEnabled": true,
    "language": "es",
    "timezone": "Europe/Madrid"
  }
}
```

---

### PUT /users/preferences

Actualizar preferencias del usuario.

**Body:**
```json
{
  "notificationsEnabled": true,
  "emailNotifications": false,
  "language": "en",
  "timezone": "America/New_York"
}
```

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "notificationsEnabled": true,
    "emailNotifications": false,
    ...
  }
}
```

---

### PUT /users/password

Cambiar contraseña del usuario.

**Body:**
```json
{
  "currentPassword": "MiPassword123",
  "newPassword": "NuevoPassword456"
}
```

**Respuesta 200:**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

---

## Códigos de Error

### Errores Comunes

| Código | Mensaje | Descripción |
|--------|---------|-------------|
| `UNAUTHORIZED` | No autorizado | Token inválido o ausente |
| `VALIDATION_ERROR` | Error de validación | Datos inválidos en la petición |
| `NOT_FOUND` | Recurso no encontrado | El recurso solicitado no existe |
| `RATE_LIMIT_EXCEEDED` | Límite excedido | Demasiadas peticiones |
| `INTERNAL_ERROR` | Error interno | Error del servidor |

### Ejemplo de Respuesta de Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email inválido",
    "details": [
      {
        "field": "email",
        "message": "Email inválido"
      }
    ]
  }
}
```

---

**Última actualización**: Día 19 - Octubre 2025
**Versión**: 1.0.0
