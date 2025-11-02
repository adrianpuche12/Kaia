# Day 28 - Testing, Optimización y Monitoreo de Cache

**Fecha Planeada**: 18 de Octubre, 2025
**Duración Estimada**: 2-3 horas
**Estado**: Pendiente
**Prioridad**: Alta

---

## 🎯 Objetivo Principal

Completar la implementación de Redis con tests automatizados, optimizaciones de performance y sistema de monitoreo avanzado.

---

## 📋 Tareas Planeadas

### Fase 1: Tests Automatizados (1 hora)

#### 1.1 Tests para CacheService
```typescript
// tests/services/cache/cacheService.test.ts

describe('CacheService', () => {
  describe('get/set operations', () => {
    test('should store and retrieve data', async () => {
      await cacheService.set('test-key', { foo: 'bar' }, 60);
      const result = await cacheService.get('test-key');
      expect(result).toEqual({ foo: 'bar' });
    });

    test('should return null for non-existent key', async () => {
      const result = await cacheService.get('non-existent');
      expect(result).toBeNull();
    });

    test('should respect TTL', async () => {
      await cacheService.set('ttl-test', 'value', 1);
      await new Promise(resolve => setTimeout(resolve, 1500));
      const result = await cacheService.get('ttl-test');
      expect(result).toBeNull();
    });
  });

  describe('pattern operations', () => {
    test('should delete keys by pattern', async () => {
      await cacheService.set('events:user:1:all', 'data1');
      await cacheService.set('events:user:1:today', 'data2');
      await cacheService.set('events:user:2:all', 'data3');

      const deleted = await cacheService.delPattern('events:user:1:*');
      expect(deleted).toBe(2);
    });
  });

  describe('metrics', () => {
    test('should track hits and misses', async () => {
      cacheService.resetMetrics();

      await cacheService.set('metric-test', 'value');
      await cacheService.get('metric-test'); // HIT
      await cacheService.get('non-existent'); // MISS

      const metrics = cacheService.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);
      expect(metrics.sets).toBe(1);
      expect(metrics.hitRate).toBe(0.5);
    });
  });
});
```

**Archivos a crear**:
- `tests/services/cache/cacheService.test.ts`
- `tests/middleware/cacheMiddleware.test.ts`
- `tests/middleware/redisRateLimiter.test.ts`

**Comandos**:
```bash
npm test -- cacheService
npm test -- cacheMiddleware
npm test -- redisRateLimiter
npm run test:coverage
```

---

### Fase 2: Optimizaciones (45 minutos)

#### 2.1 Migrar a Red Privada de Railway

**Problema Actual**: Usando `REDIS_PUBLIC_URL` (latencia ~1-5ms)
**Objetivo**: Usar `REDIS_URL` (latencia <1ms)

**Pasos**:
1. Verificar que la red privada esté habilitada en Railway
2. Cambiar variable en Kaia backend:
   ```bash
   railway variables --set REDIS_URL='${{Redis.REDIS_URL}}'
   ```
3. Redeploy y verificar conexión
4. Medir mejora de latencia

**Resultado Esperado**: Latencia reducida de ~2-5ms a <1ms

---

#### 2.2 Cache Warming Strategy

Implementar pre-carga de cache al inicio de la aplicación:

```typescript
// src/services/cache/cacheWarming.ts

export class CacheWarming {
  async warmCache() {
    logger.info('🔥 Starting cache warming...');

    // Pre-load common queries
    const tasks = [
      this.warmUserCaches(),
      this.warmEventCaches(),
      this.warmSystemCaches(),
    ];

    await Promise.allSettled(tasks);
    logger.info('✅ Cache warming completed');
  }

  private async warmUserCaches() {
    // Load active users' recent events
    const activeUsers = await userRepository.getActiveUsers(100);

    for (const user of activeUsers) {
      await cacheService.set(
        `events:user:${user.id}:recent`,
        await eventRepository.getRecentEvents(user.id),
        300
      );
    }
  }

  private async warmEventCaches() {
    // Load today's events for all users
    const todayEvents = await eventRepository.getTodayEvents();
    await cacheService.set('events:today:all', todayEvents, 60);
  }

  private async warmSystemCaches() {
    // Load system-wide statistics
    const stats = await getSystemStats();
    await cacheService.set('system:stats', stats, 300);
  }
}

// En server.ts
app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);

  // Warm cache after server starts
  if (config.cacheEnabled) {
    await new CacheWarming().warmCache();
  }
});
```

