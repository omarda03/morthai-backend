# Mor Thai Backend - VPS Deployment Guide

## 🚀 Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v14 or higher)
3. **PM2** (Process Manager)
4. **Nginx** (Reverse Proxy - optional but recommended)

## 📦 Installation Steps

### 1. Install Node.js and PM2

```bash
# Install Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2
```

### 2. Install PostgreSQL

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Setup Database

```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE morthai_db;
CREATE USER morthai_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE morthai_db TO morthai_user;
\q

# Run migrations
cd /path/to/morthai-backend
npm install
npm run migrate
```

### 4. Configure Environment Variables

Create `.env` file:

```env
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=morthai_db
DB_USER=morthai_user
DB_PASSWORD=your_secure_password
JWT_SECRET=your_super_secret_jwt_key_change_this
CORS_ORIGIN=https://yourdomain.com
```

### 5. Start with PM2

```bash
# Create logs directory
mkdir -p logs

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system reboot
pm2 startup
# Follow the instructions it gives you
```

### 6. PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs morthai-backend

# Restart
pm2 restart morthai-backend

# Stop
pm2 stop morthai-backend

# Monitor
pm2 monit
```

## 🔒 Security & Stability Features

✅ **Error Handling**: Uncaught exceptions won't crash the server  
✅ **Auto-restart**: PM2 automatically restarts on crashes  
✅ **Memory limit**: Auto-restart if memory exceeds 500MB  
✅ **Graceful shutdown**: Properly closes connections on restart  
✅ **Database connection pool**: Handles connection errors gracefully  
✅ **Cron job protection**: Errors in scheduled tasks won't crash server  

## 🌐 Nginx Configuration (Optional)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 📊 Monitoring

```bash
# View real-time logs
pm2 logs morthai-backend --lines 100

# Monitor resources
pm2 monit

# Check application info
pm2 info morthai-backend
```

## 🔄 Updates

```bash
# Pull latest code
git pull

# Install dependencies
npm install

# Restart application
pm2 restart morthai-backend
```

## ⚠️ Troubleshooting

**Server crashes:**
- Check logs: `pm2 logs morthai-backend`
- Check database connection
- Verify environment variables

**High memory usage:**
- PM2 will auto-restart at 500MB
- Check for memory leaks in logs

**Database connection errors:**
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check database credentials in `.env`

