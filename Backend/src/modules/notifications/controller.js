import * as notificationService from './service.js';
import { sendSuccess } from '../../utils/response.js';

export const list = async (req, res, next) => {
  try {
    const userId = req.query.userId || req.user?.id || null;
    const data = notificationService.listNotifications(userId);
    sendSuccess(res, 200, 'Notifications fetched', data);
  } catch (e) { next(e); }
};

export const get = async (req, res, next) => {
  try {
    const data = notificationService.getNotification(req.params.id);
    sendSuccess(res, 200, 'Notification', data);
  } catch (e) { next(e); }
};

export const create = async (req, res, next) => {
  try {
    const data = notificationService.createNotification(req.body);
    sendSuccess(res, 201, 'Notification created', data);
  } catch (e) { next(e); }
};

export const markRead = async (req, res, next) => {
  try {
    const data = notificationService.markRead(req.params.id);
    sendSuccess(res, 200, 'Marked as read', data);
  } catch (e) { next(e); }
};

export const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const data = notificationService.markAllRead(userId);
    sendSuccess(res, 200, 'All marked as read', data);
  } catch (e) { next(e); }
};