**Archivo a crear**: `src/services/cache/cacheWarming.ts`

---

#### 2.3 TTL Adaptativo

Implementar TTL dinámico basado en patrones de uso:

```typescript
// src/services/cache/adaptiveTTL.ts

export class AdaptiveTTL {
  private hitCounts = new Map<string, number>();

  calculateTTL(key: string, baselineTTL: number): number {
    const hits = this.hitCounts.get(key) || 0;

    // Increase TTL for frequently accessed data
    if (hits > 100) return baselineTTL * 3;
    if (hits > 50) return baselineTTL * 2;
    if (hits > 10) return baselineTTL * 1.5;

    return baselineTTL;
  }

  recordHit(key: string) {
    const current = this.hitCounts.get(key) || 0;
    this.hitCounts.set(key, current + 1);
  }
}
```

---

#### 2.4 Cache de Búsquedas

Agregar caching a endpoints de búsqueda:

```typescript
// src/routes/search.routes.ts

router.get('/search',
  cacheMiddleware({
    ttl: 180,
    keyGenerator: (req) => {
      const query = req.query.q as string;
      const userId = (req as any).user?.id;
      return `search:user:${userId}:query:${query}`;
    },
    condition: (req) => {
      // Only cache queries longer than 3 chars
      const query = req.query.q as string;
      return query && query.length >= 3;
    }
  }),
  SearchController.search
);
```

---

### Fase 3: Monitoreo Avanzado (45 minutos)

#### 3.1 Métricas Detalladas

Crear endpoint de métricas para Prometheus/Grafana:

```typescript
// src/routes/metrics.routes.ts

router.get('/metrics', authenticate, async (req, res) => {
  const cacheMetrics = cacheService.getMetrics();
  const redisInfo = await RedisClient.getInfo();

  res.json({
    cache: {
      ...cacheMetrics,
      avgLatency: await calculateAvgLatency(),
      topKeys: await getTopCachedKeys(10),
      evictionRate: calculateEvictionRate(),
    },
    redis: {
      ...redisInfo,
      commandsPerSec: await getCommandsPerSecond(),
      memoryFragmentation: calculateFragmentation(),
    },
    rateLimiting: {
      rejectedRequests: await getRejectedCount(),
      topLimitedIPs: await getTopLimitedIPs(10),
    }
  });
});
```

**Archivo a crear**: `src/routes/metrics.routes.ts`

---

#### 3.2 Sistema de Alertas

Implementar alertas cuando métricas excedan umbrales:

```typescript
// src/services/monitoring/alerts.ts

export class AlertSystem {
  async checkCacheHealth() {
    const metrics = cacheService.getMetrics();

    // Alert if hit rate is too low
    if (metrics.hitRate < 0.3 && metrics.hits + metrics.misses > 1000) {
      await this.sendAlert({
        type: 'LOW_HIT_RATE',
        message: `Cache hit rate is ${metrics.hitRate.toFixed(2)} (below 30%)`,
        severity: 'warning',
      });
    }

    // Alert if error rate is high
    if (metrics.errors > 100) {
      await this.sendAlert({
        type: 'HIGH_ERROR_RATE',
        message: `Cache errors: ${metrics.errors}`,
        severity: 'critical',
      });
    }

    // Alert if Redis memory is high
    const info = await RedisClient.getInfo();
    if (info && info.usedMemory > '100M') {
      await this.sendAlert({
        type: 'HIGH_MEMORY_USAGE',
        message: `Redis memory: ${info.usedMemory}`,
        severity: 'warning',
      });
    }
  }

  private async sendAlert(alert: Alert) {
    // Implement alert delivery (email, Slack, etc.)
    logger.error(`ALERT [${alert.severity}]: ${alert.message}`);
  }
}

// Ejecutar cada 5 minutos
setInterval(() => {
  new AlertSystem().checkCacheHealth();
}, 5 * 60 * 1000);
```

**Archivo a crear**: `src/services/monitoring/alerts.ts`

---

#### 3.3 Dashboard de Métricas

Crear página HTML simple para visualizar métricas:

```html
<!-- public/cache-dashboard.html -->

<!DOCTYPE html>
<html>
<head>
  <title>Cache Metrics Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h1>Kaia Cache Metrics</h1>

  <div id="metrics">
    <h2>Current Status</h2>
    <div id="status"></div>

    <h2>Hit Rate (Last Hour)</h2>
    <canvas id="hitRateChart"></canvas>

    <h2>Latency Distribution</h2>
    <canvas id="latencyChart"></canvas>

    <h2>Top Cached Keys</h2>
    <table id="topKeysTable"></table>
  </div>

  <script>
    async function loadMetrics() {
      const response = await fetch('/api/metrics');
      const data = await response.json();

      // Update status
      document.getElementById('status').innerHTML = `
        <p>Hit Rate: ${(data.cache.hitRate * 100).toFixed(2)}%</p>
        <p>Avg Latency: ${data.cache.avgLatency}ms</p>
        <p>Redis Memory: ${data.redis.usedMemory}</p>
      `;

      // Update charts...
    }

    setInterval(loadMetrics, 5000); // Refresh every 5s
    loadMetrics();
  </script>
</body>
</html>
```

**Archivo a crear**: `public/cache-dashboard.html`

---

### Fase 4: Documentación y Validación (30 minutos)

#### 4.1 Actualizar README

Agregar sección de caching al README:

```markdown
## Caching

Kaia uses Redis for distributed caching. This improves performance and enables horizontal scaling.

### Configuration

Environment variables:
- `CACHE_ENABLED`: Enable/disable caching (default: false)
- `REDIS_URL`: Redis connection URL
- `CACHE_DEFAULT_TTL`: Default TTL in seconds (default: 60)

### Cache Strategy

- **Events**: 60s TTL for lists, 300s for individual items
- **Searches**: 180s TTL
- **System Stats**: 300s TTL

### Monitoring

Cache metrics available at `/api/metrics`
Dashboard available at `/cache-dashboard.html`
```

---

#### 4.2 Tests de Integración

Crear tests end-to-end:

```typescript
// tests/integration/cache.integration.test.ts

describe('Cache Integration', () => {
  test('should cache GET requests', async () => {
    const token = await getAuthToken();

    // First request - MISS
    const response1 = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${token}`);

    expect(response1.headers['x-cache']).toBe('MISS');

    // Second request - HIT
    const response2 = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${token}`);

    expect(response2.headers['x-cache']).toBe('HIT');
    expect(response2.body).toEqual(response1.body);
  });

  test('should invalidate cache on writes', async () => {
    const token = await getAuthToken();

    // Cache events
    await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${token}`);

    // Create new event (invalidates cache)
    await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Event', startDate: new Date() });

    // Next request should be MISS
    const response = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${token}`);

    expect(response.headers['x-cache']).toBe('MISS');
  });
});
```

---

## 🎯 Objetivos Medibles

### Tests
- [ ] Coverage de CacheService: >90%
- [ ] Coverage de Cache Middleware: >85%
- [ ] Coverage de Rate Limiter: >80%
- [ ] Tests de integración pasando: 100%

### Performance
- [ ] Latencia Redis: <1ms (migrar a red privada)
- [ ] Cache hit rate: >40% después de warming
- [ ] Reducción de queries DB: >70%

### Monitoreo
- [ ] Endpoint de métricas funcionando
- [ ] Dashboard visual creado
- [ ] Sistema de alertas configurado
- [ ] Documentación actualizada

---

## 📁 Archivos a Crear

### Tests (7 archivos)
1. `tests/services/cache/cacheService.test.ts`
2. `tests/services/cache/cacheWarming.test.ts`
3. `tests/middleware/cacheMiddleware.test.ts`
4. `tests/middleware/redisRateLimiter.test.ts`
5. `tests/integration/cache.integration.test.ts`
6. `tests/integration/rateLimiter.integration.test.ts`
7. `tests/utils/redisTestSetup.ts`

### Features (5 archivos)
8. `src/services/cache/cacheWarming.ts`
9. `src/services/cache/adaptiveTTL.ts`
10. `src/services/monitoring/alerts.ts`
11. `src/routes/metrics.routes.ts`
12. `public/cache-dashboard.html`

### Documentación (2 archivos)
13. Actualizar `README.md`
14. Crear `CACHING_GUIDE.md`

---

## 🛠️ Comandos para el Día 28

### Setup Inicial
```bash
cd C:\Users\jorge\OneDrive\Desktop\Kaia\backend

# Crear carpetas de tests
mkdir -p tests/services/cache
mkdir -p tests/middleware
mkdir -p tests/integration
mkdir -p tests/utils

# Crear carpetas de features
mkdir -p src/services/monitoring
mkdir -p public
```

### Durante el Desarrollo
```bash
# Correr tests mientras desarrollas
npm test -- --watch

# Ver coverage
npm run test:coverage

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

### Deployment
```bash
# Commit cambios
git add .
git commit -m "feat: Day 28 - Tests, optimizations and monitoring"

