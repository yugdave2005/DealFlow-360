import * as inventoryService from './service.js';
import { sendSuccess } from '../../utils/response.js';

export const list = async (req, res, next) => {
  try {
    const data = await inventoryService.listInventory(req.query);
    sendSuccess(res, 200, 'Inventory fetched', data);
  } catch (e) { next(e); }
};

export const get = async (req, res, next) => {
  try {
    const data = await inventoryService.getInventoryById(req.params.id);
    sendSuccess(res, 200, 'Inventory record', data);
  } catch (e) { next(e); }
};

export const getByProduct = async (req, res, next) => {
  try {
    const data = await inventoryService.getInventoryByProduct(req.params.productId);
    sendSuccess(res, 200, 'Product inventory', data);
  } catch (e) { next(e); }
};

export const adjust = async (req, res, next) => {
  try {
    const data = await inventoryService.adjustStock(req.body);
    sendSuccess(res, 200, 'Stock adjusted', data);
  } catch (e) { next(e); }
};

export const reserve = async (req, res, next) => {
  try {
    const data = await inventoryService.reserveStock(req.body);
    sendSuccess(res, 200, 'Stock reserved', data);
  } catch (e) { next(e); }
};

export const release = async (req, res, next) => {
  try {
    const data = await inventoryService.releaseReservation(req.body);
    sendSuccess(res, 200, 'Reservation released', data);
  } catch (e) { next(e); }
};

export const availability = async (req, res, next) => {
  try {
    const data = await inventoryService.checkAvailability(req.params.productId);
    sendSuccess(res, 200, 'Availability check', data);
  } catch (e) { next(e); }
};
