# 🏗️ Arquitectura de Ambientes - Desarrollo, Testing y Producción

**Fecha:** 19 de Octubre, 2025
**Objetivo:** Diseñar una arquitectura de 3 ambientes separados para Kaia
**Estado:** 📋 Diseño y Planificación

---

## 📊 RESUMEN EJECUTIVO

### ¿Por qué 3 ambientes?

**Problemas que resuelve:**
1. ✅ **Desarrollo seguro** - Experimentar sin romper producción
2. ✅ **Testing aislado** - Probar features antes de producción
3. ✅ **Datos separados** - No mezclar usuarios reales con pruebas
4. ✅ **Rollback rápido** - Si algo falla en producción
5. ✅ **CI/CD automatizado** - Deploy automático por ambiente
6. ✅ **Team collaboration** - Múltiples developers sin conflictos

### Ambientes propuestos:

```
DEVELOPMENT (dev)
└─ Desarrollo activo, cambios constantes, puede romperse

TESTING/STAGING (test)
└─ Pre-producción, testing final, versión candidata

PRODUCTION (prod)
└─ Usuarios reales, estable, solo versiones probadas
```

---

## 🌍 ARQUITECTURA GLOBAL DE AMBIENTES

### Vista General:

```
┌─────────────────────────────────────────────────────────────────┐
│                         DESARROLLO (dev)                          │
├─────────────────────────────────────────────────────────────────┤
│ Backend:     https://api-dev.kaia.ai       (Railway - Dev)      │
│ Database:    PostgreSQL Dev                (Railway)             │
│ Redis:       Redis Dev                     (Railway)             │
│ Mobile:      Expo Dev Client               (Local)               │
│ Web:         https://dev.kaia.ai           (Contabo)             │
│ Datos:       Ficticios/Mocks                                     │
│ Deploy:      Manual / Git push to dev      (Auto)                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      TESTING/STAGING (test)                       │
├─────────────────────────────────────────────────────────────────┤
│ Backend:     https://api-test.kaia.ai      (Railway - Test)     │
│ Database:    PostgreSQL Test               (Railway)             │
│ Redis:       Redis Test                    (Railway)             │
│ Mobile:      EAS Build Internal            (Expo)                │
│ Web:         https://test.kaia.ai          (Contabo)             │
│ Datos:       Realistas, no producción                            │
│ Deploy:      Git push to test branch       (Auto)                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       PRODUCCIÓN (prod)                           │
├─────────────────────────────────────────────────────────────────┤
│ Backend:     https://api.kaia.ai           (Railway - Prod)     │
│ Database:    PostgreSQL Prod               (Railway)             │
│ Redis:       Redis Prod                    (Railway)             │
│ Mobile:      EAS Build Production          (Expo)                │
│ Web:         https://kaia.ai                (Contabo)            │
│ Datos:       Usuarios reales                                     │
│ Deploy:      Manual con aprobación         (Controlado)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 DISEÑO POR AMBIENTE

### 1. DESARROLLO (dev)

**Propósito:** Desarrollo activo, experimentación, features nuevas

**Características:**
- ⚡ Cambios constantes y rápidos
- 🔧 Puede romperse sin consecuencias
- 🧪 Datos ficticios y mocks
- 👨‍💻 Usado por developers
- 🚀 Deploy automático en cada push

**Stack:**

#### Backend (Railway - Proyecto "kaia-dev"):
```yaml
Servicio: backend-dev
URL: https://api-dev.kaia.ai
Branch: develop
Variables de entorno:
  NODE_ENV: development
  DATABASE_URL: postgresql://dev-db
  REDIS_URL: redis://dev-redis
  JWT_SECRET: dev-secret-key
  FRONTEND_URL: https://dev.kaia.ai
  LOG_LEVEL: debug
  RATE_LIMIT_ENABLED: false
Auto-deploy: ON (cada push a develop)
```

#### Database (Railway - mismo proyecto):
```yaml
Servicio: postgresql-dev
Tamaño: Shared (gratis en trial)
Datos: Seed con usuarios/eventos de prueba
Backups: Opcional (no crítico)
```

#### Redis (Railway - mismo proyecto):
```yaml
Servicio: redis-dev
Tamaño: Shared
Persistencia: No necesaria
```

#### Mobile:
```yaml
Método: Expo Dev Client (sin EAS Build)
Conexión: WiFi local o tunnel
API URL: https://api-dev.kaia.ai
Testing: Metro bundler + Hot reload
```

**Ventajas:**
- ✅ Gratis (dentro del trial de Railway)
- ✅ Cambios instantáneos
- ✅ Hot reload en mobile
- ✅ Logs detallados

**Desventajas:**
- ❌ Puede estar inestable
- ❌ No refleja producción exactamente

---

### 2. TESTING/STAGING (test)

**Propósito:** Pre-producción, QA, testing de features completas

**Características:**
- ✅ Versión candidata a producción
- 🧪 Testing exhaustivo
- 📊 Datos realistas (no producción)
- 👥 Usado por testers y beta users
- 🚀 Deploy automático desde rama test

**Stack:**

#### Backend (Railway - Proyecto "kaia-test"):
```yaml
Servicio: backend-test
URL: https://api-test.kaia.ai
Branch: test/staging
Variables de entorno:
  NODE_ENV: staging
  DATABASE_URL: postgresql://test-db
  REDIS_URL: redis://test-redis
  JWT_SECRET: test-secret-key
  FRONTEND_URL: https://test.kaia.ai
  LOG_LEVEL: info
  RATE_LIMIT_ENABLED: true
  SENTRY_ENV: staging (monitoring)
