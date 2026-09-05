import { BadRequestError } from '../../utils/errors.js';

export const validateCreateNotification = (body) => {
  if (!body.type) throw new BadRequestError('Notification type is required');
  if (!body.title) throw new BadRequestError('Notification title is required');
};
