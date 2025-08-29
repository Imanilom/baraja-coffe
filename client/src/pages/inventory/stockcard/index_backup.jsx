import React, { useEffect, useState, useRef, useMemo } from "react";
import { FaBox, FaTag, FaBell, FaUser, FaShoppingBag, FaLayerGroup, FaSquare, FaInfo, FaPencilAlt, FaThLarge, FaDollarSign, FaTrash, FaSearch, FaChevronRight, FaInfoCircle, FaBoxes, FaChevronLeft } from 'react-icons/fa';
import axios from "axios";
import dayjs from "dayjs";
import BubbleAlert from './bubblralert'; // sesuaikan path jika perlu
import Select from "react-select";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Datepicker from "react-tailwindcss-datepicker";
import Header from "../../admin/header";
import ExportInventory from "../exportInventory";

const StockCardManagement = () => {
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
    const [stock, setStock] = useState([]);
    const [category, setCategory] = useState([]);
    const [status, setStatus] = useState([]);
    const [tempSelectedCategory, setTempSelectedCategory] = useState("");
    const [tempSelectedStatus, setTempSelectedStatus] = useState("");
    const [tempSearch, setTempSearch] = useState("");
    const [error, setError] = useState(null);

    const [tempSelectedOutlet, setTempSelectedOutlet] = useState("");
    const [outlets, setOutlets] = useState([]);
    const [search, setSearch] = useState("");
    const [value, setValue] = useState({
        startDate: dayjs(),
        endDate: dayjs()
    });
    const [hasFiltered, setHasFiltered] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);

    const queryParams = new URLSearchParams(location.search);
    const ensureArray = (data) => Array.isArray(data) ? data : [];
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const selectedMonth = 7; // Agustus
    const selectedYear = 2025;

    const dropdownRef = useRef(null);

    const fetchMenu = async () => {
        try {
            // const stockResponse = await axios.get('/api/product/stock/all');
            const productResponse = await axios.get('/api/menu/menu-items');
            // const stockData = stockResponse.data.data || [];
            const productData = productResponse.data.data || [];

            // const stockWithMovements = await Promise.all(
            //     stockData.map(async (item) => {
            //         const movementResponse = await axios.get(`/api/product/stock/${item.productId._id}/movements`);
            //         const todayMovements = (movementResponse.data.data.movements || []).filter(movement =>
            //             dayjs(movement.date).isSame(dayjs(), 'day') // hanya hari ini
            //         );

            //         return {
            //             ...item,
            //             movements: todayMovements
            //         };
            //     })
            // );

            setStock(productData);
            setFilteredData(productData);
        } catch (err) {
            console.error("Error fetching stock or movements:", err);
            setStock([]);
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

    const fetchCategories = async () => {
        try {
            const categoryResponse = await axios.get('/api/storage/categories');
            const categoryData = Array.isArray(categoryResponse.data)
                ? categoryResponse.data
                : (categoryResponse.data && Array.isArray(categoryResponse.data.data))
                    ? categoryResponse.data.data
                    : [];

            setCategory(categoryData);
        } catch (err) {
            console.error("Error fetching categories:", err);
            setCategory([]);
        }
    };

    const fetchStatus = () => {
        setStatus([
            { _id: "ya", name: "Ya" },
            { _id: "tidak", name: "Tidak" }
        ]);
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            await Promise.all([
                fetchMenu(),
                fetchOutlets(),
                fetchCategories()
            ]);
            fetchStatus();
        } catch (err) {
            console.error("General error:", err);
            setError("Failed to load data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchData();
        applyFilter(); // hanya untuk load awal
    }, []);

    // Get unique outlet names for the dropdown
    const uniqueOutlets = useMemo(() => {
        return outlets.map(item => item.name);
    }, [outlets]);

    // Get unique outlet names for the dropdown
    const uniqueCategory = useMemo(() => {
        return stock.map(item => item.productId);
    }, [stock]);

    // Get unique Status names for the dropdown
    const uniqueStatus = useMemo(() => {
        return status.map(item => item.name);
    }, [status]);

    // const applyFilter = () => {
    //     const filtered = stock.map(item => {
    //         const movements = item.movements || [];

    //         // Filter by date jika startDate dan endDate tersedia
    //         const rangeMovements = (value.startDate && value.endDate)
    //             ? movements.filter(m => {
    //                 const date = dayjs(m.date || m.createdAt);
    //                 return date.isSameOrAfter(dayjs(value.startDate), 'day') &&
    //                     date.isSameOrBefore(dayjs(value.endDate), 'day');
    //             })
    //             : movements;

    //         // Movement sebelum tanggal mulai
    //         const previousMovements = (value.startDate)
    //             ? movements.filter(m => {
    //                 const date = dayjs(m.date || m.createdAt);
    //                 return date.isBefore(dayjs(value.startDate), 'day');
    //             })
    //             : [];

    //         const stockInBefore = previousMovements.filter(m => m.type === "in").reduce((acc, m) => acc + m.quantity, 0);
    //         const stockOutBefore = previousMovements.filter(m => m.type === "out").reduce((acc, m) => acc + m.quantity, 0);
    //         const adjustmentBefore = previousMovements.filter(m => m.type === "adjustment").reduce((acc, m) => acc + m.quantity, 0);

    //         const firstStock = stockInBefore - stockOutBefore;
    //         // const firstStock = stockIn - stockOut - adjustmentBefore;

    //         const stockIn = rangeMovements.filter(m => m.type === "in").reduce((acc, m) => acc + m.quantity, 0);
    //         const stockOut = rangeMovements.filter(m => m.type === "out").reduce((acc, m) => acc + m.quantity, 0);
    //         const stockAdjustment = rangeMovements.filter(m => m.type === "adjustment").reduce((acc, m) => acc + m.quantity, 0);

    //         const finalStock = firstStock + stockIn - stockOut;

    //         return {
    //             ...item,
    //             firstStock,
    //             stockIn,
    //             stockOut,
    //             stockAdjustment,
    //             finalStock
    //         };
    //     });

    //     // Filter by search jika searchTerm tidak kosong
    //     const finalFiltered = tempSearch
    //         ? filtered.filter(item =>
    //             item.productId?.name.toLowerCase().includes(tempSearch.toLowerCase())
    //         )
    //         : filtered;

    //     setFilteredData(finalFiltered);
    // };


    // useEffect(() => {
    //     if (stock.length > 0 && !hasFiltered) {
    //         applyFilter();
    //         setHasFiltered(true);
    //     }
    // }, [stock, hasFiltered]);

    const applyFilter = () => {
        // Selalu mulai dari seluruh produk
        const updatedData = stock.map(item => {
            // Cek apakah item ini masuk dalam range tanggal
            const dateMatch = !value.startDate || !value.endDate
                ? true
                : (() => {
                    const itemDate = dayjs(item.date);
                    return itemDate.isAfter(dayjs(value.startDate).startOf('day').subtract(1, 'second')) &&
                        itemDate.isBefore(dayjs(value.endDate).endOf('day').add(1, 'second'));
                })();

            // Cek pencarian
            const searchMatch = !tempSearch ||
                item.name?.toLowerCase().includes(tempSearch.toLowerCase()) ||
                item.sku?.toLowerCase().includes(tempSearch.toLowerCase());

            // Kalau tidak match filter, ubah stok jadi 0 tapi name & category tetap ada
            if (!dateMatch || !searchMatch) {
                return {
                    ...item,
                    firstStock: 0,
                    stockIn: 0,
                    stockOut: 0,
                    stockAdjustment: 0,
                    finalStock: 0
                };
            }

            return item; // kalau match, biarkan apa adanya
        });

        // Urutkan dari terbaru
        const sorted = updatedData.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());

        setFilteredData(sorted);
        setCurrentPage(1);
    };

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, endIndex);
    }, [currentPage, filteredData]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    // Filter outlets based on search input
    const filteredOutlets = useMemo(() => {
        return uniqueOutlets.filter(outlet =>
            outlet.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, uniqueOutlets]);

    // Filter outlets based on search input
    // const filteredCategory = useMemo(() => {
    //     return uniqueCategory.filter(stock =>
    //         stock.toLowerCase().includes(search.toLowerCase())
    //     );
    // }, [search, uniqueCategory]);

    // Filter status based on search input
    const filteredStatus = useMemo(() => {
        return uniqueStatus.filter(status =>
            status.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, uniqueStatus]);

    const optionsOutlets = [
        { value: "", label: "Semua Outlet" },
        ...filteredOutlets.map((outlet) => ({
            value: outlet,
            label: outlet,
        })),
    ];

    const handleDelete = async (itemId) => {
        try {
            await axios.delete(`/api/menu/menu-items/${itemId}`);
            setStock(stock.filter(item => item._id !== itemId));
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error deleting item:", error);
        }
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
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <Header />

            {/* Sub Header */}
            <div className="px-3 py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b bg-white space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2 text-sm">
                    <FaBoxes size={18} className="text-gray-500" />
                    <p className="text-gray-500">Inventori</p>
                    <FaChevronRight className="text-gray-500" />
                    <p className="text-[#005429]">Kartu Stok</p>
                    <FaInfoCircle size={15} className="text-gray-400" />
                </div>
                <div className="flex w-full sm:w-auto">
                    <ExportInventory
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                    />
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full sm:w-auto bg-white text-[#005429] px-4 py-2 rounded border border-[#005429] hover:text-white hover:bg-[#005429] text-[13px]"
                    >
                        Ekspor
                    </button>
                </div>
            </div>

            <div className="px-3 pb-4 mb-[60px]">
                {/* Filter */}
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
                                inputClassName="w-full text-[13px] border py-[8px] pr-[25px] pl-[12px] rounded cursor-pointer"
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
                                className="text-[13px] border py-[8px] pl-[30px] pr-[25px] rounded w-full"
                            />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex lg:justify-end space-x-2 items-end col-span-1">
                        <button
                            onClick={applyFilter}
                            className="w-full sm:w-auto bg-[#005429] border text-white text-[13px] px-[15px] py-[8px] rounded"
                        >
                            Terapkan
                        </button>
                        <button className="w-full sm:w-auto text-[#005429] hover:text-white hover:bg-[#005429] border border-[#005429] text-[13px] px-[15px] py-[8px] rounded">
                            Reset
                        </button>
                    </div>
                </div>

                {/* Info Legend */}
                <div className="w-full mt-4 py-[15px] shadow-md">
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
                </div>

                {/* <BubbleAlert paginatedData={filteredData} /> */}

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-md shadow-slate-200 mt-4">
                    <table className="min-w-full table-fixed text-xs sm:text-sm border-collapse">
                        <thead className="bg-slate-50 text-gray-400">
                            <tr>
                                <th className="p-3 font-medium text-left w-[20%]">Produk</th>
                                <th className="p-3 font-medium text-left w-[15%]">Kategori</th>
                                <th className="p-3 font-medium text-right w-[10%]">Stok Awal</th>
                                <th className="p-3 font-medium text-right w-[10%]">Stok Masuk</th>
                                <th className="p-3 font-medium text-right w-[10%]">Stok Keluar</th>
                                <th className="p-3 font-medium text-right w-[10%]">Transfer</th>
                                <th className="p-3 font-medium text-right w-[10%]">Stok Akhir</th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-gray-500 divide-y">
                                {paginatedData.map((item) => (
                                    <tr
                                        key={item._id}
                                        className={`hover:bg-gray-100 ${item.currentStock <= 0
                                            ? "bg-red-500/30"
                                            : item.currentStock <= item.minStock
                                                ? "bg-yellow-500/30"
                                                : ""
                                            }`}
                                    >
                                        <td className="p-3 truncate">{item.name}</td>
                                        <td className="p-3 truncate">{item.category?.name}</td>
                                        <td className="p-3 text-right">{item.firstStock || 0}</td>
                                        <td
                                            className={`p-3 text-right ${item.stockIn > 0 ? "text-[#005429]" : ""
                                                }`}
                                        >
                                            {item.stockIn > 0 ? `+ ${item.stockIn}` : 0}
                                        </td>
                                        <td
                                            className={`p-3 text-right ${item.stockOut > 0 ? "text-red-500" : ""
                                                }`}
                                        >
                                            {item.stockOut > 0 ? `- ${item.stockOut}` : 0}
                                        </td>
                                        <td className="p-3 text-right">
                                            {item.stockAdjustment || 0}
                                        </td>
                                        <td className="p-3 text-right">{item.finalStock || 0}</td>
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

                {/* Pagination */}
                {paginatedData.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-2 sm:space-y-0">
                        <span className="text-sm text-gray-600 text-center sm:text-left">
                            Menampilkan{" "}
                            {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
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
                                            className={`px-3 py-1 rounded border ${currentPage === page
                                                ? "bg-[#005429] text-white"
                                                : "bg-white"
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
            </div>

            {/* Footer */}
            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]" />
            </div>
        </div>

    );
};

export default StockCardManagement;  