# 🔧 Especificaciones Técnicas - Kaia

**Documento:** Especificaciones Técnicas Completas
**Versión:** 1.0.0
**Fecha:** 14 de Octubre, 2025
**Autor:** Claude Code Assistant

---

## 📋 Índice

1. [Stack Tecnológico](#stack-tecnológico)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Base de Datos](#base-de-datos)
4. [API Endpoints](#api-endpoints)
5. [Autenticación y Seguridad](#autenticación-y-seguridad)
6. [Integraciones](#integraciones)
7. [Performance y Escalabilidad](#performance-y-escalabilidad)
8. [Configuración](#configuración)

---

## 💻 Stack Tecnológico

### Backend

#### Runtime & Framework
```json
{
  "runtime": "Node.js 18.x+",
  "framework": "Express 4.19.2",
  "language": "TypeScript 5.9.2",
  "packageManager": "npm 10.x"
}
```

#### Database & ORM
```json
{
  "orm": "Prisma 6.16.2",
  "database": {
    "development": "SQLite 3.x",
    "production": "PostgreSQL 15+"
  },
  "migrations": "Prisma Migrate"
}
```

#### Authentication
```json
{
  "strategy": "JWT (JSON Web Tokens)",
  "library": "jsonwebtoken 9.0.2",
  "hashing": "bcrypt 5.1.1",
  "tokenTypes": ["access", "refresh"],
  "accessTokenExpiry": "15 minutes",
  "refreshTokenExpiry": "7 days"
}
```

#### Security
```json
{
  "headers": "helmet 8.0.0",
  "rateLimiting": "express-rate-limit 7.4.1",
  "cors": "cors 2.8.5",
  "validation": "zod 3.23.8",
  "sanitization": "Built-in"
}
```

#### Testing
```json
{
  "framework": "Jest 29.7.0",
  "coverage": "jest --coverage",
  "apiTesting": "supertest 7.0.0",
  "mocking": "jest.mock()"
}
```

#### Documentation
```json
{
  "spec": "OpenAPI 3.0.0",
  "ui": "swagger-ui-express 5.0.1",
  "generator": "swagger-jsdoc 6.2.8"
}
```

#### Integrations
```json
{
  "sms": "Twilio SDK 5.3.4",
  "whatsapp": "Twilio SDK (WhatsApp Business API)",
  "email": "SendGrid SDK 8.1.4",
  "maps": "Google Maps API (REST)",
  "geocoding": "@googlemaps/google-maps-services-js"
}
```

#### Utilities
```json
{
  "logging": "winston 3.17.0",
  "envVars": "dotenv 17.2.2",
  "dateTime": "date-fns 4.1.0"
}
```

### Mobile

#### Framework & Runtime
```json
{
  "framework": "React Native 0.81.4",
  "platform": "Expo ~54.0.10",
  "language": "TypeScript 5.9.2",
  "packageManager": "npm"
}
```

#### Navigation
```json
{
  "library": "@react-navigation/native 7.1.17",
  "stacks": "@react-navigation/native-stack 7.3.26",
  "tabs": "@react-navigation/bottom-tabs 7.4.7"
}
```

#### State Management
```json
{
  "global": "zustand 5.0.8",
  "persistence": "@react-native-async-storage/async-storage 2.2.0",
  "cache": "In-memory (zustand)"
}
```

#### UI/UX
```json
{
  "styling": "StyleSheet (React Native)",
  "gradients": "expo-linear-gradient 15.0.7",
  "fonts": "@expo-google-fonts/caveat 0.4.2",
  "icons": "@expo/vector-icons (built-in)"
}
```

#### Media & Voice
```json
{
  "voice": "@react-native-voice/voice 3.2.4",
  "speech": "expo-speech 14.0.7",
  "audio": "expo-av 16.0.7"
}
```

#### Fonts
```json
{
  "loading": "expo-font ~14.0.8",
  "primary": "Caveat (Google Fonts)",
  "fallback": "System fonts"
}
```

---

## 🏗️ Arquitectura del Sistema

### Patrón Arquitectónico

**Clean Architecture / Layered Architecture**

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│    (Controllers, Routes, Middleware)│
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│          Business Layer             │
│    (Services, Business Logic)       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│           Data Layer                │
│    (Repositories, Data Access)      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Database Layer              │
│    (Prisma, SQLite/PostgreSQL)      │
└─────────────────────────────────────┘
```

### Flujo de Request

```
Client Request
    │
    ▼
Express Router
    │
    ├─→ Rate Limiter Middleware
    ├─→ Authentication Middleware
    ├─→ Validation Middleware
    │
    ▼
Controller
    │
    ▼
Service (Business Logic)
    │
    ├─→ External Integrations
    ├─→ NLP Processing
    ├─→ Context Analysis
    │
    ▼
Repository (Data Access)
    │
    ▼
Prisma ORM
    │
    ▼
Database (SQLite/PostgreSQL)
    │
    ▼
Response ← Error Handler (if error)
```

### Módulos del Sistema

#### 1. Authentication Module
```
auth.routes.ts
    ↓
auth.controller.ts
    ↓
authService.ts
    ↓
UserRepository.ts
    ↓
Prisma (User model)
```

**Responsabilidades:**
- Registro de usuarios
- Login/Logout
- Refresh tokens
- Profile management
- Password hashing
- Token generation/validation

---

#### 2. Events Module
```
event.routes.ts
    ↓
event.controller.ts
    ↓
EventService.ts
    ↓
EventRepository.ts
    ↓
Prisma (Event model)
```

**Responsabilidades:**
- CRUD de eventos
- Búsqueda por filtros
- Validación de conflictos
- Recurrencia (futuro)
- Sincronización de calendario

---

#### 3. Messages Module
```
message.routes.ts
    ↓
message.controller.ts
    ↓
MessageService.ts
    ├─→ TwilioClient (SMS/WhatsApp)
    ├─→ SendGridClient (Email)
    └─→ MessageRepository
        ↓
    Prisma (Message model)
```

**Responsabilidades:**
- Envío multi-platform
- Templates de mensajes
- Historial de mensajes
- Retry mechanism
- Status tracking

---

#### 4. Voice Module
```
voice.routes.ts
    ↓
voice.controller.ts
    ↓
VoiceService.ts
    ├─→ NLPService (Intent detection)
    ├─→ ContextBuilder (Context analysis)
    └─→ VoiceSessionRepository
        ↓
    Prisma (VoiceSession model)
```

**Responsabilidades:**
- Procesamiento de comandos
- Intent detection
- Entity extraction
- Context awareness
- Action execution

---

#### 5. Location Module
```
location.routes.ts
    ↓
location.controller.ts
    ↓
LocationService.ts
    ├─→ Google Maps API
    ├─→ PlaceService
    └─→ PlaceRepository
        ↓
    Prisma (LocationLog, Geofence models)
```

**Responsabilidades:**
- Tracking de ubicación
- Geofencing
- Geocoding/Reverse geocoding
- Cálculo de rutas
- Places management

---

#### 6. MCP Module
```
mcp.routes.ts
    ↓
mcp.controller.ts
    ↓
MCPService.ts
    ↓
Prisma (MCP, MCPExecution models)
```

**Responsabilidades:**
- Registro de MCPs
- Ejecución de MCPs
- Gestión de permisos
- Tracking de uso
- Rating system

---

#### 7. Users Module
```
user.routes.ts
    ↓
user.controller.ts
    ↓
UserRepository.ts
    ↓
Prisma (User, UserPreferences models)
```

**Responsabilidades:**
- Profile management
- Preferences configuration
- Password updates
- Onboarding flow
- Settings sync

---

### Context Analysis System

```
VoiceCommand / UserAction
        │
        ▼
┌───────────────────┐
│  ContextBuilder   │
└────────┬──────────┘
         │
         ├─→ TemporalContextAnalyzer
         │   (Time, day, date analysis)
         │
         ├─→ SpatialContextAnalyzer
         │   (Location, distance analysis)
         │
         ├─→ RelationalContextAnalyzer
         │   (Contact relationships)
         │
         ├─→ IntentionalContextAnalyzer
         │   (User patterns, preferences)
         │
         └─→ PriorityContextAnalyzer
             (Urgency, importance)
         │
         ▼
   UnifiedContext
         │
         ▼
   Smart Actions
```

---

## 💾 Base de Datos

### Schema Overview

#### Core Tables

**User**
```prisma
model User {
  id                    String   @id @default(cuid())
  email                 String   @unique
  password              String
  name                  String
  lastName              String?
  phone                 String?
  birthDate             DateTime?
  onboardingCompleted   Boolean  @default(false)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relations
  preferences           UserPreferences?
  events                Event[]
  reminders             Reminder[]
  alarms                Alarm[]
  messages              Message[]
  contacts              Contact[]
  voiceSessions         VoiceSession[]
  locationLogs          LocationLog[]
  mcps                  MCP[]
}
```

**UserPreferences**
```prisma
model UserPreferences {
  id                              String  @id @default(cuid())
  userId                          String  @unique
  user                            User    @relation(fields: [userId], references: [id])

  // Voice
  voiceEnabled                    Boolean @default(true)
  voiceGender                     String  @default("FEMALE")
  voiceSpeed                      Float   @default(1.0)

  // Notifications
  pushEnabled                     Boolean @default(true)
  emailEnabled                    Boolean @default(false)
  smsEnabled                      Boolean @default(false)
  proactiveAlertsEnabled          Boolean @default(true)
  lateWarningsEnabled             Boolean @default(true)

  // Alarms
  defaultAlarmTone                String?
  snoozeMinutes                   Int     @default(5)
  gradualVolumeEnabled            Boolean @default(true)

  // Localization
  language                        String  @default("es")
  timezone                        String  @default("Europe/Madrid")
  dateFormat                      String  @default("DD/MM/YYYY")
  timeFormat                      String  @default("24h")

  // Messaging
  requireConfirmationBeforeSending Boolean @default(false)
  autoReplyEnabled                Boolean @default(false)
  readReceiptsEnabled             Boolean @default(true)

  // Location
  locationTrackingEnabled         Boolean @default(false)
  geofencingEnabled               Boolean @default(false)
  proximityThresholdMeters        Int     @default(100)

  // MCPs
  allowDynamicMCPs                Boolean @default(false)
  mcpWhitelistedDomains           String  @default("[]")

  // Personalization
  interests                       String  @default("[]")
  favoriteCategories              String  @default("[]")
  customPreferences               String  @default("{}")

  createdAt                       DateTime @default(now())
  updatedAt                       DateTime @updatedAt
}
```

**Event**
```prisma
model Event {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])

  title           String
  description     String?
  type            String    @default("PERSONAL")

  startTime       DateTime
  endTime         DateTime?
  allDay          Boolean   @default(false)

  location        String?
  participants    String    @default("[]")
  recurrence      String?

  reminderMinutes Int?
  notificationSent Boolean  @default(false)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId])
  @@index([startTime])
}
```

**Message**
```prisma
model Message {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])

  contactId       String?
  contact         Contact?  @relation(fields: [contactId], references: [id])

  platform        String    // WHATSAPP, SMS, EMAIL
  direction       String    // INCOMING, OUTGOING

  to              String
  from            String?

  content         String
  subject         String?

  status          String    @default("PENDING")
  sentAt          DateTime?
  deliveredAt     DateTime?
  readAt          DateTime?

  metadata        String    @default("{}")

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId])
  @@index([platform])
  @@index([status])
}
```

**VoiceSession**
```prisma
model VoiceSession {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])

  transcript  String
  intent      String?
  entities    String    @default("{}")

  response    String?
  confidence  Float?
  successful  Boolean   @default(false)

  createdAt   DateTime  @default(now())

  @@index([userId])
  @@index([intent])
}
```

**LocationLog**
```prisma
model LocationLog {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])

  latitude    Float
  longitude   Float
  accuracy    Float?
  altitude    Float?
  speed       Float?

  address     String?

  createdAt   DateTime  @default(now())

  @@index([userId])
  @@index([createdAt])
}
```

**MCP (Model Context Protocol)**
```prisma
model MCP {
  id              String    @id @default(cuid())
  name            String
  type            String    // PRECONFIGURED, DYNAMIC, USER_CREATED
  category        String?

  description     String?
  inputSchema     String
  outputSchema    String?
  executorCode    String?

  capabilities    String    @default("[]")
  enabled         Boolean   @default(true)

  usageCount      Int       @default(0)
  rating          Float?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  executions      MCPExecution[]

  @@index([type])
  @@index([enabled])
}
```

### Database Indexes

**Performance Optimization:**

```sql
-- User lookups
CREATE INDEX idx_user_email ON User(email);

