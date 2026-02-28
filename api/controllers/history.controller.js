import { Order } from "../models/order.model.js";

export const getHistoryAll = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate({
                path: 'cashier',
                select: '_id name' // Hanya pilih _id dan name dari cashier
            })
            .populate({
                path: 'items.menuItem', // Memastikan addons dipopulate
                select: '_id name price'

            })
            .populate({
                path: 'items.addons', // Memastikan addons dipopulate
                select: '_id name'

            })
            .populate({
                path: 'items.toppings', // Memastikan addons dipopulate
                select: '_id name'

            }).sort({ createdAt: -1 });
        res.status(200).json(
            {
                success: true, data: orders
            }
        );
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}