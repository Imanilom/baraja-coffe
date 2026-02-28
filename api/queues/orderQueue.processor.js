// queues/orderQueue.processor.js
import { orderQueue } from './order.queue.js';
import { getJobHandler } from '../workers/jobRouter.js';

export function setupOrderQueueProcessor() {
  orderQueue.process('create_order', 5, async (job) => {
    try {
      console.log(`Processing job ${job.id} of type ${job.data.type}`);
      const handler = getJobHandler(job.data.type);
      const result = await handler(job.data.payload);
      return result;
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error.message);
      
      // Handle transaction-related errors specifically
      if (error.message.includes('transaction') || error.message.includes('session')) {
        // Wait and retry untuk transient errors
        if (job.attemptsMade < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * job.attemptsMade));
        }
      }
      
      throw error;
    }
  });

  // Processor untuk job type lainnya
  orderQueue.process('update_inventory', 3, async (job) => {
    try {
      const handler = getJobHandler(job.data.type);
      return await handler(job.data.payload);
    } catch (error) {
      console.error(`Inventory update job ${job.id} failed:`, error.message);
      throw error;
    }
  });
}