Auto-deploy: ON (cada push a staging)
```

#### Database (Railway - mismo proyecto):
```yaml
Servicio: postgresql-test
Tamaño: Shared o Starter
Datos: Copia periódica de producción (sanitizada)
Backups: Sí (cada 24h)
```

#### Redis (Railway - mismo proyecto):
```yaml
Servicio: redis-test
Tamaño: Shared/Starter
Persistencia: Opcional
```

#### Mobile:
```yaml
Método: EAS Build Internal Distribution
Profile: preview-test
API URL: https://api-test.kaia.ai
Testing: Builds reales en dispositivos
Distribución: Link/QR de Expo
```

**EAS Build Profile (eas.json):**
```json
{
  "build": {
    "preview-test": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api-test.kaia.ai",
        "EXPO_PUBLIC_ENV": "test"
      },
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

**Ventajas:**
- ✅ Exactamente igual a producción
- ✅ Testing realista
- ✅ Detecta bugs antes de prod
- ✅ Beta testers pueden probar

**Desventajas:**
- ❌ Costo adicional en Railway (~$5/mes)
- ❌ Builds de mobile tardan tiempo

---

### 3. PRODUCCIÓN (prod)

**Propósito:** Usuarios reales, máxima estabilidad

**Características:**
- 🔒 Solo versiones probadas
- 📊 Datos reales de usuarios
- 🚨 Alta disponibilidad
- 📈 Monitoring activo
- 🛡️ Backups automáticos
- 🚀 Deploy manual con aprobación

**Stack:**

#### Backend (Railway - Proyecto "kaia" actual):
```yaml
Servicio: backend
URL: https://api.kaia.ai
Branch: main
Variables de entorno:
  NODE_ENV: production
  DATABASE_URL: postgresql://prod-db
  REDIS_URL: redis://prod-redis
  JWT_SECRET: prod-secret-key-ultra-secure
  FRONTEND_URL: https://kaia.ai
  LOG_LEVEL: warn
  RATE_LIMIT_ENABLED: true
  SENTRY_DSN: tu-sentry-url (monitoring)
  SENDGRID_API_KEY: prod-key
Auto-deploy: OFF (manual con aprobación)
```

#### Database (Railway - mismo proyecto):
```yaml
Servicio: postgresql
Tamaño: Starter o Pro (según crecimiento)
Datos: Usuarios reales
Backups: Automáticos cada 6h
Retención: 7 días
Point-in-time recovery: Activado
```

#### Redis (Railway - mismo proyecto):
```yaml
Servicio: redis
Tamaño: Starter o Pro
Persistencia: AOF activado
Backups: Sí
```

#### Mobile:
```yaml
Método: EAS Build Production
Profile: production
API URL: https://api.kaia.ai
Testing: Extensive QA antes de release
Distribución: downloads.kaia.ai + Play Store (futuro)
```

**EAS Build Profile (eas.json):**
```json
{
  "build": {
    "production": {
      "distribution": "store",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.kaia.ai",
        "EXPO_PUBLIC_ENV": "production"
      },
      "android": {
        "buildType": "apk",
        "versionCode": "auto-increment"
      }
    }
  }
}
```

**Ventajas:**
- ✅ Máxima estabilidad
- ✅ Monitoring completo
- ✅ Backups automáticos
- ✅ Optimizado para performance

**Desventajas:**
- ❌ Mayor costo (~$10-15/mes mínimo)
- ❌ Cambios más lentos (requieren aprobación)

---

## 🗺️ DNS Y SUBDOMINIOS

### Configuración DNS en Cloudflare:

```dns
# PRODUCCIÓN
Type: CNAME
Name: api
Content: kaia-production.up.railway.app
Proxy: DNS only

Type: A
Name: @
Content: [IP_CONTABO]
Proxy: Proxied

Type: CNAME
Name: www
Content: kaia.ai
Proxy: Proxied

Type: CNAME
Name: downloads
Content: kaia.ai
Proxy: Proxied

# TESTING
Type: CNAME
Name: api-test
Content: kaia-test.up.railway.app
Proxy: DNS only

Type: A
Name: test
Content: [IP_CONTABO]
Proxy: Proxied

Type: CNAME
Name: downloads-test
Content: test.kaia.ai
Proxy: Proxied

# DEVELOPMENT
Type: CNAME
Name: api-dev
Content: kaia-dev.up.railway.app
Proxy: DNS only

Type: A
Name: dev
Content: [IP_CONTABO]
Proxy: Proxied
```

### URLs Resultantes:

| Servicio | Dev | Test | Prod |
|----------|-----|------|------|
| API | api-dev.kaia.ai | api-test.kaia.ai | api.kaia.ai |
| Web | dev.kaia.ai | test.kaia.ai | kaia.ai |
| Downloads | dev.kaia.ai/downloads | downloads-test.kaia.ai | downloads.kaia.ai |
| Docs | dev.kaia.ai/docs | test.kaia.ai/docs | docs.kaia.ai |
| Admin | admin-dev.kaia.ai | admin-test.kaia.ai | admin.kaia.ai |

---

## 💾 ESTRATEGIA DE BASES DE DATOS

### 1. Bases de Datos Separadas:

```
Development DB
├─ Nombre: kaia-dev
├─ Tamaño: Compartido
├─ Datos: Seed fixtures
└─ Limpiar cada semana

Testing DB
├─ Nombre: kaia-test
├─ Tamaño: Shared/Starter
├─ Datos: Copia sanitizada de prod
└─ Refrescar antes de testing mayor

Production DB
├─ Nombre: kaia-prod
├─ Tamaño: Starter → Pro (según crecimiento)
├─ Datos: Usuarios reales
└─ Backups automáticos 6h
```

### 2. Migraciones de Base de Datos:

#### Flujo de Migraciones:
```bash
# 1. Desarrollo
npm run migrate:dev

# 2. Testing (después de merge a staging)
npm run migrate:test

# 3. Producción (manual, con backup)
npm run migrate:prod
```

#### Scripts en package.json:
```json
{
  "scripts": {
    "migrate:dev": "DATABASE_URL=$DEV_DATABASE_URL npx prisma migrate deploy",
    "migrate:test": "DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy",
    "migrate:prod": "DATABASE_URL=$PROD_DATABASE_URL npx prisma migrate deploy",

    "seed:dev": "DATABASE_URL=$DEV_DATABASE_URL npx prisma db seed",
    "seed:test": "DATABASE_URL=$TEST_DATABASE_URL npx prisma db seed",

    "db:reset:dev": "DATABASE_URL=$DEV_DATABASE_URL npx prisma migrate reset",
    "db:reset:test": "DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate reset"
  }
}
```

### 3. Datos de Seed (Development):

**backend/prisma/seed.ts:**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding development database...');

  // Usuarios de prueba
  await prisma.user.createMany({
    data: [
      {
        email: 'dev@kaia.ai',
        name: 'Dev User',
        password: 'hashed_password',
        onboardingCompleted: true,
      },
      {
        email: 'test1@kaia.ai',
        name: 'Test User 1',
        password: 'hashed_password',
        onboardingCompleted: true,
      },
      {
        email: 'test2@kaia.ai',
        name: 'Test User 2',
        password: 'hashed_password',
        onboardingCompleted: false,
      },
    ],
  });

  // Eventos de prueba
  await prisma.event.createMany({
    data: [
      {
        title: 'Reunión de desarrollo',
        description: 'Daily standup',
        startTime: new Date('2025-10-20T10:00:00'),
        endTime: new Date('2025-10-20T10:30:00'),
        userId: 1,
      },
      {
        title: 'Testing session',
        description: 'Probar nuevas features',
        startTime: new Date('2025-10-20T14:00:00'),
        endTime: new Date('2025-10-20T16:00:00'),
        userId: 1,
      },
    ],
  });

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 4. Copiar Datos de Prod a Test (Sanitizados):

**Script: scripts/copy-prod-to-test.sh:**
```bash
#!/bin/bash

# Script para copiar datos de prod a test (sanitizados)

echo "📋 Copiando datos de producción a testing..."

# 1. Backup de producción
pg_dump $PROD_DATABASE_URL > /tmp/prod-backup.sql

# 2. Sanitizar datos sensibles
sed -i 's/user@email.com/test-user@kaia.ai/g' /tmp/prod-backup.sql
sed -i 's/\+1234567890/\+9999999999/g' /tmp/prod-backup.sql

# 3. Limpiar base de datos de test
psql $TEST_DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 4. Restaurar en test
psql $TEST_DATABASE_URL < /tmp/prod-backup.sql

# 5. Limpiar
rm /tmp/prod-backup.sql

echo "✅ Datos copiados y sanitizados!"
```

---

## 📦 CONFIGURACIÓN DE RAILWAY

### Estructura de Proyectos en Railway:

```
Railway Dashboard
│
├─── Proyecto: kaia-dev
│    ├── backend-dev
│    ├── postgresql-dev
│    └── redis-dev
│
├─── Proyecto: kaia-test
│    ├── backend-test
│    ├── postgresql-test
│    └── redis-test
│
└─── Proyecto: kaia (actual - será prod)
     ├── backend
     ├── postgresql
     └── redis
```

### Variables de Entorno por Ambiente:

#### Development (.env.development):
```bash
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@dev-db.railway.app:5432/kaia-dev

# Redis
REDIS_URL=redis://dev-redis.railway.app:6379

# JWT
JWT_SECRET=dev-secret-not-secure-ok
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=dev-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# URLs
FRONTEND_URL=https://dev.kaia.ai
API_URL=https://api-dev.kaia.ai

# CORS
CORS_ORIGIN=https://dev.kaia.ai,http://localhost:8081

# Features
RATE_LIMIT_ENABLED=false
LOG_LEVEL=debug

# External Services (dev keys)
SENDGRID_API_KEY=SG.dev-key
TWILIO_ACCOUNT_SID=dev-account
TWILIO_AUTH_TOKEN=dev-token
GOOGLE_MAPS_API_KEY=dev-maps-key
```

#### Testing (.env.test):
```bash
NODE_ENV=staging
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@test-db.railway.app:5432/kaia-test

# Redis
REDIS_URL=redis://test-redis.railway.app:6379

# JWT
JWT_SECRET=test-secret-more-secure
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=test-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# URLs
FRONTEND_URL=https://test.kaia.ai
API_URL=https://api-test.kaia.ai

# CORS
CORS_ORIGIN=https://test.kaia.ai

# Features
RATE_LIMIT_ENABLED=true
LOG_LEVEL=info

# External Services (test keys)
SENDGRID_API_KEY=SG.test-key
TWILIO_ACCOUNT_SID=test-account
TWILIO_AUTH_TOKEN=test-token
GOOGLE_MAPS_API_KEY=test-maps-key

# Monitoring
SENTRY_DSN=https://sentry.io/test-env
```

#### Production (.env.production):
```bash
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@prod-db.railway.app:5432/kaia-prod

# Redis
REDIS_URL=redis://prod-redis.railway.app:6379

# JWT (ultra secure)
JWT_SECRET=ultra-secure-production-secret-min-32-chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=ultra-secure-refresh-secret-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d

# URLs
FRONTEND_URL=https://kaia.ai
API_URL=https://api.kaia.ai

# CORS
CORS_ORIGIN=https://kaia.ai,https://admin.kaia.ai

# Features
RATE_LIMIT_ENABLED=true
LOG_LEVEL=warn

# External Services (production keys)
SENDGRID_API_KEY=SG.production-key
TWILIO_ACCOUNT_SID=production-account
TWILIO_AUTH_TOKEN=production-token
GOOGLE_MAPS_API_KEY=production-maps-key

# Monitoring
SENTRY_DSN=https://sentry.io/production-env
APM_ENABLED=true
```

---

## 📱 CONFIGURACIÓN MOBILE (EAS Build)

### eas.json completo con 3 ambientes:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api-dev.kaia.ai",
        "EXPO_PUBLIC_ENV": "development"
      }
    },
    "preview-test": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api-test.kaia.ai",
        "EXPO_PUBLIC_ENV": "test"
      },
      "android": {
        "buildType": "apk",
        "applicationId": "com.adrianpuche.kaia.test"
      },
      "ios": {
        "bundleIdentifier": "com.adrianpuche.kaia.test"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.kaia.ai",
        "EXPO_PUBLIC_ENV": "production"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.kaia.ai",
        "EXPO_PUBLIC_ENV": "production"
      },
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Comandos de Build:

```bash
# Development (local con dev client)
npx expo start --dev-client

# Testing
eas build --platform android --profile preview-test

# Production
eas build --platform android --profile production
```

### App Config por Ambiente (app.config.js):

```javascript
const IS_DEV = process.env.EXPO_PUBLIC_ENV === 'development';
const IS_TEST = process.env.EXPO_PUBLIC_ENV === 'test';
const IS_PROD = process.env.EXPO_PUBLIC_ENV === 'production';

export default {
  expo: {
    name: IS_TEST ? 'Kaia (Test)' : IS_DEV ? 'Kaia (Dev)' : 'Kaia',
    slug: 'mobile',
    version: '1.0.0',

    // Icono diferente por ambiente
    icon: IS_TEST
      ? './assets/icon-test.png'
      : IS_DEV
        ? './assets/icon-dev.png'
        : './assets/icon.png',

    android: {
      package: IS_TEST
        ? 'com.adrianpuche.kaia.test'
        : 'com.adrianpuche.kaia',
      versionCode: 1,
      // ... resto de config
    },

    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      environment: process.env.EXPO_PUBLIC_ENV,
    },
  },
};
```

---

## 🔄 FLUJO DE DESARROLLO (GIT WORKFLOW)

### Estrategia de Branches:

```
main (producción)
│
├── staging (testing/pre-producción)
│   │
│   └── develop (desarrollo activo)
│       │
│       ├── feature/nueva-feature-1
│       ├── feature/nueva-feature-2
│       ├── bugfix/arreglo-login
│       └── hotfix/critical-bug
```