-- Event queries
CREATE INDEX idx_event_user_time ON Event(userId, startTime);
CREATE INDEX idx_event_type ON Event(type);

-- Message queries
CREATE INDEX idx_message_user_platform ON Message(userId, platform);
CREATE INDEX idx_message_status ON Message(status);
CREATE INDEX idx_message_created ON Message(createdAt DESC);

-- Voice sessions
CREATE INDEX idx_voice_user_date ON VoiceSession(userId, createdAt);
CREATE INDEX idx_voice_intent ON VoiceSession(intent);

-- Location tracking
CREATE INDEX idx_location_user_time ON LocationLog(userId, createdAt);

-- MCP queries
CREATE INDEX idx_mcp_type_enabled ON MCP(type, enabled);
CREATE INDEX idx_mcp_usage ON MCP(usageCount DESC);
```

### Migrations

**Migration Strategy:**
1. **Development**: Prisma Migrate Dev
2. **Production**: Prisma Migrate Deploy
3. **Rollback**: Manual SQL scripts

**Current Migrations:**
```
prisma/migrations/
├── 20251002234449_init/
│   └── migration.sql
├── 20251004003259_add_onboarding_and_profile_fields/
│   └── migration.sql
└── 20251005150857_add_ai_models/
    └── migration.sql
```

---

## 🔌 API Endpoints

### Complete Endpoint List

#### Health & Info (2 endpoints)

```
GET  /health
GET  /
```

#### Authentication (4 endpoints)

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
GET  /api/auth/profile  🔒
```

#### Events (6 endpoints)

```
GET    /api/events          🔒
POST   /api/events          🔒
GET    /api/events/:id      🔒
PUT    /api/events/:id      🔒
DELETE /api/events/:id      🔒
GET    /api/events/range    🔒
```

#### Messages (5 endpoints)

```
POST /api/messages          🔒
GET  /api/messages          🔒
GET  /api/messages/stats    🔒
GET  /api/messages/:id      🔒
POST /api/messages/:id/retry 🔒
```

#### Voice (3 endpoints)

```
POST /api/voice/process     🔒
GET  /api/voice/history     🔒
GET  /api/voice/stats       🔒
```

#### Location (7 endpoints)

```
POST /api/location                  🔒
GET  /api/location                  🔒
POST /api/location/geofence         🔒
GET  /api/location/geofences        🔒
POST /api/location/geocode          🔒
POST /api/location/reverse-geocode  🔒
POST /api/location/route            🔒
```

#### MCPs (7 endpoints)

```
GET    /api/mcps                🔒
POST   /api/mcps                🔒
GET    /api/mcps/:id            🔒
PUT    /api/mcps/:id            🔒
DELETE /api/mcps/:id            🔒
POST   /api/mcps/execute        🔒
PUT    /api/mcps/:id/toggle     🔒
```

