import jwt from 'jsonwebtoken';

const normalizePem = (value) => (value || '').replace(/\\n/g, '\n').trim();

const getJwtSecret = () => process.env.JWT_SECRET || '';
const getJwtPublicKey = () => normalizePem(process.env.JWT_PUBLIC_KEY);
const getJwtPrivateKey = () => normalizePem(process.env.JWT_PRIVATE_KEY);

export const signJwt = (payload, options = {}) => {
  const defaultOptions = { expiresIn: '7d' };
  const mergedOptions = { ...defaultOptions, ...options };
  const privateKey = getJwtPrivateKey();

  if (privateKey && process.env.JWT_ALGORITHM === 'RS256') {
    return jwt.sign(payload, privateKey, {
      ...mergedOptions,
      algorithm: 'RS256',
    });
  }

  return jwt.sign(payload, getJwtSecret(), mergedOptions);
};

export const verifyJwt = (token, options = {}) => {
  const publicKey = getJwtPublicKey();
  const secret = getJwtSecret();

  if (publicKey) {
    try {
      return jwt.verify(token, publicKey, {
        ...options,
        algorithms: ['RS256', 'HS256'],
      });
    } catch (error) {
      // Fallback ke JWT_SECRET untuk kompatibilitas token lama
    }
  }

  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.verify(token, secret, options);
};
