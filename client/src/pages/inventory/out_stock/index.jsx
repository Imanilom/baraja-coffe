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
    const [outStock, setOutStock] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showInput, setShowInput] = useState(false);
    const [search, setSearch] = useState("");
    const [tempSelectedOutlet, setTempSelectedOutlet] = useState("");
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

    // Fetch outStock and outlets data
    const fetchStock = async () => {
        try {
            const stockResponse = await axios.get('/api/product/stock/all');
            const stockData = stockResponse.data.data || [];

            const stockWithMovements = await Promise.all(
                stockData.map(async (item) => {
                    const movementResponse = await axios.get(`/api/product/stock/${item.productId._id}/movements`);
                    const movements = movementResponse.data.data.movements || [];

                    return {
                        ...item,
                        movements
                    };
                })
            );
            setOutStock(stockWithMovements);

            // 🔹 Default awal: type "out" & hanya hari ini
            const defaultMovements = [];
            stockWithMovements.forEach(stock => {
                (stock.movements || []).forEach(movement => {
                    const movementDate = dayjs(movement.date);
                    if (
                        movement.type === "out" &&
                        movementDate.isSame(dayjs(), 'day') // hanya tanggal hari ini
                    ) {
                        defaultMovements.push({
                            ...movement,
                            product: stock.productId?.name,
                            unit: stock.productId?.unit
                        });
                    }
                });
            });

            // Urutkan terbaru
            const sortedDefault = defaultMovements.sort(
                (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
            );
            setFilteredData(sortedDefault);

        } catch (err) {
            console.error("Error fetching stock or movements:", err);
            setOutStock([]);
            setFilteredData([]);
        }
    };


    const fetchOutlets = async () => {
        try {
            const outletsResponse = await axios.get('/api/outlet');
            const outletsData = Array.isArray(outletsResponse.data)
                ? outletsResponse.data
                : (outletsResponse.data && Array.isArray(outletsResponse.data.data))
                    ? outletsResponse.data.data
                    : [];

            setOutlets(outletsData);
        } catch (err) {
            console.error("Error fetching outlets:", err);
            setOutlets([]);
        }
    };

    // const fetchCategories = async () => {
    //     try {
    //         const categoryResponse = await axios.get('/api/storage/categories');
    //         const categoryData = Array.isArray(categoryResponse.data)
    //             ? categoryResponse.data
    //             : (categoryResponse.data && Array.isArray(categoryResponse.data.data))
    //                 ? categoryResponse.data.data
    //                 : [];

    //         setCategory(categoryData);
    //     } catch (err) {
    //         console.error("Error fetching categories:", err);
    //         setCategory([]);
    //     }
    // };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            await Promise.all([
                fetchStock(),
                fetchOutlets(),
                // fetchCategories()
            ]);
            // fetchStatus();
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

    // Get unique outlet names for the dropdown
    const uniqueOutlets = useMemo(() => {
        return outlets.map(item => item.name);
    }, [outlets]);

    const capitalizeWords = (text) => {
        return text
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

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
        const date = new Date(datetime);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
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

    // Filter outlets based on search input
    const filteredOutlets = useMemo(() => {
        return uniqueOutlets.filter(outlet =>
            outlet.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, uniqueOutlets]);

    // Apply filter function
    const applyFilter = () => {
        const allMovements = [];

        outStock.forEach(stock => {
            const movements = stock.movements || [];

            const movementsInRange = movements.filter(movement => {
                const movementDate = dayjs(movement.date);
                return (
                    movement.type === "out" && // hanya ambil stok masuk
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

    // Export current data to Excel
    const exportToExcel = () => {
        // Prepare data for export
        const dataToExport = filteredData.map(product => {
            const item = product.items?.[0] || {};
            const menuItem = item.menuItem || {};

            return {
                "Waktu": new Date(product.createdAt).toLocaleDateString('id-ID'),
                "Kasir": product.cashier?.username || "-",
                "ID Struk": product._id,
                "Produk": menuItem.name || "-",
                "Tipe Penjualan": product.orderType,
                "Total (Rp)": (item.subtotal || 0) + pb1,
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);

        // Set auto width untuk tiap kolom
        const columnWidths = Object.keys(dataToExport[0]).map(key => ({
            wch: Math.max(key.length + 2, 20)  // minimal lebar 20 kolom
        }));
        worksheet['!cols'] = columnWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Penjualan");
        XLSX.writeFile(wb, "Data_Transaksi_Penjualan.xlsx");
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
                <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                    {/* <button
                        onClick={() => setShowModal(true)}
                        className="w-full sm:w-auto bg-white text-[#005429] px-4 py-2 rounded border border-[#005429] hover:bg-[#005429] hover:text-white text-[13px]"
                    >
                        Impor Stok Keluar
                    </button> */}
                    <Link
                        to="/admin/inventory/outstock-create"
                        className="w-full sm:w-auto bg-[#005429] text-white px-4 py-2 rounded border border-white hover:text-white text-[13px]"
                    >
                        Tambah Stok Keluar
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
                <div className="overflow-x-auto rounded shadow-md shadow-slate-200 mt-4">
                    <table className="min-w-full table-fixed text-xs sm:text-sm border-collapse">
                        <thead className="text-gray-400 bg-gray-50">
                            <tr className="text-left">
                                <th className="px-4 py-3 font-normal w-[20%]">Waktu Submit</th>
                                <th className="px-4 py-3 font-normal w-[15%]">ID Stok Keluar</th>
                                <th className="px-4 py-3 font-normal w-[10%]">Produk</th>
                                <th className="px-4 py-3 font-normal w-[10%]">Unit</th>
                                <th className="px-4 py-3 font-normal text-right w-[10%]">Qty</th>
                                <th className="px-4 py-3 font-normal w-[10%]">Keterangan</th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-gray-500 divide-y">
                                {paginatedData.map((movement) => (
                                    <tr
                                        key={movement._id}
                                        className="cursor-pointer hover:bg-slate-50"
                                        onClick={() => setSelectedMovement(movement)}
                                    >
                                        <td className="px-4 py-3 truncate">{formatDateTime(movement.date)}</td>
                                        <td className="px-4 py-3 truncate">{movement._id}</td>
                                        <td className="px-4 py-3 truncate">{movement.product && capitalizeWords(movement.product)}</td>
                                        <td className="px-4 py-3 lowercase">{movement.unit}</td>
                                        <td className="px-4 py-3 text-right">{movement.quantity}</td>
                                        <td className="px-4 py-3 max-w-[150px] truncate" title={movement.notes}>
                                            {movement.notes || "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center">
                                            <FaSearch size={60} className="mb-3" />
                                            <p className="uppercase">Data Tidak Ditemukan</p>
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
