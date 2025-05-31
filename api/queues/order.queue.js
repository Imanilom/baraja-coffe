import { Queue } from 'bullmq';
import Redis from 'ioredis';

const sharedRedis = new Redis();

export const orderQueue = new Queue('orderQueue', {
  connection: {
    host: '127.0.0.1',
    port: 6379
  },
  sharedConnection: sharedRedis
});
