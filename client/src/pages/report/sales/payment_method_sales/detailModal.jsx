import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FaTimes, FaChevronLeft, FaChevronRight, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const PaymentDetailModal = ({ isOpen, onClose, paymentMethod, dateRange, outletId, formatCurrency, includeTax }) => {
    const [detailData, setDetailData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const [filterIssuer, setFilterIssuer] = useState('all');
    const [filterAcquirer, setFilterAcquirer] = useState('all');
    const [pagination, setPagination] = useState({ total: 0, pages: 0 });
    const ITEMS_PER_PAGE = 50;

    // Fetch detail transactions for specific payment method
    const fetchDetailTransactions = async (page = 1) => {
        if (!isOpen || !paymentMethod || !dateRange?.startDate || !dateRange?.endDate) return;

        setLoading(true);
        setError(null);

        try {
            const params = {
                startDate: new Date(dateRange.startDate).toISOString().split('T')[0],
                endDate: new Date(dateRange.endDate).toISOString().split('T')[0],
                paymentMethod: paymentMethod === 'Pembayaran Tidak Terdeteksi / Null' ? 'null' : paymentMethod,
                includeTax: includeTax.toString(),
                page: page,
                limit: ITEMS_PER_PAGE
            };

            if (outletId) {
                params.outletId = outletId;
            }

            const response = await axios.get('/api/report/sales-report/payment-detail', { params });

            if (response.data?.success && response.data?.data) {
                setDetailData(response.data.data.payments || []);
                setPagination(response.data.data.pagination || { total: 0, pages: 0 });
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
            fetchDetailTransactions(1);
        }
    }, [isOpen, paymentMethod, dateRange, outletId, includeTax]);

    // Handle page change
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        fetchDetailTransactions(newPage);
    };

    // Get unique issuers and acquirers for filter options (from current batch)
    const uniqueIssuers = useMemo(() => {
        const issuers = [...new Set(detailData.map(order => order.issuer).filter(Boolean))];
        return issuers.sort();
    }, [detailData]);

    const uniqueAcquirers = useMemo(() => {
        const acquirers = [...new Set(detailData.map(order => order.acquirer).filter(Boolean))];
        return acquirers.sort();
    }, [detailData]);

    // Filter data based on selected filters (client-side for the current page)
    const filteredData = useMemo(() => {
        return detailData.filter(order => {
            const matchIssuer = filterIssuer === 'all' || order.issuer === filterIssuer;
            const matchAcquirer = filterAcquirer === 'all' || order.acquirer === filterAcquirer;
            return matchIssuer && matchAcquirer;
        });
    }, [detailData, filterIssuer, filterAcquirer]);

    const totalPages = pagination.pages;

    // Summary calculations (for current page)
    const summary = useMemo(() => {
        return filteredData.reduce((acc, order) => {
            acc.totalTransactions += 1;
            acc.totalAmount += order.total;
            acc.totalDiscount += order.discount;
            acc.totalTax += order.tax;
            acc.totalServiceCharge += order.serviceCharge;
            acc.totalSubtotal += order.subtotal;
            return acc;
        }, {
            totalTransactions: 0,
            totalAmount: 0,
            totalDiscount: 0,
            totalTax: 0,
            totalServiceCharge: 0,
            totalSubtotal: 0
        });
    }, [filteredData]);

    // Export to Excel (All data for current view)
    const exportToExcel = () => {
        setIsExporting(true);
        try {
            const dateRangeText = dateRange && dateRange.startDate && dateRange.endDate
                ? `${new Date(dateRange.startDate).toLocaleDateString('id-ID')} - ${new Date(dateRange.endDate).toLocaleDateString('id-ID')}`
                : 'Semua Tanggal';

            const taxLabel = includeTax ? 'Gross (Dengan Pajak)' : 'Nett (Tanpa Pajak)';

            const rows = [
                { col1: `Detail Transaksi - ${paymentMethod}`, col2: '', col3: '', col4: '', col5: '', col6: '', col7: '', col8: '', col9: '', col10: '', col11: '' },
                { col1: `Jenis Laporan: ${taxLabel}`, col2: '', col3: '', col4: '', col5: '', col6: '', col7: '', col8: '', col9: '', col10: '', col11: '' },
                { col1: 'Periode', col2: dateRangeText, col3: '', col4: '', col5: '', col6: '', col7: '', col8: '', col9: '', col10: '', col11: '' },
                { col1: '', col2: '', col3: '', col4: '', col5: '', col6: '', col7: '', col8: '', col9: '', col10: '', col11: '' },
                { col1: 'Order ID', col2: 'Tanggal', col3: 'Outlet', col4: 'Issuer/Bank', col5: 'Acquirer', col6: 'Items', col7: 'Subtotal', col8: 'Diskon', col9: 'Pajak', col10: 'Service', col11: 'Total' }
            ];

            filteredData.forEach(order => {
                rows.push({
                    col1: order.order_id,
                    col2: new Date(order.createdAt).toLocaleString('id-ID'),
                    col3: order.outlet?.name || '-',
                    col4: order.issuer || '-',
                    col5: order.acquirer || '-',
                    col6: order.itemsCount,
                    col7: order.subtotal,
                    col8: order.discount,
                    col9: order.tax,
                    col10: order.serviceCharge,
                    col11: order.total
                });
            });

            // Add summary
            rows.push({ col1: '', col2: '', col3: '', col4: '', col5: '', col6: '', col7: '', col8: '', col9: '', col10: '', col11: '' });
            rows.push({
                col1: 'TOTAL (Halaman Ini)',
                col2: '',
                col3: '',
                col4: '',
                col5: '',
                col6: `${summary.totalTransactions} Transaksi`,
                col7: summary.totalSubtotal,
                col8: summary.totalDiscount,
                col9: summary.totalTax,
                col10: summary.totalServiceCharge,
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
                { wch: 15 },  // Pajak
                { wch: 15 },  // Service
                { wch: 15 }   // Total
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Detail');

            const filename = `Detail_${paymentMethod.replace(/\s+/g, '_')}_${includeTax ? 'Gross' : 'Nett'}_${new Date().getTime()}.xlsx`;
            XLSX.writeFile(wb, filename);
        } catch (err) {
            console.error('Error exporting:', err);
            alert('Gagal mengekspor data');
        } finally {
            setIsExporting(false);
        }
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                            Detail Transaksi - <span className="text-green-900">{paymentMethod}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${includeTax ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {includeTax ? 'Gross (Inc. Tax)' : 'Nett (Exc. Tax)'}
                            </span>
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {dateRange?.startDate && dateRange?.endDate && (
                                `${new Date(dateRange.startDate).toLocaleDateString('id-ID')} - ${new Date(dateRange.endDate).toLocaleDateString('id-ID')}`
                            )}
                        </p>
                    </div>
                    <div className="flex gap-2 text-sm font-medium">
                        <button
                            onClick={exportToExcel}
                            disabled={isExporting || filteredData.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-green-900 text-white rounded hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExporting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                    Mengekspor...
                                </>
                            ) : (
                                <>
                                    <FaDownload /> Ekspor Halaman Ini
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 p-2 border rounded"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>
                </div>

                {/* Summary & Filters */}
                <div className="bg-gray-50 border-b">
                    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Filters */}
                        <div className="flex flex-wrap gap-4 items-center">
                            {(uniqueIssuers.length > 0 || uniqueAcquirers.length > 0) && (
                                <>
                                    {uniqueIssuers.length > 0 && (
                                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border">
                                            <label className="text-xs font-semibold text-gray-600">Issuer:</label>
                                            <select
                                                value={filterIssuer}
                                                onChange={(e) => setFilterIssuer(e.target.value)}
                                                className="bg-transparent text-sm focus:outline-none"
                                            >
                                                <option value="all">Semua</option>
                                                {uniqueIssuers.map(i => <option key={i} value={i}>{i}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    {uniqueAcquirers.length > 0 && (
                                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border">
                                            <label className="text-xs font-semibold text-gray-600">Acquirer:</label>
                                            <select
                                                value={filterAcquirer}
                                                onChange={(e) => setFilterAcquirer(e.target.value)}
                                                className="bg-transparent text-sm focus:outline-none"
                                            >
                                                <option value="all">Semua</option>
                                                {uniqueAcquirers.map(a => <option key={a} value={a}>{a}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-4 gap-3">
                            <div className="bg-white p-2 rounded border shadow-sm text-center">
                                <p className="text-[10px] uppercase text-gray-400 font-bold">Pajak</p>
                                <p className="text-sm font-bold text-blue-600">{formatCurrency(summary.totalTax)}</p>
                            </div>
                            <div className="bg-white p-2 rounded border shadow-sm text-center">
                                <p className="text-[10px] uppercase text-gray-400 font-bold">Service</p>
                                <p className="text-sm font-bold text-purple-600">{formatCurrency(summary.totalServiceCharge)}</p>
                            </div>
                            <div className="bg-white p-2 rounded border shadow-sm text-center">
                                <p className="text-[10px] uppercase text-gray-400 font-bold">Subtotal</p>
                                <p className="text-sm font-bold text-gray-700">{formatCurrency(summary.totalSubtotal)}</p>
                            </div>
                            <div className="bg-white p-2 rounded border shadow-sm text-center">
                                <p className="text-[10px] uppercase text-gray-400 font-bold">Total</p>
                                <p className="text-sm font-bold text-green-900">{formatCurrency(summary.totalAmount)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Table */}
                <div className="flex-1 overflow-auto p-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-900 border-t-transparent"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 py-12">
                            <p className="font-bold">{error}</p>
                            <button onClick={() => fetchDetailTransactions(currentPage)} className="mt-4 text-green-900 underline">Coba Lagi</button>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="text-center text-gray-400 py-12">Tidak ada data ditemukan.</div>
                    ) : (
                        <div className="overflow-x-auto rounded border">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 text-[11px] uppercase text-gray-500 font-bold tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 text-left">No</th>
                                        <th className="px-4 py-3 text-left">Order ID</th>
                                        <th className="px-4 py-3 text-left">Tanggal</th>
                                        <th className="px-4 py-3 text-left">Outlet</th>
                                        <th className="px-4 py-3 text-left">Detail Bayar</th>
                                        <th className="px-4 py-3 text-right">Subtotal</th>
                                        <th className="px-4 py-3 text-right text-red-500">Diskon</th>
                                        <th className="px-4 py-3 text-right text-blue-600">Pajak</th>
                                        <th className="px-4 py-3 text-right text-purple-600">Service</th>
                                        <th className="px-4 py-3 text-right text-green-900">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 text-[13px] text-gray-600">
                                    {filteredData.map((order, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                                            <td className="px-4 py-3 font-semibold text-gray-800">{order.order_id}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {new Date(order.createdAt).toLocaleDateString('id-ID')} <span className="text-gray-400 text-xs ml-1">{new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td className="px-4 py-3">{order.outlet?.name}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-xs">{order.issuer || 'Default'}</span>
                                                    {order.acquirer && <span className="text-[10px] text-gray-400">via {order.acquirer}</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">{formatCurrency(order.subtotal)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-red-500">-{formatCurrency(order.discount)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-blue-600">{formatCurrency(order.tax)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-purple-600">{formatCurrency(order.serviceCharge)}</td>
                                            <td className="px-4 py-3 text-right font-bold text-green-900 font-mono">{formatCurrency(order.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer Pagination */}
                <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-xs text-gray-500 font-medium">
                        Menampilkan <span className="text-gray-900 border px-1.5 py-0.5 rounded">{filteredData.length}</span> dari <span className="text-gray-900 font-bold">{pagination.total}</span> transaksi
                    </div>
                    {totalPages > 1 && (
                        <div className="flex gap-1.5 items-center">
                            <button
                                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded border bg-white hover:bg-gray-100 disabled:opacity-30 transition-colors"
                            >
                                <FaChevronLeft size={14} />
                            </button>
                            <div className="flex gap-1.5">{renderPageNumbers()}</div>
                            <button
                                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded border bg-white hover:bg-gray-100 disabled:opacity-30 transition-colors"
                            >
                                <FaChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentDetailModal;