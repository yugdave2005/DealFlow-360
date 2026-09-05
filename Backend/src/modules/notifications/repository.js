/**
 * In-memory notification store for demo purposes.
 * In production, this would be backed by a database table.
 */
const notifications = [];
let idCounter = 1;

export const findAll = (userId = null) => {
  const filtered = userId ? notifications.filter(n => n.userId === userId) : notifications;
  return [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const findById = (id) => notifications.find(n => n.id === id) || null;

export const create = (data) => {
  const notification = {
    id: `notif-${String(idCounter++).padStart(4, '0')}`,
    ...data,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(notification);
  return notification;
};

export const markRead = (id) => {
  const notif = notifications.find(n => n.id === id);
  if (notif) notif.isRead = true;
  return notif;
};

export const markAllRead = (userId) => {
  notifications.filter(n => n.userId === userId).forEach(n => { n.isRead = true; });
  return { updated: true };
};
