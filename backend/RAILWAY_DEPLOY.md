# 🚂 Railway Deployment Guide - Kaia Backend

## Quick Start (10 minutes)

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Click "Login with GitHub"
3. Authorize Railway to access your GitHub account

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose repository: `adrianpuche12/Kaia`
4. Select root directory: `backend`

### Step 3: Add PostgreSQL Database
1. In your project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Wait for provisioning (~30 seconds)
4. Railway will automatically set `DATABASE_URL` variable

### Step 4: Configure Environment Variables

Click on your service → "Variables" tab → Add the following:

#### ✅ Required Variables (Minimum for deployment)

```bash
# Node Environment
NODE_ENV=production
PORT=3001

# Database (automatically set by Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Secrets (GENERATE NEW ONES!)
# Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<your-generated-secret-here>
JWT_REFRESH_SECRET=<your-generated-secret-here>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS (Update with your frontend URL)
CORS_ORIGIN=*
FRONTEND_URL=http://localhost:8081
```

#### 📧 Optional Variables (Can be added later)

```bash
# Twilio (SMS + WhatsApp) - Optional
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# SendGrid (Email) - Optional
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@kaia.app
SENDGRID_FROM_NAME=Kaia Assistant

# Google Maps API - Optional
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# OpenAI (for MCP generation) - Optional
OPENAI_API_KEY=your_openai_api_key

# Google Speech API - Optional
GOOGLE_SPEECH_API_KEY=your_google_speech_api_key
```

### Step 5: Deploy

Railway will automatically deploy when you add variables. Monitor the deployment in "Deployments" tab.

### Step 6: Generate Domain

1. Go to "Settings" tab
2. Scroll to "Networking"
3. Click "Generate Domain"
4. Your API will be available at: `https://your-project.up.railway.app`

---

## 🔐 Generate JWT Secrets

**IMPORTANT:** Never use development secrets in production!

Run this command locally to generate secure secrets:

```bash
# For JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# For JWT_REFRESH_SECRET (run again for different value)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy each output and use them for `JWT_SECRET` and `JWT_REFRESH_SECRET`.

---

## ✅ Verify Deployment

### 1. Health Check
```bash
curl https://your-project.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-14T...",
  "uptime": 123,
  "environment": "production"
}
```

### 2. Test Registration
```bash
curl -X POST https://your-project.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@production.com",
    "password": "SecurePass123!",
    "name": "Test",
    "lastName": "User",
    "phone": "+1234567890"
  }'
```

### 3. Test Login
```bash
curl -X POST https://your-project.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@production.com",
    "password": "SecurePass123!"
  }'
```

### 4. View Swagger Documentation
Open in browser:
```
https://your-project.up.railway.app/api/docs
```

---

## 📊 Monitoring

### View Logs
1. Go to your service in Railway
2. Click "Deployments" tab
3. Select active deployment
4. View real-time logs

### Check Metrics
1. Go to "Metrics" tab
2. Monitor:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request volume

---

## 🔧 Troubleshooting

### Issue: Build Fails

**Solution:** Check build logs for errors. Common issues:
- Missing dependencies: Check package.json
- TypeScript errors: Run `npm run build` locally first
- Prisma issues: Ensure migrations are committed

### Issue: Database Connection Fails

**Solution:**
1. Verify `DATABASE_URL` is set to `${{Postgres.DATABASE_URL}}`
2. Check PostgreSQL service is running
3. Verify migrations ran successfully in logs

### Issue: Environment Variables Not Working

**Solution:**
1. Redeploy after adding variables
2. Check variable names (case-sensitive)
3. Restart the service

### Issue: Migration Errors

**Solution:**
```bash
# Access Railway shell
railway run bash

# Check migration status
npx prisma migrate status

# Force deploy migrations
npx prisma migrate deploy
```

---

## 🚀 Post-Deployment Steps

### 1. Update Mobile App
Update API URL in mobile app configuration:

```typescript
// mobile/src/services/api/apiClient.ts
const API_URL = 'https://your-project.up.railway.app';
```

### 2. Test All Endpoints
Use the Swagger UI to test all endpoints:
- Authentication
- Events
- Messages
- Voice
- Location
- MCPs

### 3. Setup Monitoring (Optional)
Add external monitoring services:
- **Sentry**: Error tracking
- **UptimeRobot**: Uptime monitoring
- **DataDog/New Relic**: Performance monitoring

### 4. Configure Custom Domain (Optional)
1. Go to "Settings" → "Networking"
2. Add custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning

---

## 💰 Costs

Railway Pricing:
- **Free tier**: $5 credit/month
- **Hobby**: $5/month base + usage
- **Pro**: $20/month base + usage

Estimated monthly cost for MVP:
- **Backend service**: ~$5-10
- **PostgreSQL**: Included in plan
- **Total**: ~$5-15/month

---

## 🔄 CI/CD (Automatic Deployments)

Railway automatically deploys when you push to GitHub:

1. Make changes locally
2. Commit: `git add . && git commit -m "your message"`
3. Push: `git push origin dev`
4. Railway detects push and deploys automatically
5. Monitor deployment in Railway dashboard

---

## 📝 Environment Variables Reference

### Core Variables
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | ✅ | development | Environment mode |
| `PORT` | ✅ | 3000 | Server port |
| `DATABASE_URL` | ✅ | - | PostgreSQL connection |
| `JWT_SECRET` | ✅ | - | JWT access token secret |
| `JWT_REFRESH_SECRET` | ✅ | - | JWT refresh token secret |
| `JWT_EXPIRES_IN` | ✅ | 15m | Access token expiry |
| `JWT_REFRESH_EXPIRES_IN` | ✅ | 7d | Refresh token expiry |
| `CORS_ORIGIN` | ❌ | * | Allowed CORS origins |

### Optional Integrations
| Variable | Service | Description |
|----------|---------|-------------|
| `TWILIO_ACCOUNT_SID` | Twilio | Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio | Auth token |
| `TWILIO_PHONE_NUMBER` | Twilio | Phone number |
| `TWILIO_WHATSAPP_NUMBER` | Twilio | WhatsApp number |
| `SENDGRID_API_KEY` | SendGrid | API key |
| `SENDGRID_FROM_EMAIL` | SendGrid | Sender email |
| `OPENAI_API_KEY` | OpenAI | API key for MCP generation |
| `GOOGLE_MAPS_API_KEY` | Google Maps | Maps API key |
| `GOOGLE_SPEECH_API_KEY` | Google Cloud | Speech-to-Text API key |

---

## 🆘 Support

### Railway Support
- Documentation: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

### Repository Issues
- GitHub: https://github.com/adrianpuche12/Kaia/issues

---

**Deployment prepared by:** Claude Code Assistant
**Last updated:** 2025-10-14
**Estimated deployment time:** 10-15 minutes
