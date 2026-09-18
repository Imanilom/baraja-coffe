import express from 'express';
import { processIncomingMessage } from '../services/chatbot.service.js';

const router = express.Router();

router.post('/webhook', async (req, res) => {
    try {
        const { sender, pushName, message } = req.body;

        if (!sender || !message) {
            return res.status(400).json({ status: 'error', message: 'Invalid JSON payload received.' });
        }

        const responsePayload = await processIncomingMessage(req.body);
        
        return res.status(200).json(responsePayload);
    } catch (error) {
        console.error('Chatbot Webhook Error:', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error processing webhook.' });
    }
});

export default router;
