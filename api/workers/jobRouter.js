import { createOrderHandler } from './handlers/createOrderHandler.js';
import { updateInventoryHandler } from './handlers/updateInventoryHandler.js';

export const jobRouter = {
  create_order: createOrderHandler,
  update_inventory: updateInventoryHandler,
};
