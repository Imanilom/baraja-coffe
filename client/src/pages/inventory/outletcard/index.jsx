import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import { Link, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSync, FaFileExcel, FaSearch, FaBoxes, FaInfoCircle, FaStore, FaLayerGroup, FaBoxOpen } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import { useSelector } from "react-redux";
import useDebounce from "@/hooks/useDebounce";
import Header from "@/pages/admin/header";

const OutletCardManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { outlets } = useSelector((state) => state.outlet);
    const { currentUser } = useSelector((state) => state.user);

    const [stockDistribution, setStockDistribution] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
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
    const [selectedMenuId, setSelectedMenuId] = useState(searchParams.get('menuId') || "");
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

    const menuOptions = useMemo(() => [
        { value: "", label: "Semua Produk" },
        ...menuItems.map((item) => ({
            value: item._id,
            label: item.name,
        })),
    ], [menuItems]);

    const updateURLParams = useCallback(() => {
        const params = new URLSearchParams();
        if (dateRange.startDate) params.set('startDate', dayjs(dateRange.startDate).format('YYYY-MM-DD'));
        if (dateRange.endDate) params.set('endDate', dayjs(dateRange.endDate).format('YYYY-MM-DD'));
        if (selectedMenuId) params.set('menuId', selectedMenuId);
        if (debouncedSearch) params.set('q', debouncedSearch);
        if (currentPage > 1) params.set('page', currentPage.toString());
        setSearchParams(params, { replace: true });
    }, [dateRange, selectedMenuId, debouncedSearch, currentPage, setSearchParams]);

    useEffect(() => {
        updateURLParams();
    }, [updateURLParams]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [menuRes, stockRes] = await Promise.all([
                axios.get('/api/menu/menu-items'),
                axios.get('/api/product/stock/all')
            ]);

            const menus = menuRes.data.data || menuRes.data || [];
            const stocks = stockRes.data.data || stockRes.data || [];

            setMenuItems(menus);

            // Transform stocks into outlet-wise list
            const start = dayjs(dateRange.startDate).startOf("day");
            const end = dayjs(dateRange.endDate).endOf("day");

            const distribution = stocks.map(stock => {
                const movements = stock.movements || [];
                const rangeMovs = movements.filter(m => dayjs(m.date || m.createdAt).isBetween(start, end, null, '[]'));
                const prevMovs = movements.filter(m => dayjs(m.date || m.createdAt).isBefore(start));

                const stockAwal = prevMovs.reduce((acc, m) => {
                    if (m.type === "in" || m.type === "adjustment") return acc + (m.quantity || 0);
                    if (m.type === "out") return acc - (m.quantity || 0);
                    return acc;
                }, 0);

                const stockIn = rangeMovs.filter(m => m.type === "in").reduce((acc, m) => acc + (m.quantity || 0), 0);
                const stockOut = rangeMovs.filter(m => m.type === "out").reduce((acc, m) => acc + (m.quantity || 0), 0);
                const adjustment = rangeMovs.filter(m => m.type === "adjustment").reduce((acc, m) => acc + (m.quantity || 0), 0);
                const transfers = rangeMovs.filter(m => m.type === "transfer").reduce((acc, m) => acc + (m.quantity || 0), 0);

                const stockAkhir = stockAwal + stockIn - stockOut + adjustment + transfers;

                return {
                    id: stock._id,
                    outletName: stock.outletId?.name || "Main Outlet",
                    productName: stock.productId?.name || "Unnamed Product",
                    productId: stock.productId?._id,
                    stockAwal,
                    stockIn,
                    stockOut,
                    adjustment,
                    transfers,
                    stockAkhir,
                    unit: stock.productId?.unit || "unit",
                    price: stock.productId?.price || 0
                };
            });

            setStockDistribution(distribution);
            setError(null);
        } catch (err) {
            console.error("Error fetching outlet card data:", err);
            setError("Gagal memuat data distribusi stok per outlet.");
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
        let result = stockDistribution;

        if (selectedMenuId) {
            result = result.filter(item => item.productId === selectedMenuId);
        }

        if (debouncedSearch) {
            const s = debouncedSearch.toLowerCase();
            result = result.filter(item =>
                item.outletName.toLowerCase().includes(s) ||
                item.productName.toLowerCase().includes(s)
            );
        }

        return result;
    }, [stockDistribution, selectedMenuId, debouncedSearch]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);

    const stats = useMemo(() => {
        return {
            totalEntries: filteredData.length,
            totalStockValue: filteredData.reduce((acc, curr) => acc + (curr.stockAkhir * curr.price), 0),
            totalOutlets: new Set(filteredData.map(d => d.outletName)).size
        };
    }, [filteredData]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const exportToExcel = () => {
        const dataToExport = filteredData.map(item => ({
            "Outlet": item.outletName,
            "Produk": item.productName,
            "Stok Awal": item.stockAwal,
            "Masuk": item.stockIn,
            "Keluar": item.stockOut,
            "Transfer": item.transfers,
            "Penyesuaian": item.adjustment,
            "Stok Akhir": item.stockAkhir,
            "Satuan": item.unit,
            "Nilai Stok": formatCurrency(item.stockAkhir * item.price)
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "KartuOutlet");
        XLSX.writeFile(wb, `Laporan_Kartu_Outlet_${dayjs().format('YYYYMMDD')}.xlsx`);
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
                    <span className="text-green-900 font-semibold">Kartu Outlet</span>
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
                {/* Navigation Tabs */}
                <div className="flex bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <Link to="/admin/inventory/stockcard" className="flex-1 py-4 text-center text-sm font-semibold text-gray-400 hover:bg-gray-50 transition-colors border-r border-gray-100">
                        KARTU PRODUK
                    </Link>
                    <div className="flex-1 py-4 text-center text-sm font-bold text-green-900 bg-green-50/30 border-b-2 border-b-green-900">
                        KARTU OUTLET
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Pilih Produk</label>
                            <Select
                                options={menuOptions}
                                value={menuOptions.find(opt => opt.value === selectedMenuId)}
                                onChange={(selected) => {
                                    setSelectedMenuId(selected.value);
                                    setCurrentPage(1);
                                }}
                                styles={customSelectStyles}
                                isSearchable
                                placeholder="Pilih Produk..."
                            />
                        </div>
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
                        <div className="md:col-span-2">
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Cari Outlet / Produk</label>
                            <div className="relative">
                                <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Nama Outlet atau Produk..."
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
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-green-900">
                        <div className="p-3 bg-green-50 rounded-full mr-4">
                            <FaStore className="text-green-900 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Total Outlet</p>
                            <p className="text-xl font-bold text-gray-900">{stats.totalOutlets} Outlet</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-blue-600">
                        <div className="p-3 bg-blue-50 rounded-full mr-4">
                            <FaBoxOpen className="text-blue-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Total Baris Data</p>
                            <p className="text-xl font-bold text-gray-900">{stats.totalEntries} Baris</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-amber-600">
                        <div className="p-3 bg-amber-50 rounded-full mr-4">
                            <FaLayerGroup className="text-amber-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Estimasi Nilai Stok</p>
                            <p className="text-xl font-bold text-amber-600">{formatCurrency(stats.totalStockValue)}</p>
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
                                    <th className="px-6 py-4">Outlet</th>
                                    {!selectedMenuId && <th className="px-6 py-4">Produk</th>}
                                    <th className="px-6 py-4 text-right">Awal</th>
                                    <th className="px-6 py-4 text-right">Masuk</th>
                                    <th className="px-6 py-4 text-right">Keluar</th>
                                    <th className="px-6 py-4 text-right">Transfer</th>
                                    <th className="px-6 py-4 text-right">Adj</th>
                                    <th className="px-6 py-4 text-right">Akhir</th>
                                    <th className="px-6 py-4 text-right">Nilai Stok</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] divide-y divide-gray-50 text-gray-600">
                                {loading ? (
                                    <tr>
                                        <td colSpan={selectedMenuId ? 8 : 9} className="py-20 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-900"></div>
                                        </td>
                                    </tr>
                                ) : paginatedData.length > 0 ? (
                                    paginatedData.map((item, index) => (
                                        <tr key={item.id || index} className="hover:bg-green-50/20 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-900 uppercase">{item.outletName}</td>
                                            {!selectedMenuId && (
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900">{item.productName}</div>
                                                    <div className="text-[10px] text-gray-400 lowercase">{item.unit}</div>
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-right font-medium text-gray-400">{item.stockAwal}</td>
                                            <td className="px-6 py-4 text-right font-bold text-green-600">+{item.stockIn}</td>
                                            <td className="px-6 py-4 text-right font-bold text-red-600">-{item.stockOut}</td>
                                            <td className="px-6 py-4 text-right font-medium text-blue-600">{item.transfers > 0 ? `+${item.transfers}` : item.transfers}</td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-500">{item.adjustment > 0 ? `+${item.adjustment}` : item.adjustment}</td>
                                            <td className="px-6 py-4 text-right font-extrabold text-gray-900">{item.stockAkhir}</td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-700 font-mono">{formatCurrency(item.stockAkhir * item.price)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={selectedMenuId ? 8 : 9} className="py-20 text-center text-gray-400 font-medium italic">Tidak ada data distribusi stok ditemukan</td>
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

export default OutletCardManagement;
