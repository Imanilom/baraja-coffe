// utils/transactionHandler.js
import mongoose from 'mongoose';
import { resetMongoSessions } from './mongoSessionReset.js';


export async function runWithTransactionRetry(fn, maxRetries = 3) {
  let attempts = 0;
  let lastError;
  
  while (attempts < maxRetries) {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction({
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' }
      });

      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if this is a MongoDB error with TransientTransactionError label
      const isTransientError = (
        error.code === 251 || // NoSuchTransaction
        error.code === 91 || // ShutdownInProgress
        (error.errorLabels && error.errorLabels.includes('TransientTransactionError')) ||
        (typeof error.hasErrorLabel === 'function' && error.hasErrorLabel('TransientTransactionError'))
      );

      // Always abort if we're in a transaction
      if (session.inTransaction()) {
        await session.abortTransaction().catch(() => {});
      }

      // Only retry on transient errors
      if (!isTransientError || attempts >= maxRetries - 1) {
        break;
      }

      attempts++;
      const delayMs = 100 * Math.pow(2, attempts); // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } finally {
      await session.endSession().catch(() => {});
    }
  }
  
  throw lastError || new Error(`Transaction failed after ${maxRetries} retries`);
}
