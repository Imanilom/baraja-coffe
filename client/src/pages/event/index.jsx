import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSearch, FaInfoCircle, FaBoxes, FaChevronLeft, FaTicketAlt } from "react-icons/fa";
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
            <div className="px-3 py-2 flex justify-between items-center border-b">
                <div className="flex items-center space-x-2">
                    <FaTicketAlt size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Event</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button className="text-[#005429] hover:text-white bg-white hover:bg-[#005429] border border-[#005429] text-[13px] px-[15px] py-[7px] rounded">Ekspor Event</button>
                    <Link to="/admin/event/create-event" className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Tambah Event</Link>
                </div>
            </div>

            {/* Filters */}
            <div className="px-[15px] pb-[15px] mb-[60px]">
                <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-8 gap-[10px] items-end rounded bg-slate-50 shadow-slate-200 shadow-md">

                    <div className="flex flex-col col-span-2">
                        <label className="text-[13px] mb-1 text-gray-500">Tanggal</label>
                        <div className="relative text-gray-500 after:content-['▼'] after:absolute after:right-3 after:top-1/2 after:-translate-y-1/2 after:text-[10px] after:pointer-events-none">
                            <Datepicker
                                showFooter
                                showShortcuts
                                value={value}
                                onChange={setValue}
                                displayFormat="DD-MM-YYYY"
                                inputClassName="w-full text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded cursor-pointer"
                                popoverDirection="down"
                            />

                            {/* Overlay untuk menyembunyikan ikon kalender */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-white cursor-pointer"></div>
                        </div>
                    </div>

                    <div className="col-span-3"></div>

                    <div className="flex flex-col col-span-2">
                        <label className="text-[13px] mb-1 text-gray-500">Cari</label>
                        <div className="relative">
                            <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari"
                                value={tempSearch}
                                onChange={(e) => setTempSearch(e.target.value)}
                                className="text-[13px] border py-[6px] pl-[30px] pr-[25px] rounded w-full"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 items-end col-span-1">
                        <button onClick={applyFilter} className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Terapkan</button>
                        <button onClick={resetFilter} className="text-[#005429] hover:text-white hover:bg-[#005429] border border-[#005429] text-[13px] px-[15px] py-[7px] rounded">Reset</button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-slate-200 shadow-md">
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
                                {/* <th className="px-4 py-3 font-normal">Tanggal</th> */}
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {paginatedData.map((event) => (
                                    <tr key={event._id} className="text-left text-sm cursor-pointer hover:bg-slate-50">
                                        <td className="px-4 py-3">{formatDateTime(event.date)}</td>
                                        <td className="px-4 py-3">{event.name}</td>
                                        <td className="px-4 py-3">{event.category}</td>
                                        <td className="px-4 py-3">{event.organizer && capitalizeWords(event.organizer)}</td>
                                        <td className="px-4 py-3">{event.location}</td>
                                        <td className="px-4 py-3 text-right">{event.capacity}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(event.price)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr className="py-6 text-center w-full h-96">
                                    <td colSpan={10}>
                                        <div className="flex justify-center items-center">
                                            <div className="text-gray-400">
                                                <div className="flex justify-center">
                                                    <FaSearch size={100} />
                                                </div>
                                                <p className="uppercase">Data Tidak ditemukan</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        )}

                    </table>
                </div>

                {/* Pagination Controls */}
                {paginatedData.length > 0 && (
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-gray-600">
                            Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} dari {filteredData.length} data
                        </span>
                        <div className="flex justify-center space-x-2 mt-4">
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
                                    (page >= currentPage - 2 && page <= currentPage + 2)
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

                                // Tampilkan "..." jika melompati halaman
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

            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]">
                </div>
            </div>
        </div>
    );
};

export default EventManagement;
