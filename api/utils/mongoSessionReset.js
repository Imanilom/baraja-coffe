// utils/mongoSessionReset.js
import mongoose from 'mongoose';

export async function resetMongoSessions() {
    //   if (process.env.NODE_ENV !== 'development') {
    //     throw new Error('Session reset only allowed in development');
    //   }

  try {
    // Create a new admin client
    const client = mongoose.connection.getClient();
    const adminDb = client.db().admin();
    
    // Alternative method to kill all sessions for current user
    await adminDb.command({
      killAllSessions: []
    });

    console.log('MongoDB sessions reset successfully');
    return { success: true };
  } catch (error) {
    console.error('Error resetting MongoDB sessions:', error);
    
    // Fallback method if killAllSessions fails
    try {
      await mongoose.disconnect();
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Fallback: Reconnected MongoDB successfully');
      return { success: true, method: 'reconnect' };
    } catch (fallbackError) {
      console.error('Fallback reconnect failed:', fallbackError);
      throw new Error(`Session reset failed: ${fallbackError.message}`);
    }
  }
}