### Workflow Completo:

```bash
# 1. DESARROLLO - Nueva Feature
git checkout develop
git pull origin develop
git checkout -b feature/chat-mejorado

# ... hacer cambios ...
git add .
git commit -m "feat: Mejorar UI del chat"
git push origin feature/chat-mejorado

# Crear Pull Request: feature/chat-mejorado → develop
# Después de review y aprobación, merge

# ✅ Auto-deploy a DEV (Railway)


# 2. TESTING - Preparar Release
git checkout staging
git pull origin staging
git merge develop

git push origin staging

# ✅ Auto-deploy a TEST (Railway)
# ✅ Generar build de mobile: eas build --profile preview-test

# QA Team prueba en ambiente de test
# Si hay bugs, volver a develop, arreglar, y repetir


# 3. PRODUCCIÓN - Release
git checkout main
git pull origin main
git merge staging

git tag -a v1.2.0 -m "Release v1.2.0"
git push origin main
git push origin v1.2.0

# ⚠️ Deploy MANUAL a PROD (Railway - requiere aprobación)
# ⚠️ Generar build de mobile: eas build --profile production
```

### GitHub Actions para CI/CD:

**.github/workflows/deploy-dev.yml:**
```yaml
name: Deploy to Development

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy to Railway Dev
        run: railway up --service backend-dev
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN_DEV }}

      - name: Run Tests
        run: |
          cd backend
          npm install
          npm test

      - name: Notify on Slack
        if: success()
        run: echo "✅ Deployed to DEV!"
```

**.github/workflows/deploy-test.yml:**
```yaml
name: Deploy to Testing

on:
  push:
    branches: [staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Tests
        run: |
          cd backend
          npm install
          npm test

      - name: Deploy to Railway Test
        run: railway up --service backend-test
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN_TEST }}

      - name: Build Mobile Test
        run: |
          cd mobile
          npm install
          eas build --platform android --profile preview-test --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

      - name: Notify QA Team
        run: echo "✅ New build ready for testing!"
```

