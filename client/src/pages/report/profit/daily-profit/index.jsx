import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import { Link, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaFileExcel, FaBell, FaUser, FaClipboardList, FaPoll, FaCalendarAlt } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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
            startDate: start ? start : dayjs().startOf('month').format('YYYY-MM-DD'),
            endDate: end ? end : dayjs().format('YYYY-MM-DD')
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

    const updateURLParams = useCallback((newDateRange, newOutlet) => {
        const params = new URLSearchParams();
        if (newDateRange?.startDate) params.set('startDate', dayjs(newDateRange.startDate).format('YYYY-MM-DD'));
        if (newDateRange?.endDate) params.set('endDate', dayjs(newDateRange.endDate).format('YYYY-MM-DD'));
        if (newOutlet) params.set('outletId', newOutlet);
        setSearchParams(params);
    }, [setSearchParams]);

    const handleDateRangeChange = (newValue) => {
        if (newValue?.startDate && newValue?.endDate) {
            setDateRange(newValue);
            updateURLParams(newValue, selectedOutlet);
        }
    };

    const handleOutletChange = (selected) => {
        const newOutlet = selected?.value || "";
        setSelectedOutlet(newOutlet);
        updateURLParams(dateRange, newOutlet);
    };

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
            const isInclusive = orderDate >= '2026-06-04';

            let rev = order.revenue || 0;
            let disc = order.discounts || 0;
            let oldTax = order.tax || 0;
            let tax = isInclusive ? (rev - disc) * (10 / 110) : oldTax;

            if (!dailyMap.has(orderDate)) {
                dailyMap.set(orderDate, {
                    date: orderDate,
                    totalRevenue: 0,
                    totalTax: 0,
                    totalDiscount: 0,
                });
            }

            const dayData = dailyMap.get(orderDate);
            dayData.totalRevenue += rev;
            dayData.totalTax += tax;
            dayData.totalDiscount += disc;
        });

        return Array.from(dailyMap.values()).sort((a, b) =>
            dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
        ).map(item => ({
            ...item,
            // Hitung laba kotor manual: revenue - pajak - diskon
            totalNetProfit: item.totalRevenue - item.totalTax - item.totalDiscount
        }));
    }, [reportData]);

    const totals = useMemo(() => {
        const initialTotals = {
            totalRevenue: 0,
            totalTax: 0,
            totalDiscount: 0,
            totalNetProfit: 0,
            profitMargin: 0
        };

        if (dailyData.length === 0) return initialTotals;

        const results = dailyData.reduce((acc, day) => ({
            totalRevenue: acc.totalRevenue + day.totalRevenue,
            totalTax: acc.totalTax + day.totalTax,
            totalDiscount: acc.totalDiscount + day.totalDiscount,
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

            const outletName = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name
                : 'Semua Outlet';

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Laba Harian');

            // ── Styles ──────────────────────────────────────────────────────
            const titleFont   = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF005429' } };
            const infoFont    = { name: 'Calibri', size: 11 };
            const headerFont  = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
            const headerFill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005429' } };
            const totalFont   = { name: 'Calibri', size: 11, bold: true };
            const totalFill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
            const altFill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
            const thinBorder  = { style: 'thin', color: { argb: 'FFD1D5DB' } };
            const cellBorder  = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
            const rpFmt       = '"Rp"#,##0;"Rp"-#,##0';
            const pctFmt      = '0.00"%"';

            const cols = [
                { header: 'Tanggal',        key: 'date',      width: 16 },
                { header: 'Penjualan Kotor', key: 'revenue',  width: 22 },
                { header: 'Pajak',          key: 'tax',       width: 18 },
                { header: 'Diskon',         key: 'discount',  width: 18 },
                { header: 'Laba Kotor',     key: 'netProfit', width: 22 },
                { header: '% Laba Kotor',   key: 'margin',    width: 16 },
            ];
            ws.columns = cols.map(c => ({ key: c.key, width: c.width }));

            // ── Title block ─────────────────────────────────────────────────
            ws.mergeCells('A1:F1');
            const titleCell = ws.getCell('A1');
            titleCell.value = 'LAPORAN LABA HARIAN';
            titleCell.font  = titleFont;
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            ws.getRow(1).height = 28;

            ws.mergeCells('A2:F2');
            ws.getCell('A2').value = `Outlet: ${outletName}`;
            ws.getCell('A2').font  = infoFont;

            ws.mergeCells('A3:F3');
            ws.getCell('A3').value = `Periode: ${dayjs(dateRange.startDate).format('DD-MM-YYYY')} s/d ${dayjs(dateRange.endDate).format('DD-MM-YYYY')}`;
            ws.getCell('A3').font  = infoFont;

            ws.addRow([]); // spacer row 4

            // ── Column headers (row 5) ───────────────────────────────────────
            const headerRow = ws.addRow(cols.map(c => c.header));
            headerRow.height = 20;
            headerRow.eachCell(cell => {
                cell.font      = headerFont;
                cell.fill      = headerFill;
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border    = cellBorder;
            });

            // ── Data rows ───────────────────────────────────────────────────
            dailyData.forEach((item, idx) => {
                const margin = item.totalRevenue > 0
                    ? (item.totalNetProfit / item.totalRevenue) * 100
                    : 0;

                const row = ws.addRow([
                    dayjs(item.date).format('DD-MM-YYYY'),
                    item.totalRevenue,
                    item.totalTax,
                    item.totalDiscount,
                    item.totalNetProfit,
                    margin,
                ]);

                row.height = 18;
                const isAlt = idx % 2 === 1;

                row.eachCell((cell, colNum) => {
                    cell.border    = cellBorder;
                    cell.alignment = { vertical: 'middle', horizontal: colNum === 1 ? 'left' : 'right' };
                    if (isAlt) cell.fill = altFill;

                    // Currency format for columns 2-5
                    if (colNum >= 2 && colNum <= 5) cell.numFmt = rpFmt;
                    // Percentage for column 6
                    if (colNum === 6) {
                        cell.numFmt = pctFmt;
                        cell.font = { name: 'Calibri', size: 11,
                            color: { argb: item.totalNetProfit >= 0 ? 'FF15803D' : 'FFDC2626' } };
                    }
                    // Laba Kotor color (col 5)
                    if (colNum === 5) {
                        cell.font = { name: 'Calibri', size: 11, bold: true,
                            color: { argb: item.totalNetProfit >= 0 ? 'FF15803D' : 'FFDC2626' } };
                    }
                });
            });

            // ── Grand Total row ─────────────────────────────────────────────
            const margin = totals.totalRevenue > 0
                ? (totals.totalNetProfit / totals.totalRevenue) * 100 : 0;

            const totalRow = ws.addRow([
                'GRAND TOTAL',
                totals.totalRevenue,
                totals.totalTax,
                totals.totalDiscount,
                totals.totalNetProfit,
                margin,
            ]);
            totalRow.height = 22;
            totalRow.eachCell((cell, colNum) => {
                cell.font      = { ...totalFont, color: { argb: 'FF005429' } };
                cell.fill      = totalFill;
                cell.border    = { ...cellBorder, top: { style: 'medium', color: { argb: 'FF005429' } } };
                cell.alignment = { vertical: 'middle', horizontal: colNum === 1 ? 'left' : 'right' };
                if (colNum >= 2 && colNum <= 5) cell.numFmt = rpFmt;
                if (colNum === 6) cell.numFmt = pctFmt;
            });

            const filename = `Laporan_Laba_Harian_${outletName.replace(/\s+/g, '_')}_${dayjs(dateRange.startDate).format('YYYYMMDD')}_${dayjs(dateRange.endDate).format('YYYYMMDD')}.xlsx`;
            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);

        } catch (err) {
            console.error('Error exporting to Excel:', err);
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
                {/* View Mode Tabs: Harian vs Bulanan */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    <Link
                        to="/admin/daily-profit"
                        className="px-4 py-2.5 font-bold text-sm border-b-2 border-green-900 text-green-900 flex items-center gap-2"
                    >
                        <FaPoll />
                        <span>Laba Harian</span>
                    </Link>
                    <Link
                        to="/admin/monthly-profit"
                        className="px-4 py-2.5 font-medium text-sm text-gray-500 hover:text-green-900 flex items-center gap-2 transition-colors border-b-2 border-transparent"
                    >
                        <FaCalendarAlt />
                        <span>Laba Bulanan</span>
                    </Link>
                </div>
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
                                onChange={handleDateRangeChange}
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
                                onChange={handleOutletChange}
                                styles={customSelectStyles}
                                isSearchable
                                placeholder="Pilih Outlet"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => { 
                                    const defaultRange = { startDate: dayjs().startOf('month').format('YYYY-MM-DD'), endDate: dayjs().format('YYYY-MM-DD') };
                                    setDateRange(defaultRange); 
                                    setSelectedOutlet(""); 
                                    updateURLParams(defaultRange, "");
                                }}
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
                                    <th className="px-6 py-4 text-right">Laba Kotor</th>
                                    <th className="px-6 py-4 text-right">% Laba Kotor</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
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
                                        <td colSpan={6} className="py-20 text-center text-gray-400 font-medium bg-white">
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