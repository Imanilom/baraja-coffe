import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';
import Payment from '../models/Payment.model.js';
import OrderRevision from '../models/OrderRevision.model.js';
import PaymentAdjustment from '../models/PaymentAdjustment.model.js';
import { MenuItem } from '../models/MenuItem.model.js';

// --- Guard dapur: item yang boleh dikurangi/ubah
const LOCKED_STATES = new Set(['printed', 'cooking', 'ready', 'served']);

// function normalizeAddons(item, menuItem, addons = []) {
//     // di OrderItem: {name, price}
//     console.log('itemasdasd', item);
//     for (const addon of item.selectedAddons) {
//         console.log('addon', menuItem.addons);
//         const addonInfo = menuItem.addons.find(a => a._id.toString() === addon.id);
//         if (!addonInfo) {
//             console.warn(`Addon ${addon.id} not found in menu item ${menuItem._id}`);
//             continue;
//         }

//         if (addon.options?.length > 0) {
//             for (const option of addon.options) {
//                 const optionInfo = addonInfo.options.find(o => o._id.toString() === option.id);
//                 if (!optionInfo) {
//                     console.warn(`Addon option ${option.id} not found in addon ${addonInfo.name}`);
//                     continue;
//                 }

//                 addons.push({
//                     _id: addon.id,
//                     name: `${addonInfo.name}`,
//                     options: [
//                         {
//                             _id: option.id,
//                             label: optionInfo.label,
//                             price: optionInfo.price || 0
//                         }
//                     ]
//                 });
//             }
//         }
//     }
//     return addons;
// }
// function normalizeToppings(item, menuItem, toppings = []) {
//     for (const topping of item.selectedToppings) {
//         const toppingInfo = menuItem.toppings.find(t => t._id.toString() === topping.id);
//         if (!toppingInfo) {
//             console.warn(`Topping ${topping.id} not found in menu item ${menuItem._id}`);
//             continue;
//         }

//         toppings.push({
//             _id: topping.id,
//             name: toppingInfo.name,
//             price: toppingInfo.price || 0
//         });
//     }
//     return toppings;
// }

// Hitung subtotal per item berdasarkan MenuItem.price + addons/toppings

// Gunakan ini menggantikan normalizeAddons/normalizeToppings kamu:
function resolveAddonsFromIds(selectedAddons = [], menuItemDoc) {
    const out = [];
    for (const sel of selectedAddons || []) {
        const addon = (menuItemDoc.addons || []).find(a => String(a._id) === String(sel.id));
        if (!addon) continue; // boleh throw kalau mau strict
        const optIds = (sel.options || []).map(o => String(o.id));
        if (optIds.length === 0) {
            const def = (addon.options || []).find(o => o.isDefault);
            if (def) out.push({ name: `${addon.name}: ${def.label}`, price: Number(def.price || 0) });
        } else {
            for (const optId of optIds) {
                const opt = (addon.options || []).find(o => String(o._id) === optId);
                if (opt) out.push({ name: `${addon.name}: ${opt.label}`, price: Number(opt.price || 0) });
            }
        }
    }
    return out;
}

function resolveToppingsFromIds(selectedToppings = [], menuItemDoc) {
    const out = [];
    for (const sel of selectedToppings || []) {
        const top = (menuItemDoc.toppings || []).find(t => String(t._id) === String(sel.id));
        if (top) out.push({ name: top.name, price: Number(top.price || 0) });
    }
    return out;
}


async function computeItemSubtotal(item) {
    const menu = await MenuItem.findById(item.menuItem).select('price addons toppings').lean();
    const base = Number(menu?.price || 0);

    // Jika sudah ada addons/toppings resolved, pakai itu.
    let addonsArr = Array.isArray(item.addons) ? item.addons : [];
    let toppingsArr = Array.isArray(item.toppings) ? item.toppings : [];

    // Kalau belum ada (misal item baru masuk via selected*), resolve di sini
    if (addonsArr.length === 0 && Array.isArray(item.selectedAddons) && item.selectedAddons.length > 0) {
        addonsArr = resolveAddonsFromIds(item.selectedAddons, menu);
    }
    if (toppingsArr.length === 0 && Array.isArray(item.selectedToppings) && item.selectedToppings.length > 0) {
        toppingsArr = resolveToppingsFromIds(item.selectedToppings, menu);
    }

    const addonsSum = addonsArr.reduce((s, a) => s + Number(a?.price || 0), 0);
    const toppingsSum = toppingsArr.reduce((s, t) => s + Number(t?.price || 0), 0);

    const each = base + addonsSum + toppingsSum;
    const qty = Math.max(1, Number(item.quantity || 1));
    return Math.round(each * qty);
}


// Ambil rasio pajak & service dari order existing (agar konsisten)
function deriveRatesFromOrder(order) {
    const baseBefore = Number(order.totalBeforeDiscount || 0);
    const tax = Number(order.totalTax || 0);
    const service = Number(order.totalServiceFee || 0);

    const taxRate = baseBefore > 0 ? tax / baseBefore : 0;
    const serviceRate = baseBefore > 0 ? service / baseBefore : 0;

    return { taxRate, serviceRate };
}

// Recalc totals dari items (+ diskon yang sudah ada), mempertahankan rasio pajak/service lama
async function recalcTotals(orderDoc) {
    const items = orderDoc.items || [];
    let itemsTotal = 0;
    for (const it of items) {
        // jika subtotal ada, kita validasi/refresh agar konsisten
        it.subtotal = await computeItemSubtotal(it);
        itemsTotal += it.subtotal;
    }

    const discounts = Number(orderDoc.discounts?.autoPromoDiscount || 0)
        + Number(orderDoc.discounts?.manualDiscount || 0)
        + Number(orderDoc.discounts?.voucherDiscount || 0);

    const totalBeforeDiscount = itemsTotal;
    const totalAfterDiscount = Math.max(0, totalBeforeDiscount - discounts);

    const { taxRate, serviceRate } = deriveRatesFromOrder(orderDoc);
    const totalTax = Math.round(totalAfterDiscount * taxRate);
    const totalServiceFee = Math.round(totalAfterDiscount * serviceRate);
    const grandTotal = totalAfterDiscount + totalTax + totalServiceFee;

    return {
        totalBeforeDiscount,
        totalAfterDiscount,
        totalTax,
        totalServiceFee,
        grandTotal,
    };
}

// Buat signature item untuk diff (menuItem + notes + daftar addon/topping + dineType)
function itemSignature(it) {
    const addons = (it.addons || []).map(a => `${a.name}:${a.price}`).sort().join('|');
    const toppings = (it.toppings || []).map(t => `${t.name}:${t.price}`).sort().join('|');
    return [String(it.menuItem), it.notes || '', addons, toppings, it.dineType || 'Dine-In'].join('#');
}

// Diff items
function diffItems(beforeItems, afterItems) {
    const beforeMap = new Map();
    beforeItems.forEach(it => beforeMap.set(String(it._id), it));

    const afterMap = new Map();
    afterItems.forEach(it => afterMap.set(String(it._id), it));

    const added = [];
    const removed = [];
    const updated = [];

    // mark removed & updated
    for (const [id, b] of beforeMap) {
        const a = afterMap.get(id);
        if (!a) {
            removed.push({ itemBefore: b });
            continue;
        }
        const sameSig = itemSignature(a) === itemSignature(b);
        const qtyChanged = Number(a.quantity) !== Number(b.quantity);
        const priceChanged = Number(a.subtotal) !== Number(b.subtotal);
        if (!sameSig || qtyChanged || priceChanged) {
            updated.push({ itemBefore: b, itemAfter: a });
        }
    }
    // mark added (yang _id baru)
    for (const [id, a] of afterMap) {
        if (!beforeMap.has(id)) {
            added.push({ itemAfter: a });
        }
    }

    return { added, removed, updated };
}

