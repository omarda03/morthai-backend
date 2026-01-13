# Payment Gateway Production Setup Guide

## Problem
If you see a 500 error when trying to process online payments in production, it's most likely because the CMI payment gateway credentials are not configured.

## Solution

### 1. Add CMI Credentials to Production Environment

You need to add the following environment variables to your production server's `.env` file:

```env
# CMI Payment Gateway Configuration
CMI_CLIENT_ID=your_production_client_id
CMI_STORE_KEY=your_production_store_key
BASE_URL=https://your-frontend-domain.com
BACKEND_URL=https://your-backend-domain.com
```

**Important Notes:**
- Use **PRODUCTION credentials** from CMI (not test credentials)
- Contact CMI to obtain production credentials if you only have test credentials
- `BASE_URL` should be your frontend domain (e.g., `https://morthai.compify.cloud`)
- `BACKEND_URL` should be your backend API domain
- Both URLs must use **HTTPS** in production

### 2. Verify Configuration

After adding the credentials:

1. **Restart the backend server:**
   ```bash
   pm2 restart morthai-backend
   ```

2. **Check the logs** to verify credentials are loaded:
   ```bash
   pm2 logs morthai-backend --lines 50
   ```
   
   Look for a log entry like:
   ```
   Payment request environment check: {
     hasClientId: true,
     hasStoreKey: true,
     baseUrl: 'https://...',
     backendUrl: 'https://...',
     nodeEnv: 'production'
   }
   ```

3. **Test payment flow:**
   - Try making a reservation with "Pay Online" option
   - If configured correctly, you should be redirected to CMI payment page
   - If you still see an error, check the logs for more details

### 3. Common Issues

**Issue: "CMI payment gateway credentials not configured"**
- **Solution:** Make sure `CMI_CLIENT_ID` and `CMI_STORE_KEY` are set in `.env` file
- **Verify:** Check logs for "CMI credentials missing" message

**Issue: Wrong credentials error from CMI**
- **Solution:** Verify you're using production credentials, not test credentials
- **Action:** Contact CMI to get production credentials

**Issue: Payment form not redirecting**
- **Solution:** Check that `BASE_URL` and `BACKEND_URL` are correct and use HTTPS
- **Verify:** Check logs for "Payment URLs configured" message

**Issue: Environment variables not loading**
- **Solution:** Ensure `.env` file is in the `morthai-backend/` directory
- **Verify:** Restart server after updating `.env`: `pm2 restart morthai-backend`
- **Check:** Verify `dotenv.config()` is called in `server.js` (it should be)

### 4. Debugging

If payment still doesn't work after configuration:

1. **Check backend logs:**
   ```bash
   pm2 logs morthai-backend --lines 100 | grep -i payment
   ```

2. **Look for these log messages:**
   - `Payment request environment check:` - Shows if credentials are loaded
   - `CMI credentials missing:` - Indicates missing credentials
   - `Payment URLs configured:` - Shows payment URLs being used
   - `Payment data created successfully:` - Indicates payment request was created
   - `Error creating payment:` - Shows any errors during payment creation

3. **Check frontend console:**
   - Open browser developer tools (F12)
   - Check Console tab for error messages
   - Check Network tab for failed requests to `/api/payment/reservation/*`

### 5. Temporary Workaround

If you need to accept reservations immediately while fixing payment configuration:
- Users can still make reservations by selecting **"Payer au Spa"** (Pay at Spa)
- Reservations will be created successfully with status "pending"
- Payment can be collected at the spa location

## Need Help?

If you're still experiencing issues:
1. Check the deployment logs: `pm2 logs morthai-backend`
2. Verify all environment variables are set correctly
3. Ensure you're using production CMI credentials (not test credentials)
4. Contact CMI support if credentials issues persist

