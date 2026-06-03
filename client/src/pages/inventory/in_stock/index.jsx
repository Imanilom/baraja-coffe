import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import dayjs from "dayjs";
import { Link, useSearchParams } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSearch, FaInfoCircle, FaBoxes, FaChevronLeft, FaSync, FaFileExcel } from "react-icons/fa";
import { FaArrowTrendUp } from "react-icons/fa6";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Modal from './modal';
import Header from "../../admin/header";
import MovementSideModal from "../../../components/MovementSideModal";
import { useSelector } from "react-redux";
import useDebounce from "@/hooks/useDebounce";

const InStockManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { outlets } = useSelector((state) => state.outlet);

    const [selectedMovement, setSelectedMovement] = useState(null);
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
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || "");
    const debouncedSearch = useDebounce(searchTerm, 500);

    const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page')) || 1);
    const ITEMS_PER_PAGE = 50;

    const [filteredData, setFilteredData] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const updateURLParams = useCallback(() => {
        const params = new URLSearchParams();
        if (dateRange.startDate) params.set('startDate', dayjs(dateRange.startDate).format('YYYY-MM-DD'));
        if (dateRange.endDate) params.set('endDate', dayjs(dateRange.endDate).format('YYYY-MM-DD'));
        if (debouncedSearch) params.set('q', debouncedSearch);
        if (currentPage > 1) params.set('page', currentPage.toString());
        setSearchParams(params, { replace: true });
    }, [dateRange, debouncedSearch, currentPage, setSearchParams]);

    useEffect(() => {
        updateURLParams();
    }, [updateURLParams]);

    const fetchMenuCapacity = async (start, end) => {
        try {
            const [recipesRes, stockRes] = await Promise.all([
                axios.get("/api/product/recipes"),
                axios.get("/api/product/stock/all")
            ]);

            const recipes = recipesRes.data.data || [];
            const stock = stockRes.data.data || [];

            const results = [];
            for (const menu of recipes) {
                let ingredients = menu.baseIngredients.filter(ing => ing.isDefault);

                const movementsPerIngredient = ingredients.map(ing => {
                    const s = stock.find(st => st.productId?._id === ing.productId);
                    if (!s || !s.movements) return [];

                    return s.movements
                        .filter(m => m.type === "adjustment" || m.type === "in")
                        .map(m => ({
                            date: dayjs(m.date || m.createdAt).format("YYYY-MM-DD"),
                            capacityIn: Math.floor((m.quantity || 0) / (ing.quantity || 1))
                        }));
                }).flat();

                const uniqueDates = [...new Set(movementsPerIngredient.map(m => m.date))];

                const menuMovements = uniqueDates.map(date => {
                    const d = dayjs(date);
                    if (!d.isBetween(start, end, null, '[]')) return null;

                    const capacities = movementsPerIngredient
                        .filter(m => m.date === date)
                        .map(m => m.capacityIn);

                    const menuCapacity = capacities.length ? Math.min(...capacities) : 0;
                    return {
                        menu: menu.menuItemId?.name,
                        category: menu.menuItemId?.category?.name || "General",
                        date,
                        capacityIn: menuCapacity
                    };
                }).filter(m => m && m.capacityIn > 0);

                results.push(...menuMovements);
            }

            results.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort descending
            return results;
        } catch (err) {
            console.error("Error calculating menu capacity:", err);
            return [];
        }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const start = dayjs(dateRange.startDate).startOf("day");
            const end = dayjs(dateRange.endDate).endOf("day");

            const results = await fetchMenuCapacity(start, end);
            setFilteredData(results);
        } catch (err) {
            console.error("Error fetching in-stock data:", err);
            setError("Gagal memuat data kapasitas stok masuk.");
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const displayData = useMemo(() => {
        if (!debouncedSearch) return filteredData;
        const s = debouncedSearch.toLowerCase();
        return filteredData.filter(item =>
            (item.menu || "").toLowerCase().includes(s) ||
            (item.category || "").toLowerCase().includes(s)
        );
    }, [filteredData, debouncedSearch]);

    const totalPages = Math.ceil(displayData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return displayData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [displayData, currentPage]);

    const formatDateTime = (datetime) => {
        return dayjs(datetime).format('DD-MM-YYYY HH:mm');
    };

    const exportToExcel = () => {
        const dataToExport = displayData.map(item => ({
            "Waktu": dayjs(item.date).format('DD-MM-YYYY'),
            "Menu": item.menu,
            "Kategori": item.category,
            "Estimasi Stok Masuk (Qty)": item.capacityIn
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "StokMasukMenu");
        XLSX.writeFile(wb, `Laporan_Stok_Masuk_Menu_${dayjs().format('YYYYMMDD')}.xlsx`);
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
                    <span className="text-green-900 font-semibold">Stok Masuk (Kapasitas)</span>
                    <FaInfoCircle className="ml-2 text-gray-400 cursor-help" title="Menghitung estimasi kapasitas menu berdasarkan stok bahan yang masuk (Adjustment/In)" />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-[13px] px-4 py-2 rounded shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <FaSync className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    <button
                        onClick={exportToExcel}
                        disabled={loading || displayData.length === 0}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Cari Menu / Kategori</label>
                            <div className="relative">
                                <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full text-[13px] border border-gray-200 py-2 pl-10 pr-3 rounded focus:ring-2 focus:ring-green-900 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-blue-600">
                        <div className="p-3 bg-blue-50 rounded-full mr-4">
                            <FaBoxes className="text-blue-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Total Menu Terdeteksi</p>
                            <p className="text-xl font-bold text-gray-900">{new Set(displayData.map(d => d.menu)).size} Menu</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-green-600">
                        <div className="p-3 bg-green-50 rounded-full mr-4">
                            <FaArrowTrendUp className="text-green-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Total Baris Aktivitas</p>
                            <p className="text-xl font-bold text-green-600">{displayData.length} Baris</p>
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
                                    <th className="px-6 py-4">Waktu Submit (Tanggal)</th>
                                    <th className="px-6 py-4">Menu</th>
                                    <th className="px-6 py-4">Kategori</th>
                                    <th className="px-6 py-4 text-right">Potensi Kapasitas Baru (Qty)</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] divide-y divide-gray-50 text-gray-600">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-900"></div>
                                            <p className="mt-2 text-xs text-gray-400">Mengkalkulasi kapasitas menu dari riwayat stok...</p>
                                        </td>
                                    </tr>
                                ) : paginatedData.length > 0 ? (
                                    paginatedData.map((item, index) => (
                                        <tr key={index} className="hover:bg-green-50/20 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-500">{dayjs(item.date).format('DD MMM YYYY')}</td>
                                            <td className="px-6 py-4 font-bold text-gray-900 uppercase">{item.menu}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-extrabold text-green-600">x{item.capacityIn.toLocaleString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center text-gray-400 font-medium italic">Tidak ada pertambahan stok menu terdeteksi</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {displayData.length > ITEMS_PER_PAGE && (
                    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <p className="text-[13px] text-gray-500">
                            Menampilkan <span className="font-semibold text-gray-900">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> sampai <span className="font-semibold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, displayData.length)}</span> dari <span className="font-semibold text-gray-900">{displayData.length}</span> data
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
            />
        </div>
    );
};

export default InStockManagement;