#### Users (5 endpoints)

```
GET  /api/users/profile       🔒
PUT  /api/users/profile       🔒
GET  /api/users/preferences   🔒
PUT  /api/users/preferences   🔒
PUT  /api/users/password      🔒
```

**Legend:** 🔒 = Requires Authentication

---

## 🔐 Autenticación y Seguridad

### JWT Implementation

**Token Structure:**
```json
{
  "access_token": {
    "payload": {
      "userId": "string",
      "email": "string",
      "type": "access"
    },
    "expiry": "15 minutes",
    "algorithm": "HS256"
  },
  "refresh_token": {
    "payload": {
      "userId": "string",
      "email": "string",
      "type": "refresh"
    },
    "expiry": "7 days",
    "algorithm": "HS256"
  }
}
```

**Token Flow:**
```
1. User Login
   ↓
2. Validate Credentials
   ↓
3. Generate Access Token (15min)
   ↓
4. Generate Refresh Token (7 days)
   ↓
5. Return Both Tokens
   ↓
6. Client Stores Tokens
   ↓
7. Use Access Token for API Calls
   ↓
8. When Access Token Expires:
   ↓
9. Use Refresh Token to Get New Access Token
   ↓
10. Repeat from step 7
```

### Password Security

**Hashing:**
```typescript
// bcrypt with 10 rounds
const hashedPassword = await bcrypt.hash(password, 10);
```

**Validation Rules:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Special characters recommended

### Rate Limiting

**Configured Limits:**

```typescript
{
  general: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100                    // 100 requests
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 10                     // 10 attempts
  },
  mcpExecution: {
    windowMs: 60 * 1000,        // 1 minute
    max: 30                     // 30 executions
  },
  messages: {
    windowMs: 60 * 60 * 1000,   // 1 hour
    max: 20                     // 20 messages
  },
  voice: {
    windowMs: 60 * 60 * 1000,   // 1 hour
    max: 30                     // 30 commands
  },
  location: {
    windowMs: 60 * 60 * 1000,   // 1 hour
    max: 100                    // 100 updates
  }
}
```

### Security Headers (Helmet)

