import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import Product from '../models/product.model.js';
import midtransClient from 'midtrans-client';

// Configure Midtrans Snap API
const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// Function to generate a 16-digit order ID
const generateOrderId = () => {
    return Math.floor(1000000000000000 + Math.random() * 9000000000000000);
};

// Controller to create an order with Midtrans payment integration
export const createOrder = async (req, res) => {
    try {
        let totalPriceBeforeDiscount = 0;
        let totalPrice = 0;
        let discount = 0;

        // Fetch user and check for available vouchers
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "Pengguna tidak ditemukan" });

        const availableVoucher = user.vouchers.find(voucher => !voucher.isUsed);
        if (availableVoucher) {
            discount = availableVoucher.discountAmount;
        }

        // Calculate total price based on products
        const productsWithDetails = await Promise.all(
            req.body.products.map(async (item) => {
                const product = await Product.findById(item.productId);
                if (!product) {
                    throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan`);
                }

                const discountedPrice = product.price * (1 - product.discount / 100);
                const itemTotalPrice = discountedPrice * item.quantity;
                totalPriceBeforeDiscount += itemTotalPrice;

                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    customization: item.customization,
                    price: discountedPrice,
                };
            })
        );

        // Apply voucher discount
        totalPrice = totalPriceBeforeDiscount - discount;
        if (totalPrice < 0) totalPrice = 0;

        // Create new order
        const order = new Order({
            order_id: generateOrderId(),
            products: productsWithDetails,
            totalPrice,
            discount,
            customerName: req.body.customerName,
            status: req.body.status || 'pending',
        });

        await order.save();

        // Mark voucher as used if applicable
        if (availableVoucher) {
            availableVoucher.isUsed = true;
            await user.save();
        }

        // Add points to user based on total price before discount
        const pointsEarned = Math.floor(totalPriceBeforeDiscount / 100);
        user.point += pointsEarned;
        await user.save();

        // Create Midtrans payment transaction
        const midtransParams = {
            transaction_details: {
                order_id: order.order_id.toString(),
                gross_amount: totalPrice,
            },
            customer_details: {
                first_name: user.name,
                email: user.email,
            },
            credit_card: {
                secure: true,
            },
        };

        const transaction = await snap.createTransaction(midtransParams);

        // Send order and transaction URL to complete payment
        res.status(201).json({
            order,
            pointsEarned,
            redirectUrl: transaction.redirect_url, // Midtrans payment URL
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
