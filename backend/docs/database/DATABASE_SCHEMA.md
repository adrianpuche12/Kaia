# 📊 Documentación Completa - Base de Datos Kaia

**Versión:** 1.0.0
**Fecha:** 5 de octubre, 2025
**Base de datos actual:** SQLite (desarrollo)
**Base de datos producción:** PostgreSQL

---

## 🎯 Resumen

Esta documentación describe el esquema completo de la base de datos de Kaia, incluyendo todos los modelos, relaciones, índices y estrategia de migración a PostgreSQL.

**Total de modelos:** 18
**Total de relaciones:** 23
**Total de índices:** 28

---

## 📋 Índice de Modelos

### Gestión de Usuarios
1. [User](#1-user) - Usuarios del sistema
2. [UserPreferences](#2-userpreferences) - Preferencias del usuario

### Agenda y Eventos
3. [Event](#3-event) - Eventos en la agenda
4. [Reminder](#4-reminder) - Recordatorios
5. [Alarm](#5-alarm) - Alarmas/Despertador

### Sistema MCP
6. [MCP](#6-mcp) - Model Context Protocols
7. [MCPExecution](#7-mcpexecution) - Ejecuciones de MCPs

### Comunicación
8. [Message](#8-message) - Mensajes (WhatsApp/Email/SMS)
9. [Contact](#9-contact) - Contactos

### Ubicación
10. [LocationLog](#10-locationlog) - Logs de ubicación
11. [Place](#11-place) - Lugares

### Voz
12. [VoiceSession](#12-voicesession) - Sesiones de voz

### Sistema de IA (Nuevo)
13. [Context](#13-context) - Contexto de IA de entidades
14. [Cluster](#14-cluster) - Clustering inteligente
15. [Action](#15-action) - Acciones sugeridas por IA
16. [InteractionLog](#16-interactionlog) - Historial de interacciones
17. [Pattern](#17-pattern) - Patrones detectados
18. [UserFeedback](#18-userfeedback) - Feedback del usuario

### Analytics
19. [AppUsageLog](#19-appusagelog) - Logs de uso de la app

---

## 📊 Diagrama Entidad-Relación

```
┌─────────────┐
│    User     │──┬──< UserPreferences (1:1)
└─────────────┘  │
       │         ├──< Event (1:N)
       │         ├──< Reminder (1:N)
       │         ├──< Alarm (1:N)
       │         ├──< VoiceSession (1:N)
       │         ├──< Message (1:N)
       │         ├──< Contact (1:N)
       │         ├──< LocationLog (1:N)
       │         ├──< Place (1:N)
       │         ├──< MCPExecution (1:N)
       │         ├──< Context (1:N)
       │         ├──< Cluster (1:N)
       │         ├──< Action (1:N)
       │         ├──< InteractionLog (1:N)
       │         ├──< Pattern (1:N)
       │         └──< UserFeedback (1:N)
       │
┌─────────────┐
│    Event    │──< Reminder (1:N)
└─────────────┘  └──< LocationLog (1:N)
       │
       └──> Place (N:1)

┌─────────────┐
│     MCP     │──< MCPExecution (1:N)
└─────────────┘

┌─────────────┐
│   Contact   │──< Message (1:N)
└─────────────┘
```

---

## 📝 Detalle de Modelos

### 1. User

**Tabla:** `users`
**Descripción:** Usuarios del sistema

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | String | PK, cuid() | ID único del usuario |
| email | String | UNIQUE, NOT NULL | Email del usuario |
| password | String | NOT NULL | Contraseña hasheada (bcrypt) |
| phone | String | UNIQUE, NULL | Teléfono del usuario |
| name | String | NOT NULL | Nombre del usuario |
| lastName | String | NULL | Apellido |
| birthDate | DateTime | NULL | Fecha de nacimiento |
| address | String | NULL | Dirección |
| city | String | NULL | Ciudad |
| country | String | NULL | País |
| avatar | String | NULL | URL del avatar |
| onboardingCompleted | Boolean | DEFAULT false | Si completó el onboarding |
| createdAt | DateTime | DEFAULT now() | Fecha de creación |
| updatedAt | DateTime | AUTO UPDATE | Fecha de actualización |

**Relaciones:**
- `preferences`: UserPreferences (1:1)
- `events`: Event[] (1:N)
- `reminders`: Reminder[] (1:N)
- `alarms`: Alarm[] (1:N)
- `voiceSessions`: VoiceSession[] (1:N)
- `messages`: Message[] (1:N)
- `contacts`: Contact[] (1:N)
- `locationLogs`: LocationLog[] (1:N)
- `places`: Place[] (1:N)
- `mcpExecutions`: MCPExecution[] (1:N)
- `contexts`: Context[] (1:N)
- `clusters`: Cluster[] (1:N)
- `actions`: Action[] (1:N)
- `interactionLogs`: InteractionLog[] (1:N)
- `patterns`: Pattern[] (1:N)
- `feedbacks`: UserFeedback[] (1:N)

**Índices:**
- UNIQUE: email
- UNIQUE: phone

---

### 2. UserPreferences

**Tabla:** `user_preferences`
**Descripción:** Preferencias y configuración del usuario

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | String | PK, cuid() | ID único |
| userId | String | FK User, UNIQUE | ID del usuario |
| voiceEnabled | Boolean | DEFAULT true | Voz habilitada |
| voiceGender | String | DEFAULT "FEMALE" | Género de voz |
| voiceSpeed | Float | DEFAULT 1.0 | Velocidad de voz |
| pushEnabled | Boolean | DEFAULT true | Notificaciones push |
| emailEnabled | Boolean | DEFAULT false | Notificaciones email |
| smsEnabled | Boolean | DEFAULT false | Notificaciones SMS |
| proactiveAlertsEnabled | Boolean | DEFAULT true | Alertas proactivas |
| lateWarningsEnabled | Boolean | DEFAULT true | Avisos de retraso |
| defaultAlarmTone | String | NULL | Tono de alarma por defecto |
| snoozeMinutes | Int | DEFAULT 5 | Minutos de snooze |
| gradualVolumeEnabled | Boolean | DEFAULT true | Volumen gradual |
| language | String | DEFAULT "es" | Idioma |
| timezone | String | DEFAULT "America/Argentina/Buenos_Aires" | Zona horaria |
| dateFormat | String | DEFAULT "DD/MM/YYYY" | Formato de fecha |
| timeFormat | String | DEFAULT "24h" | Formato de hora |
| requireConfirmationBeforeSending | Boolean | DEFAULT true | Confirmar antes de enviar |
| autoReplyEnabled | Boolean | DEFAULT false | Auto-respuesta |
| readReceiptsEnabled | Boolean | DEFAULT true | Confirmaciones de lectura |
| locationTrackingEnabled | Boolean | DEFAULT true | Rastreo de ubicación |
| geofencingEnabled | Boolean | DEFAULT true | Geofencing |
| proximityThresholdMeters | Int | DEFAULT 500 | Umbral de proximidad |
| allowDynamicMCPs | Boolean | DEFAULT true | Permitir MCPs dinámicos |
| mcpWhitelistedDomains | String | DEFAULT "" | Dominios permitidos (JSON) |
| interests | String | DEFAULT "[]" | Intereses (JSON array) |
| favoriteCategories | String | DEFAULT "[]" | Categorías favoritas (JSON) |
| customPreferences | String | DEFAULT "{}" | Preferencias custom (JSON) |
| createdAt | DateTime | DEFAULT now() | Fecha de creación |
| updatedAt | DateTime | AUTO UPDATE | Fecha de actualización |

**Relaciones:**
- `user`: User (N:1, CASCADE delete)

---

### 3. Event

**Tabla:** `events`
**Descripción:** Eventos en la agenda del usuario

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | String | PK, cuid() | ID único |
| userId | String | FK User | ID del usuario |
| title | String | NOT NULL | Título del evento |
| description | String | NULL | Descripción |
| type | String | DEFAULT "OTHER" | Tipo de evento |
| startTime | DateTime | NOT NULL | Hora de inicio |
| endTime | DateTime | NULL | Hora de fin |
| allDay | Boolean | DEFAULT false | Evento de todo el día |
| timezone | String | NULL | Zona horaria |
| location | String | NULL | Ubicación (texto) |
| placeId | String | FK Place, NULL | ID del lugar |
| participants | String | DEFAULT "" | Participantes (JSON) |
| createdVia | String | DEFAULT "VOICE" | Creado via |
| completed | Boolean | DEFAULT false | Completado |
| canceled | Boolean | DEFAULT false | Cancelado |
| externalId | String | NULL | ID externo |
| externalSource | String | NULL | Fuente externa |
| createdAt | DateTime | DEFAULT now() | Fecha de creación |
| updatedAt | DateTime | AUTO UPDATE | Fecha de actualización |

**Relaciones:**
- `user`: User (N:1, CASCADE delete)
- `place`: Place (N:1, NULL)
- `reminders`: Reminder[] (1:N)
- `locationLogs`: LocationLog[] (1:N)

---

### 4. Reminder

**Tabla:** `reminders`
**Descripción:** Recordatorios del usuario

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | String | PK, cuid() | ID único |
| userId | String | FK User | ID del usuario |
| eventId | String | FK Event, NULL | ID del evento |
| title | String | NOT NULL | Título |
| message | String | NULL | Mensaje |
| remindAt | DateTime | NOT NULL | Cuándo recordar |
| channel | String | DEFAULT "PUSH" | Canal de recordatorio |
| sent | Boolean | DEFAULT false | Enviado |
| read | Boolean | DEFAULT false | Leído |
| snoozed | Boolean | DEFAULT false | En snooze |
| snoozeUntil | DateTime | NULL | Snooze hasta |
| recurring | Boolean | DEFAULT false | Recurrente |
| recurrenceRule | String | NULL | Regla de recurrencia |
| createdAt | DateTime | DEFAULT now() | Fecha de creación |
| updatedAt | DateTime | AUTO UPDATE | Fecha de actualización |

**Relaciones:**
- `user`: User (N:1, CASCADE delete)
- `event`: Event (N:1, CASCADE delete, NULL)

---

### 5. Alarm

**Tabla:** `alarms`
**Descripción:** Alarmas/Despertador del usuario

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | String | PK, cuid() | ID único |
| userId | String | FK User | ID del usuario |
| name | String | NULL | Nombre |
| label | String | NULL | Etiqueta |
| time | String | NOT NULL | Hora "HH:MM" |
| daysActive | String | NOT NULL | Días activos (JSON) |
| soundType | String | DEFAULT "DEFAULT" | Tipo de sonido |
| musicId | String | NULL | ID de música |
| musicName | String | NULL | Nombre de música |
| musicUrl | String | NULL | URL de música |
| wakeMessage | String | NULL | Mensaje de despertar |
| readAgenda | Boolean | DEFAULT true | Leer agenda |
| vibration | Boolean | DEFAULT true | Vibración |
| snooze | Boolean | DEFAULT true | Snooze |
| snoozeTime | Int | DEFAULT 5 | Tiempo de snooze |
| maxSnoozes | Int | DEFAULT 3 | Max snoozes |
| gradualVolume | Boolean | DEFAULT true | Volumen gradual |
| volumeStart | Int | DEFAULT 30 | Volumen inicial |
| volumeEnd | Int | DEFAULT 70 | Volumen final |
| volumeDuration | Int | DEFAULT 60 | Duración volumen |
| enabled | Boolean | DEFAULT true | Habilitado |
| lastTriggered | DateTime | NULL | Última ejecución |
| createdAt | DateTime | DEFAULT now() | Fecha de creación |
| updatedAt | DateTime | AUTO UPDATE | Fecha de actualización |

**Relaciones:**
- `user`: User (N:1, CASCADE delete)

---

### 6. MCP

**Tabla:** `mcps`
**Descripción:** Model Context Protocols (conectores)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | String | PK, cuid() | ID único |
| name | String | NOT NULL | Nombre del MCP |
| type | String | NOT NULL | Tipo de MCP |
| category | String | NOT NULL | Categoría |
| description | String | NOT NULL | Descripción |
| version | String | DEFAULT "1.0.0" | Versión |
| capabilities | String | NOT NULL | Capacidades (JSON) |
| inputSchema | String | NOT NULL | Schema de input (JSON) |
| outputSchema | String | NOT NULL | Schema de output (JSON) |
| executorCode | String | NOT NULL | Código executor |
| executorType | String | DEFAULT "inline" | Tipo de executor |
| config | String | NULL | Configuración (JSON) |
| usageCount | Int | DEFAULT 0 | Contador de uso |
| successCount | Int | DEFAULT 0 | Contador de éxitos |
| failureCount | Int | DEFAULT 0 | Contador de fallos |
| avgExecutionTimeMs | Int | NULL | Tiempo promedio (ms) |
| rating | Float | NULL | Rating |
| generatedBy | String | NULL | Generado por |
| prompt | String | NULL | Prompt usado |
| enabled | Boolean | DEFAULT true | Habilitado |
| public | Boolean | DEFAULT false | Público |
| createdAt | DateTime | DEFAULT now() | Fecha de creación |
| updatedAt | DateTime | AUTO UPDATE | Fecha de actualización |

**Relaciones:**
- `executions`: MCPExecution[] (1:N)

---

### 7. MCPExecution

**Tabla:** `mcp_executions`
**Descripción:** Ejecuciones de MCPs

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | String | PK, cuid() | ID único |
| mcpId | String | FK MCP | ID del MCP |
| userId | String | FK User | ID del usuario |
| inputData | String | NOT NULL | Input (JSON) |
| outputData | String | NULL | Output (JSON) |
| success | Boolean | NOT NULL | Éxito |
| errorMessage | String | NULL | Mensaje de error |
| executionTimeMs | Int | NULL | Tiempo de ejecución (ms) |
| userFeedback | String | NULL | Feedback del usuario |
| feedbackComment | String | NULL | Comentario feedback |
| triggeredBy | String | NULL | Disparado por |
| createdAt | DateTime | DEFAULT now() | Fecha de creación |

**Relaciones:**
- `mcp`: MCP (N:1, CASCADE delete)
- `user`: User (N:1, CASCADE delete)

---

### 8. Message

**Tabla:** `messages`
**Descripción:** Mensajes (WhatsApp/Email/SMS)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | String | PK, cuid() | ID único |
| userId | String | FK User | ID del usuario |
| contactId | String | FK Contact | ID del contacto |
| platform | String | NOT NULL | Plataforma |
| direction | String | NOT NULL | Dirección |
| content | String | NOT NULL | Contenido |
| subject | String | NULL | Asunto (emails) |
| mediaUrl | String | NULL | URL de media |
| mediaType | String | NULL | Tipo de media |
| status | String | DEFAULT "SENT" | Estado |
| read | Boolean | DEFAULT false | Leído |
| readAt | DateTime | NULL | Leído en |
| externalId | String | NULL | ID externo |
| errorMessage | String | NULL | Mensaje de error |
| threadId | String | NULL | ID del thread |
| createdAt | DateTime | DEFAULT now() | Fecha de creación |
| updatedAt | DateTime | AUTO UPDATE | Fecha de actualización |

**Relaciones:**
- `user`: User (N:1, CASCADE delete)
- `contact`: Contact (N:1, CASCADE delete)

---

### 9. Contact

**Tabla:** `contacts`
**Descripción:** Contactos del usuario

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | String | PK, cuid() | ID único |
| userId | String | FK User | ID del usuario |
| deviceId | String | NULL | ID del dispositivo |
| name | String | NOT NULL | Nombre |
| nickname | String | NULL | Apodo |
| phoneNumbers | String | DEFAULT "[]" | Teléfonos (JSON) |
| emails | String | DEFAULT "[]" | Emails (JSON) |
| avatarUrl | String | NULL | URL del avatar |
| tags | String | DEFAULT "[]" | Tags (JSON) |
| notes | String | NULL | Notas |
| messageCount | Int | DEFAULT 0 | Contador de mensajes |
| lastContactAt | DateTime | NULL | Último contacto |
| hasWhatsApp | Boolean | DEFAULT false | Tiene WhatsApp |
| syncedAt | DateTime | NULL | Sincronizado en |
| source | String | NULL | Fuente |
| createdAt | DateTime | DEFAULT now() | Fecha de creación |
| updatedAt | DateTime | AUTO UPDATE | Fecha de actualización |

**Relaciones:**
- `user`: User (N:1, CASCADE delete)
- `messages`: Message[] (1:N)

---

### 10. LocationLog

**Tabla:** `location_logs`
**Descripción:** Logs de ubicación del usuario

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | String | PK, cuid() | ID único |
| userId | String | FK User | ID del usuario |
| latitude | Float | NOT NULL | Latitud |
| longitude | Float | NOT NULL | Longitud |
| accuracy | Float | NULL | Precisión |
| altitude | Float | NULL | Altitud |
| speed | Float | NULL | Velocidad |
| eventId | String | FK Event, NULL | ID del evento |
| action | String | NULL | Acción |
| address | String | NULL | Dirección |
| createdAt | DateTime | DEFAULT now() | Fecha de creación |

**Relaciones:**
- `user`: User (N:1, CASCADE delete)
- `event`: Event (N:1, SET NULL)

---

### 11. Place

**Tabla:** `places`
**Descripción:** Lugares guardados

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | String | PK, cuid() | ID único |
| userId | String | FK User, NULL | ID del usuario |
| name | String | NOT NULL | Nombre |
| address | String | NOT NULL | Dirección |
| latitude | Float | NOT NULL | Latitud |
| longitude | Float | NOT NULL | Longitud |
| placeId | String | UNIQUE, NULL | Google Place ID |
| placeType | String | NULL | Tipo de lugar |
| openingHours | String | NULL | Horarios (JSON) |
| phone | String | NULL | Teléfono |
| website | String | NULL | Sitio web |
| rating | Float | NULL | Rating |
| priceLevel | Int | NULL | Nivel de precio |
| visitCount | Int | DEFAULT 0 | Contador de visitas |
| lastVisitAt | DateTime | NULL | Última visita |
| lastFetchedAt | DateTime | NULL | Última actualización |
| createdAt | DateTime | DEFAULT now() | Fecha de creación |
| updatedAt | DateTime | AUTO UPDATE | Fecha de actualización |

**Relaciones:**
- `user`: User (N:1, SET NULL)
- `events`: Event[] (1:N)

**Índices:**
- UNIQUE: placeId

---

### 12. VoiceSession

**Tabla:** `voice_sessions`
**Descripción:** Sesiones de voz del usuario

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | String | PK, cuid() | ID único |
| userId | String | FK User | ID del usuario |
| transcript | String | NOT NULL | Transcripción |
| intent | String | NULL | Intención detectada |
| entities | String | NULL | Entidades (JSON) |
| response | String | NULL | Respuesta |
| confidence | Float | NULL | Confianza |
| successful | Boolean | DEFAULT false | Exitoso |
| duration | Int | NULL | Duración (ms) |
| previousSessionId | String | NULL | Sesión anterior |
| contextData | String | NULL | Contexto (JSON) |
| audioUrl | String | NULL | URL del audio |
| createdAt | DateTime | DEFAULT now() | Fecha de creación |

**Relaciones:**
- `user`: User (N:1, CASCADE delete)

---

### 13. Context

**Tabla:** `contexts`
**Descripción:** Contexto de IA de entidades

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | String | PK, cuid() | ID único |
| userId | String | FK User | ID del usuario |
| entityId | String | UNIQUE, NOT NULL | ID de la entidad |
| entityType | String | NOT NULL | Tipo de entidad |
| temporal | String | NOT NULL | Contexto temporal (JSON) |
| spatial | String | NOT NULL | Contexto espacial (JSON) |
| priority | String | NOT NULL | Contexto prioridad (JSON) |
| relational | String | NOT NULL | Contexto relacional (JSON) |
| intentional | String | NOT NULL | Contexto intencional (JSON) |
| contextScore | Float | DEFAULT 50 | Score de contexto |
| version | Int | DEFAULT 1 | Versión |
| lastUpdated | DateTime | DEFAULT now() | Última actualización |
| createdAt | DateTime | DEFAULT now() | Fecha de creación |
| updatedAt | DateTime | AUTO UPDATE | Fecha de actualización |

**Relaciones:**
- `user`: User (N:1, CASCADE delete)

**Índices:**
- UNIQUE: entityId
- INDEX: (userId, contextScore)
- INDEX: (userId, entityType)
- INDEX: entityId

---

### 14. Cluster

**Tabla:** `clusters`
**Descripción:** Clustering inteligente de tareas/eventos

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | String | PK, cuid() | ID único |
| userId | String | FK User | ID del usuario |
| name | String | NOT NULL | Nombre |
| description | String | NULL | Descripción |
| type | String | NOT NULL | Tipo de cluster |
| color | String | NULL | Color |
| icon | String | NULL | Icono |
| centroid | String | NULL | Centroide (JSON) |
| cohesion | Float | DEFAULT 0 | Cohesión |
| size | Int | DEFAULT 0 | Tamaño |
| autoGenerated | Boolean | DEFAULT false | Auto-generado |
| createdAt | DateTime | DEFAULT now() | Fecha de creación |
| updatedAt | DateTime | AUTO UPDATE | Fecha de actualización |

**Relaciones:**
- `user`: User (N:1, CASCADE delete)

**Índices:**
- INDEX: (userId, type)
- INDEX: (userId, autoGenerated)

---

### 15. Action

**Tabla:** `actions`
**Descripción:** Acciones sugeridas por IA

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | String | PK, cuid() | ID único |
| userId | String | FK User | ID del usuario |
| triggerId | String | NOT NULL | ID del trigger |
| triggerType | String | NOT NULL | Tipo de trigger |
| actionType | String | NOT NULL | Tipo de acción |
| targetEntityId | String | NOT NULL | ID entidad objetivo |
| targetEntityType | String | NOT NULL | Tipo entidad objetivo |
| title | String | NOT NULL | Título |
| description | String | NOT NULL | Descripción |
| reasoning | String | NOT NULL | Razonamiento (JSON) |
| confidence | Float | NOT NULL | Confianza |
| isAutomatic | Boolean | DEFAULT false | Automática |
| requiresConfirmation | Boolean | DEFAULT true | Requiere confirmación |
| payload | String | NOT NULL | Payload (JSON) |
| state | String | DEFAULT "PENDING" | Estado |
| userFeedback | String | NULL | Feedback usuario |
| createdAt | DateTime | DEFAULT now() | Fecha de creación |
| executedAt | DateTime | NULL | Ejecutado en |
| expiresAt | DateTime | NULL | Expira en |

**Relaciones:**
- `user`: User (N:1, CASCADE delete)

**Índices:**
- INDEX: (userId, state, createdAt)
- INDEX: (userId, targetEntityId)
- INDEX: (state, expiresAt)

---

### 16. InteractionLog

**Tabla:** `interaction_logs`
**Descripción:** Historial de interacciones del usuario

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | String | PK, cuid() | ID único |
| userId | String | FK User | ID del usuario |
| action | String | NOT NULL | Acción |
| entityId | String | NULL | ID de la entidad |
| entityType | String | NULL | Tipo de entidad |
| duration | Int | NOT NULL | Duración (ms) |
| contextSnapshot | String | NULL | Snapshot de contexto (JSON) |
| metadata | String | NULL | Metadata (JSON) |
| timestamp | DateTime | DEFAULT now() | Timestamp |

**Relaciones:**
- `user`: User (N:1, CASCADE delete)

**Índices:**
- INDEX: (userId, timestamp)
- INDEX: (userId, action)
- INDEX: entityId

---

### 17. Pattern

**Tabla:** `patterns`
**Descripción:** Patrones de comportamiento detectados

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | String | PK, cuid() | ID único |
| userId | String | FK User | ID del usuario |
| sequence | String | NOT NULL | Secuencia (JSON) |
| frequency | Int | DEFAULT 1 | Frecuencia |
| confidence | Float | DEFAULT 0 | Confianza |
| typicalContext | String | NULL | Contexto típico (JSON) |
| lastOccurred | DateTime | NOT NULL | Última ocurrencia |
| createdAt | DateTime | DEFAULT now() | Fecha de creación |
| updatedAt | DateTime | AUTO UPDATE | Fecha de actualización |

**Relaciones:**
- `user`: User (N:1, CASCADE delete)

**Índices:**
- INDEX: (userId, frequency)
- INDEX: (userId, lastOccurred)

---

### 18. UserFeedback

**Tabla:** `user_feedbacks`
**Descripción:** Feedback del usuario sobre predicciones

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | String | PK, cuid() | ID único |
| userId | String | FK User | ID del usuario |
| predictionId | String | NULL | ID de la predicción |
| predictionType | String | NOT NULL | Tipo de predicción |
| wasCorrect | Boolean | NOT NULL | Fue correcto |
| actualAction | String | NULL | Acción real |
| actualOutcome | String | NULL | Resultado real (JSON) |
| comment | String | NULL | Comentario |
| timestamp | DateTime | DEFAULT now() | Timestamp |

**Relaciones:**
- `user`: User (N:1, CASCADE delete)

**Índices:**
- INDEX: (userId, predictionType)
- INDEX: predictionId

---

### 19. AppUsageLog

**Tabla:** `app_usage_logs`
**Descripción:** Logs de uso de la aplicación

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | String | PK, cuid() | ID único |
| userId | String | NOT NULL | ID del usuario |
| action | String | NOT NULL | Acción |
| screen | String | NULL | Pantalla |
| metadata | String | NULL | Metadata (JSON) |
| createdAt | DateTime | DEFAULT now() | Fecha de creación |

---

## 🔄 Migración SQLite → PostgreSQL

### Cambios Necesarios en el Schema

```prisma
// Cambiar en schema.prisma:

datasource db {
  provider = "postgresql"  // Cambiar de "sqlite" a "postgresql"
  url      = env("DATABASE_URL")
}
```

### Variables de Entorno

```env
# Desarrollo (SQLite)
DATABASE_URL="file:./dev.db"

# Producción (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/kaia_db?schema=public"
```

### Script de Migración

```bash
# 1. Crear backup de SQLite
cd backend
cp prisma/dev.db prisma/dev.db.backup

# 2. Actualizar schema.prisma (cambiar provider)

# 3. Crear migración inicial para PostgreSQL
npx prisma migrate dev --name init_postgresql

# 4. Exportar datos de SQLite (usar herramienta de conversión)
# Recomendado: pgloader o script custom

# 5. Importar datos a PostgreSQL

# 6. Verificar datos
npx prisma studio
```

### Consideraciones Importantes

1. **Tipos de datos:** SQLite y PostgreSQL tienen diferencias en tipos
2. **IDs:** cuid() funciona igual en ambos
3. **JSON:** PostgreSQL tiene soporte nativo de JSON (mejor performance)
4. **Índices:** Se mantienen igual
5. **Constraints:** PostgreSQL es más estricto

---

## 📊 Estadísticas del Schema

| Métrica | Valor |
|---------|-------|
| Total de modelos | 19 |
| Total de campos | 287 |
| Total de relaciones | 23 |
| Total de índices | 28 |
| Campos JSON | 24 |
| Foreign Keys | 23 |
| Unique constraints | 5 |

---

## 🔍 Queries Útiles

### Obtener usuario con todas sus relaciones

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    preferences: true,
    events: true,
    reminders: true,
    alarms: true,
    contexts: true,
    clusters: true,
    actions: true
  }
})
```

### Obtener eventos con contexto de IA

```typescript
const events = await prisma.event.findMany({
  where: { userId },
  include: {
    place: true,
    reminders: true
  }
})

// Luego obtener contexto
const contexts = await prisma.context.findMany({
  where: {
    entityId: { in: events.map(e => e.id) },
    entityType: 'EVENT'
  }
})
```

### Obtener acciones pendientes

```typescript
const pendingActions = await prisma.action.findMany({
  where: {
    userId,
    state: 'PENDING',
    expiresAt: { gte: new Date() }
  },
  orderBy: { confidence: 'desc' }
})
```

---

## 📝 Notas de Implementación

1. **Soft Delete:** Actualmente no implementado, pero se puede agregar campo `deletedAt`
2. **Audit Trail:** Considerar agregar `createdBy` y `updatedBy`
3. **Particionamiento:** Para producción, considerar particionar `InteractionLog` y `LocationLog` por fecha
4. **Archivado:** Implementar estrategia de archivado para datos antiguos

---

**Versión:** 1.0.0
**Última actualización:** 5 de octubre, 2025
**Mantenido por:** Equipo Kaia
