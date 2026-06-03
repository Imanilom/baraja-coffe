// utils/transactionHandler.js
import mongoose from 'mongoose';

/**
 * Execute an operation with MongoDB transaction retry support.
 * Creates a new session for each retry attempt to avoid transaction number mismatch errors.
 * 
 * @param {Function} operation - Async function that receives (session) and performs DB operations
 * @param {Object|null} existingSession - Optional existing session (only used for first attempt)
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @returns {Promise<any>} Result from the operation
 */
// utils/transactionRetry.js

export async function runWithTransactionRetry(operationFn, session, maxRetries = 3) {
  if (!session) {
    // No session provided, just run the operation
    return await operationFn(null);
  }

  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await session.startTransaction();
      console.log(`🔄 Transaction attempt ${attempt}/${maxRetries}`);
      
      const result = await operationFn(session);
      
      await session.commitTransaction();
      console.log(`✅ Transaction committed on attempt ${attempt}`);
      
      return result;
    } catch (error) {
      console.error(`⚠️ Transaction aborted on attempt ${attempt}:`, error.message);
      
      if (session.transaction.isActive) {
        try {
          await session.abortTransaction();
        } catch (abortErr) {
          console.warn('Failed to abort transaction:', abortErr.message);
        }
      }
      
      lastError = error;
      
      // Check if we should retry
      if (attempt < maxRetries && 
          (error.code === 251 || // NoSuchTransaction
           error.message.includes('does not match any in-progress transactions'))) {
        
        // Exponential backoff
        const waitTime = Math.min(100 * Math.pow(2, attempt - 1), 1000);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // 🔥 CRITICAL: Start a fresh session if transaction number is mismatched
        if (error.message.includes('does not match any in-progress transactions')) {
          await session.endSession();
          session = await mongoose.startSession();
          console.log('🔄 Created fresh session for retry');
        }
        
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Calculate exponential backoff delay with jitter
 * @param {number} attempt - Current attempt number (1-based)
 * @returns {number} Delay in milliseconds
 */
function calculateBackoffDelay(attempt) {
  const baseDelay = 100;
  const maxDelay = 5000;
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 100; // Add some randomness to prevent thundering herd
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Check if an error is transient and can be retried
 * @param {Error} error - The error to check
 * @returns {boolean} True if the error is transient
 */
function isTransientError(error) {
  // MongoDB transient error labels
  if (error.hasErrorLabel?.('TransientTransactionError')) {
    return true;
  }

  // Common transient error patterns
  const transientPatterns = [
    'transaction',
    'session',
    'connection',
    'timeout',
    'lock',
    'WriteConflict',
    'TemporarilyUnavailable',
    'NetworkError',
    'HostNotFound',
    'HostUnreachable',
    'SocketException',
    'ECONNRESET',
    'ETIMEDOUT'
  ];

  const errorMessage = error.message?.toLowerCase() || '';
  const errorName = error.name?.toLowerCase() || '';

  return transientPatterns.some(pattern =>
    errorMessage.includes(pattern.toLowerCase()) ||
    errorName.includes(pattern.toLowerCase())
  );
}

/**
 * Execute a simple operation without transaction (fallback for when transactions aren't needed)
 * @param {Function} operation - Async function to execute
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<any>} Result from the operation
 */
export async function runWithRetry(operation, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (isTransientError(error) && attempt < maxRetries) {
        const delay = calculateBackoffDelay(attempt);
        console.log(`🔄 Retrying operation, attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      break;
    }
  }

  throw lastError;
}