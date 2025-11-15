import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
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

const DiscountManagement = () => {
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

    const [analyticsData, setAnalyticsData] = useState({
        promoUsage: [],
        voucherUsage: [],
        revenueImpact: null,
        overview: null
    });
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exportLoading, setExportLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    const [dateRange, setDateRange] = useState({
        startDate: dayjs().subtract(7, 'day').toDate(),
        endDate: dayjs().toDate()
    });
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const options = [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((outlet) => ({
            value: outlet._id,
            label: outlet.name,
        })),
    ];

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Format percentage
    const formatPercentage = (value) => {
        return `${(value || 0).toFixed(1)}%`;
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
    };

    // Fetch outlets data
    useEffect(() => {
        const fetchOutlets = async () => {
            try {
                const outletsResponse = await axios.get('/api/outlet');
                const outletsData = Array.isArray(outletsResponse.data) ?
                    outletsResponse.data :
                    (outletsResponse.data && Array.isArray(outletsResponse.data.data)) ?
                        outletsResponse.data.data : [];
                setOutlets(outletsData);
            } catch (err) {
                console.error("Error fetching outlets:", err);
            }
        };

        fetchOutlets();
    }, []);

    // Fetch analytics data
    const fetchAnalyticsData = async () => {
        setLoading(true);
        try {
            const params = {
                startDate: dateRange.startDate?.toISOString().split('T')[0],
                endDate: dateRange.endDate?.toISOString().split('T')[0],
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
    };

    // Fetch data when filters change
    useEffect(() => {
        fetchAnalyticsData();
    }, [dateRange, selectedOutlet]);

    // Handle date range change
    const handleDateRangeChange = (newValue) => {
        setDateRange({
            startDate: newValue.startDate,
            endDate: newValue.endDate
        });
    };

    // Handle outlet change
    const handleOutletChange = (selected) => {
        setSelectedOutlet(selected.value);
    };

    // Refresh data
    const handleRefresh = () => {
        fetchAnalyticsData();
    };

    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm) {
            return analyticsData[activeTab === "promo" ? "promoUsage" : "voucherUsage"];
        }

        const data = activeTab === "promo" ? analyticsData.promoUsage : analyticsData.voucherUsage;
        return data.filter(item => 
            item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [analyticsData, activeTab, searchTerm]);

    // Export to Excel
    const exportToExcel = async () => {
        setExportLoading(true);
        try {
            let dataToExport = [];
            let filename = "";

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
                filename = "Laporan_Promo.xlsx";
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
                filename = "Laporan_Voucher.xlsx";
            } else {
                // Overview export
                const { overview } = analyticsData;
                if (overview) {
                    dataToExport = [
                        {
                            "Metrik": "Total Revenue",
                            "Nilai": formatCurrency(overview.revenue?.totalRevenue || 0)
                        },
                        {
                            "Metrik": "Total Diskon Diberikan",
                            "Nilai": formatCurrency(overview.revenue?.totalDiscountGiven || 0)
                        },
                        {
                            "Metrik": "Tingkat Diskon",
                            "Nilai": formatPercentage(overview.revenue?.discountRate || 0)
                        },
                        {
                            "Metrik": "Total Promo Aktif",
                            "Nilai": overview.promos?.totalActive || 0
                        },
                        {
                            "Metrik": "Total Penggunaan Promo",
                            "Nilai": overview.promos?.totalUsage || 0
                        },
                        {
                            "Metrik": "Total Voucher Aktif",
                            "Nilai": overview.vouchers?.totalActive || 0
                        },
                        {
                            "Metrik": "Total Penebusan Voucher",
                            "Nilai": overview.vouchers?.totalRedemptions || 0
                        }
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

    // Calculate overview metrics
    const overviewMetrics = useMemo(() => {
        const { overview, promoUsage, voucherUsage, revenueImpact } = analyticsData;
        
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

        return {
            totalRevenue: 0,
            totalDiscount: 0,
            discountRate: 0,
            totalPromos: 0,
            promoUsage: 0,
            totalVouchers: 0,
            voucherRedemptions: 0,
            avgOrderValue: 0
        };
    }, [analyticsData]);

    // Show loading state
    if (loading && !analyticsData.overview) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

    return (
        <div className="">
            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <div className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <span>Laporan</span>
                    <FaChevronRight />
                    <Link to="/admin/profit-menu">Laporan Laba & Rugi</Link>
                    <FaChevronRight />
                    <span>Analitik Diskon & Promo</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 bg-gray-100 text-gray-700 text-[13px] px-[15px] py-[7px] rounded hover:bg-gray-200 disabled:opacity-50"
                    >
                        <FaSync className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    <button
                        onClick={exportToExcel}
                        disabled={exportLoading || loading}
                        className="flex items-center gap-2 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded disabled:opacity-50"
                    >
                        <FaFileExcel />
                        {exportLoading ? 'Mengekspor...' : 'Ekspor Excel'}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="px-6">
                <div className="flex gap-4 py-3">
                    <div className="w-1/3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rentang Tanggal
                        </label>
                        <Datepicker
                            value={dateRange}
                            onChange={handleDateRangeChange}
                            showShortcuts={true}
                            showFooter={true}
                            displayFormat="DD-MM-YYYY"
                            inputClassName="w-full text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded cursor-pointer"
                            popoverDirection="down"
                            separator="to"
                        />
                    </div>
                    <div className="w-1/3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Outlet
                        </label>
                        <Select
                            className="text-sm"
                            classNamePrefix="react-select"
                            placeholder="Pilih Outlet"
                            options={options}
                            isSearchable
                            value={options.find((opt) => opt.value === selectedOutlet) || options[0]}
                            onChange={handleOutletChange}
                            styles={customSelectStyles}
                        />
                    </div>
                    <div className="w-1/3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cari
                        </label>
                        <div className="relative">
                            <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder={activeTab === "promo" ? "Cari promo..." : "Cari voucher..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full text-[13px] border py-[6px] pl-10 pr-4 rounded"
                            />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b mb-6">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                            activeTab === "overview" 
                                ? "border-[#005429] text-[#005429]" 
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        <FaChartLine className="inline mr-2" />
                        Ringkasan
                    </button>
                    <button
                        onClick={() => setActiveTab("promo")}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                            activeTab === "promo" 
                                ? "border-[#005429] text-[#005429]" 
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        <FaTags className="inline mr-2" />
                        Promo ({analyticsData.promoUsage.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("voucher")}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                            activeTab === "voucher" 
                                ? "border-[#005429] text-[#005429]" 
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        <FaPercentage className="inline mr-2" />
                        Voucher ({analyticsData.voucherUsage.length})
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-red-700 text-sm">{error}</div>
                    </div>
                )}

                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-lg shadow border">
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                    <FaMoneyBillWave />
                                    Total Revenue
                                </div>
                                <div className="text-xl font-semibold text-green-900">
                                    {formatCurrency(overviewMetrics.totalRevenue)}
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow border">
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                    <FaPercentage />
                                    Total Diskon
                                </div>
                                <div className="text-xl font-semibold text-red-600">
                                    {formatCurrency(overviewMetrics.totalDiscount)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Tingkat Diskon: {formatPercentage(overviewMetrics.discountRate)}
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow border">
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                    <FaTags />
                                    Promo Aktif
                                </div>
                                <div className="text-xl font-semibold text-blue-600">
                                    {overviewMetrics.totalPromos}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {overviewMetrics.promoUsage} penggunaan
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow border">
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                    <FaUsers />
                                    Voucher Aktif
                                </div>
                                <div className="text-xl font-semibold text-purple-600">
                                    {overviewMetrics.totalVouchers}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {overviewMetrics.voucherRedemptions} penebusan
                                </div>
                            </div>
                        </div>

                        {/* Revenue Impact */}
                        {analyticsData.revenueImpact && (
                            <div className="bg-white p-6 rounded-lg shadow border">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Dampak Revenue</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-900">
                                            {formatCurrency(analyticsData.revenueImpact.totalBeforeDiscount)}
                                        </div>
                                        <div className="text-sm text-gray-600">Sebelum Diskon</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-900">
                                            {formatCurrency(analyticsData.revenueImpact.totalGrand)}
                                        </div>
                                        <div className="text-sm text-gray-600">Setelah Diskon</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-red-600">
                                            {formatPercentage(analyticsData.revenueImpact.discountRate)}
                                        </div>
                                        <div className="text-sm text-gray-600">Tingkat Diskon</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Promo Tab */}
                {activeTab === "promo" && (
                    <div className="rounded shadow-md bg-white shadow-slate-200">
                        <table className="min-w-full table-auto">
                            <thead className="text-[14px] text-gray-400 bg-gray-50">
                                <tr>
                                    <th className="px-4 py-4 text-left font-normal">Nama Promo</th>
                                    <th className="px-4 py-4 text-left font-normal">Tipe</th>
                                    <th className="px-4 py-4 text-right font-normal">Penggunaan</th>
                                    <th className="px-4 py-4 text-right font-normal">Total Diskon</th>
                                    <th className="px-4 py-4 text-right font-normal">Total Revenue</th>
                                    <th className="px-4 py-4 text-right font-normal">Efektivitas</th>
                                    <th className="px-4 py-4 text-right font-normal">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length > 0 ? (
                                    filteredData.map((promo, index) => (
                                        <tr key={index} className="hover:bg-gray-50 text-gray-500 border-b">
                                            <td className="p-4 font-medium">{promo.name || "-"}</td>
                                            <td className="p-4">
                                                <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                                    {promo.promoType || "-"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">{promo.totalOrders || 0}</td>
                                            <td className="p-4 text-right text-red-600">
                                                {formatCurrency(promo.totalDiscount || 0)}
                                            </td>
                                            <td className="p-4 text-right text-green-600">
                                                {formatCurrency(promo.totalRevenue || 0)}
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className={`font-semibold ${
                                                    (promo.discountEffectiveness || 0) > 50 ? 'text-green-600' : 
                                                    (promo.discountEffectiveness || 0) > 20 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                    {formatPercentage(promo.discountEffectiveness || 0)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className={`inline-block px-2 py-1 text-xs rounded ${
                                                    promo.status === 'EXCELLENT' ? 'bg-green-100 text-green-800' :
                                                    promo.status === 'GOOD' ? 'bg-blue-100 text-blue-800' :
                                                    promo.status === 'AVERAGE' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {promo.status || 'UNKNOWN'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-gray-500">
                                            {loading ? (
                                                <div className="flex justify-center">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#005429]"></div>
                                                </div>
                                            ) : (
                                                "Tidak ada data promo"
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Voucher Tab */}
                {activeTab === "voucher" && (
                    <div className="rounded shadow-md bg-white shadow-slate-200">
                        <table className="min-w-full table-auto">
                            <thead className="text-[14px] text-gray-400 bg-gray-50">
                                <tr>
                                    <th className="px-4 py-4 text-left font-normal">Kode</th>
                                    <th className="px-4 py-4 text-left font-normal">Nama Voucher</th>
                                    <th className="px-4 py-4 text-right font-normal">Digunakan</th>
                                    <th className="px-4 py-4 text-right font-normal">Kuota</th>
                                    <th className="px-4 py-4 text-right font-normal">Tingkat Penebusan</th>
                                    <th className="px-4 py-4 text-right font-normal">Total Diskon</th>
                                    <th className="px-4 py-4 text-right font-normal">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length > 0 ? (
                                    filteredData.map((voucher, index) => (
                                        <tr key={index} className="hover:bg-gray-50 text-gray-500 border-b">
                                            <td className="p-4 font-mono font-medium">{voucher.code || "-"}</td>
                                            <td className="p-4">{voucher.name || "-"}</td>
                                            <td className="p-4 text-right">{voucher.usedCount || 0}</td>
                                            <td className="p-4 text-right">{voucher.quota || 0}</td>
                                            <td className="p-4 text-right">
                                                <span className={`font-semibold ${
                                                    (voucher.redemptionRate || 0) > 70 ? 'text-green-600' : 
                                                    (voucher.redemptionRate || 0) > 30 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                    {formatPercentage(voucher.redemptionRate || 0)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right text-red-600">
                                                {formatCurrency(voucher.totalDiscount || 0)}
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className={`inline-block px-2 py-1 text-xs rounded ${
                                                    voucher.status === 'HIGH_PERFORMANCE' ? 'bg-green-100 text-green-800' :
                                                    voucher.status === 'HIGH_DEMAND' ? 'bg-blue-100 text-blue-800' :
                                                    voucher.status === 'NORMAL' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {voucher.status || 'UNKNOWN'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-gray-500">
                                            {loading ? (
                                                <div className="flex justify-center">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#005429]"></div>
                                                </div>
                                            ) : (
                                                "Tidak ada data voucher"
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiscountManagement;