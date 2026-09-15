import * as customerService from './service.js';
import { sendSuccess } from '../../utils/response.js';

export const list = async (req, res, next) => {
  try {
    const data = await customerService.listCustomers();
    sendSuccess(res, 200, 'Customers fetched successfully', data);
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, isActive } = req.body;
    const data = await customerService.updateCustomer(id, { name, email, isActive });
    sendSuccess(res, 200, 'Customer updated successfully', data);
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await customerService.deleteCustomer(id);
    sendSuccess(res, 200, data.message || 'Customer deleted successfully', data);
  } catch (e) { next(e); }
};
