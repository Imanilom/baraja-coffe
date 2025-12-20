// utils/transactionHandler.js
import mongoose from 'mongoose';
import { resetMongoSessions } from './mongoSessionReset.js';


export async function runWithTransactionRetry(operation, session, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await session.startTransaction();
      const result = await operation();
      await session.commitTransaction();
      return result;

    } catch (error) {
      await session.abortTransaction();
      lastError = error;

      // Retry hanya untuk transient errors
      if (isTransientError(error) && attempt < maxRetries) {
        console.log(`Retrying transaction, attempt ${attempt + 1}`);
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        continue;
      }
      break;
    }
  }

  throw lastError;
}

function isTransientError(error) {
  const transientPatterns = [
    'transaction',
    'session',
    'connection',
    'timeout',
    'lock'
  ];

  return transientPatterns.some(pattern =>
    error.message.toLowerCase().includes(pattern)
  );
}