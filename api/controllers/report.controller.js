// import { Report } from "../models/Report.model";
import { Order } from "../models/order.model.js";
// import { User } from '../models/user.model.js';
// import { Outlet } from '../models/Outlet.model.js';
import moment from 'moment';


//for cashier
export const salesReport = async (req, res) => {
    try {
        const order = await Order.find();

        res.status(200).json({
            success: true,
            data: order
        });
    } catch {
        res.status(500).json({ message: "Failed to fetch sales report" });
    }
}

