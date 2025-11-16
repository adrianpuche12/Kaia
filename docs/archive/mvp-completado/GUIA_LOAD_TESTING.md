# 🧪 Guía de Load Testing - Día 26

**Objetivo:** Validar que la optimización de base de datos funciona correctamente

---

## 📋 Pre-requisitos

1. ✅ Migración de índices aplicada en Railway
2. ✅ Artillery configurado (load-test.yml creado)
3. ✅ Usuario de prueba creado

---

## 🚀 Paso 1: Crear Usuario de Prueba

Necesitamos crear un usuario para el load testing:

```bash
curl -X POST https://kaia-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "loadtest@example.com",
    "password": "TestLoad123!@#",
    "name": "Load",
    "lastName": "Test"
  }'
```

**Esperado:** Respuesta con `success: true` y un token.

Si el usuario ya existe, está bien - podemos usarlo.

---

## 🧪 Paso 2: Ejecutar Load Test

### Opción A: Test Rápido (2 minutos)

```bash
cd C:\Users\jorge\OneDrive\Desktop\Kaia\backend

npx artillery quick --duration 120 --rate 10 --num 100 https://kaia-production.up.railway.app/health
```

**Qué hace:**
- Envía 100 requests durante 2 minutos
- Rate: 10 requests/segundo
- Endpoint: /health (lightweight)

### Opción B: Test Completo (5 minutos)

```bash
cd C:\Users\jorge\OneDrive\Desktop\Kaia\backend

npx artillery run load-test.yml
```

**Qué hace:**
- Tests múltiples escenarios
- Warm-up → Ramp-up → Sustained load → Cool-down
- Tests endpoints optimizados (events, messages, etc.)
- Duración: ~4 minutos

### Opción C: Test con Reporte HTML

```bash
cd C:\Users\jorge\OneDrive\Desktop\Kaia\backend

npx artillery run --output report.json load-test.yml

npx artillery report report.json --output load-test-report.html
```

**Genera:** Reporte HTML visual con gráficos

---

## 📊 Paso 3: Interpretar Resultados

### Métricas Clave

#### 1. Response Time (Tiempo de Respuesta)
```
http.response_time:
  min: .....................  50ms
  max: ..................... 800ms
  median: .................. 180ms
  p95: ..................... 350ms  ← Importante!
  p99: ..................... 600ms  ← Importante!
```

**¿Qué significa?**
- **p95:** 95% de requests son más rápidos que este valor
- **p99:** 99% de requests son más rápidos que este valor

**Targets:**
- ✅ p95 < 500ms = EXCELENTE
- ⚠️ p95 500-1000ms = BUENO
- ❌ p95 > 1000ms = NECESITA MEJORA

#### 2. Request Rate
```
http.requests: ............ 5000 (total)
http.request_rate: ........ 42/sec (promedio)
```

**¿Qué significa?**
- Cuántas requests se procesaron
- Velocidad de procesamiento

#### 3. Error Rate
```
http.codes.200: ........... 4950
http.codes.500: ........... 50
```

**Target:**
- ✅ Error rate < 1% = EXCELENTE
- ⚠️ Error rate 1-5% = ACEPTABLE
- ❌ Error rate > 5% = PROBLEMA

---

## 📈 Comparación Esperada

### ANTES de la optimización (estimado)
```
Scenarios launched:  1000
Scenarios completed: 980
Requests completed:  4500

Response times:
  min: 80ms
  max: 2500ms
  median: 320ms
  p95: 800ms
  p99: 1500ms

Error rate: 2%
```

### DESPUÉS de la optimización (esperado)
```
Scenarios launched:  1000
Scenarios completed: 995
Requests completed:  4950

Response times:
  min: 40ms
  max: 1200ms
  median: 150ms
  p95: 350ms   (-56% mejora)
  p99: 600ms   (-60% mejora)

Error rate: 0.5%
```

---

## 🎯 Tests Específicos para Índices

### Test 1: Event Range Query (Index: userId + startTime)

```bash
curl "https://kaia-production.up.railway.app/api/events/range?startDate=2025-10-01T00:00:00Z&endDate=2025-10-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -w "\nTime: %{time_total}s\n"
```

**Antes:** ~150-200ms
**Después:** ~45-60ms

### Test 2: Messages by Contact (Index: userId + contactId)

```bash
curl "https://kaia-production.up.railway.app/api/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -w "\nTime: %{time_total}s\n"
```

**Antes:** ~180-250ms
**Después:** ~60-80ms

### Test 3: Health Check (Baseline - sin cambios)

```bash
curl "https://kaia-production.up.railway.app/health" \
  -w "\nTime: %{time_total}s\n"
```

**Antes y Después:** ~50ms (sin cambios esperados)

---

## 🚨 Qué Hacer Si...

### Error: "Too Many Requests" (429)
**Causa:** Rate limiting activado
**Solución:**
- Reducir `arrivalRate` en load-test.yml
- Es normal en test agresivos
- Significa que rate limiting funciona

### Error: "Connection Refused" / Timeouts
**Causa:** Railway pod reiniciado o sobrecargado
**Solución:**
- Esperar 1-2 minutos
- Verificar Railway logs
- Reducir intensidad del test

### Performance Peor que Esperado
**Posibles causas:**
1. Índices no se crearon → Verificar con query SQL
2. Tablas vacías → Índices no ayudan con poca data
3. Railway cold start → Hacer warm-up primero
4. Otro proceso usando CPU → Ver Railway metrics

---

## 📊 Monitoreo Durante el Test

### Railway Dashboard
1. Ir a https://railway.app/project/your-project
2. Click en servicio "Kaia"
3. Ver pestaña "Metrics"
4. Observar:
   - CPU usage
   - Memory usage
   - Network traffic

**Durante el test:**
- CPU puede subir a 60-80% (normal)
- Memory debería ser estable
- Network mostrará picos

### Sentry (si configurado)
1. Ir a https://sentry.io
2. Ver Performance
3. Filtrar por últimos 5 minutos
4. Comparar transaction times

---

## ✅ Checklist del Load Testing

- [ ] Usuario de prueba creado (loadtest@example.com)
- [ ] Test rápido ejecutado (npx artillery quick)
- [ ] Resultados guardados
- [ ] Test completo ejecutado (npx artillery run)
- [ ] Métricas analizadas
- [ ] p95 < 500ms ✅
- [ ] Error rate < 1% ✅
- [ ] Railway metrics revisados
- [ ] Comparación antes/después documentada

---

## 📝 Documentar Resultados

Guarda estos datos:

```markdown
## Load Test Results - Día 26

**Fecha:** 16 Oct 2025
**Después de:** Migración de 28 índices

### Configuración
- Duration: 4 minutos
- Max concurrent: 50 users
- Total requests: ~5000

### Resultados
- p95 response time: XXXms
- p99 response time: XXXms
- Error rate: X%
- Requests/sec: XX

### Comparación
- Mejora en p95: XX%
- Mejora en p99: XX%
- Conclusión: [EXITOSO / NECESITA AJUSTES]
```

---

## 🎯 Criterios de Éxito

Para considerar el Día 26 exitoso:

1. ✅ Migración aplicada sin errores
2. ✅ p95 < 500ms en load test
3. ✅ Error rate < 1%
4. ✅ API sigue funcional después del test
5. ✅ Railway metrics estables
6. ✅ Mejora visible vs métricas anteriores

---

## 🏁 Próximos Pasos

Después del load testing:
1. Analizar resultados
2. Documentar mejoras
3. Decidir Día 27-30:
   - Más optimizaciones si needed
   - Swagger docs
   - Features post-MVP
   - Mobile deployment

---

**Creado:** 16 de Octubre, 2025
**Ready to test!** 🚀
