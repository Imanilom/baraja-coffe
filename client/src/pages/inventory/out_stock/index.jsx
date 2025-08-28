import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSearch, FaInfoCircle, FaBoxes, FaChevronLeft } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Modal from './modal';
import Header from "../../admin/header";
import MovementSideModal from "../../../components/movementSideModal";


const OutStockManagement = () => {
    const [selectedMovement, setSelectedMovement] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [stockOutFromOrder, setStockFromOrder] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [value, setValue] = useState({
        startDate: dayjs(),
        endDate: dayjs()
    });
    const [tempSearch, setTempSearch] = useState("");
    const [filteredData, setFilteredData] = useState([]);

    // Safety function to ensure we're always working with arrays
    const ensureArray = (data) => Array.isArray(data) ? data : [];
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const dropdownRef = useRef(null);

    const fetchCategories = async () => {
        const res = await axios.get("/api/menu/categories");
        setCategories(res.data.data ? res.data.data : res.data);
    };

    const fetchStockOutFromOrder = async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/orders");
            const productsData = Array.isArray(response.data)
                ? response.data
                : response.data?.data ?? [];

            const completedData = productsData.filter(
                (item) => item.status === "Completed"
            );

            setStockFromOrder(completedData);

            // ✅ filter hari ini saat pertama kali load
            const todayStart = dayjs().startOf("day");
            const todayEnd = dayjs().endOf("day");

            const filtered = completedData.filter((stockOut) => {
                const stockOutDate = dayjs(stockOut.createdAt);
                return stockOutDate.isBetween(todayStart, todayEnd, "day", "[]");
            });

            setFilteredData(filtered);
            setError(null);
        } catch (err) {
            console.error("Error fetching Stock Out:", err);
            setError("Failed to load Stock Out.");
            setStockFromOrder([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    };

    const capitalizeWords = (text) => {
        return text
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const formatDateTime = (datetime) => {
        const date = new Date(datetime);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    // Apply filter function
    const applyFilter = () => {
        let filtered = [...stockOutFromOrder];

        // Search filter
        if (tempSearch) {
            const searchTerm = tempSearch.toLowerCase();
            filtered = filtered.filter((stockOut) =>
                stockOut.items?.some((item) => {
                    const menuItem = item?.menuItem;
                    if (!menuItem) return false;

                    const categoryName =
                        categories.find((c) => c._id === menuItem.category)?.name || "";

                    return (
                        (menuItem.name || "").toLowerCase().includes(searchTerm) ||
                        categoryName.toLowerCase().includes(searchTerm)
                    );
                })
            );
        }

        // Date range filter
        if (value?.startDate && value?.endDate) {
            filtered = filtered.filter((stockOut) => {
                if (!stockOut.createdAt) return false;

                const stockOutDate = dayjs(stockOut.createdAt);
                const startDate = dayjs(value.startDate).startOf("day");
                const endDate = dayjs(value.endDate).endOf("day");

                return stockOutDate.isBetween(startDate, endDate, "day", "[]");
            });
        }

        setFilteredData(filtered);
        setCurrentPage(1); // reset ke halaman pertama
    };

    useEffect(() => {
        fetchStockOutFromOrder();
        fetchCategories();
    }, []);

    const flattenedData = useMemo(() => {
        return filteredData.flatMap(stockOut =>
            (stockOut.items || []).map((i, idx) => {
                const categoryName =
                    categories.find(c => c._id === i?.menuItem?.category)?.name || "-";

                return {
                    _id: `${stockOut._id}-${idx}`,
                    createdAt: stockOut.createdAt,
                    menuName: i?.menuItem?.name,
                    category: categoryName, // ✅ sudah nama kategori
                    quantity: i?.quantity,
                };
            })
        );
    }, [filteredData, categories]);

    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(flattenedData.length / ITEMS_PER_PAGE);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return flattenedData.slice(startIndex, endIndex);
    }, [currentPage, flattenedData]);

    // Reset filters
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
        <div className="">
            {/* Header */}
            <Header />

            {/* Breadcrumb */}
            <div className="px-3 py-2 flex flex-wrap gap-2 justify-between items-center border-b">
                <div className="flex flex-wrap items-center space-x-2 text-sm">
                    <FaBoxes size={18} className="text-gray-500" />
                    <p className="text-gray-500">Inventori</p>
                    <FaChevronRight className="text-gray-500" />
                    <span className="text-[#005429]">Stok Keluar</span>
                    <FaInfoCircle size={15} className="text-gray-400" />
                </div>
                <div className="flex flex-wrap gap-2 mt-2 py-4 sm:mt-0">
                    {/* <button
                        onClick={() => setShowModal(true)}
                        className="w-full sm:w-auto bg-white text-[#005429] px-4 py-2 rounded border border-[#005429] hover:bg-[#005429] hover:text-white text-[13px]"
                    >
                        Impor Stok Keluar
                    </button> */}
                    {/* <Link
                        to="/admin/inventory/outstock-create"
                        className="w-full sm:w-auto bg-[#005429] text-white px-4 py-2 rounded border border-white hover:text-white text-[13px]"
                    >
                        Tambah Stok Keluar
                    </Link> */}
                </div>
            </div>

            {/* Filters */}
            <div className="px-3 pb-4 mb-[60px]">
                <div className="my-3 py-3 px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-3 items-end rounded bg-slate-50 shadow-md shadow-slate-200">

                    {/* Tanggal */}
                    <div className="flex flex-col col-span-2">
                        <label className="text-[13px] mb-1 text-gray-500">Tanggal</label>
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

                    {/* Kosong biar rapih di desktop */}
                    <div className="hidden lg:block col-span-3"></div>

                    {/* Cari */}
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

                    {/* Tombol Filter */}
                    <div className="flex lg:justify-end space-x-2 items-end col-span-1">
                        <button
                            onClick={applyFilter}
                            className="bg-[#005429] text-white text-[13px] px-4 py-2 rounded"
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
                        {paginatedData.length > 0 ? (
                            <tbody className="text-gray-500 divide-y">
                                {paginatedData.map(row => (
                                    <tr
                                        key={row._id}
                                        className="text-left text-sm cursor-pointer hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-3 truncate">{formatDateTime(row.createdAt)}</td>
                                        <td className="px-4 py-3 truncate">{row.menuName}</td>
                                        <td className="px-4 py-3 truncate">{row.category}</td>
                                        <td className="px-4 py-3 text-right">x{row.quantity}</td>
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
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
                        <span className="text-sm text-gray-600">
                            Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–
                            {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} dari{" "}
                            {filteredData.length} data
                        </span>
                        <div className="flex justify-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                ) {
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-3 py-1 rounded border ${currentPage === page ? "bg-[#005429] text-white" : ""}`}
                                        >
                                            {page}
                                        </button>
                                    );
                                }
                                if (page === currentPage - 2 || page === currentPage + 2) {
                                    return (
                                        <span key={`dots-${page}`} className="px-2 text-gray-500">
                                            ...
                                        </span>
                                    );
                                }
                                return null;
                            })}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

            <Modal show={showModal} onClose={() => setShowModal(false)} onSubmit={handleSubmit} />
        </div>

    );
};

export default OutStockManagement;
