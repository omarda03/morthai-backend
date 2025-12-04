# Starting the Backend Server

## Quick Start

1. **Navigate to backend directory:**
   ```bash
   cd morthai-backend
   ```

2. **Install dependencies (if not already installed):**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in `morthai-backend/` with:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=morthai_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   PORT=3001
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000
   JWT_SECRET=morthai-secret-key-2025
   
   # UltraMsg WhatsApp API (optional - for sending confirmation messages)
   ULTRAMSG_INSTANCE_ID=your_instance_id
   ULTRAMSG_TOKEN=your_token
   
   # CMI Payment Gateway (required for online payments)
   CMI_CLIENT_ID=600001790
   CMI_STORE_KEY=Morthai2701
   BASE_URL=http://localhost:3000
   BACKEND_URL=http://localhost:3001
   ```
   
   **Note:** To get your UltraMsg credentials:
   1. Sign up at https://ultramsg.com
   2. Create an instance and get your Instance ID
   3. Get your API token from your dashboard
   4. Add them to your `.env` file
   
   The WhatsApp notification will only work if these variables are configured. If not set, the reservation update will still work but no WhatsApp message will be sent.
   
   **Note:** CMI Payment Gateway credentials are required for online payment functionality. If not configured, users can still make reservations with "Pay at Spa" option. Make sure to add the CMI credentials to your `.env` file.

4. **Run database migrations:**
   ```bash
   npm run migrate
   ```

5. **Start the server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001`

## Verify Server is Running

- Check: `http://localhost:3001/health`
- Should return: `{"status":"OK","message":"Server is running"}`

## Troubleshooting

### Port 3001 already in use
- Change `PORT=3001` in `.env` to a different port
- Update `CORS_ORIGIN` if needed

### Database connection errors
- Make sure PostgreSQL is running
- Verify database credentials in `.env`
- Check if database `morthai_db` exists

### Cannot login
- Make sure backend server is running on port 3001
- Check browser console for connection errors
- Verify credentials: username: `morthai`, password: `morthai@2025`

### Online payment not working
- Make sure CMI credentials are configured in `.env` file:
  ```
  CMI_CLIENT_ID=600001790
  CMI_STORE_KEY=Morthai2701
  BASE_URL=http://localhost:3000
  BACKEND_URL=http://localhost:3001
  ```
- If credentials are missing, users can still make reservations with "Pay at Spa" option
- Restart the backend server after adding CMI credentials

