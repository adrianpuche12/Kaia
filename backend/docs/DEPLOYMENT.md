# 🚀 Guía Completa de Deployment a Producción - Kaia Backend

## 🎯 CONTEXTO IMPORTANTE - Lee Esto Primero

**Para Claude (AI Assistant) que leerá este documento en el futuro:**

Esta guía fue creada el **Día 21** del desarrollo de Kaia. A continuación, el contexto completo que necesitas:

### Sobre el Proyecto Kaia

**Kaia** es un asistente personal inteligente que funciona 100% por voz en español. Incluye:
- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Mobile**: React Native + Expo (Android)
- **Funcionalidades**: Gestión de agenda, mensajería (SMS/WhatsApp/Email), ubicación, alarmas
- **Integraciones**: Twilio, SendGrid, Google Maps

**Estado Actual del Proyecto:**
- ✅ MVP 100% completado y funcionando en local
- ✅ 52 tests automatizados (100% passing)
- ✅ Backend en `C:\Users\jorge\OneDrive\Desktop\Kaia\backend`
- ✅ Mobile en `C:\Users\jorge\OneDrive\Desktop\Kaia\mobile`
- ✅ Todas las integraciones de API configuradas y funcionando
- ✅ Sistema de autenticación JWT implementado
- ⚠️ **Actualmente solo funciona en localhost:3001**

### Lo Que Necesitas Hacer

El usuario (Jorge) quiere deployar KAIA a producción para que sea accesible desde internet. Esta guía te llevará paso a paso a:

1. **Preparar el código** para producción (agregar scripts, archivos de configuración)
2. **Deployar a Railway** (plataforma recomendada) o alternativas (Render/Vercel)
3. **Configurar PostgreSQL** en la nube (actualmente usa SQLite local)
4. **Configurar variables de entorno** de producción
5. **Ejecutar migraciones de Prisma** en la DB de producción
6. **Verificar que todo funcione** en producción

### APIs y Credenciales Que Ya Están Configuradas

El usuario ya tiene cuentas y API keys para:
- ✅ **Twilio** - SMS y WhatsApp
- ✅ **SendGrid** - Email
- ✅ **Google Maps** - Geocoding y rutas

Estas credenciales están en `backend/.env` localmente y deberán copiarse a Railway.

### Archivos Importantes del Proyecto

```
backend/
├── src/
│   ├── server.ts              # Servidor Express principal
│   ├── routes/                # 7 módulos de rutas
│   ├── controllers/           # Controladores
│   ├── services/              # Lógica de negocio
│   ├── middleware/            # Auth, validation, rate limiting
│   └── utils/                 # Helpers, validators
├── prisma/
│   ├── schema.prisma          # Schema de base de datos
│   └── migrations/            # Migraciones existentes
├── package.json               # Dependencias y scripts
├── tsconfig.json              # Config de TypeScript
└── .env                       # Variables locales (NO en Git)
```

### Lo Que NO Debes Hacer

- ❌ **NO cambiar la arquitectura** - Express funciona perfectamente, no convertir a serverless
- ❌ **NO usar Vercel** - No es para servidores persistentes como Express
- ❌ **NO perder las migraciones de Prisma** existentes
- ❌ **NO commitear el archivo .env** con secretos

### Recomendación: Usar Railway

**Por qué Railway es la mejor opción:**
- ✅ Muy fácil de configurar (1-2 horas)
- ✅ PostgreSQL incluido con backups automáticos
- ✅ $5/mes gratis (suficiente para MVP)
- ✅ Auto-deploy desde GitHub
- ✅ Escalable para el futuro

**Alternativas:** Render (gratuito pero con limitaciones), Heroku (más caro)

### Próximos Pasos Después del Deployment

Una vez que el backend esté en producción:
1. **Día 22**: Deployar la app móvil (Expo)
2. **Día 23**: Configurar CI/CD con GitHub Actions
3. **Día 24**: Monitoring avanzado (Sentry)

