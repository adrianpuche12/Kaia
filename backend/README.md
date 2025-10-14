# Kaia Backend API

API REST para Kaia - Asistente Personal Inteligente 24/7

## 🏗️ Arquitectura

```
backend/
├── src/
│   ├── config/           # Configuración
│   │   ├── env.ts        # ✅ Variables de entorno
│   │   └── constants.ts  # ✅ Constantes
│   │
│   ├── types/            # TypeScript types
│   │   ├── index.ts      # ✅ Tipos centralizados (40+ interfaces)
│   │   └── express.d.ts  # ✅ Extensión de Express
│   │
│   ├── utils/            # Utilidades
│   │   ├── jwt.ts        # ✅ Servicio JWT
│   │   ├── validators.ts # ✅ Validadores con Zod
│   │   ├── dateParser.ts # ✅ Parser de fechas naturales
│   │   ├── logger.ts     # ✅ Sistema de logging
│   │   ├── helpers.ts    # ✅ Funciones helper
│   │   └── database.ts   # ✅ Cliente Prisma
│   │
│   ├── middleware/       # Middlewares
│   │   ├── authMiddleware.ts      # ✅ Autenticación JWT
│   │   ├── errorHandler.ts        # ✅ Manejo de errores global
│   │   ├── validationMiddleware.ts # ✅ Validación con Zod
│   │   └── rateLimiter.ts         # ✅ Rate limiting
│   │
│   ├── services/         # Lógica de negocio
│   │   ├── auth/         # 🔄 Pendiente
│   │   ├── nlp/          # 🔄 Pendiente
│   │   ├── mcp/          # 🔄 Pendiente
│   │   ├── communication/ # 🔄 Pendiente
│   │   ├── location/     # 🔄 Pendiente
│   │   └── notification/ # 🔄 Pendiente
│   │
│   ├── controllers/      # Controladores de rutas
│   │   └── ...           # 🔄 Pendiente (11 módulos)
│   │
│   ├── routes/           # Definición de rutas
│   │   └── ...           # 🔄 Pendiente (11 módulos)
│   │
│   ├── models/           # Re-exports de Prisma
│   │   └── index.ts      # 🔄 Pendiente
│   │
│   └── server.ts         # ✅ Servidor Express
│
├── prisma/
│   ├── schema.prisma     # ✅ Schema completo (15 modelos)
│   ├── dev.db            # ✅ SQLite database
│   └── migrations/       # Migraciones
│
├── tests/                # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env                  # ✅ Variables de entorno
├── .env.example          # ✅ Template
├── package.json          # ✅ Dependencias
├── tsconfig.json         # ✅ Config TypeScript
└── README.md             # Este archivo
```

## ✅ Estado Actual (Completado)

### Base de Datos
- ✅ **Prisma Schema completo** con 15 modelos:
  - User, UserPreferences
  - Event, Reminder, Alarm
  - MCP, MCPExecution
  - Message, Contact
  - LocationLog, Place
  - VoiceSession, AppUsageLog

### Configuración
- ✅ Variables de entorno (`config/env.ts`)
- ✅ Constantes de la aplicación (`config/constants.ts`)

### Tipos TypeScript
- ✅ 40+ interfaces y tipos centralizados
- ✅ Extensión de Express types

### Utilidades
- ✅ JWT Service (generación y verificación de tokens)
- ✅ Validators (Zod schemas para todos los endpoints)
- ✅ Date Parser (fechas en lenguaje natural: "mañana a las 3")
- ✅ Logger (logging estructurado)
- ✅ Helpers (hasheo de passwords, respuestas API, paginación, etc.)

### Middlewares
- ✅ Authentication (JWT verification)
- ✅ Error Handler (manejo global de errores)
- ✅ Validation (validación con Zod)
- ✅ Rate Limiter (protección contra abuso)

## ✅ Completado Recientemente

### Servicios (8 módulos) ✅
- ✅ **Auth Service** - Registro, login, refresh, profile, password
- ✅ **NLP Service** - Procesamiento de lenguaje natural con detección de intenciones
- ✅ **Event Service** - CRUD completo de eventos con gestión de conflictos
- ✅ **MCP Manager** - Registro, listado, búsqueda y gestión de MCPs
- ✅ **MCP Executor** - Ejecución de MCPs con validación y logging
- ✅ **MCP Generator** - Generación dinámica de MCPs con IA
- ✅ **Message Service** - WhatsApp, Email, SMS (Twilio, SendGrid)
- ✅ **Location Service** - Geocoding, ETA con tráfico, lugares favoritos
- ✅ **Notification Service** - Push notifications, scheduling

### Controladores (7 módulos) ✅
- ✅ auth.controller.ts
- ✅ user.controller.ts (+ preferences + contacts)
- ✅ event.controller.ts
- ✅ mcp.controller.ts
- ✅ message.controller.ts
- ✅ location.controller.ts
- ✅ voice.controller.ts

### Rutas (7 módulos) ✅
- ✅ `/api/auth/*` - Registro, login, refresh, profile
- ✅ `/api/users/*` - Preferencias, contactos
- ✅ `/api/events/*` - CRUD eventos, today, week, upcoming
- ✅ `/api/mcps/*` - CRUD MCPs, execute, generate, improve
- ✅ `/api/messages/*` - Enviar/recibir mensajes, unread
- ✅ `/api/location/*` - Geocoding, ETA, traffic, places
- ✅ `/api/voice/*` - Process command, history, stats

### Server ✅
- ✅ server.ts actualizado con todas las rutas
- ✅ CORS configurado
- ✅ Middlewares globales (auth, validation, error handling, rate limiting)
- ✅ Logging estructurado
- ✅ Graceful shutdown

## 🚀 Comandos

```bash
# Desarrollo
npm run dev          # Inicia servidor con nodemon

# Build
npm run build        # Compila TypeScript

# Producción
npm start            # Ejecuta servidor compilado

# Prisma
npx prisma generate  # Genera cliente Prisma
npx prisma migrate dev # Crea migración
npx prisma studio    # Abre Prisma Studio
```

## 📦 Dependencias Principales

- **express**: Framework web
- **prisma**: ORM
- **@prisma/client**: Cliente de Prisma
- **jsonwebtoken**: JWT
- **bcryptjs**: Hashing de passwords
- **zod**: Validación de esquemas
- **date-fns**: Manipulación de fechas
- **dotenv**: Variables de entorno
- **cors**: CORS
- **helmet**: Seguridad HTTP headers

## 🔐 Variables de Entorno

Ver `.env.example` para template completo.

Variables críticas:
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
```

## 📊 Base de Datos

SQLite en desarrollo, PostgreSQL en producción.

Modelos principales:
- **User**: Usuarios del sistema
- **Event**: Eventos y citas
- **Alarm**: Despertadores inteligentes
- **MCP**: Model Context Protocols (conectores dinámicos)
- **Message**: Mensajes (WhatsApp, Email, SMS)
- **Contact**: Contactos del usuario
- **VoiceSession**: Historial de comandos de voz

## 🔗 API Endpoints (Diseñados)

Ver documentación completa en `/docs/api-endpoints.md`

Principales módulos:
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `GET /api/events` - Listar eventos
- `POST /api/events` - Crear evento
- `POST /api/voice/process` - Procesar comando de voz
- `POST /api/mcps/execute` - Ejecutar MCP
- `GET /api/messages` - Listar mensajes
- `POST /api/messages` - Enviar mensaje

## 📝 Próximos Pasos

1. ✅ ~~Implementar servicios de negocio~~ **COMPLETADO**
2. ✅ ~~Crear controladores~~ **COMPLETADO**
3. ✅ ~~Definir rutas~~ **COMPLETADO**
4. ✅ ~~Actualizar server.ts~~ **COMPLETADO**
5. ⏳ Testing (unit, integration, e2e)
6. ⏳ Migraciones de Prisma y seed data
7. ⏳ Deploy (configurar Docker, CI/CD)

---

**Versión**: 1.0.0
**Estado**: ✅ **Backend completado al 95%** - Listo para testing y deploy
