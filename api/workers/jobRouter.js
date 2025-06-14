import { createOrderHandler } from './handlers/createOrderHandler.js';
import { updateInventoryHandler } from './handlers/updateInventoryHandler.js';
import { createOrderQueue } from '../queues/order.queue.js';

export const jobRouter = {
  create_order: createOrderHandler,
  update_inventory: updateInventoryHandler,
};
