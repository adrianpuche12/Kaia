# Redis Caching Strategy - Día 27

## 1. Objetivos

- Implementar Redis para caching y rate limiting
- Reducir carga en PostgreSQL
- Mejorar response times en 30-50% adicional
- Escalar horizontalmente con múltiples instancias

## 2. Estado Actual

### Sin Cache
- Rate limiter usa memoria local (Map)
- Cada request va directo a PostgreSQL
- No hay persistencia de datos de rate limiting
- No funciona con múltiples instancias

### Problemas Identificados
1. Rate limiter se pierde al reiniciar
2. No funciona en entornos multi-instancia
3. Queries repetitivas a DB
4. Sin TTL automático en memoria

## 3. Arquitectura Propuesta

### Capas de Cache

```
┌─────────────────────────────────────────┐
│         Client (Mobile/Web)             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Express API Server              │
│  ┌─────────────────────────────────┐   │
│  │   Cache Middleware              │   │
│  │   - Check Redis first           │   │
│  │   - Return cached if exists     │   │
│  └────────────┬────────────────────┘   │
│               │ (cache miss)            │
│  ┌────────────▼────────────────────┐   │
│  │   Controller/Service Layer      │   │
│  │   - Process request             │   │
│  │   - Store in cache              │   │
│  └────────────┬────────────────────┘   │
└───────────────┼─────────────────────────┘
                │
    ┌───────────┴───────────┐
    │                       │
┌───▼────┐          ┌───────▼────┐
│ Redis  │          │ PostgreSQL │
│ Cache  │          │  Database  │
└────────┘          └────────────┘
```

### Componentes

1. **Redis Client** (`src/config/redis.ts`)
   - Conexión singleton
   - Health checks
   - Reconnection logic
   - Error handling

2. **Cache Service** (`src/services/cache/cacheService.ts`)
   - Generic cache operations (get, set, del, flush)
   - TTL management
   - Key generation
   - Serialization

3. **Cache Middleware** (`src/middleware/cacheMiddleware.ts`)
   - Request/response caching
   - Conditional caching
   - Cache headers

4. **Redis Rate Limiter** (`src/middleware/redisRateLimiter.ts`)
   - Migrar desde Map a Redis
   - Sliding window algorithm
   - Distributed rate limiting

## 4. Endpoints a Cachear

### Alta Prioridad (Read-Heavy)

| Endpoint | TTL | Invalidación |
|----------|-----|--------------|
| `GET /api/events` | 60s | On event create/update/delete |
| `GET /api/events/:id` | 300s | On event update/delete |
| `GET /api/events/range` | 60s | On event create/update/delete |
| `GET /api/messages` | 30s | On message create |
| `GET /api/contacts` | 300s | On contact create/update/delete |
| `GET /api/voice/history` | 120s | On voice session create |
| `GET /api/users/:id` | 600s | On user update |
| `GET /api/auth/profile` | 300s | On user update |

### Media Prioridad

| Endpoint | TTL | Invalidación |
|----------|-----|--------------|
| `GET /api/location/places` | 1800s | Manual |
| `GET /api/alarms` | 60s | On alarm create/update/delete |
| `GET /api/reminders` | 60s | On reminder create/update/delete |

### No Cachear
- POST/PUT/DELETE requests
- Real-time endpoints
- Sensitive data endpoints

## 5. Estrategias de Cache

### Cache-Aside (Lazy Loading)
```typescript
async function getEvents(userId: string) {
  // 1. Check cache
  const cached = await cache.get(`events:${userId}`);
  if (cached) return cached;

  // 2. Query database
  const events = await db.events.findMany({ where: { userId } });

  // 3. Store in cache
  await cache.set(`events:${userId}`, events, 60); // 60s TTL

  return events;
}
```

### Write-Through
```typescript
async function createEvent(userId: string, data: EventData) {
  // 1. Write to database
  const event = await db.events.create({ data });

  // 2. Invalidate cache
  await cache.del(`events:${userId}`);
  await cache.del(`events:range:${userId}:*`);

  return event;
}
```

### Cache Invalidation Patterns

1. **Individual Item**: `cache.del('events:123')`
2. **User List**: `cache.del('events:user:456')`
3. **Pattern Match**: `cache.delPattern('events:user:456:*')`
4. **Time-based**: TTL automático

## 6. Key Naming Convention

