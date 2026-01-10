# Production Setup Guide - CMI Payment Gateway

## Important Note

⚠️ **The backend MUST be hosted on a platform that supports server-to-server callbacks (Railway, Render, Heroku, etc.), NOT on Vercel.**

Vercel is designed for frontend/serverless functions and cannot reliably handle CMI's server-to-server POST callbacks. The backend must be accessible via a stable, publicly accessible URL.

## Required Environment Variables for Production

### On Vercel (Frontend)
Set these environment variables in your Vercel project settings:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
BASE_URL=https://morthai-prod.vercel.app
```

### On Backend Hosting (Railway, Render, Heroku, etc.)
Set these environment variables in your backend hosting platform:

```env
# CMI Payment Gateway
CMI_CLIENT_ID=your_cmi_client_id
CMI_STORE_KEY=your_cmi_store_key

# Frontend URL (where users will be redirected after payment)
BASE_URL=https://morthai-prod.vercel.app

# Backend URL (MUST be publicly accessible for CMI callbacks)
BACKEND_URL=https://your-backend-url.com

# Database and other configurations
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Other required variables
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=https://morthai-prod.vercel.app
NODE_ENV=production
PORT=3001
```

## Quick Setup Steps

### 1. Deploy Backend to Railway/Render/Heroku

**Option A: Railway (Recommended)**
1. Go to https://railway.app
2. Create a new project
3. Add PostgreSQL database
4. Deploy from GitHub or upload code
5. Set environment variables
6. Get your Railway URL (e.g., `https://morthai-backend.railway.app`)

**Option B: Render**
1. Go to https://render.com
2. Create a new Web Service
3. Connect your GitHub repository
4. Set environment variables
5. Deploy
6. Get your Render URL (e.g., `https://morthai-backend.onrender.com`)

### 2. Configure Environment Variables

**In Backend Platform (Railway/Render/Heroku):**
```env
BACKEND_URL=https://your-backend-url.com
BASE_URL=https://morthai-prod.vercel.app
CMI_CLIENT_ID=your_production_cmi_client_id
CMI_STORE_KEY=your_production_cmi_store_key
```

**In Vercel (Frontend):**
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### 3. Verify Configuration

After deployment, test the payment flow:
1. Make a test reservation with "Pay Online"
2. You should be redirected to CMI payment page
3. After payment, you should be redirected back to your site
4. Check backend logs to verify callback was received

## Troubleshooting

### Payment URLs are still pointing to localhost

**Solution:** Make sure `BASE_URL` and `BACKEND_URL` are set in your backend hosting platform environment variables.

### CMI callbacks not working

**Possible causes:**
1. Backend URL is not publicly accessible
2. CORS is blocking the callback request
3. Backend is hosted on Vercel (not supported for callbacks)

**Solution:** 
- Ensure backend is hosted on Railway, Render, or similar platform
- Verify `BACKEND_URL` is correct and accessible
- Check backend logs for callback errors

### Payment redirect fails

**Possible causes:**
1. `BASE_URL` is incorrect or missing
2. HTTPS not configured properly

**Solution:**
- Set `BASE_URL=https://morthai-prod.vercel.app` in backend environment
- Ensure URLs use HTTPS in production

## Testing

1. **Local Testing:**
   ```env
   BASE_URL=http://localhost:3000
   BACKEND_URL=http://localhost:3001
   ```

2. **Production Testing:**
   - Use production CMI credentials (sandbox/test credentials won't work)
   - Test with small amounts first
   - Verify callbacks are received in backend logs

## Security Notes

- Never commit `.env` files to Git
- Use production CMI credentials only in production environment
- Keep CMI credentials secure and rotate them regularly
- Use HTTPS for all URLs in production
