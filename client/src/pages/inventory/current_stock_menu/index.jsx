import React, { useEffect, useState, useMemo, useCallback } from "react";
import { FaSearch, FaChevronRight, FaPencilAlt, FaWarehouse } from 'react-icons/fa';
import axios from '@/lib/axios';
import ExportInventory from "../exportInventory";
import UpdateStockForm from "./update";
import { useSelector } from "react-redux";
import CategoryTabs from "../../menu/product/component/categorytabs";
import Paginated from "../../../components/paginated";

const CurrentStockManagement = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [tempSearch, setTempSearch] = useState("");
    const [error, setError] = useState(null);
    const [category, setCategory] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [originalData, setOriginalData] = useState([]);
    const [selectedOriginal, setSelectedOriginal] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("");

    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const fetchStockCard = useCallback(async (warehouseId = selectedWarehouse) => {
        setLoading(true);
        setError(null);
        try {
            const url = warehouseId 
                ? `/api/product/menu-stock/manual-stock?warehouseId=${warehouseId}` 
                : "/api/product/menu-stock/manual-stock";
            const response = await axios.get(url);
            const data = response.data.data || [];
            const sortedData = data.sort((a, b) => (b.effectiveStock ?? 0) - (a.effectiveStock ?? 0));

            setOriginalData(sortedData);
        } catch (err) {
            console.error("Error fetching stock menu", err);
            setError("Failed to load data. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [selectedWarehouse]);

    const fetchCategories = async () => {
        try {
            const categoryResponse = await axios.get('/api/menu/categories');
            setCategory(categoryResponse.data.data?.filter((cat) => !cat.parentCategory) || []);
        } catch (err) {
            console.error("Error fetching categories", err);
        }
    };

    const fetchWarehouses = async () => {
        try {
            const res = await axios.get('/api/warehouses?limit=100&isActive=true');
            setWarehouses(res.data?.data || []);
        } catch (err) {
            console.error("Error fetching warehouses", err);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchWarehouses();
    }, []);

    useEffect(() => {
        fetchStockCard();
    }, [fetchStockCard]);

    const categoryOptions = [
        { value: '', label: 'Semua Kategori' },
        ...category.map(c => ({ value: c.name, label: c.name }))
    ];

    // Filter reaktif menggunakan useMemo agar tidak ada bug stale closure
    const filteredData = useMemo(() => {
        let filtered = [...originalData];

        if (selectedCategory) {
            filtered = filtered.filter((item) => item.category === selectedCategory);
        }
        if (tempSearch) {
            const searchTerm = tempSearch.toLowerCase();
            filtered = filtered.filter((item) => {
                const menuItem = item.name || item.menuItemName;
                return menuItem && menuItem.toLowerCase().includes(searchTerm);
            });
        }
        return filtered;
    }, [originalData, selectedCategory, tempSearch]);

    // Reset pagination ketika filter berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, tempSearch]);

    const handleSave = (updated) => {
        setOriginalData((prev) =>
            prev.map((p) => {
                const pId = p.menuItemId || p._id;
                const updatedId = updated.menuItemId || updated._id;
                return pId === updatedId ? { ...p, ...updated } : p;
            })
        );
        setSelectedOriginal(null);
    };

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, endIndex);
    }, [currentPage, filteredData]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;

    // Show loading state
    if (loading && originalData.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

    // Show error state
    if (error && originalData.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p>{error}</p>
                    <button
                        onClick={() => fetchStockCard()}
                        className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-8">
            {/* Sub Header */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <span>Inventori</span>
                    <FaChevronRight className="text-sm text-gray-400" />
                    <span>Stok Menu</span>
                </h1>
                <div className="flex w-full sm:w-auto px-4 py-2">
                    <ExportInventory
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                    />
                </div>
            </div>

            <div className="px-6 space-y-4">
                {/* Filter Kategori */}
                <div className="w-full">
                    <CategoryTabs
                        categoryOptions={categoryOptions}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                    />
                </div>

                {/* Filter Warehouse & Search */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <FaWarehouse className="text-gray-400 text-sm" />
                        <select
                            value={selectedWarehouse}
                            onChange={(e) => {
                                setSelectedWarehouse(e.target.value);
                            }}
                            className="text-xs border rounded px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-900"
                        >
                            <option value="">Semua Gudang / Warehouse</option>
                            {warehouses.map((wh) => (
                                <option key={wh._id} value={wh._id}>
                                    {wh.name} {wh.code ? `(${wh.code})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full sm:w-72 relative">
                        <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Cari nama menu..."
                            value={tempSearch}
                            onChange={(e) => setTempSearch(e.target.value)}
                            className="text-xs border py-2 pl-9 pr-3 rounded w-full focus:outline-none focus:ring-1 focus:ring-green-900"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded bg-white shadow-sm border border-gray-100">
                    <table className="min-w-full table-fixed text-xs sm:text-sm border-collapse">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] font-semibold border-b">
                            <tr>
                                <th className="p-3 text-left w-[25%]">Produk</th>
                                <th className="p-3 text-left w-[20%]">Kategori</th>
                                <th className="p-3 text-right w-[15%]">Kalkulasi Stok (Resep)</th>
                                <th className="p-3 text-right w-[15%]">Manual Stok</th>
                                <th className="p-3 text-right w-[15%]">Stok Efektif</th>
                                <th className="p-3 text-center w-[10%]">Aksi</th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-gray-600 divide-y divide-gray-100">
                                {paginatedData.map((item) => (
                                    <tr
                                        key={item._id || item.menuItemId}
                                        className="hover:bg-gray-50/80 transition-colors"
                                    >
                                        <td className="p-3 font-medium text-gray-800 truncate">
                                            {item.name || item.menuItemName}
                                        </td>
                                        <td className="p-3 text-gray-500 truncate">{item.category}</td>
                                        <td className="p-3 text-right font-mono">
                                            {item.calculatedStock === null || item.calculatedStock === undefined ? 0 : item.calculatedStock}
                                        </td>
                                        <td className="p-3 text-right font-mono">
                                            {item.manualStock !== null && item.manualStock !== undefined ? item.manualStock : "-"}
                                        </td>
                                        <td className="p-3 text-right font-mono font-semibold text-green-900">
                                            {item.effectiveStock ?? 0}
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => setSelectedOriginal(item)}
                                                title="Edit Stok"
                                                className="px-2.5 py-1.5 text-xs bg-[#005429] text-white rounded hover:bg-green-800 transition-colors inline-flex items-center gap-1 shadow-sm"
                                            >
                                                <FaPencilAlt className="text-[10px]" />
                                                <span>Ubah</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr>
                                    <td colSpan={6} className="text-center py-16 text-gray-400">
                                        Tidak ada data stok menu ditemukan
                                    </td>
                                </tr>
                            </tbody>
                        )}
                    </table>
                </div>

                {/* Pagination Controls */}
                <Paginated
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                />
            </div>

            {selectedOriginal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-100">
                        <UpdateStockForm
                            product={selectedOriginal}
                            onSave={handleSave}
                            onCancel={() => setSelectedOriginal(null)}
                            currentUser={currentUser}
                            fetchStockCard={fetchStockCard}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CurrentStockManagement;  