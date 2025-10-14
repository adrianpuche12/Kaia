# 🚀 Guía de Migración: SQLite → PostgreSQL

**Versión:** 1.0.0
**Fecha:** 5 de octubre, 2025
**Autor:** Equipo Kaia

---

## 📋 Resumen

Esta guía te ayudará a migrar la base de datos de Kaia desde SQLite (desarrollo) a PostgreSQL (producción) sin pérdida de datos.

**Tiempo estimado:** 2-3 horas
**Dificultad:** Media
**Requiere:** Acceso a servidor PostgreSQL

---

## ✅ Pre-requisitos

- [ ] Servidor PostgreSQL 14+ instalado y corriendo
- [ ] Credenciales de acceso a PostgreSQL
- [ ] Backup completo de SQLite actual
- [ ] Node.js y npm instalados
- [ ] Prisma CLI instalado

---

## 📊 Diferencias SQLite vs PostgreSQL

| Característica | SQLite | PostgreSQL |
|----------------|--------|------------|
| Tipo de datos | Flexible | Estricto |
| JSON | Texto | JSON nativo |
| Concurrent writes | No | Sí |
| Performance | Limitado | Alto |
| Escalabilidad | Baja | Alta |
| Transacciones | Sí | Sí (avanzadas) |

---

## 🔧 Paso 1: Preparación

### 1.1 Crear Backup de SQLite

```bash
cd backend

# Backup de la base de datos
cp prisma/dev.db prisma/dev.db.backup-$(date +%Y%m%d)

# Backup del schema
cp prisma/schema.prisma prisma/schema.prisma.backup
```

### 1.2 Exportar Datos de SQLite

Opción A - Usando Prisma Studio:

```bash
npx prisma studio
# Exportar manualmente cada tabla a JSON
```

Opción B - Usando script (recomendado):

```bash
# Crear script de exportación
node scripts/export-sqlite-data.js
```

**Archivo:** `scripts/export-sqlite-data.js`

```javascript
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  const data = {
    users: await prisma.user.findMany({ include: { preferences: true } }),
    events: await prisma.event.findMany(),
    reminders: await prisma.reminder.findMany(),
    alarms: await prisma.alarm.findMany(),
    contacts: await prisma.contact.findMany(),
    messages: await prisma.message.findMany(),
    places: await prisma.place.findMany(),
    voiceSessions: await prisma.voiceSession.findMany(),
    mcps: await prisma.mCP.findMany(),
    mcpExecutions: await prisma.mCPExecution.findMany(),
    locationLogs: await prisma.locationLog.findMany(),
    contexts: await prisma.context.findMany(),
    clusters: await prisma.cluster.findMany(),
    actions: await prisma.action.findMany(),
    interactionLogs: await prisma.interactionLog.findMany(),
    patterns: await prisma.pattern.findMany(),
    userFeedbacks: await prisma.userFeedback.findMany(),
    appUsageLogs: await prisma.appUsageLog.findMany(),
  };

  fs.writeFileSync(
    'data-export.json',
    JSON.stringify(data, null, 2)
  );

  console.log('✅ Datos exportados a data-export.json');
  await prisma.$disconnect();
}

exportData().catch(console.error);
```

Ejecutar:

```bash
node scripts/export-sqlite-data.js
```

---

## 🗄️ Paso 2: Configurar PostgreSQL

### 2.1 Crear Base de Datos en PostgreSQL

```sql
-- Conectarse a PostgreSQL
psql -U postgres

-- Crear base de datos
CREATE DATABASE kaia_db;

-- Crear usuario (opcional)
CREATE USER kaia_user WITH PASSWORD 'tu_password_seguro';

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE kaia_db TO kaia_user;

-- Salir
\q
```

### 2.2 Configurar Variables de Entorno

**Archivo:** `.env.production`

```env
# PostgreSQL Production
DATABASE_URL="postgresql://kaia_user:tu_password_seguro@localhost:5432/kaia_db?schema=public"

# O si usas servicio cloud:
# DATABASE_URL="postgresql://user:password@host.railway.app:5432/railway?sslmode=require"
```

---

## 🔄 Paso 3: Actualizar Schema Prisma

### 3.1 Modificar datasource

**Archivo:** `prisma/schema.prisma`

Cambiar de:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

A:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3.2 Ajustes de Tipos (si es necesario)

