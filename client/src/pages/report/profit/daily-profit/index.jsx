import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaChevronRight, FaFileExcel } from "react-icons/fa";
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

    const [reportData, setReportData] = useState(null);
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

    // Fetch report data
    const fetchReportData = async (startDate, endDate, outletId = "") => {
        setLoading(true);
        try {
            const params = {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
            };

            if (outletId) {
                params.outletId = outletId;
            }

            const response = await axios.get('/api/report/daily-profit', { params });

            if (response.data.success) {
                setReportData(response.data.data);
                setError(null);
            } else {
                throw new Error(response.data.message || 'Failed to fetch report data');
            }
        } catch (err) {
            console.error("Error fetching report data:", err);
            setError("Gagal memuat data laporan. Silakan coba lagi.");
            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when filters change
    useEffect(() => {
        if (dateRange.startDate && dateRange.endDate) {
            fetchReportData(dateRange.startDate, dateRange.endDate, selectedOutlet);
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

    // Calculate daily data from orders
    const calculateDailyData = () => {
        if (!reportData || !reportData.orders || reportData.orders.length === 0) {
            return [];
        }

        const dailyMap = new Map();

        reportData.orders.forEach(order => {
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0];

            if (!dailyMap.has(orderDate)) {
                dailyMap.set(orderDate, {
                    date: orderDate,
                    totalRevenue: 0,
                    totalTax: 0,
                    totalDiscount: 0,
                    totalRounding: 0,
                    totalPurchase: 0,
                    totalNetProfit: 0
                });
            }

            const dayData = dailyMap.get(orderDate);
            dayData.totalRevenue += order.revenue || 0;
            dayData.totalTax += order.tax || 0;
            dayData.totalDiscount += order.discounts || 0;
            dayData.totalNetProfit += order.netProfit || 0;
        });

        return Array.from(dailyMap.values()).sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );
    };

    const dailyData = calculateDailyData();

    // Calculate totals
    const calculateTotals = () => {
        if (dailyData.length === 0) {
            return {
                totalRevenue: 0,
                totalTax: 0,
                totalDiscount: 0,
                totalRounding: 0,
                totalPurchase: 0,
                totalNetProfit: 0,
                profitMargin: 0
            };
        }

        const totals = dailyData.reduce((acc, day) => ({
            totalRevenue: acc.totalRevenue + day.totalRevenue,
            totalTax: acc.totalTax + day.totalTax,
            totalDiscount: acc.totalDiscount + day.totalDiscount,
            totalRounding: acc.totalRounding + day.totalRounding,
            totalPurchase: acc.totalPurchase + day.totalPurchase,
            totalNetProfit: acc.totalNetProfit + day.totalNetProfit
        }), {
            totalRevenue: 0,
            totalTax: 0,
            totalDiscount: 0,
            totalRounding: 0,
            totalPurchase: 0,
            totalNetProfit: 0
        });

        totals.profitMargin = totals.totalRevenue > 0
            ? (totals.totalNetProfit / totals.totalRevenue) * 100
            : 0;

        return totals;
    };

    const totals = calculateTotals();

    // Export to Excel
    const exportToExcel = async () => {
        setExportLoading(true);
        try {
            if (!dailyData || dailyData.length === 0) {
                alert('Tidak ada data untuk diekspor');
                return;
            }

            const outletName = selectedOutlet ?
                outlets.find(o => o._id === selectedOutlet)?.name : 'Semua Outlet';

            const formatDateForExcel = (dateStr) => {
                const date = new Date(dateStr);
                const pad = (n) => n.toString().padStart(2, "0");
                return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
            };

            const wb = XLSX.utils.book_new();

            const headerData = [
                ['Laporan Laba Harian'],
                [],
                ['Outlet', outletName],
                ['Tanggal', `${formatDateForExcel(dateRange.startDate)} s/d ${formatDateForExcel(dateRange.endDate)}`],
                [],
                ['Tanggal', 'Penjualan Kotor', 'Pajak', 'Diskon', 'Pembulatan', 'Pembelian', 'Laba Kotor', '% Laba Kotor']
            ];

            const dataRows = dailyData.map(item => {
                const profitMargin = item.totalRevenue > 0
                    ? ((item.totalNetProfit / item.totalRevenue) * 100)
                    : 0;

                return [
                    formatDateForExcel(item.date),
                    item.totalRevenue,
                    item.totalTax,
                    item.totalDiscount,
                    item.totalRounding,
                    item.totalPurchase,
                    item.totalNetProfit,
                    profitMargin / 100
                ];
            });

            const grandTotal = [
                'Grand Total',
                totals.totalRevenue,
                totals.totalTax,
                totals.totalDiscount,
                totals.totalRounding,
                totals.totalPurchase,
                totals.totalNetProfit,
                totals.totalRevenue > 0 ? (totals.totalNetProfit / totals.totalRevenue) : 0
            ];

            const allData = [...headerData, ...dataRows, grandTotal];
            const ws = XLSX.utils.aoa_to_sheet(allData);

            ws['!cols'] = [
                { wch: 15 },
                { wch: 18 },
                { wch: 12 },
                { wch: 12 },
                { wch: 12 },
                { wch: 12 },
                { wch: 18 },
                { wch: 15 }
            ];

            const range = XLSX.utils.decode_range(ws['!ref']);

            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[cellAddress]) continue;

                    if (R === 0) {
                        ws[cellAddress].s = {
                            font: { bold: true, sz: 14 },
                            alignment: { horizontal: 'left', vertical: 'center' }
                        };
                    }

                    if ((R === 2 || R === 3) && C === 0) {
                        ws[cellAddress].s = {
                            font: { bold: true },
                            alignment: { horizontal: 'left', vertical: 'center' }
                        };
                    }

                    if (R === 5) {
                        ws[cellAddress].s = {
                            font: { bold: true },
                            fill: { fgColor: { rgb: "F3F4F6" } },
                            border: {
                                top: { style: 'thin', color: { rgb: "000000" } },
                                bottom: { style: 'thin', color: { rgb: "000000" } },
                                left: { style: 'thin', color: { rgb: "000000" } },
                                right: { style: 'thin', color: { rgb: "000000" } }
                            },
                            alignment: { horizontal: 'center', vertical: 'center' }
                        };
                    }

                    if (R > 5 && R < range.e.r) {
                        if (C >= 1 && C <= 6) {
                            ws[cellAddress].t = 'n';
                            ws[cellAddress].z = '#,##0';
                        }
                        if (C === 7) {
                            ws[cellAddress].t = 'n';
                            ws[cellAddress].z = '0.0%';
                        }

                        ws[cellAddress].s = {
                            border: {
                                top: { style: 'thin', color: { rgb: "E5E7EB" } },
                                bottom: { style: 'thin', color: { rgb: "E5E7EB" } },
                                left: { style: 'thin', color: { rgb: "E5E7EB" } },
                                right: { style: 'thin', color: { rgb: "E5E7EB" } }
                            },
                            alignment: {
                                horizontal: C === 0 ? 'left' : 'right',
                                vertical: 'center'
                            }
                        };
                    }

                    if (R === range.e.r) {
                        ws[cellAddress].s = {
                            font: { bold: true },
                            fill: { fgColor: { rgb: "F3F4F6" } },
                            border: {
                                top: { style: 'thin', color: { rgb: "000000" } },
                                bottom: { style: 'thin', color: { rgb: "000000" } },
                                left: { style: 'thin', color: { rgb: "000000" } },
                                right: { style: 'thin', color: { rgb: "000000" } }
                            },
                            alignment: {
                                horizontal: C === 0 ? 'left' : 'right',
                                vertical: 'center'
                            }
                        };

                        if (C >= 1 && C <= 6) {
                            ws[cellAddress].t = 'n';
                            ws[cellAddress].z = '#,##0';
                        }
                        if (C === 7) {
                            ws[cellAddress].t = 'n';
                            ws[cellAddress].z = '0.0%';
                        }
                    }
                }
            }

            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }
            ];

            XLSX.utils.book_append_sheet(wb, ws, "Laba Harian");

            const startDateStr = formatDateForExcel(dateRange.startDate);
            const endDateStr = formatDateForExcel(dateRange.endDate);
            const filename = `Laporan_Laba_Harian_${outletName.replace(/\s+/g, '_')}_${startDateStr}_to_${endDateStr}.xlsx`;

            XLSX.writeFile(wb, filename);
        } catch (err) {
            console.error("Error exporting to Excel:", err);
            alert('Gagal mengekspor data. Silakan coba lagi.');
        } finally {
            setExportLoading(false);
        }
    };

    if (loading && !reportData) {
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
                        onClick={exportToExcel}
                        disabled={exportLoading || !dailyData || dailyData.length === 0}
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
                {dailyData && dailyData.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow border">
                            <div className="text-sm text-gray-500">Total Penjualan Kotor</div>
                            <div className="text-xl font-semibold text-green-900">
                                {formatCurrency(totals.totalRevenue)}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border">
                            <div className="text-sm text-gray-500">Total Pajak</div>
                            <div className="text-xl font-semibold text-blue-900">
                                {formatCurrency(totals.totalTax)}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border">
                            <div className="text-sm text-gray-500">Total Laba Kotor</div>
                            <div className="text-xl font-semibold text-green-900">
                                {formatCurrency(totals.totalNetProfit)}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border">
                            <div className="text-sm text-gray-500">Margin Laba</div>
                            <div className="text-xl font-semibold text-green-900">
                                {formatPercentage(totals.profitMargin)}
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
                <div className="rounded shadow-md bg-white shadow-slate-200 overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead className="text-[14px] text-gray-400 bg-gray-50">
                            <tr>
                                <th className="px-4 py-4 text-left font-normal">Tanggal</th>
                                <th className="px-4 py-4 text-right font-normal">Penjualan Kotor</th>
                                <th className="px-4 py-4 text-right font-normal">Pajak</th>
                                <th className="px-4 py-4 text-right font-normal">Diskon</th>
                                <th className="px-4 py-4 text-right font-normal">Pembulatan</th>
                                <th className="px-4 py-4 text-right font-normal">Pembelian</th>
                                <th className="px-4 py-4 text-right font-normal">Laba Kotor</th>
                                <th className="px-4 py-4 text-right font-normal">% Laba Kotor</th>
                            </tr>
                        </thead>
                        {dailyData && dailyData.length > 0 ? (
                            <tbody>
                                {dailyData.map((item, index) => {
                                    const profitMargin = item.totalRevenue > 0
                                        ? (item.totalNetProfit / item.totalRevenue) * 100
                                        : 0;

                                    return (
                                        <tr key={index} className="hover:bg-gray-50 text-gray-500 border-b">
                                            <td className="p-4 font-medium">{formatDate(item.date)}</td>
                                            <td className="p-4 text-right">{formatCurrency(item.totalRevenue)}</td>
                                            <td className="p-4 text-right">{formatCurrency(item.totalTax)}</td>
                                            <td className="p-4 text-right">{formatCurrency(item.totalDiscount)}</td>
                                            <td className="p-4 text-right">{formatCurrency(item.totalRounding)}</td>
                                            <td className="p-4 text-right">{formatCurrency(item.totalPurchase)}</td>
                                            <td className="p-4 text-right">
                                                <span className={`font-semibold ${item.totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatCurrency(item.totalNetProfit)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className={`font-semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatPercentage(profitMargin)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-gray-500">
                                        {loading ? (
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#005429]"></div>
                                            </div>
                                        ) : (
                                            "Tidak ada data untuk rentang tanggal yang dipilih"
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        )}
                        {/* Footer dengan grand total */}
                        {dailyData && dailyData.length > 0 && (
                            <tfoot className="bg-gray-50 border-t font-semibold text-sm">
                                <tr>
                                    <td className="p-4 text-gray-700">GRAND TOTAL</td>
                                    <td className="p-4 text-right text-gray-700">
                                        {formatCurrency(totals.totalRevenue)}
                                    </td>
                                    <td className="p-4 text-right text-gray-700">
                                        {formatCurrency(totals.totalTax)}
                                    </td>
                                    <td className="p-4 text-right text-gray-700">
                                        {formatCurrency(totals.totalDiscount)}
                                    </td>
                                    <td className="p-4 text-right text-gray-700">
                                        {formatCurrency(totals.totalRounding)}
                                    </td>
                                    <td className="p-4 text-right text-gray-700">
                                        {formatCurrency(totals.totalPurchase)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className={`${totals.totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(totals.totalNetProfit)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className={`${totals.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatPercentage(totals.profitMargin)}
                                        </span>
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {/* Info */}
                {dailyData && dailyData.length > 0 && (
                    <div className="mt-4 text-xs text-gray-500">
                        <p>• Data hanya menampilkan pesanan dengan status Completed/OnProcess dan pembayaran settlement</p>
                        <p>• Laba kotor sudah dikurangi diskon dan penyesuaian lainnya</p>
                        <p>• Pajak dihitung dari total transaksi sebelum dikurangi diskon</p>
                        <p>• Waktu menggunakan zona waktu WIB (Asia/Jakarta)</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailyProfitManagement;