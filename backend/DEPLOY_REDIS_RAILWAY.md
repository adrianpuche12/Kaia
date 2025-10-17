# Deploy Redis Cache to Railway - Guía Completa

## 🎯 Objetivo
Deployar el backend con Redis caching habilitado en Railway.

---

## 📋 Pre-requisitos

✅ Código completado:
- Redis client configurado
- CacheService implementado
- Cache middleware aplicado a eventos endpoints
- Rate limiter migrado a Redis
- Health check actualizado

---

## 🚀 Paso 1: Agregar Redis Service en Railway

### 1.1 Crear Redis Instance

1. Ve a Railway Dashboard: https://railway.app/project/[tu-proyecto]
2. Click en **"+ New"**
3. Selecciona **"Database"** → **"Add Redis"**
4. Railway creará:
   - Redis service
   - Variable `REDIS_URL` automáticamente
   - Variable `REDIS_PRIVATE_URL` (red interna)

### 1.2 Verificar Redis Service

```bash
cd C:\Users\jorge\OneDrive\Desktop\Kaia\backend
railway status
```

Deberías ver:
- Service: **Redis** (status: Active)
- Service: **Kaia** (tu backend)

---

## 🔧 Paso 2: Configurar Variables de Entorno

### 2.1 Agregar Variables al Service Kaia

En Railway Dashboard → Service "Kaia" → Variables, agrega:

```bash
# Cache Configuration
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=60
```

### 2.2 Verificar que REDIS_URL está presente

Railway debería haberla agregado automáticamente. Verifica:

```bash
railway variables --service Kaia | findstr REDIS
```

Deberías ver:
```
REDIS_URL=redis://default:xxxxx@red-xxxxx.railway.app:6379
```

Si no está, agrégala manualmente:
```
REDIS_URL=${{Redis.REDIS_URL}}
```

---

## 📦 Paso 3: Deploy

### 3.1 Commit Changes

```bash
cd C:\Users\jorge\OneDrive\Desktop\Kaia\backend

git add .
git commit -m "$(cat <<'EOF'
feat: Add Redis caching and distributed rate limiting

Backend improvements:
- Redis client configuration with health checks
- CacheService for get/set/del/invalidation operations
- Cache middleware for automatic request/response caching
- Applied caching to events endpoints (60-300s TTL)
- Redis-based rate limiter (sliding window algorithm)
- Graceful fallback to memory-based rate limiter
- Updated health endpoint with cache metrics
- Cache invalidation on write operations

Performance:
- Expected 30-50% response time improvement
- Distributed rate limiting across instances
- Cache hit rate tracking and monitoring

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 3.2 Push to Railway

Railway detectará el cambio automáticamente y deployará. O puedes forzar:

```bash
git push origin main
```

Alternativamente, usando Railway CLI:

```bash
railway up
```

---

## 🧪 Paso 4: Testing

### 4.1 Verificar Health Check

```bash
curl https://kaia-production.up.railway.app/health
```

**Expected Output:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-16T...",
  "uptime": 123.45,
  "environment": "production",
  "cache": {
    "enabled": true,
    "redis": {
      "connected": true,
      "latency": 15,
      "info": {
        "version": "7.0.x",
        "uptime": 3600,
        "connectedClients": 1,
        "usedMemory": "1.2MB",
        "totalKeys": 0
      }
    },
    "metrics": {
      "hits": 0,
      "misses": 0,
      "sets": 0,
      "deletes": 0,
      "errors": 0,
      "hitRate": 0
    }
  }
}
```

**✅ Success indicators:**
- `cache.enabled: true`
- `cache.redis.connected: true`
- `cache.redis.latency` < 50ms

**❌ Si Redis no está conectado:**
- `cache.redis.connected: false`
- `cache.redis.error: "..."`

### 4.2 Testing Cache Functionality

#### Test 1: Cache Miss (first request)

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://kaia-production.up.railway.app/api/events \
  -i
```

**Verifica headers:**
```
X-Cache: MISS
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
```

#### Test 2: Cache Hit (second request)

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://kaia-production.up.railway.app/api/events \
  -i
```

**Verifica headers:**
```
X-Cache: HIT
```

**Response time debería ser ~50-80% más rápido**

#### Test 3: Cache Invalidation (create event)

```bash
# Create event
curl -X POST https://kaia-production.up.railway.app/api/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "startTime": "2025-10-20T10:00:00Z",
    "endTime": "2025-10-20T11:00:00Z",
    "type": "MEETING"
  }'

# Next GET should be cache MISS (cache invalidated)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://kaia-production.up.railway.app/api/events \
  -i
```

**Expected:** `X-Cache: MISS` (cache was invalidated)

### 4.3 Testing Rate Limiter

#### Test Redis Rate Limiter

```bash
# Send 10 requests rapidly
for i in {1..10}; do
  curl -H "Authorization: Bearer YOUR_TOKEN" \
    https://kaia-production.up.railway.app/api/events
  echo "\nRequest $i done"
done
```

**Expected:**
- All requests should succeed
- Headers show decreasing `X-RateLimit-Remaining`
- Rate limits are now shared across instances (Redis)

#### Test Rate Limit Exceeded

