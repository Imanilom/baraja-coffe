import React, { useState, useEffect, useMemo } from 'react';
import axios from '@/lib/axios';
import { FaTimes, FaChevronLeft, FaChevronRight, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const PaymentDetailModal = ({ isOpen, onClose, paymentMethod, overallSummary, dateRange, outletId, formatCurrency, includeTax }) => {
    const [detailData, setDetailData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const [filterIssuer, setFilterIssuer] = useState('all');
    const [filterAcquirer, setFilterAcquirer] = useState('all');
    const [pagination, setPagination] = useState({ total: 0, pages: 0 });
    const [apiSummary, setApiSummary] = useState(null);
    const ITEMS_PER_PAGE = 50;

    // Helper to format date without UTC shift
    const formatDateLocal = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Fetch detail transactions for specific payment method
    const fetchDetailTransactions = async (page = 1) => {
        if (!isOpen || !paymentMethod || !dateRange?.startDate || !dateRange?.endDate) return;

        setLoading(true);
        setError(null);

        try {
            const params = {
                startDate: formatDateLocal(dateRange.startDate),
                endDate: formatDateLocal(dateRange.endDate),
                paymentMethod: paymentMethod === 'Pembayaran Tidak Terdeteksi / Null' ? 'null' : paymentMethod,
                includeTax: includeTax.toString(),
                status: 'Completed',
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
                setApiSummary(response.data.data.summary || null);
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
    const localSummary = useMemo(() => {
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
            totalTax: 0,
            totalServiceCharge: 0,
            totalSubtotal: 0,
            totalDiscount: 0,
            totalAmount: 0 // Will be derived
        });
    }, [filteredData]);

    // Simplified display summary logic
    const isFiltered = filterIssuer !== 'all' || filterAcquirer !== 'all';
    // Final summary for display - prioritized from breakdown row/API
    const displaySummary = useMemo(() => {
        // If filtered locally, always use local summary
        if (isFiltered) return localSummary;

        // Merge Row data (overallSummary) with Detail API data (apiSummary)
        const row = overallSummary || {};
        const api = apiSummary || {};

        const totalTransactions = row.count || api.totalTransactions || api.total_transactions || api.count || pagination.total || 0;
        const totalTax = row.tax || api.totalTax || api.total_tax || 0;
        const totalServiceCharge = row.serviceCharge || api.totalServiceCharge || api.total_service_fee || 0;
        const totalSubtotal = row.subtotal || api.totalSubtotal || api.total_subtotal || 0;
        const totalDiscount = row.discount || api.totalDiscount || api.total_discount || 0;

        return {
            totalTransactions,
            totalTax,
            totalServiceCharge,
            totalSubtotal,
            totalDiscount,
            totalAmount: totalSubtotal + (includeTax ? (totalTax + totalServiceCharge) : 0)
        };
    }, [isFiltered, overallSummary, apiSummary, localSummary, pagination.total, includeTax]);

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
                col6: `${localSummary.totalTransactions} Transaksi`,
                col7: localSummary.totalSubtotal,
                col8: localSummary.totalDiscount,
                col9: localSummary.totalTax,
                col10: localSummary.totalServiceCharge,
                col11: localSummary.totalAmount
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
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            pages.push(
                <button key={1} onClick={() => handlePageChange(1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition-all text-[13px] font-medium bg-white">1</button>
            );
            if (startPage > 2) pages.push(<span key="ellipsis1" className="px-1 text-gray-400">...</span>);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all text-[13px] font-medium ${currentPage === i ? "bg-primary border-primary text-white shadow-sm shadow-primary/20" : "bg-white border-gray-200 text-gray-600 hover:border-primary hover:text-primary"}`}
                >
                    {i}
                </button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pages.push(<span key="ellipsis2" className="px-1 text-gray-400">...</span>);
            pages.push(
                <button key={totalPages} onClick={() => handlePageChange(totalPages)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition-all text-[13px] font-medium bg-white">{totalPages}</button>
            );
        }

        return pages;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-50 bg-gray-50/30">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                            Detail Transaksi - <span className="text-primary">{paymentMethod}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${includeTax ? 'bg-primary/10 text-primary' : 'bg-orange-100 text-orange-600'}`}>
                                {includeTax ? 'Gross (Inc. Tax)' : 'Nett (Exc. Tax)'}
                            </span>
                        </h2>
                        <div className="flex items-center gap-2 mt-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                            <p className="text-sm font-medium text-gray-400">
                                {dateRange?.startDate && dateRange?.endDate && (
                                    `${new Date(dateRange.startDate).toLocaleDateString('id-ID')} - ${new Date(dateRange.endDate).toLocaleDateString('id-ID')}`
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 text-sm font-medium">
                        <button
                            onClick={exportToExcel}
                            disabled={isExporting || filteredData.length === 0}
                            className="bg-primary hover:bg-primary/90 text-white text-[13px] px-5 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95"
                        >
                            {isExporting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                    Mengekspor...
                                </>
                            ) : (
                                <>
                                    <FaDownload /> Ekspor Excel
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>
                </div>

                {/* Summary & Filters */}
                <div className="bg-gray-50/50 border-b border-gray-100">
                    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Filters */}
                        <div className="flex flex-wrap gap-3 items-center">
                            {(uniqueIssuers.length > 0 || uniqueAcquirers.length > 0) && (
                                <>
                                    {uniqueIssuers.length > 0 && (
                                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Issuer</label>
                                            <select
                                                value={filterIssuer}
                                                onChange={(e) => setFilterIssuer(e.target.value)}
                                                className="bg-transparent text-[13px] font-bold text-gray-700 focus:outline-none cursor-pointer pr-4"
                                            >
                                                <option value="all">SEMUA</option>
                                                {uniqueIssuers.map(i => <option key={i} value={i}>{i.toUpperCase()}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    {uniqueAcquirers.length > 0 && (
                                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acquirer</label>
                                            <select
                                                value={filterAcquirer}
                                                onChange={(e) => setFilterAcquirer(e.target.value)}
                                                className="bg-transparent text-[13px] font-bold text-gray-700 focus:outline-none cursor-pointer pr-4"
                                            >
                                                <option value="all">SEMUA</option>
                                                {uniqueAcquirers.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm group hover:border-blue-200 transition-all">
                                <p className="text-[9px] uppercase text-gray-400 font-black tracking-widest mb-1">Pajak (PB1)</p>
                                <p className="text-sm font-extrabold text-blue-600 group-hover:scale-105 transition-transform origin-left">{formatCurrency(displaySummary.totalTax)}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm group hover:border-purple-200 transition-all">
                                <p className="text-[9px] uppercase text-gray-400 font-black tracking-widest mb-1">Service</p>
                                <p className="text-sm font-extrabold text-purple-600 group-hover:scale-105 transition-transform origin-left">{formatCurrency(displaySummary.totalServiceCharge)}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm group hover:border-gray-300 transition-all">
                                <p className="text-[9px] uppercase text-gray-400 font-black tracking-widest mb-1">Subtotal</p>
                                <p className="text-sm font-extrabold text-gray-700 group-hover:scale-105 transition-transform origin-left">{formatCurrency(displaySummary.totalSubtotal)}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-primary/20 shadow-md shadow-primary/5 group hover:shadow-lg transition-all">
                                <p className="text-[9px] uppercase text-gray-400 font-black tracking-widest mb-1">Total</p>
                                <p className="text-sm font-extrabold text-primary group-hover:scale-105 transition-transform origin-left">{formatCurrency(displaySummary.totalAmount)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Table */}
                <div className="flex-1 overflow-auto p-6 bg-white">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center h-64 gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Memuat detail...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center bg-red-50 p-8 rounded-2xl border border-red-100">
                            <p className="font-bold text-red-500 text-lg mb-2">Terjadi Kesalahan</p>
                            <p className="text-red-400 text-sm mb-6">{error}</p>
                            <button 
                                onClick={() => fetchDetailTransactions(currentPage)} 
                                className="bg-red-500 text-white px-6 py-2 rounded-xl text-[13px] font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                            >
                                COBA LAGI
                            </button>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl">
                            <p className="text-gray-300 font-bold uppercase tracking-widest text-xs">Tidak ada data ditemukan</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="min-w-full divide-y divide-gray-50">
                                <thead className="bg-gray-50/50">
                                    <tr className="text-[10px] uppercase text-gray-400 font-black tracking-[0.15em] border-b border-gray-100">
                                        <th className="px-6 py-4 text-left">No</th>
                                        <th className="px-6 py-4 text-left">Order ID</th>
                                        <th className="px-6 py-4 text-left">Waktu</th>
                                        <th className="px-6 py-4 text-left">Outlet</th>
                                        <th className="px-6 py-4 text-left">Metode</th>
                                        <th className="px-6 py-4 text-right">Subtotal</th>
                                        <th className="px-6 py-4 text-right text-red-400">Disc</th>
                                        <th className="px-6 py-4 text-right text-blue-400">Pajak</th>
                                        <th className="px-6 py-4 text-right text-purple-400">Svc</th>
                                        <th className="px-6 py-4 text-right text-primary">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-50 text-[13px] text-gray-600">
                                    {filteredData.map((order, index) => (
                                        <tr key={index} className="hover:bg-primary/5 transition-colors group">
                                            <td className="px-6 py-4 opacity-40">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                                            <td className="px-6 py-4 font-black text-gray-800 tracking-tight">{order.order_id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-bold text-gray-700">{new Date(order.createdAt).toLocaleDateString('id-ID')}</span>
                                                <span className="text-[10px] text-gray-300 ml-2 font-mono group-hover:text-primary transition-colors">{new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td className="px-6 py-4 font-medium">{order.outlet?.name}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col group-hover:transform group-hover:translate-x-1 transition-transform">
                                                    <span className="font-bold text-[11px] text-gray-700 uppercase tracking-tight">{order.issuer || 'Default'}</span>
                                                    {order.acquirer && <span className="text-[9px] text-gray-300 font-black uppercase tracking-tighter">via {order.acquirer}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-500">{formatCurrency(order.subtotal)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-red-500">-{formatCurrency(order.discount)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-blue-600">{formatCurrency(order.tax)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-purple-600">{formatCurrency(order.serviceCharge)}</td>
                                            <td className="px-6 py-4 text-right font-black text-primary text-sm">{formatCurrency(order.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer Pagination */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                        Menampilkan <span className="text-primary px-2 py-0.5 bg-primary/5 rounded-lg font-black">{filteredData.length}</span> / <span className="text-gray-900 font-black">{pagination.total}</span> Transaksi
                    </div>
                    {totalPages > 1 && (
                        <div className="flex gap-2 items-center">
                            <button
                                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                                disabled={currentPage === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-400 hover:text-primary hover:border-primary disabled:opacity-30 transition-all shadow-sm active:scale-95"
                            >
                                <FaChevronLeft size={10} />
                            </button>
                            <div className="flex gap-2">{renderPageNumbers()}</div>
                            <button
                                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-400 hover:text-primary hover:border-primary disabled:opacity-30 transition-all shadow-sm active:scale-95"
                            >
                                <FaChevronRight size={10} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentDetailModal;
