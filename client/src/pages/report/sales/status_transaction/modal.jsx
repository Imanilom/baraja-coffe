import React, { useState } from "react";
import PdfButton from "../pdfButton";
import { FaPen, FaCheck, FaTimes } from "react-icons/fa";

const STATUS_OPTIONS = [
    { value: "Waiting", label: "Waiting", color: "bg-gray-100 text-gray-700" },
    { value: "Pending", label: "Pending", color: "bg-yellow-100 text-yellow-700" },
    { value: "OnProcess", label: "On Process", color: "bg-blue-100 text-blue-700" },
    { value: "Completed", label: "Completed", color: "bg-green-100 text-green-700" },
    { value: "Cancelled", label: "Cancelled", color: "bg-red-100 text-red-700" },
];

const TransactionModal = ({ selectedTrx, setSelectedTrx, receiptRef, formatDateTime, formatCurrency, updateStatus, isUpdatingStatus }) => {
    const finalTotal =
        (selectedTrx.totalAfterDiscount || 0) +
        (selectedTrx.taxAndServiceDetails?.[0]?.amount || 0);

    // Edit status state
    const [editStatusMode, setEditStatusMode] = useState(false);
    const [newStatus, setNewStatus] = useState(selectedTrx.status || '');
    const [updateMsg, setUpdateMsg] = useState(null); // { type: 'success'|'error', text }

    const currentStatusOption = STATUS_OPTIONS.find(s => s.value === selectedTrx.status);

    const handleSaveStatus = async () => {
        if (!newStatus || newStatus === selectedTrx.status) {
            setEditStatusMode(false);
            return;
        }
        setUpdateMsg(null);
        if (!updateStatus) return;
        const result = await updateStatus(selectedTrx._id, newStatus);
        if (result?.success) {
            setUpdateMsg({ type: 'success', text: 'Status berhasil diubah!' });
            setEditStatusMode(false);
            setTimeout(() => setUpdateMsg(null), 3000);
        } else {
            setUpdateMsg({ type: 'error', text: result?.message || 'Gagal mengubah status' });
        }
    };

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
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">Detail Transaksi</h2>
                        {currentStatusOption && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${currentStatusOption.color}`}>
                                {currentStatusOption.label}
                            </span>
                        )}
                    </div>
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
                            <p>{selectedTrx.cashierId?.username || "-"}</p>
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
                    </div>

                    {/* Total Section */}
                    <div className="my-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Sub Total</span>
                            <span className="font-medium">{formatCurrency(selectedTrx.totalAfterDiscount)}</span>
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
                            <span>{formatCurrency(selectedTrx.grandTotal || finalTotal)}</span>
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

                        {/* {paymentCode && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Kode Pembayaran</span>
                                <span className="font-mono text-xs">{paymentCode}</span>
                            </div>
                        )}

                        {transactionId && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Transaction ID</span>
                                <span className="font-mono text-xs truncate ml-2" title={transactionId}>
                                    {transactionId.substring(0, 20)}...
                                </span>
                            </div>
                        )}

                        {transactionTime && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Waktu Pembayaran</span>
                                <span>{transactionTime}</span>
                            </div>
                        )} */}

                        {/* Payment Amount */}
                        <div className="flex justify-between font-medium text-green-800 rounded">
                            <span>Jumlah Dibayar</span>
                            <span>{formatCurrency(paymentAmount)}</span>
                        </div>

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
                <div className="p-4 border-t space-y-3 bg-gray-50">

                    {/* Edit Status Section */}
                    <div className="border rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-700">Status Transaksi</span>
                            {!editStatusMode ? (
                                <button
                                    onClick={() => { setEditStatusMode(true); setNewStatus(selectedTrx.status); setUpdateMsg(null); }}
                                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-900 text-white rounded hover:bg-green-800 transition-colors"
                                >
                                    <FaPen size={10} /> Ubah Status
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditStatusMode(false)}
                                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-300 text-gray-600 rounded hover:bg-gray-100"
                                    >
                                        <FaTimes size={10} /> Batal
                                    </button>
                                    <button
                                        onClick={handleSaveStatus}
                                        disabled={isUpdatingStatus || newStatus === selectedTrx.status}
                                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-green-900 text-white rounded hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUpdatingStatus ? (
                                            <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full" />
                                        ) : (
                                            <FaCheck size={10} />
                                        )}
                                        Simpan
                                    </button>
                                </div>
                            )}
                        </div>

                        {!editStatusMode ? (
                            <div className={`text-sm font-medium px-2 py-1 rounded w-fit ${currentStatusOption?.color || 'bg-gray-100 text-gray-600'}`}>
                                {currentStatusOption?.label || selectedTrx.status || 'Tidak diketahui'}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-1.5 mt-1">
                                {STATUS_OPTIONS.map(opt => (
                                    <label
                                        key={opt.value}
                                        className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer border transition-all ${newStatus === opt.value
                                                ? 'border-green-700 bg-green-50'
                                                : 'border-transparent hover:bg-gray-50'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="statusEdit"
                                            value={opt.value}
                                            checked={newStatus === opt.value}
                                            onChange={() => setNewStatus(opt.value)}
                                            className="accent-green-800"
                                        />
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${opt.color}`}>
                                            {opt.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* Feedback message */}
                        {updateMsg && (
                            <div className={`mt-2 text-xs px-3 py-2 rounded ${updateMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                                }`}>
                                {updateMsg.text}
                            </div>
                        )}
                    </div>

                    <PdfButton
                        targetId="receipt-pdf"
                        fileName={`Resi_${selectedTrx?.order_id || "transaksi"}.pdf`}
                        transactionData={selectedTrx}
                        formatDateTime={formatDateTime}
                        formatCurrency={formatCurrency}
                    />
                </div>
            </div>
        </div>
    );
};

export default TransactionModal;