PostgreSQL es más estricto con tipos. Revisar:

```prisma
// SQLite acepta esto:
field String @default("")

// PostgreSQL también, pero mejor usar:
field String?  // nullable

// JSON en PostgreSQL (mejor performance):
field Json  // en vez de String para JSON
```

**Para nuestro schema actual NO hay cambios necesarios** ✅

---

## 🚀 Paso 4: Crear Migración PostgreSQL

### 4.1 Generar Migración Inicial

```bash
# Asegurar que usamos .env.production
export DATABASE_URL="postgresql://user:pass@host:5432/kaia_db"

# Crear migración inicial
npx prisma migrate dev --name init_postgresql

# Esto creará las tablas en PostgreSQL
```

### 4.2 Verificar Tablas Creadas

```bash
# Conectarse a PostgreSQL
psql -U kaia_user -d kaia_db

# Listar tablas
\dt

# Debería mostrar:
# users
# user_preferences
# events
# reminders
# alarms
# contacts
# messages
# places
# voice_sessions
# mcps
# mcp_executions
# location_logs
# contexts
# clusters
# actions
# interaction_logs
# patterns
# user_feedbacks
# app_usage_logs
```

---

## 📥 Paso 5: Importar Datos

### 5.1 Script de Importación

**Archivo:** `scripts/import-to-postgresql.js`

```javascript
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importData() {
  const data = JSON.parse(fs.readFileSync('data-export.json', 'utf8'));

  console.log('🚀 Iniciando importación...');

  // IMPORTANTE: Importar en orden respetando FK

  // 1. Usuarios
  console.log('📝 Importando usuarios...');
  for (const user of data.users) {
    const { preferences, ...userData } = user;
    await prisma.user.create({
      data: {
        ...userData,
        preferences: preferences ? {
          create: preferences
        } : undefined
      }
    });
  }

  // 2. Lugares (antes de eventos)
  console.log('📍 Importando lugares...');
  for (const place of data.places) {
    await prisma.place.create({ data: place });
  }

  // 3. Eventos
  console.log('📅 Importando eventos...');
  for (const event of data.events) {
    await prisma.event.create({ data: event });
  }

  // 4. Recordatorios
  console.log('⏰ Importando recordatorios...');
  for (const reminder of data.reminders) {
    await prisma.reminder.create({ data: reminder });
  }

  // 5. Alarmas
  console.log('⏰ Importando alarmas...');
  for (const alarm of data.alarms) {
    await prisma.alarm.create({ data: alarm });
  }

  // 6. Contactos
  console.log('👥 Importando contactos...');
  for (const contact of data.contacts) {
    await prisma.contact.create({ data: contact });
  }

  // 7. Mensajes
  console.log('💬 Importando mensajes...');
  for (const message of data.messages) {
    await prisma.message.create({ data: message });
  }

  // 8. Sesiones de voz
  console.log('🎤 Importando sesiones de voz...');
  for (const session of data.voiceSessions) {
    await prisma.voiceSession.create({ data: session });
  }

  // 9. MCPs
  console.log('🔌 Importando MCPs...');
  for (const mcp of data.mcps) {
    await prisma.mCP.create({ data: mcp });
  }

  // 10. Ejecuciones MCP
  console.log('⚡ Importando ejecuciones MCP...');
  for (const execution of data.mcpExecutions) {
    await prisma.mCPExecution.create({ data: execution });
  }

  // 11. Location Logs
  console.log('📍 Importando location logs...');
  for (const log of data.locationLogs) {
    await prisma.locationLog.create({ data: log });
  }

  // 12. Contextos IA
  console.log('🤖 Importando contextos...');
  for (const context of data.contexts) {
    await prisma.context.create({ data: context });
  }

  // 13. Clusters
  console.log('📊 Importando clusters...');
  for (const cluster of data.clusters) {
    await prisma.cluster.create({ data: cluster });
  }

  // 14. Acciones
  console.log('⚡ Importando acciones...');
  for (const action of data.actions) {
    await prisma.action.create({ data: action });
  }

  // 15. Interaction Logs
  console.log('📝 Importando interaction logs...');
  for (const log of data.interactionLogs) {
    await prisma.interactionLog.create({ data: log });
  }

  // 16. Patterns
  console.log('🔍 Importando patrones...');
  for (const pattern of data.patterns) {
    await prisma.pattern.create({ data: pattern });
  }

  // 17. User Feedback
  console.log('💬 Importando feedback...');
  for (const feedback of data.userFeedbacks) {
    await prisma.userFeedback.create({ data: feedback });
  }

  // 18. App Usage Logs
  console.log('📊 Importando app usage logs...');
  for (const log of data.appUsageLogs) {
    await prisma.appUsageLog.create({ data: log });
  }

  console.log('✅ Importación completada!');
  await prisma.$disconnect();
}

importData().catch((error) => {
  console.error('❌ Error en importación:', error);
  process.exit(1);
});
```

