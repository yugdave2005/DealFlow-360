import * as warehouseService from './service.js';
import { sendSuccess } from '../../utils/response.js';

export const list = async (req, res, next) => {
  try {
    const data = await warehouseService.listWarehouses();
    sendSuccess(res, 200, 'Warehouses fetched successfully', data);
  } catch (e) { next(e); }
};

export const get = async (req, res, next) => {
  try {
    const data = await warehouseService.getWarehouseById(req.params.id);
    sendSuccess(res, 200, 'Warehouse fetched', data);
  } catch (e) { next(e); }
};

export const create = async (req, res, next) => {
  try {
    const data = await warehouseService.createWarehouse(req.body);
    sendSuccess(res, 201, 'Warehouse created successfully', data);
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const data = await warehouseService.updateWarehouse(req.params.id, req.body);
    sendSuccess(res, 200, 'Warehouse updated', data);
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    const data = await warehouseService.deleteWarehouse(req.params.id);
    sendSuccess(res, 200, 'Warehouse deleted successfully', data);
  } catch (e) { next(e); }
};

