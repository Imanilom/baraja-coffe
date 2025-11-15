import React from "react";
import PdfButton from "../pdfButton";

const TransactionModal = ({ selectedTrx, setSelectedTrx, receiptRef, formatDateTime, formatCurrency }) => {
    const finalTotal =
        (selectedTrx.totalAfterDiscount || 0) +
        (selectedTrx.taxAndServiceDetails?.[0]?.amount || 0);

    // Get payment details
    const paymentDetails = selectedTrx.paymentDetails || {};
    const paymentMethod = selectedTrx.actualPaymentMethod || selectedTrx.paymentMethod || "-";
    const paymentStatus = paymentDetails.status || "-";
    const paymentType = paymentDetails.paymentType || "-";
    const paymentCode = paymentDetails.payment_code || "-";
    const transactionId = paymentDetails.transaction_id || "-";
    const paidAmount = paymentDetails.amount || finalTotal;
    const remainingAmount = paymentDetails.remainingAmount || 0;

    // Helper function untuk styling badge payment status
    const getPaymentStatusBadgeClass = (status) => {
        switch (status) {
            case "settlement":
            case "paid":
                return "bg-green-100 text-green-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "failed":
            case "expired":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Helper function untuk styling badge payment type
    const getPaymentTypeBadgeClass = (type) => {
        switch (type) {
            case "Full":
                return "bg-blue-100 text-blue-800";
            case "Down Payment":
                return "bg-purple-100 text-purple-800";
            case "Final Payment":
                return "bg-indigo-100 text-indigo-800";
            default:
                return "bg-gray-100 text-gray-800";
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
                <div className="p-4 flex justify-between items-center font-semibold">
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
                        <h2 className="mx-auto w-4/5 text-sm font-medium">
                            {selectedTrx.cashierId?.outlet?.[0]?.outletId?.address}
                        </h2>
                    </div>

                    {/* Info Transaksi */}
                    <div className="space-y-1 text-sm mb-6">
                        <div className="flex justify-between">
                            <span className="font-medium">Kode Struk</span>
                            <p>{selectedTrx.order_id}</p>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Tanggal</span>
                            <p>{formatDateTime(selectedTrx?.createdAt)}</p>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Kasir</span>
                            <p>{selectedTrx.cashierId?.username || "-"}</p>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Pelanggan</span>
                            <p>{selectedTrx.user}</p>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">No Meja</span>
                            <p>{selectedTrx.tableNumber}</p>
                        </div>
                    </div>

                    {/* Order Type */}
                    <div className="space-y-1 mb-6">
                        <p className="text-center text-base font-semibold text-gray-800 mt-2">
                            {selectedTrx.orderType}
                        </p>
                    </div>

                    {/* Items */}
                    <div className="border-t border-b border-dashed py-4 space-y-2">
                        {selectedTrx.items?.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                                <div className="flex-1">{item.menuItem?.name || "-"}</div>
                                <div className="w-12 text-center">× {item.quantity}</div>
                                <div className="w-20 text-right">
                                    {formatCurrency(item.subtotal)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total Section */}
                    <div className="my-2 space-y-2">
                        <div className="flex justify-between">
                            <span>Sub Total Harga</span>
                            <span>{formatCurrency(selectedTrx.totalAfterDiscount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>{selectedTrx.taxAndServiceDetails?.[0]?.name}</span>
                            <span>
                                {formatCurrency(selectedTrx.taxAndServiceDetails?.[0]?.amount)}
                            </span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-green-700 border-t border-dashed pt-2">
                            <span>Total Harga</span>
                            <span>{formatCurrency(finalTotal)}</span>
                        </div>
                    </div>

                    {/* Payment Details Section */}
                    <div className="border-t border-dashed pt-4 space-y-3">
                        <h3 className="font-semibold text-gray-800 mb-2">Detail Pembayaran</h3>

                        {/* Payment Method & Status */}
                        <div className="flex justify-between items-center">
                            <span>Metode Pembayaran</span>
                            <span className="font-medium">{paymentMethod}</span>
                        </div>

                        {/* Payment Code */}
                        {paymentCode !== "-" && (
                            <div className="flex justify-between">
                                <span>Kode Pembayaran</span>
                                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                    {paymentCode}
                                </span>
                            </div>
                        )}

                        {/* Transaction ID */}
                        {transactionId !== "-" && (
                            <div className="flex justify-between">
                                <span>Transaction ID</span>
                                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                    {transactionId}
                                </span>
                            </div>
                        )}

                        {/* Payment Amount */}
                        <div className="flex justify-between font-medium pt-2 border-t border-gray-200">
                            <span>Jumlah Dibayar</span>
                            <span className="text-green-700">{formatCurrency(paidAmount)}</span>
                        </div>

                        {/* Remaining Amount (for Down Payment) */}
                        {remainingAmount > 0 && (
                            <div className="flex justify-between text-orange-600">
                                <span>Sisa Pembayaran</span>
                                <span className="font-semibold">{formatCurrency(remainingAmount)}</span>
                            </div>
                        )}

                        {/* Change */}
                        <div className="flex justify-between">
                            <span>Kembali</span>
                            <span>{formatCurrency(selectedTrx.change || 0)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t space-y-4 bg-gray-50">
                    <PdfButton
                        targetId="receipt-pdf"
                        fileName={`Resi_${selectedTrx?.order_id || "transaksi"}.pdf`}
                    />
                </div>
            </div>
        </div>
    );
};

export default TransactionModal;