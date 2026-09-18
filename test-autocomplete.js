import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Override environment variable so index.js connects to the right DB
const cloudDbUri = 'mongodb+srv://barajacoffee:MwkbCFpvkDtopVR3@baraja.zbyaf.mongodb.net/prod?retryWrites=true&w=majority&appName=Baraja';
process.env.MONGO_URI = cloudDbUri;
process.env.MONGO_PROD = cloudDbUri;
process.env.MONGO = cloudDbUri;

const testAutoComplete = async () => {
    try {
        // Dynamic import so it happens AFTER env vars are set
        const { triggerOnProcessAutoComplete, triggerWorkstationAutoComplete } = await import('./api/services/paymentExpiryMonitor.js');

        console.log('Connecting to database...');
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(cloudDbUri);
            console.log('Connected to database.');
        } else if (mongoose.connection.readyState === 2) {
            console.log('Waiting for existing connection to establish...');
            while (mongoose.connection.readyState === 2) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            console.log('Database connection established.');
        } else {
            console.log('Already connected to database.');
        }

        console.log('Triggering auto complete for expired OnProcess orders...');
        const result = await triggerOnProcessAutoComplete();
        console.log('Result:', result);

        console.log('Triggering auto complete for Workstation orders...');
        const wsResult = await triggerWorkstationAutoComplete();
        console.log('Workstation Result:', wsResult);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
        process.exit(0);
    }
};

testAutoComplete();
