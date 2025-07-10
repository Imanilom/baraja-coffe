// order.queue.js
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { jobRouter } from '../workers/jobRouter.js';

// const connection = new IORedis(process.env.REDIS_URL || 'redis://redis:6379', {
//   maxRetriesPerRequest: null,
// });
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// ✅ Tambahkan queue instance
export const orderQueue = new Queue('orderQueue', {
  connection
});

const worker = new Worker('orderQueue', async (job) => {
  console.log(`Processing job ${job.id}`, {
    name: job.name,
    data: job.data,
    timestamp: new Date()
  });

  // Ensure job data has required fields
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
    throw err;
  }
}, {
  connection,
  concurrency: 3,
  lockDuration: 30000
});

worker.on('failed', (job, err) => {
  console.error(`🚨 Job failed`, {
    name: job.name,
    id: job.id,
    error: err.message,
    data: job.data,
    failedReason: job.failedReason,
    timestamp: new Date()
  });
});

worker.on('completed', (job) => {
  console.log(`✔️ Job completed`, {
    name: job.name,
    id: job.id,
    data: job.data,
    timestamp: new Date()
  });
});