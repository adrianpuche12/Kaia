# 🧠 Sistema de IA - Arquitectura y Componentes

**Proyecto:** Kaia - Asistente Personal Inteligente
**Versión:** 1.0.0
**Fecha:** 5 de octubre, 2025

---

## 📋 Resumen

Este documento describe la arquitectura completa del sistema de IA contextual de Kaia, incluyendo las 5 dimensiones de contexto, repositorios, y componentes principales.

---

## 🎯 Visión General

El sistema de IA de Kaia está diseñado para proporcionar **inteligencia contextual** a cada acción del usuario. En lugar de tratar las tareas y eventos como elementos aislados, el sistema analiza 5 dimensiones de contexto para entender mejor las necesidades del usuario y proporcionar sugerencias proactivas.

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA DE IA KAIA                        │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
         ┌──────▼──────┐ ┌───▼────┐ ┌─────▼─────┐
         │   5 DIMS    │ │ REPOS  │ │ ANALYZERS │
         │  CONTEXTO   │ │  BASE  │ │           │
         └─────────────┘ └────────┘ └───────────┘
                │
    ┌───────────┼───────────┐
    │           │           │
┌───▼───┐  ┌───▼────┐  ┌──▼────┐
│TEMPORAL│  │SPATIAL │  │PRIORITY
└────────┘  └────────┘  └───────┘
┌───────────┐  ┌────────────┐
│RELATIONAL │  │INTENTIONAL │
└───────────┘  └────────────┘
```

---

## 🌟 Las 5 Dimensiones de Contexto

### 1. Dimensión Temporal

**Propósito:** Entender el tiempo y las fechas relacionadas con una entidad

**Componentes:**
- `timestamp`: Momento exacto de la entidad
- `timeOfDay`: Período del día (morning, afternoon, evening, night)
- `dayOfWeek`: Día de la semana (0-6)
- `isWorkday`: Si es día laboral
- `isHoliday`: Si es festivo
- `relativeTime`: Información relativa (isPast, isCurrent, isFuture, hoursUntil, daysUntil)
- `recurrence`: Patrón de recurrencia (daily, weekly, monthly, yearly)

**Uso:**
```typescript
temporal: {
  timestamp: new Date('2025-10-06T09:00:00'),
  timeOfDay: TimeOfDay.MORNING,
  dayOfWeek: 1, // Lunes
  isWorkday: true,
  isHoliday: false,
  relativeTime: {
    isPast: false,
    isCurrent: false,
    isFuture: true,
    hoursUntil: 18,
    daysUntil: 1
  }
}
```

**Casos de uso:**
- Sugerir hora óptima para una tarea
- Detectar conflictos de horario
- Priorizar tareas cercanas en el tiempo

---

### 2. Dimensión Espacial

**Propósito:** Entender la ubicación y el espacio relacionado con una entidad

**Componentes:**
- `location`: Coordenadas y dirección
- `proximity`: Entidades cercanas, distancia a casa/trabajo
- `mobility`: Requiere viaje, tiempo estimado, modo de transporte

**Uso:**
```typescript
spatial: {
  location: {
    latitude: 34.0522,
    longitude: -118.2437,
    address: '123 Main St',
    city: 'Los Angeles',
    country: 'USA'
  },
  proximity: {
    nearbyEntities: ['event-456', 'task-789'],
    distanceFromHome: 5000, // metros
    distanceFromWork: 2000
  },
  mobility: {
    requiresTravel: true,
    estimatedTravelTime: 20, // minutos
    transportMode: 'driving'
  }
}
```

**Casos de uso:**
- Agrupar tareas por ubicación
- Sugerir ruta óptima para múltiples tareas
- Alertar tiempo de salida basado en ubicación

---

### 3. Dimensión de Prioridad

**Propósito:** Entender la importancia y urgencia de una entidad

**Componentes:**
- `basePriority`: Prioridad base (0-100)
- `computedPriority`: Prioridad calculada por IA (0-100)
- `factors`: Urgencia, importancia, deadline, dependencias
- `priorityDecay`: Tasa de decaimiento de prioridad

**Uso:**
```typescript
priority: {
  basePriority: 70,
  computedPriority: 85,
  factors: {
    urgency: 90,
    importance: 80,
    deadline: new Date('2025-10-07T17:00:00'),
    dependencies: ['task-123', 'task-456'],
    blockingOthers: true
  },
  priorityDecay: {
    decayRate: 0.05,
    lastRecalculated: new Date()
  }
}
```

**Casos de uso:**
- Ordenar lista de tareas por prioridad
- Sugerir qué hacer primero
- Alertar tareas urgentes

---

### 4. Dimensión Relacional

**Propósito:** Entender las relaciones entre entidades

**Componentes:**
- `relationships`: Jerarquía (padre, hijos, relacionados, conflictos)
- `clusters`: Agrupaciones inteligentes
- `dependencies`: Bloqueos y prerequisitos

**Uso:**
```typescript
relational: {
  relationships: {
    parentId: 'project-789',
    childrenIds: ['subtask-1', 'subtask-2'],
    relatedEntityIds: ['task-456', 'event-789'],
    conflictingEntityIds: ['event-123'] // Conflicto de horario
  },
  clusters: [
    {
      clusterId: 'cluster-work',
      clusterType: 'project',
      clusterImportance: 85
    }
  ],
  dependencies: {
    blockedBy: ['task-111'],
    blocks: ['task-222', 'task-333'],
    prerequisiteFor: ['event-456']
  }
}
```

**Casos de uso:**
- Detectar dependencias circulares
- Sugerir orden de ejecución
- Agrupar tareas relacionadas

---

### 5. Dimensión Intencional

**Propósito:** Entender las intenciones del usuario y sus patrones de comportamiento

**Componentes:**
- `userIntent`: Objetivo principal, objetivos secundarios, tipo de acción
- `behaviorPatterns`: Tiempo típico de completitud, horarios preferidos, tasa de completitud
- `emotionalContext`: Nivel de estrés, motivación, satisfacción

**Uso:**
```typescript
intentional: {
  userIntent: {
    primaryGoal: 'Terminar proyecto importante',
    secondaryGoals: ['Aprender nueva tecnología', 'Mejorar productividad'],
    actionType: 'complete'
  },
  behaviorPatterns: {
    typicalCompletionTime: 120, // minutos
    preferredTimeSlots: [
      { dayOfWeek: 1, startHour: 9, endHour: 12 },
      { dayOfWeek: 3, startHour: 14, endHour: 17 }
    ],
    completionRate: 75,
    postponementFrequency: 20
  },
  emotionalContext: {
    stressLevel: 60,
    motivation: 80,
    satisfaction: 70
  }
}
```

**Casos de uso:**
- Sugerir mejor momento para una tarea
- Detectar patrones de procrastinación
- Adaptar recomendaciones al estado emocional

---

## 🗃️ Arquitectura de Repositorios

### BaseRepository

**Propósito:** Clase abstracta que todos los repositorios deben extender

**Funcionalidades:**
- Métodos CRUD abstractos (create, findById, update, delete, findMany)
- Sistema de observadores (Observer pattern)
- Helpers comunes (softDelete, exists, count)

**Diagrama:**
```
┌────────────────────────┐
│   BaseRepository<T>    │
│  (Abstract)            │
├────────────────────────┤
│ + create()             │
│ + findById()           │
│ + update()             │
│ + delete()             │
│ + findMany()           │
│                        │
│ + attach(observer)     │
│ + detach(observer)     │
│ # notifyObservers()    │
│                        │
│ # softDelete()         │
│ # exists()             │
│ # count()              │
└────────────────────────┘
           △
           │ extends
           │
  ┌────────┴─────────┐
  │                  │
┌─▼──────────┐  ┌───▼───────────┐
│   User     │  │  Event        │
│ Repository │  │ Repository    │
└────────────┘  └───────────────┘
```

**Patrón Observer:**
```typescript
// Agregar observador
repository.attach(aiObserver);

// Cuando se crea/actualiza/elimina
await repository.create(data);
// ↓
// Notifica a observadores
// ↓
// aiObserver.onRepositoryEvent(event)
// ↓
// IA procesa el evento y genera contexto
```

### ContextRepository

**Propósito:** Repositorio especializado para manejar contextos de IA

**Métodos:**
- `save(context)`: Guardar/actualizar contexto (upsert)
- `get(entityId)`: Obtener contexto por ID de entidad
- `getByUser(userId, filters?)`: Obtener contextos del usuario
- `delete(entityId)`: Eliminar contexto
- `update(entityId, updates)`: Actualizar parcialmente
- `getHighPriority(userId, limit)`: Obtener contextos prioritarios
- `cleanOldContexts(daysOld)`: Limpiar contextos antiguos

**Flujo de uso:**
```typescript
// 1. Usuario crea evento
const event = await eventRepository.create(eventData);

// 2. Observer detecta creación
// (automático)

// 3. ContextBuilder genera contexto
const context = await contextBuilder.buildContext(event);

