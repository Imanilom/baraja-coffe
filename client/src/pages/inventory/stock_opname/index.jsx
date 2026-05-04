import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import { Link, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSync, FaFileExcel, FaSearch, FaBoxes, FaInfoCircle, FaClipboardCheck, FaExclamationTriangle } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import { useSelector, useDispatch } from "react-redux";
import useDebounce from "@/hooks/useDebounce";
import { setReportData } from "@/redux/report/reportSlice";
import Paginated from "@/components/paginated";
import Header from "@/pages/admin/header";

const StockOpnameManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useDispatch();
    const { outlets } = useSelector((state) => state.outlet);
    const { inventory } = useSelector((state) => state.report);
    const cachedData = inventory.stockOpname.data;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
        if (currentPage > 1) params.set('page', currentPage.toString());
        setSearchParams(params, { replace: true });
    }, [dateRange, selectedOutlet, debouncedSearch, currentPage, setSearchParams]);

    useEffect(() => {
        updateURLParams();
    }, [updateURLParams]);

    const fetchData = useCallback(async (force = false) => {
        if (!force && cachedData.length > 0) return;

        setLoading(true);
        try {
            const response = await axios.get('/api/product/stock/all');
            const data = response.data.data || response.data || [];

            const allOpnames = [];
            data.forEach(item => {
                const movements = item.movements || [];
                movements.filter(m => m.type === 'adjustment').forEach(m => {
                    allOpnames.push({
                        ...m,
                        productName: item.productName || item.productId?.name,
                        unit: item.unitName || item.productId?.unit,
                        sku: item.sku || item.productId?.sku,
                        outletName: item.outletName || item.outletId?.name || "Main Outlet",
                        outletId: item.outletId?._id || item.outletId
                    });
                });
            });

            const sortedData = allOpnames.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
            dispatch(setReportData({ category: 'inventory', type: 'stockOpname', data: sortedData }));
            setError(null);
        } catch (err) {
            console.error("Error fetching stock opname data:", err);
            setError("Gagal memuat data stock opname.");
        } finally {
            setLoading(false);
        }
    }, [cachedData.length, dispatch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => {
        fetchData();
    };

    const filteredData = useMemo(() => {
        let result = stockOpnames;

        // Date Filter
        if (dateRange.startDate && dateRange.endDate) {
            const start = dayjs(dateRange.startDate).startOf('day');
            const end = dayjs(dateRange.endDate).endOf('day');
            result = result.filter(m => {
                const d = dayjs(m.date);
                return d.isAfter(start) && d.isBefore(end);
            });
        }

        // Outlet Filter
        if (selectedOutlet) {
            const outlet = outlets.find(o => o._id === selectedOutlet);
            if (outlet) {
                result = result.filter(item => item.outletName === outlet.name);
            }
        }

        // Search Filter
        if (debouncedSearch) {
            const s = debouncedSearch.toLowerCase();
            result = result.filter(item => {
                const product = (item.productName || "").toLowerCase();
                const notes = (item.notes || "").toLowerCase();
                const id = (item._id || "").toLowerCase();
                return product.includes(s) || notes.includes(s) || id.includes(s);
            });
        }

        return result;
    }, [stockOpnames, debouncedSearch, dateRange, selectedOutlet, outlets]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);

    const stats = useMemo(() => {
        return {
            totalItems: filteredData.length,
            totalDiscrepancyPlus: filteredData.filter(m => m.quantity > 0).reduce((acc, curr) => acc + curr.quantity, 0),
            totalDiscrepancyMinus: Math.abs(filteredData.filter(m => m.quantity < 0).reduce((acc, curr) => acc + curr.quantity, 0))
        };
    }, [filteredData]);

    const exportToExcel = () => {
        const dataToExport = filteredData.map(item => ({
            "Waktu": dayjs(item.date).format('DD-MM-YYYY HH:mm'),
            "Produk": item.productName || "-",
            "ID Opname": item._id,
            "Outlet": item.outletName,
            "Selisih Qty": item.quantity,
            "Keterangan": item.notes || "-"
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "StockOpname");
        XLSX.writeFile(wb, `Laporan_Stock_Opname_${dayjs().format('YYYYMMDD')}.xlsx`);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <Header />

            {/* Breadcrumb & Actions */}
            <div className="px-6 py-4 flex justify-between items-center bg-white shadow-sm border-b">
                <div className="flex items-center text-sm text-gray-500 font-medium">
                    <FaBoxes className="mr-2" />
                    <span>Inventori</span>
                    <FaChevronRight className="mx-2 text-[10px]" />
                    <span className="text-green-900 font-semibold">Stok Opname</span>
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
                    <Link
                        to="/admin/inventory/stockopname-create"
                        className="flex items-center gap-2 bg-green-900 text-white text-[13px] px-4 py-2 rounded shadow-sm hover:bg-green-800 transition-colors"
                    >
                        Tambah Stok Opname
                    </Link>
                </div>
            </div>

            <div className="p-6">
                {/* Filters */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1">
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
                        <div className="md:col-span-1">
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
                        <div className="md:col-span-1">
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Cari Produk</label>
                            <div className="relative">
                                <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Nama Produk..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full text-[13px] border border-gray-200 py-2 pl-10 pr-3 rounded focus:ring-2 focus:ring-green-900 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-1 flex items-end">
                            <button
                                onClick={exportToExcel}
                                disabled={loading || filteredData.length === 0}
                                className="w-full flex items-center justify-center gap-2 bg-white border border-green-900 text-green-900 text-[13px] px-4 py-2 rounded hover:bg-green-50 transition-colors disabled:opacity-50"
                            >
                                <FaFileExcel />
                                Ekspor Excel
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-blue-600">
                        <div className="p-3 bg-blue-50 rounded-full mr-4">
                            <FaClipboardCheck className="text-blue-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Total Baris Opname</p>
                            <p className="text-xl font-bold text-gray-900">{stats.totalItems} Data</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-green-600">
                        <div className="p-3 bg-green-50 rounded-full mr-4">
                            <FaSync className="text-green-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Total Selisih (+)</p>
                            <p className="text-xl font-bold text-green-600">+{stats.totalDiscrepancyPlus.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-red-600">
                        <div className="p-3 bg-red-50 rounded-full mr-4">
                            <FaExclamationTriangle className="text-red-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Total Selisih (-)</p>
                            <p className="text-xl font-bold text-red-600">-{stats.totalDiscrepancyMinus.toLocaleString()}</p>
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
                                    <th className="px-6 py-4">Produk</th>
                                    <th className="px-6 py-4">Outlet</th>
                                    <th className="px-6 py-4 text-right">Selisih Qty</th>
                                    <th className="px-6 py-4">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] divide-y divide-gray-50 text-gray-600">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-900"></div>
                                        </td>
                                    </tr>
                                ) : paginatedData.length > 0 ? (
                                    paginatedData.map((item, index) => (
                                        <tr key={item._id || index} className="hover:bg-green-50/20 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {dayjs(item.date).format('DD MMM YYYY HH:mm')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">{item.productName}</div>
                                                <div className="text-[11px] text-gray-400 uppercase">{item.unit}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 font-medium">{item.outletName}</td>
                                            <td className={`px-6 py-4 text-right font-bold ${item.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {item.quantity >= 0 ? `+${item.quantity}` : item.quantity}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-[200px] truncate" title={item.notes}>
                                                    {item.notes || "-"}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-gray-400 font-medium italic">Tidak ada data stock opname ditemukan</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {filteredData.length > ITEMS_PER_PAGE && (
                    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <p className="text-[13px] text-gray-500">
                            Menampilkan <span className="font-semibold text-gray-900">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> sampai <span className="font-semibold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}</span> dari <span className="font-semibold text-gray-900">{filteredData.length}</span> data
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                Sebelumnya
                            </button>
                            <div className="flex items-center px-4 text-sm font-medium text-gray-700">
                                {currentPage} / {totalPages}
                            </div>
                            <button
                                onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                Berikutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockOpnameManagement;
