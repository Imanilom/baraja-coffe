import { useEffect, useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";

export default function PaymentDetailModal({ isOpen, onClose, paymentMethod, orders, formatCurrency }) {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Filter orders by payment method
    const filteredOrders = useMemo(() => {
        return orders.filter(order => order.paymentMethod === paymentMethod);
    }, [orders, paymentMethod]);

    // Paginate modal data
    const paginatedOrders = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredOrders.slice(startIndex, endIndex);
    }, [filteredOrders, currentPage]);

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Reset page when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentPage(1);
        }
    }, [isOpen, paymentMethod]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b bg-green-50">
                    <div>
                        <h2 className="text-xl font-semibold text-green-900">
                            Detail Transaksi - {paymentMethod}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Total {filteredOrders.length} transaksi
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FaTimes className="text-gray-500" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto">
                            <thead className="bg-gray-50">
                                <tr className="text-left text-[13px] text-gray-600">
                                    <th className="px-4 py-3 font-medium">Order ID</th>
                                    <th className="px-4 py-3 font-medium">Tanggal</th>
                                    <th className="px-4 py-3 font-medium">Kasir</th>
                                    <th className="px-4 py-3 font-medium">Pemesanan</th>
                                    <th className="px-4 py-3 font-medium">Outlet</th>
                                    <th className="px-4 py-3 font-medium">Item</th>
                                    <th className="px-4 py-3 font-medium text-right">Qty</th>
                                    <th className="px-4 py-3 font-medium text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-700">
                                {paginatedOrders.length > 0 ? (
                                    paginatedOrders.map((order, index) => {
                                        const item = order?.items?.[0];
                                        return (
                                            <tr key={order._id || index} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-3 font-mono text-xs">
                                                    {order.order_id || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {order.createdAt ? formatDate(order.createdAt) : '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {order.cashierId?.username || '-'}
                                                </td>
                                                <td className="px-4 py-3 lowercase">
                                                    {order.source || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {order?.outlet?.name || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="max-w-xs">
                                                        {order?.items && order.items.length > 0 ? (
                                                            <div className="space-y-1">
                                                                {order.items.map((orderItem, itemIndex) => (
                                                                    <div key={itemIndex} className="border-b border-gray-100 last:border-b-0 pb-1 last:pb-0">
                                                                        {/* Check if menuItem is array */}
                                                                        {Array.isArray(orderItem?.menuItem) ? (
                                                                            orderItem.menuItem.map((menu, menuIndex) => (
                                                                                <div key={menuIndex} className="mb-1">
                                                                                    <p className="font-medium text-sm">{menu?.name || '-'}</p>
                                                                                    {menu?.variant && (
                                                                                        <p className="text-xs text-gray-500">{menu.variant}</p>
                                                                                    )}
                                                                                </div>
                                                                            ))
                                                                        ) : (
                                                                            /* If menuItem is single object */
                                                                            <div>
                                                                                <p className="font-medium text-sm">{orderItem?.menuItem?.name || orderItem?.name || 'N/A'}</p>
                                                                                {orderItem?.menuItem?.variant && (
                                                                                    <p className="text-xs text-gray-500">{orderItem.menuItem.variant}</p>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                        <p className="text-xs text-blue-600">Qty: {orderItem?.quantity || 0}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="font-medium text-sm">N/A</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {order?.items?.reduce((total, orderItem) => total + (orderItem?.quantity || 0), 0) || 0}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">
                                                    {formatCurrency(order?.items?.reduce((total, orderItem) => total + (orderItem?.subtotal || 0), 0) || 0)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                                            Tidak ada transaksi ditemukan
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Modal Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-6 pt-4 border-t">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FaChevronLeft className="text-xs" /> Sebelumnya
                            </button>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                    Halaman {currentPage} dari {totalPages}
                                </span>
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Selanjutnya <FaChevronRight className="text-xs" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};