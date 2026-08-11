import crypto from 'crypto';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const BTN_CONFIG = {
  OAUTH_ID: process.env.BTN_OAUTH_ID || '',
  APIKEY_ID: process.env.BTN_APIKEY_ID || '',
  APIKEY_SECRET: process.env.BTN_APIKEY_SECRET || '',
  PRIVATE_KEY: process.env.BTN_PRIVATE_KEY ? process.env.BTN_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
  MERCHANT_ID: process.env.BTN_MERCHANT_ID || '',
  TERMINAL_ID: process.env.BTN_TERMINAL_ID || '',
  BASE_URL: process.env.BTN_BASE_URL || 'https://devapi.btn.co.id',
  ORIGIN: process.env.BTN_ORIGIN || 'barajacoffee.com',
  CHANNEL_ID: process.env.BTN_CHANNEL_ID || '00001'
};

/**
 * Generate X-TIMESTAMP
 * @returns {string} Timestamp in ISO 8601 format with +07:00 timezone
 */
const getTimestamp = () => {
  return dayjs().tz('Asia/Jakarta').format('YYYY-MM-DDTHH:mm:ssZ');
};

/**
 * Generate RSA Signature for Get Token
 * @param {string} timestamp 
 * @returns {string} Base64 encoded signature
 */
const generateRSASignature = (timestamp) => {
  const stringToSign = `${BTN_CONFIG.OAUTH_ID}|${timestamp}`;
  const sign = crypto.createSign('SHA256');
  sign.update(stringToSign);
  sign.end();
  return sign.sign(BTN_CONFIG.PRIVATE_KEY, 'base64');
};

/**
 * Generate HMAC-SHA512 Signature for API Request
 * @param {string} httpMethod 
 * @param {string} endpointUrl 
 * @param {string} accessToken 
 * @param {object} requestBody 
 * @param {string} timestamp 
 * @returns {string} Base64 encoded signature
 */
const generateHMACSignature = (httpMethod, endpointUrl, accessToken, requestBody, timestamp) => {
  // Minify request body
  const minifiedBody = JSON.stringify(requestBody);
  
  // SHA-256 hash of minified body in Lowercase Hex
  const hash = crypto.createHash('sha256').update(minifiedBody).digest('hex').toLowerCase();
  
  // stringToSign = HTTPMethod + ":" + EndpointUrl + ":" + AccessToken + ":" + Lowercase(HexEncode(SHA-256(minify(RequestBody)))) + ":" + X-TIMESTAMP
  const stringToSign = `${httpMethod}:${endpointUrl}:${accessToken}:${hash}:${timestamp}`;
  
  // HMAC-SHA512 with ApikeySecret
  const hmac = crypto.createHmac('sha512', BTN_CONFIG.APIKEY_SECRET);
  hmac.update(stringToSign);
  return hmac.digest('base64');
};

/**
 * Get Access Token
 */
export const getAccessToken = async () => {
  const timestamp = getTimestamp();
  const signature = generateRSASignature(timestamp);

  const headers = {
    'X-TIMESTAMP': timestamp,
    'X-CLIENT-KEY': BTN_CONFIG.OAUTH_ID,
    'X-SIGNATURE': signature,
    'Origin': BTN_CONFIG.ORIGIN,
    'Content-Type': 'application/json'
  };

  const body = {
    grantType: 'client_credentials',
    additionalInfo: {}
  };

  try {
    const response = await axios.post(`${BTN_CONFIG.BASE_URL}/snap/v1/access-token/b2b`, body, { headers });
    if (response.data && response.data.responseCode === '2007300') {
      return response.data.accessToken;
    }
    throw new Error(`Failed to get BTN Access Token: ${JSON.stringify(response.data)}`);
  } catch (error) {
    console.error('Error in getAccessToken:', error?.response?.data || error.message);
    throw error;
  }
};

/**
 * Generate QR MPM
 * @param {string} orderId 
 * @param {number} amount 
 * @returns {object} response
 */
export const generateQRIS = async (orderId, amount) => {
  const accessToken = await getAccessToken();
  const timestamp = getTimestamp();
  const endpoint = '/snap/v1/qr/qr-mpm-generate';
  const externalId = Math.random().toString(36).substring(2, 18).toUpperCase(); // 16 chars max

  const body = {
    partnerReferenceNo: orderId.toString().substring(0, 40),
    amount: {
      value: amount.toFixed(2),
      currency: 'IDR'
    },
    merchantId: BTN_CONFIG.MERCHANT_ID,
    terminalId: BTN_CONFIG.TERMINAL_ID,
    additionalInfo: {
      type_qris: 'D'
    }
  };

  const signature = generateHMACSignature('POST', endpoint, accessToken, body, timestamp);

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-TIMESTAMP': timestamp,
    'X-SIGNATURE': signature,
    'X-PARTNER-ID': BTN_CONFIG.APIKEY_ID,
    'X-EXTERNAL-ID': externalId.substring(0, 16),
    'CHANNEL-ID': BTN_CONFIG.CHANNEL_ID,
    'Origin': BTN_CONFIG.ORIGIN
  };

  try {
    const response = await axios.post(`${BTN_CONFIG.BASE_URL}${endpoint}`, body, { headers });
    if (response.data && response.data.responseCode === '2004700') {
      return response.data;
    }
    throw new Error(`Failed to generate QRIS BTN: ${JSON.stringify(response.data)}`);
  } catch (error) {
    console.error('Error in generateQRIS:', error?.response?.data || error.message);
    throw error;
  }
};

/**
 * Query Payment Status
 * @param {string} partnerReferenceNo 
 * @param {string} referenceNo 
 * @returns {object} response
 */
export const queryPaymentStatus = async (partnerReferenceNo, referenceNo) => {
  const accessToken = await getAccessToken();
  const timestamp = getTimestamp();
  const endpoint = '/snap/v1/qr/qr-mpm-query';
  const externalId = Math.random().toString(36).substring(2, 18).toUpperCase();

  const body = {
    originalPartnerReferenceNo: partnerReferenceNo,
    originalReferenceNo: referenceNo || "",
    serviceCode: '47',
    merchantId: BTN_CONFIG.MERCHANT_ID,
    additionalInfo: {}
  };

  const signature = generateHMACSignature('POST', endpoint, accessToken, body, timestamp);

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-TIMESTAMP': timestamp,
    'X-SIGNATURE': signature,
    'X-PARTNER-ID': BTN_CONFIG.APIKEY_ID,
    'X-EXTERNAL-ID': externalId.substring(0, 16),
    'CHANNEL-ID': BTN_CONFIG.CHANNEL_ID,
    'Origin': BTN_CONFIG.ORIGIN
  };

  try {
    const response = await axios.post(`${BTN_CONFIG.BASE_URL}${endpoint}`, body, { headers });
    if (response.data && response.data.responseCode === '2005100') {
      return response.data;
    }
    throw new Error(`Failed to query payment BTN: ${JSON.stringify(response.data)}`);
  } catch (error) {
    console.error('Error in queryPaymentStatus:', error?.response?.data || error.message);
    throw error;
  }
};

export default {
  getAccessToken,
  generateQRIS,
  queryPaymentStatus,
  BTN_CONFIG
};
