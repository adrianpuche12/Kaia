# 📚 Documentación del Proyecto Kaia

**Proyecto:** Kaia - Asistente Personal Inteligente
**Versión:** 1.0.0
**Última actualización:** 5 de octubre, 2025

---

## 📋 Índice de Documentación

### 🗄️ Base de Datos
- **[DATABASE_SCHEMA.md](database/DATABASE_SCHEMA.md)** - Esquema completo de la base de datos
  - 19 modelos documentados en detalle
  - 287 campos totales
  - 23 relaciones
  - 28 índices
  - Queries útiles

- **[ER_DIAGRAM.md](database/ER_DIAGRAM.md)** - Diagramas de Entidad-Relación
  - Diagrama ER completo
  - Relaciones detalladas
  - Flujos de datos
  - Políticas de eliminación

- **[MIGRATION_GUIDE.md](database/MIGRATION_GUIDE.md)** - Guía de migración SQLite → PostgreSQL
  - Paso a paso completo
  - Scripts de exportación/importación
  - Troubleshooting
  - Guías de deployment

### 🧠 Sistema de IA
- **[AI_SYSTEM_OVERVIEW.md](architecture/AI_SYSTEM_OVERVIEW.md)** - Arquitectura del sistema de IA
  - Las 5 dimensiones de contexto
  - Repositorios y patrones
  - Flujos de datos completos
  - Componentes principales

---

## 🎯 Estado del Proyecto

**Fecha de inicio:** 5 de octubre, 2025
**Fase actual:** Fase 2 - AI Core (EN PROGRESO)
**Progreso general:** 30% (Días 1-3 completados)

### ✅ Completado

**DÍA 1: Base de Datos**
- ✅ Schema Prisma actualizado con 6 modelos de IA
- ✅ Migración creada: `20251005150857_add_ai_models`
- ✅ Cliente Prisma generado
- ✅ Auth funcionando (login, register, onboarding)

**DÍA 2: Repositorios Base**
- ✅ BaseRepository con patrón Observer
- ✅ ContextRepository completo
- ✅ 10 métodos útiles implementados

**DÍA 3: AI Core - Enums e Interfaces**
- ✅ 2 enums (EntityType, TimeOfDay)
- ✅ 5 interfaces de dimensiones de contexto
- ✅ IUnifiedContext
- ✅ Barrel exports organizados

### 🚧 En Progreso

**DÍA 4: AI Core - Analyzers** (Próximo)
- ⏳ TemporalContextAnalyzer
- ⏳ Stubs para otros analyzers
- ⏳ Testing de analyzers

---

## 📊 Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                     KAIA BACKEND                             │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐    ┌──────▼──────┐    ┌────────▼────────┐
│   DATABASE     │    │   SISTEMA   │    │   API REST      │
│   (Prisma)     │    │     IA      │    │   (Express)     │
├────────────────┤    ├─────────────┤    ├─────────────────┤
│ • User         │    │ • 5 Dims    │    │ • Auth          │
│ • Event        │    │ • Repos     │    │ • Users         │
│ • Task         │    │ • Analyzers │    │ • Events        │
│ • Context      │◄───┤ • Builder   │    │ • Voice         │
│ • Cluster      │    │ • EventBus  │    │ • MCPs          │
│ • Action       │    │             │    │                 │
└────────────────┘    └─────────────┘    └─────────────────┘
```

---

## 🗂️ Estructura de Archivos

```
backend/
├── prisma/
│   ├── schema.prisma              # Schema de BD (19 modelos)
│   ├── migrations/                # Migraciones
│   └── dev.db                     # SQLite (desarrollo)
│
├── src/
│   ├── ai/                        # Sistema de IA
│   │   └── core/
│   │       ├── enums/             # EntityType, TimeOfDay
│   │       └── interfaces/        # 5 dimensiones + IUnifiedContext
│   │
│   ├── repositories/              # Capa de datos
│   │   ├── base/                  # BaseRepository + interfaces
│   │   └── ContextRepository.ts   # Repo de contextos IA
│   │
│   ├── controllers/               # Controladores de API
│   ├── services/                  # Lógica de negocio
│   ├── routes/                    # Rutas de Express
│   └── middleware/                # Auth, validación, etc.
│
└── docs/                          # 📚 DOCUMENTACIÓN
    ├── database/
    │   ├── DATABASE_SCHEMA.md
    │   ├── ER_DIAGRAM.md
    │   └── MIGRATION_GUIDE.md
    │
    ├── architecture/
    │   └── AI_SYSTEM_OVERVIEW.md
    │
    └── README.md                  # Este archivo
