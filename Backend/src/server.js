import http from 'http';
import app from './app.js';
import { logger } from './utils/logger.js';
import { initSocket } from './services/socket/socket.service.js';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  logger.info(`Server & WebSocket is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
