// services/menu-pricing.service.js
import { MenuItem } from '../models/MenuItem.js';
import mongoose from 'mongoose';

export async function loadMenuForOutletOrThrow(menuItemId, outletId) {
    const menu = await MenuItem.findById(menuItemId).lean();
    if (!menu) throw new Error('MENU_NOT_FOUND');
    if (menu.isActive === false) throw new Error('MENU_INACTIVE');
    // Validasi outlet jika kamu pakai availableAt
    if (outletId && Array.isArray(menu.availableAt) && menu.availableAt.length > 0) {
        const ok = menu.availableAt.some(id => id.toString() === outletId.toString());
        if (!ok) throw new Error('MENU_NOT_AVAILABLE_AT_OUTLET');
    }
    return menu;
}

function priceOfTopping(menu, name) {
    const t = (menu.toppings || []).find(x => x.name === name);
    if (!t) throw new Error(`TOPPING_NOT_FOUND: ${name}`);
    return t.price;
}

function priceOfAddon(menu, name, optionLabel) {
    const a = (menu.addons || []).find(x => x.name === name);
    if (!a) throw new Error(`ADDON_GROUP_NOT_FOUND: ${name}`);
    const opt = (a.options || []).find(o => o.label === optionLabel);
    if (!opt) throw new Error(`ADDON_OPTION_NOT_FOUND: ${name}:${optionLabel}`);
    return opt.price;
}

/**
 * Bangun OrderItem (sesuai skema OrderItemSchema kamu),
 * lengkap dengan subtotal dihitung server-side.
 */
export function buildOrderItemSnapshot(menu, {
    qty = 1,
    toppings = [],
    addons = [],       // [{name, option}]
    note = '',
    outletId,
    outletName,
    batchNumber = 1,
}) {
    // base
    const base = menu.price || 0;

    // toppings
    const toppingSnapshots = (toppings || []).map(name => ({
        name,
        price: priceOfTopping(menu, name),
    }));
    const toppingSum = toppingSnapshots.reduce((a, b) => a + b.price, 0);

    // addons
    const addonSnapshots = (addons || []).map(({ name, option }) => ({
        name: `${name} - ${option}`,
        price: priceOfAddon(menu, name, option),
    }));
    const addonSum = addonSnapshots.reduce((a, b) => a + b.price, 0);

    const perUnit = base + toppingSum + addonSum;
    const subtotal = perUnit * qty;

    return {
        menuItem: new mongoose.Types.ObjectId(menu._id),
        quantity: qty,
        subtotal,
        addons: addonSnapshots,        // bentuk di OrderItem: [{name, price}]
        toppings: toppingSnapshots,    // sama
        notes: note || '',
        batchNumber,
        kitchenStatus: 'pending',
        isPrinted: false,
        outletId: outletId ? new mongoose.Types.ObjectId(outletId) : undefined,
        outletName: outletName,
        addedAt: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
    };
}

export function recalcByQtyFromSnapshot(item, fromQty, toQty) {
    const perUnit = (item.subtotal || 0) / (item.quantity || 1);
    const delta = (toQty - fromQty) * perUnit;
    return { newSubtotal: item.subtotal + delta, priceDelta: delta };
}
