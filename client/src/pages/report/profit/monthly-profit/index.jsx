import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import axios from '@/lib/axios';
import { Link, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaFileExcel, FaFilePdf, FaBell, FaUser, FaClipboardList, FaCalendarAlt, FaPoll, FaSyncAlt } from "react-icons/fa";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Select from "react-select";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import 'dayjs/locale/id';

dayjs.locale('id');

const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const MonthlyProfitManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { outlets } = useSelector((state) => state.outlet);

    const currentYear = dayjs().year();
    const [selectedYear, setSelectedYear] = useState(() => {
        const y = parseInt(searchParams.get('year'), 10);
        return !isNaN(y) && y >= 2020 && y <= currentYear + 2 ? y : currentYear;
    });
    const [selectedOutlet, setSelectedOutlet] = useState(searchParams.get('outletId') || "");

    // Template 12 bulan
    const initialMonths = useMemo(() => {
        const now = dayjs();
        const thisYear = now.year();
        const thisMonth = now.month();

        return MONTH_NAMES.map((name, index) => {
            const isFuture = selectedYear > thisYear || (selectedYear === thisYear && index > thisMonth);
            return {
                monthIndex: index,
                monthName: name,
                monthKey: `${selectedYear}-${String(index + 1).padStart(2, '0')}`,
                totalOrders: 0,
                totalRevenue: 0,
                totalTax: 0,
                totalDiscount: 0,
                totalNetProfit: 0,
                profitMargin: 0,
                isLoading: false,
                isFuture,
                hasError: false,
            };
        });
    }, [selectedYear]);

    const [monthlyData, setMonthlyData] = useState(initialMonths);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ loaded: 0, total: 12 });
    const [error, setError] = useState(null);
    const [exportExcelLoading, setExportExcelLoading] = useState(false);
    const [exportPdfLoading, setExportPdfLoading] = useState(false);
    const tableRef = useRef(null);

    // Cache in-memory: key = `${year}_${outletId || 'all'}`
    const cacheRef = useRef(new Map());
    const abortControllerRef = useRef(null);

    const yearOptions = useMemo(() => {
        const years = [];
        for (let y = currentYear + 1; y >= 2022; y--) {
            years.push({ value: y, label: `Tahun ${y}` });
        }
        return years;
    }, [currentYear]);

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

    const updateURLParams = useCallback((year, outlet) => {
        const params = new URLSearchParams();
        if (year) params.set('year', year.toString());
        if (outlet) params.set('outletId', outlet);
        setSearchParams(params);
    }, [setSearchParams]);

    const handleYearChange = (selected) => {
        const year = selected?.value || currentYear;
        setSelectedYear(year);
        updateURLParams(year, selectedOutlet);
    };

    const handleOutletChange = (selected) => {
        const newOutlet = selected?.value || "";
        setSelectedOutlet(newOutlet);
        updateURLParams(selectedYear, newOutlet);
    };

    // Ambil data bulanan per batch/chunk secara paralel agar ringan & anti 504 Gateway Timeout
    const fetchReportData = useCallback(async (forceRefresh = false) => {
        // Batalkan request yang sedang berjalan sebelumnya
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        const cacheKey = `${selectedYear}_${selectedOutlet || 'all'}`;

        if (!forceRefresh && cacheRef.current.has(cacheKey)) {
            setMonthlyData(cacheRef.current.get(cacheKey));
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        const now = dayjs();
        const thisYear = now.year();
        const thisMonth = now.month();

        // Siapkan state 12 bulan
        const baseMonths = MONTH_NAMES.map((name, index) => {
            const isFuture = selectedYear > thisYear || (selectedYear === thisYear && index > thisMonth);
            return {
                monthIndex: index,
                monthName: name,
                monthKey: `${selectedYear}-${String(index + 1).padStart(2, '0')}`,
                totalOrders: 0,
                totalRevenue: 0,
                totalTax: 0,
                totalDiscount: 0,
                totalNetProfit: 0,
                profitMargin: 0,
                isLoading: !isFuture,
                isFuture,
                hasError: false,
            };
        });

        setMonthlyData(baseMonths);

        // Hanya fetch bulan-bulan yang sudah berjalan (tidak fetch bulan masa depan)
        const monthsToFetch = baseMonths.filter(m => !m.isFuture);
        setProgress({ loaded: 0, total: monthsToFetch.length });

        if (monthsToFetch.length === 0) {
            setLoading(false);
            return;
        }

        let currentMonths = [...baseMonths];
        let completedCount = 0;

        // Fungsi fetch untuk 1 bulan tertentu
        const fetchSingleMonth = async (monthObj) => {
            if (signal.aborted) return;

            const mIdx = monthObj.monthIndex;
            const startDate = dayjs(new Date(selectedYear, mIdx, 1)).format('YYYY-MM-DD');
            const endDate = dayjs(new Date(selectedYear, mIdx + 1, 0)).format('YYYY-MM-DD');

            const params = {
                startDate,
                endDate,
            };
            if (selectedOutlet) {
                params.outletId = selectedOutlet;
            }

            try {
                const response = await axios.get('/api/report/daily-profit', {
                    params,
                    signal,
                    timeout: 45000,
                });

                if (response.data && response.data.success) {
                    const orders = response.data.data?.orders || [];
                    let totalOrders = 0;
                    let totalRevenue = 0;
                    let totalTax = 0;
                    let totalDiscount = 0;

                    orders.forEach(order => {
                        const orderDate = dayjs(order.createdAtWIB || order.createdAt);
                        const dateStr = orderDate.format('YYYY-MM-DD');
                        const isInclusive = dateStr >= '2026-06-04';

                        const rev = order.revenue || 0;
                        const disc = order.discounts || 0;
                        let tax = 0;

                        if (isInclusive) {
                            tax = (rev - disc) * (10 / 110);
                        } else {
                            tax = order.tax || 0;
                        }

                        totalOrders += 1;
                        totalRevenue += rev;
                        totalTax += tax;
                        totalDiscount += disc;
                    });

                    const totalNetProfit = totalRevenue - totalTax - totalDiscount;
                    const profitMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;

                    currentMonths = currentMonths.map(item =>
                        item.monthIndex === mIdx
                            ? {
                                  ...item,
                                  totalOrders,
                                  totalRevenue,
                                  totalTax,
                                  totalDiscount,
                                  totalNetProfit,
                                  profitMargin,
                                  isLoading: false,
                                  hasError: false,
                              }
                            : item
                    );
                } else {
                    currentMonths = currentMonths.map(item =>
                        item.monthIndex === mIdx ? { ...item, isLoading: false, hasError: true } : item
                    );
                }
            } catch (err) {
                if (axios.isCancel(err) || err.name === 'CanceledError' || signal.aborted) {
                    return;
                }
                console.error(`Error fetching data bulan ${monthObj.monthName}:`, err);
                currentMonths = currentMonths.map(item =>
                    item.monthIndex === mIdx ? { ...item, isLoading: false, hasError: true } : item
                );
            } finally {
                if (!signal.aborted) {
                    completedCount += 1;
                    setProgress({ loaded: completedCount, total: monthsToFetch.length });
                    // Update state secara progresif sehingga tabel langsung menampilkan data tiap bulan selesai
                    setMonthlyData([...currentMonths]);
                }
            }
        };

        // Antrean pemrosesan dengan concurrency pool (3 request bersamaan)
        // Menghindari beban berlebih sekaligus sangat cepat (3-5 detik selesai)
        const concurrency = 3;
        const queue = [...monthsToFetch];
        const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
            while (queue.length > 0 && !signal.aborted) {
                const item = queue.shift();
                if (item) {
                    await fetchSingleMonth(item);
                }
            }
        });

        try {
            await Promise.all(workers);
            if (!signal.aborted) {
                cacheRef.current.set(cacheKey, currentMonths);
            }
        } catch (err) {
            if (!signal.aborted) {
                console.error("Batch fetch error:", err);
                setError("Beberapa data bulan gagal dimuat. Anda dapat mencoba klik 'Muat Ulang'.");
            }
        } finally {
            if (!signal.aborted) {
                setLoading(false);
            }
        }
    }, [selectedYear, selectedOutlet]);

    useEffect(() => {
        fetchReportData();
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchReportData]);

    // Hitung Grand Total dari bulan-bulan yang sudah ada datanya
    const totals = useMemo(() => {
        const initialTotals = {
            totalOrders: 0,
            totalRevenue: 0,
            totalTax: 0,
            totalDiscount: 0,
            totalNetProfit: 0,
            profitMargin: 0
        };

        if (monthlyData.length === 0) return initialTotals;

        const results = monthlyData.reduce((acc, m) => ({
            totalOrders: acc.totalOrders + (m.totalOrders || 0),
            totalRevenue: acc.totalRevenue + (m.totalRevenue || 0),
            totalTax: acc.totalTax + (m.totalTax || 0),
            totalDiscount: acc.totalDiscount + (m.totalDiscount || 0),
            totalNetProfit: acc.totalNetProfit + (m.totalNetProfit || 0)
        }), initialTotals);

        results.profitMargin = results.totalRevenue > 0
            ? (results.totalNetProfit / results.totalRevenue) * 100
            : 0;

        return results;
    }, [monthlyData]);

    const exportToExcel = async () => {
        setExportExcelLoading(true);
        try {
            const outletName = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name
                : 'Semua Outlet';

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet(`Laba Bulanan ${selectedYear}`);

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
                { header: 'No',               key: 'no',          width: 8 },
                { header: 'Bulan',            key: 'month',       width: 20 },
                { header: 'Transaksi',        key: 'orders',      width: 14 },
                { header: 'Penjualan Kotor',  key: 'revenue',     width: 22 },
                { header: 'Pajak',            key: 'tax',         width: 18 },
                { header: 'Diskon',           key: 'discount',    width: 18 },
                { header: 'Laba Kotor',       key: 'netProfit',   width: 22 },
                { header: '% Laba Kotor',     key: 'margin',      width: 16 },
            ];
            ws.columns = cols.map(c => ({ key: c.key, width: c.width }));

            // ── Title block ─────────────────────────────────────────────────
            ws.mergeCells('A1:H1');
            const titleCell = ws.getCell('A1');
            titleCell.value = `LAPORAN LABA BULANAN - TAHUN ${selectedYear}`;
            titleCell.font  = titleFont;
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            ws.getRow(1).height = 28;

            ws.mergeCells('A2:H2');
            ws.getCell('A2').value = `Outlet: ${outletName}`;
            ws.getCell('A2').font  = infoFont;

            ws.mergeCells('A3:H3');
            ws.getCell('A3').value = `Periode: Januari s/d Desember ${selectedYear}`;
            ws.getCell('A3').font  = infoFont;

            ws.addRow([]); // spacer row 4

            // ── Column headers (row 5) ───────────────────────────────────────
            const headerRow = ws.addRow(cols.map(c => c.header));
            headerRow.height = 22;
            headerRow.eachCell(cell => {
                cell.font      = headerFont;
                cell.fill      = headerFill;
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border    = cellBorder;
            });

            // ── Data rows ───────────────────────────────────────────────────
            monthlyData.forEach((item, idx) => {
                const row = ws.addRow([
                    idx + 1,
                    item.monthName,
                    item.totalOrders,
                    item.totalRevenue,
                    item.totalTax,
                    item.totalDiscount,
                    item.totalNetProfit,
                    item.profitMargin,
                ]);

                row.height = 20;
                const isAlt = idx % 2 === 1;

                row.eachCell((cell, colNum) => {
                    cell.border = cellBorder;
                    if (isAlt) cell.fill = altFill;

                    if (colNum === 1 || colNum === 3) {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    } else if (colNum === 2) {
                        cell.alignment = { vertical: 'middle', horizontal: 'left' };
                        cell.font = { name: 'Calibri', size: 11, bold: true };
                    } else {
                        cell.alignment = { vertical: 'middle', horizontal: 'right' };
                    }

                    // Currency format for columns 4-7
                    if (colNum >= 4 && colNum <= 7) cell.numFmt = rpFmt;

                    // Percentage for column 8
                    if (colNum === 8) {
                        cell.numFmt = pctFmt;
                        cell.font = {
                            name: 'Calibri',
                            size: 11,
                            color: { argb: item.totalNetProfit >= 0 ? 'FF15803D' : 'FFDC2626' }
                        };
                    }

                    // Laba Kotor highlight (col 7)
                    if (colNum === 7) {
                        cell.font = {
                            name: 'Calibri',
                            size: 11,
                            bold: true,
                            color: { argb: item.totalNetProfit >= 0 ? 'FF15803D' : 'FFDC2626' }
                        };
                    }
                });
            });

            // ── Grand Total row ─────────────────────────────────────────────
            const totalRow = ws.addRow([
                '',
                'GRAND TOTAL',
                totals.totalOrders,
                totals.totalRevenue,
                totals.totalTax,
                totals.totalDiscount,
                totals.totalNetProfit,
                totals.profitMargin,
            ]);
            totalRow.height = 24;
            totalRow.eachCell((cell, colNum) => {
                cell.font = { ...totalFont, color: { argb: 'FF005429' } };
                cell.fill = totalFill;
                cell.border = { ...cellBorder, top: { style: 'medium', color: { argb: 'FF005429' } } };

                if (colNum === 1 || colNum === 3) {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                } else if (colNum === 2) {
                    cell.alignment = { vertical: 'middle', horizontal: 'left' };
                } else {
                    cell.alignment = { vertical: 'middle', horizontal: 'right' };
                }

                if (colNum >= 4 && colNum <= 7) cell.numFmt = rpFmt;
                if (colNum === 8) cell.numFmt = pctFmt;
            });

            const filename = `Laporan_Laba_Bulanan_${outletName.replace(/\s+/g, '_')}_${selectedYear}.xlsx`;
            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);

        } catch (err) {
            console.error('Error exporting to Excel:', err);
            alert('Gagal mengekspor data ke Excel. Silakan coba lagi.');
        } finally {
            setExportExcelLoading(false);
        }
    };

    const exportToPDF = async () => {
        if (!tableRef.current) return;
        setExportPdfLoading(true);

        try {
            const canvas = await html2canvas(tableRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("l", "mm", "a4"); // Landscape
            const imgWidth = 297;
            const pageHeight = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const outletName = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name
                : 'Semua_Outlet';

            pdf.save(`Laporan_Laba_Bulanan_${outletName.replace(/\s+/g, '_')}_${selectedYear}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Gagal mengekspor data ke PDF.");
        } finally {
            setExportPdfLoading(false);
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

            {/* Breadcrumb & Actions */}
            <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white shadow-sm">
                <div className="flex items-center text-sm text-gray-500 font-medium flex-wrap">
                    <FaClipboardList className="mr-2" />
                    <span>Laporan</span>
                    <FaChevronRight className="mx-2 text-[10px]" />
                    <Link to="/admin/profit-menu" className="hover:text-green-900 transition-colors">Laporan Laba Rugi</Link>
                    <FaChevronRight className="mx-2 text-[10px]" />
                    <span className="text-green-900 font-semibold">Laba Bulanan</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportToPDF}
                        disabled={exportPdfLoading || loading}
                        className="flex items-center gap-2 bg-red-600 text-white text-[13px] px-4 py-2 rounded shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        <FaFilePdf />
                        {exportPdfLoading ? 'Mengekspor...' : 'Ekspor PDF'}
                    </button>
                    <button
                        onClick={exportToExcel}
                        disabled={exportExcelLoading || loading}
                        className="flex items-center gap-2 bg-green-900 text-white text-[13px] px-4 py-2 rounded shadow-sm hover:bg-green-800 transition-colors disabled:opacity-50"
                    >
                        <FaFileExcel />
                        {exportExcelLoading ? 'Mengekspor...' : 'Ekspor Excel'}
                    </button>
                </div>
            </div>

            <div className="px-6 mt-6">
                {/* View Mode Tabs: Harian vs Bulanan */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    <Link
                        to="/admin/daily-profit"
                        className="px-4 py-2.5 font-medium text-sm text-gray-500 hover:text-green-900 flex items-center gap-2 transition-colors border-b-2 border-transparent"
                    >
                        <FaPoll />
                        <span>Laba Harian</span>
                    </Link>
                    <Link
                        to="/admin/monthly-profit"
                        className="px-4 py-2.5 font-bold text-sm border-b-2 border-green-900 text-green-900 flex items-center gap-2"
                    >
                        <FaCalendarAlt />
                        <span>Laba Bulanan</span>
                    </Link>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Total Transaksi</p>
                        <p className="text-xl font-bold text-gray-900">{totals.totalOrders.toLocaleString('id-ID')} Order</p>
                    </div>
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

                {/* Filters */}
                <div className="bg-white p-5 rounded-lg shadow-sm mb-6 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Pilih Tahun</label>
                            <Select
                                options={yearOptions}
                                value={yearOptions.find(opt => opt.value === selectedYear) || yearOptions[0]}
                                onChange={handleYearChange}
                                styles={customSelectStyles}
                                isSearchable
                                placeholder="Pilih Tahun"
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
                        <div>
                            <button
                                onClick={() => fetchReportData(true)}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-[#005429] text-white text-[13px] py-2 px-3 rounded hover:bg-green-800 transition-colors disabled:opacity-50"
                            >
                                <FaSyncAlt className={loading ? "animate-spin" : ""} />
                                <span>{loading ? "Memuat..." : "Muat Ulang"}</span>
                            </button>
                        </div>
                        <div>
                            <button
                                onClick={() => {
                                    setSelectedYear(currentYear);
                                    setSelectedOutlet("");
                                    updateURLParams(currentYear, "");
                                }}
                                className="w-full text-gray-500 border border-gray-200 text-[13px] py-2 rounded hover:bg-gray-50 transition-colors"
                            >
                                Reset Filter
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar saat memuat data */}
                    {loading && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center text-xs text-gray-500 mb-1.5 font-medium">
                                <span className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-800"></div>
                                    Memuat data bulanan... ({progress.loaded} dari {progress.total} bulan)
                                </span>
                                <span>
                                    {progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-green-700 h-full transition-all duration-300 rounded-full"
                                    style={{
                                        width: `${progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0}%`,
                                    }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex justify-between items-center">
                        <span>{error}</span>
                        <button
                            onClick={() => fetchReportData(true)}
                            className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors font-medium"
                        >
                            Coba Lagi
                        </button>
                    </div>
                )}

                {/* Data Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden" ref={tableRef}>
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                        <div>
                            <h2 className="text-base font-bold text-gray-800">
                                Rekapitulasi Laba Rugi Bulanan - Tahun {selectedYear}
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Outlet: {selectedOutlet ? outlets.find(o => o._id === selectedOutlet)?.name || selectedOutlet : 'Semua Outlet'}
                            </p>
                        </div>
                        <span className="text-xs px-2.5 py-1 bg-green-50 text-green-800 rounded-full font-medium">
                            Periode 12 Bulan
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                    <th className="px-6 py-4 text-center w-16">No</th>
                                    <th className="px-6 py-4">Bulan</th>
                                    <th className="px-6 py-4 text-center">Transaksi</th>
                                    <th className="px-6 py-4 text-right">Penjualan Kotor</th>
                                    <th className="px-6 py-4 text-right">Pajak</th>
                                    <th className="px-6 py-4 text-right">Diskon</th>
                                    <th className="px-6 py-4 text-right">Laba Kotor</th>
                                    <th className="px-6 py-4 text-right">% Laba Kotor</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] divide-y divide-gray-50">
                                {monthlyData.map((item, index) => {
                                    const hasData = item.totalOrders > 0;
                                    return (
                                        <tr
                                            key={index}
                                            className={`hover:bg-green-50/50 transition-colors ${
                                                item.isFuture ? 'opacity-40 bg-gray-50/30' : !hasData && !item.isLoading ? 'opacity-70' : ''
                                            }`}
                                        >
                                            <td className="px-6 py-4 text-center text-gray-400 font-mono text-xs">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-800">
                                                <div className="flex items-center gap-2">
                                                    <span>{item.monthName}</span>
                                                    {item.isLoading && (
                                                        <span className="inline-block animate-spin h-3 w-3 border-b border-green-700 rounded-full"></span>
                                                    )}
                                                    {item.isFuture && (
                                                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-normal">
                                                            Belum berjalan
                                                        </span>
                                                    )}
                                                    {item.hasError && (
                                                        <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded font-normal">
                                                            Gagal muat
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-600">
                                                {item.isLoading ? (
                                                    <span className="text-gray-300">...</span>
                                                ) : item.isFuture ? (
                                                    <span className="text-gray-300">-</span>
                                                ) : (
                                                    item.totalOrders.toLocaleString('id-ID')
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-700">
                                                {item.isLoading ? (
                                                    <span className="text-gray-300">...</span>
                                                ) : item.isFuture ? (
                                                    <span className="text-gray-300">-</span>
                                                ) : (
                                                    formatCurrency(item.totalRevenue)
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right text-blue-600">
                                                {item.isLoading ? (
                                                    <span className="text-gray-300">...</span>
                                                ) : item.isFuture ? (
                                                    <span className="text-gray-300">-</span>
                                                ) : (
                                                    formatCurrency(item.totalTax)
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right text-red-600">
                                                {item.isLoading ? (
                                                    <span className="text-gray-300">...</span>
                                                ) : item.isFuture ? (
                                                    <span className="text-gray-300">-</span>
                                                ) : (
                                                    formatCurrency(item.totalDiscount)
                                                )}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold ${item.totalNetProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                                {item.isLoading ? (
                                                    <span className="text-gray-300">...</span>
                                                ) : item.isFuture ? (
                                                    <span className="text-gray-300">-</span>
                                                ) : (
                                                    formatCurrency(item.totalNetProfit)
                                                )}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-semibold ${item.profitMargin >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                                {item.isLoading ? (
                                                    <span className="text-gray-300">...</span>
                                                ) : item.isFuture ? (
                                                    <span className="text-gray-300">-</span>
                                                ) : (
                                                    formatPercentage(item.profitMargin)
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-green-50/70 border-t-2 border-green-900/20 font-bold text-[13px]">
                                <tr className="text-gray-900">
                                    <td colSpan={2} className="px-6 py-5 text-[#005429] uppercase text-[11px] tracking-wider font-extrabold">
                                        GRAND TOTAL ({selectedYear})
                                    </td>
                                    <td className="px-6 py-5 text-center text-[#005429]">
                                        {totals.totalOrders.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-5 text-right text-gray-900 font-extrabold">
                                        {formatCurrency(totals.totalRevenue)}
                                    </td>
                                    <td className="px-6 py-5 text-right text-blue-700 font-extrabold">
                                        {formatCurrency(totals.totalTax)}
                                    </td>
                                    <td className="px-6 py-5 text-right text-red-600 font-extrabold">
                                        {formatCurrency(totals.totalDiscount)}
                                    </td>
                                    <td className={`px-6 py-5 text-right font-extrabold ${totals.totalNetProfit >= 0 ? 'text-green-800' : 'text-red-700'}`}>
                                        {formatCurrency(totals.totalNetProfit)}
                                    </td>
                                    <td className={`px-6 py-5 text-right font-extrabold ${totals.profitMargin >= 0 ? 'text-green-800' : 'text-red-700'}`}>
                                        {formatPercentage(totals.profitMargin)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-8 p-6 bg-white rounded-lg border border-gray-100 shadow-sm text-[12px] text-gray-500 leading-relaxed">
                    <h3 className="font-bold text-gray-800 uppercase tracking-wider mb-2">Keterangan Perhitungan Laba Bulanan:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Penjualan Kotor:</strong> Total penerimaan kotor pesanan sebelum dikurangi diskon dan pajak pada bulan bersangkutan.</li>
                        <li><strong>Pajak PB1:</strong> Menggunakan tarif pajak sistem sesuai periode transaksi pesanan.</li>
                        <li><strong>Diskon:</strong> Akumulasi potongan harga, voucher, dan promo yang digunakan pelanggan pada bulan bersangkutan.</li>
                        <li><strong>Laba Kotor:</strong> Dihitung dari <em>(Penjualan Kotor - Pajak - Diskon)</em>.</li>
                        <li><strong>% Laba Kotor:</strong> Rasio Laba Kotor terhadap Penjualan Kotor pada bulan bersangkutan.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default MonthlyProfitManagement;
