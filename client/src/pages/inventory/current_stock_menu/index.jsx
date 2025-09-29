import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { FaBox, FaTag, FaBell, FaUser, FaShoppingBag, FaLayerGroup, FaSquare, FaInfo, FaPencilAlt, FaThLarge, FaDollarSign, FaTrash, FaSearch, FaChevronRight, FaInfoCircle, FaBoxes, FaChevronLeft } from 'react-icons/fa';
import axios from "axios";
import dayjs from "dayjs";
import Select from "react-select";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Datepicker from "react-tailwindcss-datepicker";
import Header from "../../admin/header";
import ExportInventory from "../exportInventory";
import UpdateStockForm from "./update";
import { useSelector } from "react-redux";

const CurrentStockManagement = () => {
    const { currentUser } = useSelector((state) => state.user);
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: '#d1d5db', // Tailwind border-gray-300
            minHeight: '34px',
            fontSize: '13px',
            color: '#6b7280', // text-gray-500
            boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none', // blue-500 on focus
            '&:hover': {
                borderColor: '#9ca3af', // Tailwind border-gray-400
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#6b7280', // text-gray-500
        }),
        input: (provided) => ({
            ...provided,
            color: '#6b7280', // text-gray-500 for typed text
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9ca3af', // text-gray-400
            fontSize: '13px',
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '13px',
            color: '#374151', // gray-700
            backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white', // blue-50
            cursor: 'pointer',
        }),
    };
    const location = useLocation();
    const navigate = useNavigate(); // Use the new hook
    const [tempSearch, setTempSearch] = useState("");
    const [error, setError] = useState(null);
    const [value, setValue] = useState({
        startDate: dayjs(),
        endDate: dayjs()
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [originalData, setOriginalData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [selectedOriginal, setSelectedOriginal] = useState(null);


    const [loading, setLoading] = useState(true);

    const queryParams = new URLSearchParams(location.search);
    const ensureArray = (data) => Array.isArray(data) ? data : [];
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const dropdownRef = useRef(null);

    const fetchStockCard = async () => {
        setLoading(true);
        setError(null);
        try {
            // const responseManual = await axios.get("/api/product/menu-stock/manual-stock");
            // const dataManual = response.data.data ? response.data.data : response;
            // const response = await axios.get("/api/product/menu-stock");
            // const data = response.data.data ? response.data.data : response;
            // const sortedData = [...data].sort((a, b) =>
            //     a.name.localeCompare(b.name)
            // );
            // // setOriginalData(data);   // simpan data asli
            // // setFilteredData(data);   // default filter sama dengan asli
            // setOriginalData(sortedData);   // simpan data asli
            // setFilteredData(sortedData);   // default filter sama dengan asli
            const responseManual = await axios.get("/api/product/menu-stock/manual-stock");
            const dataManual = responseManual.data.data ?? responseManual; // hasil manual stock

            const response = await axios.get("/api/product/menu-stock");
            const data = response.data.data ?? response; // hasil menuItem

            // gabungkan manualStock ke data utama
            const mergedData = data.map((item) => {
                const manual = dataManual.find((m) => m.menuItemId === item._id);
                return {
                    ...item,
                    manualStock: manual ? manual.manualStock : null, // kalau ada manual stock, pakai itu
                    adjustmentNote: manual?.adjustmentNote || null,
                    adjustedBy: manual?.adjustedBy || null,
                };
            });

            // urutkan hasil merge
            const sortedData = [...mergedData].sort((a, b) =>
                a.name.localeCompare(b.name)
            );

            setOriginalData(sortedData);
            setFilteredData(sortedData);

        } catch (err) {
            console.error("Error fetching stock menu", err);
            setError("Failed to load data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = useCallback(() => {
        try {
            let filtered = [...originalData]; // selalu mulai dari data asli
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
    }, [tempSearch]);

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

    const renderPageNumbers = () => {
        let pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`px-3 py-1 border border-green-900 rounded ${currentPage === i
                        ? "bg-green-900 text-white border-green-900"
                        : "text-green-900 hover:bg-green-900 hover:text-white"
                        }`}
                >
                    {i}
                </button>
            );
        }
        return pages;
    };

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
                <div className="flex flex-wrap gap-4 md:justify-between items-center py-3">
                    {/* Search */}
                    <div className="md:flex md:flex-col md:col-span-6 hidden"></div>
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
                                        <td className="p-3 text-right truncate">{item.availableStock}</td>
                                        <td className="p-3 text-right truncate">{item.manualStock ? item.manualStock : 0}</td>
                                        <td className="p-3 flex justify-end">
                                            {/* <Link to="" className="text-gray-500 hover:text-green-900">
                                                <FaPencilAlt />
                                            </Link> */}
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
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4 text-sm text-white">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-2 px-3 py-1 border rounded bg-green-900 disabled:opacity-50"
                        >
                            <FaChevronLeft /> Sebelumnya
                        </button>

                        <div className="flex gap-2">{renderPageNumbers()}</div>

                        <button
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-2 px-3 py-1 border rounded bg-green-900 disabled:opacity-50"
                        >
                            Selanjutnya <FaChevronRight />
                        </button>
                    </div>
                )}
            </div>
            {selectedOriginal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <UpdateStockForm
                            product={selectedOriginal}
                            onSave={handleSave}
                            onCancel={() => setSelectedOriginal(null)}
                            currentUser={currentUser}
                        />
                    </div>
                </div>
            )}
        </div>

    );
};

export default CurrentStockManagement;  