# Push a GitHub
git push origin master

# Verificar deployment en Railway
railway status

# Ver logs
railway logs
```

### Verificación Final
```bash
# Health check
curl https://kaia-production.up.railway.app/health

# Metrics endpoint
curl https://kaia-production.up.railway.app/api/metrics

# Cache dashboard
open https://kaia-production.up.railway.app/cache-dashboard.html
```

---

## 📊 Checklist de Completitud

### Antes de Empezar
- [ ] Revisar documentación de Day 27
- [ ] Verificar que Redis esté funcionando
- [ ] Confirmar que tests actuales pasan

### Durante el Desarrollo
- [ ] Escribir tests para cada feature
- [ ] Ejecutar tests localmente
- [ ] Verificar coverage >80%
- [ ] Actualizar documentación

### Antes de Deployment
- [ ] Todos los tests pasando
- [ ] No hay errores de TypeScript
- [ ] Lint pasando
- [ ] README actualizado

### Después del Deployment
- [ ] Health endpoint muestra métricas correctas
- [ ] Cache warming ejecutándose
- [ ] Alertas funcionando
- [ ] Dashboard accesible

---

## 🎓 Conceptos a Aplicar

### Testing
- **Unit Tests**: Funciones individuales aisladas
- **Integration Tests**: Flujo completo de requests
- **Mocking**: Mock de Redis para tests rápidos
- **Coverage**: Medir porcentaje de código testeado

### Performance
- **Cache Warming**: Pre-cargar cache al inicio
- **Adaptive TTL**: Ajustar TTL según uso
- **Network Optimization**: Red privada vs pública
- **Query Reduction**: Medir reducción de DB queries

### Monitoring
- **Metrics Collection**: Recolectar datos en tiempo real
- **Alerting**: Notificar cuando hay problemas
- **Dashboards**: Visualizar métricas
- **Logging**: Logs estructurados para debugging

---

## 🔮 Extensiones Opcionales

Si hay tiempo extra, considerar:

1. **Cache de Búsquedas con Fuzzy Matching**
   - Implementar cache para búsquedas similares
   - Usar Levenshtein distance para matching

2. **Cache Multi-Tier**
   - L1: In-memory cache (fastest)
   - L2: Redis cache (fast)
   - L3: Database (slowest)

3. **Compression**
   - Comprimir valores grandes antes de cachear
   - Usar gzip o brotli

4. **Cache Stampede Prevention**
   - Lock mechanism para evitar multiple DB queries simultáneas
   - Usar Redis SETNX

5. **Geo-Distributed Caching**
   - Redis Cluster para múltiples regiones
   - Replicación cross-region

---

## 📚 Referencias Útiles

### Testing
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest](https://github.com/visionmedia/supertest)
- [ioredis-mock](https://github.com/stipsan/ioredis-mock)

### Performance
- [Redis Best Practices](https://redis.io/docs/management/optimization/)
- [Caching Strategies](https://aws.amazon.com/caching/best-practices/)

### Monitoring
- [Prometheus](https://prometheus.io/)
- [Grafana](https://grafana.com/)
- [Redis Monitoring](https://redis.io/docs/management/monitoring/)

---

## ⚠️ Notas Importantes

1. **No Romper Producción**: Todos los cambios deben ser backward compatible
2. **Tests Primero**: Escribir tests antes de implementar features
3. **Documentar Todo**: Cada función debe tener JSDoc
4. **Commits Atómicos**: Un commit por feature
5. **Review Antes de Push**: Verificar que todo funciona localmente

---

## 🎯 Resultado Esperado del Día 28

Al finalizar el día, deberías tener:

1. ✅ **Suite de tests completa** (>80% coverage)
2. ✅ **Cache warming** funcionando al inicio
3. ✅ **Red privada** configurada (<1ms latency)
4. ✅ **Sistema de monitoreo** con métricas y alertas
5. ✅ **Dashboard visual** para ver métricas
6. ✅ **Documentación completa** actualizada
7. ✅ **Todo deployado** y funcionando en producción

**Performance Target**:
- Cache hit rate: >40%
- Redis latency: <1ms
- DB query reduction: >70%
- Test coverage: >80%

---

**Preparado por**: Claude (Anthropic)
**Fecha**: 17 de Octubre, 2025
**Para**: Día 28 de desarrollo
**Versión**: 1.0