### 5.2 Ejecutar Importación

```bash
# Asegurar que DATABASE_URL apunta a PostgreSQL
export DATABASE_URL="postgresql://user:pass@host:5432/kaia_db"

# Ejecutar importación
node scripts/import-to-postgresql.js
```

---

## ✅ Paso 6: Verificación

### 6.1 Verificar Conteo de Registros

```bash
npx prisma studio
```

Comparar conteos:

```sql
-- En PostgreSQL
SELECT
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM events) as events,
  (SELECT COUNT(*) FROM contacts) as contacts;
```

### 6.2 Test de Funcionalidad

```bash
# Probar que el backend funciona con PostgreSQL
npm run dev

# Test de API
curl http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Password123!"}'
```

---

## 🔧 Paso 7: Optimización PostgreSQL

### 7.1 Crear Índices Adicionales

```sql
-- Índices para mejor performance
CREATE INDEX idx_events_user_start ON events(user_id, start_time);
CREATE INDEX idx_contexts_score ON contexts(user_id, context_score);
CREATE INDEX idx_actions_state ON actions(user_id, state, created_at);
CREATE INDEX idx_interaction_logs_time ON interaction_logs(user_id, timestamp);
```

### 7.2 Configurar VACUUM y ANALYZE

```sql
-- Optimizar tablas
VACUUM ANALYZE users;
VACUUM ANALYZE events;
VACUUM ANALYZE contexts;
```

---

## 🚨 Troubleshooting

### Error: "relation does not exist"

```bash
# Regenerar cliente Prisma
npx prisma generate

# Verificar migraciones
npx prisma migrate status
```

### Error: "password authentication failed"

```bash
# Verificar credenciales en .env
echo $DATABASE_URL

# Probar conexión manual
psql -U user -h host -d kaia_db
```

### Error: Foreign key constraint

```bash
# Importar en orden correcto (ver script)
# Verificar que todas las referencias existan antes
```

---

## 📋 Checklist Final

- [ ] Backup de SQLite creado
- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos `kaia_db` creada
- [ ] Schema Prisma actualizado a `postgresql`
- [ ] Migración ejecutada exitosamente
- [ ] Datos importados completamente
- [ ] Conteo de registros coincide
- [ ] Backend funciona con PostgreSQL
- [ ] Tests de API pasan
- [ ] Índices creados
- [ ] Performance aceptable

---

## 🌐 Despliegue en Producción

### Railway.app

```bash
# 1. Crear proyecto en Railway
railway init

# 2. Agregar PostgreSQL
railway add postgresql

# 3. Railway genera DATABASE_URL automáticamente

# 4. Deploy
railway up

# 5. Ejecutar migración
railway run npx prisma migrate deploy
```

### Render.com

```bash
# 1. Crear PostgreSQL en Render
# 2. Copiar DATABASE_URL
# 3. Agregar a variables de entorno
# 4. Deploy automático desde GitHub
```

### Supabase

```bash
# 1. Crear proyecto en Supabase
# 2. Obtener connection string
# 3. Actualizar .env
# 4. Ejecutar migraciones
```

---

## 📊 Monitoreo Post-Migración

```sql
-- Ver tamaño de tablas
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Ver queries lentas
SELECT * FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## 🔐 Seguridad

- [ ] Cambiar contraseña por defecto
- [ ] Configurar SSL/TLS
- [ ] Restringir IPs permitidas
- [ ] Configurar backup automático
- [ ] Habilitar logging de queries

---

## 📚 Referencias

- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Railway Deployment](https://docs.railway.app/)

---

**Versión:** 1.0.0
**Última actualización:** 5 de octubre, 2025
