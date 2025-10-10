// contoh minimal, sesuaikan dengan logika asli kamu
export function calcItemSubtotal({ basePrice, quantity, toppings = [], addons = [] }) {
    const toppingsTotal = toppings.reduce((s, t) => s + (t.price || 0), 0);
    const addonsTotal = addons.reduce((s, a) => s + (a.price || 0), 0);
    return (basePrice + toppingsTotal + addonsTotal) * quantity;
}
export function recalcTotals(items, { taxAndServiceDetails = [] } = {}) {
    const totalBeforeDiscount = items.reduce((s, i) => s + (i.subtotal || 0), 0);
    // contoh sederhana: jumlahkan tax/service yang sudah ada di array
    const totalTax = taxAndServiceDetails
        .filter(x => x.type === 'tax')
        .reduce((s, x) => s + (x.amount || 0), 0);
    const totalServiceFee = taxAndServiceDetails
        .filter(x => x.type === 'service')
        .reduce((s, x) => s + (x.amount || 0), 0);

    const totalAfterDiscount = totalBeforeDiscount; // sesuaikan diskon jika ada
    const grandTotal = totalAfterDiscount + totalTax + totalServiceFee;
    return { totalBeforeDiscount, totalAfterDiscount, totalTax, totalServiceFee, grandTotal };
}