**.github/workflows/deploy-prod.yml:**
```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # Requiere aprobación manual

    steps:
      - uses: actions/checkout@v3

      - name: Run Tests
        run: |
          cd backend
          npm install
          npm test

      - name: Deploy to Railway Prod
        run: railway up --service backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN_PROD }}

      - name: Build Mobile Production
        run: |
          cd mobile
          npm install
          eas build --platform android --profile production --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false

      - name: Notify Team
        run: echo "🚀 Deployed to PRODUCTION!"
```

---

## 💰 COSTOS ESTIMADOS POR AMBIENTE

### Railway:

```
Development:
  Backend:     $0 (dentro del trial)
  PostgreSQL:  $0 (shared)
  Redis:       $0 (shared)
  Total:       $0/mes

Testing:
  Backend:     $5/mes (starter)
  PostgreSQL:  $5/mes (starter)
  Redis:       $5/mes (starter)
  Total:       $15/mes

Production:
  Backend:     $5-10/mes (starter/pro)
  PostgreSQL:  $10-20/mes (pro con backups)
  Redis:       $5-10/mes (pro)
  Total:       $20-40/mes

TOTAL RAILWAY: $35-55/mes
```

### Expo EAS:

```
Free Tier:
  30 builds/mes gratis
  Suficiente para:
    - Dev: builds locales (no cuenta)
    - Test: ~10 builds/mes
    - Prod: ~5 builds/mes

Si excedes:
  $29/mes plan (unlimited builds)
```

### Contabo:

```
VPS Único (todos los ambientes):
  $5-10/mes

Configuración:
  - dev.kaia.ai
  - test.kaia.ai
  - kaia.ai
```

### Dominio:

```
kaia.ai: $25/año = $2/mes
```

### TOTAL MENSUAL:

```
Mínimo: $42/mes
Recomendado: $60-70/mes
Con Expo paid: $90-100/mes
```

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### Fase 1: Setup Infrastructure (Día 1-2)

- [ ] Crear proyecto Railway "kaia-dev"
  - [ ] Agregar servicio backend-dev
  - [ ] Agregar PostgreSQL dev
  - [ ] Agregar Redis dev
  - [ ] Configurar variables de entorno

- [ ] Crear proyecto Railway "kaia-test"
  - [ ] Agregar servicio backend-test
  - [ ] Agregar PostgreSQL test
  - [ ] Agregar Redis test
  - [ ] Configurar variables de entorno

- [ ] Renombrar proyecto actual a "kaia" (prod)
  - [ ] Ya existe, solo verificar

### Fase 2: Git Workflow (Día 2)

- [ ] Crear branches:
  ```bash
  git checkout -b develop
  git push origin develop

  git checkout -b staging
  git push origin staging
  ```

- [ ] Configurar branch protection rules en GitHub:
  - [ ] `main`: Require PR, require reviews
  - [ ] `staging`: Require PR
  - [ ] `develop`: Allow direct push

### Fase 3: DNS Configuration (Día 2-3)

- [ ] Agregar DNS records:
  - [ ] api-dev.kaia.ai → Railway dev
  - [ ] api-test.kaia.ai → Railway test
  - [ ] dev.kaia.ai → Contabo
  - [ ] test.kaia.ai → Contabo

### Fase 4: Backend Configuration (Día 3)

- [ ] Actualizar código backend:
  - [ ] Crear archivos .env por ambiente
  - [ ] Configurar Railway projects
  - [ ] Test endpoints de cada ambiente

### Fase 5: Mobile Configuration (Día 3-4)

- [ ] Actualizar eas.json con profiles
- [ ] Crear app.config.js dinámico
- [ ] Generar builds de test:
  ```bash
  eas build --platform android --profile preview-test
  ```

### Fase 6: CI/CD Setup (Día 4-5)

- [ ] Crear GitHub Actions workflows
- [ ] Configurar secrets en GitHub
- [ ] Test auto-deploy a dev
- [ ] Test auto-deploy a test

### Fase 7: Testing & Documentation (Día 5-7)

