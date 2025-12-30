import express from 'express';

const router = express.Router();

router.get('/payment-methods-and-types', (req, res) => {
    // LEVEL ATAS: PAYMENT METHOD
    const paymentMethods = [
        {
            id: 'cash',
            name: 'Cash',
            methodCode: 'Cash',
            icon: 'cash.png',
            isActive: true,
        },
        {
            id: 'ewallet',
            name: 'E-Wallet',
            methodCode: 'E-Wallet',
            icon: 'ewallet.png',
            isActive: false,
        },
        {
            id: 'debit',
            name: 'Debit',
            methodCode: 'Debit',
            icon: 'debit.png',
            isActive: true,
        },
        {
            id: 'banktransfer',
            name: 'Bank Transfer',
            methodCode: 'Bank Transfer',
            icon: 'bank-transfer.png',
            isActive: true,
        },
        {
            id: 'qris',
            name: 'QRIS',
            methodCode: 'QRIS',
            icon: 'qris.png',
            isActive: true,
        },
    ];

    // LEVEL BAWAH: PAYMENT TYPE (CHANNEL / BANK / BRAND)
    const paymentTypes = [
        {
            id: 'cash',
            name: 'Tunai',
            typeCode: 'Cash',
            methodIds: ['cash'],       // HANYA muncul di method cash
            isDigital: false,
            isActive: true,
        },
        {
            id: 'gopay',
            name: 'Gopay',
            typeCode: 'Gopay',
            methodIds: ['ewallet'],    // hanya di E-Wallet
            isDigital: true,
            isActive: true,
        },
        {
            id: 'bni',
            name: 'BNI',
            typeCode: 'BNI',
            methodIds: ['debit', 'banktransfer', 'qris'],
            isDigital: false,
            isActive: true,
        },
        {
            id: 'bri',
            name: 'BRI',
            typeCode: 'BRI',
            methodIds: ['debit', 'banktransfer', 'qris'],
            isDigital: false,
            isActive: true,
        },
        {
            id: 'bca',
            name: 'BCA',
            typeCode: 'BCA',
            methodIds: ['debit', 'banktransfer', 'qris'],
            isDigital: false,
            isActive: true,
        },
        {
            id: 'mandiri',
            name: 'Mandiri',
            typeCode: 'Mandiri',
            methodIds: ['debit', 'banktransfer', 'qris'],
            isDigital: false,
            isActive: true,
        },
        {
            id: 'bsi',
            name: 'BSI',
            typeCode: 'BSI',
            methodIds: ['debit', 'banktransfer', 'qris'],
            isDigital: false,
            isActive: true,
        },
    ];

    try {
        // Gabungkan: tiap METHOD punya LIST TYPE yang cocok lewat methodIds
        const buildPaymentMethods = () => {
            return paymentMethods.map((method) => {
                return {
                    ...method,
                    paymentTypes: paymentTypes.filter((pt) => pt.methodIds.includes(method.id)),
                };
            });
        };

        res.status(200).json({
            success: true,
            paymentMethods: buildPaymentMethods(),
        });
    } catch (error) {
        console.error('Error fetching payment methods and types:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment methods and types',
        });
    }
});

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
        // {
        //     name: 'Gopay',
        //     icon: 'gopay.png',
        //     color: '#2196F3', // Colors.blue
        //     payment_method: 'gopay',
        //     payment_method_name: 'E-Wallet',
        //     bank_code: 'gopay',
        // },
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
            name: 'Bayar di kasir',
            icon: 'tunai.png',
            color: '#4CAF50', // Colors.green
            payment_method: 'cash',
            payment_method_name: 'Cash',
            bank_code: 'cash',
            isCash: true,
        },
        // ✅ PT Sari Coffee Nusantara Bank Transfers (instant settlement like Cash)
        // These are only shown in GRO checkout when "DP Sudah Dibayar" is checked
        {
            name: 'BCA (PT SCN)',
            icon: 'bca.png',
            color: '#1565C0',
            payment_method: 'cash', // ✅ Uses Cash flow (no Midtrans)
            payment_method_name: 'Bank Transfer PT',
            isBank: true,
            bank_code: 'bca_pt',
            isPtBank: true, // ✅ Flag untuk identifikasi bank milik PT
            groOnly: true,  // ✅ Hanya tampil di GRO mode
        },
        {
            name: 'Mandiri (PT SCN)',
            icon: 'mandiri.png',
            color: '#FFA000',
            payment_method: 'cash', // ✅ Uses Cash flow (no Midtrans)
            payment_method_name: 'Bank Transfer PT',
            isBank: true,
            bank_code: 'mandiri_pt',
            isPtBank: true, // ✅ Flag untuk identifikasi bank milik PT
            groOnly: true,  // ✅ Hanya tampil di GRO mode
        },
    ];

    res.json(paymentMethods);
});

export default router;
