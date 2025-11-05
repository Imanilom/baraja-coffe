import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';
import Payment from '../models/Payment.model.js';
import OrderRevision from '../models/OrderRevision.model.js';
import PaymentAdjustment from '../models/PaymentAdjustment.model.js';
import { MenuItem } from '../models/MenuItem.model.js';

// --- Guard dapur: item yang boleh dikurangi/ubah
const LOCKED_STATES = new Set(['printed', 'cooking', 'ready', 'served']);

// // Gunakan ini menggantikan normalizeAddons/normalizeToppings kamu:
// function resolveAddonsFromIds(selectedAddons = [], menuItemDoc) {
//     const out = [];
//     for (const sel of selectedAddons || []) {
//         const addon = (menuItemDoc.addons || []).find(a => String(a._id) === String(sel.id));
//         if (!addon) continue; // boleh throw kalau mau strict
//         const optIds = (sel.options || []).map(o => String(o.id));
//         if (optIds.length === 0) {
//             const def = (addon.options || []).find(o => o.isDefault);
//             if (def) out.push({ name: `${addon.name}: ${def.label}`, price: Number(def.price || 0) });
//         } else {
//             for (const optId of optIds) {
//                 const opt = (addon.options || []).find(o => String(o._id) === optId);
//                 if (opt) out.push({ name: `${addon.name}: ${opt.label}`, price: Number(opt.price || 0) });
//             }
//         }
//     }
//     return out;
// }

// function resolveToppingsFromIds(selectedToppings = [], menuItemDoc) {
//     const out = [];
//     for (const sel of selectedToppings || []) {
//         const top = (menuItemDoc.toppings || []).find(t => String(t._id) === String(sel.id));
//         if (top) out.push({ name: top.name, price: Number(top.price || 0) });
//     }
//     return out;
// }


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


// // Ambil rasio pajak & service dari order existing (agar konsisten)
// function deriveRatesFromOrder(order) {
//     const baseBefore = Number(order.totalBeforeDiscount || 0);
//     const tax = Number(order.totalTax || 0);
//     const service = Number(order.totalServiceFee || 0);

//     const taxRate = baseBefore > 0 ? tax / baseBefore : 0;
//     const serviceRate = baseBefore > 0 ? service / baseBefore : 0;

//     return { taxRate, serviceRate };
// }

// // Recalc totals dari items (+ diskon yang sudah ada), mempertahankan rasio pajak/service lama
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

// // Buat signature item untuk diff (menuItem + notes + daftar addon/topping + dineType)
// function itemSignature(it) {
//     const addons = (it.addons || []).map(a => `${a.name}:${a.price}`).sort().join('|');
//     const toppings = (it.toppings || []).map(t => `${t.name}:${t.price}`).sort().join('|');
//     return [String(it.menuItem), it.notes || '', addons, toppings, it.dineType || 'Dine-In'].join('#');
// }

// // Diff items
// function diffItems(beforeItems, afterItems) {
//     const beforeMap = new Map();
//     beforeItems.forEach(it => beforeMap.set(String(it._id), it));

//     const afterMap = new Map();
//     afterItems.forEach(it => afterMap.set(String(it._id), it));

//     const added = [];
//     const removed = [];
//     const updated = [];

//     // mark removed & updated
//     for (const [id, b] of beforeMap) {
//         const a = afterMap.get(id);
//         if (!a) {
//             removed.push({ itemBefore: b });
//             continue;
//         }
//         const sameSig = itemSignature(a) === itemSignature(b);
//         const qtyChanged = Number(a.quantity) !== Number(b.quantity);
//         const priceChanged = Number(a.subtotal) !== Number(b.subtotal);
//         if (!sameSig || qtyChanged || priceChanged) {
//             updated.push({ itemBefore: b, itemAfter: a });
//         }
//     }
//     // mark added (yang _id baru)
//     for (const [id, a] of afterMap) {
//         if (!beforeMap.has(id)) {
//             added.push({ itemAfter: a });
//         }
//     }

//     return { added, removed, updated };
// }

// // Terapkan operasi
// // ops: [{ op:'add'|'update'|'remove', item|itemId, patch?, reason?, oos? }]
// async function applyOperations(orderDoc, ops) {
//     const items = orderDoc.items;

//     for (const op of (ops || [])) {
//         if (op.op === 'remove') {
//             const idx = items.findIndex(it => String(it._id) === String(op.itemId));
//             if (idx < 0) throw new Error(`Item ${op.itemId} tidak ditemukan`);
//             const it = items[idx];
//             if (LOCKED_STATES.has(it.kitchenStatus) && !op.oos) {
//                 throw new Error(`Item ${op.itemId} sudah ${it.kitchenStatus} dan tidak bisa dihapus (kecuali OOS)`);
//             }
//             items.splice(idx, 1);
//             continue;
//         }

//         if (op.op === 'update') {
//             const it = items.find(it => String(it._id) === String(op.itemId));
//             if (!it) throw new Error(`Item ${op.itemId} tidak ditemukan`);
//             if (LOCKED_STATES.has(it.kitchenStatus) && !op.oos) {
//                 throw new Error(`Item ${op.itemId} sudah ${it.kitchenStatus} dan tidak bisa diubah (kecuali OOS)`);
//             }
//             const patch = op.patch || {};

//             if (patch.quantity !== undefined) it.quantity = Number(patch.quantity);
//             if (patch.notes !== undefined) it.notes = String(patch.notes || '');
//             if (patch.dineType !== undefined) it.dineType = patch.dineType;

//             // Jika ada selectedAddons/selectedToppings -> resolve dari DB
//             if (patch.selectedAddons || patch.selectedToppings) {
//                 const menu = await MenuItem.findById(it.menuItem).select('addons toppings').lean();
//                 if (patch.selectedAddons) it.addons = resolveAddonsFromIds(patch.selectedAddons, menu);
//                 if (patch.selectedToppings) it.toppings = resolveToppingsFromIds(patch.selectedToppings, menu);
//             } else {
//                 // fallback: kalau kamu masih mengirim addons/toppings resolved langsung
//                 if (patch.addons) it.addons = (patch.addons || []).map(a => ({ name: a.name, price: Number(a.price || 0) }));
//                 if (patch.toppings) it.toppings = (patch.toppings || []).map(t => ({ name: t.name, price: Number(t.price || 0) }));
//             }
//             continue;
//         }

//         if (op.op === 'add') {
//             const menu = await MenuItem.findById(op.item.menuItem).select('addons toppings').lean();
//             const resolvedAddons = resolveAddonsFromIds(op.item.selectedAddons || [], menu);
//             const resolvedToppings = resolveToppingsFromIds(op.item.selectedToppings || [], menu);

//             const newItem = {
//                 menuItem: op.item.menuItem,
//                 quantity: Number(op.item.quantity || 1),
//                 addons: resolvedAddons,
//                 toppings: resolvedToppings,
//                 notes: op.item.notes || '',
//                 batchNumber: orderDoc.currentBatch || 1,
//                 addedAt: new Date(),
//                 kitchenStatus: 'pending',
//                 isPrinted: false,
//                 dineType: op.item.dineType || 'Dine-In',
//                 outletId: orderDoc.outlet,
//                 outletName: undefined,
//                 payment_id: null,
//                 _tempNew: true,  // buat penanda
//             };
//             items.push(newItem);
//             continue;
//         }

//         throw new Error(`Unknown op: ${op.op}`);
//     }
// }

// export async function editOrderAndAllocate({ orderId, operations, reason, userId, idempotencyKey }) {
//     const session = await mongoose.startSession();
//     let result;
//     await session.withTransaction(async () => {
//         // Cek idempotency (opsional)
//         if (idempotencyKey) {
//             const dup = await OrderRevision.findOne({ orderId, idempotencyKey }).session(session);
//             if (dup) {
//                 result = { reused: true, revision: dup };
//                 return;
//             }
//         }

//         const orderDoc = await Order.findById(orderId).session(session);
//         if (!orderDoc) throw new Error('Order tidak ditemukan');

//         const beforeItems = orderDoc.items.map(it => ({ ...it.toObject() }));

//         // Terapkan operasi (validasi kitchen state)
//         await applyOperations(orderDoc, operations);

//         // Recalculate totals after ops
//         const beforeTotals = {
//             totalBeforeDiscount: Number(orderDoc.totalBeforeDiscount || 0),
//             totalAfterDiscount: Number(orderDoc.totalAfterDiscount || 0),
//             totalTax: Number(orderDoc.totalTax || 0),
//             totalServiceFee: Number(orderDoc.totalServiceFee || 0),
//             grandTotal: Number(orderDoc.grandTotal || 0),
//         };

//         const newTotals = await recalcTotals(orderDoc);

//         // update order totals
//         orderDoc.totalBeforeDiscount = newTotals.totalBeforeDiscount;
//         orderDoc.totalAfterDiscount = newTotals.totalAfterDiscount;
//         orderDoc.totalTax = newTotals.totalTax;
//         orderDoc.totalServiceFee = newTotals.totalServiceFee;
//         orderDoc.grandTotal = newTotals.grandTotal;

//         const delta = {
//             subtotalDelta: newTotals.totalBeforeDiscount - beforeTotals.totalBeforeDiscount,
//             taxDelta: newTotals.totalTax - beforeTotals.totalTax,
//             serviceDelta: newTotals.totalServiceFee - beforeTotals.totalServiceFee,
//             grandDelta: newTotals.grandTotal - beforeTotals.grandTotal,
//         };

//         // Simpan revisi (sementara kosong effects; akan diupdate sesudah alokasi)
//         const revision = await OrderRevision.create([{
//             orderId,
//             idempotencyKey,
//             createdBy: userId || null,
//             reason: reason || null,
//             changes: diffItems(beforeItems, orderDoc.items.map(it => it.toObject())),
//             delta,
//         }], { session });
//         const revisionId = revision[0]._id;

//         // Alokasikan delta ke payments
//         const effects = await allocateDeltaToPayments({
//             orderDoc,
//             grandDelta: delta.grandDelta,
//             session,
//             revisionId,
//             reason,
//         });

//         // Set payment_id untuk item BARU bila ada pending baru
//         // if (effects.newPendingPaymentId) {
//         //     for (const it of orderDoc.items) {
//         //         if (!it.payment_id) it.payment_id = effects.newPendingPaymentId;
//         //     }
//         // }
//         // Tentukan payment target: prioritas payment baru; jika tidak ada, pakai payment pending yang disesuaikan
//         const targetPaymentId =
//             effects.newPendingPaymentId ||
//             (effects.pendingPaymentAdjusted.length
//                 ? effects.pendingPaymentAdjusted[effects.pendingPaymentAdjusted.length - 1].paymentId
//                 : null);

//         if (targetPaymentId) {
//             orderDoc.items.forEach(it => {
//                 if (it._tempNew === true) {
//                     it.payment_id = targetPaymentId; // hanya item baru
//                 }
//             });
//         }

//         // Bersihkan flag sementara agar tidak tersimpan di DB
//         orderDoc.items.forEach(it => {
//             if (it._tempNew !== undefined) delete it._tempNew;
//         });


//         // Update revision effects
//         await OrderRevision.updateOne(
//             { _id: revisionId },
//             { $set: { effects } },
//             { session }
//         );

//         // Simpan order
//         await orderDoc.save({ session });

//         result = { reused: false, revision: await OrderRevision.findById(revisionId).session(session) };
//     });

//     session.endSession();
//     return result;
// }

function isLockedItem(it) {
    return LOCKED_STATES.has(it.kitchenStatus);
}

// normalize dari payload Flutter → ke bentuk order.items kamu
async function normalizeIncomingItem(raw) {
    const menu = await MenuItem.findById(raw.id).lean();
    if (!menu) {
        throw new Error(`Menu ${raw.id} tidak ditemukan`);
    }

    // bikin addons dari id
    const addons = [];
    for (const ad of (raw.selectedAddons || [])) {
        const def = menu.addons?.find(a => a._id.toString() === ad.id);
        if (!def) continue;
        if (ad.options?.length) {
            for (const opt of ad.options) {
                const defOpt = def.options?.find(o => o._id.toString() === opt.id);
                if (!defOpt) continue;
                addons.push({
                    id: opt.id,
                    name: def.name,
                    price: defOpt.price || 0,
                    options: [{
                        id: opt.id,
                        label: defOpt.label,
                        price: defOpt.price || 0
                    }],
                });
            }
        } else {
            // kalau addon kamu memang harus pilih option, yang ini boleh di-skip
            addons.push({
                name: def.name,
                price: 0,
            });
        }
    }

    const toppings = [];
    for (const tp of (raw.selectedToppings || [])) {
        const def = menu.toppings?.find(t => t._id.toString() === tp.id);
        if (!def) continue;
        toppings.push({
            id: tp.id,
            name: def.name,
            price: def.price || 0,
        });
    }

    // hitung subtotal per item
    const base = Number(menu.price || 0);
    const addonsSum = addons.reduce((s, a) => s + Number(a.price || 0), 0);
    const toppingsSum = toppings.reduce((s, t) => s + Number(t.price || 0), 0);
    const each = base + addonsSum + toppingsSum;
    const qty = Number(raw.quantity || 1);
    const subtotal = each * qty;

    return {
        menuItem: raw.id,
        quantity: qty,
        subtotal,
        addons,
        toppings,
        notes: raw.notes || '',
        batchNumber: raw.batchNumber || 1,
        addedAt: new Date(),
        kitchenStatus: 'pending',
        isPrinted: false,
        dineType: raw.dineType || 'Dine-In',
        outletId: raw.outletId || null,
        outletName: raw.outletName || null,
        payment_id: raw.payment_id || null,
    };
}

export async function replaceOrderItemsAndAllocate({
    orderId,
    items,
    reason,
    userId,
    idempotencyKey,
}) {
    const session = await mongoose.startSession();
    let result;

    await session.withTransaction(async () => {
        // idempotency opsional
        if (idempotencyKey) {
            const dup = await OrderRevision.findOne({ orderId, idempotencyKey }).session(session);
            if (dup) {
                result = { reused: true, revision: dup };
                return;
            }
        }

        const orderDoc = await Order.findById(orderId).session(session);
        if (!orderDoc) throw new Error('Order tidak ditemukan');

        // 1. pisahkan locked dan editable
        const lockedItems = orderDoc.items.filter(isLockedItem);
        const beforeTotals = {
            totalBeforeDiscount: Number(orderDoc.totalBeforeDiscount || 0),
            totalAfterDiscount: Number(orderDoc.totalAfterDiscount || 0),
            totalTax: Number(orderDoc.totalTax || 0),
            totalServiceFee: Number(orderDoc.totalServiceFee || 0),
            grandTotal: Number(orderDoc.grandTotal || 0),
        };
        const beforeItems = orderDoc.items.map(it => it.toObject());

        // 2. normalisasi semua incoming
        const normalizedIncoming = [];
        for (const r of items) {
            console.log('normalizing items', r);
            const n = await normalizeIncomingItem(r);
            normalizedIncoming.push(n);
        }

        // 3. gabungkan locked + incoming (replace penuh bagian editable)
        orderDoc.items = [
            ...lockedItems,
            ...normalizedIncoming,
        ];

        // 4. recalc total (pakai rasio pajak lama kayak tadi)
        const itemsTotal = orderDoc.items.reduce((sum, it) => sum + Number(it.subtotal || 0), 0);
        const discounts =
            Number(orderDoc.discounts?.autoPromoDiscount || 0) +
            Number(orderDoc.discounts?.manualDiscount || 0) +
            Number(orderDoc.discounts?.voucherDiscount || 0);

        const totalBeforeDiscount = itemsTotal;
        const totalAfterDiscount = Math.max(0, totalBeforeDiscount - discounts);

        // derive rates
        const baseBefore = Number(orderDoc.totalBeforeDiscount || 0);
        const taxRate = baseBefore > 0 ? (Number(orderDoc.totalTax || 0) / baseBefore) : 0;
        const serviceRate = baseBefore > 0 ? (Number(orderDoc.totalServiceFee || 0) / baseBefore) : 0;

        const totalTax = Math.round(totalAfterDiscount * taxRate);
        const totalServiceFee = Math.round(totalAfterDiscount * serviceRate);
        const grandTotal = totalAfterDiscount + totalTax + totalServiceFee;

        orderDoc.totalBeforeDiscount = totalBeforeDiscount;
        orderDoc.totalAfterDiscount = totalAfterDiscount;
        orderDoc.totalTax = totalTax;
        orderDoc.totalServiceFee = totalServiceFee;
        orderDoc.grandTotal = grandTotal;

        const delta = {
            subtotalDelta: totalBeforeDiscount - beforeTotals.totalBeforeDiscount,
            taxDelta: totalTax - beforeTotals.totalTax,
            serviceDelta: totalServiceFee - beforeTotals.totalServiceFee,
            grandDelta: grandTotal - beforeTotals.grandTotal,
        };

        // 5. simpan revision dulu
        const revision = await OrderRevision.create([{
            orderId,
            idempotencyKey,
            createdBy: userId || null,
            reason: reason || 'replace_items',
            // kita bisa simpan before/after items penuh
            changes: {
                mode: 'full_replace',
                beforeItems,
                afterItems: orderDoc.items.map(it => it.toObject()),
            },
            delta,
        }], { session });

        // 6. alokasikan ke payment (PAKAI FUNGSI YANG SUDAH ADA)
        console.log('allocateDeltaToPayments');
        const effects = await allocateDeltaToPayments({
            orderDoc,
            grandDelta: delta.grandDelta,
            session,
            revisionId: revision[0]._id,
            reason,
        });

        // 7. update revision dengan effects
        await OrderRevision.updateOne(
            { _id: revision[0]._id },
            { $set: { effects } },
            { session },
        );

        // 8. simpan order
        if (orderDoc.status.toLowerCase() == 'cancled') {
            orderDoc.status = 'Pending';
        }

        await orderDoc.save({ session });

        result = {
            reused: false,
            revision: await OrderRevision.findById(revision[0]._id).session(session),
            order: orderDoc,
        };
    });

    session.endSession();
    return result;
}