// 4. ContextRepository guarda
await contextRepository.save(context);

// 5. Sistema puede consultar
const highPriority = await contextRepository.getHighPriority(userId);
```

---

## 📊 Base de Datos

### Modelo Context

```sql
CREATE TABLE contexts (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  entity_id       TEXT UNIQUE NOT NULL,
  entity_type     TEXT NOT NULL,

  -- Las 5 dimensiones (JSON)
  temporal        TEXT NOT NULL,
  spatial         TEXT NOT NULL,
  priority        TEXT NOT NULL,
  relational      TEXT NOT NULL,
  intentional     TEXT NOT NULL,

  context_score   REAL DEFAULT 50,
  version         INTEGER DEFAULT 1,
  last_updated    DATETIME DEFAULT CURRENT_TIMESTAMP,

  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_contexts_user_score ON contexts(user_id, context_score);
CREATE INDEX idx_contexts_user_type ON contexts(user_id, entity_type);
CREATE INDEX idx_contexts_entity ON contexts(entity_id);
```

---

## 🔄 Flujo de Datos Completo

```
┌──────────────┐
│   Usuario    │
│ crea evento  │
└──────┬───────┘
       │
       ▼
┌─────────────────┐
│ EventRepository │
│    .create()    │
└──────┬──────────┘
       │
       ├─► Guarda en BD
       │
       └─► notifyObservers()
               │
               ▼
       ┌───────────────┐
       │  AIObserver   │
       │ .onEvent()    │
       └───────┬───────┘
               │
               ▼
       ┌────────────────┐
       │ ContextBuilder │
       │ .buildContext()│
       └───────┬────────┘
               │
               ├─► TemporalAnalyzer.analyze()
               ├─► SpatialAnalyzer.analyze()
               ├─► PriorityAnalyzer.analyze()
               ├─► RelationalAnalyzer.analyze()
               └─► IntentionalAnalyzer.analyze()
                       │
                       ▼
               ┌────────────────┐
               │ IUnifiedContext│
               │   generado     │
               └───────┬────────┘
                       │
                       ▼
               ┌───────────────┐
               │ ContextRepo   │
               │    .save()    │
               └───────┬───────┘
                       │
                       └─► Contexto guardado en BD
```

---

## 🎯 Próximos Componentes

### Analyzers (DÍA 4)
- TemporalContextAnalyzer
- SpatialContextAnalyzer
- PriorityContextAnalyzer
- RelationalContextAnalyzer
- IntentionalContextAnalyzer

### ContextBuilder (DÍA 5)
- Orquesta todos los analyzers
- Calcula contextScore
- Integra con ContextRepository

### EventBus (DÍA 5)
- Sistema de eventos asíncrono
- Desacopla componentes
- Maneja triggers de IA

---

## 📚 Referencias

- [Documentación de Base de Datos](../database/DATABASE_SCHEMA.md)
- [Diagrama ER](../database/ER_DIAGRAM.md)
- [Plan de Ejecución Diario](../../docs/22.%20Plan%20de%20Ejecución%20Diario.md)

---

**Versión:** 1.0.0
**Última actualización:** 5 de octubre, 2025
**Estado:** Documentación actualizada con implementación de DÍA 3
