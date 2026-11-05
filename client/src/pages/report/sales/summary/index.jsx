import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import Select from "react-select";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaDownload } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import SalesReportSkeleton from "./skeleton";
import { useSelector } from "react-redux";
import { exportSummaryExcel } from '../../../../utils/exportSummaryExcel';
import { normalizePaymentMethodName, calculateReportTotals, formatCurrency, allocateProportional } from '../../../../utils/reportUtils';

const Summary = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { currentUser } = useSelector((state) => state.user);
    const { outlets } = useSelector((state) => state.outlet);
    const navigate = useNavigate();

    // Fungsi helper untuk format tanggal lokal tanpa timezone offset
    const formatDateLocal = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

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

    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState(null);

    const [selectedOutlet, setSelectedOutlet] = useState(searchParams.get('outletId') || "");
    const [includeTax, setIncludeTax] = useState(searchParams.get('includeTax') === 'true' || true);
    const [dateRange, setDateRange] = useState(() => {
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        if (startDateParam && endDateParam) {
            return {
                startDate: new Date(startDateParam),
                endDate: new Date(endDateParam),
            };
        }
        const today = new Date();
        return {
            startDate: today,
            endDate: today,
        };
    });

    const [summaryData, setSummaryData] = useState({
        totalSales: 0,
        totalTransactions: 0,
        avgOrderValue: 0,
        totalTax: 0,
        totalServiceFee: 0,
        totalDiscount: 0,
        totalItems: 0
    });
    const [paymentBreakdown, setPaymentBreakdown] = useState([]);
    const [orderTypeBreakdown, setOrderTypeBreakdown] = useState([]);

    const dropdownRef = useRef(null);

    // Update URL when filters change
    const updateURLParams = useCallback((newDateRange, newOutlet, newIncludeTax) => {
        const params = new URLSearchParams();

        if (newDateRange?.startDate && newDateRange?.endDate) {
            const startDate = formatDateLocal(newDateRange.startDate);
            const endDate = formatDateLocal(newDateRange.endDate);
            params.set('startDate', startDate);
            params.set('endDate', endDate);
        }

        if (newOutlet) {
            params.set('outletId', newOutlet);
        }

        params.set('includeTax', newIncludeTax.toString());

        setSearchParams(params);
    }, [setSearchParams]);

    // Fetch sales summary from API
    const fetchSalesSummary = async () => {
        if (!dateRange?.startDate || !dateRange?.endDate) return;

        setLoading(true);
        try {
            const params = {
                startDate: formatDateLocal(dateRange.startDate),
                endDate: formatDateLocal(dateRange.endDate),
                outletId: selectedOutlet || undefined,
                includeTax: includeTax.toString(),
                status: 'Completed'
            };

            const response = await axios.get('/api/report/sales-report/summary', { params });

            if (response.data.success) {
                const { summary, paymentMethodBreakdown, orderTypeBreakdown } = response.data.data;

                const normalizedPayments = new Map();
                const rawMethodBreakdown = response.data.data.paymentMethodBreakdown || [];
                const apiSummary = response.data.data.summary || {};
                
                // 1. Calculate total breakdown collected amount for proportional allocation
                const totalCollected = rawMethodBreakdown.reduce((sum, item) => 
                    sum + (item.total || item.totalAmount || item.total_amount || item.amount || 0), 0);

                // 2. Process and Normalize breakdown with proportional fallback
                rawMethodBreakdown.forEach(item => {
                    const rawName = (item.method || item.displayName || item.name || item.paymentMethod || 'Unknown').trim();
                    const name = normalizePaymentMethodName(rawName);

                    const itemTotal = item.total || item.totalAmount || item.total_amount || item.amount || 0;
                    
                    // Proportional fallback for items lacking metadata
                    const itemTax = (item.tax || item.totalTax || item.total_tax || 0) || allocateProportional(itemTotal, totalCollected, (apiSummary.totalTax || apiSummary.total_tax || 0));
                    const itemService = (item.serviceCharge || item.service_charge || item.serviceFee || item.service_fee || 0) || allocateProportional(itemTotal, totalCollected, (apiSummary.totalServiceFee || apiSummary.total_service_fee || 0));
                    
                    // Nett for row = Total Collected - Tax - Service
                    const nettAmountRow = itemTotal - itemTax - itemService;
                    const amount = nettAmountRow + (includeTax ? (itemTax + itemService) : 0);
                    const count = item.count || item.transactionCount || 0;

                    if (normalizedPayments.has(name)) {
                        const existing = normalizedPayments.get(name);
                        normalizedPayments.set(name, {
                            ...existing,
                            count: existing.count + count,
                            amount: existing.amount + amount
                        });
                    } else {
                        normalizedPayments.set(name, {
                            method: name,
                            count: count,
                            amount: amount
                        });
                    }
                });

                const aggregatedPayments = Array.from(normalizedPayments.values());
                const totalAmt = aggregatedPayments.reduce((s, m) => s + m.amount, 0);

                const apiSum = apiSummary;
                setSummaryData(apiSum);

                setPaymentBreakdown(aggregatedPayments.map(m => ({
                    ...m,
                    percentage: totalAmt > 0 ? ((m.amount / totalAmt) * 100).toFixed(2) : '0.00'
                })));
                setOrderTypeBreakdown(orderTypeBreakdown || []);
            }

            setError(null);
        } catch (err) {
            console.error("Error fetching sales summary:", err);
            setError("Failed to load sales summary. Please try again later.");
            setSummaryData({
                totalSales: 0,
                totalTransactions: 0,
                avgOrderValue: 0,
                totalTax: 0,
                totalServiceFee: 0,
                totalDiscount: 0,
                totalItems: 0
            });
            setPaymentBreakdown([]);
            setOrderTypeBreakdown([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch sales summary when filters change
    useEffect(() => {
        fetchSalesSummary();
    }, [dateRange, selectedOutlet, includeTax]);

    const options = [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((o) => ({ value: o._id, label: o.name })),
    ];

    // Handle date range change
    const handleDateRangeChange = (newValue) => {
        setDateRange(newValue);
        updateURLParams(newValue, selectedOutlet, includeTax);
    };

    // Handle outlet change
    const handleOutletChange = (selected) => {
        const newOutlet = selected?.value || "";
        setSelectedOutlet(newOutlet);
        updateURLParams(dateRange, newOutlet, includeTax);
    };

    // Handle tax toggle
    const handleTaxToggle = (newIncludeTax) => {
        setIncludeTax(newIncludeTax);
        updateURLParams(dateRange, selectedOutlet, newIncludeTax);
    };

    // Calculate display values (Penjualan Kotor, Bersih, etc.)
    const calculatedValues = useMemo(() => {
        return calculateReportTotals(summaryData, includeTax);
    }, [summaryData, includeTax]);


    // Export current data to Excel
    const exportToExcel = async () => {
        setIsExporting(true);
        try {
            const outletName = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet'
                : 'Semua Outlet';

            const dateRangeText = dateRange && dateRange.startDate && dateRange.endDate
                ? `${new Date(dateRange.startDate).toLocaleDateString('id-ID')} - ${new Date(dateRange.endDate).toLocaleDateString('id-ID')}`
                : 'Semua Tanggal';

            await exportSummaryExcel({
                summaryData,
                calculatedValues,
                paymentBreakdown,
                orderTypeBreakdown,
                fileName: `Laporan_Ringkasan_${outletName}_${formatDateLocal(dateRange.startDate)}_${formatDateLocal(dateRange.endDate)}.xlsx`,
                headerInfo: [
                    ['Outlet', outletName],
                    ['Tanggal', dateRangeText]
                ]
            });
        } catch (error) {
            console.error("Error exporting to Excel:", error);
            alert("Gagal mengekspor data. Silakan coba lagi.");
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) {
        return <SalesReportSkeleton />;
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="text-red-500 text-center bg-white p-8 rounded-2xl shadow-sm border">
                    <p className="text-xl font-bold mb-2">Terjadi Kesalahan</p>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={fetchSalesSummary}
                        className="bg-primary text-white text-[13px] px-6 py-2 rounded-lg hover:bg-primary/90 transition-all font-medium"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent pb-[30px] font-['Inter',sans-serif]">
            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 lg:px-8 py-5 mb-2">
                <h1 className="flex gap-2 items-center text-xl text-slate-800 font-bold font-['Outfit',sans-serif]">
                    <span className="opacity-50 font-medium text-lg text-slate-500">Laporan</span>
                    <FaChevronRight className="opacity-30 text-xs mt-0.5 text-slate-400" />
                    <Link to="/admin/sales-menu" className="opacity-60 font-medium text-lg hover:opacity-100 hover:text-[#005429] transition-colors">Laporan Penjualan</Link>
                    <FaChevronRight className="opacity-30 text-xs mt-0.5 text-slate-400" />
                    <span className="text-lg tracking-tight text-slate-800">Ringkasan</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={isExporting}
                    className="bg-white hover:bg-slate-50 text-[#005429] border border-[#005429]/20 text-[13px] px-5 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 font-bold"
                >
                    {isExporting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#005429]"></div>
                            Mengekspor...
                        </>
                    ) : (
                        <>
                            <FaDownload /> Ekspor Excel
                        </>
                    )}
                </button>
            </div>

            {/* Filters */}
            <div className="px-6 lg:px-8">
                <div className="relative z-[60] bg-white/80 backdrop-blur-xl border border-slate-200/60 p-2 sm:p-3 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center mb-6">
                    <div className="flex gap-3 w-full sm:w-auto items-center flex-1">
                        <div className="relative text-slate-500 flex-1 sm:flex-none sm:w-[240px]">
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1 mb-1 block hidden sm:block">Rentang Tanggal</label>
                            <Datepicker
                                showFooter
                                showShortcuts
                                value={dateRange}
                                onChange={handleDateRangeChange}
                                displayFormat="DD MMM YYYY"
                                inputClassName="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 py-2.5 px-4 rounded-xl cursor-pointer focus:ring-2 focus:ring-[#005429]/20 focus:border-[#005429] transition-all shadow-sm hover:bg-white hover:border-slate-300 focus:outline-none"
                                popoverDirection="down"
                            />
                        </div>
                        <div className="w-[1px] h-10 bg-slate-200 shrink-0 hidden sm:block mx-1"></div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1 mb-1 block hidden sm:block">Perhitungan</label>
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1 shadow-sm h-[42px]">
                                <button
                                    onClick={() => handleTaxToggle(false)}
                                    className={`text-xs px-4 py-1.5 rounded-lg transition-all font-bold tracking-wide ${!includeTax ? 'bg-[#005429] text-white shadow-sm' : 'text-slate-500 hover:bg-white'}`}
                                >
                                    NETT
                                </button>
                                <button
                                    onClick={() => handleTaxToggle(true)}
                                    className={`text-xs px-4 py-1.5 rounded-lg transition-all font-bold tracking-wide ${includeTax ? 'bg-[#005429] text-white shadow-sm' : 'text-slate-500 hover:bg-white'}`}
                                >
                                    GROSS
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="w-full sm:w-1/4">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1 mb-1 block hidden sm:block">Outlet Cabang</label>
                        <Select
                            options={options}
                            value={
                                selectedOutlet
                                    ? options.find((opt) => opt.value === selectedOutlet)
                                    : options[0]
                            }
                            onChange={handleOutletChange}
                            placeholder="Semua Outlet"
                            className="text-sm font-bold shadow-sm"
                            classNamePrefix="react-select"
                            styles={{
                                ...customStyles,
                                control: (provided, state) => ({
                                    ...customStyles.control(provided, state),
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '0.75rem',
                                    padding: '2px',
                                    borderColor: state.isFocused ? '#005429' : '#e2e8f0',
                                }),
                            }}
                            isSearchable
                        />
                    </div>
                </div>

                {/* Summary Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 group hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300">
                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1.5">Total Transaksi</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tight font-['Outfit',sans-serif] group-hover:text-[#005429] transition-colors">{summaryData.totalTransactions.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 group hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300">
                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1.5">Total Item Terjual</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tight font-['Outfit',sans-serif] group-hover:text-[#005429] transition-colors">{summaryData.totalItems.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 group hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300">
                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1.5">Rata-rata / Transaksi</p>
                        <p className="text-3xl font-black text-[#005429] tracking-tight font-['Outfit',sans-serif]">{formatCurrency(summaryData.avgOrderValue)}</p>
                    </div>
                </div>

                {/* Main Summary Table */}
                <div className="overflow-x-auto rounded-2xl shadow-sm border border-slate-200/80 bg-white mb-6">
                    <table className="min-w-full table-auto">
                        <tbody className="text-sm divide-y divide-slate-100">
                            {[
                                { label: 'Penjualan Kotor', value: calculatedValues.penjualanKotor },
                                { label: 'Total Diskon', value: calculatedValues.discount, isNegative: true },
                                { label: 'Penjualan Bersih (Nett)', value: calculatedValues.penjualanBersih, isBold: true },
                                { label: 'Service Charge', value: calculatedValues.service },
                                { label: 'Pajak (PB1)', value: calculatedValues.tax },
                            ].map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className={`px-6 py-4 text-slate-500 uppercase text-[11px] font-bold tracking-wider ${row.isBold ? 'text-slate-900 text-xs' : ''}`}>
                                        {row.label}
                                    </td>
                                    <td className={`text-right px-6 py-4 font-bold text-slate-700 ${row.isNegative ? 'text-red-500' : ''} ${row.isBold ? 'text-[#005429] text-lg font-black tracking-tight' : ''}`}>
                                        {row.isNegative && row.value > 0 ? '-' : ''}{formatCurrency(row.value)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50/50 font-bold border-t-2 border-slate-200/80">
                            <tr>
                                <td className="px-6 py-5 text-slate-900 uppercase tracking-widest text-xs font-black">Total Penjualan</td>
                                <td className="px-6 py-5 text-right">
                                    <span className="bg-gradient-to-r from-[#005429] to-[#007036] text-white px-5 py-2 rounded-xl shadow-sm text-xl font-black tracking-tight font-['Outfit',sans-serif]">
                                        {formatCurrency(calculatedValues.totalPenjualan)}
                                    </span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Breakdown Tables Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Payment Method Breakdown */}
                    {paymentBreakdown.length > 0 && (
                        <div className="overflow-x-auto rounded-2xl shadow-sm border border-slate-200/80 bg-white flex flex-col">
                            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm font-['Outfit',sans-serif]">Rincian Metode Pembayaran</h3>
                            </div>
                            <table className="min-w-full table-auto">
                                <thead>
                                    <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                        <th className="px-6 py-3 text-left">Metode</th>
                                        <th className="px-6 py-3 text-right">Trx</th>
                                        <th className="px-6 py-3 text-right">Nominal</th>
                                        <th className="px-6 py-3 text-right">Share</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-slate-50">
                                    {paymentBreakdown.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-700">{item.method || "N/A"}</td>
                                            <td className="px-6 py-4 text-right text-slate-500 font-medium">{item.count.toLocaleString('id-ID')}</td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(item.amount)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="bg-blue-50/80 border border-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest inline-block min-w-[50px] text-center">
                                                    {item.percentage}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Order Type Breakdown */}
                    {orderTypeBreakdown.length > 0 && (
                        <div className="overflow-x-auto rounded-2xl shadow-sm border border-slate-200/80 bg-white flex flex-col">
                            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm font-['Outfit',sans-serif]">Rincian Tipe Pesanan</h3>
                            </div>
                            <table className="min-w-full table-auto">
                                <thead>
                                    <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                        <th className="px-6 py-3 text-left">Tipe</th>
                                        <th className="px-6 py-3 text-right">Trx</th>
                                        <th className="px-6 py-3 text-right">Nominal</th>
                                        <th className="px-6 py-3 text-right">Share</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-slate-50">
                                    {orderTypeBreakdown.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-700">{item.type}</td>
                                            <td className="px-6 py-4 text-right text-slate-500 font-medium">{item.count.toLocaleString('id-ID')}</td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                                            <td className="px-6 py-4 text-right transition-all">
                                                <span className="bg-purple-50/80 border border-purple-100 text-purple-700 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest inline-block min-w-[50px] text-center">
                                                    {item.percentage}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Summary;