import * as repo from './repository.js';
import { NotFoundError } from '../../utils/errors.js';
import { validateUpdateUser } from './validation.js';

export const listUsers = () => repo.findAll();

export const getUserById = async (id) => {
  const user = await repo.findById(id);
  if (!user) throw new NotFoundError('User not found');
  return user;
};

export const updateUser = async (id, body) => {
  validateUpdateUser(body);
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('User not found');

  const data = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.role !== undefined) data.role = body.role;
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  return repo.update(id, data);
};

export const deleteUser = async (id) => {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('User not found');

  try {
    await repo.remove(id);
    return { deleted: true };
  } catch {
    // FK constraint — deactivate instead
    await repo.deactivate(id);
    return { deactivated: true, message: 'User has linked records and was deactivated instead' };
  }
};
