import * as repo from './repository.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { validateAdjustStock, validateReserve } from './validation.js';

export const listInventory = (filters = {}) => repo.findAll(filters);

export const getInventoryById = async (id) => {
  const inv = await repo.findById(id);
  if (!inv) throw new NotFoundError('Inventory record not found');
  return inv;
};

export const getInventoryByProduct = (productId) => repo.findAvailableForProduct(productId);

/**
 * Set or adjust inventory for a warehouse-product pair.
 */
export const adjustStock = async (body) => {
  validateAdjustStock(body);
  const data = {};
  if (body.availableQuantity !== undefined) data.availableQuantity = parseInt(body.availableQuantity, 10);
  if (body.reservedQuantity !== undefined) data.reservedQuantity = parseInt(body.reservedQuantity, 10);
  return repo.upsert(body.warehouseId, body.productId, data);
};

/**
 * Reserve stock across warehouses for a given product.
 * Uses greedy allocation from warehouse with highest availability.
 */
export const reserveStock = async (body) => {
  validateReserve(body);
  const available = await repo.findAvailableForProduct(body.productId);
  let remaining = parseInt(body.quantity, 10);
  const allocations = [];

  for (const inv of available) {
    if (remaining <= 0) break;
    const reserveQty = Math.min(remaining, inv.availableQuantity);
    const updated = await repo.update(inv.id, {
      availableQuantity: { decrement: reserveQty },
      reservedQuantity: { increment: reserveQty }
    });
    allocations.push({ warehouseId: inv.warehouseId, warehouseName: inv.warehouse.name, reserved: reserveQty });
    remaining -= reserveQty;
  }

  return {
    productId: body.productId,
    requestedQuantity: parseInt(body.quantity, 10),
    allocatedQuantity: parseInt(body.quantity, 10) - remaining,
    backorderQuantity: Math.max(0, remaining),
    allocations
  };
};

/**
 * Release previously reserved stock back to available.
 */
export const releaseReservation = async (body) => {
  validateReserve(body);
  const inv = await repo.findByWarehouseProduct(body.warehouseId, body.productId);
  if (!inv) throw new NotFoundError('No inventory record found for this warehouse-product combination');

  const releaseQty = Math.min(parseInt(body.quantity, 10), inv.reservedQuantity);
  if (releaseQty <= 0) throw new BadRequestError('No reserved stock to release');

  return repo.update(inv.id, {
    availableQuantity: { increment: releaseQty },
    reservedQuantity: { decrement: releaseQty }
  });
};

/**
 * Check cross-warehouse availability for a product.
 */
export const checkAvailability = async (productId) => {
  const records = await repo.findAvailableForProduct(productId);
  const totalAvailable = records.reduce((sum, r) => sum + r.availableQuantity, 0);
  const totalReserved = records.reduce((sum, r) => sum + r.reservedQuantity, 0);
  return {
    productId,
    totalAvailable,
    totalReserved,
    warehouses: records.map(r => ({
      warehouseId: r.warehouseId,
      warehouseName: r.warehouse.name,
      warehouseLocation: r.warehouse.location || '',
      available: r.availableQuantity,
      reserved: r.reservedQuantity
    })),
    isLowStock: totalAvailable < 10
  };
};
