import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PaymentMethod } from '../models/PaymentMethod.model.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Gunakan MONGO_PROD karena target adalah production
const MONGO_URI = process.env.MONGO_PROD;

const paymentMethodsData = [
  // ============ CASH ============
  {
    name: 'Tunai',
    icon: 'tunai.png',
    color: '#4CAF50',
    payment_method: 'cash',
    payment_method_name: 'Cash',
    bank_code: 'cash',
    isCash: true,
    isBank: false,
    isPtBank: false,
    groOnly: false,
    methodIds: ['cash'],
    typeCode: 'Cash',
    isDigital: false,
    isActive: true,
  },

  // ============ QRIS (standalone) ============
  {
    name: 'QRIS',
    icon: 'qris.png',
    color: '#2196F3',
    payment_method: 'qris',
    payment_method_name: 'E-Wallet',
    bank_code: 'qris',
    isCash: false,
    isBank: false,
    isPtBank: false,
    groOnly: false,
    methodIds: ['qris'],
    typeCode: 'QRIS',
    isDigital: true,
    isActive: true,
  },

  // ============ BCA ============
  {
    name: 'BCA',
    icon: 'bca.png',
    color: '#1565C0',
    payment_method: 'bank_transfer',
    payment_method_name: 'Bank Transfer',
    bank_code: 'bca',
    isCash: false,
    isBank: true,
    isPtBank: false,
    groOnly: false,
    methodIds: ['debit', 'banktransfer', 'qris'],
    typeCode: 'BCA',
    isDigital: false,
    isActive: true,
  },

  // ============ BTN ============
  {
    name: 'BTN',
    icon: 'btn.png',
    color: '#0052CC',
    payment_method: 'bank_transfer',
    payment_method_name: 'Bank Transfer',
    bank_code: 'btn',
    isCash: false,
    isBank: true,
    isPtBank: false,
    groOnly: false,
    methodIds: ['debit', 'banktransfer', 'qris'],
    typeCode: 'BTN',
    isDigital: false,
    isActive: true,
  },

  // ============ BJB ============
  {
    name: 'BJB',
    icon: 'bjb.png',
    color: '#003DA5',
    payment_method: 'bank_transfer',
    payment_method_name: 'Bank Transfer',
    bank_code: 'bjb',
    isCash: false,
    isBank: true,
    isPtBank: false,
    groOnly: false,
    methodIds: ['debit', 'banktransfer', 'qris'],
    typeCode: 'BJB',
    isDigital: false,
    isActive: true,
  },

  // ============ BRI ============
  {
    name: 'BRI',
    icon: 'bri.png',
    color: '#00529C',
    payment_method: 'bank_transfer',
    payment_method_name: 'Bank Transfer',
    bank_code: 'bri',
    isCash: false,
    isBank: true,
    isPtBank: false,
    groOnly: false,
    methodIds: ['debit', 'banktransfer', 'qris'],
    typeCode: 'BRI',
    isDigital: false,
    isActive: true,
  },

  // ============ BNI ============
  {
    name: 'BNI',
    icon: 'bni.png',
    color: '#00665E',
    payment_method: 'bank_transfer',
    payment_method_name: 'Bank Transfer',
    bank_code: 'bni',
    isCash: false,
    isBank: true,
    isPtBank: false,
    groOnly: false,
    methodIds: ['debit', 'banktransfer', 'qris'],
    typeCode: 'BNI',
    isDigital: false,
    isActive: true,
  },

  // ============ Mandiri ============
  {
    name: 'Mandiri',
    icon: 'mandiri.png',
    color: '#FFA000',
    payment_method: 'bank_transfer',
    payment_method_name: 'Bank Transfer',
    bank_code: 'mandiri',
    isCash: false,
    isBank: true,
    isPtBank: false,
    groOnly: false,
    methodIds: ['debit', 'banktransfer', 'qris'],
    typeCode: 'Mandiri',
    isDigital: false,
    isActive: true,
  },

  // ============ BSI ============
  {
    name: 'BSI',
    icon: 'bsi.png',
    color: '#00A39D',
    payment_method: 'bank_transfer',
    payment_method_name: 'Bank Transfer',
    bank_code: 'bsi',
    isCash: false,
    isBank: true,
    isPtBank: false,
    groOnly: false,
    methodIds: ['debit', 'banktransfer', 'qris'],
    typeCode: 'BSI',
    isDigital: false,
    isActive: true,
  },

  // ============ Gopay ============
  {
    name: 'Gopay',
    icon: 'gopay.png',
    color: '#2196F3',
    payment_method: 'gopay',
    payment_method_name: 'E-Wallet',
    bank_code: 'gopay',
    isCash: false,
    isBank: false,
    isPtBank: false,
    groOnly: false,
    methodIds: ['ewallet'],
    typeCode: 'Gopay',
    isDigital: true,
    isActive: true,
  },

  // ============ PT Banks (GRO Only) ============
  {
    name: 'BCA (PT SCN)',
    icon: 'bca.png',
    color: '#1565C0',
    payment_method: 'cash',
    payment_method_name: 'Bank Transfer PT',
    bank_code: 'bca_pt',
    isCash: false,
    isBank: true,
    isPtBank: true,
    groOnly: true,
    methodIds: [],
    typeCode: 'BCA_PT',
    isDigital: false,
    isActive: true,
  },
  {
    name: 'Mandiri (PT SCN)',
    icon: 'mandiri.png',
    color: '#FFA000',
    payment_method: 'cash',
    payment_method_name: 'Bank Transfer PT',
    bank_code: 'mandiri_pt',
    isCash: false,
    isBank: true,
    isPtBank: true,
    groOnly: true,
    methodIds: [],
    typeCode: 'MANDIRI_PT',
    isDigital: false,
    isActive: true,
  },
  {
    name: 'BNI (PT SCN)',
    icon: 'bni.png',
    color: '#00665E',
    payment_method: 'cash',
    payment_method_name: 'Bank Transfer PT',
    bank_code: 'bni_pt',
    isCash: false,
    isBank: true,
    isPtBank: true,
    groOnly: true,
    methodIds: [],
    typeCode: 'BNI_PT',
    isDigital: false,
    isActive: true,
  },
  {
    name: 'BRI (PT SCN)',
    icon: 'bri.png',
    color: '#00529C',
    payment_method: 'cash',
    payment_method_name: 'Bank Transfer PT',
    bank_code: 'bri_pt',
    isCash: false,
    isBank: true,
    isPtBank: true,
    groOnly: true,
    methodIds: [],
    typeCode: 'BRI_PT',
    isDigital: false,
    isActive: true,
  },
  {
    name: 'BTN (PT SCN)',
    icon: 'btn.png',
    color: '#0052CC',
    payment_method: 'cash',
    payment_method_name: 'Bank Transfer PT',
    bank_code: 'btn_pt',
    isCash: false,
    isBank: true,
    isPtBank: true,
    groOnly: true,
    methodIds: [],
    typeCode: 'BTN_PT',
    isDigital: false,
    isActive: true,
  },
  {
    name: 'BJB (PT SCN)',
    icon: 'bjb.png',
    color: '#003DA5',
    payment_method: 'cash',
    payment_method_name: 'Bank Transfer PT',
    bank_code: 'bjb_pt',
    isCash: false,
    isBank: true,
    isPtBank: true,
    groOnly: true,
    methodIds: [],
    typeCode: 'BJB_PT',
    isDigital: false,
    isActive: true,
  },
];

