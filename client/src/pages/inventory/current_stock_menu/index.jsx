import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { FaSearch, FaChevronRight, FaPencilAlt } from 'react-icons/fa';
import axios from "axios";
import ExportInventory from "../exportInventory";
import UpdateStockForm from "./update";
import { useSelector } from "react-redux";
import CategoryTabs from "../../menu/filters/categorytabs";
import Paginated from "../../../components/paginated";

const CurrentStockManagement = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [tempSearch, setTempSearch] = useState("");
    const [error, setError] = useState(null);
    const [category, setCategory] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [originalData, setOriginalData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [selectedOriginal, setSelectedOriginal] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("");

    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const fetchStockCard = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get("/api/product/menu-stock/manual-stock");
            const data = response.data.data || [];
            const sortedData = data.sort((a, b) => b.effectiveStock - a.effectiveStock);

            setOriginalData(sortedData);
            setFilteredData(sortedData);

        } catch (err) {
            console.error("Error fetching stock menu", err);
            setError("Failed to load data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const fetchhOutlet = async () => {
        const categoryResponse = await axios.get('/api/menu/categories');
        setCategory(categoryResponse.data.data.filter((cat) => !cat.parentCategory));
    }

    useEffect(() => {
        fetchhOutlet();
    }, []);

    const categoryOptions = [
        { value: '', label: 'Semua Kategori' },
        ...category.map(category => ({ value: category.name, label: category.name }))
    ];

    const applyFilter = useCallback(() => {
        try {
            let filtered = [...originalData]; // selalu mulai dari data asli

            if (selectedCategory) {
                filtered = filtered.filter((item) => {
                    const matchCategory = selectedCategory === '' || item.category === selectedCategory;
                    return matchCategory;
                })
            }
            if (tempSearch) {
                const searchTerm = tempSearch.toLowerCase();
                filtered = filtered.filter((item) => {
                    const menuItem = item.name;
                    return menuItem && menuItem.toLowerCase().includes(searchTerm);
                });
            }
            setFilteredData(filtered);
            setCurrentPage(1); // reset ke page pertama
        } catch (err) {
            console.error("Error applying filter:", err);
            setError("Failed to load data. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [tempSearch, selectedCategory]);

    // Auto-apply filter whenever dependencies change
    useEffect(() => {
        applyFilter();
    }, [applyFilter]);

    // Initial load
    useEffect(() => {
        applyFilter();
    }, []);

    // Gunakan useEffect untuk jalankan saat component mount atau value berubah
    useEffect(() => {
        fetchStockCard();
    }, []);

    const handleSave = (updated) => {
        setOriginalData((prev) =>
            prev.map((p) => (p._id === updated._id ? updated : p))
        );
        setSelectedOriginal(null);
        console.log("✅ Data tersimpan:", updated);
    };

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, endIndex);
    }, [currentPage, filteredData]);

    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    // Show loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="">

            {/* Sub Header */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <span>Inventori</span>
                    <FaChevronRight />
                    <span>Stok Masuk</span>
                </h1>
                <div className="flex w-full sm:w-auto px-4 py-2">
                    <ExportInventory
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                    />
                    {/* <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full sm:w-auto bg-white text-[#005429] px-4 py-2 rounded border border-[#005429] hover:text-white hover:bg-[#005429] text-[13px]"
                    >
                        Ekspor
                    </button> */}
                </div>
            </div>

            <div className="px-6">
                {/* Filter */}
                {/* Search */}
                <div className="flex flex-col col-span-5 w-4/5">
                    <CategoryTabs
                        categoryOptions={categoryOptions}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                    />
                </div>
                <div className="flex gap-4 md:justify-end items-center py-3">
                    <div className="flex flex-col col-span-5 w-1/5">
                        <div className="relative">
                            <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari"
                                value={tempSearch}
                                onChange={(e) => setTempSearch(e.target.value)}
                                className="text-[13px] border py-2 pl-[30px] pr-[25px] rounded w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Info Legend */}
                {/* <div className="w-full mt-4 py-[15px] shadow-md">
                    <div className="flex flex-col sm:flex-row justify-between px-[15px] space-y-2 sm:space-y-0">
                        <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm text-gray-500 space-y-2 sm:space-y-0">
                            <label className="flex space-x-2 items-center">
                                <div className="w-5 h-5 bg-red-500/30 rounded"></div>
                                <p>Stok Sudah Mencapai Batas</p>
                            </label>
                            <label className="flex space-x-2 items-center">
                                <div className="w-5 h-5 bg-yellow-500/30 rounded"></div>
                                <p>Stok Hampir Habis</p>
                            </label>
                        </div>
                    </div>
                </div> */}

                {/* Table */}
                <div className="overflow-x-auto rounded bg-white shadow-md shadow-slate-200">
                    <table className="min-w-full table-fixed text-xs sm:text-sm border-collapse">
                        <thead className="text-gray-400">
                            <tr>
                                <th className="p-3 font-medium text-left w-[20%]">Produk</th>
                                <th className="p-3 font-medium text-left w-[20%]">Kategori</th>
                                <th className="p-3 font-medium text-right w-[10%]">Kalkulasi Stok</th>
                                <th className="p-3 font-medium text-right w-[10%]">Manual Stok</th>
                                <th className="p-3 font-medium text-right w-[10%]">Stok</th>
                                <th className="p-3 font-medium text-right w-[10%]"></th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-gray-500 divide-y">
                                {paginatedData.map((item) => (
                                    <tr
                                        key={item._id}
                                        className={`hover:bg-gray-100 `}
                                    >
                                        <td className="p-3 truncate">{item.name}</td>
                                        <td className="p-3 truncate">{item.category}</td>
                                        <td className="p-3 text-right truncate">{item.calculatedStock === null ? 0 : item.calculatedStock}</td>
                                        <td className="p-3 text-right truncate">{item.manualStock ? item.manualStock : 0}</td>
                                        <td className="p-3 text-right truncate">{item.effectiveStock ? item.effectiveStock : 0}</td>
                                        <td className="p-3 flex justify-end">
                                            <button
                                                onClick={() => setSelectedOriginal(item)}
                                                className="px-3 py-1 text-sm bg-green-900 text-white rounded hover:bg-green-700"
                                            >
                                                <FaPencilAlt />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr>
                                    <td colSpan={7} className="text-center py-16 text-gray-400">
                                        Tidak ada data ditemukan
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
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