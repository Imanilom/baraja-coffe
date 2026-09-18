import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

class BtnQrisService {
  constructor() {
    this.baseUrl = process.env.BTN_BASE_URL || 'https://devapi.btn.co.id';
    this.oauthId = process.env.BTN_OAUTH_ID;
    this.apiKey = process.env.BTN_API_KEY;
    this.secretKey = process.env.BTN_SECRET_KEY;
    this.channelId = '02030';

    // Replace literal \n with actual newlines if defined in single line string
    this.privateKey = process.env.BTN_PRIVATE_KEY
      ? process.env.BTN_PRIVATE_KEY.replace(/\\n/g, '\n')
      : null;
  }

  // Helper to generate ISO 8601 Timestamp with GMT+7
  getTimestamp() {
    const now = new Date();
    // Offset in milliseconds for GMT+7
    const offsetMs = 7 * 60 * 60 * 1000;
    const localNow = new Date(now.getTime() + offsetMs);

    // Format: 2023-03-15T10:10:00+07:00
    const pad = (n) => n.toString().padStart(2, '0');
    const YYYY = localNow.getUTCFullYear();
    const MM = pad(localNow.getUTCMonth() + 1);
    const DD = pad(localNow.getUTCDate());
    const hh = pad(localNow.getUTCHours());
    const mm = pad(localNow.getUTCMinutes());
    const ss = pad(localNow.getUTCSeconds());

    return `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}+07:00`;
  }

  // Helper to generate X-EXTERNAL-ID (16 alphanumeric characters)
  generateExternalId() {
    return crypto.randomBytes(8).toString('hex').toUpperCase(); // 16 chars
  }

  // SHA256withRSA Signature for Get Token
  generateRsaSignature(stringToSign) {
    if (!this.privateKey) throw new Error("BTN_PRIVATE_KEY is not configured");
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(stringToSign);
    sign.end();
    return sign.sign(this.privateKey, 'base64');
  }

  // HMAC-SHA512 Signature for API calls
  generateHmacSignature(httpMethod, endpointUrl, accessToken, requestBody, timestamp) {
    // 1. Minify Request Body (JSON.stringify does this)
    const minifiedBody = JSON.stringify(requestBody);

    // 2. SHA-256 of minified body
    const hash = crypto.createHash('sha256').update(minifiedBody).digest('hex').toLowerCase();

    // 3. Construct stringToSign
    const stringToSign = `${httpMethod}:${endpointUrl}:${accessToken}:${hash}:${timestamp}`;

    // 4. HMAC-SHA512 with secretKey
    return crypto.createHmac('sha512', this.secretKey).update(stringToSign).digest('base64');
  }

  // Get Access Token (B2B)
  async getAccessToken() {
    const timestamp = this.getTimestamp();
    const stringToSign = `${this.oauthId}|${timestamp}`;
    const signature = this.generateRsaSignature(stringToSign);

    const data = {
      grantType: "client_credentials",
      additionalInfo: {}
    };

    const headers = {
      'Content-Type': 'application/json',
      'X-TIMESTAMP': timestamp,
      'X-CLIENT-KEY': this.oauthId,
      'X-SIGNATURE': signature,
      'Origin': process.env.BASE_URL || 'http://localhost:3000'
    };

    try {
      const response = await axios.post(`${this.baseUrl}/snap/v1/access-token/b2b`, data, { headers });
      if (response.data && response.data.accessToken) {
        return response.data.accessToken;
      }
      throw new Error(`Failed to get access token: ${JSON.stringify(response.data)}`);
    } catch (error) {
      console.error("BTN getAccessToken Error:", error.response?.data || error.message);
      throw error;
    }
  }

  // Generate QR MPM
  async generateQR(partnerReferenceNo, amount, terminalId = '0000000000000000') {
    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();
    const endpoint = '/snap/v1/qr/qr-mpm-generate';
    const externalId = this.generateExternalId();

    const data = {
      partnerReferenceNo: partnerReferenceNo.substring(0, 40), // max 40 chars
      amount: {
        value: parseFloat(amount).toFixed(2), // e.g. "10000.00"
        currency: "IDR"
      },
      merchantId: process.env.BTN_MERCHANT_ID || '000000000000000', // max 15 chars
      terminalId: terminalId.substring(0, 16).padStart(16, '0'), // 16 chars
      additionalInfo: {
        type_qris: "D" // D = Dinamis
      }
    };

    const signature = this.generateHmacSignature('POST', endpoint, token, data, timestamp);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-TIMESTAMP': timestamp,
      'X-SIGNATURE': signature,
      'X-PARTNER-ID': this.apiKey,
      'X-EXTERNAL-ID': externalId,
      'CHANNEL-ID': this.channelId,
      'Origin': process.env.BASE_URL || 'http://localhost:3000'
    };