```

---

## 🚀 Stack Tecnológico

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Lenguaje:** TypeScript
- **ORM:** Prisma
- **BD (dev):** SQLite
- **BD (prod):** PostgreSQL
- **Auth:** JWT

### Sistema de IA
- **Patrones:** Observer, Repository, Builder
- **Arquitectura:** 5 Dimensiones de Contexto
- **Procesamiento:** Analyzers + ContextBuilder
- **Storage:** ContextRepository

---

## 📈 Métricas del Proyecto

### Código
- **Archivos creados:** 20
- **Líneas de código:** ~1,850
- **Documentación:** ~1,300 líneas

### Base de Datos
- **Modelos:** 19
- **Campos totales:** 287
- **Relaciones:** 23
- **Índices:** 28

### Tiempo Invertido
- DÍA 1: 2h
- DÍA 2: 1h
- DÍA 3: 45min
- **Total:** 5.25h

---

## 🔍 Guías Rápidas

### Cómo usar la documentación

**Para desarrolladores nuevos:**
1. Leer [DATABASE_SCHEMA.md](database/DATABASE_SCHEMA.md) para entender la BD
2. Leer [AI_SYSTEM_OVERVIEW.md](architecture/AI_SYSTEM_OVERVIEW.md) para entender la IA
3. Revisar código en `src/`

**Para migrar a PostgreSQL:**
1. Seguir [MIGRATION_GUIDE.md](database/MIGRATION_GUIDE.md)
2. Scripts de exportación/importación incluidos
3. Guías de deployment incluidas

**Para entender el sistema de IA:**
1. Leer sección "5 Dimensiones" en [AI_SYSTEM_OVERVIEW.md](architecture/AI_SYSTEM_OVERVIEW.md)
2. Revisar interfaces en `src/ai/core/interfaces/`
3. Ver flujos de datos en documentación

---

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev                    # Iniciar servidor dev (puerto 3001)

# Base de datos
npx prisma studio             # Abrir UI de base de datos
npx prisma migrate dev        # Crear migración
npx prisma generate           # Generar cliente Prisma

# TypeScript
npx tsc --noEmit              # Verificar tipos sin compilar

# Testing (futuro)
npm test                      # Ejecutar tests
```

---

## 📝 Convenciones del Proyecto

### Nombres de archivos
- **Interfaces:** `IUnifiedContext.ts`
- **Enums:** `EntityType.ts`
- **Repositorios:** `ContextRepository.ts`
- **Servicios:** `eventService.ts`
- **Controladores:** `event.controller.ts`

### Estructura de commits
```
feat: agregar TemporalContextAnalyzer
fix: corregir cálculo de contextScore
docs: actualizar AI_SYSTEM_OVERVIEW.md
refactor: mejorar BaseRepository
```

---

## 🎯 Próximos Pasos

### Corto plazo (Semana 1)
- [ ] DÍA 4: Implementar Analyzers
- [ ] DÍA 5: Implementar ContextBuilder y EventBus
- [ ] DÍA 6-7: Migración Auth/User

### Mediano plazo (Semana 2-3)
- [ ] Implementar Task Module
- [ ] Implementar Event Module
- [ ] Implementar Cluster Module

### Largo plazo (Semana 4)
- [ ] TCA Engine
- [ ] Clustering Engine
- [ ] Job Scheduler

---

## 🤝 Contribución

Para contribuir al proyecto:
1. Leer la documentación relevante
2. Seguir las convenciones de código
3. Escribir tests para nuevas features
4. Actualizar documentación cuando sea necesario

---

## 📞 Contacto y Referencias

**Repositorio:** `C:\Users\jorge\OneDrive\Desktop\Kaia`
**Documentación Obsidian:** `C:\Users\jorge\OneDrive\Desktop\OneDrive\Documentos\Obsidian Vault\Kaia`

**Referencias externas:**
- [Prisma Docs](https://www.prisma.io/docs)
- [Express.js](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)

---

**Versión:** 1.0.0
**Última actualización:** 5 de octubre, 2025
**Estado:** Documentación completa y actualizada
