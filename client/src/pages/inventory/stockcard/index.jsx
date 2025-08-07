import React, { useEffect, useState, useRef, useMemo } from "react";
import { FaBox, FaTag, FaBell, FaUser, FaShoppingBag, FaLayerGroup, FaSquare, FaInfo, FaPencilAlt, FaThLarge, FaDollarSign, FaTrash, FaSearch, FaChevronRight, FaInfoCircle, FaBoxes, FaChevronLeft } from 'react-icons/fa';
import axios from "axios";
import dayjs from "dayjs";
import BubbleAlert from './bubblralert'; // sesuaikan path jika perlu
import Select from "react-select";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Datepicker from "react-tailwindcss-datepicker";

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

    const fetchStock = async () => {
        try {
            const stockResponse = await axios.get('/api/product/stock/all');
            const stockData = stockResponse.data.data;

            setStock(stockData);
            setFilteredData(stockData);
        } catch (err) {
            console.error("Error fetching stock:", err);
            setStock([]);
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
                fetchStock(),
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

    const applyFilter = () => {
        const filtered = stock.map(item => {
            const movements = item.movements || [];

            // Filter by date jika startDate dan endDate tersedia
            const rangeMovements = (value.startDate && value.endDate)
                ? movements.filter(m => {
                    const date = dayjs(m.date || m.createdAt);
                    return date.isSameOrAfter(dayjs(value.startDate), 'day') &&
                        date.isSameOrBefore(dayjs(value.endDate), 'day');
                })
                : movements;

            // Movement sebelum tanggal mulai
            const previousMovements = (value.startDate)
                ? movements.filter(m => {
                    const date = dayjs(m.date || m.createdAt);
                    return date.isBefore(dayjs(value.startDate), 'day');
                })
                : [];

            const stockInBefore = previousMovements.filter(m => m.type === "in").reduce((acc, m) => acc + m.quantity, 0);
            const stockOutBefore = previousMovements.filter(m => m.type === "out").reduce((acc, m) => acc + m.quantity, 0);
            const adjustmentBefore = previousMovements.filter(m => m.type === "adjustment").reduce((acc, m) => acc + m.quantity, 0);

            const firstStock = stockInBefore - stockOutBefore + adjustmentBefore;
            // const firstStock = stockIn - stockOut - adjustmentBefore;

            const stockIn = rangeMovements.filter(m => m.type === "in").reduce((acc, m) => acc + m.quantity, 0);
            const stockOut = rangeMovements.filter(m => m.type === "out").reduce((acc, m) => acc + m.quantity, 0);
            const stockAdjustment = rangeMovements.filter(m => m.type === "adjustment").reduce((acc, m) => acc + m.quantity, 0);

            const finalStock = firstStock + stockIn - stockOut + stockAdjustment;

            return {
                ...item,
                firstStock,
                stockIn,
                stockOut,
                stockAdjustment,
                finalStock
            };
        });

        // Filter by search jika searchTerm tidak kosong
        const finalFiltered = tempSearch
            ? filtered.filter(item =>
                item.productId?.name.toLowerCase().includes(tempSearch.toLowerCase())
            )
            : filtered;

        setFilteredData(finalFiltered);
    };


    useEffect(() => {
        if (stock.length > 0 && !hasFiltered) {
            applyFilter();
            setHasFiltered(true);
        }
    }, [stock, hasFiltered]);

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
        <div className="w-full">
            <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
                <FaBell size={23} className="text-gray-400" />
                <span className="text-[14px]">Hi Baraja</span>
                <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
                    <FaUser size={30} />
                </Link>
            </div>

            <div className="px-3 py-2 flex justify-between items-center border-b bg-white">
                <div className="flex items-center space-x-2">
                    <FaBoxes size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Inventori</p>
                    <FaChevronRight size={22} className="text-[15px] text-gray-500 inline-block" />
                    <p className="text-[15px] text-[#005429]">Kartu Stok</p>
                    <FaInfoCircle size={17} className="text-gray-400 inline-block" />
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => console.log('Ekspor')}
                        className="bg-white text-[#005429] px-4 py-2 rounded border border-[#005429] hover:text-white hover:bg-[#005429] text-[13px]"
                    >
                        Ekspor
                    </button>
                </div>
            </div>

            {/* <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 py-4 px-3">
                <button
                    className={`bg-white border-b-2 py-2 border-b-[#005429] focus:outline-none`}
                >
                    <Link className="flex justify-between items-center p-4">
                        <div className="flex space-x-4">
                            <strong className="text-gray-400 ml-2 text-sm">Kartu Produk</strong>
                        </div>
                    </Link>
                </button>

                <div
                    className={`bg-white border-b-2 py-2 border-b-white hover:border-b-[#005429] focus:outline-none`}
                >
                    <Link className="flex justify-between items-center border-l border-l-gray-200 p-4"
                        to={"/admin/inventory/cardoutlet"}>
                        <div className="flex space-x-4">
                            <h2 className="text-gray-400 ml-2 text-sm">Kartu Outlet</h2>
                        </div>
                    </Link>
                </div>
            </div> */}

            <div className="w-full pb-6 mb-[60px]">
                <div className="px-[15px] pb-[15px]">
                    <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-8 gap-[10px] items-end rounded bg-slate-50 shadow-slate-200 shadow-md">
                        {/* <div className="flex flex-col col-span-2">
                            <label className="text-[13px] mb-1 text-gray-500">Lokasi</label>
                            <Select
                                options={optionsOutlets}
                                value={
                                    optionsOutlets.find((option) => option.value === tempSelectedOutlet) ||
                                    optionsOutlets[0]
                                }
                                onChange={(selected) => {
                                    setTempSelectedOutlet(selected.value);
                                }}
                                className="text-sm"
                                classNamePrefix="react-select"
                                placeholder="Pilih Outlet"
                                isSearchable
                                styles={customSelectStyles}
                            />
                        </div> */}

                        <div className="flex flex-col col-span-2">
                            <label className="text-[13px] mb-1 text-gray-500">Tanggal</label>
                            <div className="relative text-gray-500 after:content-['▼'] after:absolute after:right-3 after:top-1/2 after:-translate-y-1/2 after:text-[10px] after:pointer-events-none">
                                <Datepicker
                                    showFooter
                                    showShortcuts
                                    value={value}
                                    onChange={setValue}
                                    displayFormat="DD-MM-YYYY"
                                    inputClassName="w-full text-[13px] border py-[8px] pr-[25px] pl-[12px] rounded cursor-pointer"
                                    popoverDirection="down"
                                />

                                {/* Overlay untuk menyembunyikan ikon kalender */}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-white cursor-pointer"></div>
                            </div>
                        </div>

                        <div className="flex flex-col col-span-3"></div>

                        {/* <div className="flex flex-col col-span-2">
                            <label className="text-[13px] mb-1 text-gray-500">Kategori</label>
                            <div className="relative">
                                {!showInputCategory ? (
                                    <button className="w-full text-[13px] text-gray-500 border py-[6px] pr-[25px] pl-[12px] rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]" onClick={() => setShowInputCategory(true)}>
                                        {tempSelectedCategory || "Semua Kategori"}
                                    </button>
                                ) : (
                                    <input
                                        type="text"
                                        className="w-full text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded text-left"
                                        value={search}
                                        onChange={(e) => setSearchCategory(e.target.value)}
                                        autoFocus
                                        placeholder=""
                                    />
                                )}
                                {showInputCategory && (
                                    <ul className="absolute z-10 bg-white border mt-1 w-full rounded shadow-slate-200 shadow-md max-h-48 overflow-auto" ref={dropdownRef}>
                                        <li
                                            onClick={() => {
                                                setTempSelectedCategory(""); // Kosong berarti semua
                                                setShowInput(false);
                                            }}
                                            className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                                        >
                                            Semua Kategori
                                        </li>
                                        {filteredCategory.length > 0 ? (
                                            filteredCategory.map((category, idx) => (
                                                <li
                                                    key={idx}
                                                    onClick={() => {
                                                        setTempSelectedCategory(category);
                                                        setShowInputCategory(false);
                                                    }}
                                                    className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                                                >
                                                    {category}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="px-4 py-2 text-gray-500">Tidak ditemukan</li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        </div> */}

                        <div className="flex flex-col col-span-2">
                            <label className="text-[13px] mb-1 text-gray-500">Cari</label>
                            <div className="relative">
                                <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari Produk"
                                    value={tempSearch}
                                    onChange={(e) => setTempSearch(e.target.value)}
                                    className="text-[13px] border py-[8px] pl-[30px] pr-[25px] rounded w-full"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2 items-end col-span-1">
                            <button onClick={applyFilter} className="bg-[#005429] border text-white text-[13px] px-[15px] py-[8px] rounded">Terapkan</button>
                            <button className="text-[#005429] hover:text-white hover:bg-[#005429] border border-[#005429] text-[13px] px-[15px] py-[8px] rounded">Reset</button>
                        </div>
                    </div>

                    <div className="w-full mt-4 py-[20px] shadow-md">
                        <div className="flex justify-between px-[15px]">
                            <div className="flex space-x-4 text-sm text-gray-500">
                                <label htmlFor="" className="flex space-x-2">
                                    <div className="w-5 h-5 bg-red-500/30"></div>
                                    <p>Stok Sudah Mencapai Batas</p>
                                </label>
                                <label htmlFor="" className="flex space-x-2">
                                    <div className="w-5 h-5 bg-yellow-500/30"></div>
                                    <p>Stok Hampir Habis</p>
                                </label>
                            </div>
                            <div className="space-x-7">
                                <label className="text-gray-400 text-[14px] inline-flex items-center cursor-pointer space-x-2">
                                    <span>Produk Dijual</span>
                                    <input type="checkbox" value="" className="sr-only peer" />
                                    <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                                <label className="text-gray-400 text-[14px] inline-flex items-center cursor-pointer space-x-2">
                                    <span>Produk Tidak Dijual</span>
                                    <input type="checkbox" value="" className="sr-only peer" />
                                    <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                                <label className="text-gray-400 text-[14px] inline-flex items-center cursor-pointer space-x-2">
                                    <span>Stok Kosong</span>
                                    <input type="checkbox" value="" className="sr-only peer" />
                                    <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                    <BubbleAlert paginatedData={filteredData} />
                    {/* Menu Table */}
                    <div className="w-full mt-4 shadow-md">
                        <table className="w-full table-auto text-gray-500">
                            <thead>
                                <tr className="text-[14px]">
                                    <th className="p-[15px] font-normal text-left">Produk</th>
                                    <th className="p-[15px] font-normal text-left">Kategori</th>
                                    <th className="p-[15px] font-normal text-right">Stok Awal</th>
                                    <th className="p-[15px] font-normal text-right">Stok Masuk</th>
                                    <th className="p-[15px] font-normal text-right">Stok Keluar</th>
                                    {/* <th className="p-[15px] font-normal text-right">Penjualan</th>
                                    <th className="p-[15px] font-normal text-right">Transfer</th>
                                    <th className="p-[15px] font-normal text-right">Penyesuaian</th> */}
                                    <th className="p-[15px] font-normal text-right">Stok Akhir</th>
                                    <th className="p-[15px] font-normal text-right">Satuan</th>
                                </tr>
                            </thead>
                            {paginatedData.length > 0 ? (
                                <tbody>
                                    {paginatedData.map((item) => (
                                        <tr key={item._id}
                                            className={`hover:bg-gray-100 text-[14px] ${item.currentStock === 0
                                                ? 'bg-red-500/30'
                                                : item.currentStock <= item.minStock
                                                    ? 'bg-yellow-500/30'
                                                    : ''
                                                }`}>
                                            <td className="p-[15px]">
                                                <div className="flex items-center">
                                                    {/* <img
                                                        src={item.imageURL || "https://via.placeholder.com/100"}
                                                        alt={item.name}
                                                        className="w-[35px] h-[35px] object-cover rounded-lg lowercase"
                                                    /> */}
                                                    <div className="ml-4">
                                                        <h3>{item.productId !== null ? item.productId.name.toLowerCase()
                                                            .split(' ')
                                                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                                            .join(' ') : "-"}</h3>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-[15px]">
                                                {item.productId !== null ? item.productId.category : "-"}
                                            </td>
                                            <td className="p-[15px] text-right">{item.firstStock}</td>
                                            <td className={`p-[15px] text-right ${item.stockIn > 0 ? 'text-[#005429]' : ''}`}>
                                                {item.stockIn > 0 ? `+ ${item.stockIn}` : 0}
                                            </td>
                                            <td className={`p-[15px] text-right ${item.stockOut > 0 ? 'text-red-500' : ''}`}>
                                                {item.stockOut > 0 ? `- ${item.stockOut}` : 0}
                                            </td>
                                            {/* <td className="p-[15px] text-right">-</td>
                                            <td className="p-[15px] text-right">-</td>
                                            <td className="p-[15px] text-right">-</td> */}
                                            <td className="p-[15px] text-right">{item.finalStock}</td>
                                            <td className="p-[15px] text-right lowercase">{item.productId !== null ? item.productId.unit : "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            ) : (
                                <tbody>
                                    <tr className="py-6 text-center w-full h-96">
                                        <td colSpan={7}>Tidak ada data ditemukan</td>
                                    </tr>
                                </tbody>
                            )}
                        </table>
                    </div>

                    {/* Pagination */}
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
            </div>

            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]">
                </div>
            </div>
        </div>
    );
};

export default StockCardManagement;  