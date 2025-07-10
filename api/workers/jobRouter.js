import { createOrderHandler } from './handlers/createOrderHandler.js';
import { updateInventoryHandler } from './handlers/updateInventoryHandler.js';

export const jobRouter = {
  create_order: createOrderHandler,
  update_inventory: updateInventoryHandler,
};

export function getJobHandler(type) {
  const handler = jobRouter[type];
  if (!handler) {
    throw new Error(`No handler registered for job type: ${type}`);
  }
  return handler;
}