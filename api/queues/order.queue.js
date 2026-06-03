// queues/order/queue.js
import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { jobRouter } from '../workers/jobRouter.js';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// ✅ Queue instance
export const orderQueue = new Queue('orderQueue', {
  connection
});

// ✅ QueueEvents instance untuk waitUntilFinished
export const queueEvents = new QueueEvents('orderQueue', {
  connection
});

// ✅ Worker instance dengan retry logic
export const orderWorker = new Worker('orderQueue', async (job) => {
  console.log(`Processing job ${job.id}`, {
    name: job.name,
    data: job.data,
    timestamp: new Date()
  });

  if (!job.data.type || !job.data.payload) {
    throw new Error(`Invalid job structure. Missing type or payload: ${JSON.stringify(job.data)}`);
  }

  const { type, payload } = job.data;
  const handler = jobRouter[type];

  if (!handler) {
    throw new Error(`No handler defined for job type: ${type}`);
  }

  try {
    const result = await handler(payload);
    console.log(`✅ Job ${type} completed successfully`, {
      jobId: job.id,
      orderId: payload.orderId,
      result,
      timestamp: new Date()
    });
    return result;
  } catch (err) {
    console.error(`❌ Job ${type} failed`, {
      jobId: job.id,
      orderId: payload.orderId,
      error: err.message,
      stack: err.stack,
      timestamp: new Date()
    });

    // ✅ Tambahkan retry logic untuk transaction errors
    if (err.message.includes('transaction') || err.message.includes('session')) {
      if (job.attemptsMade < 3) {
        console.log(`🔄 Retrying job ${job.id}, attempt ${job.attemptsMade + 1}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * job.attemptsMade));
      }
    }

    throw err;
  }
}, {
  connection,
  concurrency: 5,
  lockDuration: 30000
});

// Event handlers
orderWorker.on('failed', (job, err) => {
  console.error(`🚨 Job failed`, {
    name: job?.name,
    id: job?.id,
    error: err.message,
    data: job?.data,
    failedReason: job?.failedReason,
    timestamp: new Date()
  });
});

orderWorker.on('completed', (job) => {
  console.log(`✔️ Job completed`, {
    name: job.name,
    id: job.id,
    data: job.data,
    timestamp: new Date()
  });
});

orderWorker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

console.log('Order queue worker started...');