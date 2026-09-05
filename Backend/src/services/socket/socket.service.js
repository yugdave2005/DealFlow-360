import { Server } from 'socket.io';
import { logger } from '../../utils/logger.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    }
  });

  io.on('connection', (socket) => {
    logger.info(`WebSocket Client connected: ${socket.id}`);

    socket.on('join_quotation', (quotationId) => {
      if (quotationId) {
        socket.join(`quotation:${quotationId}`);
        logger.info(`Socket ${socket.id} joined room quotation:${quotationId}`);
      }
    });

    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        logger.info(`Socket ${socket.id} joined room user:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => io;

export const broadcastEvent = (eventName, payload) => {
  if (!io) return;
  try {
    io.emit(eventName, payload);
    if (payload?.quotationId || payload?.id) {
      const qId = payload.quotationId || payload.id;
      io.to(`quotation:${qId}`).emit(eventName, payload);
    }
    logger.info(`Broadcasted WS event: ${eventName}`);
  } catch (err) {
    logger.error({ err }, `Failed to emit WS event: ${eventName}`);
  }
};
