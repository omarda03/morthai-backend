# CMI Payment Gateway Configuration

This guide will help you configure the CMI (Credit Mutuel International) payment gateway for online reservations.

## Problem

If you see the error: **"CMI payment gateway credentials not configured"** when trying to pay online, you need to add the CMI credentials to your `.env` file.

## Solution

1. **Open your `.env` file** in `morthai-backend/` directory

2. **Add the following variables** to your `.env` file:

```env
# CMI Payment Gateway
CMI_CLIENT_ID=600001790
CMI_STORE_KEY=Morthai2701
BASE_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
```

3. **Save the file**

4. **Restart your backend server**:

```bash
cd morthai-backend
npm run dev
```

## Complete .env Example

Here's what your complete `.env` file should look like:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=morthai_db
DB_USER=postgres
DB_PASSWORD=your_password

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Authentication
JWT_SECRET=morthai-secret-key-2025

# CMI Payment Gateway
CMI_CLIENT_ID=600001790
CMI_STORE_KEY=Morthai2701
BASE_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# UltraMsg WhatsApp API (optional)
ULTRAMSG_INSTANCE_ID=your_instance_id
ULTRAMSG_TOKEN=your_token
```

## Verify Configuration

After adding the credentials and restarting the server:

1. Try to make a reservation with "Pay Online" option
2. If configured correctly, you should be redirected to CMI payment page
3. If you still see the error, check:
   - The `.env` file is in the `morthai-backend/` directory
   - No typos in variable names (they are case-sensitive)
   - The backend server was restarted after adding credentials

## Temporary Workaround

If you don't want to configure CMI right now, users can still make reservations by selecting **"Payer au Spa"** (Pay at Spa) option. The reservation will be created successfully and can be paid for at the spa location.

## Production Environment

For production, you should:
- Use HTTPS URLs in `BASE_URL` and `BACKEND_URL`
- Store credentials securely (use environment variables, not hardcoded values)
- Use production CMI credentials (contact CMI for production credentials)

## Support

For issues related to CMI payment gateway, refer to the `Readme.md` file in the root directory for detailed integration documentation.

