/**
 * Test Script: BTN SNAP QRIS Auth (Get Access Token B2B)
 * Run: node test-btn-auth.js
 */

import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL   = process.env.BTN_BASE_URL   || 'https://devapi.btn.co.id';
const OAUTH_ID   = process.env.BTN_OAUTH_ID;
const API_KEY    = process.env.BTN_API_KEY;
const SECRET_KEY = process.env.BTN_SECRET_KEY;
const ORIGIN     = process.env.BASE_URL || 'http://localhost:3000';

const PRIVATE_KEY = process.env.BTN_PRIVATE_KEY
  ? process.env.BTN_PRIVATE_KEY.replace(/\\n/g, '\n')
  : null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTimestamp() {
  const now = new Date();
  const offsetMs = 7 * 60 * 60 * 1000;
  const local = new Date(now.getTime() + offsetMs);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth()+1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}+07:00`;
}

function generateRsaSignature(stringToSign, privateKey) {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(stringToSign);
  sign.end();
  return sign.sign(privateKey, 'base64');
}

function generateHmacSignature(httpMethod, endpointUrl, accessToken, requestBody, timestamp) {
  const minifiedBody = JSON.stringify(requestBody);
  const hash = crypto.createHash('sha256').update(minifiedBody).digest('hex').toLowerCase();
  const stringToSign = `${httpMethod}:${endpointUrl}:${accessToken}:${hash}:${timestamp}`;
  return crypto.createHmac('sha512', SECRET_KEY).update(stringToSign).digest('base64');
}

function generateExternalId() {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

// ─── Test 1: Validasi Env Vars ────────────────────────────────────────────────

function testEnvVars() {
  console.log('\n════════════════════════════════════════');
  console.log('TEST 1: Cek Environment Variables');
  console.log('════════════════════════════════════════');

  const vars = {
    BTN_BASE_URL: BASE_URL,
    BTN_OAUTH_ID: OAUTH_ID,
    BTN_API_KEY: API_KEY,
    BTN_SECRET_KEY: SECRET_KEY,
    BTN_PRIVATE_KEY: PRIVATE_KEY ? `${PRIVATE_KEY.substring(0, 40)}... [OK]` : null,
    BTN_MERCHANT_ID: process.env.BTN_MERCHANT_ID,
  };

  const criticalKeys = ['BTN_BASE_URL', 'BTN_OAUTH_ID', 'BTN_API_KEY', 'BTN_SECRET_KEY', 'BTN_PRIVATE_KEY'];
  let criticalOk = true;
  for (const [key, val] of Object.entries(vars)) {
    const isCritical = criticalKeys.includes(key);
    const status = val ? '✅' : (isCritical ? '❌ MISSING (KRITIKAL)' : '⚠️  MISSING (opsional)');
    console.log(`  ${status}  ${key}: ${val || '-'}`);
    if (!val && isCritical) criticalOk = false;
  }

  if (!criticalOk) {
    console.log('\n❌ Env variable KRITIKAL belum diisi. Auth tidak bisa dilanjutkan.\n');
  } else {
    console.log('\n✅ Semua env variable kritikal tersedia.');
  }
  return criticalOk;
}

// ─── Test 2: Format Timestamp ─────────────────────────────────────────────────

function testTimestamp() {
  console.log('\n════════════════════════════════════════');
  console.log('TEST 2: Format Timestamp');
  console.log('════════════════════════════════════════');

  const ts = getTimestamp();
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+07:00$/;
  const valid = regex.test(ts);
  console.log(`  Timestamp  : ${ts}`);
  console.log(`  Format OK  : ${valid ? '✅' : '❌'} (expected YYYY-MM-DDThh:mm:ss+07:00)`);
  return ts;
}

// ─── Test 3: RSA Signature Generation ────────────────────────────────────────

function testRsaSignature(timestamp) {
  console.log('\n════════════════════════════════════════');
  console.log('TEST 3: RSA Signature (Get Token)');
  console.log('════════════════════════════════════════');

  if (!PRIVATE_KEY) {
    console.log('  ❌ BTN_PRIVATE_KEY tidak ada, skip test ini');
    return null;
  }

  try {
    const stringToSign = `${OAUTH_ID}|${timestamp}`;
    console.log(`  String to Sign : "${stringToSign}"`);

    const signature = generateRsaSignature(stringToSign, PRIVATE_KEY);
    const preview = signature.substring(0, 60) + '...';
    console.log(`  X-SIGNATURE    : ${preview}`);
    console.log(`  ✅ RSA Signature generated successfully (${signature.length} chars)`);
    return signature;
  } catch (err) {
    console.log(`  ❌ RSA Signature Error: ${err.message}`);
    return null;
  }
}

// ─── Test 4: Get Access Token (HTTP Call) ─────────────────────────────────────

async function testGetAccessToken(timestamp, signature) {
  console.log('\n════════════════════════════════════════');
  console.log('TEST 4: Get Access Token (B2B) — HTTP Call');
  console.log('════════════════════════════════════════');

  const url = `${BASE_URL}/snap/v1/access-token/b2b`;
  const body = { grantType: 'client_credentials', additionalInfo: {} };

  const headers = {
    'Content-Type': 'application/json',
    'X-TIMESTAMP':  timestamp,
    'X-CLIENT-KEY': OAUTH_ID,
    'X-SIGNATURE':  signature,
    'Origin':       ORIGIN,
  };

  console.log(`  URL     : ${url}`);
  console.log(`  Headers :`);
  console.log(`    X-TIMESTAMP  : ${headers['X-TIMESTAMP']}`);
  console.log(`    X-CLIENT-KEY : ${headers['X-CLIENT-KEY']}`);
  console.log(`    X-SIGNATURE  : ${signature?.substring(0,40)}...`);
  console.log(`    Origin       : ${headers['Origin']}`);
  console.log(`  Body    : ${JSON.stringify(body)}`);
  console.log('');

  try {
    const response = await axios.post(url, body, { headers, timeout: 15000 });
    const data = response.data;

    console.log(`  HTTP Status    : ${response.status}`);
    console.log(`  responseCode   : ${data.responseCode}`);
    console.log(`  responseMessage: ${data.responseMessage}`);

    if (data.accessToken) {
      const tokenPreview = data.accessToken.substring(0, 40) + '...';
      console.log(`  accessToken    : ${tokenPreview}`);
      console.log(`  tokenType      : ${data.tokenType}`);
      console.log(`  expiresIn      : ${data.expiresIn} detik`);
      console.log(`\n  ✅ AUTH BERHASIL! Access Token didapat.`);
      return data.accessToken;
    } else {
      console.log(`  ❌ AUTH GAGAL. Tidak ada accessToken di response.`);
      console.log(`  Full response  :`, JSON.stringify(data, null, 2));
      return null;
    }
  } catch (err) {
    const resp = err.response;
    console.log(`  ❌ HTTP Error: ${err.message}`);
    if (resp) {
      console.log(`  HTTP Status   : ${resp.status}`);
      console.log(`  Response Body :`, JSON.stringify(resp.data, null, 2));
    }
    return null;
  }
}

// ─── Test 5: HMAC-SHA512 Signature (validasi format saja) ────────────────────

function testHmacSignature(accessToken, timestamp) {
  console.log('\n════════════════════════════════════════');
  console.log('TEST 5: HMAC-SHA512 Signature (API Calls)');
  console.log('════════════════════════════════════════');

  if (!accessToken) {
    console.log('  ⚠️  Tidak ada accessToken, menggunakan dummy token untuk test format.');
  }

  const dummyToken = accessToken || 'dummy-token-for-format-test';
  const endpoint   = '/snap/v1/qr/qr-mpm-query';
  const body = {
    originalPartnerReferenceNo: 'TEST-ORDER-001',
    serviceCode: '47',
    merchantId: process.env.BTN_MERCHANT_ID || '000000000000000',
    additionalInfo: {}
  };

  try {
    const signature = generateHmacSignature('POST', endpoint, dummyToken, body, timestamp);
    const preview = signature.substring(0, 60) + '...';
    console.log(`  Endpoint       : POST ${endpoint}`);
    console.log(`  X-SIGNATURE    : ${preview}`);
    console.log(`  Length         : ${signature.length} chars`);
    console.log(`  ✅ HMAC-SHA512 Signature generated successfully`);
  } catch (err) {
    console.log(`  ❌ HMAC Error: ${err.message}`);
  }
}

// ─── Test 6: Generate QR (opsional jika token ada) ────────────────────────────

async function testGenerateQR(accessToken, timestamp) {
  if (!accessToken) {
    console.log('\n════════════════════════════════════════');
    console.log('TEST 6: Generate QR — SKIP (tidak ada accessToken)');
    console.log('════════════════════════════════════════');
    return;
  }

  console.log('\n════════════════════════════════════════');
  console.log('TEST 6: Generate QR MPM (B2B)');
  console.log('════════════════════════════════════════');

  const endpoint = '/snap/v1/qr/qr-mpm-generate';
  const url = `${BASE_URL}${endpoint}`;
  const externalId = generateExternalId();
  const merchantId = process.env.BTN_MERCHANT_ID;

  if (!merchantId) {
    console.log('  ⚠️  BTN_MERCHANT_ID belum diisi di .env. Skip test Generate QR.');
    return;
  }

  const body = {
    partnerReferenceNo: `TEST${Date.now()}`.substring(0, 40),
    amount: { value: '10000.00', currency: 'IDR' },
    merchantId: merchantId,
    terminalId: (process.env.BTN_TERMINAL_ID || '0000000000000001').substring(0, 16).padStart(16, '0'),
    additionalInfo: { type_qris: 'D' }
  };

  const signature = generateHmacSignature('POST', endpoint, accessToken, body, timestamp);

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type':  'application/json',
    'X-TIMESTAMP':   timestamp,
    'X-SIGNATURE':   signature,
    'X-PARTNER-ID':  API_KEY,
    'X-EXTERNAL-ID': externalId,
    'CHANNEL-ID':    '02030',
    'Origin':        ORIGIN,
  };

  console.log(`  partnerReferenceNo : ${body.partnerReferenceNo}`);
  console.log(`  amount             : ${body.amount.value} ${body.amount.currency}`);
  console.log(`  merchantId         : ${body.merchantId}`);
  console.log(`  terminalId         : ${body.terminalId}`);
  console.log(`  X-EXTERNAL-ID      : ${externalId}`);
  console.log('');

  try {
    const response = await axios.post(url, body, { headers, timeout: 15000 });
    const data = response.data;
    console.log(`  HTTP Status     : ${response.status}`);
    console.log(`  responseCode    : ${data.responseCode}`);
    console.log(`  responseMessage : ${data.responseMessage}`);
    if (data.qrContent) {
      console.log(`  qrContent       : ${data.qrContent.substring(0, 60)}...`);
      console.log(`  referenceNo     : ${data.referenceNo}`);
      console.log(`  ✅ Generate QR BERHASIL!`);
    } else {
      console.log(`  Full response   :`, JSON.stringify(data, null, 2));
    }
  } catch (err) {
    const resp = err.response;
    console.log(`  ❌ HTTP Error: ${err.message}`);
    if (resp) {
      console.log(`  HTTP Status  : ${resp.status}`);
      console.log(`  Response     :`, JSON.stringify(resp.data, null, 2));
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   BTN SNAP QRIS Auth Test Script         ║');
  console.log('╚══════════════════════════════════════════╝');

  const envOk = testEnvVars();
  const timestamp = testTimestamp();
  const signature = testRsaSignature(timestamp);

  let accessToken = null;
  if (signature) {
    accessToken = await testGetAccessToken(timestamp, signature);
  } else {
    console.log('\n⚠️  Lewati Test 4 (Get Token) karena RSA signature gagal.');
  }

  testHmacSignature(accessToken, timestamp);
  await testGenerateQR(accessToken, timestamp);

  console.log('\n════════════════════════════════════════');
  console.log('HASIL AKHIR:');
  console.log(`  Env Kritikal: ${envOk        ? '✅ Semua OK'   : '❌ Ada yang kosong'}`);
  console.log(`  RSA Sign    : ${signature    ? '✅ OK'         : '❌ Gagal'}`);
  console.log(`  Access Token: ${accessToken  ? '✅ BERHASIL'   : '❌ Gagal / Skip'}`);
  if (!process.env.BTN_MERCHANT_ID) {
    console.log(`  BTN_MERCHANT_ID : ⚠️  Belum diisi — Test Generate QR tidak bisa dijalankan`);
  }
  console.log('════════════════════════════════════════\n');
}

main().catch(console.error);
