// utils/transactionHandler.js
import mongoose from 'mongoose';
import { resetMongoSessions } from './mongoSessionReset.js';

async function runWithTransactionRetry(fn, maxRetries = 3) {
  let attempts = 0;
  let lastError;
  
  while (attempts < maxRetries) {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction({
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
        readPreference: 'primary'
      });

      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      lastError = error;
      
      // Reset sessions if we get transaction number mismatch
      if (error.code === 251 || error.codeName === 'NoSuchTransaction') {
        if (process.env.NODE_ENV === 'development') {
          await resetMongoSessions();
        }
      }

      if (session.inTransaction()) {
        await session.abortTransaction().catch(() => {});
      }

      if (attempts >= maxRetries - 1 || 
          !error.hasErrorLabel('TransientTransactionError')) {
        throw error;
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 100 * attempts));
      continue;
    } finally {
      await session.endSession().catch(() => {});
    }
  }
  
  throw lastError || new Error(`Transaction failed after ${maxRetries} retries`);
}

export { runWithTransactionRetry };