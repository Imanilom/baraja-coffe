import React from "react";
import PdfButton from "../pdfButton";

const TransactionModal = ({ selectedTrx, setSelectedTrx, receiptRef, formatDateTime, formatCurrency }) => {
    const finalTotal =
        (selectedTrx.totalAfterDiscount || 0) +
        (selectedTrx.taxAndServiceDetails?.[0]?.amount || 0);

    // Get payment details from paymentDetails object if available
    const paymentDetails = selectedTrx?.paymentDetails;
    const paymentMethod = paymentDetails?.method_type || selectedTrx?.actualPaymentMethod || selectedTrx?.paymentMethod || "N/A";
    const paymentStatus = paymentDetails?.status;
    const paymentAmount = paymentDetails?.amount || finalTotal;
    const changeAmount = paymentDetails?.change_amount || 0;
    const transactionTime = paymentDetails?.transaction_time;
    const paymentCode = paymentDetails?.payment_code;
    const transactionId = paymentDetails?.transaction_id;

    // Format status badge color
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'settlement':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'expire':
            case 'cancel':
            case 'deny':
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-40"
                onClick={() => setSelectedTrx(null)}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white shadow-lg transform transition-transform duration-300 ease-in-out h-screen flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 flex justify-between items-center font-semibold border-b">
                    <h2 className="text-lg font-semibold">Detail Transaksi</h2>
                    <button
                        onClick={() => setSelectedTrx(null)}
                        className="text-xl font-bold hover:text-red-400"
                    >
                        &times;
                    </button>
                </div>

                {/* Body */}
                <div
                    id="receipt-pdf"
                    ref={receiptRef}
                    className="flex-1 overflow-y-auto p-6 text-sm text-gray-700"
                >
                    {/* Brand */}
                    <div className="text-center mb-6">
                        <img
                            src="/images/logo_resi.png"
                            alt="Logo"
                            className="mx-auto w-1/2"
                        />
                        <h2 className="mx-auto w-4/5 text-sm font-medium mt-2">
                            {selectedTrx.cashierId?.outlet?.[0]?.outletId?.address}
                        </h2>
                    </div>

                    {/* Info Transaksi */}
                    <div className="space-y-2 text-sm mb-6 bg-gray-50 rounded-lg">
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Kode Struk</span>
                            <p className="font-semibold">{selectedTrx.order_id}</p>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Tanggal</span>
                            <p>{formatDateTime(selectedTrx?.createdAt)}</p>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Kasir</span>
                            <p>{selectedTrx.groId?.name ? `${selectedTrx.groId?.name} ( GRO )` : selectedTrx.cashierId?.username || "-"}</p>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Pelanggan</span>
                            <p>{selectedTrx.user}</p>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-600">No Meja</span>
                            <p>{selectedTrx.tableNumber}</p>
                        </div>
                    </div>

                    {/* Order Type */}
                    <div className="space-y-1 mb-6">
                        <p className="text-center text-base font-semibold text-gray-800 bg-green-50 py-2 rounded-lg">
                            {selectedTrx.orderType}
                        </p>
                    </div>

                    {/* Items */}
                    <div className="border-t border-b border-dashed py-4 space-y-3">
                        {selectedTrx.items?.map((item, index) => (
                            <div key={index} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <div className="flex-1 font-medium">{item.menuItemData?.name || "tidak terinput dengan benar"}</div>
                                    <div className="w-12 text-center text-gray-600">× {item.quantity}</div>
                                    <div className="w-24 text-right font-semibold">
                                        {formatCurrency(item.subtotal)}
                                    </div>
                                </div>
                                {/* Show addons if any */}
                                {item.addons && item.addons.length > 0 && (
                                    <div className="pl-4 text-xs text-gray-500">
                                        {item.addons.map((addon, idx) => (
                                            <div key={idx}>
                                                + {addon.name}: {addon.options?.map(opt => opt.label).join(", ")}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* Show notes if any */}
                                {item.notes && (
                                    <div className="pl-4 text-xs text-gray-500 italic">
                                        Note: {item.notes}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Custom Amount Items */}
                        {selectedTrx.customAmountItems && selectedTrx.customAmountItems.length > 0 && (
                            <>
                                {selectedTrx.customAmountItems.map((customItem, index) => (
                                    <div key={`custom-${index}`} className="space-y-1 rounded">
                                        <div className="flex justify-between text-sm">
                                            <div className="flex-1 font-medium text-blue-800">
                                                [Custom] {customItem.name || "Custom Amount"}
                                            </div>
                                            <div className="w-12 text-center text-gray-600">× 1</div>
                                            <div className="w-24 text-right font-semibold text-blue-800">
                                                {formatCurrency(customItem.amount)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {/* Total Section */}
                    <div className="my-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Sub Total</span>
                            <span className="font-medium">{formatCurrency(selectedTrx.totalBeforeDiscount)}</span>
                        </div>

                        {/* Discounts if any */}
                        {selectedTrx.discounts && (
                            <>
                                {selectedTrx.discounts.autoPromoDiscount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Promo Diskon</span>
                                        <span>-{formatCurrency(selectedTrx.discounts.autoPromoDiscount)}</span>
                                    </div>
                                )}
                                {selectedTrx.discounts.manualDiscount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Manual Diskon</span>
                                        <span>-{formatCurrency(selectedTrx.discounts.manualDiscount)}</span>
                                    </div>
                                )}
                                {selectedTrx.discounts.voucherDiscount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Voucher Diskon</span>
                                        <span>-{formatCurrency(selectedTrx.discounts.voucherDiscount)}</span>
                                    </div>
                                )}
                            </>
                        )}

                        {/* <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Setelah Diskon</span>
                            <span className="font-medium">{formatCurrency(selectedTrx.totalAfterDiscount)}</span>
                        </div> */}

                        {/* Tax */}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{selectedTrx.taxAndServiceDetails?.[0]?.name || "Tax"}</span>
                            <span className="font-medium">
                                {formatCurrency(selectedTrx.taxAndServiceDetails?.[0]?.amount || 0)}
                            </span>
                        </div>

                        {/* Grand Total */}
                        <div className="flex justify-between text-base font-bold text-green-700 border-t border-dashed pt-3 mt-2">
                            <span>Total Harga</span>
                            <span>{formatCurrency(selectedTrx.grandTotal)}</span>
                        </div>
                    </div>

                    {/* Payment Details Section */}
                    <div className="border-t border-dashed pt-4 space-y-3">
                        <h3 className="font-semibold text-gray-800 mb-3">Detail Pembayaran</h3>

                        {/* Payment Method with Status */}
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Metode Pembayaran</span>
                            <div className="flex flex-col items-end gap-1">
                                <span className="font-semibold">{paymentMethod}</span>
                            </div>
                        </div>

                        {/* Payment Amount */}
                        {/* <div className="flex justify-between font-medium text-green-800 rounded">
                            <span>Jumlah Dibayar</span>
                            <span>{formatCurrency(paymentAmount)}</span>
                        </div> */}

                        {/* Change Amount */}
                        <div className="flex justify-between">
                            <span className="text-gray-600">Kembali</span>
                            <span className="font-semibold">{formatCurrency(changeAmount)}</span>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-6 text-center text-xs text-gray-500 border-t pt-4">
                        <p>Terima kasih atas kunjungan Anda</p>
                        <p className="mt-1">Simpan struk ini sebagai bukti pembayaran</p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t space-y-4 bg-gray-50">
                    <PdfButton
                        targetId="receipt-pdf"
                        fileName={`Resi_${selectedTrx?.order_id || "transaksi"}.pdf`}
                    />

                    {/* Optional: Add refresh payment status button */}
                    {paymentStatus === 'pending' && (
                        <button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg shadow"
                            onClick={() => {
                                // You can add refresh payment status functionality here
                                console.log('Refresh payment status');
                            }}
                        >
                            Refresh Status Pembayaran
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransactionModal;