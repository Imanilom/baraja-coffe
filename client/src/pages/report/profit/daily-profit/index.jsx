import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import { Link, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaFileExcel, FaBell, FaUser, FaClipboardList } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import { useSelector } from "react-redux";
import dayjs from "dayjs";

const DailyProfitManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { outlets } = useSelector((state) => state.outlet);

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [exportLoading, setExportLoading] = useState(false);

    // Initial state from URL
    const [dateRange, setDateRange] = useState(() => {
        const start = searchParams.get('startDate');
        const end = searchParams.get('endDate');
        return {
            startDate: start ? dayjs(start).toDate() : dayjs().startOf('month').toDate(),
            endDate: end ? dayjs(end).toDate() : dayjs().toDate()
        };
    });
    const [selectedOutlet, setSelectedOutlet] = useState(searchParams.get('outletId') || "");

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

    const formatDate = (dateString) => {
        return dayjs(dateString).format('DD-MM-YYYY');
    };

    const formatPercentage = (value) => {
        return `${(value || 0).toFixed(1)}%`;
    };

    const updateURLParams = useCallback(() => {
        const params = new URLSearchParams();
        if (dateRange.startDate) params.set('startDate', dayjs(dateRange.startDate).format('YYYY-MM-DD'));
        if (dateRange.endDate) params.set('endDate', dayjs(dateRange.endDate).format('YYYY-MM-DD'));
        if (selectedOutlet) params.set('outletId', selectedOutlet);
        setSearchParams(params);
    }, [dateRange, selectedOutlet, setSearchParams]);

    useEffect(() => {
        updateURLParams();
    }, [updateURLParams]);

    const fetchReportData = useCallback(async () => {
        if (!dateRange.startDate || !dateRange.endDate) return;

        setLoading(true);
        try {
            const params = {
                startDate: dayjs(dateRange.startDate).format('YYYY-MM-DD'),
                endDate: dayjs(dateRange.endDate).format('YYYY-MM-DD'),
            };

            if (selectedOutlet) {
                params.outletId = selectedOutlet;
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
    }, [dateRange, selectedOutlet]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    const dailyData = useMemo(() => {
        if (!reportData || !reportData.orders || reportData.orders.length === 0) {
            return [];
        }

        const dailyMap = new Map();

        reportData.orders.forEach(order => {
            const orderDate = dayjs(order.createdAt).format('YYYY-MM-DD');

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
            dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
        );
    }, [reportData]);

    const totals = useMemo(() => {
        const initialTotals = {
            totalRevenue: 0,
            totalTax: 0,
            totalDiscount: 0,
            totalRounding: 0,
            totalPurchase: 0,
            totalNetProfit: 0,
            profitMargin: 0
        };

        if (dailyData.length === 0) return initialTotals;

        const results = dailyData.reduce((acc, day) => ({
            totalRevenue: acc.totalRevenue + day.totalRevenue,
            totalTax: acc.totalTax + day.totalTax,
            totalDiscount: acc.totalDiscount + day.totalDiscount,
            totalRounding: acc.totalRounding + day.totalRounding,
            totalPurchase: acc.totalPurchase + day.totalPurchase,
            totalNetProfit: acc.totalNetProfit + day.totalNetProfit
        }), initialTotals);

        results.profitMargin = results.totalRevenue > 0
            ? (results.totalNetProfit / results.totalRevenue) * 100
            : 0;

        return results;
    }, [dailyData]);

    const exportToExcel = async () => {
        setExportLoading(true);
        try {
            if (!dailyData || dailyData.length === 0) {
                alert('Tidak ada data untuk diekspor');
                return;
            }

            const outletName = selectedOutlet ?
                outlets.find(o => o._id === selectedOutlet)?.name : 'Semua Outlet';

            const wb = XLSX.utils.book_new();

            const headerData = [
                ['Laporan Laba Harian'],
                [],
                ['Outlet', outletName],
                ['Tanggal', `${dayjs(dateRange.startDate).format('DD-MM-YYYY')} s/d ${dayjs(dateRange.endDate).format('DD-MM-YYYY')}`],
                [],
                ['Tanggal', 'Penjualan Kotor', 'Pajak', 'Diskon', 'Pembulatan', 'Pembelian', 'Laba Kotor', '% Laba Kotor']
            ];

            const dataRows = dailyData.map(item => {
                const profitMargin = item.totalRevenue > 0
                    ? ((item.totalNetProfit / item.totalRevenue) * 100)
                    : 0;

                return [
                    dayjs(item.date).format('DD-MM-YYYY'),
                    item.totalRevenue,
                    item.totalTax,
                    item.totalDiscount,
                    item.totalRounding,
                    item.totalPurchase,
                    item.totalNetProfit,
                    profitMargin / 100
                ];
            });

            const grandTotalRow = [
                'Grand Total',
                totals.totalRevenue,
                totals.totalTax,
                totals.totalDiscount,
                totals.totalRounding,
                totals.totalPurchase,
                totals.totalNetProfit,
                totals.totalRevenue > 0 ? (totals.totalNetProfit / totals.totalRevenue) : 0
            ];

            const allData = [...headerData, ...dataRows, grandTotalRow];
            const ws = XLSX.utils.aoa_to_sheet(allData);

            ws['!cols'] = [
                { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 12 },
                { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 15 }
            ];

            XLSX.utils.book_append_sheet(wb, ws, "Laba Harian");

            const filename = `Laporan_Laba_Harian_${outletName.replace(/\s+/g, '_')}_${dayjs(dateRange.startDate).format('YYYYMMDD')}_${dayjs(dateRange.endDate).format('YYYYMMDD')}.xlsx`;
            XLSX.writeFile(wb, filename);
        } catch (err) {
            console.error("Error exporting to Excel:", err);
            alert('Gagal mengekspor data. Silakan coba lagi.');
        } finally {
            setExportLoading(false);
        }
    };

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

            {/* Breadcrumb & Export */}
            <div className="px-6 py-4 flex justify-between items-center bg-white shadow-sm">
                <div className="flex items-center text-sm text-gray-500 font-medium">
                    <FaClipboardList className="mr-2" />
                    <span>Laporan</span>
                    <FaChevronRight className="mx-2 text-[10px]" />
                    <Link to="/admin/profit-menu" className="hover:text-green-900 transition-colors">Laporan Laba Rugi</Link>
                    <FaChevronRight className="mx-2 text-[10px]" />
                    <span className="text-green-900">Laba Harian</span>
                </div>
                <button
                    onClick={exportToExcel}
                    disabled={exportLoading || !dailyData || dailyData.length === 0}
                    className="flex items-center gap-2 bg-green-900 text-white text-[13px] px-4 py-2 rounded shadow-sm hover:bg-green-800 transition-colors disabled:opacity-50"
                >
                    <FaFileExcel />
                    {exportLoading ? 'Mengekspor...' : 'Ekspor Excel'}
                </button>
            </div>

            <div className="px-6 mt-6">
                {/* Statistics Cards */}
                {dailyData.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Penjualan Kotor</p>
                            <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.totalRevenue)}</p>
                        </div>
                        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Total Pajak</p>
                            <p className="text-xl font-bold text-blue-600">{formatCurrency(totals.totalTax)}</p>
                        </div>
                        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Laba Kotor</p>
                            <p className="text-xl font-bold text-green-700">{formatCurrency(totals.totalNetProfit)}</p>
                        </div>
                        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Margin Laba</p>
                            <p className={`text-xl font-bold ${totals.profitMargin >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                {formatPercentage(totals.profitMargin)}
                            </p>
                        </div>
                    </div>
                )}

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
                        <div className="flex items-end">
                            <button
                                onClick={() => { setDateRange({ startDate: dayjs().startOf('month').toDate(), endDate: dayjs().toDate() }); setSelectedOutlet(""); }}
                                className="w-full text-gray-500 border border-gray-200 text-[13px] py-2 rounded hover:bg-gray-50 transition-colors"
                            >
                                Reset Filter
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-100 text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Data Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4 text-right">Penjualan Kotor</th>
                                    <th className="px-6 py-4 text-right">Pajak</th>
                                    <th className="px-6 py-4 text-right">Diskon</th>
                                    <th className="px-6 py-4 text-right">Pembulatan</th>
                                    <th className="px-6 py-4 text-right">Pembelian</th>
                                    <th className="px-6 py-4 text-right">Laba Kotor</th>
                                    <th className="px-6 py-4 text-right">% Laba Kotor</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="py-20 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-900"></div>
                                        </td>
                                    </tr>
                                ) : dailyData.length > 0 ? (
                                    dailyData.map((item, index) => {
                                        const profitMargin = item.totalRevenue > 0
                                            ? (item.totalNetProfit / item.totalRevenue) * 100
                                            : 0;

                                        return (
                                            <tr key={index} className="hover:bg-green-50/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-700">{formatDate(item.date)}</td>
                                                <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(item.totalRevenue)}</td>
                                                <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(item.totalTax)}</td>
                                                <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(item.totalDiscount)}</td>
                                                <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(item.totalRounding)}</td>
                                                <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(item.totalPurchase)}</td>
                                                <td className={`px-6 py-4 text-right font-semibold ${item.totalNetProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                                    {formatCurrency(item.totalNetProfit)}
                                                </td>
                                                <td className={`px-6 py-4 text-right font-semibold ${profitMargin >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                                    {formatPercentage(profitMargin)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="py-20 text-center text-gray-400 font-medium bg-white">
                                            Tidak ada data ditemukan untuk periode yang dipilih
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {dailyData.length > 0 && !loading && (
                                <tfoot className="bg-gray-50 border-t-2 border-gray-100 font-bold">
                                    <tr className="text-gray-900">
                                        <td className="px-6 py-5 text-gray-500 uppercase text-[11px] tracking-wider">Total Keseluruhan</td>
                                        <td className="px-6 py-5 text-right font-black">{formatCurrency(totals.totalRevenue)}</td>
                                        <td className="px-6 py-5 text-right">{formatCurrency(totals.totalTax)}</td>
                                        <td className="px-6 py-5 text-right">{formatCurrency(totals.totalDiscount)}</td>
                                        <td className="px-6 py-5 text-right">{formatCurrency(totals.totalRounding)}</td>
                                        <td className="px-6 py-5 text-right">{formatCurrency(totals.totalPurchase)}</td>
                                        <td className={`px-6 py-5 text-right text-lg ${totals.totalNetProfit >= 0 ? 'text-green-900' : 'text-red-600'}`}>
                                            {formatCurrency(totals.totalNetProfit)}
                                        </td>
                                        <td className={`px-6 py-5 text-right text-lg ${totals.profitMargin >= 0 ? 'text-green-900' : 'text-red-600'}`}>
                                            {formatPercentage(totals.profitMargin)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-8 p-6 bg-white rounded-lg border border-gray-100 shadow-sm text-[12px] text-gray-500 leading-relaxed">
                    <p className="font-bold text-gray-400 uppercase tracking-widest mb-3">Informasi Tambahan</p>
                    <ul className="space-y-1.5 list-disc list-inside">
                        <li>Data hanya mencakup pesanan dengan status <span className="font-semibold text-gray-700">Completed/OnProcess</span> dan pembayaran settlement.</li>
                        <li>Laba kotor adalah hasil setelah dikurangi diskon dan penyesuaian operasional lainnya.</li>
                        <li>Pajak dihitung berdasarkan total nilai transaksi sebelum pengurangan diskon.</li>
                        <li>Waktu pelaporan disesuaikan dengan zona waktu <span className="font-semibold text-gray-700">WIB (Asia/Jakarta)</span>.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DailyProfitManagement;