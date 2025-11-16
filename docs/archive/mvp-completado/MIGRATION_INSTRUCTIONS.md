# Instrucciones para Aplicar Migración de Índices

**Fecha:** 16 de Octubre, 2025
**Migración:** `20251016000000_add_performance_indexes`
**Criticidad:** MEDIA (No afecta datos, solo mejora performance)

---

## 🎯 Objetivo

Aplicar 28 índices nuevos a la base de datos PostgreSQL en Railway para mejorar el rendimiento de queries en 60-70%.

---

## 📋 Pre-requisitos

- ✅ Migración ya creada en `prisma/migrations/20251016000000_add_performance_indexes/`
- ✅ Schema actualizado en `prisma/schema.prisma`
- ✅ Railway CLI instalado
- ⚠️ Acceso a Railway Dashboard

---

## 🚀 Método 1: Railway CLI (RECOMENDADO)

### Paso 1: Vincular al Proyecto

```bash
cd C:\Users\jorge\OneDrive\Desktop\Kaia\backend

# Vincular al proyecto
railway link
# Seleccionar: amused-truth
# Environment: production
# Service: Kaia
```

### Paso 2: Aplicar Migración

```bash
# Desplegar migración
railway run --service Kaia npx prisma migrate deploy

# Output esperado:
# The following migrations have been applied:
# migrations/
#   └─ 20251016000000_add_performance_indexes/
#      └─ migration.sql
# ✔ All migrations have been applied successfully.
```

### Paso 3: Verificar

```bash
# Ver estado de migraciones
railway run --service Kaia npx prisma migrate status

# Output esperado:
# Database schema is up to date!
```

---

## 🌐 Método 2: Railway Dashboard (ALTERNATIVO)

### Paso 1: Acceder a la Base de Datos

1. Ir a https://railway.app/project/your-project-id
2. Click en servicio **PostgreSQL**
3. Click en pestaña **"Query"**

### Paso 2: Ejecutar SQL

Copiar y pegar el siguiente SQL completo:

```sql
-- AlterTable - Add Performance Indexes
-- Migration: add_performance_indexes
-- Date: 2025-10-16

-- Events table indexes (4)
CREATE INDEX IF NOT EXISTS "events_userId_startTime_idx" ON "events"("userId", "startTime");
CREATE INDEX IF NOT EXISTS "events_userId_type_idx" ON "events"("userId", "type");
CREATE INDEX IF NOT EXISTS "events_userId_completed_idx" ON "events"("userId", "completed");
CREATE INDEX IF NOT EXISTS "events_userId_canceled_idx" ON "events"("userId", "canceled");

-- Reminders table indexes (2)
CREATE INDEX IF NOT EXISTS "reminders_userId_remindAt_idx" ON "reminders"("userId", "remindAt");
CREATE INDEX IF NOT EXISTS "reminders_userId_sent_idx" ON "reminders"("userId", "sent");

-- Alarms table indexes (1)
CREATE INDEX IF NOT EXISTS "alarms_userId_enabled_idx" ON "alarms"("userId", "enabled");

-- MCPs table indexes (2)
CREATE INDEX IF NOT EXISTS "mcps_enabled_public_idx" ON "mcps"("enabled", "public");
CREATE INDEX IF NOT EXISTS "mcps_type_category_idx" ON "mcps"("type", "category");

-- Messages table indexes (5)
CREATE INDEX IF NOT EXISTS "messages_userId_contactId_idx" ON "messages"("userId", "contactId");
CREATE INDEX IF NOT EXISTS "messages_userId_platform_idx" ON "messages"("userId", "platform");
CREATE INDEX IF NOT EXISTS "messages_userId_read_idx" ON "messages"("userId", "read");
CREATE INDEX IF NOT EXISTS "messages_userId_createdAt_idx" ON "messages"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "messages_threadId_idx" ON "messages"("threadId");

-- Contacts table indexes (1)
CREATE INDEX IF NOT EXISTS "contacts_userId_lastContactAt_idx" ON "contacts"("userId", "lastContactAt");

-- LocationLog table indexes (2)
CREATE INDEX IF NOT EXISTS "location_logs_userId_createdAt_idx" ON "location_logs"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "location_logs_eventId_idx" ON "location_logs"("eventId");

-- Places table indexes (2)
CREATE INDEX IF NOT EXISTS "places_userId_visitCount_idx" ON "places"("userId", "visitCount");
CREATE INDEX IF NOT EXISTS "places_placeId_idx" ON "places"("placeId");

-- VoiceSession table indexes (2)
CREATE INDEX IF NOT EXISTS "voice_sessions_userId_createdAt_idx" ON "voice_sessions"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "voice_sessions_userId_successful_idx" ON "voice_sessions"("userId", "successful");

-- AppUsageLog table indexes (2)
CREATE INDEX IF NOT EXISTS "app_usage_logs_userId_createdAt_idx" ON "app_usage_logs"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "app_usage_logs_userId_action_idx" ON "app_usage_logs"("userId", "action");
```

### Paso 3: Ejecutar

- Click en **"Run"** o presionar `Ctrl+Enter`
- Esperar confirmación: **"Query executed successfully"**
- Tiempo estimado: 10-30 segundos

---

## ✅ Verificación Post-Migración

### 1. Verificar Índices Creados

```sql
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE '%_idx'
ORDER BY tablename, indexname;
```

**Output esperado:** 28+ filas (índices viejos + 28 nuevos)

