import crypto from 'crypto';

const CALLBACK_ENDPOINT = '/api/snap/v1/qr/qr-mpm-notify';
const TIMESTAMP_TOLERANCE_MS = 120_000;

function getCallbackConfig() {
  const signatureMode = (process.env.BTN_CALLBACK_SIGNATURE_MODE || 'RSA').toUpperCase();
  const partnerId = process.env.BTN_CALLBACK_PARTNER_ID;
  const endpoint = process.env.BTN_CALLBACK_ENDPOINT || CALLBACK_ENDPOINT;

  if (!partnerId || !endpoint || !['RSA', 'HMAC'].includes(signatureMode)) return null;

  if (signatureMode === 'RSA') {
    const publicKey = process.env.BTN_CALLBACK_PUBLIC_KEY?.replace(/\\n/g, '\n');
    return publicKey ? { signatureMode, partnerId, endpoint, publicKey } : null;
  }

  const secretKey = process.env.BTN_CALLBACK_SECRET_KEY;
  return secretKey ? { signatureMode, partnerId, endpoint, secretKey } : null;
}

function isValidTimestamp(timestamp) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+07:00$/.test(timestamp)) return false;
  const timestampMs = Date.parse(timestamp);
  return Number.isFinite(timestampMs) && Math.abs(Date.now() - timestampMs) <= TIMESTAMP_TOLERANCE_MS;
}

function signaturesMatch(expected, received) {
  const expectedBytes = Buffer.from(expected, 'base64');
  const receivedBytes = Buffer.from(received, 'base64');
  return expectedBytes.length > 0 && expectedBytes.length === receivedBytes.length &&
    crypto.timingSafeEqual(expectedBytes, receivedBytes);
}

function verifySignature(req, config, timestamp, signature) {
  const bodyHash = crypto.createHash('sha256')
    .update(JSON.stringify(req.body ?? {}))
    .digest('hex');

  if (config.signatureMode === 'RSA') {
    const stringToSign = `POST:${config.endpoint}:${bodyHash}:${timestamp}`;
    return crypto.verify(
      'RSA-SHA256',
      Buffer.from(stringToSign),
      config.publicKey,
      Buffer.from(signature, 'base64')
    );
  }

  const authorization = req.get('authorization') || '';
  const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) return false;

  const stringToSign = `POST:${config.endpoint}:${tokenMatch[1]}:${bodyHash}:${timestamp}`;
  const expectedSignature = crypto.createHmac('sha512', config.secretKey)
    .update(stringToSign)
    .digest('base64');
  return signaturesMatch(expectedSignature, signature);
}

export function btnQrisCallbackAuth(req, res, next) {
  const config = getCallbackConfig();
  if (!config) {
    return res.status(500).json({
      responseCode: '5005200',
      responseMessage: 'Callback authentication is not configured'
    });
  }

  const partnerId = req.get('x-partner-id') || '';
  const timestamp = req.get('x-timestamp') || '';
  const signature = req.get('x-signature') || '';
  const externalId = req.get('x-external-id') || '';
  const channelId = req.get('channel-id') || '';

  if (!externalId || !/^[A-Za-z0-9]{16}$/.test(externalId) || !/^\d{5}$/.test(channelId)) {
    return res.status(400).json({ responseCode: '4005202', responseMessage: 'Invalid callback headers' });
  }

  if (partnerId !== config.partnerId || !isValidTimestamp(timestamp) || !signature) {
    return res.status(401).json({ responseCode: '4015200', responseMessage: 'Unauthorized' });
  }

  try {
    if (!verifySignature(req, config, timestamp, signature)) {
      return res.status(401).json({ responseCode: '4015200', responseMessage: 'Unauthorized' });
    }
  } catch (error) {
    console.error('[BTN QRIS callback auth] Signature verification failed:', error.message);
    return res.status(401).json({ responseCode: '4015200', responseMessage: 'Unauthorized' });
  }

  return next();
}