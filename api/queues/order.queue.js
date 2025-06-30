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

// Worker untuk memproses job
const worker = new Worker('orderQueue', async (job) => {
  const { type, payload } = job.data;
  const handler = jobRouter[type];

  if (!handler) {
    throw new Error(`No handler defined for job type: ${type}`);
  }

  try {
    const result = await handler(payload);
    console.log(`✅ Job ${type} success`, result);
    return result;
  } catch (err) {
    console.error(`❌ Error in job ${type}:`, err);
    throw err;
  }
}, {
  connection,
  concurrency: 5,
  removeOnComplete: {
    age: 60 * 60,
    count: 1000,
  },
  removeOnFail: {
    age: 24 * 60 * 60,
  },
});

worker.on('failed', (job, err) => {
  console.error(`🚨 Job ${job.name} [${job.id}] failed: ${err.message}`);
});
