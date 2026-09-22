import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import btnQrisService from './services/btnQris.service.js';
import mongoose from 'mongoose';

async function testBTN() {
  console.log("Testing BTN QRIS Generation...");
  try {
    const referenceNo = "TEST" + Date.now();
    const amount = 10000;
    
    console.log(`Generating QR for Reference: ${referenceNo}, Amount: ${amount}`);
    
    const result = await btnQrisService.generateQR(referenceNo, amount);
    
    console.log("\n✅ [SUCCESS] BTN QRIS Generated Successfully!");
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error("\n❌ [ERROR] BTN QRIS Generation Failed!");
    if (error.response) {
      console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  } finally {
    process.exit(0);
  }
}

testBTN();
