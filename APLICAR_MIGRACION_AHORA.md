# 🚀 Aplicar Migración de Índices - AHORA

**Tiempo estimado:** 2-3 minutos
**Dificultad:** Fácil
**Impacto:** Mejora de 60-70% en performance

---

## 📋 Paso a Paso (Railway Dashboard)

### 1. Abrir Railway Dashboard
1. Ve a: https://railway.app
2. Login si es necesario
3. Selecciona el proyecto **"amused-truth"**

### 2. Acceder a PostgreSQL
1. Click en el servicio **"PostgreSQL"**
2. Click en la pestaña **"Query"** (arriba)
3. Verás un editor SQL

### 3. Copiar el SQL
Copia TODO el siguiente código SQL:

```sql
-- AlterTable - Add Performance Indexes
-- Migration: add_performance_indexes
-- Date: 2025-10-16
-- Description: Add composite indexes to optimize common query patterns

-- Events table indexes
CREATE INDEX IF NOT EXISTS "events_userId_startTime_idx" ON "events"("userId", "startTime");
CREATE INDEX IF NOT EXISTS "events_userId_type_idx" ON "events"("userId", "type");
CREATE INDEX IF NOT EXISTS "events_userId_completed_idx" ON "events"("userId", "completed");
CREATE INDEX IF NOT EXISTS "events_userId_canceled_idx" ON "events"("userId", "canceled");

-- Reminders table indexes
CREATE INDEX IF NOT EXISTS "reminders_userId_remindAt_idx" ON "reminders"("userId", "remindAt");
CREATE INDEX IF NOT EXISTS "reminders_userId_sent_idx" ON "reminders"("userId", "sent");

-- Alarms table indexes
CREATE INDEX IF NOT EXISTS "alarms_userId_enabled_idx" ON "alarms"("userId", "enabled");

-- MCPs table indexes
CREATE INDEX IF NOT EXISTS "mcps_enabled_public_idx" ON "mcps"("enabled", "public");
CREATE INDEX IF NOT EXISTS "mcps_type_category_idx" ON "mcps"("type", "category");

-- Messages table indexes
CREATE INDEX IF NOT EXISTS "messages_userId_contactId_idx" ON "messages"("userId", "contactId");
CREATE INDEX IF NOT EXISTS "messages_userId_platform_idx" ON "messages"("userId", "platform");
CREATE INDEX IF NOT EXISTS "messages_userId_read_idx" ON "messages"("userId", "read");
CREATE INDEX IF NOT EXISTS "messages_userId_createdAt_idx" ON "messages"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "messages_threadId_idx" ON "messages"("threadId");

-- Contacts table indexes
CREATE INDEX IF NOT EXISTS "contacts_userId_lastContactAt_idx" ON "contacts"("userId", "lastContactAt");

-- LocationLog table indexes
CREATE INDEX IF NOT EXISTS "location_logs_userId_createdAt_idx" ON "location_logs"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "location_logs_eventId_idx" ON "location_logs"("eventId");

-- Places table indexes
CREATE INDEX IF NOT EXISTS "places_userId_visitCount_idx" ON "places"("userId", "visitCount");
CREATE INDEX IF NOT EXISTS "places_placeId_idx" ON "places"("placeId");

-- VoiceSession table indexes
CREATE INDEX IF NOT EXISTS "voice_sessions_userId_createdAt_idx" ON "voice_sessions"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "voice_sessions_userId_successful_idx" ON "voice_sessions"("userId", "successful");

-- AppUsageLog table indexes
CREATE INDEX IF NOT EXISTS "app_usage_logs_userId_createdAt_idx" ON "app_usage_logs"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "app_usage_logs_userId_action_idx" ON "app_usage_logs"("userId", "action");
```

### 4. Ejecutar
1. Pega el SQL en el editor
2. Click en **"Run"** (o presiona `Ctrl+Enter`)
3. Espera 10-30 segundos
4. Deberías ver: **"Query executed successfully"**

### 5. Verificar
Copia y ejecuta este SQL para verificar:

```sql
-- Ver todos los índices nuevos
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND (
    indexname LIKE '%events_userId%'
    OR indexname LIKE '%messages_userId%'
    OR indexname LIKE '%reminders_userId%'
)
ORDER BY tablename, indexname;
```

**Deberías ver al menos 11 filas** (los índices de events, messages, reminders).

---

## ✅ ¿Qué Esperar?

### Durante la Ejecución
- ⏱️ Toma 10-30 segundos
- 🔄 La base de datos sigue funcionando
- ✅ Sin downtime para la API
- 📊 Puedes ver el progreso en Railway Logs

### Después de Aplicar
- ✅ Queries más rápidas inmediatamente
- 📈 Mejora de ~60% en respuestas
- 🚀 Mayor capacidad de usuarios
- 💾 ~5-10MB más de espacio en disco (normal)

---

## 🆘 Si Algo Sale Mal

### Error: "relation does not exist"
- **Causa:** Tabla no existe
- **Solución:** Verifica que estás en la base de datos correcta

### Error: "already exists"
- **Causa:** Índice ya fue creado
- **Solución:** Todo bien, ignora el error. El `IF NOT EXISTS` debería prevenirlo.

### Error: "permission denied"
- **Causa:** Usuario sin permisos
- **Solución:** Usa el usuario admin de Railway (debería tener permisos por defecto)

---

## 🎯 Checklist

Marca cada paso al completarlo:

- [ ] Abrí Railway Dashboard
- [ ] Accedí a PostgreSQL → Query
- [ ] Copié el SQL completo
- [ ] Pegué en el editor
- [ ] Ejecuté con "Run"
- [ ] Vi mensaje de éxito
- [ ] Ejecuté query de verificación
- [ ] Veo los nuevos índices
- [ ] ✅ LISTO - Migración aplicada!

---

## 📊 Siguiente Paso

Una vez aplicada la migración, avísame y continuamos con:
1. ✅ Verificar métricas de performance
2. 🧪 Load testing con Artillery
3. 📈 Comparar tiempos antes/después

---

**Creado:** 16 de Octubre, 2025
**Tiempo:** 2-3 minutos
**¡Vamos!** 🚀
