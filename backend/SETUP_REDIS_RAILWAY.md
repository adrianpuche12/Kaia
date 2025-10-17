# Setup Redis en Railway - Guía Paso a Paso

## 🎯 Objetivo
Agregar Redis al proyecto Kaia en Railway para caching y rate limiting distribuido.

---

## 📋 Pasos de Configuración

### Paso 1: Agregar Redis Service en Railway

1. Ve a tu proyecto en Railway: https://railway.app
2. Click en tu proyecto "Kaia"
3. Click en el botón **"+ New"**
4. Selecciona **"Database"** → **"Add Redis"**
5. Railway creará automáticamente:
   - Redis instance
   - Variable `REDIS_URL`
   - Variable `REDIS_PRIVATE_URL` (internal network)

### Paso 2: Conectar Redis al Service Kaia

1. En Railway Dashboard, click en el service **"Kaia"** (tu backend)
2. Ve a la pestaña **"Variables"**
3. La variable `REDIS_URL` debería aparecer automáticamente
4. Si no aparece, agrégala manualmente:
   ```
   REDIS_URL=${{Redis.REDIS_URL}}
   ```

### Paso 3: Configuración Adicional (Variables)

Agrega estas variables adicionales en el service Kaia:

```bash
# Cache Configuration
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=60
REDIS_TLS=true
```

### Paso 4: Verificar Variables

Ejecuta en tu terminal local:

```bash
cd C:\Users\jorge\OneDrive\Desktop\Kaia\backend
railway variables
```

Deberías ver algo como:
```
REDIS_URL=redis://default:xxxx@red-xxxxx.railway.app:6379
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=60
```

---

## 🧪 Testing Local (Opcional)

Si quieres probar Redis localmente antes de deployar:

### Opción 1: Railway Link (Usar Redis en Railway)
```bash
cd C:\Users\jorge\OneDrive\Desktop\Kaia\backend
railway link
railway run npm run dev
```

### Opción 2: Redis Local (Docker)
```bash
# Instalar Redis con Docker
docker run -d -p 6379:6379 redis:alpine

# En .env local
REDIS_URL=redis://localhost:6379
CACHE_ENABLED=true
```

---

## ✅ Verificación

Después de configurar Redis en Railway, verifica:

1. **Railway Dashboard**
   - Service "Redis" está corriendo (status: Active)
   - Tiene memoria asignada (ej: 256MB)
   - Muestra métricas (CPU, Memory)

2. **Variables del Backend**
   ```bash
   railway variables --service Kaia
   ```
   Debería mostrar `REDIS_URL`

3. **Logs del Redis Service**
   ```bash
   railway logs --service Redis
   ```
   Debería mostrar: `Ready to accept connections`

---

## 📊 Métricas de Redis (Railway Dashboard)

Una vez configurado, podrás ver en Railway:

- **Memory Usage**: Cuánta RAM está usando
- **Connected Clients**: Número de conexiones activas
- **Commands/sec**: Operaciones por segundo
- **Network I/O**: Tráfico de red

---

## 🚨 Troubleshooting

### Error: "ECONNREFUSED 127.0.0.1:6379"
**Causa:** App intenta conectar a Redis local, no al de Railway
**Solución:** Verifica que `REDIS_URL` esté configurada correctamente

### Error: "WRONGPASS invalid username-password pair"
**Causa:** Credenciales incorrectas
**Solución:** Regenera las credenciales en Railway Dashboard

### Error: "ETIMEDOUT"
**Causa:** Problemas de red o firewall
**Solución:** Verifica que `REDIS_TLS=true` si Railway usa TLS

### Redis no aparece en Railway
**Causa:** Plan gratuito puede tener límites
**Solución:** Upgrade a plan con soporte para Redis

---

## 💰 Costos

Railway Redis:
- **Starter Plan**: $5/mes - 256MB RAM
- **Pro Plan**: $10/mes - 1GB RAM

Para Kaia MVP, Starter es suficiente.

---

## 📝 Notas Importantes

1. **TLS/SSL**: Railway Redis usa TLS por defecto
2. **Private Network**: Usa `REDIS_PRIVATE_URL` para mejor performance (interno a Railway)
3. **Persistence**: Redis en Railway tiene persistencia automática
4. **Backups**: No automáticos en plan Starter, considerar upgrade si crítico

---

## 🎯 Próximos Pasos

Después de configurar Redis:
1. ✅ Instalar `ioredis` package
2. ✅ Crear Redis client config
3. ✅ Implementar CacheService
4. ✅ Migrar rate limiter
5. ✅ Deploy y test

---

**Created:** October 16, 2025
**Ready to configure!** 🚀
