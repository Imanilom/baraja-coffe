import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import { Link, useSearchParams } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSync, FaFileExcel, FaSearch, FaExclamationTriangle, FaCheckCircle, FaMoneyBillWave } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import dayjs from "dayjs";
import { useSelector, useDispatch } from "react-redux";
import useDebounce from "@/hooks/useDebounce";
import { setReportData } from "@/redux/report/reportSlice";
import Paginated from "@/components/Paginated";

const InstallmentManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useDispatch();
    const { outlets } = useSelector((state) => state.outlet);
    const { operational } = useSelector((state) => state.report);
    const cachedData = operational.installment.data;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPaid, setShowPaid] = useState(searchParams.get('paid') === 'true');

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
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || "");
    const debouncedSearch = useDebounce(searchTerm, 500);

    const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page'), 10) || 1);
    const ITEMS_PER_PAGE = 50;

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

    const updateURLParams = useCallback(() => {
        const params = new URLSearchParams();
        if (dateRange.startDate) params.set('startDate', dayjs(dateRange.startDate).format('YYYY-MM-DD'));
        if (dateRange.endDate) params.set('endDate', dayjs(dateRange.endDate).format('YYYY-MM-DD'));
        if (selectedOutlet) params.set('outletId', selectedOutlet);
        if (debouncedSearch) params.set('q', debouncedSearch);
        if (showPaid) params.set('paid', 'true');
        if (currentPage > 1) params.set('page', currentPage.toString());
        setSearchParams(params, { replace: true });
    }, [dateRange, selectedOutlet, debouncedSearch, showPaid, currentPage, setSearchParams]);

    useEffect(() => {
        updateURLParams();
    }, [updateURLParams]);

    const fetchData = useCallback(async (force = false) => {
        // If not forced and we have cached data, don't fetch if it's "fresh" enough
        // For simplicity here, we just check if data exists if not forced
        if (!force && cachedData.length > 0) return;

        setLoading(true);
        try {
            const params = {
                startDate: dayjs(dateRange.startDate).format('YYYY-MM-DD'),
                endDate: dayjs(dateRange.endDate).format('YYYY-MM-DD'),
            };
            if (selectedOutlet) params.outletId = selectedOutlet;

            const response = await axios.get('/api/marketlist/debts', { params });
            const data = response.data.data || response.data || [];
            const result = Array.isArray(data) ? data : [];

            dispatch(setReportData({ category: 'operational', type: 'installment', data: result }));
            setError(null);
        } catch (err) {
            console.error("Error fetching debt data:", err);
            setError("Gagal memuat data hutang.");
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedOutlet, cachedData.length, dispatch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => {
        fetchData(true);
    };

    const filteredData = useMemo(() => {
        let result = cachedData;

        if (!showPaid) {
            result = result.filter(item => (item.amount - item.paidAmount) > 0);
        }

        if (debouncedSearch) {
            const s = debouncedSearch.toLowerCase();
            result = result.filter(item => {
                const supplier = (item.supplierName || "").toLowerCase();
                const notes = (item.notes || "").toLowerCase();
                const id = (item._id || "").toLowerCase();
                return supplier.includes(s) || notes.includes(s) || id.includes(s);
            });
        }

        return result;
    }, [cachedData, debouncedSearch, showPaid]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);

    const totals = useMemo(() => {
        return filteredData.reduce((acc, curr) => ({
            totalAmount: acc.totalAmount + (curr.amount || 0),
            totalPaid: acc.totalPaid + (curr.paidAmount || 0),
            totalRemaining: acc.totalRemaining + ((curr.amount || 0) - (curr.paidAmount || 0))
        }), { totalAmount: 0, totalPaid: 0, totalRemaining: 0 });
    }, [filteredData]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const exportToExcel = () => {
        const exportData = filteredData.map(item => ({
            "Tanggal": dayjs(item.date).format('DD-MM-YYYY'),
            "Supplier": item.supplierName || "-",
            "ID Struk": item._id || "-",
            "Status": item.status || "-",
            "Total Tagihan": item.amount || 0,
            "Telah Dibayar": item.paidAmount || 0,
            "Sisa Tagihan": (item.amount || 0) - (item.paidAmount || 0),
            "Keterangan": item.notes || "-"
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Hutang");
        XLSX.writeFile(wb, `Laporan_Hutang_${dayjs().format('YYYYMMDD')}.xlsx`);
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
                    <Link to="/admin/operational-menu" className="hover:text-green-900 transition-colors">Laporan Operasional</Link>
                    <FaChevronRight className="mx-2 text-[10px]" />
                    <span className="text-green-900 font-semibold">Hutang (Installment)</span>
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
                        disabled={loading || filteredData.length === 0}
                        className="flex items-center gap-2 bg-green-900 text-white text-[13px] px-4 py-2 rounded shadow-sm hover:bg-green-800 transition-colors disabled:opacity-50"
                    >
                        <FaFileExcel />
                        Ekspor Excel
                    </button>
                </div>
            </div>

            <div className="p-6">
                {/* Filters */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Rentang Tanggal</label>
                            <Datepicker
                                value={dateRange}
                                onChange={(val) => {
                                    setDateRange(val);
                                    setCurrentPage(1);
                                }}
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
                                onChange={(selected) => {
                                    setSelectedOutlet(selected.value);
                                    setCurrentPage(1);
                                }}
                                styles={customSelectStyles}
                                isSearchable
                                placeholder="Pilih Outlet"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Cari Supplier / ID</label>
                            <div className="relative">
                                <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Nama Supplier / ID Struk"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full text-[13px] border border-gray-200 py-2 pl-10 pr-3 rounded focus:ring-2 focus:ring-green-900 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col justify-end">
                            <label className="flex items-center cursor-pointer select-none py-2">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={showPaid}
                                        onChange={(e) => {
                                            setShowPaid(e.target.checked);
                                            setCurrentPage(1);
                                        }}
                                    />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${showPaid ? 'bg-green-900' : 'bg-gray-300'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showPaid ? 'translate-x-4' : ''}`}></div>
                                </div>
                                <span className="ml-3 text-[13px] font-medium text-gray-700">Tampilkan Data Lunas</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
                        <div className="p-3 bg-red-50 rounded-full mr-4">
                            <FaExclamationTriangle className="text-red-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Sisa Tagihan</p>
                            <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.totalRemaining)}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
                        <div className="p-3 bg-green-50 rounded-full mr-4">
                            <FaCheckCircle className="text-green-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Telah Dibayar</p>
                            <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.totalPaid)}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
                        <div className="p-3 bg-blue-50 rounded-full mr-4">
                            <FaMoneyBillWave className="text-blue-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Total Tagihan</p>
                            <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.totalAmount)}</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-100 text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Waktu</th>
                                    <th className="px-6 py-4">Supplier / ID Struk</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Total Tagihan</th>
                                    <th className="px-6 py-4 text-right">Sisa Tagihan</th>
                                    <th className="px-6 py-4 text-right">Telah Dibayar</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] divide-y divide-gray-50 text-gray-600">
                                {loading && cachedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-900"></div>
                                        </td>
                                    </tr>
                                ) : paginatedData.length > 0 ? (
                                    paginatedData.map((item, index) => (
                                        <tr key={index} className="hover:bg-green-50/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-gray-900">{dayjs(item.date).format('DD MMM YYYY')}</div>
                                                <div className="text-[11px] text-gray-400">{dayjs(item.date).format('HH:mm:ss')}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">{item.supplierName || "-"}</div>
                                                <div className="text-[11px] text-gray-400 font-mono">ID: {item._id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${(item.amount - item.paidAmount) <= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {(item.amount - item.paidAmount) <= 0 ? 'Lunas' : 'Belum Lunas'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(item.amount)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-red-600">{formatCurrency(item.amount - item.paidAmount)}</td>
                                            <td className="px-6 py-4 text-right text-green-700">{formatCurrency(item.paidAmount)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center text-gray-400 font-medium italic">Tidak ada data hutang ditemukan</td>
                                    </tr>
                                )}
                            </tbody>
                            {filteredData.length > 0 && (
                                <tfoot className="bg-gray-50 font-bold border-t border-gray-100 text-[13px]">
                                    <tr>
                                        <td className="px-6 py-4" colSpan={3}>GRAND TOTAL</td>
                                        <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(totals.totalAmount)}</td>
                                        <td className="px-6 py-4 text-right text-red-700">{formatCurrency(totals.totalRemaining)}</td>
                                        <td className="px-6 py-4 text-right text-green-900">{formatCurrency(totals.totalPaid)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                <Paginated
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                />
            </div>
        </div>
    );
};

export default InstallmentManagement;

