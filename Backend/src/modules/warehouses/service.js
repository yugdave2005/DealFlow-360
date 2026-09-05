import * as repo from './repository.js';
import { NotFoundError } from '../../utils/errors.js';
import { validateCreateWarehouse } from './validation.js';

const DEFAULT_HUBS = [
  { code: 'WH-AHM-01', name: 'Ahmedabad Central Hub', location: 'Ahmedabad, Gujarat' },
  { code: 'WH-AND-02', name: 'Anand Regional Depot', location: 'Anand, Gujarat' },
  { code: 'WH-GNR-03', name: 'Gandhinagar Express Hub', location: 'Gandhinagar, Gujarat' },
  { code: 'WH-SRT-04', name: 'Surat Distribution Center', location: 'Surat, Gujarat' }
];

export const listWarehouses = async () => {
  let warehouses = await repo.findAll();
  if (warehouses.length === 0) {
    for (const hub of DEFAULT_HUBS) {
      await repo.upsertByCode(hub.code, { name: hub.name, location: hub.location });
    }
    warehouses = await repo.findAll();
  }
  return warehouses;
};

export const getWarehouseById = async (id) => {
  const wh = await repo.findById(id);
  if (!wh) throw new NotFoundError('Warehouse not found');
  return wh;
};

export const createWarehouse = async (body) => {
  validateCreateWarehouse(body);
  return repo.create({
    code: body.code,
    name: body.name,
    location: body.location || null
  });
};

export const updateWarehouse = async (id, body) => {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('Warehouse not found');
  const data = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.location !== undefined) data.location = body.location;
  return repo.update(id, data);
};

export const deleteWarehouse = async (id) => {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('Warehouse not found');
  return repo.remove(id);
};

