import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import axios from '@/lib/axios';
import { Link, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaFileExcel, FaFilePdf, FaBell, FaUser, FaClipboardList } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Select from "react-select";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import 'dayjs/locale/id';

dayjs.locale('id'); // Indonesian locale for days

const MonthlySales = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { outlets } = useSelector((state) => state.outlet);

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [exportExcelLoading, setExportExcelLoading] = useState(false);
    const [exportPdfLoading, setExportPdfLoading] = useState(false);
    const tableRef = useRef(null);

    // Initial state from URL
    const [dateRange, setDateRange] = useState(() => {
        const start = searchParams.get('startDate');
        const end = searchParams.get('endDate');
        return {
            startDate: start ? start : dayjs().startOf('month').format('YYYY-MM-DD'),
            endDate: end ? end : dayjs().endOf('month').format('YYYY-MM-DD')
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
    
    const getDayName = (dateString) => {
        return dayjs(dateString).format('dddd');
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

    const monthlyData = useMemo(() => {
        if (!reportData || !reportData.orders || reportData.orders.length === 0) {
            return [];
        }

        const dailyMap = new Map();

        reportData.orders.forEach(order => {
            const orderDate = dayjs(order.createdAt).format('YYYY-MM-DD');
            const isInclusive = orderDate >= '2026-06-04';

            let rev = order.revenue || 0;
            let disc = order.discounts || 0;
            let tax = 0;

            if (isInclusive) {
                tax = (rev - disc) * (10 / 110);
            } else {
                tax = order.tax || 0;
            }

            if (!dailyMap.has(orderDate)) {
                dailyMap.set(orderDate, {
                    date: orderDate,
                    totalRevenue: 0,
                    totalTax: 0,
                    totalDiscount: 0,
                    isInclusive: isInclusive
                });
            }

            const dayData = dailyMap.get(orderDate);
            dayData.totalRevenue += rev;
            dayData.totalTax += tax;
            dayData.totalDiscount += disc;
        });

        const sortedData = Array.from(dailyMap.values()).sort((a, b) =>
            dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
        );
        
        return sortedData.map(item => ({
            ...item,
            // Revenue setelah diskon dan pajak
            netRevenue: item.totalRevenue - item.totalDiscount - item.totalTax
        }));
    }, [reportData]);

    const totals = useMemo(() => {
        const initialTotals = {
            totalRevenue: 0,
            totalTax: 0,
            totalDiscount: 0,
            netRevenue: 0
        };

        if (monthlyData.length === 0) return initialTotals;

        return monthlyData.reduce((acc, day) => ({
            totalRevenue: acc.totalRevenue + day.totalRevenue,
            totalTax: acc.totalTax + day.totalTax,
            totalDiscount: acc.totalDiscount + day.totalDiscount,
            netRevenue: acc.netRevenue + day.netRevenue
        }), initialTotals);
    }, [monthlyData]);

    const exportToExcel = async () => {
        setExportExcelLoading(true);
        try {
            if (!monthlyData || monthlyData.length === 0) {
                alert('Tidak ada data untuk diekspor');
                return;
            }

            const outletName = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name
                : 'Semua Outlet';

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Laporan Bulanan');

            // ── Styles ──────────────────────────────────────────────────────
            const titleFont   = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF005429' } };
            const infoFont    = { name: 'Calibri', size: 11 };
            const headerFont  = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
            const headerFill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005429' } };
            const totalFont   = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF005429' } };
            const totalFill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
            const altFill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
            const discFill    = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF5F5' } };
            const netFill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
            const thinBorder  = { style: 'thin', color: { argb: 'FFD1D5DB' } };
            const cellBorder  = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
            const rpFmt       = '"Rp"#,##0;"Rp"-#,##0';

            const cols = [
                { header: 'Hari',                                key: 'day',        width: 14 },
                { header: 'Tanggal',                             key: 'date',       width: 16 },
                { header: 'Total Revenue Sebelum Pajak',         key: 'revenue',    width: 30 },
                { header: 'Diskon',                              key: 'discount',   width: 20 },
                { header: 'Pajak PB1',                           key: 'tax',        width: 20 },
                { header: 'Revenue Setelah Diskon dan Pajak',    key: 'net',        width: 34 },
            ];
            ws.columns = cols.map(c => ({ key: c.key, width: c.width }));

            // ── Title block ─────────────────────────────────────────────────
            ws.mergeCells('A1:F1');
            const titleCell = ws.getCell('A1');
            titleCell.value = 'LAPORAN PENJUALAN BULANAN';
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
            monthlyData.forEach((item, idx) => {
                const isAlt = idx % 2 === 1;
                const row = ws.addRow([
                    getDayName(item.date),
                    dayjs(item.date).format('DD-MM-YYYY'),
                    item.totalRevenue,
                    item.totalDiscount,
                    item.totalTax,
                    item.netRevenue,
                ]);
                row.height = 18;

                row.eachCell((cell, colNum) => {
                    cell.border    = cellBorder;
                    cell.alignment = { vertical: 'middle', horizontal: colNum <= 2 ? 'left' : 'right' };

                    if (colNum >= 3) cell.numFmt = rpFmt;

                    // Background per column role
                    if (colNum === 4) {
                        // Diskon — merah muda
                        cell.fill = discFill;
                        cell.font = { name: 'Calibri', size: 11, color: { argb: 'FFDC2626' } };
                    } else if (colNum === 6) {
                        // Net revenue — hijau muda
                        cell.fill = netFill;
                        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF15803D' } };
                    } else if (isAlt) {
                        cell.fill = altFill;
                    }
                });
            });

            // ── Grand Total row ─────────────────────────────────────────────
            const totalRow = ws.addRow([
                'GRAND TOTAL', '',
                totals.totalRevenue,
                totals.totalDiscount,
                totals.totalTax,
                totals.netRevenue,
            ]);
            totalRow.height = 22;
            totalRow.eachCell((cell, colNum) => {
                cell.font      = totalFont;
                cell.fill      = totalFill;
                cell.border    = { ...cellBorder, top: { style: 'medium', color: { argb: 'FF005429' } } };
                cell.alignment = { vertical: 'middle', horizontal: colNum <= 2 ? 'left' : 'right' };
                if (colNum >= 3) cell.numFmt = rpFmt;
            });

            const filename = `Laporan_Bulanan_${outletName.replace(/\s+/g, '_')}_${dayjs(dateRange.startDate).format('YYYYMMDD')}_${dayjs(dateRange.endDate).format('YYYYMMDD')}.xlsx`;
            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);

        } catch (err) {
            console.error('Error exporting to Excel:', err);
            alert('Gagal mengekspor data. Silakan coba lagi.');
        } finally {
            setExportExcelLoading(false);
        }
    };

    const exportToPDF = async () => {
        if (!tableRef.current) return;
        setExportPdfLoading(true);
        
        try {
            const canvas = await html2canvas(tableRef.current, {
                scale: 2, // Higher resolution
                useCORS: true,
                logging: false,
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape A4
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            const outletName = selectedOutlet ? outlets.find(o => o._id === selectedOutlet)?.name : 'Semua Outlet';
            
            pdf.setFontSize(14);
            pdf.text('Laporan Bulanan Penjualan', 14, 15);
            pdf.setFontSize(10);
            pdf.text(`Outlet: ${outletName}`, 14, 22);
            pdf.text(`Periode: ${dayjs(dateRange.startDate).format('DD-MM-YYYY')} s/d ${dayjs(dateRange.endDate).format('DD-MM-YYYY')}`, 14, 27);
            
            // Add image below the text
            pdf.addImage(imgData, 'PNG', 14, 35, pdfWidth - 28, pdfHeight);
            
            const filename = `Laporan_Bulanan_${outletName.replace(/\s+/g, '_')}_${dayjs(dateRange.startDate).format('YYYYMMDD')}.pdf`;
            pdf.save(filename);
            
        } catch (err) {
            console.error("Error exporting PDF:", err);
            alert('Gagal mengekspor PDF.');
        } finally {
            setExportPdfLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header */}
            <div className="flex justify-end px-6 items-center py-4 space-x-4 border-b bg-white">
                <FaBell className="text-gray-400 cursor-pointer" />
                <span className="text-sm font-medium">Hi Admin</span>
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
                    <Link to="/admin/sales-menu" className="hover:text-green-900 transition-colors">Laporan Penjualan</Link>
                    <FaChevronRight className="mx-2 text-[10px]" />
                    <span className="text-green-900">Laporan Bulanan</span>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={exportToPDF}
                        disabled={exportPdfLoading || monthlyData.length === 0}
                        className="flex items-center gap-2 bg-red-600 text-white text-[13px] px-4 py-2 rounded shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        <FaFilePdf />
                        {exportPdfLoading ? 'Mengekspor...' : 'Ekspor PDF'}
                    </button>
                    <button
                        onClick={exportToExcel}
                        disabled={exportExcelLoading || monthlyData.length === 0}
                        className="flex items-center gap-2 bg-green-900 text-white text-[13px] px-4 py-2 rounded shadow-sm hover:bg-green-800 transition-colors disabled:opacity-50"
                    >
                        <FaFileExcel />
                        {exportExcelLoading ? 'Mengekspor...' : 'Ekspor Excel'}
                    </button>
                </div>
            </div>

            <div className="px-6 mt-6">
                {/* Filters */}
                <div className="bg-white p-5 rounded-lg shadow-sm mb-6 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Pilih Bulan & Tahun</label>
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
                                    const defaultRange = { startDate: dayjs().startOf('month').format('YYYY-MM-DD'), endDate: dayjs().endOf('month').format('YYYY-MM-DD') };
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden" ref={tableRef}>
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800">Laporan Penjualan Bulanan</h2>
                        <p className="text-sm text-gray-500 mt-1">Periode: {dayjs(dateRange.startDate).format('DD MMM YYYY')} - {dayjs(dateRange.endDate).format('DD MMM YYYY')}</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                    <th className="px-6 py-4">Hari</th>
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4 text-right">Total Revenue Sebelum Pajak</th>
                                    <th className="px-6 py-4 text-right">Diskon</th>
                                    <th className="px-6 py-4 text-right">Pajak PB1</th>
                                    <th className="px-6 py-4 text-right">Revenue Setelah Diskon dan Pajak</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-900"></div>
                                        </td>
                                    </tr>
                                ) : monthlyData.length > 0 ? (
                                    monthlyData.map((item, index) => (
                                        <tr key={index} className="hover:bg-green-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-700 capitalize">{getDayName(item.date)}</td>
                                            <td className="px-6 py-4 text-gray-600">{formatDate(item.date)}</td>
                                            <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(item.totalRevenue)}</td>
                                            <td className="px-6 py-4 text-right text-red-600">{formatCurrency(item.totalDiscount)}</td>
                                            <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(item.totalTax)}</td>
                                            <td className="px-6 py-4 text-right font-semibold text-green-700">
                                                {formatCurrency(item.netRevenue)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center text-gray-400 font-medium bg-white">
                                            Tidak ada data ditemukan untuk periode yang dipilih
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {monthlyData.length > 0 && !loading && (
                                <tfoot className="bg-gray-50 border-t-2 border-gray-100 font-bold">
                                    <tr className="text-gray-900">
                                        <td colSpan={2} className="px-6 py-5 text-gray-500 uppercase text-[11px] tracking-wider">Total Keseluruhan</td>
                                        <td className="px-6 py-5 text-right">{formatCurrency(totals.totalRevenue)}</td>
                                        <td className="px-6 py-5 text-right text-red-600">{formatCurrency(totals.totalDiscount)}</td>
                                        <td className="px-6 py-5 text-right">{formatCurrency(totals.totalTax)}</td>
                                        <td className="px-6 py-5 text-right text-lg text-green-900">
                                            {formatCurrency(totals.netRevenue)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonthlySales;
