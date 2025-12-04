module.exports = {
  apps: [{
    name: 'morthai-backend',
    script: './src/server.js',
    instances: 1, // Use 1 for database connections, or 'max' for load balancing
    exec_mode: 'fork', // Use 'cluster' if instances > 1
    watch: false, // Set to true only in development
    max_memory_restart: '500M', // Restart if memory exceeds 500MB
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};

