import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { autoCompleteReservations } from './services/reservationAutoCompleteService.js';
import { createScheduledBackup } from './services/backupService.js';
import pool from './config/database.js';

dotenv.config();

const PORT = process.env.PORT || 3001;

// Handle uncaught exceptions and unhandled rejections to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit - let PM2 handle restart
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - let PM2 handle restart
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store io instance globally so it can be accessed from routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Join admin room for reservation updates
  socket.on('join:admin', () => {
    socket.join('admin');
    console.log('Client joined admin room:', socket.id);
  });
});

// Schedule auto-complete task to run every 15 minutes
// This checks for confirmed reservations that ended more than 3 hours ago
cron.schedule('*/15 * * * *', async () => {
  console.log('⏰ Running scheduled auto-complete check...');
  try {
    const result = await autoCompleteReservations();
    
    // Emit WebSocket event if any reservations were updated
    if (result.updated > 0 && io) {
      try {
        io.to('admin').emit('reservations:auto-completed', {
          count: result.updated,
          reservations: result.reservations,
        });
        console.log(`📢 Notified admins about ${result.updated} auto-completed reservation(s)`);
      } catch (wsError) {
        console.error('❌ Error emitting WebSocket event:', wsError);
        // Don't throw - WebSocket errors shouldn't crash the cron job
      }
    }
  } catch (error) {
    console.error('❌ Error in scheduled auto-complete task:', error);
    // Don't throw - cron job errors shouldn't crash the server
    // PM2 will handle if the entire process crashes
  }
}, {
  scheduled: true,
  timezone: "UTC"
});

// Schedule daily database backup at 2 AM UTC
cron.schedule('0 2 * * *', async () => {
  console.log('💾 Running scheduled daily backup...');
  try {
    await createScheduledBackup();
  } catch (error) {
    console.error('❌ Error in scheduled backup task:', error);
    // Don't throw - backup errors shouldn't crash the server
  }
}, {
  scheduled: true,
  timezone: "UTC"
});

// Also run once on server startup (after a short delay to ensure DB is ready)
setTimeout(async () => {
  console.log('🚀 Running initial auto-complete check on startup...');
  try {
    await autoCompleteReservations();
  } catch (error) {
    console.error('❌ Error in initial auto-complete check:', error);
    // Don't throw - startup check failure shouldn't prevent server from running
  }
}, 5000); // Wait 5 seconds after server starts

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('WebSocket server initialized');
  console.log('⏰ Auto-complete scheduler started (runs every 15 minutes)');
});

export { io };

