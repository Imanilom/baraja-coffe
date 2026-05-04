import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import { Link, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSync, FaFileExcel, FaSearch, FaBoxes, FaInfoCircle, FaExchangeAlt, FaHistory } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import { useSelector } from "react-redux";
import useDebounce from "@/hooks/useDebounce";
import MovementSideModal from "@/components/movementSideModal";
import Header from "@/pages/admin/header";

const TransferStockManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { outlets } = useSelector((state) => state.outlet);
    const { currentUser } = useSelector((state) => state.user);

    const [selectedMovement, setSelectedMovement] = useState(null);
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initial state from URL
    const [dateRange, setDateRange] = useState(() => {
        const start = searchParams.get('startDate');
        const end = searchParams.get('endDate');
        return {
            startDate: start ? dayjs(start).toDate() : dayjs().toDate(),
            endDate: end ? dayjs(end).toDate() : dayjs().toDate()
        };
    });
    const [selectedOutlet, setSelectedOutlet] = useState(searchParams.get('outletId') || "");
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || "");
    const debouncedSearch = useDebounce(searchTerm, 500);

    const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page')) || 1);
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

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Note: The $N+1$ fetch is kept as per the original logic, 
            // but we wrap it in a single loading state and handle errors gracefully.
            const stockResponse = await axios.get('/api/product/stock/all');
            const stockData = stockResponse.data.data || [];

            const allMovements = [];

            // Limit products to fetch if there are too many (safety measure)
            // But for now we try to fetch all like the original
            await Promise.all(
                stockData.map(async (item) => {
                    try {
                        const movementResponse = await axios.get(`/api/product/stock/${item.productId?._id}/movements`);
                        const productMovements = (movementResponse.data.data?.movements || []).map(m => ({
                            ...m,
                            product: item.productId?.name,
                            unit: item.productId?.unit,
                            productId: item.productId?._id
                        }));
                        allMovements.push(...productMovements);
                    } catch (e) {
                        console.error(`Error fetching movements for product ${item.productId?._id}`);
                    }
                })
            );

            // Filter for transfer-type movements only (adjustment in this system)
            const transferMovements = allMovements.filter(m => m.type === "adjustment");

            setMovements(transferMovements.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()));
            setError(null);
        } catch (err) {
            console.error("Error fetching transfer stock data:", err);
            setError("Gagal memuat data transfer stok.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => {
        fetchData();
    };

    const filteredData = useMemo(() => {
        let result = movements;

        // Date Filter
        if (dateRange.startDate && dateRange.endDate) {
            const start = dayjs(dateRange.startDate).startOf('day');
            const end = dayjs(dateRange.endDate).endOf('day');
            result = result.filter(m => {
                const d = dayjs(m.date);
                return d.isAfter(start) && d.isBefore(end);
            });
        }

        // Search Filter
        if (debouncedSearch) {
            const s = debouncedSearch.toLowerCase();
            result = result.filter(item => {
                const product = (item.product || "").toLowerCase();
                const notes = (item.notes || "").toLowerCase();
                const id = (item._id || "").toLowerCase();
                return product.includes(s) || notes.includes(s) || id.includes(s);
            });
        }

        return result;
    }, [movements, debouncedSearch, dateRange]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);

    const stats = useMemo(() => {
        return {
            totalTransfers: filteredData.length,
            totalQuantity: filteredData.reduce((acc, curr) => acc + (curr.quantity || 0), 0)
        };
    }, [filteredData]);

    const capitalizeWords = (text) => {
        if (!text) return "";
        return text.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const formatDateTime = (datetime) => {
        return dayjs(datetime).format('DD-MM-YYYY HH:mm:ss');
    };

    const exportToExcel = () => {
        const exportData = filteredData.map(item => ({
            "Waktu Submit": formatDateTime(item.date),
            "ID Transfer": item._id,
            "Produk": item.product || "-",
            "Unit": item.unit || "-",
            "Quantity": item.quantity || 0,
            "Keterangan": item.notes || "-"
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "TransferStok");
        XLSX.writeFile(wb, `Laporan_Transfer_Stok_${dayjs().format('YYYYMMDD')}.xlsx`);
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
                    <span className="text-green-900 font-semibold">Stok Transfer</span>
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
                        to="/admin/inventory/transfer-stock-create"
                        className="flex items-center gap-2 bg-green-900 text-white text-[13px] px-4 py-2 rounded shadow-sm hover:bg-green-800 transition-colors"
                    >
                        Tambah Transfer Stok
                    </Link>
                </div>
            </div>

            <div className="p-6">
                {/* Filters */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Cari Produk / ID</label>
                            <div className="relative">
                                <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Nama Produk / ID Transfer"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full text-[13px] border border-gray-200 py-2 pl-10 pr-3 rounded focus:ring-2 focus:ring-green-900 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex items-end">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-blue-600">
                        <div className="p-3 bg-blue-50 rounded-full mr-4">
                            <FaExchangeAlt className="text-blue-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Total Transaksi Transfer</p>
                            <p className="text-xl font-bold text-gray-900">{stats.totalTransfers} Kali</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-amber-600">
                        <div className="p-3 bg-amber-50 rounded-full mr-4">
                            <FaHistory className="text-amber-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Total Kuantitas Produk</p>
                            <p className="text-xl font-bold text-gray-900">{stats.totalQuantity.toLocaleString()} Unit</p>
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
                                    <th className="px-6 py-4">Waktu Submit</th>
                                    <th className="px-6 py-4">Produk</th>
                                    <th className="px-6 py-4">ID Transfer</th>
                                    <th className="px-6 py-4 text-right">Qty</th>
                                    <th className="px-6 py-4">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] divide-y divide-gray-50 text-gray-600">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-900"></div>
                                            <p className="mt-2 text-xs text-gray-400">Memuat data produk dan riwayat stok...</p>
                                        </td>
                                    </tr>
                                ) : paginatedData.length > 0 ? (
                                    paginatedData.map((item, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-green-50/20 transition-colors cursor-pointer"
                                            onClick={() => setSelectedMovement(item)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="text-gray-900 font-medium">{dayjs(item.date).format('DD MMM YYYY')}</div>
                                                <div className="text-[11px] text-gray-400">{dayjs(item.date).format('HH:mm:ss')}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">{capitalizeWords(item.product)}</div>
                                                <div className="text-[11px] text-gray-400 uppercase">{item.unit}</div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-[11px] text-gray-500">{item._id}</td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900">{item.quantity}</td>
                                            <td className="px-6 py-4 max-w-[200px] truncate">{item.notes || "-"}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-gray-400 font-medium italic">Tidak ada data transfer stok ditemukan</td>
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

            <MovementSideModal
                movement={selectedMovement}
                onClose={() => setSelectedMovement(null)}
                formatDateTime={formatDateTime}
                capitalizeWords={capitalizeWords}
            />
        </div>
    );
};

export default TransferStockManagement;
