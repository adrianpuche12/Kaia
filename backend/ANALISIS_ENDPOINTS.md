# Análisis de Endpoints - Backend vs Frontend

## Endpoints de Eventos

### ✅ Implementados en Backend Y Frontend

| Método | Endpoint | Backend | Frontend | Usado en App |
|--------|----------|---------|----------|--------------|
| POST | /events | ✅ | ✅ createEvent() | ❌ |
| POST | /events/voice-command | ✅ | ✅ processVoiceCommand() | ✅ |
| GET | /events | ✅ | ✅ listEvents() | ❌ |
| GET | /events/today | ✅ | ✅ getTodayEvents() | ✅ |
| GET | /events/week | ✅ | ✅ getWeekEvents() | ✅ |
| GET | /events/upcoming | ✅ | ✅ getUpcomingEvents() | ✅ |
| GET | /events/:id | ✅ | ✅ getEventById() | ❌ |
| PUT | /events/:id | ✅ | ✅ updateEvent() | ❌ |
| POST | /events/:id/cancel | ✅ | ✅ cancelEvent() | ❌ |
| POST | /events/:id/complete | ✅ | ✅ completeEvent() | ❌ |
| DELETE | /events/:id | ✅ | ✅ deleteEvent() | ❌ |

### ❌ Solo en Frontend (NO implementados en backend)

| Método | Endpoint | Función Frontend | Necesario |
|--------|----------|------------------|-----------|
| PATCH | /events/:id/status | updateEventStatus() | ⚠️ Duplicado con cancel/complete |
| POST | /events/:id/participants | addParticipant() | ✅ SÍ |
| DELETE | /events/:id/participants/:userId | removeParticipant() | ✅ SÍ |
| GET | /events/search | searchEvents() | ✅ SÍ (usar con filtro q) |
| POST | /events/bulk | bulkCreateEvents() | ⚠️ Opcional |
| GET | /events/calendar/:month | getMonthCalendar() | ⚠️ Opcional |

### ❌ FALTA: Endpoint de Consultas por Voz

**NO EXISTE** un endpoint para consultas tipo:
- "¿Qué tengo hoy?"
- "¿Cuáles son mis citas de mañana?"
- "Cuéntame mi agenda de la semana"

**Propuesta**:
```
POST /api/voice/query
Body: { "transcript": "¿qué tengo hoy?" }
Response: {
  "answer": "Tienes 2 eventos hoy: Cita con el dentista a las 3 PM...",
  "events": [...],
  "type": "EVENT_QUERY"
}
```

## Prioridades de Implementación

### 🔴 Prioridad ALTA (implementar YA)

1. **POST /api/voice/query** - Consultas conversacionales
   - Detectar si es consulta vs comando
   - Retornar respuesta + datos estructurados
   - Usar AIService para generar respuesta natural

2. **GET /events/search** - Búsqueda de eventos
   - Alternativa: usar GET /events?q=query
   - Ya soportado parcialmente en backend

3. **POST /events/:id/participants** - Agregar participante
   - Actualizar campo participants (JSON array)

4. **DELETE /events/:id/participants/:userId** - Remover participante
   - Actualizar campo participants (JSON array)

### 🟡 Prioridad MEDIA

5. **POST /events/bulk** - Creación masiva
   - Útil para importar calendarios
   - Transaccional

6. **GET /events/calendar/:month** - Vista de calendario
   - Agrupar eventos por día
   - Optimizado para renderizar calendarios

### 🟢 Prioridad BAJA

7. **PATCH /events/:id/status** - Actualizar status
   - Ya existe con /cancel y /complete
   - Redundante pero más RESTful

## Endpoints de Voz

### ✅ Implementados en Backend

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /voice/process | Procesar comando de voz (mock) |
| GET | /voice/history | Historial de comandos |
| GET | /voice/stats | Estadísticas |
| GET | /voice/accuracy | Precisión por intent |
| GET | /voice/intents | Intenciones frecuentes |

### ❌ NO implementados en Frontend

El frontend NO usa ninguno de estos endpoints de `/voice/*`

Todo el procesamiento de voz se hace directamente:
- AgendaScreen → eventAPI.processVoiceCommand()
- NO usa VoiceController

## Recomendaciones

### Arquitectura Propuesta

```
COMANDOS (crear, modificar, eliminar)
  → POST /api/events/voice-command
  → AIService.processVoiceCommand()
  → EventService.createEvent()

CONSULTAS (leer, preguntar, listar)
  → POST /api/voice/query
  → AIService.processVoiceQuery()
  → EventService.getTodayEvents() / getWeekEvents()
  → AIService.generateNaturalResponse()
```

### Implementación Sugerida

1. Crear `/api/voice/query` endpoint
2. Reutilizar AIService pero con modo "consulta"
3. Detectar automáticamente si es comando vs consulta
4. Retornar:
   - Respuesta en lenguaje natural
   - Datos estructurados (eventos, etc.)
   - Confianza del análisis

### Frontend - Funciones No Usadas

Eliminar o implementar backend para:
- `updateEventStatus()` - No se usa en AgendaScreen
- `addParticipant()` - No se usa
- `removeParticipant()` - No se usa
- `searchEvents()` - No se usa (podría ser útil)
- `bulkCreateEvents()` - No se usa
- `getMonthCalendar()` - No se usa

## Próximos Pasos

1. ✅ Implementar POST /api/voice/query
2. ✅ Implementar GET /events/search (o usar ?q=)
3. ✅ Implementar endpoints de participants
4. ⚠️ Decidir si mantener endpoints no usados
5. ⚠️ Limpiar código muerto del frontend
