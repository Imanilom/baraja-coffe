import axios from '@/lib/axios';
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FaClipboardList, FaChevronRight, FaSearch, FaFileExcel, FaSync, FaBoxOpen, FaWarehouse, FaExclamationTriangle, FaTimesCircle } from "react-icons/fa";
import { Link, useSearchParams } from "react-router-dom";
import * as XLSX from 'xlsx';
import useDebounce from "@/hooks/useDebounce";
import { useSelector, useDispatch } from "react-redux";
import { setReportData } from "@/redux/report/reportSlice";
import Paginated from "@/components/Paginated";
import Header from "@/components/Header";
import dayjs from "dayjs";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const StockManagement = () => {
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const cachedData = useSelector((state) => state.report.operational.stock.data);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initial state from URL
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || "");
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page')) || 1);

    const ITEMS_PER_PAGE = 50;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const updateURLParams = useCallback(() => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('q', debouncedSearch);
        if (currentPage > 1) params.set('page', currentPage.toString());
        setSearchParams(params, { replace: true });
    }, [debouncedSearch, currentPage, setSearchParams]);

    useEffect(() => {
        updateURLParams();
    }, [updateURLParams]);

    // Fetch stock data
    const fetchStockData = useCallback(async (force = false) => {
        if (!force && cachedData.length > 0) return;
        setLoading(true);
        try {
            // Fetch products and stock in parallel
            const [productResponse, stockResponse] = await Promise.all([
                axios.get("/api/marketlist/products"),
                axios.get("/api/product/stock/all")
            ]);

            const products = Array.isArray(productResponse.data?.data) ? productResponse.data.data : [];
            const stockData = Array.isArray(stockResponse.data?.data) ? stockResponse.data.data : [];

            const stockMap = {};
            stockData.forEach((s) => {
                if (s?.productId?._id) {
                    stockMap[s.productId._id] = s;
                }
            });

            const mergedData = products.map((prod) => {
                const stockItem = stockMap[prod._id] || null;
                return {
                    ...prod,
                    currentStock: stockItem?.currentStock || 0,
                    minStock: stockItem?.minStock || 0,
                };
            });

            dispatch(setReportData({ category: 'operational', type: 'stock', data: mergedData }));
            setError(null);
        } catch (err) {
            console.error("Error fetching stock data:", err);
            setError(`Gagal memuat data stok: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [cachedData.length, dispatch]);

    useEffect(() => {
        fetchStockData();
    }, [fetchStockData]);

    const handleRefresh = () => {
        fetchStockData(true);
    };

    // Filtered data based on search
    const filteredData = useMemo(() => {
        let result = cachedData;
        if (debouncedSearch) {
            const s = debouncedSearch.toLowerCase();
            result = result.filter(product =>
                (product.name || '').toLowerCase().includes(s) ||
                (product.sku || '').toLowerCase().includes(s) ||
                (product.barcode || '').toLowerCase().includes(s) ||
                (product.category || '').toLowerCase().includes(s)
            );
        }
        return result;
    }, [cachedData, debouncedSearch]);

    // Paginate data
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, filteredData]);

    // Summary metrics
    const metrics = useMemo(() => {
        const totalValue = filteredData.reduce((total, p) => total + ((p.currentStock || 0) * (p.price || 0)), 0);
        const available = filteredData.filter(p => (p.currentStock || 0) > (p.minStock || 0)).length;
        const warning = filteredData.filter(p => (p.currentStock || 0) > 0 && (p.currentStock || 0) <= (p.minStock || 0)).length;
        const outOfStock = filteredData.filter(p => (p.currentStock || 0) === 0).length;

        return { totalValue, available, warning, outOfStock };
    }, [filteredData]);

    const getStockStatus = (product) => {
        const stock = product.currentStock || 0;
        const minStock = product.minStock || 0;

        if (stock === 0) {
            return { text: 'Habis', color: 'text-red-700 bg-red-100 border-red-200' };
        } else if (stock <= minStock) {
            return { text: 'Kritis', color: 'text-amber-700 bg-amber-100 border-amber-200' };
        }
        return { text: 'Tersedia', color: 'text-green-700 bg-green-100 border-green-200' };
    };

    // Data for chart
    const pieData = useMemo(() => [
        { name: 'Tersedia', value: metrics.available, color: '#005429' },
        { name: 'Kritis', value: metrics.warning, color: '#EAB308' },
        { name: 'Habis', value: metrics.outOfStock, color: '#EF4444' },
    ], [metrics]);

    const exportToExcel = () => {
        try {
            const exportData = filteredData.map((product, index) => {
                const stock = product.currentStock || 0;
                const minStock = product.minStock || 0;
                const status = getStockStatus(product);
                return {
                    'No': index + 1,
                    'Nama Produk': product.name || '-',
                    'SKU': product.sku || '-',
                    'Kategori': product.category || '-',
                    'Stok Saat Ini': stock,
                    'Stok Minimum': minStock,
                    'Satuan': product.unit || '-',
                    'Status': status.text,
                    'Harga/Unit': product.price || 0,
                    'Nilai Total': stock * (product.price || 0)
                };
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(wb, ws, 'Laporan Stok');
            XLSX.writeFile(wb, `Laporan_Stok_${dayjs().format('YYYYMMDD')}.xlsx`);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Gagal mengekspor file Excel.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <Header />

            {/* Breadcrumb & Actions */}
            <div className="px-6 py-4 flex justify-between items-center bg-white shadow-sm border-b">
                <div className="flex items-center text-sm text-gray-500 font-medium">
                    <FaClipboardList className="mr-2" />
                    <span>Laporan</span>
                    <FaChevronRight className="mx-2 text-[10px]" />
                    <Link to="/admin/operational-menu" className="hover:text-green-900 transition-colors mr-2">Laporan Operasional</Link>
                    <FaChevronRight className="mx-2 text-[10px]" />
                    <span className="text-green-900 font-semibold">Laporan Stok</span>
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
                {/* Search */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 mb-6">
                    <div className="relative max-w-md">
                        <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari produk, SKU, barcode, atau kategori..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full text-sm border border-gray-200 py-2 pl-10 pr-4 rounded-lg focus:ring-2 focus:ring-green-900 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Summary Cards */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-blue-600">
                            <div className="p-3 bg-blue-50 rounded-full mr-4">
                                <FaBoxOpen className="text-blue-600 text-xl" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Produk</p>
                                <p className="text-xl font-bold text-gray-900">{filteredData.length}</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-green-600">
                            <div className="p-3 bg-green-50 rounded-full mr-4">
                                <FaWarehouse className="text-green-600 text-xl" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nilai Stok</p>
                                <p className="text-xl font-bold text-green-700">{formatCurrency(metrics.totalValue)}</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-amber-500">
                            <div className="p-3 bg-amber-50 rounded-full mr-4">
                                <FaExclamationTriangle className="text-amber-600 text-xl" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stok Kritis</p>
                                <p className="text-xl font-bold text-amber-600">{metrics.warning}</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-red-600">
                            <div className="p-3 bg-red-50 rounded-full mr-4">
                                <FaTimesCircle className="text-red-600 text-xl" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stok Habis</p>
                                <p className="text-xl font-bold text-red-600">{metrics.outOfStock}</p>
                            </div>
                        </div>
                    </div>

                    {/* Chart Card */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 w-full">Distribusi Stok</h3>
                        <div className="h-[150px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={40}
                                        outerRadius={60}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
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
                                    <th className="px-6 py-4">Produk</th>
                                    <th className="px-6 py-4">SKU / Barcode</th>
                                    <th className="px-6 py-4">Kategori</th>
                                    <th className="px-6 py-4 text-center">Stok</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Harga</th>
                                    <th className="px-6 py-4 text-right">Nilai Stok</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] divide-y divide-gray-50 text-gray-600">
                                {loading && cachedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-900"></div>
                                        </td>
                                    </tr>
                                ) : paginatedData.length > 0 ? (
                                    paginatedData.map((product) => {
                                        const status = getStockStatus(product);
                                        const nilaiStok = (product.currentStock || 0) * (product.price || 0);
                                        return (
                                            <tr key={product._id} className="hover:bg-green-50/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900">{product.name || "-"}</div>
                                                    <div className="text-[11px] text-gray-400">ID: {product._id}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>{product.sku || "-"}</div>
                                                    <div className="text-[11px] font-mono text-gray-400">{product.barcode || "-"}</div>
                                                </td>
                                                <td className="px-6 py-4 italic text-gray-500">{product.category || "-"}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="font-bold text-gray-900">{product.currentStock}</div>
                                                    <div className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter">{product.unit || "Unit"}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${status.color}`}>
                                                        {status.text}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-gray-500">{formatCurrency(product.price)}</td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">{formatCurrency(nilaiStok)}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center text-gray-400 font-medium italic">Tidak ada produk ditemukan</td>
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

export default StockManagement;
