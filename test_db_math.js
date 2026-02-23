import mongoose from 'mongoose';
import { createOrderHandler } from './api/workers/handlers/createOrderHandler.js';
import Outlet from './api/models/outlet.model.js';
import MenuItem from './api/models/menuItem.model.js';
import Category from './api/models/category.model.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/baraja-coffe');
  console.log("Connected to DB");

  // Find a real outlet and menu item
  const outlet = await Outlet.findOne();
  const menuItem = await MenuItem.findOne({ price: { $gt: 0 } });

  if(!outlet || !menuItem) {
      console.log("Need outlet and menu item");
      process.exit(1);
  }

  const mockOrderData = {
    order_id: "TEST-MATH-001",
    user: "Test",
    cashierId: null,
    items: [
      {
        id: menuItem._id.toString(),
        quantity: 1,
        selectedAddons: [],
        selectedToppings: [],
        customDiscount: { isActive: false, discountAmount: 0 }
      }
    ],
    customAmountItems: [],
    paymentMethod: "Cash",
    outletId: outlet._id.toString(),
    outlet: outlet._id.toString(),
    discounts: { customDiscount: 0 },
    customDiscountDetails: {
      isActive: true,
      discountType: "percentage",
      discountValue: 10,
      discountAmount: Math.round(menuItem.price * 0.1)
    },
    totalPrice: menuItem.price * 0.9,
    source: "Cashier",
    isOpenBill: false,
    isSplitPayment: false
  };

  try {
    const result = await createOrderHandler({
      orderId: "TEST-MATH-001",
      orderData: mockOrderData,
      source: "Cashier",
      isOpenBill: false,
      paymentDetails: { amount: menuItem.price * 0.9, method: "Cash" },
      appliedPromos: []
    });
    console.log("Resulting Grand Total:", result.grandTotal);
  } catch(e) {
    console.log("Error:", e.message);
  }
  
  process.exit();
}
run();
