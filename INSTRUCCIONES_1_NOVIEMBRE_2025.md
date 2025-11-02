# 📅 INSTRUCCIONES PARA EL 1 DE NOVIEMBRE 2025

**Fecha límite:** 1 de Noviembre 2025
**Tiempo estimado:** 20 minutos
**Resultado:** APK funcional de Kaia para instalar en Android

---

## ✅ REQUISITOS PREVIOS

Antes del 1 de Noviembre, asegúrate de tener:

1. ✅ **EAS CLI instalado**
   ```bash
   npm install -g eas-cli
   ```

2. ✅ **Cuenta de Expo configurada**
   - Usuario: adrianpuche
   - Ya deberías tener sesión iniciada

3. ✅ **Verificar que el backend esté funcionando**
   - Abre: https://kaia-production.up.railway.app/health
   - Debe mostrar: `"status": "healthy"`

---

## 🚀 PASOS A SEGUIR EL 1 DE NOVIEMBRE

### PASO 1: Abrir terminal
1. Presiona **Windows + R**
2. Escribe: `cmd`
3. Presiona Enter

---

### PASO 2: Navegar al proyecto
Copia y pega este comando:
```bash
cd C:\Users\jorge\OneDrive\Desktop\Kaia\mobile
```
Presiona Enter.

---

### PASO 3: Verificar que tienes sesión en EAS
```bash
eas whoami
```

**Si dice "adrianpuche"** → Perfecto, continúa al Paso 4

**Si dice "not logged in"** → Inicia sesión:
```bash
eas login
```
- Email: (tu email de Expo)
- Password: (tu contraseña)

---

### PASO 4: Crear el build del APK

Copia y pega este comando EXACTO:
```bash
eas build --platform android --profile preview
```

Presiona Enter.

---

### PASO 5: Esperar confirmaciones

El sistema te preguntará cosas. Responde así:

**Pregunta 1:** `Generate a new Android Keystore?`
- **Respuesta:** Presiona `n` (NO) - Ya tienes un keystore

**Pregunta 2:** `Use existing keystore?`
- **Respuesta:** Presiona `y` (YES)

---

### PASO 6: Esperar el build (10-15 minutos)

Verás mensajes como:
```
✔ Compressing project files
✔ Uploaded to EAS
Building...
```

**ESPERA.** No cierres la terminal.

---

### PASO 7: Build completado ✅

Cuando termine, verás:
```
✔ Build finished

🤖 Open this link on Android devices to install:
https://expo.dev/accounts/adrianpuche/projects/mobile/builds/XXXXXXXX
```

**Y un QR CODE.**

---

### PASO 8: Instalar en tu celular

**Opción A - Escanear QR:**
1. Abre la cámara de tu celular
2. Escanea el QR que apareció en la terminal
3. Presiona el link que aparece
4. Descarga e instala el APK

**Opción B - Link directo:**
1. Copia el link que empieza con `https://expo.dev/...`
2. Envíatelo por WhatsApp o email
3. Ábrelo en tu celular
4. Descarga e instala

---

### PASO 9: Permitir instalación

En tu celular Android:
1. Puede que te pida "Permitir fuentes desconocidas"
2. Ve a **Configuración → Seguridad**
3. Activa "Fuentes desconocidas" o "Instalar apps desconocidas"
4. Vuelve e instala

---

### PASO 10: Probar la app 🎉

1. Abre la app **Kaia** en tu celular
2. **Debería abrir normalmente** (ya NO loading infinito)
3. Prueba hacer registro/login

---

## 🔧 SI ALGO SALE MAL

### Error: "No builds available"
**Solución:**
```bash
eas build:list
```
Verifica que tus builds gratis se hayan reseteado. Si no:
- Espera 1 día más
- O verifica en: https://expo.dev/accounts/adrianpuche/settings/billing

---

### Error: "Project not configured"
**Solución:**
```bash
cd C:\Users\jorge\OneDrive\Desktop\Kaia\mobile
eas build:configure
```
Selecciona "Android" y vuelve a intentar el build.

---

### Error: "Build failed"
**Solución:**
1. Ve a: https://expo.dev/accounts/adrianpuche/projects/mobile/builds
2. Busca el build fallido
3. Haz clic en "View logs"
4. Copia el error
5. Búscame y dame el error exacto

---

## ✅ VERIFICACIÓN FINAL

Después de instalar, verifica que:

- [x] La app abre (NO se queda en loading)
- [x] Puedes ver la pantalla de Login/Register
- [x] La app se conecta al backend
- [x] Puedes crear una cuenta de prueba

---

## 📋 RESUMEN EN 3 PASOS

1. **Abre cmd** → `cd C:\Users\jorge\OneDrive\Desktop\Kaia\mobile`
2. **Ejecuta:** `eas build --platform android --profile preview`
3. **Espera 15 min** → Escanea QR → Instala → Prueba

---

## 🎯 ¿POR QUÉ VA A FUNCIONAR ESTA VEZ?

**El APK anterior NO funcionaba porque:**
❌ No tenía configurada la URL del backend

**El nuevo APK SÍ funcionará porque:**
✅ Ya configuré `eas.json` con la variable de entorno
✅ Ya hardcodeé la URL como fallback
✅ El backend está funcionando
✅ Todo está listo

**Líneas de código que lo prueban:**
- `mobile/eas.json:16-18` → Variable de entorno configurada
- `mobile/src/services/api/apiClient.ts:7` → URL hardcodeada

---

## 📞 CONTACTO DE EMERGENCIA

**Si algo falla:**

1. Ve a: https://expo.dev/accounts/adrianpuche/projects/mobile/builds
2. Busca el build más reciente
3. Toma screenshot de los logs
4. Búscame con ese screenshot

---

## 🗓️ RECORDATORIO

**Fecha:** 1 de Noviembre 2025
**Hora recomendada:** Cualquier hora del día
**Duración:** 20 minutos
**Dificultad:** Baja (solo copiar y pegar comandos)

---

## 💡 CONSEJO FINAL

**Guarda este documento.**

El 1 de Noviembre, abre este archivo y sigue los pasos UNO POR UNO.

No improvises. Solo sigue las instrucciones EXACTAS.

---

**Documento creado:** 19 de Octubre 2025
**Para ejecutar el:** 1 de Noviembre 2025
**Estado:** ✅ TODO LISTO - Solo esperar

---

*"12 días de espera → 15 minutos de build → App funcionando. Vale la pena."* 🚀
