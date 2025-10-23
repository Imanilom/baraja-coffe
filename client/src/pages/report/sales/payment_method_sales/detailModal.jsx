import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTimes, FaSpinner, FaInfoCircle } from "react-icons/fa";

const PaymentDetailModal = ({ isOpen, onClose, paymentMethod, dateRange, outletId, formatCurrency }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [detailData, setDetailData] = useState(null);

    useEffect(() => {
        if (isOpen && paymentMethod && dateRange?.startDate && dateRange?.endDate) {
            fetchPaymentDetail();
        }
    }, [isOpen, paymentMethod, dateRange, outletId]);

    const fetchPaymentDetail = async () => {
        setLoading(true);
        setError(null);
        try {
            const startDate = new Date(dateRange.startDate).toISOString().split('T')[0];
            const endDate = new Date(dateRange.endDate).toISOString().split('T')[0];

            let url = `/api/report/sales-report/payment-detail?method=${encodeURIComponent(paymentMethod)}&startDate=${startDate}&endDate=${endDate}`;
            if (outletId) {
                url += `&outletId=${outletId}`;
            }

            const response = await axios.get(url);

            if (response.data?.success && response.data?.data) {
                setDetailData(response.data.data);
            } else {
                setError("Invalid data format received");
            }
        } catch (err) {
            console.error("Error fetching payment detail:", err);
            setError(err.response?.data?.message || "Failed to load payment details");
            setDetailData(null);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getIssuerInfo = (transaction) => {
        const issuer = transaction.raw_response?.issuer || '-';
        const acquirer = transaction.raw_response?.acquirer || '-';
        return { issuer, acquirer };
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-green-900">
                            Detail Transaksi - {paymentMethod}
                        </h2>
                        {detailData && (
                            <p className="text-sm text-gray-500 mt-1">
                                Periode: {new Date(detailData.period.startDate).toLocaleDateString('id-ID')} - {new Date(detailData.period.endDate).toLocaleDateString('id-ID')}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 p-2"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <FaSpinner className="animate-spin text-4xl text-green-900 mb-4" />
                            <p className="text-gray-600">Memuat data transaksi...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="text-red-500 text-center">
                                <FaInfoCircle className="text-4xl mb-4 mx-auto" />
                                <p className="text-lg font-semibold mb-2">Error</p>
                                <p>{error}</p>
                                <button
                                    onClick={fetchPaymentDetail}
                                    className="mt-4 bg-green-900 text-white text-sm px-4 py-2 rounded hover:bg-green-800"
                                >
                                    Coba Lagi
                                </button>
                            </div>
                        </div>
                    ) : detailData ? (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <p className="text-sm text-gray-600 mb-1">Total Transaksi</p>
                                    <p className="text-2xl font-bold text-green-900">
                                        {detailData.totalTransactions}
                                    </p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <p className="text-sm text-gray-600 mb-1">Total Pendapatan</p>
                                    <p className="text-2xl font-bold text-blue-900">
                                        {formatCurrency(detailData.totalAmount)}
                                    </p>
                                </div>
                            </div>

                            {/* Transactions Table */}
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="min-w-full table-auto">
                                    <thead className="bg-gray-50">
                                        <tr className="text-left text-xs text-gray-600">
                                            <th className="px-4 py-3 font-semibold">Order ID</th>
                                            <th className="px-4 py-3 font-semibold">Transaction ID</th>
                                            <th className="px-4 py-3 font-semibold">Tanggal</th>
                                            <th className="px-4 py-3 font-semibold">Customer</th>
                                            <th className="px-4 py-3 font-semibold">Tipe Order</th>
                                            <th className="px-4 py-3 font-semibold">Meja/Take</th>
                                            {paymentMethod.toLowerCase() === 'qris' && (
                                                <>
                                                    <th className="px-4 py-3 font-semibold">Issuer</th>
                                                    <th className="px-4 py-3 font-semibold">Acquirer</th>
                                                </>
                                            )}
                                            <th className="px-4 py-3 font-semibold text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {detailData.transactions.length > 0 ? (
                                            detailData.transactions.map((transaction, index) => {
                                                const { issuer, acquirer } = getIssuerInfo(transaction);
                                                return (
                                                    <tr key={transaction._id} className="border-t hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-medium text-green-900">
                                                            {transaction.order_id}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600 text-xs font-mono">
                                                            {transaction.transaction_id?.substring(0, 20)}...
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">
                                                            {formatDate(transaction.createdAt)}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-700">
                                                            {transaction.order?.user || '-'}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${transaction.order?.orderType === 'Dine-In'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : transaction.order?.orderType === 'Take Away'
                                                                        ? 'bg-orange-100 text-orange-800'
                                                                        : 'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {transaction.order?.orderType || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">
                                                            {transaction.order?.tableNumber || '-'}
                                                        </td>
                                                        {paymentMethod.toLowerCase() === 'qris' && (
                                                            <>
                                                                <td className="px-4 py-3">
                                                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                                                        {issuer}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                                                                        {acquirer}
                                                                    </span>
                                                                </td>
                                                            </>
                                                        )}
                                                        <td className="px-4 py-3 text-right font-semibold text-gray-800">
                                                            {formatCurrency(transaction.amount)}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="9" className="px-4 py-12 text-center text-gray-500">
                                                    Tidak ada transaksi ditemukan
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {detailData.transactions.length > 0 && (
                                        <tfoot className="bg-gray-50 border-t-2">
                                            <tr className="font-semibold">
                                                <td colSpan={paymentMethod.toLowerCase() === 'qris' ? 8 : 6}
                                                    className="px-4 py-3 text-right text-gray-700">
                                                    Total:
                                                </td>
                                                <td className="px-4 py-3 text-right text-green-900 text-lg">
                                                    {formatCurrency(detailData.totalAmount)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>

                            {/* Additional Info for QRIS */}
                            {paymentMethod.toLowerCase() === 'qris' && detailData.transactions.length > 0 && (
                                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                        <FaInfoCircle />
                                        Informasi QRIS
                                    </h3>
                                    <div className="text-sm text-blue-800 space-y-1">
                                        <p><span className="font-medium">Issuer:</span> Bank/E-wallet yang digunakan customer</p>
                                        <p><span className="font-medium">Acquirer:</span> Payment gateway yang memproses transaksi</p>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-center py-20 text-gray-500">
                            Tidak ada data tersedia
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentDetailModal;