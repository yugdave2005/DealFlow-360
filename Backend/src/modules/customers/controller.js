import * as customerService from './service.js';
import { sendSuccess } from '../../utils/response.js';

export const list = async (req, res, next) => {
  try {
    const data = await customerService.listCustomers();
    sendSuccess(res, 200, 'Customers fetched successfully', data);
  } catch (e) { next(e); }
};
