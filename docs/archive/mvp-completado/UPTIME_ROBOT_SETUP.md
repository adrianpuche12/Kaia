# 🤖 Configuración de UptimeRobot - Kaia

**Fecha:** 16 de Octubre, 2025
**Objetivo:** Configurar monitoreo 24/7 del backend en Railway
**Tiempo estimado:** 5-10 minutos

---

## 📋 Paso a Paso

### 1. Crear Cuenta en UptimeRobot

1. Ir a: https://uptimerobot.com
2. Click en "Sign Up Free"
3. Registrarse con email
4. Verificar email

**Plan Gratuito incluye:**
- ✅ 50 monitores
- ✅ 5 minutos de intervalo
- ✅ Alertas por email
- ✅ Status page público
- ✅ SSL monitoring

---

### 2. Crear Monitor para el Backend

#### Paso 2.1: Agregar Nuevo Monitor

1. Click en "+ Add New Monitor"
2. Configurar:

```
Monitor Type: HTTP(s)
Friendly Name: Kaia Backend - Production
URL (or IP): https://kaia-production.up.railway.app/health
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
```

3. Click en "Create Monitor"

#### Paso 2.2: Configurar Alertas

1. En el monitor creado, click en "Edit"
2. Ir a "Alert Contacts"
3. Agregar tu email
4. Configurar:

```
Alert When: Down
Alert After: 2 checks (10 minutos)
Notification Channels: Email
```

5. Guardar cambios

---

### 3. Crear Monitors Adicionales (Opcional)

#### Monitor 2: API Root

```
Monitor Type: HTTP(s)
Friendly Name: Kaia API - Root
URL: https://kaia-production.up.railway.app/
Monitoring Interval: 5 minutes
Expected Status Code: 200
```

#### Monitor 3: Swagger Docs

```
Monitor Type: HTTP(s)
Friendly Name: Kaia API - Documentation
URL: https://kaia-production.up.railway.app/api/docs
Monitoring Interval: 15 minutes
Expected Status Code: 200 or 301
```

---

### 4. Configurar Status Page (Público)

1. En el dashboard, ir a "Public Status Pages"
2. Click en "Add Public Status Page"
3. Configurar:

```
Page Name: Kaia Status
Subdomain: kaia-status (ejemplo)
Monitors: Seleccionar todos los monitors de Kaia
```

4. Click en "Create Status Page"
5. Copiar URL pública (ej: https://stats.uptimerobot.com/kaia-status)

---

### 5. Verificar Configuración

#### Checklist de Verificación

- [ ] Monitor creado para /health
- [ ] Intervalo: 5 minutos
- [ ] Alertas configuradas por email
- [ ] Email de alerta verificado
- [ ] Monitor activo (verde)
- [ ] Status page creada (opcional)

#### Probar Alertas

1. En el monitor, click en "Pause"
2. Esperar 10-15 minutos
3. Deberías recibir un email de alerta
4. Click en "Resume" para reactivar
5. Deberías recibir un email de "UP again"

---

### 6. Dashboard de UptimeRobot

El dashboard muestra:

- ✅ **Uptime %** - Últimos 7/30/90 días
- ✅ **Response Time** - Promedio y gráficas
- ✅ **Down Events** - Historial de caídas
- ✅ **Logs** - Todos los checks realizados

**URL del Dashboard:** https://uptimerobot.com/dashboard

---

## 📊 Métricas que UptimeRobot Rastrea

### Uptime Percentage
```
Target: > 99.9%
Current: (verás después de 24 horas)
```

### Response Time
```
Target: < 500ms
Average: (verás en el dashboard)
```

### Incidents
```
Target: 0 por semana
Total: (se va acumulando)
```

---

## 🔔 Tipos de Alertas

### Email Alerts (Incluido en plan gratuito)

**Down Alert:**
```
Subject: [DOWN] Kaia Backend - Production
Body: Your monitor "Kaia Backend" is down!
      URL: https://kaia-production.up.railway.app/health
      Time: 2025-10-16 18:30:00
```

**Up Alert:**
```
Subject: [UP] Kaia Backend - Production
Body: Your monitor "Kaia Backend" is up again!
      Downtime: 15 minutes
```

### Alertas Adicionales (Plan Pro)
- SMS
- Slack
- Discord
- Telegram
- Webhook
- Push notifications

---

## 📱 Mobile App

UptimeRobot tiene app móvil:

**iOS:** https://apps.apple.com/app/uptimerobot/id1104878581
**Android:** https://play.google.com/store/apps/details?id=com.uptimerobot

**Features:**
- Ver status de todos los monitores
- Recibir push notifications
- Pausar/reanudar monitores
- Ver logs y estadísticas

---

## 🎯 Configuración Recomendada para Kaia

### Monitor Principal (Crítico)

```yaml
Name: Kaia Backend - Health Check
URL: https://kaia-production.up.railway.app/health
Interval: 5 minutes
Timeout: 30 seconds
Alert After: 2 failed checks
Alert Via: Email + SMS (si disponible)
```

### Monitors Secundarios (Importante)

```yaml
# API Root
Name: Kaia API - Root
URL: https://kaia-production.up.railway.app/
Interval: 10 minutes

# Swagger Docs
Name: Kaia API - Documentation
URL: https://kaia-production.up.railway.app/api/docs
Interval: 15 minutes

# Auth Endpoint (Smoke test)
Name: Kaia API - Auth Login
URL: https://kaia-production.up.railway.app/api/auth/login
Interval: 15 minutes
Method: POST
Expected: 400 (bad request sin body)
```

---

## 📈 Interpretando las Métricas

### Uptime %

```
100%      = Perfecto (0 downtime)
99.9%     = Excelente (~43 minutos/mes de downtime)
99.5%     = Bueno (~3.6 horas/mes)
99.0%     = Aceptable (~7.2 horas/mes)
< 99.0%   = Necesita atención
```

**Target para Kaia:** > 99.9%

### Response Time

```
< 200ms   = Excelente
200-500ms = Muy bueno
500-1000ms= Bueno
> 1000ms  = Necesita optimización
```

**Target para Kaia:** < 300ms (health endpoint)

### Down Events

```
0 por mes     = Perfecto
1-2 por mes   = Excelente
3-5 por mes   = Aceptable
> 5 por mes   = Requiere investigación
```

**Target para Kaia:** < 2 por mes

---

## 🚨 Qué Hacer Cuando Recibes una Alerta

### Alert: Monitor is DOWN

**Pasos inmediatos:**

1. **Verificar manualmente**
   ```bash
   curl https://kaia-production.up.railway.app/health
   ```

2. **Revisar Railway Dashboard**
   - Ir a https://railway.app
   - Ver logs del servicio
   - Verificar CPU/Memory usage
   - Ver deployments recientes

3. **Verificar status de Railway**
   - Ir a https://status.railway.app
   - Ver si hay incidents

4. **Revisar cambios recientes**
   - ¿Hubo un deployment reciente?
   - ¿Cambios en variables de entorno?
   - ¿Actualizaciones de dependencias?

5. **Restart si es necesario**
   - En Railway: Deployments → Restart

6. **Investigar causa raíz**
   - Revisar logs completos
   - Identificar error
   - Fix y re-deploy

---

## 📊 Reports y Analytics

### Weekly Report (Email automático)

UptimeRobot envía reporte semanal con:
- Uptime % de la semana
- Total downtime
- Número de incidents
- Response time promedio
- Comparación con semana anterior

### Custom Reports

En el dashboard puedes generar:
- Custom date ranges
- Multiple monitors
- CSV export
- PDF report

---

## 🔗 Links Útiles

- **Dashboard:** https://uptimerobot.com/dashboard
- **Status Page:** https://stats.uptimerobot.com/[tu-slug]
- **API Docs:** https://uptimerobot.com/api
- **Support:** https://uptimerobot.com/support

---

## ✅ Checklist Final

Después de configurar, verifica:

- [ ] Monitor creado y activo (verde)
- [ ] URL correcta configurada
- [ ] Intervalo: 5 minutos
- [ ] Alertas por email configuradas
- [ ] Email verificado
- [ ] Test de alerta realizado (opcional)
- [ ] Status page creada (opcional)
- [ ] Mobile app instalada (opcional)

---

## 🎯 Próximos Pasos

Una vez configurado UptimeRobot:

1. ✅ Dejar correr por 24 horas
2. ✅ Revisar métricas iniciales
3. ✅ Ajustar intervalos si es necesario
4. ✅ Configurar alertas adicionales (Slack, etc.)
5. ✅ Compartir status page con equipo

---

## 📝 Notas

- **Plan Gratuito es suficiente** para MVP
- **Upgrade a Pro** si necesitas:
  - Intervalo de 1 minuto
  - SMS alerts
  - Más monitores
  - Advanced reports

---

**Tiempo de configuración:** ~10 minutos
**Beneficio:** Monitoreo 24/7 con alertas automáticas
**Costo:** $0 (plan gratuito)

---

**Documento creado:** 16 de Octubre, 2025
**Estado:** ✅ Listo para configurar
**Acción requerida:** Configuración manual en uptimerobot.com

---

*"El monitoreo proactivo previene problemas antes de que los usuarios los encuentren."*

**¡Configura UptimeRobot ahora!** 🤖
