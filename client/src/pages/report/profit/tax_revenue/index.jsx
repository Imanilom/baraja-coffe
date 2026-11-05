import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import { Link, useSearchParams } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSync, FaFileExcel } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Select from "react-select";
import dayjs from "dayjs";
import { useSelector } from "react-redux";

const TaxRevenueManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { outlets } = useSelector((state) => state.outlet);

    const [taxData, setTaxData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initial state from URL
    const [dateRange, setDateRange] = useState(() => {
        const start = searchParams.get('startDate');
        const end = searchParams.get('endDate');
        return {
            startDate: start ? start : dayjs().format('YYYY-MM-DD'),
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

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                startDate: dayjs(dateRange.startDate).format('YYYY-MM-DD'),
                endDate: dayjs(dateRange.endDate).format('YYYY-MM-DD'),
            };
            if (selectedOutlet) {
                params.outletId = selectedOutlet;
            }

            const [orderResponse, taxServiceResponse] = await Promise.all([
                axios.get("/api/report/orders", { params: { ...params, mode: 'all', ...(selectedOutlet ? { outlet: selectedOutlet } : {}) } }),
                axios.get("/api/tax-service")
            ]);

            const orders = Array.isArray(orderResponse.data) ?
                orderResponse.data :
                (orderResponse.data?.data && Array.isArray(orderResponse.data.data)) ?
                    orderResponse.data.data : [];

            const taxServices = Array.isArray(taxServiceResponse.data) ?
                taxServiceResponse.data :
                (taxServiceResponse.data?.data && Array.isArray(taxServiceResponse.data.data)) ?
                    taxServiceResponse.data.data : [];

            const completedOrders = orders.filter(item => item.status === "Completed");

            // Map tax percentage
            const taxMap = {};
            taxServices.forEach(tax => {
                taxMap[tax._id] = tax.percentage;
            });

            const enrichedOrders = completedOrders.map(order => ({
                ...order,
                taxAndServiceDetails: order.taxAndServiceDetails?.map(ts => ({
                    ...ts,
                    percentage: taxMap[ts.id] || taxMap[ts._id] || 0
                }))
            }));

            setTaxData(enrichedOrders);
            setError(null);
        } catch (err) {
            console.error("Error fetching tax revenue data:", err);
            setError("Gagal memuat data pajak. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedOutlet]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const groupedTaxes = useMemo(() => {
        const allTaxes = taxData.flatMap(item => item.taxAndServiceDetails || []);

        const grouped = allTaxes.reduce((acc, tax) => {
            const key = tax.name || "Unknown";
            if (!acc[key]) {
                acc[key] = {
                    name: key,
                    type: tax.type || "N/A",
                    percentage: tax.percentage || 0,
                    totalAmount: 0,
                    count: 0
                };
            }
            acc[key].totalAmount += (tax.amount || 0);
            acc[key].count += 1;
            return acc;
        }, {});

        return Object.values(grouped);
    }, [taxData]);

    const totalAllTax = useMemo(() =>
        groupedTaxes.reduce((sum, tax) => sum + tax.totalAmount, 0)
        , [groupedTaxes]);

    const handleRefresh = () => {
        fetchData();
    };

    const exportToExcel = async () => {
        const outletName = selectedOutlet ? outlets.find(o => o._id === selectedOutlet)?.name : "Semua Outlet";
        const filename = `Laporan_Pajak_${outletName.replace(/\s+/g, '_')}_${dayjs().format('YYYYMMDD')}.xlsx`;

        if (groupedTaxes.length === 0) {
            alert("Tidak ada data untuk diekspor");
            return;
        }

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Data Pajak');

        const titleFont  = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF005429' } };
        const infoFont   = { name: 'Calibri', size: 11 };
        const headerFont = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005429' } };
        const totalFill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
        const altFill    = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        const thin       = { style: 'thin', color: { argb: 'FFD1D5DB' } };
        const border     = { top: thin, left: thin, bottom: thin, right: thin };
        const rpFmt      = '"Rp"#,##0;"Rp"-#,##0';

        const cols = [
            { header: 'Nama Pajak',         width: 28 },
            { header: 'Tipe',               width: 18 },
            { header: 'Persentase',         width: 14 },
            { header: 'Jumlah Transaksi',   width: 20 },
            { header: 'Total Pajak',        width: 22 },
        ];
        ws.columns = cols.map(c => ({ width: c.width }));

        ws.mergeCells('A1:E1');
        const t = ws.getCell('A1');
        t.value = 'LAPORAN PAJAK';
        t.font = titleFont;
        t.alignment = { horizontal: 'center', vertical: 'middle' };
        ws.getRow(1).height = 28;

        ws.mergeCells('A2:E2');
        ws.getCell('A2').value = `Outlet: ${outletName}`;
        ws.getCell('A2').font = infoFont;

        ws.mergeCells('A3:E3');
        ws.getCell('A3').value = `Periode: ${dayjs(dateRange.startDate).format('DD-MM-YYYY')} s/d ${dayjs(dateRange.endDate).format('DD-MM-YYYY')}`;
        ws.getCell('A3').font = infoFont;

        ws.addRow([]);

        const hRow = ws.addRow(cols.map(c => c.header));
        hRow.height = 20;
        hRow.eachCell(cell => {
            cell.font = headerFont; cell.fill = headerFill;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = border;
        });

        let totalTax = 0;
        groupedTaxes.forEach((tax, idx) => {
            totalTax += tax.totalAmount || 0;
            const row = ws.addRow([
                tax.name, tax.type, `${tax.percentage}%`, tax.count, tax.totalAmount
            ]);
            row.height = 18;
            row.eachCell((cell, col) => {
                cell.border = border;
                cell.alignment = { vertical: 'middle', horizontal: col === 1 || col === 2 || col === 3 ? 'left' : 'right' };
                if (idx % 2 === 1) cell.fill = altFill;
                if (col === 5) cell.numFmt = rpFmt;
            });
        });

        const totRow = ws.addRow(['GRAND TOTAL', '', '', groupedTaxes.reduce((s, t) => s + t.count, 0), totalTax]);
        totRow.height = 22;
        totRow.eachCell((cell, col) => {
            cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF005429' } };
            cell.fill = totalFill;
            cell.border = { ...border, top: { style: 'medium', color: { argb: 'FF005429' } } };
            cell.alignment = { vertical: 'middle', horizontal: col <= 3 ? 'left' : 'right' };
            if (col === 5) cell.numFmt = rpFmt;
        });

        const buffer = await wb.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
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
            <div className="px-6 py-4 flex justify-between items-center bg-white shadow-sm">
                <div className="flex items-center text-sm text-gray-500 font-medium">
                    <FaClipboardList className="mr-2" />
                    <span>Laporan</span>
                    <FaChevronRight className="mx-2 text-[10px]" />
                    <Link to="/admin/profit-menu" className="hover:text-green-900 transition-colors">Laporan Laba & Rugi</Link>
                    <FaChevronRight className="mx-2 text-[10px]" />
                    <span className="text-green-900 font-semibold">Laporan Pajak</span>
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
                        disabled={loading || groupedTaxes.length === 0}
                        className="flex items-center gap-2 bg-green-900 text-white text-[13px] px-4 py-2 rounded shadow-sm hover:bg-green-800 transition-colors disabled:opacity-50"
                    >
                        <FaFileExcel />
                        Ekspor Excel
                    </button>
                </div>
            </div>

            <div className="px-6 mt-6">
                {/* Filters */}
                <div className="bg-white p-5 rounded-lg shadow-sm mb-6 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-100 text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Nama Pajak</th>
                                    <th className="px-6 py-4 text-right">% Pajak</th>
                                    <th className="px-6 py-4">Tipe Pajak</th>
                                    <th className="px-6 py-4 text-right">Transaksi</th>
                                    <th className="px-6 py-4 text-right">Total Pajak</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] divide-y divide-gray-50 text-gray-600">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-900"></div>
                                        </td>
                                    </tr>
                                ) : groupedTaxes.length > 0 ? (
                                    groupedTaxes.map((tax, index) => (
                                        <tr key={index} className="hover:bg-green-50/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{tax.name}</td>
                                            <td className="px-6 py-4 text-right font-mono">{tax.percentage}%</td>
                                            <td className="px-6 py-4 text-gray-500 font-medium">{tax.type}</td>
                                            <td className="px-6 py-4 text-right font-mono">{tax.count}</td>
                                            <td className="px-6 py-4 text-right font-bold text-green-700 font-mono">{formatCurrency(tax.totalAmount)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-gray-400 font-medium italic">Tidak ada data pajak ditemukan</td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t border-gray-100 font-bold text-[13px] text-gray-900">
                                <tr>
                                    <td className="px-6 py-4" colSpan={4}>TOTAL PAJAK</td>
                                    <td className="px-6 py-4 text-right text-green-800 font-mono">{formatCurrency(totalAllTax)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxRevenueManagement;