// Alokasi delta → Payment (inti)
/**
 * Alokasi perubahan total order (grandDelta) ke payment-pembayaran.
 *
 * Rules (versi terbaru):
 * 1. Kalau cuma ada pending → ubah pending saja.
 * 2. Kalau sudah ada settlement:
 *    - grandDelta > 0:
 *        a. serap refund lama dulu
 *        b. jumlah yang diserap → naikkan settled
 *        c. sisa → ke pending (update / buat baru)
 *    - grandDelta < 0:
 *        a. kurangi pending dulu
 *        b. sisa → turunkan settled
 *        c. hanya bagian yang benar2 diturunkan dari settled yang dibuat refund
 */
export async function allocateDeltaToPayments({
    orderDoc,
    grandDelta,
    session,
    revisionId,
    reason,
}) {
    console.log(`[allocateDeltaToPayments] Mulai proses`, {
        orderId: orderDoc.order_id,
        grandDelta,
        revisionId,
        reason
    });

    // ambil semua payment order ini
    const payments = await Payment.find({ order_id: orderDoc.order_id })
        .session(session)
        .sort({ createdAt: 1 });

    console.log(`[allocateDeltaToPayments] Ditemukan ${payments.length} payment`);

    const effects = {
        pendingPaymentAdjusted: [],
        newPendingPaymentId: null,
        refundPaymentId: null,
        consumedRefunds: [],
        voidedRefunds: [],
        settledDecreased: [],
        settledIncreased: [],
        uncoveredDecrease: 0,
    };

    const hasAnyPayment = payments.length > 0;
    const hasSettled = payments.some((p) => p.status === "settlement");
    const pending = payments.find((p) => p.status === "pending");

    console.log(`[allocateDeltaToPayments] Status - hasAnyPayment: ${hasAnyPayment}, hasSettled: ${hasSettled}, pending: ${!!pending}`);

    // semua refund adjustment yang pernah kita buat (cash keluar)
    const refundAdjustments = payments
        .filter(
            (p) =>
                p.isAdjustment === true &&
                p.direction === "refund" &&
                p.status === "settlement" &&
                Number(p.amount) > 0
        )
        // pakai yang terbaru dulu
        .sort((a, b) => b.createdAt - a.createdAt);

    console.log(`[allocateDeltaToPayments] Ditemukan ${refundAdjustments.length} refund adjustments`);

    // ================== helpers ==================

    async function createAdjustment({
        paymentId,
        kind,
        direction,
        amount,
        note,
    }) {
        console.log(`[createAdjustment] Membuat adjustment`, {
            paymentId,
            kind,
            direction,
            amount,
            note
        });

        const [adj] = await PaymentAdjustment.create(
            [
                {
                    orderId: orderDoc._id,
                    paymentId,
                    revisionId,
                    kind,
                    direction,
                    amount,
                    note,
                },
            ],
            { session }
        );
        return adj;
    }

    async function createNewPendingCharge(amount) {
        console.log(`[createNewPendingCharge] Membuat pending charge baru`, { amount });

        // kalau sebelumnya ada DP settled → pending ini Final Payment
        const dp = payments.find(
            (p) => p.paymentType === "Down Payment" && p.status === "settlement"
        );
        const paymentType = dp ? "Final Payment" : "Full";

        const [p] = await Payment.create(
            [
                {
                    order_id: orderDoc.order_id,
                    payment_code: String(Date.now()),
                    transaction_id: `adjust-${Date.now()}`,
                    method: orderDoc.paymentMethod || "Cash",
                    status: "pending",
                    paymentType,
                    amount: Math.max(0, amount),
                    totalAmount: Math.max(0, amount) ||
                        dp?.totalAmount ||
                        payments[0]?.totalAmount ||
                        orderDoc.grandTotal ||
                        0,
                    remainingAmount: 0,
                    relatedPaymentId: dp?._id || null,
                    isAdjustment: true,
                    direction: "charge",
                    revisionId,
                },
            ],
            { session }
        );

        await createAdjustment({
            paymentId: p._id,
            kind: "new_pending",
            direction: "charge",
            amount,
            note: reason || "add_after_payment",
        });

        console.log(`[createNewPendingCharge] Pending charge baru berhasil dibuat`, { paymentId: p._id });
        return p;
    }

    // turunkan payment settled utama (bukan yang adjustment)
    async function decreaseSettledPayments(amountToDecrease) {
        console.log(`[decreaseSettledPayments] Mulai decrease settled payments`, { amountToDecrease });

        let remaining = amountToDecrease;

        // ambil semua settled yg bukan adjustment, terbaru dulu
        const settled = payments
            .filter((p) => p.status === "settlement" && !p.isAdjustment)
            .sort((a, b) => b.createdAt - a.createdAt);

        console.log(`[decreaseSettledPayments] ${settled.length} settled payment tersedia`);

        for (const pay of settled) {
            if (remaining <= 0) break;

            const cur = Number(pay.amount) || 0;
            if (cur <= 0) continue;

            const cut = Math.min(cur, remaining);

            console.log(`[decreaseSettledPayments] Menurunkan settled payment`, {
                paymentId: pay._id,
                amountSebelum: cur,
                amountDipangkas: cut,
                amountSesudah: cur - cut
            });

            pay.amount = cur - cut;
            // totalAmount juga diturunkan supaya konsisten
            pay.totalAmount = Math.max(0, Number(pay.totalAmount || 0) - cut);
            pay.remainingAmount = 0;
            await pay.save({ session });

            await createAdjustment({
                paymentId: pay._id,
                kind: "decrease_settled",
                direction: "refund",
                amount: cut,
                note: reason || "reduce_after_settlement",
            });

            effects.settledDecreased.push({
                paymentId: pay._id,
                amount: cut,
            });

            remaining -= cut;
            console.log(`[decreaseSettledPayments] Sisa amount yang perlu dikurangi: ${remaining}`);
        }

        console.log(`[decreaseSettledPayments] Selesai decrease settled payments`, { remaining });
        return remaining; // kalau >0 berarti gak cukup nurunin settled
    }

    // naikin settled paling baru
    async function increaseLatestSettled(amountToIncrease) {
        console.log(`[increaseLatestSettled] Menaikkan latest settled`, { amountToIncrease });

        const settled = payments
            .filter((p) => p.status === "settlement" && !p.isAdjustment)
            .sort((a, b) => b.createdAt - a.createdAt);
        const target = settled[0];
        if (!target) {
            console.log(`[increaseLatestSettled] Tidak ada settled payment yang bisa dinaikkan`);
            return false;
        }

        console.log(`[increaseLatestSettled] Menaikkan settled payment`, {
            paymentId: target._id,
            amountSebelum: target.amount,
            amountDitambahkan: amountToIncrease,
            amountSesudah: Number(target.amount || 0) + amountToIncrease
        });

        target.amount = Number(target.amount || 0) + amountToIncrease;
        target.totalAmount =
            Number(target.totalAmount || 0) + amountToIncrease;
        target.remainingAmount = 0;
        await target.save({ session });

        await createAdjustment({
            paymentId: target._id,
            kind: "increase_settled",
            direction: "charge",
            amount: amountToIncrease,
            note: reason || "add_after_refund",
        });

        effects.settledIncreased.push({
            paymentId: target._id,
            amount: amountToIncrease,
        });

        console.log(`[increaseLatestSettled] Berhasil menaikkan settled payment`);
        return true;
    }

    // bikin payment refund (cash out)
    async function createRefundPayment(amountAbs) {
        console.log(`[createRefundPayment] Membuat refund payment`, { amountAbs });

        // pakai payment settled pertama sebagai referensi tipe
        const settledRef =
            payments.find((p) => p.status === "settlement") || payments[0];

        const [p] = await Payment.create(
            [
                {
                    order_id: orderDoc.order_id,
                    payment_code: String(Date.now()),
                    transaction_id: `refund-${Date.now()}`,
                    method: "Cash",
                    status: "settlement",
                    paymentType: settledRef?.paymentType || "Full",
                    amount: Math.max(0, amountAbs),
                    totalAmount: Math.max(0, amountAbs) ||
                        settledRef?.totalAmount || orderDoc.grandTotal || 0,
                    remainingAmount: 0,
                    relatedPaymentId: settledRef?._id || null,
                    isAdjustment: true,
                    direction: "refund",
                    revisionId,
                },
            ],
            { session }
        );

        await createAdjustment({
            paymentId: p._id,
            kind: "settled_refund",
            direction: "refund",
            amount: amountAbs,
            note: reason || "reduce_after_settlement",
        });

        console.log(`[createRefundPayment] Refund payment berhasil dibuat`, { paymentId: p._id });
        return p;
    }

    // ================== CASE 0: belum ada payment ==================
    if (!hasAnyPayment) {
        console.log(`[CASE 0] Belum ada payment sama sekali`);
        if (grandDelta > 0) {
            console.log(`[CASE 0] Membuat pending charge baru karena grandDelta > 0`);
            const newP = await createNewPendingCharge(grandDelta);
            effects.newPendingPaymentId = newP._id;
        } else {
            console.log(`[CASE 0] GrandDelta <= 0, tidak ada yang dilakukan`);
        }
        console.log(`[CASE 0] Selesai`, { effects });
        return effects;
    }

    // ================== CASE 1: hanya pending (belum dibayar) ==================
    if (!hasSettled) {
        console.log(`[CASE 1] Hanya ada pending payment (belum settlement)`);
        if (pending) {
            console.log(`[CASE 1] Adjust existing pending payment`, {
                paymentId: pending._id,
                amountSebelum: pending.amount,
                delta: grandDelta
            });

            const newAmount = Math.max(0, Number(pending.amount) + grandDelta);

            pending.amount = newAmount;
            pending.totalAmount = Math.max(
                0,
                Number(pending.totalAmount || 0) + grandDelta
            );
            pending.remainingAmount = 0;
            await pending.save({ session });

            effects.pendingPaymentAdjusted.push({
                paymentId: pending._id,
                amountDelta: grandDelta,
            });

            await createAdjustment({
                paymentId: pending._id,
                kind: grandDelta >= 0 ? "increase_pending" : "decrease_pending",
                direction: grandDelta >= 0 ? "charge" : "refund",
                amount: Math.abs(grandDelta),
                note: reason || "edit_before_pay",
            });

            console.log(`[CASE 1] Pending payment berhasil diadjust`, {
                paymentId: pending._id,
                amountSesudah: pending.amount
            });
        } else if (grandDelta > 0) {
            console.log(`[CASE 1] Tidak ada pending, buat baru karena grandDelta > 0`);
            const newP = await createNewPendingCharge(grandDelta);
            effects.newPendingPaymentId = newP._id;
        } else {
            console.log(`[CASE 1] Tidak ada pending dan grandDelta <= 0, tidak ada yang dilakukan`);
        }
        console.log(`[CASE 1] Selesai`, { effects });
        return effects;
    }

    // ================== CASE 2: SUDAH ADA settlement ==================
    console.log(`[CASE 2] Ada settlement payment`);

    // ---- A. TAMBAH ITEM (grandDelta > 0) ----
    if (grandDelta > 0) {
        console.log(`[CASE 2A] GrandDelta > 0 (Tambah item)`);
        let remainingToCharge = grandDelta;
        let consumedFromRefund = 0;

        // 1) serap refund adjustment dulu
        console.log(`[CASE 2A] Langkah 1 - Serap refund adjustments`);
        for (const refund of refundAdjustments) {
            if (remainingToCharge <= 0) break;

            const refundAmount = Number(refund.amount) || 0;
            if (refundAmount <= 0) continue;

            const absorb = Math.min(refundAmount, remainingToCharge);

            console.log(`[CASE 2A] Menyerap refund adjustment`, {
                refundId: refund._id,
                amountSebelum: refundAmount,
                diserap: absorb,
                sisaRefund: refundAmount - absorb
            });

            // kurangi refund
            refund.amount = refundAmount - absorb;
            refund.totalAmount = refund.totalAmount - absorb;
            refund.remainingAmount = 0;
            await refund.save({ session });

            consumedFromRefund += absorb;
            remainingToCharge -= absorb;

            effects.consumedRefunds.push({
                refundId: refund._id,
                consumed: absorb,
                remaining: refund.amount,
            });

            // kita catat bahwa refund ini dipakai utk naikin lagi settle
            await createAdjustment({
                paymentId: refund._id,
                kind: "increase_settled",
                direction: "charge",
                amount: absorb,
                note: reason || "add_after_refund",
            });

            // kalau udah nol → void
            if (refund.amount === 0) {
                refund.status = "void";
                await refund.save({ session });
                effects.voidedRefunds.push(refund._id);
                console.log(`[CASE 2A] Refund di-void karena amount menjadi 0`, { refundId: refund._id });
            }
        }

        console.log(`[CASE 2A] Setelah serap refund - consumedFromRefund: ${consumedFromRefund}, remainingToCharge: ${remainingToCharge}`);

        // 2) kalau memang ada refund yg dipakai → balikin ke payment settled paling baru
        if (consumedFromRefund > 0) {
            console.log(`[CASE 2A] Langkah 2 - Balikkan ke settled payment`);
            await increaseLatestSettled(consumedFromRefund);
        }

        // 3) kalau masih ada sisa → ini benar2 tagihan baru → ke pending
        if (remainingToCharge > 0) {
            console.log(`[CASE 2A] Langkah 3 - Tambah ke pending`, { remainingToCharge });
            if (pending) {
                console.log(`[CASE 2A] Adjust existing pending payment`, {
                    paymentId: pending._id,
                    amountSebelum: pending.amount,
                    amountDitambahkan: remainingToCharge
                });

                pending.amount =
                    Number(pending.amount || 0) + remainingToCharge;
                pending.totalAmount = Number(pending.totalAmount || 0) + remainingToCharge;
                await pending.save({ session });

                effects.pendingPaymentAdjusted.push({
                    paymentId: pending._id,
                    amountDelta: remainingToCharge,
                });

                await createAdjustment({
                    paymentId: pending._id,
                    kind: "increase_pending",
                    direction: "charge",
                    amount: remainingToCharge,
                    note: reason || "add_after_fullpay",
                });

                console.log(`[CASE 2A] Pending payment berhasil diadjust`, {
                    paymentId: pending._id,
                    amountSesudah: pending.amount
                });
            } else {
                console.log(`[CASE 2A] Buat pending payment baru`);
                const newP = await createNewPendingCharge(remainingToCharge);
                effects.newPendingPaymentId = newP._id;
            }
        }

        console.log(`[CASE 2A] Selesai`, { effects });
        return effects;
    }

    // ---- B. KURANGI ITEM (grandDelta < 0) ----
    if (grandDelta < 0) {
        console.log(`[CASE 2B] GrandDelta < 0 (Kurangi item)`, { grandDelta });
        let remaining = Math.abs(grandDelta);

        // 1) kurangi pending dulu
        console.log(`[CASE 2B] Langkah 1 - Kurangi pending payment`);
        if (pending && pending.amount > 0) {
            const canReduce = Math.min(Number(pending.amount), remaining);
            console.log(`[CASE 2B] Mengurangi pending payment`, {
                paymentId: pending._id,
                amountSebelum: pending.amount,
                dikurangi: canReduce
            });

            if (canReduce > 0) {
                pending.amount = Math.max(0, Number(pending.amount) - canReduce);
                pending.totalAmount = Math.max(
                    0,
                    Number(pending.totalAmount || 0) - canReduce
                );
                pending.remainingAmount = Math.max(
                    0,
                    Number(pending.remainingAmount || 0) - canReduce
                );

                await pending.save({ session });

                effects.pendingPaymentAdjusted.push({
                    paymentId: pending._id,
                    amountDelta: -canReduce,
                });

                await createAdjustment({
                    paymentId: pending._id,
                    kind: "decrease_pending",
                    direction: "refund",
                    amount: canReduce,
                    note: reason || "offset_reduce_against_pending",
                });

                remaining -= canReduce;

                console.log(`[CASE 2B] Pending payment berhasil dikurangi`, {
                    paymentId: pending._id,
                    amountSesudah: pending.amount,
                    sisaYangHarusDikurangi: remaining
                });
            }
            //hapus pending ketika 0
            if (pending.amount === 0) {
                pending.status = "void";
                await pending.save({ session });
                effects.voidedPendingPaymentId = pending._id;
                console.log(`[CASE 2B] Pending payment di-void karena amount 0`, { paymentId: pending._id });
            }
        } else {
            console.log(`[CASE 2B] Tidak ada pending payment yang bisa dikurangi`);
        }

        // 2) sisa → turunkan settled
        if (remaining > 0) {
            console.log(`[CASE 2B] Langkah 2 - Turunkan settled payments`, { remaining });
            const notCovered = await decreaseSettledPayments(remaining);
            const actuallyDecreased = remaining - notCovered;

            console.log(`[CASE 2B] Hasil turunkan settled - actuallyDecreased: ${actuallyDecreased}, notCovered: ${notCovered}`);

            // 3) hanya bagian yg benar2 diturunin dari settled yg kita refund-kan
            if (actuallyDecreased > 0) {
                console.log(`[CASE 2B] Langkah 3 - Buat refund payment`, { actuallyDecreased });
                const refund = await createRefundPayment(actuallyDecreased);
                effects.refundPaymentId = refund._id;
            }

            // kalau notCovered > 0 artinya settle-nya kurang buat diturunin
            if (notCovered > 0) {
                effects.uncoveredDecrease = notCovered;
                console.warn(`[CASE 2B] Peringatan: Ada uncovered decrease`, { uncoveredDecrease: notCovered });
            }
        } else {
            console.log(`[CASE 2B] Tidak ada sisa yang perlu diturunkan dari settled`);
        }

        console.log(`[CASE 2B] Selesai`, { effects });
        return effects;
    }

    // grandDelta == 0
    console.log(`[CASE 2C] GrandDelta == 0, tidak ada perubahan`);
    console.log(`[allocateDeltaToPayments] Selesai tanpa perubahan`, { effects });
    return effects;
}
