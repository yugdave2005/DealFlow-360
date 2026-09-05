import { api } from '../../lib/axios';

export const inventoryApi = {
  getInventoryLevels: () => api.get('/inventory'),
  adjustInventory: (warehouseId, productId, quantity) => api.post('/inventory/adjust', { warehouseId, productId, quantity })
};