```bash
# Send 101 requests (exceeds 100/15min limit)
for i in {1..101}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    https://kaia-production.up.railway.app/api/events
done
```

**Expected:**
- First 100: `200 OK`
- Request 101: `429 Too Many Requests`

---

## 📊 Paso 5: Monitoring

### 5.1 Railway Dashboard Metrics

1. Go to Railway → Service "Redis"
2. View Metrics:
   - **Memory Usage**: Should be low initially (~1-5MB)
   - **Network I/O**: Spikes during requests
   - **CPU**: Very low (Redis is efficient)

### 5.2 Check Cache Metrics

```bash
# After some usage
curl https://kaia-production.up.railway.app/health | jq '.cache.metrics'
```

**Expected after testing:**
```json
{
  "hits": 45,
  "misses": 15,
  "sets": 15,
  "deletes": 3,
  "errors": 0,
  "hitRate": 0.75
}
```

**Target Metrics:**
- `hitRate` > 0.60 (60% cache hit rate)
- `errors` = 0

### 5.3 Check Railway Logs

```bash
railway logs --service Kaia | findstr "Redis\|Cache"
```

**Expected logs:**
```
🔌 Connecting to Redis...
✅ Redis connected and ready!
Cache HIT: events:user:123:{}
Cache MISS: events:user:456:{}
Cache invalidated: events:user:123:* (5 keys)
```

---

## 🎯 Paso 6: Load Testing Comparison

### 6.1 Run Load Test (with cache)

```bash
cd C:\Users\jorge\OneDrive\Desktop\Kaia\backend
npx artillery run load-test.yml
```

### 6.2 Expected Improvements vs Día 26

**Día 26 Results (DB indexes only):**
- Mean: 27.3ms
- p95: 32.8ms
- p99: 62.2ms

**Día 27 Expected (DB + Redis cache):**
- Mean: **15-18ms** (40-50% improvement)
- p95: **20-25ms** (30-40% improvement)
- p99: **35-45ms** (30-40% improvement)
- **Cache hit rate: 60-80%**

---

## 🚨 Troubleshooting

### Problem: Redis not connecting

**Symptoms:**
```json
{
  "cache": {
    "redis": {
      "connected": false,
      "error": "ECONNREFUSED"
    }
  }
}
```

**Solutions:**
1. Verify Redis service is running in Railway Dashboard
2. Check `REDIS_URL` variable is set correctly
3. Restart Kaia service: `railway restart --service Kaia`
4. Check Railway logs: `railway logs --service Redis`

### Problem: Cache not working (always MISS)

**Symptoms:**
- All requests show `X-Cache: MISS`
- Never sees `X-Cache: HIT`

**Solutions:**
1. Check `CACHE_ENABLED=true` in Railway variables
2. Verify Redis is connected (health endpoint)
3. Check TTL is not 0: `CACHE_DEFAULT_TTL=60`
4. Review logs for errors

### Problem: High memory usage in Redis

**Symptoms:**
- Redis memory > 50MB
- Railway shows high memory usage

**Solutions:**
1. Check for key leaks: `railway run redis-cli KEYS '*' | wc -l`
2. Verify TTLs are set correctly
3. Consider lowering `CACHE_DEFAULT_TTL`
4. Flush cache if needed: `railway run redis-cli FLUSHDB`

### Problem: Rate limiter not working

**Symptoms:**
- Can send unlimited requests
- No `429` errors even after 100+ requests

**Solutions:**
1. Check if Redis is connected (fallback to memory)
2. Verify rate limiter middleware is applied
3. Check logs for rate limiter errors
4. Test with different user/IP

---

## ✅ Success Checklist

Después del deploy, verifica:

- [ ] Redis service running en Railway Dashboard
- [ ] `CACHE_ENABLED=true` en variables
- [ ] `REDIS_URL` configurada correctamente
- [ ] Health endpoint shows `redis.connected: true`
- [ ] Cache HIT after second identical request
- [ ] Cache invalidation works (MISS after write)
- [ ] Rate limiter uses Redis (check logs)
- [ ] Improved response times vs Día 26
- [ ] Cache hit rate > 60%
- [ ] Zero cache errors
- [ ] Railway logs show no Redis errors

---

## 📈 Expected Performance Gains

| Metric | Día 25 (Base) | Día 26 (Indexes) | Día 27 (Cache) | Total Gain |
|--------|---------------|------------------|----------------|------------|
| Mean Response | 225ms | 27.3ms | **15-18ms** | **92-94%** |
| p95 Response | 500ms | 32.8ms | **20-25ms** | **95-96%** |
| p99 Response | 1000ms | 62.2ms | **35-45ms** | **95-96%** |
| DB Load | 100% | 40% | **10-15%** | **85-90%** |
| Cache Hit Rate | N/A | N/A | **60-80%** | N/A |

---

## 🎉 Next Steps

Después de verificar que todo funciona:

1. ✅ Documentar resultados en Obsidian
2. ✅ Comparar métricas Día 26 vs Día 27
3. ✅ Actualizar ESTADO_ACTUAL_PROYECTO.md
4. ✅ Planear Día 28-30

---

**Created:** October 16, 2025
**Ready to deploy!** 🚀
