import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app.js';
import { logger } from './utils/logger.js';
import { initSocket } from './services/socket/socket.service.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  logger.info(`Server & WebSocket is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Nodemon restart signal handling
process.once('SIGUSR2', () => {
  server.close(() => {
    process.kill(process.pid, 'SIGUSR2');
  });
});

// Graceful shutdown handling
const handleShutdown = (signal) => {
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 1000).unref();
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
