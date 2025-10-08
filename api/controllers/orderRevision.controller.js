// controllers/orderRevision.controller.js
import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';
import { OrderRevision } from '../models/OrderRevision.model.js';
import { PaymentAdjustment } from '../models/PaymentAdjustment.model.js';
import Payment from '../models/Payment.model.js';
import { calcItemSubtotal, recalcTotals } from '../helpers/billing.helper.js';
import { MenuItem } from '../models/MenuItem.model.js';

//// TODO: ganti dengan fungsi hitung subtotal kamu (base+addons+toppings+tax+service)
//// const calcItemSubtotal = (item) => item.subtotal;

// util: apakah order sudah punya pembayaran settlement?
async function hasAnySettlement(orderId) {
    // cari payment apa saja yang order_idnya sama dengan orderId dengan status settlement
    const any = await Payment.find({ order_id: orderId, status: { $in: ['settlement', 'paid'] } }).lean();
    console.log("any", any);
    return !!any;
}

export const createRevision = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { reasonCode, reasonNote, approvedBy, createdBy, ops } = req.body;
        //orderId to object

        const order = await Order.findById(req.params.orderId).session(session);
        console.log("🔍 Validating order:", order.items);
        if (!order) throw new Error('ORDER_NOT_FOUND');

        const clientVersion = order.__v; // optimistic lock

        // 1) Validasi dapur per-item (contoh sederhana)
        for (const op of ops) {
            if (['remove', 'update_qty', 'substitute'].includes(op.type) && op.orderItemId) {
                console.log("🔍 Validating item:", op.orderItemId);
                //get data menuitem pada order yang menuitemIdnya sama dengan op.orderItemId
                const it = order.items.find(x => x.menuItem.toString() === op.orderItemId);
                console.log("it", it);
                if (it == null) throw new Error('ITEM_NOT_FOUND');
                // Jika sudah cooking/ready/served => larang remove/update_qty (harus substitute/refund)
                if (['cooking', 'ready', 'served'].includes(it.kitchenStatus)) {
                    if (op.type === 'remove' || op.type === 'update_qty') {
                        throw new Error('ITEM_ALREADY_COMMITTED');
                    }
                }
            }
        }

        // 2) Build snapshot baru + hitung delta
        let deltaAmount = 0;
        const newItems = order.items.map(i => i.toObject());

        for (const op of ops) {
            if (op.type === 'update_qty') {
                const it = newItems.find(x => x.menuItem.toString() === op.orderItemId);
                if (!it) throw new Error('ITEM_NOT_FOUND_YA');
                const unitPrice = it.subtotal / it.quantity; // kasar: silakan ganti ke perhitunganmu
                const priceDelta = (op.toQty - op.fromQty) * unitPrice;
                it.quantity = op.toQty;
                it.subtotal += priceDelta;
                deltaAmount += priceDelta;
                op.priceDelta = priceDelta;
            }

            if (op.type === 'remove') {
                const idx = newItems.findIndex(x => x.menuItem.toString() === op.orderItemId);
                if (idx < 0) throw new Error('ITEM_NOT_FOUND');
                const oldSub = newItems[idx].subtotal;
                deltaAmount -= oldSub;
                op.priceDelta = -oldSub;
                newItems.splice(idx, 1);
            }

            if (op.type === 'add') {
                const menu = await MenuItem.findById(op.menuItem).lean();
                if (!menu) throw new Error('MENU_NOT_FOUND');
                const subtotal = calcItemSubtotal({
                    basePrice: menu.price,
                    quantity: op.toQty,
                    toppings: op.toppings || [],
                    addons: op.addons || [],
                });
                const batchNumber = (order.currentBatch || 1) + 1;
                newItems.push({
                    menuItem: menu._id,
                    quantity: op.toQty,
                    subtotal,
                    addons: op.addons || [],
                    toppings: op.toppings || [],
                    notes: op.note || '',
                    batchNumber,
                    kitchenStatus: 'pending',
                    isPrinted: false,
                    outletId: order.outlet,
                    outletName: order.outletName,
                });
                op.priceDelta = subtotal;
                op.batchNumber = batchNumber;
                deltaAmount += subtotal;
            }

            if (op.type === 'substitute') {
                const idx = newItems.findIndex(x => x.menuItem.toString() === op.orderItemId);
                if (idx < 0) throw new Error('ITEM_NOT_FOUND');
                const old = newItems[idx];
                const menu = await MenuItem.findById(op.menuItem).lean();
                if (!menu) throw new Error('MENU_NOT_FOUND');
                const newSubtotal = calcItemSubtotal({
                    basePrice: menu.price,
                    quantity: old.quantity, // qty sama, hanya ganti item
                    toppings: op.toppings ?? old.toppings ?? [],
                    addons: op.addons ?? old.addons ?? [],
                });
                const priceDelta = newSubtotal - old.subtotal;
                newItems[idx] = { ...old, menuItem: menu._id, subtotal: newSubtotal, notes: op.note || old.notes };
                op.priceDelta = priceDelta;
                deltaAmount += priceDelta;
            }
        }

        // 3) Hitung ulang total order
        const totals = recalcTotals(newItems, { taxAndServiceDetails: order.taxAndServiceDetails || [] });

        // 4) Buat OrderRevision
        const revision = await OrderRevision.create([{
            order: order._id,
            versionFrom: clientVersion,
            versionTo: clientVersion + 1,
            reasonCode, reasonNote, createdBy, approvedBy,
            deltaAmount,
            ops,
        }], { session }).then(d => d[0]);

        // 5) Update Order snapshot (optimistic lock pakai __v)
        const updated = await Order.findOneAndUpdate(
            { _id: order._id, __v: clientVersion },
            {
                $set: {
                    items: newItems,
                    totalBeforeDiscount: totals.totalBeforeDiscount,
                    totalAfterDiscount: totals.totalAfterDiscount,
                    totalTax: totals.totalTax,
                    totalServiceFee: totals.totalServiceFee,
                    grandTotal: totals.grandTotal,
                    lastRevisionId: revision._id,
                    lastRevisionAt: new Date(),
                },
                $inc: { __v: 1 }
            },
            { new: true, session }
        );
        if (!updated) throw new Error('ORDER_VERSION_MISMATCH');

        // 6) Jika sudah ada pembayaran settlement sebelumnya dan delta != 0:
        let adjustment = null;
        let mirrorPayment = null;
        const alreadyPaid = await hasAnySettlement(order.order_id);

        if (alreadyPaid && deltaAmount !== 0) {
            const direction = deltaAmount > 0 ? 'charge' : 'refund';
            adjustment = await PaymentAdjustment.create([{
                order: order._id,
                revision: revision._id,
                direction,
                amount: Math.abs(deltaAmount),
                status: 'pending',
            }], { session }).then(d => d[0]);

            // Mirror ke Payment detail agar kasir bisa proses seperti biasa
            mirrorPayment = await Payment.create([{
                order_id: order.order_id,
                method: 'Cash',                   // atau tentukan dari UI
                status: 'pending',
                paymentType: 'Final Payment',     // atau 'Full' jika belum pernah DP
                amount: Math.abs(deltaAmount),
                totalAmount: updated.grandTotal,
                remainingAmount: 0,               // kamu bisa hitung sesuai logika
                relatedPaymentId: null,
                isAdjustment: true,
                direction,
                revisionId: revision._id,
                adjustmentId: adjustment._id,
            }], { session }).then(d => d[0]);
        }

        await session.commitTransaction();

        // TODO: emit socket untuk kitchen (change_slip) & kasir (order:changed)
        return res.json({ order: updated, revision, adjustment: mirrorPayment || adjustment || null });

    } catch (e) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: e.message });
    } finally {
        session.endSession();
    }
};

export const captureAdjustment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const { method, result, transactionId, raw_response } = req.body;

        const adj = await PaymentAdjustment.findById(id).session(session);
        if (!adj) throw new Error('ADJUSTMENT_NOT_FOUND');

        adj.method = method ?? adj.method;
        adj.status = result === 'settlement' ? 'settlement' : 'failed';
        adj.transactionId = transactionId;
        adj.raw_response = raw_response ?? adj.raw_response;
        await adj.save({ session });

        // Update mirror Payment
        const payment = await Payment.findOne({ revisionId: adj.revision, isAdjustment: true }).session(session);
        if (payment) {
            payment.method = adj.method;
            payment.status = adj.status === 'settlement' ? 'settlement' : 'pending';
            payment.transaction_id = adj.transactionId;
            payment.raw_response = adj.raw_response;
            await payment.save({ session });
        }

        await session.commitTransaction();
        return res.json({ adjustment: adj, payment });
    } catch (e) {
        await session.abortTransaction();
        return res.status(400).json({ message: e.message });
    } finally {
        session.endSession();
    }
};

export const paymentSettle = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const payment = await Payment.findById(req.params.paymentId).session(session);
        if (!payment) throw new Error('PAYMENT_NOT_FOUND');

        payment.status = 'settlement';
        payment.paidAt = new Date();
        await payment.save({ session });

        if (payment.isAdjustment && payment.adjustmentId) {
            const adj = await PaymentAdjustment.findById(payment.adjustmentId).session(session);
            if (adj) {
                adj.status = 'settlement';
                await adj.save({ session });
            }
        }

        await session.commitTransaction();
        return res.json({ success: true, paymentId: payment._id });
    } catch (e) {
        await session.abortTransaction();
        return res.status(400).json({ message: e.message });
    } finally {
        session.endSession();
    }
};
