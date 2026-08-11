import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PaymentMethod } from '../models/PaymentMethod.model.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const hardcodedPaymentMethods = [
    {
        name: 'QRIS',
        icon: 'qris.png',
        color: '#2196F3', // Colors.blue
        payment_method: 'qris',
        payment_method_name: 'E-Wallet',
        bank_code: 'qris',
        methodIds: ['qris'],
        typeCode: 'QRIS',
        isDigital: true,
        isActive: true,
    },
    {
        name: 'BCA',
        icon: 'bca.png',
        color: '#1565C0', // Colors.blue[800]
        payment_method: 'bank_transfer',
        payment_method_name: 'Bank Transfer',
        isBank: true,
        bank_code: 'bca',
        methodIds: ['debit', 'banktransfer', 'qris'],
        typeCode: 'BCA',
        isDigital: false,
        isActive: true,
    },
    {
        name: 'BTN',
        icon: 'btn.png',
        color: '#0052CC', // BTN brand color
        payment_method: 'bank_transfer',
        payment_method_name: 'Bank Transfer',
        isBank: true,
        bank_code: 'btn',
        methodIds: ['debit', 'banktransfer', 'qris'],
        typeCode: 'BTN',
        isDigital: false,
        isActive: true,
    },
    {
        name: 'BJB',
        icon: 'bjb.png',
        color: '#003DA5', // BJB brand color
        payment_method: 'bank_transfer',
        payment_method_name: 'Bank Transfer',
        isBank: true,
        bank_code: 'bjb',
        methodIds: ['debit', 'banktransfer', 'qris'],
        typeCode: 'BJB',
        isDigital: false,
        isActive: true,
    },
    {
        name: 'Mandiri',
        icon: 'mandiri.png',
        color: '#FFA000', // Colors.amber[700]
        payment_method: 'bank_transfer',
        payment_method_name: 'Bank Transfer',
        isBank: true,
        bank_code: 'mandiri',
        methodIds: ['debit', 'banktransfer', 'qris'],
        typeCode: 'Mandiri',
        isDigital: false,
        isActive: true,
    },
    {
        name: 'BSI',
        icon: 'bsi.png',
        color: '#00A39D', // BSI color
        payment_method: 'bank_transfer',
        payment_method_name: 'Bank Transfer',
        isBank: true,
        bank_code: 'bsi',
        methodIds: ['debit', 'banktransfer', 'qris'],
        typeCode: 'BSI',
        isDigital: false,
        isActive: true,
    },
    {
        name: 'Bayar di kasir',
        icon: 'tunai.png',
        color: '#4CAF50', // Colors.green
        payment_method: 'cash',
        payment_method_name: 'Cash',
        bank_code: 'cash',
        isCash: true,
        methodIds: ['cash'],
        typeCode: 'Cash',
        isDigital: false,
        isActive: true,
    },
    {
        name: 'BNI',
        icon: 'bni.png',
        color: '#00665E', // BNI color assumed
        payment_method: 'bank_transfer',
        payment_method_name: 'Bank Transfer',
        isBank: true,
        bank_code: 'bni',
        methodIds: ['debit', 'qris'],
        typeCode: 'BNI',
        isDigital: false,
        isActive: true,
    },
    {
        name: 'BRI',
        icon: 'bri.png',
        color: '#00529C', // BRI color assumed
        payment_method: 'bank_transfer',
        payment_method_name: 'Bank Transfer',
        isBank: true,
        bank_code: 'bri',
        methodIds: ['debit', 'qris'],
        typeCode: 'BRI',
        isDigital: false,
        isActive: true,
    },
    {
        name: 'Gopay',
        icon: 'gopay.png',
        color: '#2196F3', // Colors.blue
        payment_method: 'gopay',
        payment_method_name: 'E-Wallet',
        bank_code: 'gopay',
        methodIds: ['ewallet'],
        typeCode: 'Gopay',
        isDigital: true,
        isActive: true,
    },
    {
        name: 'BCA (PT SCN)',
        icon: 'bca.png',
        color: '#1565C0',
        payment_method: 'cash', // Uses Cash flow (no Midtrans)
        payment_method_name: 'Bank Transfer PT',
        isBank: true,
        bank_code: 'bca_pt',
        isPtBank: true, // Flag untuk identifikasi bank milik PT
        groOnly: true,  // Hanya tampil di GRO mode
        methodIds: [],
        typeCode: 'BCA_PT',
        isDigital: false,
        isActive: true,
    },
    {
        name: 'Mandiri (PT SCN)',
        icon: 'mandiri.png',
        color: '#FFA000',
        payment_method: 'cash', // Uses Cash flow (no Midtrans)
        payment_method_name: 'Bank Transfer PT',
        isBank: true,
        bank_code: 'mandiri_pt',
        isPtBank: true, // Flag untuk identifikasi bank milik PT
        groOnly: true,  // Hanya tampil di GRO mode
        methodIds: [],
        typeCode: 'MANDIRI_PT',
        isDigital: false,
        isActive: true,
    },
    {
        name: 'BNI (PT SCN)',
        icon: 'bni.png',
        color: '#00665E',
        payment_method: 'cash', // Uses Cash flow (no Midtrans)
        payment_method_name: 'Bank Transfer PT',
        isBank: true,
        bank_code: 'bni_pt',
        isPtBank: true, // Flag untuk identifikasi bank milik PT
        groOnly: true,  // Hanya tampil di GRO mode
        methodIds: [],
        typeCode: 'BNI_PT',
        isDigital: false,
        isActive: true,
    },
    {
        name: 'BRI (PT SCN)',
        icon: 'bri.png',
        color: '#00529C',
        payment_method: 'cash', // Uses Cash flow (no Midtrans)
        payment_method_name: 'Bank Transfer PT',
        isBank: true,
        bank_code: 'bri_pt',
        isPtBank: true, // Flag untuk identifikasi bank milik PT
        groOnly: true,  // Hanya tampil di GRO mode
        methodIds: [],
        typeCode: 'BRI_PT',
        isDigital: false,
        isActive: true,
    },
    {
        name: 'BTN (PT SCN)',
        icon: 'btn.png',
        color: '#0052CC',
        payment_method: 'cash', // Uses Cash flow (no Midtrans)
        payment_method_name: 'Bank Transfer PT',
        isBank: true,
        bank_code: 'btn_pt',
        isPtBank: true, // Flag untuk identifikasi bank milik PT
        groOnly: true,  // Hanya tampil di GRO mode
        methodIds: [],
        typeCode: 'BTN_PT',
        isDigital: false,
        isActive: true,
    },
    {
        name: 'BJB (PT SCN)',
        icon: 'bjb.png',
        color: '#003DA5',
        payment_method: 'cash', // Uses Cash flow (no Midtrans)
        payment_method_name: 'Bank Transfer PT',
        isBank: true,
        bank_code: 'bjb_pt',
        isPtBank: true, // Flag untuk identifikasi bank milik PT
        groOnly: true,  // Hanya tampil di GRO mode
        methodIds: [],
        typeCode: 'BJB_PT',
        isDigital: false,
        isActive: true,
    },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO);
        console.log('Connected to MongoDB');

        // Check if already seeded
        const count = await PaymentMethod.countDocuments();
        if (count > 0) {
            console.log('Payment Methods already exist. Skipping seed.');
            process.exit(0);
        }

        await PaymentMethod.insertMany(hardcodedPaymentMethods);
        console.log('Successfully seeded Payment Methods!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
