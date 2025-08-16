import express from 'express';

const router = express.Router();

router.get('/payment-methods-and-types', (req, res) => {
    const paymentTypes = [
        //Cash, E-wallet, Debit
        {
            id: 'cash',
            name: 'Tunai',
            icon: 'cash.png',
            isActive: true,
        },
        {
            id: 'ewallet',
            name: 'E-Wallet',
            icon: 'ewallet.png',
            isActive: false,
        },
        {
            id: 'debit',
            name: 'Debit',
            icon: 'debit.png',
            isActive: true,
        },
        {
            id: 'banktransfer',
            name: 'Bank Transfer',
            icon: 'bank-transfer.png',
            isActive: false,
        }
    ]
    const paymentMethods = [
        {
            id: 'cash',
            name: 'Tunai',
            payment_method: 'Cash',
            typeId: ['cash'],
            isDigital: false,
            isActive: true
        },
        {
            id: 'qris',
            name: 'QRIS',
            payment_method: 'Qris',
            typeId: ['ewallet'],
            isDigital: true,
            isActive: true
        },
        {
            id: 'gopay',
            name: 'Gopay',
            payment_method: 'Gopay',
            typeId: ['ewallet'],
            isDigital: true,
            isActive: true
        },
        {
            id: 'bni',
            name: 'BNI',
            payment_method: 'BNI',
            typeId: ['debit', 'banktransfer'],
            isDigital: false,
            isActive: true
        },
        {
            id: 'bri',
            name: 'BRI',
            payment_method: 'BRI',
            typeId: ['debit', 'banktransfer'],
            isDigital: false,
            isActive: true
        },
        {
            id: 'bca',
            name: 'BCA',
            payment_method: 'BCA',
            typeId: ['debit', 'banktransfer'],
            isDigital: false,
            isActive: true
        },
        {
            id: 'qrisbni',
            name: 'Qris BNI',
            payment_method: 'Qris',
            typeId: ['debit', 'banktransfer'],
            isDigital: false,
            isActive: true
        },
        {
            id: 'qrisbri',
            name: 'Qris BRI',
            payment_method: 'Qris',
            typeId: ['debit', 'banktransfer'],
            isDigital: false,
            isActive: true
        },
        {
            id: 'qrisbca',
            name: 'Qris BCA',
            payment_method: 'Qris',
            typeId: ['debit', 'banktransfer'],
            isDigital: false,
            isActive: true
        },
    ];


    try {
        const buildPaymentTypes = () => {
            return paymentTypes.map((paymentType) => {
                return {
                    ...paymentType,
                    paymentMethods: paymentMethods.filter((paymentMethod) => paymentMethod.typeId.includes(paymentType.id))
                }
            })
        }

        res.status(200).json({ success: true, paymentTypes: buildPaymentTypes() });
    } catch (error) {
        console.error('Error fetching payment methods and types:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payment methods and types' });
    }
})

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

