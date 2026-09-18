import mongoose from 'mongoose';
import dotenv from 'dotenv';
import './api/models/Category.model.js';
import { processIncomingMessage } from './api/services/chatbot.service.js';

dotenv.config();

const cloudDbUri = 'mongodb+srv://barajacoffee:MwkbCFpvkDtopVR3@baraja.zbyaf.mongodb.net/prod?retryWrites=true&w=majority&appName=Baraja';
process.env.MONGO_URI = cloudDbUri;
process.env.MONGO_PROD = cloudDbUri;
process.env.MONGO = cloudDbUri;

const testAI = async () => {
    try {
        console.log('Connecting to database...');
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(cloudDbUri);
            console.log('Connected to database.');
        }

        console.log('\n=======================================');
        console.log('🧪 TEST 1: Pesan Biasa (Menyapa Bot)');
        console.log('=======================================');
        const payload1 = {
            sender: '6281234567890@s.whatsapp.net',
            pushName: 'Budi Penguji',
            message: 'halo baridin, menu best seller minuman apa ya?'
        };
        console.log(`[USER]: ${payload1.message}`);
        
        const response1 = await processIncomingMessage(payload1);
        console.log(`[BOT REPLY]:\n${response1.reply}`);

        console.log('\n=======================================');
        console.log('🧪 TEST 2: Memesan Sesuatu');
        console.log('=======================================');
        const payload2 = {
            sender: '6281234567890@s.whatsapp.net',
            pushName: 'Budi Penguji',
            message: 'aku mau pesan HellBraun 2 gelas, minum di sini, meja 5'
        };
        console.log(`[USER]: ${payload2.message}`);
        
        const response2 = await processIncomingMessage(payload2);
        console.log(`[BOT REPLY]:\n${response2.reply}`);

        console.log('\n=======================================');
        console.log('🧪 TEST 3: Konfirmasi Proses Pesanan (Micu QRIS)');
        console.log('=======================================');
        const payload3 = {
            sender: '6281234567890@s.whatsapp.net',
            pushName: 'Budi Penguji',
            message: 'oke sip, proses pesanan'
        };
        console.log(`[USER]: ${payload3.message}`);
        
        const response3 = await processIncomingMessage(payload3);
        console.log(`[BOT REPLY]:\n${response3.reply}`);
        
        if (response3.image_url) {
            console.log(`\n[BOT IMAGE ATTACHMENT]: ${response3.image_url}`);
        }

    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

testAI();
