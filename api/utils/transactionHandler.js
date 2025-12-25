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
export async function runWithTransactionRetry(operation, existingSession = null, maxRetries = 3) {
  let lastError;
  let sessionToCleanup = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Create a new session for each attempt to avoid transaction number desync
    // Only reuse existing session on first attempt if provided
    let session;
    let shouldCloseSession = true;

    try {
      if (attempt === 1 && existingSession) {
        session = existingSession;
        shouldCloseSession = false; // Caller is responsible for closing
      } else {
        // Create fresh session with causalConsistency for better Atlas compatibility
        session = await mongoose.startSession({
          causalConsistency: true
        });
        sessionToCleanup = session;
      }

      // Safety check: ensure session is not in a transaction state
      if (session.inTransaction()) {
        console.warn('⚠️ Session already in transaction, aborting first...');
        try {
          await session.abortTransaction();
        } catch (e) {
          // Ignore abort errors - session might be in weird state
        }
      }

      // Start transaction with proper options
      session.startTransaction({
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
        readPreference: 'primary'
      });

      // Execute the operation, passing the session
      const result = await operation(session);

      // Commit the transaction
      await session.commitTransaction();

      // Success - clean up and return
      if (shouldCloseSession && session) {
        await session.endSession();
      }

      console.log(`✅ Transaction committed successfully on attempt ${attempt}`);
      return result;

    } catch (error) {
      lastError = error;

      // Try to abort the transaction if it's still in progress
      try {
        if (session && session.inTransaction()) {
          await session.abortTransaction();
          console.log(`⚠️ Transaction aborted on attempt ${attempt}: ${error.message}`);
        }
      } catch (abortError) {
        console.warn(`Failed to abort transaction: ${abortError.message}`);
      }

      // Clean up session for retry attempts (not the one provided from outside)
      if (shouldCloseSession && session) {
        try {
          await session.endSession();
        } catch (endError) {
          console.warn(`Failed to end session: ${endError.message}`);
        }
        sessionToCleanup = null;
      }

      // Check if we should retry
      if (isTransientError(error) && attempt < maxRetries) {
        const delay = calculateBackoffDelay(attempt);
        console.log(`🔄 Retrying transaction, attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        console.log(`   Error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // If not retrying, log the final error
      console.error(`❌ Transaction failed after ${attempt} attempt(s):`, {
        message: error.message,
        name: error.name,
        code: error.code
      });
      break;
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