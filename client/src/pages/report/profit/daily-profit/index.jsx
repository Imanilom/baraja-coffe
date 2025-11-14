import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaFileExcel, FaSync } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";

const DailyProfitManagement = () => {
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

    const [profitData, setProfitData] = useState(null);
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(),
        endDate: new Date()
    });
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [exportLoading, setExportLoading] = useState(false);

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

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
    };

    // Format percentage
    const formatPercentage = (value) => {
        return `${(value || 0).toFixed(1)}%`;
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

    // Fetch profit data
    const fetchProfitData = async (startDate, endDate, outletId = "") => {
        setLoading(true);
        try {
            const params = {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
            };
            
            if (outletId) {
                params.outletId = outletId;
            }

            const response = await axios.get('/api/report/daily-profit/range', { params });
            
            if (response.data.success) {
                setProfitData(response.data.data);
                setError(null);
            } else {
                throw new Error(response.data.message || 'Failed to fetch profit data');
            }
        } catch (err) {
            console.error("Error fetching profit data:", err);
            setError("Gagal memuat data profit. Silakan coba lagi.");
            setProfitData([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when filters change
    useEffect(() => {
        if (dateRange.startDate && dateRange.endDate) {
            fetchProfitData(dateRange.startDate, dateRange.endDate, selectedOutlet);
        }
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
        if (dateRange.startDate && dateRange.endDate) {
            fetchProfitData(dateRange.startDate, dateRange.endDate, selectedOutlet);
        }
    };

    // Export to Excel
    const exportToExcel = async () => {
        setExportLoading(true);
        try {
            if (!profitData || profitData.length === 0) {
                alert('Tidak ada data untuk diekspor');
                return;
            }

            // Prepare data for export
            const dataToExport = profitData.map(item => ({
                "Tanggal": item.date,
                "Penjualan Kotor": item.totalRevenue,
                "Laba Bersih": item.totalNetProfit,
                "Total Pesanan": item.totalOrders,
                "Total Item Terjual": item.totalItemsSold,
                "Rata-rata Nilai Pesanan": Math.round(item.totalNetProfit / item.totalOrders) || 0
            }));

            // Add summary row
            const summary = {
                "Tanggal": "TOTAL",
                "Penjualan Kotor": profitData.reduce((sum, item) => sum + item.totalRevenue, 0),
                "Laba Bersih": profitData.reduce((sum, item) => sum + item.totalNetProfit, 0),
                "Total Pesanan": profitData.reduce((sum, item) => sum + item.totalOrders, 0),
                "Total Item Terjual": profitData.reduce((sum, item) => sum + item.totalItemsSold, 0),
                "Rata-rata Nilai Pesanan": Math.round(
                    profitData.reduce((sum, item) => sum + item.totalNetProfit, 0) / 
                    profitData.reduce((sum, item) => sum + item.totalOrders, 0)
                ) || 0
            };

            dataToExport.push(summary);

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Laba Harian");
            
            // Generate filename
            const startDateStr = dateRange.startDate.toISOString().split('T')[0];
            const endDateStr = dateRange.endDate.toISOString().split('T')[0];
            const outletName = selectedOutlet ? 
                outlets.find(o => o._id === selectedOutlet)?.name : 'Semua-Outlet';
            
            const filename = `Laba_Harian_${outletName}_${startDateStr}_to_${endDateStr}.xlsx`;
            XLSX.writeFile(wb, filename);
        } catch (err) {
            console.error("Error exporting to Excel:", err);
            alert('Gagal mengekspor data. Silakan coba lagi.');
        } finally {
            setExportLoading(false);
        }
    };

    // Calculate totals for display
    const calculateTotals = () => {
        if (!profitData || profitData.length === 0) {
            return {
                totalRevenue: 0,
                totalNetProfit: 0,
                totalOrders: 0,
                totalItemsSold: 0,
                averageOrderValue: 0
            };
        }

        return {
            totalRevenue: profitData.reduce((sum, item) => sum + item.totalRevenue, 0),
            totalNetProfit: profitData.reduce((sum, item) => sum + item.totalNetProfit, 0),
            totalOrders: profitData.reduce((sum, item) => sum + item.totalOrders, 0),
            totalItemsSold: profitData.reduce((sum, item) => sum + item.totalItemsSold, 0),
            averageOrderValue: Math.round(
                profitData.reduce((sum, item) => sum + item.totalNetProfit, 0) / 
                profitData.reduce((sum, item) => sum + item.totalOrders, 0)
            ) || 0
        };
    };

    const totals = calculateTotals();

    // Show loading state
    if (loading && !profitData) {
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
                    <p>Laporan</p>
                    <FaChevronRight />
                    <Link to="/admin/profit-menu">Laporan Laba Rugi</Link>
                    <FaChevronRight />
                    <span>Laba Harian</span>
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
                        disabled={exportLoading || !profitData || profitData.length === 0}
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
                </div>

                {/* Summary Cards */}
                {profitData && profitData.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow border">
                            <div className="text-sm text-gray-500">Total Penjualan</div>
                            <div className="text-xl font-semibold text-green-900">
                                {formatCurrency(totals.totalRevenue)}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border">
                            <div className="text-sm text-gray-500">Laba Bersih</div>
                            <div className="text-xl font-semibold text-green-900">
                                {formatCurrency(totals.totalNetProfit)}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border">
                            <div className="text-sm text-gray-500">Total Pesanan</div>
                            <div className="text-xl font-semibold text-green-900">
                                {totals.totalOrders} Pesanan
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border">
                            <div className="text-sm text-gray-500">Rata-rata Pesanan</div>
                            <div className="text-xl font-semibold text-green-900">
                                {formatCurrency(totals.averageOrderValue)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-red-700 text-sm">{error}</div>
                    </div>
                )}

                {/* Table */}
                <div className="rounded shadow-md bg-white shadow-slate-200">
                    <table className="min-w-full table-auto">
                        <thead className="text-[14px] text-gray-400 bg-gray-50">
                            <tr>
                                <th className="px-4 py-4 text-left font-normal">Tanggal</th>
                                <th className="px-4 py-4 text-right font-normal">Penjualan Kotor</th>
                                <th className="px-4 py-4 text-right font-normal">Laba Bersih</th>
                                <th className="px-4 py-4 text-right font-normal">Total Pesanan</th>
                                <th className="px-4 py-4 text-right font-normal">Item Terjual</th>
                                <th className="px-4 py-4 text-right font-normal">Rata-rata Pesanan</th>
                            </tr>
                        </thead>
                        {profitData && profitData.length > 0 ? (
                            <tbody>
                                {profitData.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 text-gray-500 border-b">
                                        <td className="p-4 font-medium">{formatDate(item.date)}</td>
                                        <td className="p-4 text-right">{formatCurrency(item.totalRevenue)}</td>
                                        <td className="p-4 text-right">
                                            <span className={`font-semibold ${
                                                item.totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {formatCurrency(item.totalNetProfit)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">{item.totalOrders}</td>
                                        <td className="p-4 text-right">{item.totalItemsSold}</td>
                                        <td className="p-4 text-right">
                                            {formatCurrency(Math.round(item.totalNetProfit / item.totalOrders) || 0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500">
                                        {loading ? (
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#005429]"></div>
                                            </div>
                                        ) : (
                                            "Tidak ada data profit untuk rentang tanggal yang dipilih"
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        )}
                        {/* Footer dengan grand total */}
                        {profitData && profitData.length > 0 && (
                            <tfoot className="bg-gray-50 border-t font-semibold text-sm">
                                <tr>
                                    <td className="p-4 text-gray-700">GRAND TOTAL</td>
                                    <td className="p-4 text-right text-gray-700">
                                        {formatCurrency(totals.totalRevenue)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className={`${
                                            totals.totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {formatCurrency(totals.totalNetProfit)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right text-gray-700">{totals.totalOrders}</td>
                                    <td className="p-4 text-right text-gray-700">{totals.totalItemsSold}</td>
                                    <td className="p-4 text-right text-gray-700">
                                        {formatCurrency(totals.averageOrderValue)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {/* Info */}
                {profitData && profitData.length > 0 && (
                    <div className="mt-4 text-xs text-gray-500">
                        <p>• Data hanya menampilkan pesanan dengan status Completed/OnProcess dan pembayaran settlement</p>
                        <p>• Laba bersih sudah dikurangi diskon dan penyesuaian lainnya</p>
                        <p>• Waktu menggunakan zona waktu WIB (Asia/Jakarta)</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailyProfitManagement;