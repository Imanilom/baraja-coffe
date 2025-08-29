import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSearch, FaInfoCircle, FaBoxes, FaChevronLeft, FaCross } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Modal from './modal';
import Header from "../../admin/header";
import MovementSideModal from "../../../components/movementSideModal";


const InStockManagement = () => {
    const [selectedMovement, setSelectedMovement] = useState(null);
    const [inStock, setInStock] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [value, setValue] = useState({
        startDate: dayjs(),
        endDate: dayjs()
    });
    const [hasFiltered, setHasFiltered] = useState(false);
    const [showInput, setShowInput] = useState(false);
    const [search, setSearch] = useState("");
    const [tempSelectedOutlet, setTempSelectedOutlet] = useState("");
    const [tempSearch, setTempSearch] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    const [showModal, setShowModal] = useState(false);

    // Safety function to ensure we're always working with arrays
    const ensureArray = (data) => Array.isArray(data) ? data : [];
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const dropdownRef = useRef(null);

    // Calculate the total subtotal first
    const totalSubtotal = selectedTrx && selectedTrx.items ? selectedTrx.items.reduce((acc, item) => acc + item.subtotal, 0) : 0;

    // Calculate PB1 as 10% of the total subtotal
    const pb1 = 10000;

    // Calculate the final total
    const finalTotal = totalSubtotal + pb1;

    const fetchMenuCapacity = async () => {
        try {
            const [recipesRes, stockRes] = await Promise.all([
                axios.get("/api/product/recipes"),
                axios.get("/api/product/stock/all")
            ]);

            const recipes = recipesRes.data.data || recipesRes.data;
            const stock = stockRes.data.data || stockRes.data;

            const results = [];

            for (const menu of recipes) {
                let ingredients = menu.baseIngredients.filter(ing => ing.isDefault);

                // Loop per ingredient
                const movementsPerIngredient = ingredients.map(ing => {
                    const s = stock.find(st => st.productId._id === ing.productId);
                    if (!s) return [];

                    return s.movements
                        .filter(m => m.type === "adjustment")
                        .map(m => ({
                            date: dayjs(m.date).format("YYYY-MM-DD"),
                            capacityIn: Math.floor(m.quantity / ing.quantity)
                        }));
                }).flat();

                const uniqueDates = [...new Set(movementsPerIngredient.map(m => m.date))];

                const menuMovements = uniqueDates.map(date => {
                    const capacities = movementsPerIngredient
                        .filter(m => m.date === date)
                        .map(m => m.capacityIn);

                    const menuCapacity = capacities.length ? Math.min(...capacities) : 0;
                    return {
                        menu: menu.menuItemId?.name,
                        date,
                        capacityIn: menuCapacity
                    };
                }).filter(m => m.capacityIn > 0);

                results.push(...menuMovements);
            }

            // **Sort results by date ascending**
            results.sort((a, b) => new Date(a.date) - new Date(b.date));

            return results;
        } catch (err) {
            console.error(err);
            return [];
        }
    };

    const applyFilter = async () => {
        setLoading(true);
        setError(null);

        try {
            const [menuRes, capacityRes] = await Promise.all([
                axios.get("/api/menu/menu-items"),
                fetchMenuCapacity(value) // fetch kapasitas menu per tanggal
            ]);

            const capacities = capacityRes || [];

            // Gabungkan menu hanya yang memiliki capacityIn > 0
            const merged = [];

            menuRes.data.data.forEach(menu => {
                // Ambil semua capacities untuk menu ini
                const menuCapacities = capacities.filter(c => c.menu === menu.name);

                if (menuCapacities.length > 0) {
                    // Jika ada filter tanggal, filter dulu
                    const filteredCapacities = menuCapacities.filter(c => {
                        if (!value?.startDate || !value?.endDate) return true;
                        return dayjs(c.date).isBetween(
                            dayjs(value.startDate).startOf("day"),
                            dayjs(value.endDate).endOf("day"),
                            null,
                            '[]'
                        );
                    });

                    filteredCapacities.forEach(c => {
                        merged.push({
                            ...menu,
                            capacityIn: c.capacityIn,
                            date: c.date
                        });
                    });
                }
            });

            // **Urutkan berdasarkan tanggal ascending**
            merged.sort((a, b) => new Date(a.date) - new Date(b.date));

            setFilteredData(merged);
        } catch (err) {
            console.error("Error applying filter:", err);
            setError("Failed to load data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenuCapacity();
    }, [])

    // Handle click outside dropdown to close
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowInput(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatDateTime = (datetime) => {
        const date = new Date(datetime);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    const capitalizeWords = (text) => {
        return text
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, endIndex);
    }, [currentPage, filteredData]);

    useEffect(() => {
        applyFilter();
    }, []);

    const resetFilter = () => {
        setTempSearch("");
        setValue({
            startDate: dayjs(),
            endDate: dayjs(),
        });
        setCurrentPage(1);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert('File berhasil diimpor!');
        setShowModal(false);
    };

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
        <div className="w-full">
            {/* Header */}
            <Header />

            {/* Breadcrumb */}
            <div className="px-3 py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2 text-sm">
                    <FaBoxes size={18} className="text-gray-500" />
                    <p className="text-gray-500">Inventori</p>
                    <FaChevronRight className="text-gray-500" />
                    <span className="text-[#005429]">Stok Masuk</span>
                    <FaInfoCircle size={15} className="text-gray-400" />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full py-4 sm:w-auto">
                    {/* <Link
                        to="/admin/inventory/instock-create"
                        className="w-full sm:w-auto bg-[#005429] text-white px-4 py-2 rounded border border-white hover:text-white text-[13px]"
                    >
                        Tambah Stok Masuk
                    </Link> */}
                </div>
            </div>

            {/* Filters */}
            <div className="px-3 pb-4 mb-[60px]">
                <div className="my-3 py-3 px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-3 items-end rounded bg-slate-50 shadow-md shadow-slate-200">
                    {/* Date */}
                    <div className="flex flex-col col-span-2">
                        <label className="text-[13px] mb-1 text-gray-500">Tanggal</label>
                        <div className="relative text-gray-500">
                            <Datepicker
                                showFooter
                                showShortcuts
                                value={value}
                                onChange={setValue}
                                displayFormat="DD-MM-YYYY"
                                inputClassName="w-full text-[13px] border py-2 pr-6 pl-3 rounded cursor-pointer"
                                popoverDirection="down"
                            />
                        </div>
                    </div>

                    {/* Spacer */}
                    <div className="hidden lg:block col-span-3"></div>

                    {/* Search */}
                    <div className="flex flex-col col-span-2">
                        <label className="text-[13px] mb-1 text-gray-500">Cari</label>
                        <div className="relative">
                            <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari"
                                value={tempSearch}
                                onChange={(e) => setTempSearch(e.target.value)}
                                className="text-[13px] border py-2 pl-8 pr-4 rounded w-full"
                            />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex lg:justify-end space-x-2 items-end col-span-1">
                        <button
                            onClick={applyFilter}
                            className="bg-[#005429] text-white text-[13px] px-4 py-2 border border-[#005428] rounded"
                        >
                            Terapkan
                        </button>
                        <button
                            onClick={resetFilter}
                            className="text-[#005429] hover:text-white hover:bg-[#005429] border border-[#005429] text-[13px] px-4 py-2 rounded"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-slate-200 shadow-md mt-4">
                    <table className="min-w-full table-fixed text-xs sm:text-sm border-collapse">
                        <thead className="text-gray-400">
                            <tr className="text-left">
                                <th className="px-4 py-3 font-normal w-[20%]">Waktu Submit</th>
                                <th className="px-4 py-3 font-normal w-[15%]">Menu</th>
                                <th className="px-4 py-3 font-normal w-[15%]">Kategori</th>
                                <th className="px-4 py-3 font-normal text-right w-[10%]">Qty</th>
                            </tr>
                        </thead>
                        {console.log(paginatedData)}
                        {paginatedData.length > 0 ? (
                            <tbody className="text-gray-500 divide-y">
                                {paginatedData.map((movement) => (
                                    <tr
                                        key={movement._id}
                                        className="text-left text-sm cursor-pointer hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-3 truncate">{formatDateTime(movement.date)}</td>
                                        <td className="px-4 py-3 truncate">{movement.name}</td>
                                        <td className="px-4 py-3 truncate">{movement.category?.name}</td>
                                        <td className="px-4 py-3 text-right">x{movement.capacityIn}</td>
                                    </tr>
                                ))}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr>
                                    <td colSpan={10} className="py-10 text-center">
                                        <div className="flex justify-center items-center flex-col space-y-2 text-gray-400">
                                            <FaSearch size={60} />
                                            <p className="uppercase">Data Tidak ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        )}
                    </table>
                </div>

                {/* Pagination */}
                {paginatedData.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-2 sm:space-y-0">
                        <span className="text-sm text-gray-600 text-center sm:text-left">
                            Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                            {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} dari{" "}
                            {filteredData.length} data
                        </span>
                        <div className="flex flex-wrap justify-center sm:justify-end space-x-1">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 border rounded disabled:opacity-50"
                            >
                                <FaChevronLeft />
                            </button>
                            {[...Array(totalPages)].map((_, index) => {
                                const page = index + 1;
                                if (
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 2 && page <= currentPage + 2)
                                ) {
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-3 py-1 rounded border ${currentPage === page ? "bg-[#005429] text-white" : ""
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                }
                                if (
                                    (page === currentPage - 3 && page > 1) ||
                                    (page === currentPage + 3 && page < totalPages)
                                ) {
                                    return (
                                        <span key={`dots-${page}`} className="px-2 text-gray-500">
                                            ...
                                        </span>
                                    );
                                }
                                return null;
                            })}
                            <button
                                onClick={() =>
                                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                                }
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 border rounded disabled:opacity-50"
                            >
                                <FaChevronRight />
                            </button>
                        </div>
                    </div>
                )}

                {/* pakai component side modal */}
                <MovementSideModal
                    movement={selectedMovement}
                    onClose={() => setSelectedMovement(null)}
                    formatDateTime={formatDateTime}
                    capitalizeWords={capitalizeWords}
                />
            </div>

            {/* Footer */}
            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]" />
            </div>

            {/* Modal */}
            <Modal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleSubmit}
            />


        </div>

    );
};

export default InStockManagement;
