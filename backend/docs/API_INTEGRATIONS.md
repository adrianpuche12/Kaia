# Guía de Configuración de APIs - Kaia Backend

## 📋 Tabla de Contenidos

1. [Twilio (SMS + WhatsApp)](#twilio-sms--whatsapp)
2. [SendGrid (Email)](#sendgrid-email)
3. [Google Maps (Geolocalización)](#google-maps-geolocalización)
4. [Variables de Entorno](#variables-de-entorno)
5. [Rate Limiting](#rate-limiting)
6. [Seguridad](#seguridad)

---

## 🔐 Twilio (SMS + WhatsApp)

### Descripción
Twilio permite enviar mensajes SMS y WhatsApp a través de su API. Kaia utiliza Twilio para:
- Envío de SMS
- Envío de mensajes de WhatsApp
- Validación de números telefónicos
- Seguimiento de estado de mensajes

### Configuración

#### 1. Crear cuenta en Twilio
1. Ve a [https://www.twilio.com/](https://www.twilio.com/)
2. Regístrate para obtener una cuenta gratuita (trial)
3. Verifica tu número de teléfono

#### 2. Obtener credenciales
1. En el Dashboard de Twilio, encuentra:
   - **Account SID**: Tu identificador de cuenta
   - **Auth Token**: Tu token de autenticación
2. Copia estos valores para usarlos en `.env`

#### 3. Configurar número de teléfono
1. Ve a **Phone Numbers** → **Manage** → **Buy a number**
2. Selecciona un número con capacidades de SMS
3. Copia el número en formato E.164 (ej: `+12025551234`)

#### 4. Configurar WhatsApp (opcional)
1. Ve a **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Sigue las instrucciones para unir tu número a la sandbox de WhatsApp
3. El número sandbox por defecto es: `whatsapp:+14155238886`
4. Para producción, necesitas aplicar para un número WhatsApp Business

#### 5. Variables de entorno
```env
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+12025551234"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
```

### Limitaciones del Plan Gratuito
- **SMS**: $15.50 USD de crédito inicial
- **WhatsApp**: Limitado a números que se unan a tu sandbox
- Los mensajes incluyen un prefijo "Sent from your Twilio trial account"

### Uso en el Código

```typescript
import { getTwilioClient } from './integrations/TwilioClient';

// Enviar SMS
const twilioClient = getTwilioClient();
const result = await twilioClient.sendSMS({
  to: '+1234567890',
  message: 'Hola desde Kaia!'
});

// Enviar WhatsApp
const whatsappResult = await twilioClient.sendWhatsApp({
  to: '+1234567890',
  message: 'Hola desde Kaia por WhatsApp!'
});

// Validar número
const isValid = await twilioClient.validatePhoneNumber('+1234567890');
```

### Troubleshooting

**Error: "The number +X is unverified"**
- En modo trial, solo puedes enviar a números verificados en tu cuenta
- Ve a **Phone Numbers** → **Verified Caller IDs** para agregar números

**Error: "Twilio credentials not configured"**
- Verifica que `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN` estén en `.env`
- Reinicia el servidor después de modificar `.env`

---

## 📧 SendGrid (Email)

### Descripción
SendGrid es un servicio de envío de emails transaccionales. Kaia lo utiliza para:
- Envío de emails individuales
- Envío masivo de emails (hasta 1000 destinatarios)
- Templates de email con HTML
- Verificación de direcciones de email

### Configuración

#### 1. Crear cuenta en SendGrid
1. Ve a [https://sendgrid.com/](https://sendgrid.com/)
2. Regístrate para obtener una cuenta gratuita
3. Verifica tu email

#### 2. Crear API Key
1. Ve a **Settings** → **API Keys**
2. Click en **Create API Key**
3. Nombre: "Kaia Backend"
4. Permisos: **Full Access** (o **Restricted** con permisos de Mail Send)
5. Copia la API key (solo se muestra una vez)

#### 3. Configurar remitente verificado
1. Ve a **Settings** → **Sender Authentication**
2. Opción 1: **Single Sender Verification** (más rápido)
   - Ingresa tu email y datos
   - Verifica el email que recibes
3. Opción 2: **Domain Authentication** (recomendado para producción)
   - Configura registros DNS para tu dominio
   - Permite enviar desde cualquier email de tu dominio

#### 4. Variables de entorno
```env
SENDGRID_API_KEY="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
SENDGRID_FROM_EMAIL="noreply@tudominio.com"
SENDGRID_FROM_NAME="Kaia Assistant"
```

### Limitaciones del Plan Gratuito
- **100 emails/día** permanentemente gratis
- Sin límite de tiempo
- Todas las funcionalidades incluidas

### Uso en el Código

```typescript
import { getSendGridClient } from './integrations/SendGridClient';

// Enviar email simple
const sendGridClient = getSendGridClient();
const result = await sendGridClient.sendEmail({
  to: 'usuario@example.com',
  subject: 'Bienvenido a Kaia',
  text: 'Contenido en texto plano',
  html: '<p>Contenido en <strong>HTML</strong></p>'
});

// Enviar con template HTML
const html = sendGridClient.createHTMLEmail({
  title: 'Bienvenido',
  content: 'Gracias por unirte a Kaia',
  actionButton: {
    text: 'Comenzar',
    url: 'https://kaia.app/onboarding'
  }
});

await sendGridClient.sendEmail({
  to: 'usuario@example.com',
  subject: 'Bienvenido',
  html
});

// Enviar en lote
await sendGridClient.sendBulkEmail(
  ['user1@example.com', 'user2@example.com'],
  'Newsletter Mensual',
  {
    text: 'Contenido del newsletter',
    html: '<p>Contenido HTML</p>'
  }
);
```

### Troubleshooting

**Error: "Forbidden"**
- Verifica que la API key sea válida
- Asegúrate de tener permisos de Mail Send

**Error: "The from address does not match a verified Sender Identity"**
- El email en `SENDGRID_FROM_EMAIL` debe estar verificado
- Ve a **Settings** → **Sender Authentication**

**Emails no llegan**
- Revisa la carpeta de spam
- Ve a **Activity** en SendGrid para ver el estado de envío
- En desarrollo, considera usar un servicio como [Mailtrap](https://mailtrap.io/)

---

## 🗺️ Google Maps (Geolocalización)

### Descripción
Google Maps API proporciona servicios de geolocalización. Kaia lo utiliza para:
- Geocoding (dirección → coordenadas)
- Reverse geocoding (coordenadas → dirección)
- Cálculo de rutas
- Búsqueda de lugares cercanos

### Configuración

#### 1. Crear proyecto en Google Cloud
1. Ve a [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la facturación (requerido, pero incluye $200 USD/mes gratis)

#### 2. Habilitar APIs necesarias
1. Ve a **APIs & Services** → **Library**
2. Busca y habilita:
   - **Maps JavaScript API**
   - **Geocoding API**
   - **Directions API**
   - **Places API**

#### 3. Crear API Key
1. Ve a **APIs & Services** → **Credentials**
2. Click en **Create Credentials** → **API Key**
3. Copia la API key
4. Click en **Edit API key** para configurar restricciones:
   - **Application restrictions**: IP addresses (agrega la IP de tu servidor)
   - **API restrictions**: Selecciona solo las APIs que habilitaste

#### 4. Variables de entorno
```env
GOOGLE_MAPS_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

### Limitaciones del Plan Gratuito
- **$200 USD/mes** en créditos gratuitos
- Geocoding: ~40,000 requests/mes gratis
- Directions: ~40,000 requests/mes gratis
- Places: ~28,000 requests/mes gratis

### Uso Futuro en el Código

```typescript
// Nota: Esta integración está preparada pero aún no implementada

// Geocoding (dirección a coordenadas)
const location = await LocationService.geocode('1600 Amphitheatre Parkway, Mountain View, CA');

// Reverse geocoding (coordenadas a dirección)
const address = await LocationService.reverseGeocode(37.4224764, -122.0842499);

// Calcular ruta
const route = await LocationService.calculateRoute({
  from: { latitude: 37.4224764, longitude: -122.0842499 },
  to: { latitude: 37.7749, longitude: -122.4194 },
  mode: 'DRIVING'
});
```

### Troubleshooting

**Error: "REQUEST_DENIED"**
- Verifica que las APIs estén habilitadas
- Asegúrate de que la facturación esté configurada

**Error: "API key not valid"**
- Verifica que la API key sea correcta
- Revisa las restricciones de la API key

---

## 🔧 Variables de Entorno

### Archivo `.env`

Crea un archivo `.env` en la raíz del proyecto backend con el siguiente contenido:

```env
# ==========================================
# SERVER CONFIGURATION
# ==========================================
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3001

# ==========================================
# DATABASE
# ==========================================
DATABASE_URL="file:./dev.db"

# ==========================================
# JWT CONFIGURATION
# ==========================================
JWT_SECRET="tu-secreto-super-seguro-cambialo-en-produccion"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="tu-refresh-secret-super-seguro"
JWT_REFRESH_EXPIRES_IN="30d"

# ==========================================
# TWILIO CONFIGURATION (SMS + WhatsApp)
# ==========================================
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+12025551234"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"

# ==========================================
# SENDGRID CONFIGURATION (Email)
# ==========================================
SENDGRID_API_KEY="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
SENDGRID_FROM_EMAIL="noreply@tudominio.com"
SENDGRID_FROM_NAME="Kaia Assistant"

# ==========================================
# GOOGLE MAPS API (Geocoding, Routes, Places)
# ==========================================
GOOGLE_MAPS_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# ==========================================
# ENCRYPTION (para datos sensibles)
# ==========================================
ENCRYPTION_KEY="tu-encryption-key-de-32-caracteres-minimo"
```

### Validación de Variables

El backend valida automáticamente las variables requeridas al iniciar. Si faltan variables críticas, el servidor no iniciará.

**Variables Opcionales**: Si no configuras las APIs externas (Twilio, SendGrid, Google Maps), el backend usará implementaciones mock para desarrollo.

---

## ⚡ Rate Limiting

### Configuración Actual

Kaia implementa rate limiting para proteger el backend de abuso:

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| General (todas las APIs) | 100 requests | 15 minutos |
| Autenticación | 10 requests | 15 minutos |
| Envío de mensajes | 20 mensajes | 1 hora |
| Procesamiento de voz | 30 requests | 1 hora |
| Geolocalización (geocoding/rutas) | 100 requests | 1 hora |
| Ejecución de MCPs | 30 ejecuciones | 1 minuto |

### Headers de Rate Limit

El servidor incluye headers informativos en cada respuesta:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-10-10T12:30:00Z
```

### Respuesta cuando se excede el límite

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Demasiadas solicitudes. Intenta de nuevo en 120 segundos."
  }
}
```

Headers adicionales:
```
Retry-After: 120
```

### Personalizar Rate Limits

Edita `src/middleware/rateLimiter.ts`:

```typescript
export const messageRateLimiter = rateLimiter({
  maxRequests: 50, // Cambiar de 20 a 50
  windowMs: 60 * 60 * 1000,
  keyGenerator: (req) => `message:${req.user?.id || 'anonymous'}`,
});
```

---

## 🔒 Seguridad

### Helmet.js

Kaia usa Helmet.js para configurar headers de seguridad HTTP:

```typescript
// Content Security Policy
Content-Security-Policy: default-src 'self'; ...

// Prevención de clickjacking
X-Frame-Options: DENY

// HTTPS Strict Transport Security
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

// Prevención de MIME sniffing
X-Content-Type-Options: nosniff

// XSS Protection
X-XSS-Protection: 1; mode=block
```

### Mejores Prácticas

1. **Nunca commitees el archivo `.env`**
   - Ya está en `.gitignore`
   - Usa `.env.example` como template

2. **Usa secrets seguros en producción**
   ```bash
   # Generar JWT secret seguro
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Configura CORS apropiadamente**
   ```env
   # Desarrollo
   CORS_ORIGIN=http://localhost:3001

   # Producción
   CORS_ORIGIN=https://tuapp.com
   ```

4. **Habilita HTTPS en producción**
   - Usa un reverse proxy como Nginx
   - Considera servicios como Cloudflare para SSL

5. **Monitorea el uso de APIs**
   - Revisa los dashboards de Twilio, SendGrid y Google Cloud
   - Configura alertas de presupuesto

---

## 📊 Monitoreo y Logs

### Logs del Servidor

El servidor usa Winston para logging estructurado:

```typescript
// Logs disponibles en consola y en archivos
logs/
  ├── error.log      # Solo errores
  ├── combined.log   # Todos los logs
  └── access.log     # Logs de acceso HTTP
```

### Monitorear APIs Externas

#### Twilio
- Dashboard: [https://console.twilio.com/](https://console.twilio.com/)
- Ve a **Monitor** → **Logs** → **Messaging**

#### SendGrid
- Dashboard: [https://app.sendgrid.com/](https://app.sendgrid.com/)
- Ve a **Activity** para ver envíos en tiempo real

#### Google Maps
- Console: [https://console.cloud.google.com/](https://console.cloud.google.com/)
- Ve a **APIs & Services** → **Dashboard** para ver uso

---

## 🧪 Testing

### Probar sin APIs configuradas

El backend usa implementaciones mock si las APIs no están configuradas:

```typescript
// MessageService detecta automáticamente si Twilio está configurado
try {
  const twilioClient = getTwilioClient();
  // Usar API real
} catch (error) {
  // Usar mock para desarrollo
  console.warn('[WHATSAPP] Using mock - Twilio not configured');
}
```

### Probar con APIs reales

1. Configura todas las variables en `.env`
2. Usa Postman o curl para probar endpoints:

```bash
# Enviar mensaje de prueba
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "platform": "SMS",
    "to": "+1234567890",
    "content": "Hola desde Kaia!"
  }'
```

---

## 📞 Soporte

### Enlaces Útiles

- **Twilio Docs**: [https://www.twilio.com/docs](https://www.twilio.com/docs)
- **SendGrid Docs**: [https://docs.sendgrid.com/](https://docs.sendgrid.com/)
- **Google Maps Docs**: [https://developers.google.com/maps](https://developers.google.com/maps)

### Troubleshooting General

1. **Verifica que todas las variables estén en `.env`**
2. **Reinicia el servidor después de cambiar `.env`**
3. **Revisa los logs en consola para errores específicos**
4. **Verifica que las APIs estén habilitadas en los dashboards**
5. **Asegúrate de tener créditos disponibles (planes gratuitos)**

---

**Última actualización**: Día 18 - Octubre 2025
**Versión**: 1.0.0
