import * as subService from './subscription.service.js';
import { sendSuccess } from '../../utils/response.js';

export const list = async (req, res, next) => {
  try { sendSuccess(res, 200, 'Subscriptions', await subService.listSubscriptions()); } catch (e) { next(e); }
};
export const get = async (req, res, next) => {
  try { sendSuccess(res, 200, 'Subscription', await subService.getSubscription(req.params.id)); } catch (e) { next(e); }
};
export const modify = async (req, res, next) => {
  try { sendSuccess(res, 200, 'Subscription updated', await subService.modifySubscription(req.params.id, req.body)); } catch (e) { next(e); }
};
export const cancel = async (req, res, next) => {
  try { sendSuccess(res, 200, 'Subscription cancelled', await subService.cancelSubscription(req.params.id, req.body)); } catch (e) { next(e); }
};
export const prorate = async (req, res, next) => {
  try { sendSuccess(res, 200, 'Proration processed successfully', await subService.processProration(req.params.id, req.body)); } catch (e) { next(e); }
};