```
<resource>:<identifier>:<optional-params>

Ejemplos:
- events:user:123                    # All events for user 123
- events:123                         # Event with id 123
- events:range:user:123:2025-10-01  # Event range query
- messages:user:123:contact:456     # Messages between users
- user:profile:123                  # User profile
- ratelimit:auth:192.168.1.1        # Rate limit for IP
```

## 7. TTL Strategy

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| User profile | 10 min | Changes infrequently |
| Events list | 1 min | Updates frequently |
| Single event | 5 min | Specific data |
| Messages | 30s | Real-time feel |
| Contacts | 5 min | Changes rarely |
| Places | 30 min | Static data |
| Rate limits | 15 min | Matches rate window |

## 8. Monitoring & Metrics

### Métricas a Trackear

```typescript
interface CacheMetrics {
  hits: number;           // Successful cache hits
  misses: number;         // Cache misses
  sets: number;           // Items stored
  deletes: number;        // Items invalidated
  hitRate: number;        // hits / (hits + misses)
  avgResponseTime: number; // Average response time
  memoryUsage: number;    // Redis memory usage
}
```

### Health Endpoint

```
GET /health/cache
{
  "status": "healthy",
  "redis": {
    "connected": true,
    "uptime": 3600,
    "memoryUsed": "12.5MB",
    "keys": 1234
  },
  "metrics": {
    "hitRate": 0.87,
    "totalHits": 45000,
    "totalMisses": 6000
  }
}
```

## 9. Error Handling

### Cache Miss Strategy
```typescript
try {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
} catch (error) {
  logger.error('Redis error, falling back to DB', error);
  // Fallback to database
}
```

### Graceful Degradation
- Redis down → Continue without cache
- Log errors but don't break requests
- Set circuit breaker after N failures

## 10. Implementation Order

### Phase 1: Redis Setup (30 min)
1. Add Redis to Railway
2. Install `ioredis` package
3. Create Redis client config
4. Test connection

### Phase 2: Cache Service (45 min)
1. Create CacheService class
2. Implement get/set/del/flush
3. Add key generation utilities
4. Add serialization helpers

### Phase 3: Migrate Rate Limiter (30 min)
1. Create RedisRateLimiter
2. Replace Map with Redis
3. Test rate limiting
4. Update existing rate limiters

### Phase 4: Cache Middleware (45 min)
1. Create cache middleware
2. Add conditional caching logic
3. Implement cache headers
4. Add cache invalidation hooks

### Phase 5: Apply to Endpoints (60 min)
1. Events endpoints
2. Messages endpoints
3. User/Auth endpoints
4. Other read-heavy endpoints

### Phase 6: Monitoring (30 min)
1. Add metrics collection
2. Create health endpoint
3. Add logging
4. Dashboard setup (optional)

### Phase 7: Testing (30 min)
1. Unit tests for cache service
2. Integration tests
3. Load test comparison
4. Verify invalidation

## 11. Expected Improvements

### Performance
- Response time: -30-50% (from 27ms to ~15-18ms avg)
- Database load: -60-80%
- Throughput: +100-200%

### Scalability
- Support multiple API instances
- Horizontal scaling ready
- Distributed rate limiting

### Reliability
- Persistent rate limiting
- Graceful degradation
- Better error handling

## 12. Configuration

### Environment Variables
```bash
# Redis (Railway will provide)
REDIS_URL=redis://default:password@host:6379
REDIS_TLS=true

# Cache settings
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=60
CACHE_MAX_MEMORY=100mb
```

### Railway Redis Plan
- **Starter Plan**: 256MB RAM, $5/month
- **Pro Plan**: 1GB RAM, $10/month
- Recommendation: Starter sufficient for MVP

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cache stampede | High | Use locking mechanism |
| Stale data | Medium | Proper TTLs + invalidation |
| Memory overflow | High | Set max memory policy (LRU) |
| Redis downtime | Medium | Graceful fallback to DB |
| Wrong invalidation | Low | Comprehensive testing |

## 14. Success Criteria

- [ ] Redis connected and healthy
- [ ] Cache hit rate > 70%
- [ ] Average response time < 20ms
- [ ] Rate limiter works across instances
- [ ] Zero breaking changes to API
- [ ] Graceful degradation tested
- [ ] Load test shows improvement

---

**Created:** October 16, 2025
**Status:** Design Complete - Ready for Implementation
