import express from 'express';

const router = express.Router();

router.get('/payment-methods', (req, res) => {
    const paymentMethods = [
        {
            name: 'QRIS',
            icon: 'qris.png',
            color: '#2196F3', // Colors.blue
            payment_method: 'qris',
            payment_method_name: 'E-Wallet',
            bank_code: 'qris',
        },
        {
            name: 'Gopay',
            icon: 'gopay.png',
            color: '#2196F3', // Colors.blue
            payment_method: 'gopay',
            payment_method_name: 'E-Wallet',
            bank_code: 'gopay',
        },
        {
            name: 'DANA',
            icon: 'dana.png',
            color: '#64B5F6', // Colors.blue[300]
            payment_method: 'dana',
            payment_method_name: 'E-Wallet',
            bank_code: 'dana',
        },
        {
            name: 'BCA',
            icon: 'bca.png',
            color: '#1565C0', // Colors.blue[800]
            payment_method: 'bank_transfer',
            payment_method_name: 'Bank Transfer',
            isBank: true,
            bank_code: 'bca',
        },
        {
            name: 'Mandiri',
            icon: 'mandiri.png',
            color: '#FFA000', // Colors.amber[700]
            payment_method: 'bank_transfer',
            payment_method_name: 'Bank Transfer',
            isBank: true,
            bank_code: 'mandiri',
        },
        {
            name: 'Tunai',
            icon: 'tunai.png',
            color: '#4CAF50', // Colors.green
            payment_method: 'cash',
            payment_method_name: 'Cash',
            bank_code: 'cash',
            isCash: true,
        },
    ];

    res.json(paymentMethods);
});

export default router;

