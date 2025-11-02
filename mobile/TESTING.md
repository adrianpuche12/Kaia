# Cómo Probar la App Kaia con Railway

## ✅ Estado del Backend

El backend está desplegado y funcionando en Railway:
- **URL Base**: https://kaia-production.up.railway.app
- **Health Check**: https://kaia-production.up.railway.app/health
- **API Docs**: https://kaia-production.up.railway.app/api/docs

## 🔧 Configuración Completada

1. ✅ Archivo `.env` creado con la URL de Railway
2. ✅ Variable `EXPO_PUBLIC_API_URL` configurada
3. ✅ El archivo `.env` está en `.gitignore` (no se sube a GitHub)

## 🚀 Cómo Iniciar la App

### Paso 1: Instalar Dependencias

Si aún no lo has hecho:

```bash
cd mobile
npm install
```

### Paso 2: Iniciar Expo

```bash
npm start
```

### Paso 3: Probar en Dispositivo

**Opción A: Emulador Android/iOS**
- Presiona `a` para Android
- Presiona `i` para iOS (solo en Mac)

**Opción B: Dispositivo Físico con Expo Go**
1. Instala "Expo Go" en tu teléfono (Play Store / App Store)
2. Escanea el QR code que aparece en la terminal
3. La app se cargará automáticamente

## 🧪 Pruebas a Realizar

### 1. Verificar Conexión al Backend

La app debería mostrar en consola:
```
🌐 API_URL configured as: https://kaia-production.up.railway.app/api
```

### 2. Probar Registro de Usuario

1. Abre la app
2. Ve a la pantalla de registro
3. Ingresa:
   - Email: tu-email@ejemplo.com
   - Contraseña: Tu123456
   - Nombre: Tu Nombre
4. Presiona "Registrar"
5. Deberías ver un mensaje de éxito

### 3. Probar Login

1. Ve a la pantalla de login
2. Ingresa el email y contraseña que usaste
3. Presiona "Iniciar Sesión"
4. Deberías entrar a la app

### 4. Probar Onboarding (si aplica)

Después del registro, deberías ver la pantalla de onboarding donde configuras:
- Nombre preferido
- Preferencias
- Etc.

## 🐛 Solución de Problemas

### Error: "Network request failed"

**Causa**: No se puede conectar al backend

**Soluciones**:
1. Verifica que el backend esté activo: https://kaia-production.up.railway.app/health
2. Verifica que el archivo `.env` exista en `/mobile/.env`
3. Reinicia Expo con `r` en la terminal

### Error: "Unable to resolve module"

**Causa**: Dependencias no instaladas correctamente

**Solución**:
```bash
rm -rf node_modules
npm install
npm start -- --clear
```

### La app no carga

**Soluciones**:
1. Limpia caché de Expo: `npm start -- --clear`
2. Verifica que tu dispositivo/emulador esté en la misma red
3. Revisa los logs en la terminal

## 📱 Probar en Producción vs Desarrollo

### Para Desarrollo Local (Backend Local)

Edita `.env`:
```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

### Para Producción (Railway)

Edita `.env`:
```env
EXPO_PUBLIC_API_URL=https://kaia-production.up.railway.app/api
```

Después de cambiar, reinicia Expo.

## 🔍 Ver Logs del Backend

Para ver qué está pasando en el servidor:

```bash
cd backend
railway logs
```

## 📊 Endpoints Disponibles

Todos los endpoints están documentados en:
https://kaia-production.up.railway.app/api/docs

Endpoints principales:
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refrescar token
- `GET /api/users/profile` - Obtener perfil
- `PUT /api/users/profile` - Actualizar perfil
- `POST /api/users/onboarding` - Completar onboarding
- Y 30+ endpoints más...

## ✅ Checklist de Pruebas

- [ ] Backend health check responde OK
- [ ] App inicia sin errores
- [ ] Registro de usuario funciona
- [ ] Login funciona
- [ ] Token se guarda correctamente
- [ ] Onboarding funciona (si aplica)
- [ ] Navegación entre pantallas funciona
- [ ] No hay errores en la consola

## 🎯 Próximos Pasos

1. ✅ **Backend desplegado** en Railway
2. ✅ **Mobile app configurada** para conectarse
3. ⏳ **Testing manual** (en progreso)
4. ⏳ **Distribuir a beta testers** (próximo)
5. ⏳ **Publicar en stores** (futuro)

## 🆘 Soporte

Si encuentras problemas:
1. Revisa esta documentación
2. Verifica los logs del backend con `railway logs`
3. Revisa los logs de Expo en la terminal
4. Revisa la consola del navegador/dispositivo

---

**Última actualización**: 16 de Octubre, 2025
**Estado**: ✅ Configuración completa, lista para testing