// Terapkan operasi
// ops: [{ op:'add'|'update'|'remove', item|itemId, patch?, reason?, oos? }]
async function applyOperations(orderDoc, ops) {
    const items = orderDoc.items;

    for (const op of (ops || [])) {
        if (op.op === 'remove') {
            const idx = items.findIndex(it => String(it._id) === String(op.itemId));
            if (idx < 0) throw new Error(`Item ${op.itemId} tidak ditemukan`);
            const it = items[idx];
            if (LOCKED_STATES.has(it.kitchenStatus) && !op.oos) {
                throw new Error(`Item ${op.itemId} sudah ${it.kitchenStatus} dan tidak bisa dihapus (kecuali OOS)`);
            }
            items.splice(idx, 1);
            continue;
        }

        if (op.op === 'update') {
            const it = items.find(it => String(it._id) === String(op.itemId));
            if (!it) throw new Error(`Item ${op.itemId} tidak ditemukan`);
            if (LOCKED_STATES.has(it.kitchenStatus) && !op.oos) {
                throw new Error(`Item ${op.itemId} sudah ${it.kitchenStatus} dan tidak bisa diubah (kecuali OOS)`);
            }
            const patch = op.patch || {};

            if (patch.quantity !== undefined) it.quantity = Number(patch.quantity);
            if (patch.notes !== undefined) it.notes = String(patch.notes || '');
            if (patch.dineType !== undefined) it.dineType = patch.dineType;

            // Jika ada selectedAddons/selectedToppings -> resolve dari DB
            if (patch.selectedAddons || patch.selectedToppings) {
                const menu = await MenuItem.findById(it.menuItem).select('addons toppings').lean();
                if (patch.selectedAddons) it.addons = resolveAddonsFromIds(patch.selectedAddons, menu);
                if (patch.selectedToppings) it.toppings = resolveToppingsFromIds(patch.selectedToppings, menu);
            } else {
                // fallback: kalau kamu masih mengirim addons/toppings resolved langsung
                if (patch.addons) it.addons = (patch.addons || []).map(a => ({ name: a.name, price: Number(a.price || 0) }));
                if (patch.toppings) it.toppings = (patch.toppings || []).map(t => ({ name: t.name, price: Number(t.price || 0) }));
            }
            continue;
        }

        if (op.op === 'add') {
            const menu = await MenuItem.findById(op.item.menuItem).select('addons toppings').lean();
            const resolvedAddons = resolveAddonsFromIds(op.item.selectedAddons || [], menu);
            const resolvedToppings = resolveToppingsFromIds(op.item.selectedToppings || [], menu);

            const newItem = {
                menuItem: op.item.menuItem,
                quantity: Number(op.item.quantity || 1),
                addons: resolvedAddons,
                toppings: resolvedToppings,
                notes: op.item.notes || '',
                batchNumber: orderDoc.currentBatch || 1,
                addedAt: new Date(),
                kitchenStatus: 'pending',
                isPrinted: false,
                dineType: op.item.dineType || 'Dine-In',
                outletId: orderDoc.outlet,
                outletName: undefined,
                payment_id: null,
                _tempNew: true,  // buat penanda
            };
            items.push(newItem);
            continue;
        }

        throw new Error(`Unknown op: ${op.op}`);
    }
}


// Alokasi delta → Payment (inti)
async function allocateDeltaToPayments({ orderDoc, grandDelta, session, revisionId, reason }) {
    // Ambil semua payment untuk order ini
    const payments = await Payment.find({ order_id: orderDoc.order_id }).session(session).sort({ createdAt: 1 });

    const effects = {
        pendingPaymentAdjusted: [],
        newPendingPaymentId: null,
        refundPaymentId: null,
    };

    const hasSettled = payments.some(p => p.status === 'settlement');
    const pending = payments.find(p => p.status === 'pending');

    // Helper buat adjustment record (opsional)
    async function createAdjustment({ paymentId, kind, direction, amount, note }) {
        const adj = await PaymentAdjustment.create([{
            orderId: orderDoc._id,
            paymentId,
            revisionId,
            kind,
            direction,
            amount,
            note,
        }], { session });
        return adj[0];
    }

    // Helper buat Payment baru (pending charge)
    async function createNewPendingCharge(amount) {
        // Jika ada DP settled, maka pending ini bertipe Final Payment dan relasi ke DP
        const dp = payments.find(p => p.paymentType === 'Down Payment' && p.status === 'settlement');
        const paymentType = dp ? 'Final Payment' : 'Full';

        const p = await Payment.create([{
            order_id: orderDoc.order_id,
            payment_code: String(Date.now()),
            transaction_id: `adjust-${Date.now()}`,
            method: orderDoc.paymentMethod || 'Cash',
            status: 'pending',
            paymentType,
            amount: Math.max(0, amount),
            totalAmount: (dp?.totalAmount || payments[0]?.totalAmount || orderDoc.grandTotal || 0),
            remainingAmount: 0,
            relatedPaymentId: dp?._id || null,
            isAdjustment: true,
            direction: 'charge',
            revisionId,
        }], { session });

        await createAdjustment({
            paymentId: p[0]._id,
            kind: 'new_pending',
            direction: 'charge',
            amount,
            note: reason || 'add_after_payment',
        });

        return p[0];
    }

    // Helper buat Refund sebagai Payment (direction=refund, settlement langsung karena cash-out)
    async function createRefundPayment(amountAbs) {
        const settled = payments.find(p => p.status === 'settlement') || payments[0];
        const p = await Payment.create([{
            order_id: orderDoc.order_id,
            payment_code: String(Date.now()),
            transaction_id: `refund-${Date.now()}`,
            method: 'Cash',
            status: 'settlement', // karena langsung dikembalikan cash
            paymentType: settled?.paymentType || 'Full',
            amount: Math.max(0, amountAbs),
            totalAmount: settled?.totalAmount || orderDoc.grandTotal || 0,
            remainingAmount: 0,
            relatedPaymentId: settled?._id || null,
            isAdjustment: true,
            direction: 'refund',
            revisionId,
        }], { session });

        await createAdjustment({
            paymentId: p[0]._id,
            kind: 'settled_refund',
            direction: 'refund',
            amount: amountAbs,
            note: reason || 'oos_or_reduce_after_settlement',
        });

        return p[0];
    }

    // === Alokasi inti ===
    if (!hasSettled) {
        // Belum ada settlement (belum bayar): semua perubahan lari ke payment pending
        if (pending) {
            pending.amount = Math.max(0, Number(pending.amount) + grandDelta);
            await pending.save({ session });
            effects.pendingPaymentAdjusted.push({ paymentId: pending._id, amountDelta: grandDelta });
            await createAdjustment({
                paymentId: pending._id,
                kind: grandDelta >= 0 ? 'increase_pending' : 'decrease_pending',
                direction: grandDelta >= 0 ? 'charge' : 'refund',
                amount: Math.abs(grandDelta),
                note: reason || 'edit_before_pay',
            });
        } else if (grandDelta > 0) {
            const newP = await createNewPendingCharge(grandDelta);
            effects.newPendingPaymentId = newP._id;
        } else {
            // grandDelta < 0 dan tidak ada pending → turunkan ke 0 (tidak perlu refund karena belum bayar)
            // Tidak ada tindakan tambahan
        }
    } else {
        // Sudah ada settlement
        if (grandDelta > 0) {
            // Tambahan item: tambahkan ke pending kalau ada, kalau tidak buat pending baru
            if (pending) {
                pending.amount = Math.max(0, Number(pending.amount) + grandDelta);
                await pending.save({ session });
                effects.pendingPaymentAdjusted.push({ paymentId: pending._id, amountDelta: grandDelta });
                await createAdjustment({
                    paymentId: pending._id,
                    kind: 'increase_pending',
                    direction: 'charge',
                    amount: grandDelta,
                    note: reason || 'add_after_fullpay',
                });
            } else {
                const newP = await createNewPendingCharge(grandDelta);
                effects.newPendingPaymentId = newP._id;
            }
        } else if (grandDelta < 0) {
            // Pengurangan: kurangi pending dulu, sisa jadi refund
            let remaining = Math.abs(grandDelta);

            if (pending && pending.amount > 0) {
                const canReduce = Math.min(Number(pending.amount), remaining);
                if (canReduce > 0) {
                    pending.amount = Math.max(0, Number(pending.amount) - canReduce);
                    await pending.save({ session });
                    effects.pendingPaymentAdjusted.push({ paymentId: pending._id, amountDelta: -canReduce });
                    await createAdjustment({
                        paymentId: pending._id,
                        kind: 'decrease_pending',
                        direction: 'refund',
                        amount: canReduce,
                        note: reason || 'offset_reduce_against_pending',
                    });
                    remaining -= canReduce;
                }
            }

            if (remaining > 0) {
                const refund = await createRefundPayment(remaining);
                effects.refundPaymentId = refund._id;
            }
        }
    }

    return effects;
}

export async function editOrderAndAllocate({ orderId, operations, reason, userId, idempotencyKey }) {
    const session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
        // Cek idempotency (opsional)
        if (idempotencyKey) {
            const dup = await OrderRevision.findOne({ orderId, idempotencyKey }).session(session);
            if (dup) {
                result = { reused: true, revision: dup };
                return;
            }
        }

        const orderDoc = await Order.findById(orderId).session(session);
        if (!orderDoc) throw new Error('Order tidak ditemukan');

        const beforeItems = orderDoc.items.map(it => ({ ...it.toObject() }));

        // Terapkan operasi (validasi kitchen state)
        await applyOperations(orderDoc, operations);

        // Recalculate totals after ops
        const beforeTotals = {
            totalBeforeDiscount: Number(orderDoc.totalBeforeDiscount || 0),
            totalAfterDiscount: Number(orderDoc.totalAfterDiscount || 0),
            totalTax: Number(orderDoc.totalTax || 0),
            totalServiceFee: Number(orderDoc.totalServiceFee || 0),
            grandTotal: Number(orderDoc.grandTotal || 0),
        };

        const newTotals = await recalcTotals(orderDoc);

        // update order totals
        orderDoc.totalBeforeDiscount = newTotals.totalBeforeDiscount;
        orderDoc.totalAfterDiscount = newTotals.totalAfterDiscount;
        orderDoc.totalTax = newTotals.totalTax;
        orderDoc.totalServiceFee = newTotals.totalServiceFee;
        orderDoc.grandTotal = newTotals.grandTotal;

        const delta = {
            subtotalDelta: newTotals.totalBeforeDiscount - beforeTotals.totalBeforeDiscount,
            taxDelta: newTotals.totalTax - beforeTotals.totalTax,
            serviceDelta: newTotals.totalServiceFee - beforeTotals.totalServiceFee,
            grandDelta: newTotals.grandTotal - beforeTotals.grandTotal,
        };

        // Simpan revisi (sementara kosong effects; akan diupdate sesudah alokasi)
        const revision = await OrderRevision.create([{
            orderId,
            idempotencyKey,
            createdBy: userId || null,
            reason: reason || null,
            changes: diffItems(beforeItems, orderDoc.items.map(it => it.toObject())),
            delta,
        }], { session });
        const revisionId = revision[0]._id;

        // Alokasikan delta ke payments
        const effects = await allocateDeltaToPayments({
            orderDoc,
            grandDelta: delta.grandDelta,
            session,
            revisionId,
            reason,
        });

        // Set payment_id untuk item BARU bila ada pending baru
        // if (effects.newPendingPaymentId) {
        //     for (const it of orderDoc.items) {
        //         if (!it.payment_id) it.payment_id = effects.newPendingPaymentId;
        //     }
        // }
        // Tentukan payment target: prioritas payment baru; jika tidak ada, pakai payment pending yang disesuaikan
        const targetPaymentId =
            effects.newPendingPaymentId ||
            (effects.pendingPaymentAdjusted.length
                ? effects.pendingPaymentAdjusted[effects.pendingPaymentAdjusted.length - 1].paymentId
                : null);

        if (targetPaymentId) {
            orderDoc.items.forEach(it => {
                if (it._tempNew === true) {
                    it.payment_id = targetPaymentId; // hanya item baru
                }
            });
        }

        // Bersihkan flag sementara agar tidak tersimpan di DB
        orderDoc.items.forEach(it => {
            if (it._tempNew !== undefined) delete it._tempNew;
        });


        // Update revision effects
        await OrderRevision.updateOne(
            { _id: revisionId },
            { $set: { effects } },
            { session }
        );

        // Simpan order
        await orderDoc.save({ session });

        result = { reused: false, revision: await OrderRevision.findById(revisionId).session(session) };
    });

    session.endSession();
    return result;
}
