import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { join } from 'path';
import Bull from 'bullmq';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Konfigurasi Redis
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});
// const redisConnection = new Redis({
//   host: 'redis',
//   port: 6379
// });



// Queue untuk pembayaran reservasi
export const reservationPaymentQueue = new Bull('reservationPaymentQueue', {
  connection: redisConnection,
  limiter: {
    max: 10,
    duration: 1000
  }
});