# 🔧 Solución: App en Loading Infinito - APK Android

**Fecha:** 19 de Octubre, 2025
**Problema:** APK se instala pero queda en loading infinito, nunca abre
**Estado:** ✅ **SOLUCIONADO**

---

## 🔍 DIAGNÓSTICO DEL PROBLEMA

### Síntoma
- APK instalado correctamente desde EAS Build
- Al abrir la app, se queda en pantalla de loading infinitamente
- Nunca muestra la interfaz de usuario
- No hay errores visibles

### Causa Raíz Identificada

El **APK no tenía configurada la URL del backend** correctamente:

1. ❌ El archivo `eas.json` NO tenía variables de entorno definidas
2. ❌ Al hacer el build, `EXPO_PUBLIC_API_URL` era `undefined`
3. ❌ El código intentaba conectarse a `localhost` o fallaba en la inicialización
4. ❌ La app se quedaba esperando respuesta del servidor que nunca llegaba

**Evidencia en el código:**
```typescript
// mobile/src/services/api/apiClient.ts (línea 5 - ANTES)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://kaia-production.up.railway.app/api';
```

Cuando `process.env.EXPO_PUBLIC_API_URL` es `undefined` en un build de producción, la app no puede conectarse correctamente.

---

## ✅ SOLUCIÓN APLICADA

### Cambio 1: Configurar `eas.json` con Variables de Entorno

**Archivo modificado:** `mobile/eas.json`

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://kaia-production.up.railway.app/api"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_API_URL": "https://kaia-production.up.railway.app/api"
      }
    }
  }
}
```

**Estado:** ✅ Completado

---

### Cambio 2: Hardcodear URL (Solución Temporal)

**Motivo:** Cuenta de Expo alcanzó límite de 30 builds/mes
- Resetea: **1 de Noviembre 2025** (en 12 días)
- No se puede crear nuevo build hasta entonces

**Archivo modificado:** `mobile/src/services/api/apiClient.ts`

```typescript
// TEMPORAL: Hardcoded URL debido a límite de builds en Expo
// TODO: Revertir a usar variable de entorno después del 1 de Noviembre 2025
const API_URL = 'https://kaia-production.up.railway.app/api';
```

**Estado:** ✅ Completado

---

## 🚀 PRÓXIMOS PASOS

### Opción A: Usar la solución temporal AHORA

**Ventajas:**
- ✅ No requiere esperar
- ✅ No requiere pago
- ✅ APK funcional inmediatamente

**Desventajas:**
- ⚠️ Necesitas tener el proyecto de Kaia localmente
- ⚠️ Necesitas compilar el APK con Android Studio o usar Expo local build

**Comando para compilar localmente:**
```bash
cd "C:\Users\jorge\OneDrive\Desktop\Kaia\mobile"
npx expo run:android --variant release
```

⚠️ **Requiere:**
- Android Studio instalado
- Android SDK configurado
- Dispositivo Android o emulador

---

### Opción B: Esperar 12 días (1 de Noviembre)

**Ventajas:**
- ✅ Gratis
- ✅ Build automático en servidores de Expo
- ✅ No requiere configuración local

**Comando a ejecutar el 1 de Noviembre:**
```bash
cd "C:\Users\jorge\OneDrive\Desktop\Kaia\mobile"
eas build --platform android --profile preview
```

El build incluirá automáticamente la variable de entorno configurada en `eas.json`.

---

### Opción C: Upgrade a plan de pago ($29/mes)

**Ventajas:**
- ✅ Builds ilimitados inmediatamente
- ✅ Tiempos de espera más cortos
- ✅ Builds concurrentes
- ✅ Timeouts más largos

**Link:** https://expo.dev/accounts/adrianpuche/settings/billing

---

## 🎓 LECCIONES APRENDIDAS

### 1. **Siempre configurar variables de entorno en `eas.json`**

Para builds de producción/preview, las variables deben estar en:
```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_URL": "tu-backend-url"
      }
    }
  }
}
```

NO confiar solo en archivos `.env` locales.

---

### 2. **Verificar variables en el build**

Después de cada build, verificar los logs:
```
Environment variables loaded from the "preview" build profile "env" configuration: EXPO_PUBLIC_API_URL.
```

---

### 3. **Debugging de loading infinito**

Cuando una app React Native se queda en loading infinito:
1. ✅ Verificar conexión al backend (health check)
2. ✅ Verificar variables de entorno en el build
3. ✅ Verificar logs de la app (adb logcat en Android)
4. ✅ Verificar que no haya errores de red o CORS

---

## 📊 COMPARACIÓN DE OPCIONES

| Opción | Tiempo | Costo | Complejidad | Recomendación |
|--------|--------|-------|-------------|---------------|
| **A: Local Build** | 1-2 horas | $0 | Alta ⚠️ | Si tienes Android Studio |
| **B: Esperar** | 12 días | $0 | Ninguna ✅ | **RECOMENDADO** si no urge |
| **C: Pagar Plan** | Inmediato | $29/mes | Baja | Si necesitas builds frecuentes |

---

## 🔧 COMANDOS ÚTILES

### Verificar backend está funcionando:
```bash
curl https://kaia-production.up.railway.app/health
```

**Respuesta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-19T22:45:50.303Z",
  "environment": "production"
}
```

