import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import { Link, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSync, FaFileExcel, FaSearch, FaBoxes, FaInfoCircle, FaBoxOpen, FaLayerGroup, FaHammer } from "react-icons/fa";
import { FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import { useSelector, useDispatch } from "react-redux";
import useDebounce from "@/hooks/useDebounce";
import { setReportData } from "@/redux/report/reportSlice";
import Paginated from "@/components/paginated";
import Header from "@/components/Header";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const ProductionStockManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useDispatch();
    const { outlets } = useSelector((state) => state.outlet);
    const { inventory } = useSelector((state) => state.report);
    const cachedData = inventory.productionStock.data;

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
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || "");
    const debouncedSearch = useDebounce(searchTerm, 500);

    const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page'), 10) || 1);
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

    const fetchData = useCallback(async (force = false) => {
        if (!force && cachedData.length > 0) return;

        setLoading(true);
        try {
            // OPTIMIZATION: Instead of fetching movements for each product (N+1),
            // we use the stock/all endpoint which already contains movements for all products.
            const stockResponse = await axios.get("/api/product/stock/all");
            const stockData = stockResponse.data.data || stockResponse.data || [];

            const results = stockData.map((item) => {
                const prod = item.productId || {};
                const movements = item.movements || [];

                return {
                    _id: item._id,
                    name: prod.name || item.productName || "Unknown",
                    sku: prod.sku || item.sku || "-",
                    category: prod.category?.name || item.categoryName || "General",
                    unit: prod.unit?.name || item.unitName || "-",
                    movements: movements,
                    currentStock: item.stock || 0,
                    minStock: item.minStock || 0,
                };
            });

            dispatch(setReportData({ category: 'inventory', type: 'productionStock', data: results }));
            setError(null);
        } catch (err) {
            console.error("Error fetching production stock data:", err);
            setError("Gagal memuat data stok produk.");
        } finally {
            setLoading(false);
        }
    }, [cachedData.length, dispatch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => {
        fetchData(true);
    };

    const processedData = useMemo(() => {
        const start = dayjs(dateRange.startDate).startOf("day");
        const end = dayjs(dateRange.endDate).endOf("day");

        return cachedData.map(item => {
            const movements = item.movements || [];

            const rangeMovs = movements.filter(m => {
                const d = dayjs(m.date || m.createdAt);
                return d.isBetween(start, end, null, '[]');
            });

            const prevMovs = movements.filter(m => dayjs(m.date || m.createdAt).isBefore(start));

            const stockAwal = prevMovs.reduce((acc, m) => {
                if (m.type === "in" || m.type === "adjustment") return acc + (m.quantity || 0);
                if (m.type === "out") return acc - (m.quantity || 0);
                return acc;
            }, 0);

            const stockIn = rangeMovs.filter(m => m.type === "in").reduce((acc, m) => acc + (m.quantity || 0), 0);
            const stockOut = rangeMovs.filter(m => m.type === "out").reduce((acc, m) => acc + (m.quantity || 0), 0);
            const stockAdj = rangeMovs.filter(m => m.type === "adjustment").reduce((acc, m) => acc + (m.quantity || 0), 0);

            const finalStock = stockAwal + stockIn - stockOut + stockAdj;

            return {
                ...item,
                stockAwal,
                stockIn,
                stockOut,
                stockAdj,
                finalStockInWindow: finalStock
            };
        });
    }, [cachedData, dateRange]);

    const filteredData = useMemo(() => {
        if (!debouncedSearch) return processedData;
        const s = debouncedSearch.toLowerCase();
        return processedData.filter(item => {
            const name = (item.name || "").toLowerCase();
            const sku = (item.sku || "").toLowerCase();
            const category = (item.category || "").toLowerCase();
            return name.includes(s) || sku.includes(s) || category.includes(s);
        });
    }, [processedData, debouncedSearch]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);

    const stats = useMemo(() => {
        return {
            totalProducts: filteredData.length,
            totalStockIn: filteredData.reduce((acc, curr) => acc + curr.stockIn, 0),
            totalStockOut: filteredData.reduce((acc, curr) => acc + curr.stockOut, 0)
        };
    }, [filteredData]);

    const turnoverData = useMemo(() => {
        return [...filteredData]
            .map(item => ({
                name: item.name,
                turnover: item.stockIn + item.stockOut
            }))
            .sort((a, b) => b.turnover - a.turnover)
            .slice(0, 10);
    }, [filteredData]);

    const exportToExcel = () => {
        const dataToExport = filteredData.map(item => ({
            "Produk": item.name,
            "SKU": item.sku || "-",
            "Kategori": item.category || "-",
            "Stok Awal": item.stockAwal,
            "Stok Masuk": item.stockIn,
            "Stok Keluar": item.stockOut,
            "Penyesuaian": item.stockAdj,
            "Stok Sekarang": item.currentStock,
            "Unit": item.unit || "-"
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ProduksiStok");
        XLSX.writeFile(wb, `Laporan_Produksi_Stok_${dayjs().format('YYYYMMDD')}.xlsx`);
    };

    const capitalizeWords = (text) => {
        if (!text) return "";
        return text.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
                    <span className="text-green-900 font-semibold">Produk & Stok</span>
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
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Cari Produk / SKU / Kategori</label>
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Summary Cards */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-blue-600">
                            <div className="p-3 bg-blue-50 rounded-full mr-4">
                                <FaLayerGroup className="text-blue-600 text-xl" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Produk</p>
                                <p className="text-xl font-bold text-gray-900">{stats.totalProducts}</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-green-600">
                            <div className="p-3 bg-green-50 rounded-full mr-4">
                                <FaArrowTrendUp className="text-green-600 text-xl" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stok Masuk</p>
                                <p className="text-xl font-bold text-green-600">+{stats.totalStockIn.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-amber-600">
                            <div className="p-3 bg-amber-50 rounded-full mr-4">
                                <FaArrowTrendDown className="text-amber-600 text-xl" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stok Keluar</p>
                                <p className="text-xl font-bold text-amber-600">-{stats.totalStockOut.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Chart Card */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 w-full text-center">Top 10 High-Turnover</h3>
                        <div className="h-[150px] w-full">
                            {turnoverData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={turnoverData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" fontSize={9} tickLine={false} axisLine={false} width={80} />
                                        <Tooltip labelStyle={{ fontSize: '11px' }} itemStyle={{ fontSize: '11px' }} />
                                        <Bar dataKey="turnover" name="Total In+Out" fill="#005429" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-[11px] text-gray-400 italic font-medium uppercase tracking-widest">
                                    Belum ada data grafik
                                </div>
                            )}
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
                        <span>Stok Kosong</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded"></div>
                        <span>Stok Di Bawah Minimum</span>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Produk</th>
                                    <th className="px-6 py-4">SKU / Kategori</th>
                                    <th className="px-6 py-4 text-right">Awal</th>
                                    <th className="px-6 py-4 text-right">Masuk</th>
                                    <th className="px-6 py-4 text-right">Keluar</th>
                                    <th className="px-6 py-4 text-right">Adj</th>
                                    <th className="px-6 py-4 text-right">Stok</th>
                                    <th className="px-6 py-4">Unit</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] divide-y divide-gray-50 text-gray-600">
                                {loading && cachedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-20 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-900"></div>
                                            <p className="mt-2 text-xs text-gray-400 tracking-tight">Menghitung riwayat dan status stok terbaru...</p>
                                        </td>
                                    </tr>
                                ) : paginatedData.length > 0 ? (
                                    paginatedData.map((item, index) => (
                                        <tr key={item._id || index} className={`hover:bg-green-50/20 transition-colors ${item.currentStock <= 0 ? 'bg-red-50/30' : item.currentStock <= item.minStock ? 'bg-amber-50/30' : ''}`}>
                                            <td className="px-6 py-4 font-semibold text-gray-900 uppercase">{item.name}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-500">{item.sku || "-"}</div>
                                                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{item.category || "General"}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-400">{item.stockAwal}</td>
                                            <td className="px-6 py-4 text-right font-bold text-green-600">+{item.stockIn}</td>
                                            <td className="px-6 py-4 text-right font-bold text-red-600">-{item.stockOut}</td>
                                            <td className="px-6 py-4 text-right font-medium text-blue-600">{item.stockAdj > 0 ? `+${item.stockAdj}` : item.stockAdj}</td>
                                            <td className={`px-6 py-4 text-right font-extrabold ${item.currentStock <= item.minStock ? 'text-red-700' : 'text-gray-900'}`}>{item.currentStock}</td>
                                            <td className="px-6 py-4 text-gray-400 lowercase italic">{item.unit || "-"}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="py-20 text-center text-gray-400 font-medium italic">Tidak ada data stok produk ditemukan</td>
                                    </tr>
                                )}
                            </tbody>
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

export default ProductionStockManagement;
