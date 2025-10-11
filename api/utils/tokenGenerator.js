// utilities/tokenGenerator.js
import crypto from 'crypto';

export const generateWebhookSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