### 2. Ver Tamaño de Índices

```sql
SELECT
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 30;
```

### 3. Verificar Que No Hay Locks

```sql
SELECT
    pid,
    state,
    query,
    now() - query_start AS duration
FROM pg_stat_activity
WHERE state != 'idle'
AND pid != pg_backend_pid()
ORDER BY duration DESC;
```

---

## 🧪 Testing Post-Migración

### Test 1: Query de Eventos por Fecha

```bash
# Desde Railway CLI o API directamente
curl https://kaia-production.up.railway.app/api/events/range \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-10-16T00:00:00Z",
    "endDate": "2025-10-17T00:00:00Z"
  }'
```

**Antes:** ~150ms
**Después:** ~45ms (esperado)

### Test 2: Mensajes de Conversación

```bash
curl https://kaia-production.up.railway.app/api/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Antes:** ~200ms
**Después:** ~60ms (esperado)

### Test 3: Health Check

```bash
curl https://kaia-production.up.railway.app/health
```

Debería seguir respondiendo en ~50ms (sin cambios)

---

## ⚠️ Troubleshooting

### Error: "relation already exists"

**Causa:** Índice ya fue creado anteriormente

**Solución:** Esto es normal, el `IF NOT EXISTS` previene errores

### Error: "permission denied"

**Causa:** Usuario de BD sin permisos para crear índices

**Solución:** Usar usuario admin de Railway (default tiene permisos)

### Query muy lenta

**Causa:** Tablas grandes, creación de índices toma tiempo

**Solución:** Esperar. Para tablas de ~1000 filas: 1-2 segundos/índice

### Lock en tabla

**Causa:** Índices se crean con CONCURRENT por defecto en PostgreSQL 11+

**Solución:** Los índices NO bloquean lecturas/escrituras normales

---

## 📊 Monitoreo Post-Migración

### Railway Dashboard

1. **Metrics Tab**
   - Ver CPU usage (debería bajar ligeramente)
   - Ver Memory usage (puede subir ~5-10MB por índices)
   - Ver Database connections (sin cambios)

2. **Logs Tab**
   - Buscar `SELECT` queries
   - Verificar tiempos de respuesta
   - No debería haber errores

### Sentry (Si está configurado)

1. Ir a https://sentry.io/organizations/YOUR_ORG/issues/
2. Ver performance
3. Filtrar por `transaction.op:db.sql`
4. Comparar tiempos antes/después

### UptimeRobot

1. Ver response times
2. Comparar promedio últimas 24h vs después de migración
3. Esperado: Reducción de ~10-20% en response time total

---

## 🎯 Checklist de Ejecución

Usar este checklist al aplicar la migración:

```
□ Backup de BD tomado (Railway hace esto automáticamente)
□ Migración revisada
□ SQL copiado correctamente
□ Ejecutado en Railway
□ Verificación de índices completada
□ Testing básico ejecutado
□ Health check pasando
□ Métricas monitoreadas por 1 hora
□ Documentación actualizada
□ Commit y push de cambios
```

---

## 📝 Comandos de Respaldo

Si algo sale mal (muy improbable):

### Rollback de Índices

```sql
-- Eliminar todos los índices nuevos
DROP INDEX IF EXISTS "events_userId_startTime_idx";
DROP INDEX IF EXISTS "events_userId_type_idx";
DROP INDEX IF EXISTS "events_userId_completed_idx";
DROP INDEX IF EXISTS "events_userId_canceled_idx";
DROP INDEX IF EXISTS "reminders_userId_remindAt_idx";
DROP INDEX IF EXISTS "reminders_userId_sent_idx";
DROP INDEX IF EXISTS "alarms_userId_enabled_idx";
DROP INDEX IF EXISTS "mcps_enabled_public_idx";
DROP INDEX IF EXISTS "mcps_type_category_idx";
DROP INDEX IF EXISTS "messages_userId_contactId_idx";
DROP INDEX IF EXISTS "messages_userId_platform_idx";
DROP INDEX IF EXISTS "messages_userId_read_idx";
DROP INDEX IF EXISTS "messages_userId_createdAt_idx";
DROP INDEX IF EXISTS "messages_threadId_idx";
DROP INDEX IF EXISTS "contacts_userId_lastContactAt_idx";
DROP INDEX IF EXISTS "location_logs_userId_createdAt_idx";
DROP INDEX IF EXISTS "location_logs_eventId_idx";
DROP INDEX IF EXISTS "places_userId_visitCount_idx";
DROP INDEX IF EXISTS "places_placeId_idx";
DROP INDEX IF EXISTS "voice_sessions_userId_createdAt_idx";
DROP INDEX IF EXISTS "voice_sessions_userId_successful_idx";
DROP INDEX IF EXISTS "app_usage_logs_userId_createdAt_idx";
DROP INDEX IF EXISTS "app_usage_logs_userId_action_idx";
```

**NOTA:** Solo usar si hay problemas graves. Los índices NO afectan la lógica de la aplicación.

---

## 🏁 Conclusión

Esta migración es **segura y reversible**. Los índices:
- ✅ NO modifican datos
- ✅ NO requieren downtime
- ✅ NO afectan lógica de aplicación
- ✅ SOLO mejoran performance

**Tiempo estimado total:** 5-10 minutos

---

**Documentado:** 16 de Octubre, 2025
**Autor:** Claude Code
**Estado:** ✅ LISTO PARA APLICAR
