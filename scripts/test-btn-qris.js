import dotenv from 'dotenv';
dotenv.config();

import btnQrisService from '../api/services/btnQris.service.js';

async function testBtnQris() {
  console.log('Testing BTN QRIS Service...');
  try {
    const token = await btnQrisService.getAccessToken();
    console.log('Access Token SUCCESS:', token.substring(0, 20) + '...');

    console.log('Testing Generate QR...');
    const partnerReferenceNo = 'TEST' + Date.now();
    const qrResult = await btnQrisService.generateQR(partnerReferenceNo, 15000);
    console.log('QR Generate SUCCESS:', JSON.stringify(qrResult, null, 2));

  } catch (error) {
    console.error('Test FAILED:', error.response?.data || error.message);
  }
}

testBtnQris();