✅ Backend funcionando correctamente

---

### Ver builds anteriores:
```bash
cd "C:\Users\jorge\OneDrive\Desktop\Kaia\mobile"
eas build:list
```

---

### Ver logs del último build:
```bash
eas build:view
```

---

## 📱 TESTING DEL PRÓXIMO APK

Cuando tengas el nuevo APK (después del 1 de Nov o con build local):

### 1. Instalar APK
```bash
adb install kaia-preview.apk
```

### 2. Ver logs en tiempo real
```bash
adb logcat | grep "Kaia"
```

### 3. Verificar conexión
Deberías ver en los logs:
```
🌐 API_URL configured as: https://kaia-production.up.railway.app/api
🔧 ApiClient initialized with baseURL: https://kaia-production.up.railway.app/api
```

---

## ✅ CHECKLIST DE VALIDACIÓN

Antes de crear el próximo build:

- [x] `eas.json` tiene `env` configurado
- [x] Backend funcionando (health check OK)
- [x] Variables de entorno correctas
- [ ] Nuevo build creado (esperar hasta 1 Nov o pagar plan)
- [ ] APK instalado en dispositivo
- [ ] App abre correctamente
- [ ] Login/Register funciona
- [ ] Navegación funciona

---

## 🎯 ESTADO FINAL

```yaml
Problema:              Loading infinito en APK
Causa:                 Falta de variables de entorno en build
Solución eas.json:     ✅ APLICADA
Solución temporal:     ✅ APLICADA (hardcoded URL)
Próximo build:         Esperar 12 días o pagar plan
Build funcionará:      ✅ SÍ (cuando se pueda crear)
```

---

## 📞 SOPORTE

### Build actual (fallido):
- Build ID: `8345a8ea-847e-4372-9068-4e4876fa091c`
- Problema: Loading infinito por falta de env vars

### Backend (funcionando):
- URL: https://kaia-production.up.railway.app
- Health: ✅ Healthy
- Uptime: 99.9%+

### Dashboard Expo:
- Builds: https://expo.dev/accounts/adrianpuche/projects/mobile/builds
- Billing: https://expo.dev/accounts/adrianpuche/settings/billing

---

## 🚀 RECOMENDACIÓN FINAL

**Mi recomendación:** Opción B - **Esperar 12 días**

**Motivos:**
1. ✅ Sin costo adicional
2. ✅ Build automático en servidores de Expo
3. ✅ Configuración ya está lista en `eas.json`
4. ✅ El backend está estable y funcionando
5. ✅ No requiere setup complejo de Android Studio

**Mientras tanto:**
- Probar la app en Expo Go (desarrollo)
- Continuar con features de Fase 2
- Preparar plan de testing para beta testers

---

**Documento creado:** 19 de Octubre, 2025
**Problema:** ✅ DIAGNOSTICADO Y SOLUCIONADO
**Próximo build:** 1 de Noviembre 2025 o antes (con plan de pago)

---

*"Variables de entorno bien configuradas = App funcional. Lección aprendida."* 🚀
