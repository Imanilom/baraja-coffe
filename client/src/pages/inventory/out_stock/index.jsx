import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { FaChevronRight, FaInfoCircle, FaBoxes, FaChevronLeft, FaSearch } from "react-icons/fa";
import Datepicker from "react-tailwindcss-datepicker";
import Modal from "./modal";
import Header from "../../admin/header";
import MovementSideModal from "../../../components/movementSideModal";

const ITEMS_PER_PAGE = 10;

const OutStockManagement = () => {
    const [selectedMovement, setSelectedMovement] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [stockOutFromOrder, setStockFromOrder] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [dateRange, setDateRange] = useState({ startDate: new Date(), endDate: new Date() });
    const [tempSearch, setTempSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const dropdownRef = useRef(null);

    /** 🔧 Helper flatten */
    const flattenData = (orders, cats) => {
        return orders.flatMap((order) =>
            (order.items || []).map((item, idx) => {
                const categoryName =
                    cats.find((c) => c._id === item?.menuItem?.category)?.name || "-";
                return {
                    _id: `${order._id}-${idx}`,
                    createdAt: order.createdAt,
                    menuName: item?.menuItem?.name || "",
                    category: categoryName,
                    quantity: item?.quantity || 0,
                };
            })
        );
    };

    /** 📥 Fetch data awal */
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [orderRes, catRes] = await Promise.all([
                    axios.get("/api/orders"),
                    axios.get("/api/menu/categories"),
                ]);

                const orders = Array.isArray(orderRes.data)
                    ? orderRes.data
                    : orderRes.data?.data ?? [];

                const completedOrders = orders.filter((o) => o.status === "Completed");

                const cats = catRes.data.data ? catRes.data.data : catRes.data;

                setStockFromOrder(completedOrders);
                setCategories(cats);
                setFilteredData(flattenData(completedOrders, cats));
                setError(null);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load data.");
                setStockFromOrder([]);
                setFilteredData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    /** 🔍 Apply filter */
    const applyFilter = useCallback(() => {
        let filteredOrders = [...stockOutFromOrder];

        // filter tanggal
        if (dateRange?.startDate && dateRange?.endDate) {
            filteredOrders = filteredOrders.filter((order) => {
                if (!order.createdAt) return false;
                const orderDate = dayjs(order.createdAt);
                const start = dayjs(dateRange.startDate).startOf("day");
                const end = dayjs(dateRange.endDate).endOf("day");
                return orderDate.isBetween(start, end, "day", "[]");
            });
        }

        // flatten ke item
        let flattened = flattenData(filteredOrders, categories);

        // filter search
        if (tempSearch) {
            const searchTerm = tempSearch.toLowerCase();
            flattened = flattened.filter(
                (item) =>
                    item.menuName.toLowerCase().includes(searchTerm) ||
                    item.category.toLowerCase().includes(searchTerm)
            );
        }

        setFilteredData(flattened);
        setCurrentPage(1);
    }, [tempSearch]);

    // Auto-apply filter whenever dependencies change
    useEffect(() => {
        applyFilter();
    }, [applyFilter]);

    // Initial load
    useEffect(() => {
        applyFilter();
    }, []);

    /** 📄 Pagination */
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, filteredData]);

    /** ⏰ Format tanggal */
    const formatDateTime = (datetime) => {
        const date = new Date(datetime);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(
            date.getHours()
        )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

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

    // 🔄 Loading
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

    // ❌ Error
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
        <div>
            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <div className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <span>Inventori</span>
                    <FaChevronRight />
                    <span>Stok Keluar</span>
                </div>
            </div>

            {/* Filters */}
            <div className="px-6">
                <div className="flex flex-wrap gap-4 md:justify-between items-center py-3">
                    {/* Tanggal */}
                    <div className="flex flex-col col-span-2 w-2/5">
                        <Datepicker
                            showFooter
                            showShortcuts
                            value={dateRange}
                            onChange={setDateRange}
                            displayFormat="DD-MM-YYYY"
                            inputClassName="w-full text-[13px] border py-2 pr-6 pl-3 rounded cursor-pointer"
                            popoverDirection="down"
                        />
                    </div>

                    {/* Cari */}
                    <div className="flex flex-col col-span-2 w-1/5">
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
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded bg-white shadow-slate-200 shadow-md">
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
                                {paginatedData.map((row) => (
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

                {/* Side Modal */}
                <MovementSideModal
                    movement={selectedMovement}
                    onClose={() => setSelectedMovement(null)}
                    formatDateTime={formatDateTime}
                    capitalizeWords={(txt) =>
                        txt.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
                    }
                />
            </div>

            <Modal show={showModal} onClose={() => setShowModal(false)} onSubmit={() => { }} />
        </div>
    );
};

export default OutStockManagement;
