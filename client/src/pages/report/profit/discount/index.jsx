import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import { Link, useSearchParams } from "react-router-dom";
import {
    FaClipboardList,
    FaChevronRight,
    FaBell,
    FaUser,
    FaSearch,
    FaFileExcel,
    FaSync,
    FaChartLine,
    FaTags,
    FaPercentage,
    FaMoneyBillWave,
    FaUsers
} from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import useDebounce from "@/hooks/useDebounce";

const DiscountManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { outlets } = useSelector((state) => state.outlet);

    const [analyticsData, setAnalyticsData] = useState({
        promoUsage: [],
        voucherUsage: [],
        revenueImpact: null,
        overview: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [exportLoading, setExportLoading] = useState(false);

    // Initial state from URL
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "overview");
    const [dateRange, setDateRange] = useState(() => {
        const start = searchParams.get('startDate');
        const end = searchParams.get('endDate');
        return {
            startDate: start ? dayjs(start).toDate() : dayjs().subtract(7, 'day').toDate(),
            endDate: end ? dayjs(end).toDate() : dayjs().toDate()
        };
    });
    const [selectedOutlet, setSelectedOutlet] = useState(searchParams.get('outletId') || "");
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || "");
    const debouncedSearch = useDebounce(searchTerm, 500);

    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: '#d1d5db',
            minHeight: '34px',
            fontSize: '13px',
            color: '#6b7280',
            boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none',
            '&:hover': {
                borderColor: '#9ca3af',
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#6b7280',
        }),
        input: (provided) => ({
            ...provided,
            color: '#6b7280',
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9ca3af',
            fontSize: '13px',
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '13px',
            color: '#374151',
            backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white',
            cursor: 'pointer',
        }),
    };

    const outletOptions = useMemo(() => [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((outlet) => ({
            value: outlet._id,
            label: outlet.name,
        })),
    ], [outlets]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatPercentage = (value) => {
        return `${(value || 0).toFixed(1)}%`;
    };

    const formatDate = (dateString) => {
        return dayjs(dateString).format('DD-MM-YYYY');
    };

    const updateURLParams = useCallback(() => {
        const params = new URLSearchParams();
        if (dateRange.startDate) params.set('startDate', dayjs(dateRange.startDate).format('YYYY-MM-DD'));
        if (dateRange.endDate) params.set('endDate', dayjs(dateRange.endDate).format('YYYY-MM-DD'));
        if (selectedOutlet) params.set('outletId', selectedOutlet);
        if (activeTab) params.set('tab', activeTab);
        if (debouncedSearch) params.set('q', debouncedSearch);
        setSearchParams(params);
    }, [dateRange, selectedOutlet, activeTab, debouncedSearch, setSearchParams]);

    useEffect(() => {
        updateURLParams();
    }, [updateURLParams]);

    const fetchAnalyticsData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                startDate: dayjs(dateRange.startDate).format('YYYY-MM-DD'),
                endDate: dayjs(dateRange.endDate).format('YYYY-MM-DD'),
            };

            if (selectedOutlet) {
                params.outletId = selectedOutlet;
            }

            const [promoResponse, voucherResponse, revenueResponse, overviewResponse] = await Promise.all([
                axios.get('/api/analytics/promo-usage', { params }),
                axios.get('/api/analytics/voucher-usage', { params }),
                axios.get('/api/analytics/revenue-impact', { params }),
                axios.get('/api/analytics/overview-metrics', { params })
            ]);

            setAnalyticsData({
                promoUsage: promoResponse.data.success ? promoResponse.data.data : [],
                voucherUsage: voucherResponse.data.success ? voucherResponse.data.data : [],
                revenueImpact: revenueResponse.data.success ? revenueResponse.data.data : null,
                overview: overviewResponse.data.success ? overviewResponse.data.data : null
            });

            setError(null);
        } catch (err) {
            console.error("Error fetching analytics data:", err);
            setError("Gagal memuat data analitik. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedOutlet]);

    useEffect(() => {
        fetchAnalyticsData();
    }, [fetchAnalyticsData]);

    const handleRefresh = () => {
        fetchAnalyticsData();
    };

    const filteredData = useMemo(() => {
        const data = activeTab === "promo" ? analyticsData.promoUsage : analyticsData.voucherUsage;
        if (!debouncedSearch) {
            return data;
        }

        return data.filter(item =>
            item.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            item.code?.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [analyticsData, activeTab, debouncedSearch]);

    const exportToExcel = async () => {
        setExportLoading(true);
        try {
            let dataToExport = [];
            let filename = `Laporan_Diskon_${activeTab}_${dayjs(dateRange.startDate).format('YYYYMMDD')}.xlsx`;

            if (activeTab === "promo") {
                dataToExport = filteredData.map(item => ({
                    "Nama Promo": item.name || "-",
                    "Tipe Promo": item.promoType || "-",
                    "Tipe Diskon": item.discountType || "-",
                    "Jumlah Diskon": item.discountAmount || 0,
                    "Total Penggunaan": item.totalOrders || 0,
                    "Total Diskon": item.totalDiscount || 0,
                    "Total Revenue": item.totalRevenue || 0,
                    "Efektivitas": formatPercentage(item.discountEffectiveness || 0),
                    "Lift Revenue": formatPercentage(item.revenueLift || 0),
                    "Status": item.status || "-"
                }));
            } else if (activeTab === "voucher") {
                dataToExport = filteredData.map(item => ({
                    "Kode Voucher": item.code || "-",
                    "Nama Voucher": item.name || "-",
                    "Tipe Diskon": item.discountType || "-",
                    "Jumlah Diskon": item.discountAmount || 0,
                    "Kuota": item.quota || 0,
                    "Digunakan": item.usedCount || 0,
                    "Tingkat Penebusan": formatPercentage(item.redemptionRate || 0),
                    "Total Diskon": item.totalDiscount || 0,
                    "Total Revenue": item.totalRevenue || 0,
                    "Status": item.status || "-"
                }));
            } else {
                const { overview } = analyticsData;
                if (overview) {
                    dataToExport = [
                        { "Metrik": "Total Revenue", "Nilai": formatCurrency(overview.revenue?.totalRevenue || 0) },
                        { "Metrik": "Total Diskon Diberikan", "Nilai": formatCurrency(overview.revenue?.totalDiscountGiven || 0) },
                        { "Metrik": "Tingkat Diskon", "Nilai": formatPercentage(overview.revenue?.discountRate || 0) },
                        { "Metrik": "Total Promo Aktif", "Nilai": overview.promos?.totalActive || 0 },
                        { "Metrik": "Total Penggunaan Promo", "Nilai": overview.promos?.totalUsage || 0 },
                        { "Metrik": "Total Voucher Aktif", "Nilai": overview.vouchers?.totalActive || 0 },
                        { "Metrik": "Total Penebusan Voucher", "Nilai": overview.vouchers?.totalRedemptions || 0 }
                    ];
                }
                filename = "Ringkasan_Diskon.xlsx";
            }

            if (dataToExport.length === 0) {
                alert('Tidak ada data untuk diekspor');
                return;
            }

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Data Diskon");
            XLSX.writeFile(wb, filename);
        } catch (err) {
            console.error("Error exporting to Excel:", err);
            alert('Gagal mengekspor data. Silakan coba lagi.');
        } finally {
            setExportLoading(false);
        }
    };

    const overviewMetrics = useMemo(() => {
        const { overview } = analyticsData;
        if (overview) {
            return {
                totalRevenue: overview.revenue?.totalRevenue || 0,
                totalDiscount: overview.revenue?.totalDiscountGiven || 0,
                discountRate: overview.revenue?.discountRate || 0,
                totalPromos: overview.promos?.totalActive || 0,
                promoUsage: overview.promos?.totalUsage || 0,
                totalVouchers: overview.vouchers?.totalActive || 0,
                voucherRedemptions: overview.vouchers?.totalRedemptions || 0,
                avgOrderValue: overview.revenue?.avgOrderValue || 0
            };
        }
        return { totalRevenue: 0, totalDiscount: 0, discountRate: 0, totalPromos: 0, promoUsage: 0, totalVouchers: 0, voucherRedemptions: 0, avgOrderValue: 0 };
    }, [analyticsData]);

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header */}
            <div className="flex justify-end px-6 items-center py-4 space-x-4 border-b bg-white">
                <FaBell className="text-gray-400 cursor-pointer" />
                <span className="text-sm font-medium">Hi Baraja</span>
                <Link to="/admin/menu" className="text-gray-400">
                    <FaUser size={24} />
                </Link>
            </div>

            {/* Breadcrumb & Actions */}
            <div className="px-6 py-4 flex justify-between items-center bg-white shadow-sm">
                <div className="flex items-center text-sm text-gray-500 font-medium">
                    <FaClipboardList className="mr-2" />
                    <span>Laporan</span>
                    <FaChevronRight className="mx-2 text-[10px]" />
                    <Link to="/admin/profit-menu" className="hover:text-green-900 transition-colors">Laporan Laba & Rugi</Link>
                    <FaChevronRight className="mx-2 text-[10px]" />
                    <span className="text-green-900">Analitik Diskon & Promo</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-[13px] px-4 py-2 rounded shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <FaSync className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    <button
                        onClick={exportToExcel}
                        disabled={exportLoading || loading}
                        className="flex items-center gap-2 bg-green-900 text-white text-[13px] px-4 py-2 rounded shadow-sm hover:bg-green-800 transition-colors disabled:opacity-50"
                    >
                        <FaFileExcel />
                        {exportLoading ? 'Mengekspor...' : 'Ekspor Excel'}
                    </button>
                </div>
            </div>

            <div className="px-6 mt-6">
                {/* Filters */}
                <div className="bg-white p-5 rounded-lg shadow-sm mb-6 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Rentang Tanggal</label>
                            <Datepicker
                                value={dateRange}
                                onChange={setDateRange}
                                showShortcuts={true}
                                showFooter={true}
                                displayFormat="DD-MM-YYYY"
                                inputClassName="w-full text-[13px] border border-gray-200 py-2 px-3 rounded focus:ring-2 focus:ring-green-900 outline-none transition-all"
                                popoverDirection="down"
                                separator="sampai"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Outlet</label>
                            <Select
                                options={outletOptions}
                                value={outletOptions.find(opt => opt.value === selectedOutlet) || outletOptions[0]}
                                onChange={(selected) => setSelectedOutlet(selected.value)}
                                styles={customSelectStyles}
                                isSearchable
                                placeholder="Pilih Outlet"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Cari</label>
                            <div className="relative">
                                <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder={activeTab === "promo" ? "Cari promo..." : "Cari voucher..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full text-[13px] border border-gray-200 py-2 pl-10 pr-4 rounded focus:ring-2 focus:ring-green-900 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 mb-6 bg-white p-1 rounded-lg shadow-sm border border-gray-100 w-fit">
                    {[
                        { id: "overview", label: "Ringkasan", icon: FaChartLine },
                        { id: "promo", label: `Promo (${analyticsData.promoUsage.length})`, icon: FaTags },
                        { id: "voucher", label: `Voucher (${analyticsData.voucherUsage.length})`, icon: FaPercentage }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                    ? "bg-green-900 text-white shadow-md"
                                    : "text-gray-500 hover:bg-gray-50"
                                }`}
                        >
                            <tab.icon className="mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-100 text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Tab Content */}
                {activeTab === "overview" && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[
                                { label: "Total Revenue", value: formatCurrency(overviewMetrics.totalRevenue), icon: FaMoneyBillWave, color: "text-green-700" },
                                { label: "Total Diskon", value: formatCurrency(overviewMetrics.totalDiscount), sub: `Rate: ${formatPercentage(overviewMetrics.discountRate)}`, icon: FaPercentage, color: "text-red-600" },
                                { label: "Promo Aktif", value: overviewMetrics.totalPromos, sub: `${overviewMetrics.promoUsage} penggunaan`, icon: FaTags, color: "text-blue-600" },
                                { label: "Voucher Aktif", value: overviewMetrics.totalVouchers, sub: `${overviewMetrics.voucherRedemptions} penebusan`, icon: FaUsers, color: "text-purple-600" }
                            ].map((card, i) => (
                                <div key={i} className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-3 text-gray-400">
                                        <card.icon size={18} />
                                        <p className="text-[10px] font-bold uppercase tracking-wider">{card.label}</p>
                                    </div>
                                    <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                                    {card.sub && <p className="text-[11px] text-gray-400 mt-1">{card.sub}</p>}
                                </div>
                            ))}
                        </div>

                        {analyticsData.revenueImpact && (
                            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8 text-center italic">Analisis Dampak Pendapatan</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                                    <div className="text-center group border-r border-gray-100">
                                        <p className="text-3xl font-black text-gray-900 mb-1 group-hover:scale-105 transition-transform">{formatCurrency(analyticsData.revenueImpact.totalBeforeDiscount)}</p>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase">Sebelum Diskon</p>
                                    </div>
                                    <div className="text-center group border-r border-gray-100">
                                        <p className="text-3xl font-black text-green-900 mb-1 group-hover:scale-105 transition-transform">{formatCurrency(analyticsData.revenueImpact.totalGrand)}</p>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase">Setelah Diskon</p>
                                    </div>
                                    <div className="text-center group">
                                        <p className="text-3xl font-black text-red-600 mb-1 group-hover:scale-105 transition-transform">{formatPercentage(analyticsData.revenueImpact.discountRate)}</p>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase">Persentase Potongan</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Table for Promo/Voucher */}
                {(activeTab === "promo" || activeTab === "voucher") && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                    <tr>
                                        {activeTab === "promo" ? (
                                            <>
                                                <th className="px-6 py-4">Nama Promo</th>
                                                <th className="px-6 py-4">Tipe</th>
                                                <th className="px-6 py-4 text-right">Penggunaan</th>
                                                <th className="px-6 py-4 text-right">Total Diskon</th>
                                                <th className="px-6 py-4 text-right">Total Revenue</th>
                                                <th className="px-6 py-4 text-right">Efektivitas</th>
                                                <th className="px-6 py-4 text-right">Status</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-6 py-4">Kode</th>
                                                <th className="px-6 py-4">Nama Voucher</th>
                                                <th className="px-6 py-4 text-right">Digunakan</th>
                                                <th className="px-6 py-4 text-right">Kuota</th>
                                                <th className="px-6 py-4 text-right">Redemption</th>
                                                <th className="px-6 py-4 text-right">Total Diskon</th>
                                                <th className="px-6 py-4 text-right">Status</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="text-[13px] divide-y divide-gray-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="py-20 text-center">
                                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-900"></div>
                                            </td>
                                        </tr>
                                    ) : filteredData.length > 0 ? (
                                        filteredData.map((item, index) => (
                                            <tr key={index} className="hover:bg-green-50/50 transition-colors">
                                                {activeTab === "promo" ? (
                                                    <>
                                                        <td className="px-6 py-4 font-medium text-gray-700">{item.name || "-"}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase">{item.promoType || "-"}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-gray-600 font-mono">{item.totalOrders || 0}</td>
                                                        <td className="px-6 py-4 text-right text-red-500 font-semibold">{formatCurrency(item.totalDiscount || 0)}</td>
                                                        <td className="px-6 py-4 text-right text-green-700 font-semibold">{formatCurrency(item.totalRevenue || 0)}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className={`font-bold ${item.discountEffectiveness > 50 ? 'text-green-600' : 'text-yellow-600'}`}>{formatPercentage(item.discountEffectiveness || 0)}</span>
                                                                <span className="text-[9px] text-gray-400">LIft: {formatPercentage(item.revenueLift)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${item.status === 'EXCELLENT' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{item.status}</span>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-6 py-4 font-mono font-bold text-green-900">{item.code || "-"}</td>
                                                        <td className="px-6 py-4 text-gray-700 font-medium">{item.name || "-"}</td>
                                                        <td className="px-6 py-4 text-right text-gray-600">{item.usedCount || 0}</td>
                                                        <td className="px-6 py-4 text-right text-gray-400">{item.quota || 0}</td>
                                                        <td className="px-6 py-4 text-right font-bold text-blue-600">{formatPercentage(item.redemptionRate || 0)}</td>
                                                        <td className="px-6 py-4 text-right text-red-500 font-semibold">{formatCurrency(item.totalDiscount || 0)}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">{item.status}</span>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="py-20 text-center text-gray-400 font-medium">Data tidak ditemukan</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiscountManagement;