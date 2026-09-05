import * as repo from './repository.js';
import { NotFoundError } from '../../utils/errors.js';
import { validateCreateNotification } from './validation.js';
import { broadcastEvent } from '../../services/socket/socket.service.js';

export const listNotifications = (userId = null) => repo.findAll(userId);

export const getNotification = (id) => {
  const notif = repo.findById(id);
  if (!notif) throw new NotFoundError('Notification not found');
  return notif;
};

export const createNotification = (body) => {
  validateCreateNotification(body);
  const notification = repo.create({
    userId: body.userId || null,
    type: body.type,
    title: body.title,
    message: body.message || '',
    entityType: body.entityType || null,
    entityId: body.entityId || null
  });

  // Broadcast via WebSocket
  broadcastEvent('NOTIFICATION', notification);
  return notification;
};

export const markRead = (id) => {
  const notif = repo.markRead(id);
  if (!notif) throw new NotFoundError('Notification not found');
  return notif;
};

export const markAllRead = (userId) => repo.markAllRead(userId);
