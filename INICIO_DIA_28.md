# 🚀 Inicio Rápido - Día 28

**Fecha**: 18 de Octubre, 2025
**Objetivo**: Testing, Optimización y Monitoreo de Redis

---

## ⚡ Comandos de Inicio Rápido

### 1. Abrir Terminal y Navegar al Proyecto
```bash
cd C:\Users\jorge\OneDrive\Desktop\Kaia\backend
```

### 2. Verificar Estado del Sistema
```bash
# Health check de producción
curl https://kaia-production.up.railway.app/health

# Debería mostrar:
# - "connected": true
# - "latency": 1-5 (ms)
# - "totalKeys": 4
```

### 3. Verificar Git Status
```bash
git status
git log --oneline -5
```

### 4. Verificar Tests Actuales
```bash
npm test
# Debe mostrar: 52 tests passing
```

### 5. Verificar Railway
```bash
railway status
# Debe mostrar: Service: Kaia, Environment: production
```

---

## 📁 Documentación a Revisar

1. **Plan del Día 28**:
   ```
   C:\Users\jorge\OneDrive\Desktop\Kaia\Obsidian\Kaia Development\Backend Development\Day 28 - Plan.md
   ```

2. **Documentación Day 27**:
   ```
   C:\Users\jorge\OneDrive\Desktop\Kaia\Obsidian\Kaia Development\Backend Development\Day 27 - Redis Caching Implementation.md
   ```

3. **Estado Actual del Proyecto**:
   ```
   C:\Users\jorge\OneDrive\Desktop\Kaia\Obsidian\Kaia Development\Backend Development\Estado Actual del Proyecto.md
   ```

---

## 🎯 Tareas del Día 28 (Resumen)

### Fase 1: Tests (1 hora)
- [ ] Crear tests de CacheService
- [ ] Crear tests de Cache Middleware
- [ ] Crear tests de Redis Rate Limiter
- [ ] Ejecutar y verificar coverage >80%

### Fase 2: Optimizaciones (45 min)
- [ ] Migrar a red privada Redis (REDIS_URL)
- [ ] Implementar cache warming
- [ ] Implementar TTL adaptativo
- [ ] Agregar cache a endpoints de búsqueda

### Fase 3: Monitoreo (45 min)
- [ ] Crear endpoint de métricas
- [ ] Implementar sistema de alertas
- [ ] Crear dashboard visual

### Fase 4: Documentación (30 min)
- [ ] Actualizar README
- [ ] Crear tests de integración
- [ ] Documentar en Obsidian

---

## 🛠️ Setup Inicial

### Crear Carpetas para Tests
```bash
mkdir -p tests/services/cache
mkdir -p tests/middleware
mkdir -p tests/integration
mkdir -p tests/utils
```

### Crear Carpetas para Features
```bash
mkdir -p src/services/monitoring
mkdir -p public
```

### Instalar Dependencias (si es necesario)
```bash
npm install  # Por si hay nuevas deps
```

---

## 📝 Primer Archivo a Crear

### tests/services/cache/cacheService.test.ts

```typescript
import { cacheService } from '../../../src/services/cache/cacheService';
import { RedisClient } from '../../../src/config/redis';

describe('CacheService', () => {
  beforeAll(async () => {
    // Setup Redis connection
    await RedisClient.getInstance();
  });

  afterAll(async () => {
    // Cleanup
    await cacheService.flushAll();
    await RedisClient.disconnect();
  });

  beforeEach(() => {
    cacheService.resetMetrics();
  });

  describe('get/set operations', () => {
    test('should store and retrieve data', async () => {
      const key = 'test-key';
      const value = { foo: 'bar', num: 123 };

      await cacheService.set(key, value, 60);
      const result = await cacheService.get(key);

      expect(result).toEqual(value);
    });

    test('should return null for non-existent key', async () => {
      const result = await cacheService.get('non-existent-key');
      expect(result).toBeNull();
    });

    test('should respect TTL', async () => {
      const key = 'ttl-test';
      await cacheService.set(key, 'value', 1); // 1 second TTL

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = await cacheService.get(key);
      expect(result).toBeNull();
    }, 3000); // Increase test timeout
  });

  describe('pattern operations', () => {
    test('should delete keys by pattern', async () => {
      await cacheService.set('events:user:1:all', 'data1');
      await cacheService.set('events:user:1:today', 'data2');
      await cacheService.set('events:user:2:all', 'data3');

      const deleted = await cacheService.delPattern('events:user:1:*');
      expect(deleted).toBe(2);

      const remaining = await cacheService.get('events:user:2:all');
      expect(remaining).toBe('data3');
    });
  });

  describe('metrics', () => {
    test('should track hits and misses', async () => {
      await cacheService.set('metric-test', 'value');

      // HIT
      await cacheService.get('metric-test');
      // MISS
      await cacheService.get('non-existent');

      const metrics = cacheService.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);
      expect(metrics.sets).toBe(1);
      expect(metrics.hitRate).toBe(0.5);
    });
  });
});
```

### Comando para Ejecutar
```bash
npm test -- cacheService
```

---

## 🔍 Comandos Útiles Durante el Día

### Tests
```bash
# Correr todos los tests
npm test

# Correr tests específicos
npm test -- cacheService

# Watch mode
npm test -- --watch

# Coverage
npm run test:coverage
```

### Git
```bash
# Ver cambios
git status
git diff

# Commit
git add .
git commit -m "feat: Day 28 - Tests and monitoring"

# Push
git push origin master
```

### Railway
```bash
# Ver logs
railway logs

# Status
railway status

# Variables
railway variables

# Redeploy
railway up
```

### Health Checks
```bash
# Backend health
curl https://kaia-production.up.railway.app/health

# Métricas (después de implementar)
curl https://kaia-production.up.railway.app/api/metrics
```

---

## ⚠️ Recordatorios Importantes

1. **No Romper Producción**
   - Todos los cambios deben ser backward compatible
   - Probar localmente antes de push

2. **Tests Primero**
   - Escribir tests antes de implementar features
   - Asegurar >80% coverage

3. **Commits Atómicos**
   - Un commit por feature completa
   - Mensajes descriptivos

4. **Documentar Todo**
   - JSDoc en funciones
   - Actualizar README
   - Documentar en Obsidian

---

## 🎯 Resultado Esperado al Final del Día

- ✅ Tests de cache con >80% coverage
- ✅ Cache warming implementado
- ✅ Redis en red privada (<1ms latency)
- ✅ Sistema de métricas funcionando
- ✅ Dashboard de monitoreo
- ✅ Documentación completa
- ✅ Todo deployado en producción

---

## 📞 Si Algo Sale Mal

### Redis no conecta
```bash
# Verificar servicio Redis
railway logs --service Redis

# Verificar variable
railway variables | grep REDIS

# Restart
railway redeploy
```

### Tests fallan
```bash
# Limpiar cache de Jest
npm test -- --clearCache

# Reinstalar deps
rm -rf node_modules
npm install
```

### Build falla
```bash
# Verificar TypeScript
npx tsc --noEmit

# Ver errores
npm run build
```

---

## 📊 Checklist de Inicio

Antes de empezar a codear:

- [ ] Terminal abierta en la carpeta correcta
- [ ] Git status verificado
- [ ] Tests actuales pasando (52/52)
- [ ] Railway status OK
- [ ] Redis conectado (health check)
- [ ] Documentación de Day 28 revisada
- [ ] Obsidian abierto
- [ ] Café preparado ☕

---

**¡Listo para empezar el Día 28!** 🚀

Recuerda: Solo quedan 3 días para completar el proyecto al 100%.
¡Vamos con todo!