- [ ] Probar flujo completo:
  - [ ] Push a develop → auto-deploy dev
  - [ ] Merge a staging → auto-deploy test
  - [ ] Tag release → deploy prod (manual)

- [ ] Documentar para el equipo
- [ ] Crear guías de onboarding

---

## 📚 DOCUMENTACIÓN DE USO

### Para Developers:

**Trabajo diario:**
```bash
# 1. Tomar última versión
git checkout develop
git pull origin develop

# 2. Crear feature branch
git checkout -b feature/mi-feature

# 3. Desarrollar localmente
npm run dev  # Backend
npx expo start  # Mobile

# 4. Probar contra DEV
# Mobile apunta a https://api-dev.kaia.ai

# 5. Commit y push
git add .
git commit -m "feat: Mi nueva feature"
git push origin feature/mi-feature

# 6. Crear Pull Request a develop
# Después de merge → auto-deploy a DEV
```

**Probar en Test:**
```bash
# Merge a staging para testing
git checkout staging
git pull origin staging
git merge develop
git push origin staging

# Auto-deploy a TEST
# Generar build mobile:
eas build --platform android --profile preview-test
```

### Para QA/Testers:

**Testing en ambiente Test:**
1. Recibir notificación de nuevo build
2. Descargar APK de test desde link
3. Instalar en dispositivo
4. Probar features nuevas
5. Reportar bugs en GitHub Issues
6. Aprobar o rechazar para producción

### Para DevOps/Lead:

**Deploy a Producción:**
```bash
# 1. Verificar que todo funciona en test
# 2. Merge staging a main
git checkout main
git pull origin main
git merge staging

# 3. Crear tag de release
git tag -a v1.2.0 -m "Release 1.2.0 - Nueva feature X"
git push origin main
git push origin v1.2.0

# 4. Deploy manual en Railway
# Ve a Railway Dashboard → kaia → backend → Deploy

# 5. Generar build production
eas build --platform android --profile production

# 6. Subir APK a downloads.kaia.ai
```

---

## 🔍 MONITORING Y LOGS

### Por Ambiente:

```
Development:
  Logs: Railway dashboard (verbose)
  Errors: Console
  Monitoring: No necesario

Testing:
  Logs: Railway dashboard (info level)
  Errors: Sentry (staging environment)
  Monitoring: Uptime checks básicos

Production:
  Logs: Railway dashboard (warnings only)
  Errors: Sentry (production environment)
  Monitoring: UptimeRobot + Sentry
  APM: New Relic o DataDog (opcional)
  Alerts: Slack/Email para downtime
```

### Sentry Configuration:

**backend/src/config/sentry.ts:**
```typescript
import * as Sentry from '@sentry/node';

const environment = process.env.NODE_ENV || 'development';

if (environment !== 'development') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: environment,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
  });
}

export default Sentry;
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Antes de Deploy a Producción:

- [ ] Todos los tests pasan en test environment
- [ ] QA aprobó la release
- [ ] No hay bugs críticos abiertos
- [ ] Migraciones de DB probadas en test
- [ ] Backups de producción realizados
- [ ] Changelog actualizado
- [ ] Documentación actualizada
- [ ] Variables de entorno verificadas
- [ ] Monitoring configurado
- [ ] Rollback plan definido

---

## 🚨 TROUBLESHOOTING

### Problema: Ambiente no despliega

**Verificar:**
1. Railway dashboard → Ver logs
2. Variables de entorno correctas
3. Branch correcto configurado
4. Recursos suficientes

### Problema: Mobile no conecta a API

**Verificar:**
1. EXPO_PUBLIC_API_URL correcto
2. DNS propagado (dnschecker.org)
3. Railway domain configurado
4. CORS permite el origen

### Problema: Base de datos no accesible

**Verificar:**
1. DATABASE_URL correcto
2. PostgreSQL service up
3. Migraciones ejecutadas
4. Conexiones disponibles

---

## 📖 RECURSOS ADICIONALES

- Railway Docs: https://docs.railway.app
- EAS Build Docs: https://docs.expo.dev/build/introduction/
- GitHub Actions: https://docs.github.com/en/actions
- Sentry: https://docs.sentry.io

---

**Última actualización:** 19 de Octubre, 2025
**Estado:** Listo para implementación
**Próximo paso:** Crear proyectos en Railway para dev y test

---

*Este documento debe actualizarse con cada cambio en la arquitectura.*
