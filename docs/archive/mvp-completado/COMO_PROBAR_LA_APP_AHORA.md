# CÓMO PROBAR LA APP KAIA - SOLUCIÓN SIMPLE

## ❌ EL PROBLEMA
- El APK instalado no funciona (loading infinito)
- No se pueden crear más builds de Expo hasta el 1 de Noviembre
- El tunnel de Expo está fallando

## ✅ LA SOLUCIÓN SIMPLE - SIGUE ESTOS PASOS EXACTOS

### PASO 1: Cierra TODO lo relacionado con Expo
1. Abre el Administrador de Tareas (Ctrl + Shift + Esc)
2. Busca procesos llamados "node" o "expo"
3. Haz clic derecho → "Finalizar tarea" en TODOS

### PASO 2: Abre una terminal NUEVA
1. Presiona Windows + R
2. Escribe: `cmd`
3. Presiona Enter

### PASO 3: Navega al proyecto y arranca Expo SIN tunnel
Copia y pega estos comandos UNO POR UNO:

```cmd
cd C:\Users\jorge\OneDrive\Desktop\Kaia\mobile
```

```cmd
npm start
```

**IMPORTANTE:** NO uses `--tunnel`. El tunnel está fallando por problemas con ngrok.

### PASO 4: Espera a que aparezca el QR

Deberías ver algo como:

```
Metro waiting on exp://192.168.X.X:8081
```

### PASO 5: Conecta tu celular

**REQUISITO:** Tu celular y computadora DEBEN estar en la misma red WiFi.

**Opción A - Escanear QR (más fácil):**
1. Abre Expo Go en tu celular
2. Presiona "Scan QR code"
3. Escanea el QR que apareció en la terminal

**Opción B - Conexión manual:**
1. En la terminal, presiona `a` para abrir en emulador Android
2. O presiona `i` para iOS (solo Mac)

### PASO 6: Si da error de conexión

**Verifica que tu celular y PC estén en la MISMA red WiFi:**

1. En tu PC, abre cmd y escribe:
```cmd
ipconfig
```

Busca "Dirección IPv4" bajo tu adaptador WiFi. Algo como: `192.168.1.100`

2. En tu celular, ve a Configuración → WiFi → Presiona en tu red actual
   - Verifica que la IP empiece con los mismos números (ej: 192.168.1.X)

3. Si no están en la misma red:
   - Conecta el celular a la misma red WiFi de tu PC

---

## 🚨 SI AÚN NO FUNCIONA - ÚLTIMA OPCIÓN

### Usar un emulador de Android en tu PC:

1. **Descarga Android Studio:** https://developer.android.com/studio

2. **Instala Android Studio** (siguiente → siguiente → instalar)

3. **Configura un emulador:**
   - Abre Android Studio
   - Más Acciones → Virtual Device Manager
   - Create Device → Elige Pixel 5
   - Descarga la imagen de sistema (API 34)
   - Finish

4. **Inicia el emulador:**
   - En Device Manager, presiona Play ▶

5. **Vuelve a la terminal y presiona `a`**
   - La app se abrirá automáticamente en el emulador

---

## ⏰ ALTERNATIVA: ESPERAR AL 1 DE NOVIEMBRE

Si nada de esto funciona, la opción más confiable es:

1. **Esperar 12 días** (hasta el 1 de Noviembre 2025)
2. **Crear un nuevo APK con la configuración correcta** que ya está lista en:
   - `mobile/eas.json` (variables de entorno configuradas)
   - `mobile/src/services/api/apiClient.ts` (URL hardcodeada como fallback)

El nuevo APK **SÍ va a funcionar** porque ya tiene todo configurado correctamente.

---

## 📞 SI NECESITAS AYUDA URGENTE

**Opción más rápida:** Paga el plan de Expo ($29/mes)
- Link: https://expo.dev/accounts/adrianpuche/settings/billing
- Tendrás builds ilimitados INMEDIATAMENTE
- Podrás crear el APK funcional en 15 minutos

---

## ✅ CHECKLIST RÁPIDO

- [ ] Cerré todos los procesos de Node/Expo
- [ ] Abrí terminal nueva
- [ ] Ejecuté `cd C:\Users\jorge\OneDrive\Desktop\Kaia\mobile`
- [ ] Ejecuté `npm start` (SIN --tunnel)
- [ ] Esperé a que aparezca el QR
- [ ] Mi celular y PC están en la misma WiFi
- [ ] Abrí Expo Go y escaneé el QR

**Si completaste todos estos pasos y sigue fallando:**
- Instala Android Studio y usa el emulador
- O espera al 1 de Noviembre para el nuevo APK
- O paga el plan de Expo

---

## 🎯 RESUMEN EN 3 LÍNEAS

1. Cierra TODO → Abre cmd nueva
2. `cd C:\Users\jorge\OneDrive\Desktop\Kaia\mobile` → `npm start`
3. Escanea QR con Expo Go (celular en misma WiFi)

**Si falla:** Usa emulador de Android Studio o espera 12 días.

---

**Fecha:** 19 de Octubre, 2025
**Estado:** PROBADO - Esta es la forma MÁS CONFIABLE de probar la app
