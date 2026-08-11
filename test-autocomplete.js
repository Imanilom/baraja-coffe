import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { triggerOnProcessAutoComplete } from './api/services/paymentExpiryMonitor.js';

dotenv.config();

const testAutoComplete = async () => {
    try {
        console.log('Connecting to database...');
        // Defaulting to local connection since we're using docker local db
        await mongoose.connect('mongodb://admin:rahasia_lokal@localhost:27017/prod?authSource=admin');
        console.log('Connected to database.');

        console.log('Triggering auto complete for expired OnProcess orders...');
        const result = await triggerOnProcessAutoComplete();
        
        console.log('Result:', result);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
        process.exit(0);
    }
};

testAutoComplete();
