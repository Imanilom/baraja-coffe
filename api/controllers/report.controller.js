// import { Report } from "../models/Report.model";
import { Order } from "../models/order.model.js";

export const salesReport = async (req, res) => {
    try {
        const order = await Order.find();
        res.status(200).json(order)
    } catch {
        res.status(500).json({ message: "Failed to fetch sales report" });
    }
}