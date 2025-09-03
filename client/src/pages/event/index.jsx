import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSearch, FaInfoCircle, FaBoxes, FaChevronLeft, FaTicketAlt, FaTrashAlt, FaPencilAlt } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Header from "../admin/header";


const EventManagement = () => {
    const [loading, setLoading] = useState(true);
    const [isShow, setIsShow] = useState(true);
    const [error, setError] = useState(null);
    const [event, setEvent] = useState([]);
    const [value, setValue] = useState({
        startDate: dayjs(),
        endDate: dayjs()
    });
    const [filteredData, setFilteredData] = useState([]);
    const [tempSearch, setTempSearch] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const dropdownRef = useRef(null);

    // Fetch event and outlets data
    const fetchEvent = async () => {
        try {
            const eventResponse = await axios.get('/api/event');
            const eventData = eventResponse.data.data || [];

            setEvent(eventData);
            setFilteredData(eventData);
        } catch (err) {
            console.error("Error fetching stock or movements:", err);
            setEvent([]);
            setFilteredData([]);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            await Promise.all([
                fetchEvent(),
            ]);
        } catch (err) {
            console.error("General error:", err);
            setError("Failed to load data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDateTime = (datetime) => {
        const date = new Date(datetime); // baca UTC
        const pad = (n) => n.toString().padStart(2, "0");

        return `${pad(date.getUTCDate())}-${pad(date.getUTCMonth() + 1)}-${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
    };


    const formatDate = (dat) => {
        const date = new Date(dat);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
    };

    const formatTime = (time) => {
        const date = new Date(time);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    const capitalizeWords = (text) => {
        return text
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    // Apply filter function
    const applyFilter = () => {
        const allMovements = [];

        event.forEach(stock => {
            const movements = stock.movements || [];

            const movementsInRange = movements.filter(movement => {
                const movementDate = dayjs(movement.date);
                return (
                    movement.type === "in" && // hanya ambil stok masuk
                    movementDate.isAfter(dayjs(value.startDate).startOf('day').subtract(1, 'second')) &&
                    movementDate.isBefore(dayjs(value.endDate).endOf('day').add(1, 'second'))
                );
            });

            movementsInRange.forEach(movement => {
                allMovements.push({
                    ...movement,
                    product: stock.productId?.name,
                    unit: stock.productId?.unit
                });
            });
        });

        // Filter berdasarkan pencarian jika ada
        const searched = tempSearch
            ? allMovements.filter(m =>
                m._id.toLowerCase().includes(tempSearch.toLowerCase()) ||
                m.product?.toLowerCase().includes(tempSearch.toLowerCase())
            )
            : allMovements;

        // Urutkan berdasarkan tanggal terbaru
        const sorted = searched.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());

        setFilteredData(sorted); // ← bikin state baru khusus movement hasil filter
        setCurrentPage(1);
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
            <Header />

            {/* Breadcrumb */}
            <div className="px-3 py-2 flex justify-between items-center border-b gap-2">
                <div className="flex items-center space-x-2">
                    <FaTicketAlt size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Event</p>
                </div>
                <div className="flex space-x-2">
                    <button className="text-[#005429] hover:text-white bg-white hover:bg-[#005429] border border-[#005429] text-[13px] px-[15px] py-[7px] rounded">
                        Ekspor Event
                    </button>
                    <Link
                        to="/admin/event/create-event"
                        className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                    >
                        Tambah Event
                    </Link>
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
                            className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                        >
                            Terapkan
                        </button>
                        <button
                            onClick={resetFilter}
                            className="text-[#005429] hover:text-white hover:bg-[#005429] border border-[#005429] text-[13px] px-[15px] py-[7px] rounded"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Table Responsive */}
                <div className="overflow-x-auto rounded shadow-slate-200 shadow-md hidden md:block">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal">Waktu</th>
                                <th className="px-4 py-3 font-normal">Event</th>
                                <th className="px-4 py-3 font-normal">Kategori</th>
                                <th className="px-4 py-3 font-normal">Organisasi</th>
                                <th className="px-4 py-3 font-normal">Lokasi</th>
                                <th className="px-4 py-3 font-normal text-right">Kapasitas</th>
                                <th className="px-4 py-3 font-normal text-right">Harga</th>
                                <th className="px-4 py-3 font-normal"></th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-600">
                            {paginatedData.map((event) => (
                                <tr
                                    key={event._id}
                                    className="hover:bg-slate-50 transition cursor-pointer"
                                >
                                    <td className="px-4 py-3 truncate">{formatDateTime(event.date)}</td>
                                    <td className="px-4 py-3 truncate">{event.name}</td>
                                    <td className="px-4 py-3 truncate">{event.category}</td>
                                    <td className="px-4 py-3 truncate">{event.organizer}</td>
                                    <td className="px-4 py-3 truncate">{event.location}</td>
                                    <td className="px-4 py-3 text-right">{event.capacity}</td>
                                    <td className="px-4 py-3 text-right">{formatCurrency(event.price)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-center space-x-2">
                                            <Link
                                                to={`/admin/event/edit-event/${event._id}`}
                                                className="flex items-center px-3 py-1 text-xs text-white bg-blue-500 hover:bg-blue-600 rounded-md shadow-sm transition"
                                            >
                                                <FaPencilAlt className="mr-1" /> Edit
                                            </Link>
                                            <button className="flex items-center px-3 py-1 text-xs text-white bg-red-500 hover:bg-red-600 rounded-md shadow-sm transition">
                                                <FaTrashAlt className="mr-1" /> Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="space-y-3 md:hidden">
                    {paginatedData.map((event) => (
                        <div
                            key={event._id}
                            className="bg-white p-4 rounded shadow-sm border"
                        >
                            <p className="text-sm font-medium text-gray-800">{event.name}</p>
                            <p className="text-xs text-gray-500">{formatDateTime(event.date)}</p>
                            <p className="text-xs text-gray-500">{event.location}</p>

                            <div className="flex justify-between items-center mt-3">
                                <span className="text-sm font-semibold">{formatCurrency(event.price)}</span>
                                <div className="flex space-x-2">
                                    <Link
                                        to={`/admin/event/edit-event/${event._id}`}
                                        className="px-3 py-1 text-xs text-white bg-blue-500 hover:bg-blue-600 rounded"
                                    >
                                        Edit
                                    </Link>
                                    <button className="px-3 py-1 text-xs text-white bg-red-500 hover:bg-red-600 rounded">
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {paginatedData.length > 0 && (
                    <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-3">
                        <span className="text-sm text-gray-600">
                            Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–
                            {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} dari{" "}
                            {filteredData.length} data
                        </span>
                        <div className="flex justify-center space-x-2">
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
                                            className={`px-3 py-1 rounded border ${currentPage === page
                                                ? "bg-[#005429] text-white"
                                                : ""
                                                }`}
                                        >
                                            {page}
                                        </button>
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
            </div>

            {/* Footer bar */}
            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]"></div>
            </div>
        </div>

    );
};

export default EventManagement;
