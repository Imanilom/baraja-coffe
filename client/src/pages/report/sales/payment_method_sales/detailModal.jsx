import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FaTimes, FaChevronLeft, FaChevronRight, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const PaymentDetailModal = ({ isOpen, onClose, paymentMethod, dateRange, outletId, formatCurrency }) => {
    const [detailData, setDetailData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const [filterIssuer, setFilterIssuer] = useState('all');
    const [filterAcquirer, setFilterAcquirer] = useState('all');
    const ITEMS_PER_PAGE = 20;

    // Fetch detail transactions for specific payment method
    const fetchDetailTransactions = async () => {
        if (!isOpen || !paymentMethod || !dateRange?.startDate || !dateRange?.endDate) return;

        setLoading(true);
        setError(null);

        try {
            const params = {
                startDate: new Date(dateRange.startDate).toISOString().split('T')[0],
                endDate: new Date(dateRange.endDate).toISOString().split('T')[0],
                groupBy: 'daily'
            };

            if (outletId) {
                params.outletId = outletId;
            }

            const response = await axios.get('/api/report/sales-report', { params });

            if (response.data?.success && response.data?.data) {
                const reportData = response.data.data;

                // Find the specific payment method data
                const paymentMethodData = reportData.paymentMethods?.find(
                    pm => pm.displayName === paymentMethod || pm.method === paymentMethod
                );

                console.log('Payment Method Data:', paymentMethodData);

                if (paymentMethodData && paymentMethodData.orders && paymentMethodData.orders.length > 0) {
                    // Fetch order details for these order IDs
                    const orderDetailsPromises = paymentMethodData.orders.map(async (orderId) => {
                        try {
                            const response = await axios.get(`/api/orders?order_id=${orderId}`);

                            console.log(`Response for order ${orderId}:`, response.data);

                            // Handle different response structures
                            if (response.data) {
                                // If data is array, find the matching order
                                if (Array.isArray(response.data)) {
                                    return response.data.find(order => order.order_id === orderId);
                                }
                                // If data has a data property that's an array
                                if (response.data.data && Array.isArray(response.data.data)) {
                                    return response.data.data.find(order => order.order_id === orderId);
                                }
                                // If data is single object
                                if (response.data.order_id === orderId) {
                                    return response.data;
                                }
                                // If data.data is single object
                                if (response.data.data && response.data.data.order_id === orderId) {
                                    return response.data.data;
                                }
                            }
                            return null;
                        } catch (err) {
                            console.error(`Error fetching order ${orderId}:`, err);
                            return null;
                        }
                    });

                    const orderDetails = await Promise.all(orderDetailsPromises);

                    console.log('Order details fetched:', orderDetails);

                    // Get payment method details from the response
                    const paymentDetailsMap = {};
                    if (paymentMethodData.details && Array.isArray(paymentMethodData.details)) {
                        paymentMethodData.details.forEach(detail => {
                            paymentDetailsMap[detail.order_id] = detail;
                        });
                    }

                    console.log('Payment details map:', paymentDetailsMap);

                    // Filter out failed requests and extract order data
                    const orders = orderDetails
                        .filter(order => order !== null)
                        .map(order => {
                            const orderId = order.order_id || order._id;
                            const paymentDetail = paymentDetailsMap[orderId] || {};

                            // Extract issuer and acquirer separately
                            let issuer = '';
                            let acquirer = '';

                            if (paymentDetail.issuer) {
                                issuer = paymentDetail.issuer;
                            } else if (paymentDetail.bankName) {
                                issuer = paymentDetail.bankName;
                            } else if (paymentDetail.ewalletProvider) {
                                issuer = paymentDetail.ewalletProvider;
                            } else if (order.paymentDetails?.issuer) {
                                issuer = order.paymentDetails.issuer;
                            } else if (order.paymentDetails?.bankName) {
                                issuer = order.paymentDetails.bankName;
                            } else if (order.paymentDetails?.provider) {
                                issuer = order.paymentDetails.provider;
                            }

                            if (paymentDetail.acquirer) {
                                acquirer = paymentDetail.acquirer;
                            } else if (order.paymentDetails?.acquirer) {
                                acquirer = order.paymentDetails.acquirer;
                            }

                            return {
                                orderId: orderId,
                                date: order.createdAt,
                                outlet: order.outlet?.name || 'N/A',
                                items: order.items?.length || 0,
                                subtotal: order.subtotal || 0,
                                tax: order.totalTax || 0,
                                serviceCharge: order.totalServiceFee || 0,
                                discount: (order.discounts?.autoPromoDiscount || 0) +
                                    (order.discounts?.manualDiscount || 0) +
                                    (order.discounts?.voucherDiscount || 0),
                                total: order.grandTotal || 0,
                                paymentMethod: order.paymentMethod || paymentMethod,
                                issuer: issuer,
                                acquirer: acquirer,
                                status: order.status || 'N/A'
                            };
                        });

                    console.log('Processed orders:', orders);
                    setDetailData(orders);
                } else {
                    console.log('No orders found for this payment method');
                    setDetailData([]);
                }
            }
        } catch (err) {
            console.error('Error fetching detail transactions:', err);
            setError('Gagal memuat detail transaksi');
            setDetailData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setCurrentPage(1);
            setFilterIssuer('all');
            setFilterAcquirer('all');
            fetchDetailTransactions();
        }
    }, [isOpen, paymentMethod, dateRange, outletId]);

    // Get unique issuers and acquirers for filter options
    const uniqueIssuers = useMemo(() => {
        const issuers = [...new Set(detailData.map(order => order.issuer).filter(Boolean))];
        return issuers.sort();
    }, [detailData]);

    const uniqueAcquirers = useMemo(() => {
        const acquirers = [...new Set(detailData.map(order => order.acquirer).filter(Boolean))];
        return acquirers.sort();
    }, [detailData]);

    // Filter data based on selected filters
    const filteredData = useMemo(() => {
        return detailData.filter(order => {
            const matchIssuer = filterIssuer === 'all' || order.issuer === filterIssuer;
            const matchAcquirer = filterAcquirer === 'all' || order.acquirer === filterAcquirer;
            return matchIssuer && matchAcquirer;
        });
    }, [detailData, filterIssuer, filterAcquirer]);

    // Pagination
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, endIndex);
    }, [filteredData, currentPage]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    // Summary calculations
    const summary = useMemo(() => {
        return filteredData.reduce((acc, order) => {
            acc.totalTransactions += 1;
            acc.totalAmount += order.total;
            acc.totalDiscount += order.discount;
            acc.totalTax += order.tax;
            acc.totalServiceCharge += order.serviceCharge;
            return acc;
        }, {
            totalTransactions: 0,
            totalAmount: 0,
            totalDiscount: 0,
            totalTax: 0,
            totalServiceCharge: 0
        });
    }, [filteredData]);

    // Export to Excel
    const exportToExcel = () => {
        setIsExporting(true);
        try {
            const dateRangeText = dateRange && dateRange.startDate && dateRange.endDate
                ? `${new Date(dateRange.startDate).toLocaleDateString('id-ID')} - ${new Date(dateRange.endDate).toLocaleDateString('id-ID')}`
                : 'Semua Tanggal';

            const rows = [
                { col1: `Detail Transaksi - ${paymentMethod}`, col2: '', col3: '', col4: '', col5: '', col6: '', col7: '', col8: '', col9: '', col10: '', col11: '' },
                { col1: '', col2: '', col3: '', col4: '', col5: '', col6: '', col7: '', col8: '', col9: '', col10: '', col11: '' },
                { col1: 'Periode', col2: dateRangeText, col3: '', col4: '', col5: '', col6: '', col7: '', col8: '', col9: '', col10: '', col11: '' },
                { col1: '', col2: '', col3: '', col4: '', col5: '', col6: '', col7: '', col8: '', col9: '', col10: '', col11: '' },
                { col1: 'Order ID', col2: 'Tanggal', col3: 'Outlet', col4: 'Issuer/Bank', col5: 'Acquirer', col6: 'Items', col7: 'Subtotal', col8: 'Diskon', col9: 'Service Charge', col10: 'Pajak', col11: 'Total' }
            ];

            filteredData.forEach(order => {
                rows.push({
                    col1: order.orderId,
                    col2: new Date(order.date).toLocaleString('id-ID'),
                    col3: order.outlet,
                    col4: order.issuer || '-',
                    col5: order.acquirer || '-',
                    col6: order.items,
                    col7: order.subtotal,
                    col8: order.discount,
                    col9: order.serviceCharge,
                    col10: order.tax,
                    col11: order.total
                });
            });

            // Add summary
            rows.push({ col1: '', col2: '', col3: '', col4: '', col5: '', col6: '', col7: '', col8: '', col9: '', col10: '', col11: '' });
            rows.push({
                col1: 'TOTAL',
                col2: '',
                col3: '',
                col4: '',
                col5: '',
                col6: `${summary.totalTransactions} Transaksi`,
                col7: summary.totalAmount - summary.totalDiscount - summary.totalTax - summary.totalServiceCharge,
                col8: summary.totalDiscount,
                col9: summary.totalServiceCharge,
                col10: summary.totalTax,
                col11: summary.totalAmount
            });

            const ws = XLSX.utils.json_to_sheet(rows, {
                header: ['col1', 'col2', 'col3', 'col4', 'col5', 'col6', 'col7', 'col8', 'col9', 'col10', 'col11'],
                skipHeader: true
            });

            ws['!cols'] = [
                { wch: 20 },  // Order ID
                { wch: 20 },  // Tanggal
                { wch: 20 },  // Outlet
                { wch: 20 },  // Issuer/Bank
                { wch: 20 },  // Acquirer
                { wch: 10 },  // Items
                { wch: 15 },  // Subtotal
                { wch: 15 },  // Diskon
                { wch: 15 },  // Service Charge
                { wch: 15 },  // Pajak
                { wch: 15 }   // Total
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, paymentMethod);

            const filename = `Detail_${paymentMethod.replace(/\s+/g, '_')}_${new Date().getTime()}.xlsx`;
            XLSX.writeFile(wb, filename);
        } catch (err) {
            console.error('Error exporting:', err);
            alert('Gagal mengekspor data');
        } finally {
            setIsExporting(false);
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const renderPageNumbers = () => {
        let pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            pages.push(
                <button
                    key={1}
                    onClick={() => handlePageChange(1)}
                    className="px-3 py-1 border border-green-900 rounded text-green-900 hover:bg-green-900 hover:text-white"
                >
                    1
                </button>
            );
            if (startPage > 2) {
                pages.push(<span key="ellipsis1" className="px-2 text-green-900">...</span>);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-1 border border-green-900 rounded ${currentPage === i
                        ? "bg-green-900 text-white"
                        : "text-green-900 hover:bg-green-900 hover:text-white"
                        }`}
                >
                    {i}
                </button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(<span key="ellipsis2" className="px-2 text-green-900">...</span>);
            }
            pages.push(
                <button
                    key={totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className="px-3 py-1 border border-green-900 rounded text-green-900 hover:bg-green-900 hover:text-white"
                >
                    {totalPages}
                </button>
            );
        }

        return pages;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            Detail Transaksi - {paymentMethod}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {dateRange?.startDate && dateRange?.endDate && (
                                `${new Date(dateRange.startDate).toLocaleDateString('id-ID')} - ${new Date(dateRange.endDate).toLocaleDateString('id-ID')}`
                            )}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={exportToExcel}
                            disabled={isExporting || filteredData.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-green-900 text-white rounded hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            {isExporting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                    Mengekspor...
                                </>
                            ) : (
                                <>
                                    <FaDownload /> Ekspor
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 p-2"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                {!loading && detailData.length > 0 && (
                    <>
                        {/* Filter Section */}
                        {(uniqueIssuers.length > 0 || uniqueAcquirers.length > 0) && (
                            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-b">
                                <div className="flex flex-wrap gap-4 items-center">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-green-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                        </svg>
                                        <span className="text-sm font-semibold text-gray-700">Filter Data:</span>
                                    </div>

                                    {uniqueIssuers.length > 0 && (
                                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
                                            <label className="text-sm font-medium text-gray-600">Issuer/Bank:</label>
                                            <select
                                                value={filterIssuer}
                                                onChange={(e) => {
                                                    setFilterIssuer(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                            >
                                                <option value="all">Semua Issuer</option>
                                                {uniqueIssuers.map(issuer => (
                                                    <option key={issuer} value={issuer}>{issuer}</option>
                                                ))}
                                            </select>
                                            {filterIssuer !== 'all' && (
                                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                                                    {filteredData.filter(o => o.issuer === filterIssuer).length}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {uniqueAcquirers.length > 0 && (
                                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
                                            <label className="text-sm font-medium text-gray-600">Acquirer:</label>
                                            <select
                                                value={filterAcquirer}
                                                onChange={(e) => {
                                                    setFilterAcquirer(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                            >
                                                <option value="all">Semua Acquirer</option>
                                                {uniqueAcquirers.map(acquirer => (
                                                    <option key={acquirer} value={acquirer}>{acquirer}</option>
                                                ))}
                                            </select>
                                            {filterAcquirer !== 'all' && (
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                                                    {filteredData.filter(o => o.acquirer === filterAcquirer).length}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {(filterIssuer !== 'all' || filterAcquirer !== 'all') && (
                                        <button
                                            onClick={() => {
                                                setFilterIssuer('all');
                                                setFilterAcquirer('all');
                                                setCurrentPage(1);
                                            }}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Reset
                                        </button>
                                    )}

                                    <div className="ml-auto flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="text-sm font-medium text-gray-700">
                                            {filteredData.length} dari {detailData.length} transaksi
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Summary Cards */}
                        <div className="grid grid-cols-5 gap-4 p-6 bg-gray-50 border-b">
                            <div className="bg-white p-3 rounded shadow-sm">
                                <p className="text-xs text-gray-500">Total Transaksi</p>
                                <p className="text-lg font-bold text-green-900">{summary.totalTransactions}</p>
                            </div>
                            <div className="bg-white p-3 rounded shadow-sm">
                                <p className="text-xs text-gray-500">Total Diskon</p>
                                <p className="text-lg font-bold text-red-600">{formatCurrency(summary.totalDiscount)}</p>
                            </div>
                            <div className="bg-white p-3 rounded shadow-sm">
                                <p className="text-xs text-gray-500">Service Charge</p>
                                <p className="text-lg font-bold text-purple-600">{formatCurrency(summary.totalServiceCharge)}</p>
                            </div>
                            <div className="bg-white p-3 rounded shadow-sm">
                                <p className="text-xs text-gray-500">Total Pajak</p>
                                <p className="text-lg font-bold text-blue-600">{formatCurrency(summary.totalTax)}</p>
                            </div>
                            <div className="bg-white p-3 rounded shadow-sm">
                                <p className="text-xs text-gray-500">Total Pendapatan</p>
                                <p className="text-lg font-bold text-green-900">{formatCurrency(summary.totalAmount)}</p>
                            </div>
                        </div>
                    </>
                )}

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-green-900 flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-900"></div>
                                <p>Memuat detail transaksi...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-red-500 text-center">
                                <p className="text-lg font-semibold mb-2">Error</p>
                                <p>{error}</p>
                                <button
                                    onClick={fetchDetailTransactions}
                                    className="mt-4 bg-green-900 text-white text-sm px-4 py-2 rounded"
                                >
                                    Coba Lagi
                                </button>
                            </div>
                        </div>
                    ) : detailData.length === 0 ? (
                        <div className="flex justify-center items-center h-64">
                            <p className="text-gray-500">Tidak ada transaksi ditemukan</p>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-center">
                                <p className="text-gray-500 mb-2">Tidak ada transaksi sesuai filter</p>
                                <button
                                    onClick={() => {
                                        setFilterIssuer('all');
                                        setFilterAcquirer('all');
                                        setCurrentPage(1);
                                    }}
                                    className="text-sm text-green-900 hover:underline"
                                >
                                    Reset Filter
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-auto text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outlet</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issuer/Bank</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acquirer</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Diskon</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Service</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pajak</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedData.map((order, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-gray-700">
                                                    {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 font-medium">
                                                    {order.orderId}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    {new Date(order.date).toLocaleString('id-ID', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    {order.outlet}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 text-sm">
                                                    {order.issuer ? (
                                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                                                            {order.issuer}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 text-sm">
                                                    {order.acquirer ? (
                                                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">
                                                            {order.acquirer}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-700">
                                                    {order.items}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-700">
                                                    {formatCurrency(order.subtotal)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-red-600">
                                                    {formatCurrency(order.discount)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-700">
                                                    {formatCurrency(order.serviceCharge)}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-700">
                                                    {formatCurrency(order.tax)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-green-900">
                                                    {formatCurrency(order.total)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-between items-center mt-6">
                                    <button
                                        onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center gap-2 px-3 py-1 border rounded bg-green-900 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        <FaChevronLeft /> Sebelumnya
                                    </button>

                                    <div className="flex gap-2">{renderPageNumbers()}</div>

                                    <button
                                        onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center gap-2 px-3 py-1 border rounded bg-green-900 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        Selanjutnya <FaChevronRight />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentDetailModal;