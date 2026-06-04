import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import { Link, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSync, FaFileExcel, FaSearch, FaBoxes, FaInfoCircle, FaBoxOpen, FaLayerGroup } from "react-icons/fa";
import { FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import { useSelector } from "react-redux";
import useDebounce from "@/hooks/useDebounce";
import Header from "@/pages/admin/header";

const StockCardManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { outlets } = useSelector((state) => state.outlet);
    const { currentUser } = useSelector((state) => state.user);

    const [stockCardData, setStockCardData] = useState([]);
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

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const start = dayjs(dateRange.startDate).startOf("day");
            const end = dayjs(dateRange.endDate).endOf("day");

            const [recipesRes, stockRes, ordersRes, menuRes] = await Promise.all([
                axios.get("/api/product/recipes"),
                axios.get("/api/product/stock/all"),
                axios.get("/api/report/orders", {
                    params: {
                        startDate: dayjs(dateRange.startDate).format('YYYY-MM-DD'),
                        endDate: dayjs(dateRange.endDate).format('YYYY-MM-DD'),
                        mode: 'all'
                    }
                }),
                axios.get("/api/menu/menu-items")
            ]);

            const recipes = recipesRes.data.data || recipesRes.data || [];
            const stock = stockRes.data.data || stockRes.data || [];
            const orders = ordersRes.data.data || ordersRes.data || [];
            const menuItems = menuRes.data.data || menuRes.data || [];

            const results = menuItems.map(menu => {
                const recipe = recipes.find(r => r.menuItemId?._id === menu._id);
                if (!recipe) {
                    return {
                        ...menu,
                        capacityFirst: 0,
                        capacityIn: 0,
                        capacityOut: 0,
                        capacityLast: 0,
                        stockDetails: []
                    };
                }

                const ingredients = recipe.baseIngredients.filter(ing => ing.isDefault);
                const stockDetails = ingredients.map(ing => {
                    const s = stock.find(st => st.productId?._id === ing.productId);
                    if (!s) return null;

                    const movements = s.movements || [];
                    const stockAwalIn = movements
                        .filter(m => dayjs(m.date).isBefore(start) && m.type === "adjustment")
                        .reduce((sum, m) => sum + m.quantity, 0);

                    const stockAwalOut = movements
                        .filter(m => dayjs(m.date).isBefore(start) && m.type === "out")
                        .reduce((sum, m) => sum + m.quantity, 0);

                    const stockAwal = stockAwalIn - stockAwalOut;

                    const stockMasuk = movements
                        .filter(m => m.type === "adjustment" && dayjs(m.date).isBetween(start, end, null, '[]'))
                        .reduce((sum, m) => sum + m.quantity, 0);

                    const stockKeluar = orders
                        .flatMap(o => (o.items || []).map(i => ({ ...i, orderDate: o.createdAt })))
                        .filter(i => i.menuItem?._id === menu._id && dayjs(i.orderDate).isBetween(start, end, null, '[]'))
                        .reduce((sum, i) => sum + i.quantity, 0);

                    const stockAkhir = stockAwal + stockMasuk - stockKeluar;

                    return {
                        ingredient: s.productId?.name,
                        stockAwal,
                        stockMasuk,
                        stockAkhir,
                        capacityFirst: ing.quantity > 0 ? Math.floor(stockAwal / ing.quantity) : 0,
                        capacityIn: ing.quantity > 0 ? Math.floor(stockMasuk / ing.quantity) : 0,
                        capacityOut: stockKeluar,
                        capacityLast: ing.quantity > 0 ? Math.floor(stockAkhir / ing.quantity) : 0
                    };
                }).filter(Boolean);

                return {
                    ...menu,
                    capacityFirst: stockDetails.length ? Math.min(...stockDetails.map(d => d.capacityFirst)) : 0,
                    capacityIn: stockDetails.length ? Math.min(...stockDetails.map(d => d.capacityIn)) : 0,
                    capacityOut: stockDetails.length ? Math.max(...stockDetails.map(d => d.capacityOut)) : 0, // Out is usually same for all but we max it
                    capacityLast: stockDetails.length ? Math.min(...stockDetails.map(d => d.capacityLast)) : 0,
                    stockDetails
                };
            });

            setStockCardData(results);
            setError(null);
        } catch (err) {
            console.error("Error fetching stock card data:", err);
            setError("Gagal memuat data kartu stok.");
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => {
        fetchData();
    };

    const filteredData = useMemo(() => {
        if (!debouncedSearch) return stockCardData;
        const s = debouncedSearch.toLowerCase();
        return stockCardData.filter(item => {
            const name = (item.name || "").toLowerCase();
            const category = (item.category?.name || "").toLowerCase();
            return name.includes(s) || category.includes(s);
        });
    }, [stockCardData, debouncedSearch]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);

    const stats = useMemo(() => {
        return {
            totalProducts: filteredData.length,
            totalStockIn: filteredData.reduce((acc, curr) => acc + curr.capacityIn, 0),
            totalStockOut: filteredData.reduce((acc, curr) => acc + curr.capacityOut, 0)
        };
    }, [filteredData]);

    const exportToExcel = () => {
        const dataToExport = filteredData.map(item => ({
            "Produk": item.name,
            "Kategori": item.category?.name || "-",
            "Stok Awal": item.capacityFirst,
            "Stok Masuk": item.capacityIn,
            "Stok Keluar": item.capacityOut,
            "Stok Akhir": item.capacityLast
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "KartuStok");
        XLSX.writeFile(wb, `Laporan_Kartu_Stok_${dayjs().format('YYYYMMDD')}.xlsx`);
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
                    <span className="text-green-900 font-semibold">Kartu Stok</span>
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
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Cari Produk / Kategori</label>
                            <div className="relative">
                                <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari produk..."
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
                            <FaLayerGroup className="text-blue-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Total Produk</p>
                            <p className="text-xl font-bold text-gray-900">{stats.totalProducts} Item</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-green-600">
                        <div className="p-3 bg-green-50 rounded-full mr-4">
                            <FaArrowTrendUp className="text-green-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Total Stok Masuk</p>
                            <p className="text-xl font-bold text-green-600">+{stats.totalStockIn.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-amber-600">
                        <div className="p-3 bg-amber-50 rounded-full mr-4">
                            <FaArrowTrendDown className="text-amber-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Total Stok Keluar</p>
                            <p className="text-xl font-bold text-amber-600">-{stats.totalStockOut.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-100 text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Legend */}
                <div className="mb-4 flex gap-4 text-[11px] font-semibold text-gray-500">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                        <span>Stok Menipis (≤ 5)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded"></div>
                        <span>Stok Terbatas (≤ 10)</span>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Nama Produk</th>
                                    <th className="px-6 py-4">Kategori</th>
                                    <th className="px-6 py-4 text-right">Stok Awal</th>
                                    <th className="px-6 py-4 text-right">Masuk</th>
                                    <th className="px-6 py-4 text-right">Keluar</th>
                                    <th className="px-6 py-4 text-right">Stok Akhir</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] divide-y divide-gray-50 text-gray-600">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-900"></div>
                                            <p className="mt-2 text-xs text-gray-400 tracking-tight">Menghitung kapasitas berdasarkan resep dan riwayat stok...</p>
                                        </td>
                                    </tr>
                                ) : paginatedData.length > 0 ? (
                                    paginatedData.map((item, index) => (
                                        <tr key={item._id || index} className={`hover:bg-green-50/20 transition-colors ${item.capacityLast <= 5 ? 'bg-red-50/30' : item.capacityLast <= 10 ? 'bg-amber-50/30' : ''}`}>
                                            <td className="px-6 py-4 font-semibold text-gray-900 uppercase">{item.name}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase">
                                                    {item.category?.name || "Uncategorized"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-500">{item.capacityFirst}</td>
                                            <td className="px-6 py-4 text-right font-bold text-green-600">+{item.capacityIn}</td>
                                            <td className="px-6 py-4 text-right font-bold text-red-600">-{item.capacityOut}</td>
                                            <td className={`px-6 py-4 text-right font-extrabold ${item.capacityLast <= 5 ? 'text-red-700' : 'text-gray-900'}`}>
                                                {item.capacityLast}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center text-gray-400 font-medium italic">Tidak ada data kartu stok ditemukan</td>
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

export default StockCardManagement;
