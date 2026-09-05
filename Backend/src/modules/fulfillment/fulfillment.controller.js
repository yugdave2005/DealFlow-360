import * as fulfillmentService from './fulfillment.service.js';
import { sendSuccess } from '../../utils/response.js';

export const generatePlan = async (req, res, next) => {
  try {
    const { orderId, mode } = req.body;
    const plan = await fulfillmentService.generateFulfillmentPlan(orderId, mode);
    sendSuccess(res, 201, 'Fulfillment plan generated', plan);
  } catch (err) {
    next(err);
  }
};

export const listPlans = async (req, res, next) => {
  try {
    const plans = await fulfillmentService.listFulfillmentPlans();
    sendSuccess(res, 200, 'Fulfillment plans', plans);
  } catch (err) {
    next(err);
  }
};

export const getPlan = async (req, res, next) => {
  try {
    const plan = await fulfillmentService.getFulfillmentPlan(req.params.planId);
    sendSuccess(res, 200, 'Fulfillment plan detail', plan);
  } catch (err) {
    next(err);
  }
};

export const acceptPlan = async (req, res, next) => {
  try {
    const { splits, deliveryDays, estimatedDelivery } = req.body;
    const result = await fulfillmentService.acceptPlan(req.params.planId, splits, deliveryDays, estimatedDelivery);
    sendSuccess(res, 200, result.message, result);
  } catch (err) {
    next(err);
  }
};

export const markDelivered = async (req, res, next) => {
  try {
    const result = await fulfillmentService.markDelivered(req.params.planId);
    sendSuccess(res, 200, result.message, result);
  } catch (err) {
    next(err);
  }
};