### Si Encuentras Problemas

- Revisa la sección **Troubleshooting** al final de este documento
- Verifica los **logs** en Railway/Render para encontrar errores
- El checklist final tiene todos los pasos necesarios

---

## 📋 Tabla de Contenidos

1. [Overview](#overview)
2. [Preparación Pre-Deployment](#preparación-pre-deployment)
3. [Opción Recomendada: Railway](#opción-recomendada-railway)
4. [Opción Alternativa: Render](#opción-alternativa-render)
5. [Opción Alternativa: Vercel](#opción-alternativa-vercel)
6. [Configuración Post-Deployment](#configuración-post-deployment)
7. [Testing en Producción](#testing-en-producción)
8. [Monitoring y Mantenimiento](#monitoring-y-mantenimiento)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Esta guía te llevará paso a paso a deployar el backend de Kaia a producción usando plataformas PaaS (Platform as a Service). El deployment incluye:

- ✅ Backend API (Node.js + Express + TypeScript)
- ✅ Base de datos PostgreSQL
- ✅ Migraciones de Prisma
- ✅ Variables de entorno
- ✅ SSL/HTTPS automático
- ✅ Integración con Twilio, SendGrid y Google Maps

**Tiempo estimado**: 1-2 horas
**Costo**: Gratis para empezar (todos los servicios tienen tier gratuito)
**Dificultad**: ⭐⭐ Intermedio

---

## Preparación Pre-Deployment

### 1. Verificar que el Proyecto Esté Listo

Antes de deployar, asegúrate de que todo funciona localmente:

```bash
# 1. Ir al directorio del backend
cd C:\Users\jorge\OneDrive\Desktop\Kaia\backend

# 2. Verificar que las dependencias estén instaladas
npm install

# 3. Verificar que el build funciona
npm run build

# 4. Verificar que los tests pasan
npm test

# 5. Verificar que el servidor arranca
npm run dev
# Debería mostrar: "Server running on port 3001"
```

### 2. Preparar Archivos de Configuración

#### A. Crear archivo `.gitignore` (si no existe)

```bash
# Verificar si existe
ls .gitignore

# Si no existe, créalo con este contenido:
```

Contenido de `.gitignore`:
```
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.production

# Build output
dist/
build/

# Database
*.db
*.db-journal
prisma/dev.db

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Coverage
coverage/
.nyc_output/

# Temporary files
tmp/
temp/
```

#### B. Verificar `package.json`

Asegúrate de que el archivo `package.json` tenga estos scripts:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "postinstall": "prisma generate",
    "migrate:deploy": "prisma migrate deploy",
    "test": "jest"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

**IMPORTANTE**: Agregar el script `postinstall` y definir `engines` es crucial para el deployment.

#### C. Crear archivo `Procfile` (para Railway/Render)

Crear archivo `Procfile` en la raíz del backend:

```
web: npm run migrate:deploy && npm start
```

Este archivo le dice a la plataforma qué comando ejecutar después del build.

#### D. Actualizar `src/server.ts` para producción

Verificar que el archivo tenga estas configuraciones:

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS - Permitir orígenes múltiples en producción
const allowedOrigins = [
  'http://localhost:3000',
  'https://kaia-app.vercel.app', // Tu app móvil en producción
  process.env.FRONTEND_URL, // URL configurada en variables de entorno
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Seguridad
app.use(helmet());

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (importante para monitoring)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Rutas
app.use('/api', routes);

// Error handler global
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
```

### 3. Inicializar Git (si no lo has hecho)

```bash
# Verificar si ya es un repositorio Git
git status

# Si no es un repo, inicializar
git init

# Agregar todos los archivos
git add .

# Hacer commit inicial
git commit -m "feat: Prepare backend for production deployment"

# (Opcional) Crear repositorio en GitHub y conectarlo
# Ve a https://github.com/new
# Luego:
git remote add origin https://github.com/TU_USUARIO/kaia-backend.git
git branch -M main
git push -u origin main
```

---

## Opción Recomendada: Railway

**⭐ RECOMENDADO** - Railway es la opción más sencilla y mejor para escalabilidad futura.

### ¿Por qué Railway?

- ✅ **Muy fácil de usar** - UI intuitiva
- ✅ **PostgreSQL incluido** - Con backups automáticos
- ✅ **$5 gratis/mes** - Suficiente para MVP
- ✅ **Escalabilidad** - Fácil de escalar cuando creces
- ✅ **Deployment automático** - Se actualiza con cada push a GitHub
- ✅ **Variables de entorno** - Fácil de gestionar
- ✅ **Logs en tiempo real** - Debugging sencillo

### Paso a Paso: Deployment en Railway

#### 1. Crear Cuenta en Railway

1. Ve a [https://railway.app](https://railway.app)
2. Click en **"Start a New Project"**
3. Autentícate con **GitHub** (recomendado) o email
4. Verifica tu email si es necesario

#### 2. Crear Nuevo Proyecto

1. En el dashboard, click **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Autoriza Railway a acceder a tus repositorios
4. Selecciona el repositorio `kaia-backend`
5. Click en **"Deploy Now"**

Railway automáticamente:
- Detectará que es un proyecto Node.js
- Instalará las dependencias
- Ejecutará el build
- Iniciará el servidor

#### 3. Agregar PostgreSQL Database

1. En tu proyecto de Railway, click **"+ New"**
2. Selecciona **"Database"**
3. Selecciona **"Add PostgreSQL"**
4. Railway creará una base de datos PostgreSQL automáticamente

**IMPORTANTE**: Railway generará automáticamente la variable `DATABASE_URL` con la conexión a PostgreSQL.

#### 4. Configurar Variables de Entorno

1. En tu proyecto, click en el servicio del **backend**
2. Ve a la pestaña **"Variables"**
3. Click en **"+ New Variable"**
4. Agrega TODAS estas variables:

```bash
# Node Environment
NODE_ENV=production

# Database (Railway la genera automáticamente, no la agregues manualmente)
# DATABASE_URL=postgresql://... (Ya está configurada)

# JWT Secrets (GENERA VALORES SEGUROS)
JWT_SECRET=tu_secreto_super_seguro_de_minimo_32_caracteres_aqui
JWT_REFRESH_SECRET=otro_secreto_diferente_para_refresh_tokens_aqui

# Twilio Configuration
TWILIO_ACCOUNT_SID=tu_account_sid_de_twilio
TWILIO_AUTH_TOKEN=tu_auth_token_de_twilio
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# SendGrid Configuration
SENDGRID_API_KEY=SG.tu_api_key_de_sendgrid
SENDGRID_FROM_EMAIL=noreply@tudominio.com
SENDGRID_FROM_NAME=Kaia Assistant

# Google Maps Configuration
GOOGLE_MAPS_API_KEY=tu_api_key_de_google_maps

# Frontend URL (para CORS)
FRONTEND_URL=https://tu-app-movil.vercel.app

# Port (Railway lo asigna automáticamente, pero puedes definirlo)
PORT=3001
```

**Cómo generar secretos seguros para JWT**:

Opción A - Usando Node.js (en tu terminal local):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Opción B - Usando OpenSSL:
```bash
openssl rand -hex 32
```

Opción C - Usando un generador online:
- [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)

#### 5. Configurar el Build y Start Commands

1. En tu servicio del backend, ve a **"Settings"**
2. En **"Build Command"**, verifica que sea:
   ```bash
   npm install && npm run build
   ```
3. En **"Start Command"**, verifica que sea:
   ```bash
   npm run migrate:deploy && npm start
   ```

Railway detectará esto automáticamente del `package.json`, pero es bueno verificar.

#### 6. Conectar la Base de Datos con Prisma

Railway ya configuró `DATABASE_URL` automáticamente, pero necesitamos ejecutar las migraciones.

**Opción A - Automático (recomendado)**:
Ya está configurado en el `Start Command`: `npm run migrate:deploy && npm start`

Esto ejecutará las migraciones cada vez que se deploya.

**Opción B - Manual (solo si necesitas)**:
1. En Railway, ve a tu proyecto
2. Click en el servicio del backend
3. Ve a la pestaña **"Deployments"**
4. Click en el deployment activo
5. Click en **"View Logs"**
6. Verifica que las migraciones se ejecutaron correctamente

Deberías ver logs como:
```
Running migrations...
✓ Migrations applied successfully
🚀 Server running on port 3001
```

#### 7. Obtener la URL de Producción

1. En tu proyecto de Railway, click en el servicio del **backend**
2. Ve a la pestaña **"Settings"**
3. En **"Domains"**, verás algo como:
   ```
   kaia-backend-production.up.railway.app
   ```
4. Copia esta URL - esta será tu API de producción

**IMPORTANTE**: Por defecto Railway genera una URL, pero puedes:
- Usar un dominio personalizado (ej: `api.kaia.app`)
- Ir a **Settings > Domains > Custom Domain** y seguir las instrucciones

#### 8. Verificar el Deployment

Abre tu navegador y prueba:

```bash
# Health check
https://kaia-backend-production.up.railway.app/health

# Deberías ver:
{
  "status": "ok",
  "timestamp": "2025-10-11T...",
  "uptime": 123.456,
  "environment": "production"
}
```

Si ves este JSON, ¡tu API está funcionando! 🎉

#### 9. Configurar Deployments Automáticos

Railway ya configuró esto automáticamente cuando conectaste tu repo de GitHub.

**Cada vez que hagas `git push` a la rama `main`**:
1. Railway detectará el cambio
2. Hará un nuevo build automáticamente
3. Ejecutará las migraciones
4. Desplegará la nueva versión
5. Te notificará por email

Para verificar:
1. Ve a **Settings > Service**
2. En **"Source"**, deberías ver tu repo de GitHub
3. En **"Branch"**, debería estar `main` o `master`

#### 10. Configurar Notificaciones (Opcional)

1. Ve a **Project Settings**
2. Click en **"Notifications"**
3. Conecta con Slack, Discord o Email
4. Recibirás notificaciones cuando:
   - Un deployment se completa
   - Hay errores en el deployment
   - El servicio se cae

---

## Opción Alternativa: Render

Render es una excelente alternativa a Railway, muy similar en facilidad de uso.

### ¿Por qué Render?

- ✅ **Tier gratuito generoso** - 750 horas/mes gratis
- ✅ **PostgreSQL incluido**
- ✅ **Auto-deploy desde GitHub**
- ✅ **SSL gratuito**
- ✅ **Buena documentación**

### Limitaciones del Tier Gratuito:
- ⚠️ Los servicios se "duermen" después de 15 minutos de inactividad
- ⚠️ Pueden tardar 30-60 segundos en "despertar"
- ⚠️ Bueno para desarrollo, no ideal para producción con usuarios reales

### Paso a Paso: Deployment en Render

#### 1. Crear Cuenta en Render

1. Ve a [https://render.com](https://render.com)
2. Click en **"Get Started"**
3. Autentícate con **GitHub** (recomendado)
4. Verifica tu email

#### 2. Crear PostgreSQL Database

**IMPORTANTE**: En Render, debes crear la base de datos PRIMERO.

1. En el dashboard, click **"New +"** en la parte superior
2. Selecciona **"PostgreSQL"**
3. Configura:
   - **Name**: `kaia-postgres`
   - **Database**: `kaia_db`
   - **User**: `kaia_user` (o déjalo auto-generar)
   - **Region**: Elige el más cercano a tus usuarios (ej: `Oregon (US West)`)
   - **Plan**: **Free** (para empezar)
4. Click en **"Create Database"**

Render creará la base de datos en ~2 minutos.

5. Una vez creada, ve a la pestaña **"Info"**
6. Copia el **"Internal Database URL"** - lo usarás en el siguiente paso

Ejemplo:
```
postgresql://kaia_user:password@dpg-xxxxx/kaia_db
```

#### 3. Crear Web Service

1. En el dashboard, click **"New +"**
2. Selecciona **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Selecciona el repo `kaia-backend`
5. Configura:

   - **Name**: `kaia-backend`
   - **Region**: Mismo que la base de datos
   - **Branch**: `main`
   - **Root Directory**: (déjalo vacío si el backend está en la raíz)
   - **Runtime**: **Node**
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     npm run migrate:deploy && npm start
     ```
   - **Plan**: **Free** (para empezar)

6. Click en **"Create Web Service"** (aún no)

#### 4. Configurar Variables de Entorno (ANTES de crear)

**IMPORTANTE**: Configura las variables ANTES de hacer el primer deploy.

En la misma página, baja a **"Environment Variables"** y agrega:

```bash
# Node Environment
NODE_ENV=production

# Database - USA LA URL QUE COPIASTE ANTES
DATABASE_URL=postgresql://kaia_user:password@dpg-xxxxx/kaia_db

# JWT Secrets
JWT_SECRET=genera_un_secreto_seguro_aqui
JWT_REFRESH_SECRET=otro_secreto_diferente_aqui

# Twilio
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# SendGrid
SENDGRID_API_KEY=SG.tu_api_key
SENDGRID_FROM_EMAIL=noreply@tudominio.com
SENDGRID_FROM_NAME=Kaia Assistant

# Google Maps
GOOGLE_MAPS_API_KEY=tu_api_key

# Frontend URL
FRONTEND_URL=https://tu-app-movil.vercel.app

# Port (Render lo asigna automáticamente)
PORT=10000
```

7. Ahora sí, click en **"Create Web Service"**

#### 5. Monitorear el Deployment

Render mostrará los logs en tiempo real:

1. Ve a la pestaña **"Logs"**
2. Deberías ver:
   ```
   ==> Building...
   ==> Installing dependencies...
   ==> Running build...
   ==> Starting server...
   ==> Deploy successful!
   ```

El primer deployment puede tardar 5-10 minutos.

#### 6. Obtener la URL de Producción

1. Una vez completado el deploy, en la parte superior verás:
   ```
   https://kaia-backend.onrender.com
   ```
2. Esta es tu URL de producción

#### 7. Configurar Dominio Personalizado (Opcional)

1. Ve a la pestaña **"Settings"**
2. Baja a **"Custom Domain"**
3. Click en **"Add Custom Domain"**
4. Ingresa tu dominio (ej: `api.kaia.app`)
5. Sigue las instrucciones para configurar el DNS

#### 8. Verificar el Deployment

```bash
# Health check
https://kaia-backend.onrender.com/health

# Deberías ver el JSON de status
```

#### 9. Configurar Auto-Deploy

1. Ve a **Settings > Build & Deploy**
2. Verifica que **"Auto-Deploy"** esté en **"Yes"**
3. Cada push a `main` desplegará automáticamente

---

## Opción Alternativa: Vercel

**⚠️ LIMITACIÓN**: Vercel está diseñado principalmente para **frontend y funciones serverless**, no para servidores persistentes como Express.

### ¿Cuándo usar Vercel?

- ✅ **Solo si refactorizas el backend** a funciones serverless
- ✅ **Si usas Next.js** con API routes
- ❌ **No recomendado** para el backend actual de Express

### ¿Cómo Funcionaría?

Tendrías que convertir cada endpoint de Express a una función serverless:

**Antes (Express)**:
```typescript
app.post('/api/auth/login', authController.login);
```

**Después (Vercel Serverless)**:
```typescript
// api/auth/login.ts
export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Lógica de login
  }
}
```

**Conclusión**: No usar Vercel para el backend actual. Mejor usar Railway o Render.

---

## Configuración Post-Deployment

### 1. Actualizar la App Móvil

Actualizar la URL del backend en la app móvil:

**En `mobile/.env` o `mobile/src/config/api.ts`**:

```typescript
// Antes (desarrollo)
const API_URL = 'http://localhost:3001/api';

// Después (producción)
const API_URL = __DEV__
  ? 'http://localhost:3001/api'
  : 'https://kaia-backend-production.up.railway.app/api';
```

O mejor aún, usar variables de entorno:

**En `mobile/.env`**:
```bash
EXPO_PUBLIC_API_URL=https://kaia-backend-production.up.railway.app/api
```

**En `mobile/src/services/api/config.ts`**:
```typescript
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
```

### 2. Configurar CORS Correctamente

Actualizar `src/server.ts` para incluir la URL de tu app móvil:

```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'https://kaia-backend-production.up.railway.app',
  'exp://192.168.1.x:8081', // Expo local (reemplaza con tu IP)
  process.env.FRONTEND_URL,
];
```

### 3. Configurar Webhooks de Twilio (si los usas)

Si usas webhooks de Twilio para respuestas automáticas:

1. Ve a [Twilio Console](https://console.twilio.com)
2. Ve a **Phone Numbers > Manage > Active Numbers**
3. Selecciona tu número
4. En **Messaging**, configura **Webhook**:
   ```
   https://kaia-backend-production.up.railway.app/api/webhooks/twilio
   ```

### 4. Configurar Webhooks de SendGrid (si los usas)

Para tracking de emails (abiertos, clicks, etc.):

1. Ve a [SendGrid Settings](https://app.sendgrid.com/settings/mail_settings)
2. Ve a **Mail Settings > Event Notification**
3. Configura **HTTP POST URL**:
   ```
   https://kaia-backend-production.up.railway.app/api/webhooks/sendgrid
   ```

---

## Testing en Producción

### 1. Importar Collection de Postman Actualizada

**Actualizar las variables de entorno en Postman**:

1. Abre Postman
2. Ve a **Environments**
3. Crea un nuevo environment llamado **"Production"**
4. Agrega estas variables:

```json
{
  "baseUrl": "https://kaia-backend-production.up.railway.app/api",
  "authToken": "",
  "refreshToken": "",
  "userId": ""
}
```

### 2. Ejecutar Tests Básicos

#### Health Check
```bash
curl https://kaia-backend-production.up.railway.app/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2025-10-11T...",
  "uptime": 123.456,
  "environment": "production"
}
```

#### Registro de Usuario
```bash
curl -X POST https://kaia-backend-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@kaia.app",
    "password": "Test1234",
    "name": "Test",
    "lastName": "User"
  }'
```

#### Login
```bash
curl -X POST https://kaia-backend-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@kaia.app",
    "password": "Test1234"
  }'
```

Deberías recibir:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "test@kaia.app",
    "name": "Test"
  }
}
```

### 3. Verificar Integraciones

#### Enviar SMS con Twilio
```bash
curl -X POST https://kaia-backend-production.up.railway.app/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "platform": "SMS",
    "to": "+34612345678",
    "content": "Test desde producción!"
  }'
```

#### Enviar Email con SendGrid
```bash
curl -X POST https://kaia-backend-production.up.railway.app/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "platform": "EMAIL",
    "to": "test@example.com",
    "subject": "Test desde producción",
    "content": "Email de prueba desde Kaia en producción!"
  }'
```

### 4. Verificar Base de Datos

Para verificar que las migraciones se ejecutaron correctamente:

**En Railway**:
1. Ve a tu proyecto
2. Click en **PostgreSQL**
3. Ve a **Data**
4. Verifica que las tablas existan: `User`, `Event`, `Message`, `Location`, etc.

**Usando Prisma Studio localmente**:
```bash
# Conectar a la base de datos de producción (con precaución)
# Primero, agrega DATABASE_URL de producción temporalmente en .env
DATABASE_URL="postgresql://..." npx prisma studio
```

⚠️ **PRECAUCIÓN**: Solo usa Prisma Studio en producción para **lectura**, no para modificar datos.

---

## Monitoring y Mantenimiento

### 1. Logs en Tiempo Real

**En Railway**:
1. Ve a tu proyecto
2. Click en el servicio del backend
3. Ve a **Deployments**
4. Click en el deployment activo
5. Verás logs en tiempo real

**En Render**:
1. Ve a tu servicio
2. Click en **Logs**
3. Verás logs en tiempo real

### 2. Métricas de Uso

**En Railway**:
1. Ve a tu proyecto
2. Click en **Metrics**
3. Verás:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request count

**En Render**:
1. Ve a tu servicio
2. Click en **Metrics**
3. Verás métricas similares

### 3. Configurar Alertas

**Railway**:
1. Ve a **Project Settings > Notifications**
2. Conecta con Slack, Discord o Email
3. Configura alertas para:
   - Deployment failures
   - Service crashes
   - High CPU/memory usage

**Render**:
1. Ve a **Account Settings > Notifications**
2. Configura notificaciones por email
3. Recibirás alertas automáticas cuando el servicio se cae

### 4. Backup de Base de Datos

**Railway**:
- Backups automáticos cada 24 horas (retenidos 7 días en tier gratuito)
- Para backups manuales:
  1. Ve a **PostgreSQL > Backups**
  2. Click en **Create Backup**

**Render**:
- Backups automáticos en planes de pago
- En tier gratuito, hacer backups manuales:

```bash
# Instalar pg_dump (PostgreSQL client)
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql

# Hacer backup
pg_dump -Fc DATABASE_URL > backup_$(date +%Y%m%d).dump

# Restaurar backup
pg_restore -d DATABASE_URL backup_20251011.dump
```

### 5. Escalabilidad

**Railway**:
- **Tier gratuito**: $5/mes de uso gratuito
- **Hobby Plan**: $5/mes + uso (paga solo lo que usas)
- **Pro Plan**: $20/mes + uso (para apps en producción)

Para escalar:
1. Ve a **Project Settings > Plan**
2. Actualiza a Hobby o Pro
3. Ajusta recursos según necesites

**Render**:
- **Tier gratuito**: 750 horas/mes
- **Starter**: $7/mes (sin sleep, 0.5GB RAM)
- **Standard**: $25/mes (1GB RAM)
- **Pro**: $85/mes (4GB RAM)

---

## Troubleshooting

### Problema 1: "Application Error" o 500

**Causa**: Error en el código o variables de entorno faltantes

**Solución**:
1. Ve a los logs del servicio
2. Busca el error específico
3. Errores comunes:
   - `DATABASE_URL is not defined` → Agrega la variable
   - `Cannot find module 'X'` → Verifica package.json y build
   - `Port already in use` → Verifica que uses `process.env.PORT`

### Problema 2: Migraciones de Prisma Fallan

**Error**: `Migration failed to apply`

**Solución**:
```bash
# Opción A: Reset de base de datos (⚠️ BORRA TODOS LOS DATOS)
npx prisma migrate reset

# Opción B: Aplicar migraciones manualmente
npx prisma migrate deploy

# Opción C: Generar nueva migración
npx prisma migrate dev --name fix_migration
```

### Problema 3: CORS Errors en la App Móvil

**Error**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solución**:
Actualizar `src/server.ts`:
```typescript
app.use(cors({
  origin: '*', // Permitir todos (solo para debugging)
  credentials: true,
}));
```

Luego, una vez que funcione, restringir a orígenes específicos.

### Problema 4: Build Falla

**Error**: `npm ERR! code ELIFECYCLE`

**Solución**:
1. Verificar que `package.json` tenga `engines` definido
2. Verificar que todas las dependencias estén en `dependencies`, no en `devDependencies`
3. Mover TypeScript y ts-jest a `dependencies` si es necesario:
   ```bash
   npm install --save typescript ts-jest
   ```

### Problema 5: Variables de Entorno No Se Cargan

**Error**: `undefined` al acceder a `process.env.X`

**Solución**:
1. Verificar que las variables estén agregadas en la plataforma
2. Re-deployar después de agregar variables
3. No usar archivo `.env` en producción (usar variables de la plataforma)

### Problema 6: Base de Datos No Conecta

**Error**: `Can't reach database server`

**Solución**:
1. Verificar que `DATABASE_URL` sea la **Internal URL** (no la External)
2. Verificar que el servicio y la DB estén en la misma región
3. En Railway, verificar que el servicio tenga acceso a la DB:
   - Ve a PostgreSQL > Settings > Networking
   - Verifica que "Private Networking" esté habilitado

### Problema 7: Servicio Se Cae Constantemente

**Causa**: Errores no manejados, memory leaks, o límites de recursos

**Solución**:
1. Revisar logs para encontrar el error
2. Agregar más logging:
   ```typescript
   process.on('unhandledRejection', (reason, promise) => {
     console.error('Unhandled Rejection at:', promise, 'reason:', reason);
   });

   process.on('uncaughtException', (error) => {
     console.error('Uncaught Exception:', error);
     process.exit(1);
   });
   ```
3. Considerar actualizar el plan para más recursos

---

## Checklist Final de Deployment

Antes de considerar el deployment completo, verifica:

### Pre-Deployment
- [ ] Código funciona localmente sin errores
- [ ] Tests pasan (`npm test`)
- [ ] Build funciona (`npm run build`)
- [ ] `.gitignore` está configurado correctamente
- [ ] `package.json` tiene `engines` y `postinstall`
- [ ] Variables de entorno documentadas
- [ ] Código está en GitHub (o repo Git)

### Durante Deployment
- [ ] Base de datos PostgreSQL creada
- [ ] Variables de entorno configuradas (todas)
- [ ] Build command correcto
- [ ] Start command correcto (incluye migraciones)
- [ ] Deployment completado sin errores

### Post-Deployment
- [ ] Health check endpoint responde correctamente
- [ ] Registro de usuario funciona
- [ ] Login funciona y devuelve tokens
- [ ] Endpoints protegidos requieren autenticación
- [ ] Twilio envía SMS correctamente
- [ ] SendGrid envía emails correctamente
- [ ] Google Maps funciona (si implementado)
- [ ] CORS configurado correctamente
- [ ] App móvil conecta al backend en producción
- [ ] Logs son accesibles y legibles
- [ ] Monitoring configurado
- [ ] Backups configurados

### Opcionales pero Recomendados
- [ ] Dominio personalizado configurado
- [ ] Notificaciones configuradas (Slack/Discord/Email)
- [ ] CI/CD configurado (auto-deploy)
- [ ] Rate limiting verificado
- [ ] Error tracking (Sentry, LogRocket)
- [ ] Analytics (Mixpanel, Amplitude)
- [ ] Documentación actualizada con URLs de producción

---

## Próximos Pasos (Post-Deployment)

Una vez que el backend esté en producción:

### Día 22: Mobile Deployment
- Deploy de la app móvil a Expo/TestFlight/Play Store
- Configurar actualizaciones OTA con Expo
- Testing en dispositivos reales

### Día 23: CI/CD Automation
- GitHub Actions para tests automáticos
- Auto-deployment en cada PR
- Environment-based deployments (staging/production)

### Día 24: Monitoring Avanzado
- Integración con Sentry para error tracking
- Logging estructurado con Winston
- Métricas de performance con New Relic/DataDog

### Día 25: Optimización
- Implementar caching con Redis
- Optimizar queries de base de datos
- Implementar CDN para assets estáticos

---

**¡Listo para deployar mañana! 🚀**

**Tiempo estimado total**: 1-2 horas
**Recomendación final**: Usar **Railway** por su balance perfecto entre facilidad de uso y capacidad de escalamiento.

**Última actualización**: Día 21 (Preparación) - Octubre 2025
**Autor**: Kaia Development Team
**Versión**: 2.0.0