async function seed() {
  if (!MONGO_URI) {
    console.error('❌ MONGO_PROD tidak ditemukan di .env!');
    process.exit(1);
  }

  try {
    console.log('🔌 Menghubungkan ke MongoDB PRODUCTION...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Terhubung ke MongoDB PRODUCTION');

    // Cek data existing
    const existing = await PaymentMethod.countDocuments();
    if (existing > 0) {
      console.log(`⚠️  Sudah ada ${existing} payment method di database.`);
      console.log('🗑️  Menghapus data lama...');
      await PaymentMethod.deleteMany({});
      console.log('✅ Data lama berhasil dihapus.');
    }

    // Insert data baru
    const result = await PaymentMethod.insertMany(paymentMethodsData);
    console.log(`\n✅ Berhasil import ${result.length} payment methods:`);
    result.forEach((pm, i) => {
      const groups = pm.methodIds.length > 0 ? pm.methodIds.join(', ') : '(PT/GRO only)';
      console.log(`   ${i + 1}. ${pm.name} (${pm.bank_code}) → groups: [${groups}]`);
    });

    console.log('\n📊 Summary grup yang tersedia di POS:');
    const allGroups = new Set(result.flatMap(pm => pm.methodIds));
    allGroups.forEach(g => {
      const members = result.filter(pm => pm.methodIds.includes(g)).map(pm => pm.name);
      console.log(`   - ${g}: ${members.join(', ')}`);
    });

    console.log('\n🎉 Seeding selesai!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding gagal:', error);
    process.exit(1);
  }
}

seed();
