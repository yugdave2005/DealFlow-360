import * as userService from './service.js';
import { sendSuccess } from '../../utils/response.js';

export const list = async (req, res, next) => {
  try {
    const data = await userService.listUsers();
    sendSuccess(res, 200, 'Users retrieved successfully', data);
  } catch (e) { next(e); }
};

export const get = async (req, res, next) => {
  try {
    const data = await userService.getUserById(req.params.id);
    sendSuccess(res, 200, 'User fetched', data);
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const data = await userService.updateUser(req.params.id, req.body);
    sendSuccess(res, 200, 'User updated successfully', data);
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    const data = await userService.deleteUser(req.params.id);
    sendSuccess(res, 200, data.deactivated ? data.message : 'User deleted successfully', data);
  } catch (e) { next(e); }
};
