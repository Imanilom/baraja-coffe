import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaDownload, FaEye, FaChevronLeft } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import { useSelector } from "react-redux";
import Select from "react-select";
import dayjs from "dayjs";
import PaymentDetailModal from "./detailModal";
import { exportPaymentMethodExcel } from '../../../../utils/exportPaymentMethodExcel';
import { normalizePaymentMethodName, calculateReportTotals, formatCurrency, allocateProportional } from '../../../../utils/reportUtils';

const PaymentMethodSales = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { outlets } = useSelector((state) => state.outlet);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    const [selectedOutlet, setSelectedOutlet] = useState(searchParams.get('outletId') || "");
    const [includeTax, setIncludeTax] = useState(searchParams.get('includeTax') !== 'false');
    const [dateRange, setDateRange] = useState(() => {
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        if (startDateParam && endDateParam) {
            return {
                startDate: dayjs(startDateParam).toDate(),
                endDate: dayjs(endDateParam).toDate(),
            };
        }
        return { startDate: dayjs().toDate(), endDate: dayjs().toDate() };
    });

    const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page'), 10) || 1);
    const ITEMS_PER_PAGE = 50;

    const formatDateLocal = (date) => dayjs(date).format('YYYY-MM-DD');

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: state.isFocused ? 'var(--primary-color, #005429)' : '#e5e7eb',
            minHeight: '38px',
            fontSize: '13px',
            borderRadius: '0.5rem',
            boxShadow: state.isFocused ? '0 0 0 1px var(--primary-color, #005429)' : 'none',
            '&:hover': {
                borderColor: 'var(--primary-color, #005429)',
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#374151',
            fontWeight: '500',
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '13px',
            color: state.isSelected ? 'white' : '#374151',
            backgroundColor: state.isSelected 
                ? 'var(--primary-color, #005429)' 
                : state.isFocused ? 'rgba(0, 84, 41, 0.05)' : 'white',
            cursor: 'pointer',
            '&:active': {
                backgroundColor: 'var(--primary-color, #005429)',
            }
        }),
    };

    // Update URL when filters change
    const updateURLParams = useCallback((newDateRange, newOutlet, newPage, newIncludeTax) => {
        const params = new URLSearchParams();

        if (newDateRange?.startDate && newDateRange?.endDate) {
            params.set('startDate', formatDateLocal(newDateRange.startDate));
            params.set('endDate', formatDateLocal(newDateRange.endDate));
        }

        if (newOutlet) params.set('outletId', newOutlet);
        if (newPage && newPage > 1) params.set('page', newPage.toString());
        
        // Ensure newIncludeTax is not undefined
        const finalIncludeTax = newIncludeTax !== undefined ? newIncludeTax : includeTax;
        params.set('includeTax', finalIncludeTax.toString());

        setSearchParams(params);
    }, [setSearchParams]);

    // Fetch sales report data
    const fetchSalesReport = useCallback(async () => {
        if (!dateRange?.startDate || !dateRange?.endDate) return;

        setLoading(true);
        setError(null);

        try {
            const params = {
                startDate: formatDateLocal(dateRange.startDate),
                endDate: formatDateLocal(dateRange.endDate),
                includeTax: includeTax.toString(),
                status: 'Completed'
            };

            if (selectedOutlet) params.outletId = selectedOutlet;

            // Gunakan endpoint /summary yang mengembalikan paymentMethodBreakdown
            const response = await axios.get('/api/report/sales-report/summary', { params });

            if (response.data?.success && response.data?.data) {
                setReportData(response.data.data);
            } else {
                setError("Format data tidak valid");
            }
        } catch (err) {
            console.error("Error fetching sales report:", err);
            setError(err.response?.data?.message || "Gagal memuat data. Silakan coba lagi.");
            setReportData(null);
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedOutlet, includeTax]);


    useEffect(() => {
        fetchSalesReport();
    }, [fetchSalesReport]);

    // Handle date range change
    const handleDateRangeChange = (newValue) => {
        if (newValue?.startDate && newValue?.endDate) {
            setDateRange(newValue);
            setCurrentPage(1);
            updateURLParams(newValue, selectedOutlet, 1, includeTax);
        }
    };

    // Handle outlet change
    const handleOutletChange = (selected) => {
        const newOutlet = selected?.value || "";
        setSelectedOutlet(newOutlet);
        setCurrentPage(1);
        updateURLParams(dateRange, newOutlet, 1, includeTax);
    };

    // Handle tax toggle
    const handleTaxToggle = (newIncludeTax) => {
        setIncludeTax(newIncludeTax);
        setCurrentPage(1);
        updateURLParams(dateRange, selectedOutlet, 1, newIncludeTax);
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        updateURLParams(dateRange, selectedOutlet, newPage, includeTax);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const options = useMemo(() => [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((o) => ({ value: o._id, label: o.name })),
    ], [outlets]);

    // Process payment data
    const paymentMethodData = useMemo(() => {
        if (!reportData) return [];

        const methods = reportData.paymentMethodBreakdown ||
            reportData.paymentMethods ||
            [];

        if (!Array.isArray(methods) || methods.length === 0) return [];

        const apiSummary = reportData.summary || {};
        
        const totalSalesAPI = apiSummary.totalSales || apiSummary.total_sales || 0;
        const totalTaxAPI = apiSummary.totalTax || apiSummary.total_tax || 0;
        const totalServiceAPI = apiSummary.totalServiceFee || apiSummary.total_service_fee || 0;
        const totalDiscountAPI = apiSummary.totalDiscount || apiSummary.total_discount || 0;

        // 1. Calculate total breakdown collected amount
        const totalCollected = methods.reduce((sum, m) => 
            sum + (m.total || m.totalAmount || m.total_amount || m.subtotal || m.amount || 0), 0);

        const normalizedMap = new Map();

        // 2. Process with proportional fallback anchored to totalSalesAPI
        methods.forEach(method => {
            const rawName = (method.method || method.displayName || method.name || method.paymentMethod || 'Unknown').trim();
            const name = normalizePaymentMethodName(rawName);

            const itemTotal = method.total || method.totalAmount || method.total_amount || method.subtotal || method.amount || 0;
            const tax = allocateProportional(itemTotal, totalCollected, totalTaxAPI);
            const serviceCharge = allocateProportional(itemTotal, totalCollected, totalServiceAPI);
            const discount = allocateProportional(itemTotal, totalCollected, totalDiscountAPI);
            const absoluteTotal = allocateProportional(itemTotal, totalCollected, totalSalesAPI);

            // Nett Subtotal = Total - Tax - Service
            const subtotal = absoluteTotal - (tax + serviceCharge);
            const count = method.count || method.transactionCount || 0;
            const orderIds = method.orderIds || [];

            if (normalizedMap.has(name)) {
                const existing = normalizedMap.get(name);
                normalizedMap.set(name, {
                    ...existing,
                    subtotal: existing.subtotal + subtotal,
                    count: existing.count + count,
                    tax: existing.tax + tax,
                    serviceCharge: existing.serviceCharge + serviceCharge,
                    discount: existing.discount + discount,
                    total: existing.total + absoluteTotal,
                    orderIds: [...existing.orderIds, ...orderIds]
                });
            } else {
                normalizedMap.set(name, {
                    paymentMethod: name,
                    subtotal,
                    count,
                    tax,
                    serviceCharge,
                    discount,
                    total: absoluteTotal,
                    orderIds
                });
            }
        });

        const aggregatedMethods = Array.from(normalizedMap.values());
        const totalReportable = aggregatedMethods.reduce((s, m) => s + (m.subtotal + (includeTax ? (m.tax + m.serviceCharge) : 0)), 0);

        return aggregatedMethods.map(m => ({
            ...m,
            percentage: totalReportable > 0 ? (((m.subtotal + (includeTax ? (m.tax + m.serviceCharge) : 0)) / totalReportable) * 100).toFixed(2) : '0.00'
        }));
    }, [reportData]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return paymentMethodData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [paymentMethodData, currentPage]);

    const totalPages = Math.ceil(paymentMethodData.length / ITEMS_PER_PAGE);

    const grandTotal = useMemo(() => {
        return paymentMethodData.reduce(
            (acc, curr) => {
                acc.count += curr.count;
                acc.subtotal += curr.subtotal;
                acc.total += (curr.total || 0);
                acc.tax += (curr.tax || 0);
                acc.serviceCharge += (curr.serviceCharge || 0);
                acc.discount += (curr.discount || 0);
                return acc;
            },
            { count: 0, subtotal: 0, total: 0, tax: 0, serviceCharge: 0, discount: 0 }
        );
    }, [paymentMethodData]);

    const calculatedValues = useMemo(() => {
        if (!reportData) return { totalPenjualan: 0, tax: 0, service: 0, discount: 0, penjualanBersih: 0 };
        return calculateReportTotals(reportData.summary, includeTax);
    }, [reportData, includeTax]);


    const exportToExcel = async () => {
        if (paymentMethodData.length === 0) {
            alert("Tidak ada data untuk diekspor");
            return;
        }

        setIsExporting(true);
        try {
            const outletName = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet'
                : 'Semua Outlet';

            const dateRangeText = `${dayjs(dateRange.startDate).format('DD/MM/YYYY')} - ${dayjs(dateRange.endDate).format('DD/MM/YYYY')}`;
            const taxLabel = includeTax ? 'Dengan Pajak' : 'Tanpa Pajak';

            await exportPaymentMethodExcel({
                data: paymentMethodData,
                grandTotal,
                summary: reportData?.summary,
                includeTax,
                fileName: `Metode_Pembayaran_${taxLabel}_${outletName.replace(/\s+/g, '_')}_${dayjs(dateRange.startDate).format('DDMMYYYY')}_${dayjs(dateRange.endDate).format('DDMMYYYY')}.xlsx`,
                headerInfo: [
                    ['Outlet', outletName],
                    ['Periode', dateRangeText],
                    ['Jenis Laporan', taxLabel],
                    ['Tanggal Export', dayjs().format('DD/MM/YYYY HH:mm:ss')]
                ]
            });
        } catch (err) {
            console.error("Error exporting:", err);
            alert("Gagal mengekspor data. Silakan coba lagi.");
        } finally {
            setIsExporting(false);
        }
    };

    const openModal = (paymentMethod) => {
        setSelectedPaymentMethod(paymentMethod);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedPaymentMethod('');
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
                <button key={1} onClick={() => handlePageChange(1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition-all text-[13px] font-medium">1</button>
            );
            if (startPage > 2) pages.push(<span key="ellipsis1" className="px-1 text-gray-400">...</span>);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all text-[13px] font-medium ${currentPage === i ? "bg-primary border-primary text-white shadow-sm shadow-primary/20" : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"}`}
                >
                    {i}
                </button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pages.push(<span key="ellipsis2" className="px-1 text-gray-400">...</span>);
            pages.push(
                <button key={totalPages} onClick={() => handlePageChange(totalPages)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition-all text-[13px] font-medium">{totalPages}</button>
            );
        }

        return pages;
    };

    if (loading && !reportData) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="text-primary flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    <p className="font-bold text-gray-400 uppercase tracking-widest text-[11px]">Memuat data...</p>
                </div>
            </div>
        );
    }

    if (error && !loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="text-red-500 text-center bg-white p-8 rounded-2xl shadow-sm border">
                    <p className="text-xl font-bold mb-2">Terjadi Kesalahan</p>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={fetchSalesReport}
                        className="bg-primary text-white text-[13px] px-6 py-2 rounded-lg hover:bg-primary/90 transition-all font-medium"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent pb-[30px]">
            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-4 mb-4">
                <h1 className="flex gap-2 items-center text-xl text-primary font-bold">
                    <span className="opacity-60 font-medium text-lg">Laporan</span>
                    <FaChevronRight className="opacity-30 text-xs mt-1" />
                    <Link to="/admin/sales-menu" className="opacity-60 font-medium text-lg hover:opacity-100 transition-opacity">Laporan Penjualan</Link>
                    <FaChevronRight className="opacity-30 text-xs mt-1" />
                    <span className="text-lg">Metode Pembayaran</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={isExporting || paymentMethodData.length === 0}
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
            </div>

            <div className="px-6">
                <div className="flex justify-between py-3 gap-4 items-center mb-2">
                    <div className="flex items-center gap-3 w-3/5">
                        <div className="relative text-gray-500 w-[240px]">
                            <Datepicker
                                showFooter
                                showShortcuts
                                value={dateRange}
                                onChange={handleDateRangeChange}
                                displayFormat="DD-MM-YYYY"
                                inputClassName="w-full text-[13px] border border-gray-200 py-2 pr-[25px] pl-[12px] rounded-lg cursor-pointer focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm h-[38px] focus:outline-none"
                                popoverDirection="down"
                            />
                        </div>
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1.5 gap-1.5 shadow-sm h-[38px]">
                            <button
                                onClick={() => handleTaxToggle(false)}
                                className={`text-[11px] px-3 py-1 rounded-md transition-all font-medium ${!includeTax ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                Nett
                            </button>
                            <button
                                onClick={() => handleTaxToggle(true)}
                                className={`text-[11px] px-3 py-1 rounded-md transition-all font-medium ${includeTax ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                Gross
                            </button>
                        </div>
                    </div>
                    
                    <div className="w-1/5">
                        <Select
                            options={options}
                            value={options.find((opt) => opt.value === selectedOutlet) || options[0]}
                            onChange={handleOutletChange}
                            placeholder="Semua Outlet"
                            className="text-[13px]"
                            classNamePrefix="react-select"
                            styles={customStyles}
                            isSearchable
                        />
                    </div>
                </div>

                {paymentMethodData.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 mt-2">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Total Transaksi</p>
                            <p className="text-xl font-black text-primary group-hover:scale-105 transition-transform origin-left">{(reportData?.summary?.totalTransactions || 0).toLocaleString('id-ID')}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Total Item</p>
                            <p className="text-xl font-black text-primary group-hover:scale-105 transition-transform origin-left">{(reportData?.summary?.totalItems || 0).toLocaleString('id-ID')}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Rerata / Trx</p>
                            <p className="text-xl font-black text-primary group-hover:scale-105 transition-transform origin-left">
                                {formatCurrency(
                                    (reportData?.summary?.totalTransactions || 0) > 0 
                                    ? calculatedValues.totalPenjualan / reportData.summary.totalTransactions
                                    : 0
                                )}
                            </p>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-100 bg-white">
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr className="bg-gray-50/50 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                <th className="px-5 py-3">Metode Pembayaran</th>
                                <th className="px-5 py-3 text-right">Trx</th>
                                <th className="px-5 py-3 text-right">Total Nominal</th>
                                <th className="px-5 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((group, index) => {
                                    // SINKRONISASI: Nett mode harus mengeluarkan Tax DAN Service Charge
                                    const displayAmount = group.subtotal + (includeTax ? (group.tax + group.serviceCharge) : 0);
                                    return (
                                        <tr key={index} className="hover:bg-primary/5 transition-colors border-b border-gray-50 last:border-0">
                                            <td className="px-5 py-3 font-bold text-gray-700">{group.paymentMethod}</td>
                                            <td className="px-5 py-3 text-right text-gray-500 font-medium">{group.count.toLocaleString('id-ID')}</td>
                                            <td className="px-5 py-3 text-right font-black text-gray-900">{formatCurrency(displayAmount)}</td>
                                            <td className="px-5 py-3 text-center">
                                                <button
                                                    onClick={() => openModal(group.paymentMethod)}
                                                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary text-white text-[11px] font-bold rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                                                >
                                                    <FaEye className="text-[10px]" /> LIHAT DETAIL
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-gray-400">Tidak ada data ditemukan</td>
                                </tr>
                            )}
                        </tbody>
                        {paginatedData.length > 0 && (
                            <tfoot className="bg-gray-50/50 font-bold text-xs border-t-2 border-gray-100">
                                <tr>
                                    <td className="px-5 py-3 text-gray-900 border-r border-gray-50">Total Penjualan</td>
                                    <td className="px-5 py-3 text-right">
                                        <span className="bg-white border border-gray-200 text-gray-900 px-3 py-0.5 rounded text-[11px]">{(reportData?.summary?.totalTransactions || 0).toLocaleString('id-ID')}</span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <span className="bg-primary text-white px-3 py-1 rounded text-sm font-black shadow-md shadow-primary/10">
                                            {formatCurrency(calculatedValues.totalPenjualan)}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-8 pb-4">
                        <button
                            onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-2 px-4 py-2 text-[13px] font-bold text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/5 rounded-xl transition-all"
                        >
                            <FaChevronLeft className="text-[10px]" /> SEBELUMNYA
                        </button>
                        <div className="flex gap-2 items-center">{renderPageNumbers()}</div>
                        <button
                            onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-2 px-4 py-2 text-[13px] font-bold text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/5 rounded-xl transition-all"
                        >
                            BERIKUTNYA <FaChevronRight className="text-[10px]" />
                        </button>
                    </div>
                )}
            </div>

            <PaymentDetailModal
                isOpen={isModalOpen}
                onClose={closeModal}
                paymentMethod={selectedPaymentMethod}
                overallSummary={paymentMethodData.find(m => m.paymentMethod === selectedPaymentMethod)}
                dateRange={dateRange}
                outletId={selectedOutlet}
                includeTax={includeTax}
                formatCurrency={formatCurrency}
            />
        </div>
    );
};

export default PaymentMethodSales;