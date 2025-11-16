# 📋 Instrucciones para el Día 22 - Deployment a Producción

## 🎯 Para Claude (AI Assistant) - Lee Esto PRIMERO

**Hola Claude del futuro,**

Jorge te pedirá que hagas el **deployment de Kaia a producción**. Esta guía te ayudará a entender qué hacer.

---

## 📍 Contexto Rápido

- **Proyecto**: Kaia - Asistente Personal Inteligente por voz en español
- **Estado**: MVP 100% completado y funcionando en localhost
- **Objetivo**: Deployar el backend a Railway para que sea accesible desde internet
- **Ubicación**: `C:\Users\jorge\OneDrive\Desktop\Kaia\backend`

---

## 📚 Documentación Completa

**TODO lo que necesitas está en:**
```
C:\Users\jorge\OneDrive\Desktop\Kaia\backend\docs\DEPLOYMENT.md
```

Este archivo tiene **1,180 líneas** con cada paso detallado.

---

## 🚀 Pasos Resumidos (Sigue el DEPLOYMENT.md para detalles)

### 1. Pre-Deployment (15 min)

Primero, verifica que todo esté listo:

```bash
cd C:\Users\jorge\OneDrive\Desktop\Kaia\backend

# Verificar que todo funcione
npm test           # Debe pasar 52 tests
npm run build      # Debe compilar sin errores
npm run dev        # Debe arrancar en puerto 3001
```

Si algo falla, **detente y revisa los errores**.

### 2. Preparar Archivos de Configuración (10 min)

Lee `DEPLOYMENT.md` sección **"Preparación Pre-Deployment"**:
- Verificar `.gitignore`
- Actualizar `package.json` con scripts necesarios
- Crear `Procfile`
- Verificar `server.ts`

### 3. Git y GitHub (10 min)

```bash
# Verificar estado de Git
git status

# Si hay cambios, commitear
git add .
git commit -m "feat: Prepare backend for production deployment"

# Si no existe repo en GitHub, crear uno y conectar
# (Ver instrucciones en DEPLOYMENT.md)
```

### 4. Deployment a Railway (30-45 min)

**IMPORTANTE**: Lee la sección **"Opción Recomendada: Railway"** en DEPLOYMENT.md

**Pasos principales:**
1. Crear cuenta en https://railway.app
2. Crear nuevo proyecto desde GitHub
3. Agregar PostgreSQL database
4. Configurar variables de entorno (copiar de `.env` local)
5. Verificar build y start commands
6. Obtener URL de producción
7. Verificar que funcione

### 5. Testing en Producción (20 min)

Verificar que todo funcione:
- Health check endpoint
- Registro de usuario
- Login
- Envío de SMS/Email (con las APIs reales)

Ver sección **"Testing en Producción"** en DEPLOYMENT.md

---

## ⚠️ Variables de Entorno Críticas

Jorge necesitará proporcionar estas credenciales (están en su `.env` local):

```bash
# Las NECESITARÁS para Railway:
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
TWILIO_WHATSAPP_NUMBER=...

SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=...
SENDGRID_FROM_NAME=...

GOOGLE_MAPS_API_KEY=...

# Generar NUEVOS secretos para producción:
JWT_SECRET=... (usar: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_REFRESH_SECRET=... (usar: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

**IMPORTANTE**: NO usar los mismos JWT secrets de desarrollo.

---

## 🛑 Problemas Comunes

### Problema 1: Build Falla
**Solución**: Verificar que `package.json` tenga `engines` definido y script `postinstall`

### Problema 2: Migraciones Fallan
**Solución**: Verificar que `DATABASE_URL` esté configurada correctamente en Railway

### Problema 3: Variables de Entorno No Se Cargan
**Solución**: Re-deployar después de agregar variables en Railway

### Problema 4: CORS Errors
**Solución**: Verificar que `FRONTEND_URL` esté configurada y que CORS permita el origen

**Para más soluciones**: Ver sección **"Troubleshooting"** en DEPLOYMENT.md

---

## ✅ Checklist Final

Antes de decir que el deployment está completo:

### Pre-Deployment
- [ ] Tests pasan localmente
- [ ] Build funciona localmente
- [ ] Código está en GitHub
- [ ] Variables de entorno documentadas

### Durante Deployment
- [ ] Proyecto creado en Railway
- [ ] PostgreSQL configurado
- [ ] Variables de entorno agregadas (TODAS)
- [ ] Deployment exitoso sin errores en logs

### Post-Deployment
- [ ] Health check funciona: `https://tu-url.railway.app/health`
- [ ] Registro de usuario funciona
- [ ] Login funciona y devuelve tokens
- [ ] SMS se envía correctamente (Twilio)
- [ ] Email se envía correctamente (SendGrid)
- [ ] App móvil se puede conectar al backend de producción

---

## 📊 Resultado Esperado

Al final, deberías tener:
- ✅ Backend funcionando en: `https://kaia-backend-production.up.railway.app`
- ✅ Base de datos PostgreSQL en Railway
- ✅ Todas las APIs funcionando (Twilio, SendGrid, Google Maps)
- ✅ Auto-deploy configurado (cada push a main despliega automáticamente)
- ✅ Logs accesibles en Railway
- ✅ Backups automáticos configurados

---

## 🎯 Flujo de Trabajo Recomendado

1. **Lee el DEPLOYMENT.md completo** (primeros 200 líneas al menos)
2. **Pregunta a Jorge** si tiene dudas o falta información
3. **Sigue los pasos UNO POR UNO** - no te saltes pasos
4. **Verifica cada paso** antes de continuar al siguiente
5. **Usa el checklist** para asegurar que no olvidaste nada
6. **Si hay errores**, busca en la sección Troubleshooting

---

## 💡 Tips Importantes

- **Lee los logs de Railway** constantemente - te dirán qué está fallando
- **NO hagas cambios a la arquitectura** - Express funciona perfectamente
- **Usa Railway, NO Vercel** - Vercel no es para servidores Express
- **Copia las API keys de `.env` local** - no las inventes
- **Genera nuevos JWT secrets** - no uses los de desarrollo
- **Verifica CORS** - debe permitir el origen de la app móvil

---

## 🚨 Si Todo Falla

1. Revisa los logs de Railway
2. Busca el error en la sección Troubleshooting de DEPLOYMENT.md
3. Verifica que TODAS las variables de entorno estén configuradas
4. Pregunta a Jorge si tiene las credenciales correctas
5. Intenta con Render como alternativa (ver DEPLOYMENT.md)

---

## 📞 Siguiente Paso Después del Deployment

Una vez que el backend esté en producción:
- **Día 23**: Deployar la app móvil (Expo)
- Actualizar la URL del backend en la app móvil
- Testing end-to-end con usuarios reales

---

**¡Buena suerte con el deployment! 🚀**

Si sigues DEPLOYMENT.md paso a paso, debería tomar 1-2 horas y funcionar perfectamente.

---

**Última actualización**: Día 21 - Octubre 2025
**Autor**: Claude (Día 21)
**Para**: Claude (Día 22+)
