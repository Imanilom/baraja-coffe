import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSearch, FaBoxes, FaInfoCircle, FaChevronLeft } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import { get } from "mongoose";
import Header from "../../admin/header";
import BubbleAlert from "../stockcard/bubblralert";


const ProductionStockManagement = () => {
    const [productStock, setProductStock] = useState([]);
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

    // Calculate the total subtotal first
    const totalSubtotal = selectedTrx && selectedTrx.items ? selectedTrx.items.reduce((acc, item) => acc + item.subtotal, 0) : 0;

    // Calculate PB1 as 10% of the total subtotal
    const pb1 = 10000;

    // Calculate the final total
    const finalTotal = totalSubtotal + pb1;

    // Fetch productStock and outlets data
    const fetchStockData = async () => {
        try {
            setLoading(true);

            // ambil semua produk dari marketlist
            const productResponse = await axios.get("/api/marketlist/products");
            const products = productResponse.data.data || [];

            // ambil data stock/all
            const stockResponse = await axios.get("/api/product/stock/all");
            const stockData = stockResponse.data.data || [];

            // buat map untuk stok biar cepat dicari
            const stockMap = {};
            stockData.forEach((s) => {
                stockMap[s.productId._id] = s;
            });

            // gabungkan product dengan stok + movements
            const mergedData = await Promise.all(
                products.map(async (prod) => {
                    const stockItem = stockMap[prod._id] || null;

                    let movements = [];
                    if (stockItem) {
                        try {
                            const movementResponse = await axios.get(
                                `/api/product/stock/${stockItem.productId._id}/movements`
                            );

                            movements = movementResponse.data.data.movements || [];
                        } catch (err) {
                            console.warn(`No movements for ${prod.name}`);
                        }
                    }

                    return {
                        ...prod, // semua data dari marketlist product
                        stock: stockItem ? stockItem.stock : 0,
                        stockData: stockItem || null,
                        movements, // array movements
                    };
                })
            );

            setProductStock(mergedData);
            setFilteredData(mergedData);
            setError(null);
        } catch (err) {
            console.error("Error fetching stock:", err);
            setError("Failed to load stock data.");
            setProductStock([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Fetch Outlets
    const fetchOutletsData = async () => {
        try {
            const outletsResponse = await axios.get("/api/outlet");

            const outletsData = Array.isArray(outletsResponse.data)
                ? outletsResponse.data
                : outletsResponse.data?.data || [];

            setOutlets(outletsData);
            setError(null);
        } catch (err) {
            console.error("Error fetching outlets:", err);
            setError("Failed to load outlets data.");
            setOutlets([]);
        }
    };

    // 🔹 Run both on mount
    useEffect(() => {
        fetchStockData();
        fetchOutletsData();
    }, []);

    // Get unique outlet names for the dropdown
    const uniqueOutlets = useMemo(() => {
        return outlets.map(item => item.name);
    }, [outlets]);

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

    const capitalizeWords = (text) => {
        return text
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase());
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
        const filtered = productStock.map(item => {
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

            const firstStock = stockInBefore - stockOutBefore;
            // const firstStock = stockIn - stockOut - adjustmentBefore;

            const stockIn = rangeMovements.filter(m => m.type === "in").reduce((acc, m) => acc + m.quantity, 0);
            const stockOut = rangeMovements.filter(m => m.type === "out").reduce((acc, m) => acc + m.quantity, 0);
            const stockAdjustment = rangeMovements.filter(m => m.type === "adjustment").reduce((acc, m) => acc + m.quantity, 0);

            const finalStock = firstStock + stockIn - stockOut;

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
                item.name.toLowerCase().includes(tempSearch.toLowerCase()) ||
                item.sku.toLowerCase().includes(tempSearch.toLowerCase())
            )
            : filtered;

        setFilteredData(finalFiltered);
    };

    // Paginate the filtered data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, endIndex);
    }, [currentPage, filteredData]);

    useEffect(() => {
        if (productStock.length > 0) {
            applyFilter();
        }
    }, [productStock]);

    // Reset filters
    const resetFilter = () => {
        setTempSearch("");
        setTempSelectedOutlet("");

        setValue({
            startDate: dayjs(),
            endDate: dayjs(),
        });
        setSearch("");
        setFilteredData(ensureArray(productStock));
        setCurrentPage(1);
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
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <Header />

            {/* Breadcrumb */}
            <div className="px-3 py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b bg-white space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2 text-sm">
                    <FaBoxes size={18} className="text-gray-500" />
                    <p className="text-gray-500">Inventori</p>
                    <FaChevronRight className="text-gray-500" />
                    <span className="text-[#005429]">Produk</span>
                </div>
                <div className="flex w-full sm:w-auto">
                    <div
                        onClick={() => console.log("Ekspor")}
                        className="w-full sm:w-auto bg-white text-white px-4 py-2 rounded border border-white hover:text-white text-[13px] cursor-default"
                    >
                        Ekspor
                    </div>
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

                    {/* Spacer */}
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

                    {/* Buttons */}
                    <div className="flex lg:justify-end space-x-2 items-end col-span-1">
                        <button
                            onClick={applyFilter}
                            className="bg-[#005429] text-white text-[13px] px-4 py-2 border border-[#005429] rounded"
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

                {/* Legend */}
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

                <BubbleAlert paginatedData={filteredData} />

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-md shadow-slate-200 mt-4">
                    <table className="min-w-full table-fixed text-xs sm:text-sm border-collapse">
                        <thead className="text-gray-400 bg-slate-50">
                            <tr className="text-left">
                                <th className="px-4 py-3 font-normal w-[20%]">Produk</th>
                                <th className="px-4 py-3 font-normal w-[12%]">SKU</th>
                                <th className="px-4 py-3 font-normal w-[15%]">Kategori</th>
                                <th className="px-4 py-3 font-normal text-right w-[10%]">Stok Masuk</th>
                                <th className="px-4 py-3 font-normal text-right w-[10%]">Stok Keluar</th>
                                <th className="px-4 py-3 font-normal text-right w-[10%]">Stok Transfer</th>
                                <th className="px-4 py-3 font-normal text-right w-[10%]">Stok</th>
                                <th className="px-4 py-3 font-normal w-[8%]">Unit</th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-gray-500 divide-y">
                                {paginatedData.map((data) => (
                                    <tr
                                        key={data._id}
                                        className={`hover:bg-gray-100 ${data.stockData?.currentStock <= 0 || data.stockData == null
                                            ? "bg-red-500/30"
                                            : data.stockData?.currentStock <= data.stockData?.minStock
                                                ? "bg-yellow-500/30"
                                                : ""
                                            }`}
                                    >
                                        <td className="px-4 py-3 truncate">{capitalizeWords(data.name) || "-"}</td>
                                        <td className="px-4 py-3 truncate">{data.sku || "-"}</td>
                                        <td className="px-4 py-3 truncate">{data.category || "-"}</td>
                                        <td className="px-4 py-3 text-right">{data.stockIn || 0}</td>
                                        <td className="px-4 py-3 text-right">{data.stockOut || 0}</td>
                                        <td className="px-4 py-3 text-right">{data.stockAdjustment || 0}</td>
                                        <td className="px-4 py-3 text-right">{data.stockData?.currentStock || 0}</td>
                                        <td className="px-4 py-3 lowercase">{data.unit || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr>
                                    <td colSpan={8} className="h-64 text-center">
                                        <div className="flex flex-col justify-center items-center text-gray-400">
                                            <FaSearch size={80} />
                                            <p className="uppercase mt-2">Data Tidak ditemukan</p>
                                        </div>
                                    </td>
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

            {/* Bottom bar */}
            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]"></div>
            </div>
        </div>

    );
};

export default ProductionStockManagement;
