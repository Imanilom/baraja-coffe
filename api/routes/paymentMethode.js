import express from 'express';

const router = express.Router();

router.get('/payment-methods', (req, res) => {
    const paymentMethods = [
        {
            name: 'Gopay',
            icon: 'account_balance_wallet',
            color: '#2196F3', // Colors.blue
            payment_method: 'gopay',
            payment_method_name: 'E-Wallet',
        },
        {
            name: 'OVO',
            icon: 'payments',
            color: '#9C27B0', // Colors.purple
            payment_method: 'ovo',
            payment_method_name: 'E-Wallet',
        },
        {
            name: 'DANA',
            icon: 'payment',
            color: '#64B5F6', // Colors.blue[300]
            payment_method: 'dana',
            payment_method_name: 'E-Wallet',
        },
        {
            name: 'ShopeePay',
            icon: 'shopping_bag',
            color: '#FF9800', // Colors.orange
            payment_method: 'shopeepay',
            payment_method_name: 'E-Wallet',
        },
        {
            name: 'BCA',
            icon: 'account_balance',
            color: '#1565C0', // Colors.blue[800]
            payment_method: 'bank_transfer',
            payment_method_name: 'Bank Transfer',
            isBank: true,
            bank_code: 'bca',
        },
        {
            name: 'Mandiri',
            icon: 'account_balance',
            color: '#FFA000', // Colors.amber[700]
            payment_method: 'bank_transfer',
            payment_method_name: 'Bank Transfer',
            isBank: true,
            bank_code: 'mandiri',
        },
        {
            name: 'Tunai',
            icon: 'money',
            color: '#4CAF50', // Colors.green
            payment_method: 'cash',
            payment_method_name: 'Cash',
            isCash: true,
        },
    ];

    res.json(paymentMethods);
});

export default router;