    try {
      const response = await axios.post(`${this.baseUrl}${endpoint}`, data, { headers });
      return response.data;
    } catch (error) {
      console.error("BTN generateQR Error:", error.response?.data || error.message);
      throw error;
    }
  }

  // Query Payment Status
  async queryPayment(originalPartnerReferenceNo, originalReferenceNo) {
    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();
    const endpoint = '/snap/v1/qr/qr-mpm-query';
    const externalId = this.generateExternalId();

    const data = {
      originalPartnerReferenceNo: originalPartnerReferenceNo.substring(0, 64),
      serviceCode: "47", // 47 for QR MPM Generate
      merchantId: process.env.BTN_MERCHANT_ID || '000000000000000',
      additionalInfo: {}
    };

    if (originalReferenceNo) {
      data.originalReferenceNo = originalReferenceNo.substring(0, 64);
    }

    const signature = this.generateHmacSignature('POST', endpoint, token, data, timestamp);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-TIMESTAMP': timestamp,
      'X-SIGNATURE': signature,
      'X-PARTNER-ID': this.apiKey,
      'X-EXTERNAL-ID': externalId,
      'CHANNEL-ID': this.channelId,
      'Origin': process.env.BASE_URL || 'http://localhost:3000'
    };

    try {
      const response = await axios.post(`${this.baseUrl}${endpoint}`, data, { headers });
      return response.data;
    } catch (error) {
      console.error("BTN queryPayment Error:", error.response?.data || error.message);
      throw error;
    }
  }

  // Cancel Payment Status
  async cancelPayment(originalPartnerReferenceNo, amount, reason, generateTime, terminalId = '0000000000000000', originalReferenceNo = null) {
    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();
    const endpoint = '/snap/v1.0/qr/qr-mpm-cancel';
    const externalId = this.generateExternalId();

    const data = {
      originalPartnerReferenceNo: originalPartnerReferenceNo.substring(0, 40),
      merchantId: process.env.BTN_MERCHANT_ID || '000000000000000',
      reason: reason.substring(0, 256),
      amount: {
        value: parseFloat(amount).toFixed(2),
        currency: "IDR"
      },
      additionalInfo: {
        generateTime: generateTime,
        terminalId: terminalId.substring(0, 16).padStart(16, '0')
      }
    };

    if (originalReferenceNo) {
      data.originalReferenceNo = originalReferenceNo.substring(0, 16);
    }

    const signature = this.generateHmacSignature('POST', endpoint, token, data, timestamp);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-TIMESTAMP': timestamp,
      'X-SIGNATURE': signature,
      'X-PARTNER-ID': this.apiKey,
      'X-EXTERNAL-ID': externalId,
      'CHANNEL-ID': this.channelId,
      'Origin': process.env.BASE_URL || 'http://localhost:3000'
    };

    try {
      const response = await axios.post(`${this.baseUrl}${endpoint}`, data, { headers });
      return response.data;
    } catch (error) {
      console.error("BTN cancelPayment Error:", error.response?.data || error.message);
      throw error;
    }
  }

  // Refund Payment Status
  async refundPayment(originalPartnerReferenceNo, partnerRefundNo, refundAmount, reason, generateTime, terminalId = '0000000000000000', originalReferenceNo = null) {
    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();
    const endpoint = '/snap/v1.0/qr/qr-mpm-refund';
    const externalId = this.generateExternalId();

    const data = {
      merchantId: process.env.BTN_MERCHANT_ID || '000000000000000',
      originalPartnerReferenceNo: originalPartnerReferenceNo.substring(0, 40),
      partnerRefundNo: partnerRefundNo.substring(0, 40),
      refundAmount: {
        value: parseFloat(refundAmount).toFixed(2),
        currency: "IDR"
      },
      reason: reason.substring(0, 256),
      additionalInfo: {
        generateTime: generateTime,
        terminalId: terminalId.substring(0, 16).padStart(16, '0')
      }
    };

    if (originalReferenceNo) {
      data.originalReferenceNo = originalReferenceNo.substring(0, 16);
    }

    const signature = this.generateHmacSignature('POST', endpoint, token, data, timestamp);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-TIMESTAMP': timestamp,
      'X-SIGNATURE': signature,
      'X-PARTNER-ID': this.apiKey,
      'X-EXTERNAL-ID': externalId,
      'CHANNEL-ID': this.channelId,
      'Origin': process.env.BASE_URL || 'http://localhost:3000'
    };

    try {
      const response = await axios.post(`${this.baseUrl}${endpoint}`, data, { headers });
      return response.data;
    } catch (error) {
      console.error("BTN refundPayment Error:", error.response?.data || error.message);
      throw error;
    }
  }
}

export default new BtnQrisService();