```typescript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000,           // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
})
```

### Input Validation

**Zod Schemas:**

```typescript
// Example: Register Schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  name: z.string().min(2).max(50),
  lastName: z.string().max(50).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  birthDate: z.string().datetime().optional()
});

// Example: Event Schema
const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['MEDICAL', 'MEETING', 'PERSONAL', 'WORK', 'BIRTHDAY', 'OTHER']),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  allDay: z.boolean().default(false),
  location: z.string().max(200).optional()
});
```

---

## 🔗 Integraciones

### Twilio (SMS + WhatsApp)

**Configuration:**
```typescript
{
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER
}
```

**Capabilities:**
- Send SMS
- Send WhatsApp messages
- Phone number validation
- Delivery status tracking
- Error handling with retries

**Rate Limits:**
- SMS: 20 per hour (configurable)
- WhatsApp: 20 per hour (configurable)

---

### SendGrid (Email)

**Configuration:**
```typescript
{
  apiKey: process.env.SENDGRID_API_KEY,
  fromEmail: process.env.SENDGRID_FROM_EMAIL,
  fromName: process.env.SENDGRID_FROM_NAME
}
```

**Capabilities:**
- Send individual emails
- Send bulk emails
- HTML templates
- Template engine
- Attachments support
- CC/BCC support
- Delivery tracking

**Features:**
```typescript
// HTML Email Template
const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
  </style>
</head>
<body>
  <div class="header">
    <h1>Kaia</h1>
  </div>
  <div class="content">
    ${content}
  </div>
</body>
</html>
`;
```

---

### Google Maps API

**Services Used:**
- Geocoding API
- Reverse Geocoding API
- Places API
- Directions API
- Distance Matrix API

**Configuration:**
```typescript
{
  apiKey: process.env.GOOGLE_MAPS_API_KEY,
  language: 'es',
  region: 'ES'
}
```

**Capabilities:**
- Convert addresses to coordinates
- Convert coordinates to addresses
- Search places
- Calculate routes
- Calculate distances
- Geofencing support

---

## ⚡ Performance y Escalabilidad

### Current Performance

**Response Times:**
```
Health Check:       < 10ms
Authentication:     50-100ms (bcrypt)
Event CRUD:         20-50ms
Message Send:       200-500ms (external API)
Voice Processing:   100-300ms
Location Update:    30-80ms
MCP Execution:      Variable (depends on MCP)
```

### Optimization Strategies

**Database:**
- Indexed columns for common queries
- Connection pooling
- Query optimization
- Lazy loading relations

**Caching Strategy (Future):**
```typescript
// Redis implementation
{
  userProfile: '5 minutes',
  userPreferences: '10 minutes',
  mcpList: '30 minutes',
  frequentQueries: '15 minutes'
}
```

**API Optimization:**
- Pagination on list endpoints
- Field selection (partial responses)
- Batch operations where possible
- Async processing for heavy tasks

### Scalability Plan

**Horizontal Scaling:**
```
Load Balancer
    │
    ├─→ App Server 1
    ├─→ App Server 2
    └─→ App Server N
    │
    ▼
Database (PostgreSQL with read replicas)
```

**Microservices (Future):**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Auth       │     │  Events     │     │  Messages   │
│  Service    │     │  Service    │     │  Service    │
└─────────────┘     └─────────────┘     └─────────────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                    API Gateway
                            │
                        Clients
```

---

## ⚙️ Configuración

### Environment Variables

**Required:**
```bash
# Server
PORT=3001
NODE_ENV=development|production

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
# OR for dev:
DATABASE_URL=file:./dev.db

# JWT
JWT_SECRET=your-secret-key-minimum-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-key-minimum-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:8081
FRONTEND_URL=https://your-frontend.com
```

**Optional (Integrations):**
```bash
# Twilio
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# SendGrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@kaia.app
SENDGRID_FROM_NAME=Kaia Assistant

# Google Maps
GOOGLE_MAPS_API_KEY=AIzaxxxxx
```

### Configuration Files

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": ["node", "jest"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**jest.config.js:**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts']
};
```

---

## 📊 Monitoring y Logging

### Winston Logger

**Configuration:**
```typescript
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

**Log Levels:**
- error: Critical errors
- warn: Warnings
- info: General information
- debug: Debug information

---

**Documento preparado por:** Claude Code Assistant
**Fecha:** 14 de Octubre, 2025
**Versión:** 1.0.0
**Próxima revisión:** Post-deployment
