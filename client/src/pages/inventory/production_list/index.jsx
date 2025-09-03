import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Select from "react-select";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSearch, FaBoxes, FaInfoCircle, FaChevronLeft, FaPencilAlt } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import { get } from "mongoose";
import Header from "../../admin/header";
import MessageAlert from "../messageAlert";


const ProductionListManagement = () => {
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
    const [products, setProductList] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [supplier, setSupplier] = useState([]);
    const [tempSelectedSupplier, setTempSelectedSupplier] = useState([]);
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

    // Fetch products and outlets data
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/marketlist/products");
            const data = res.data.data ? res.data.data : res.data;

            setProductList(data);
            setFilteredData(data);
            setError(null);
        } catch (err) {
            console.error("Error fetching products:", err);
            setProductList([]);
            setFilteredData([]);
            setError("Gagal memuat produk.");
        } finally {
            setLoading(false);
        }
    };

    const fetchSupplier = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/marketlist/supplier");
            const data = res.data.data ? res.data.data : res.data;
            setSupplier(data);
            setError(null);
        } catch (err) {
            console.error("Error fetching products:", err);
            setSupplier([]);
            setError("Gagal memuat produk.");
        } finally {
            setLoading(false);
        }
    };

    const fetchOutlets = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/outlet");
            const data = Array.isArray(res.data)
                ? res.data
                : (res.data && Array.isArray(res.data.data))
                    ? res.data.data
                    : [];

            setOutlets(data);
            setError(null);
        } catch (err) {
            console.error("Error fetching outlets:", err);
            setOutlets([]);
            setError("Gagal memuat outlet.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchOutlets();
        fetchSupplier();
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

    const options = [
        { value: "", label: "Semua Supplier" },
        ...supplier.map((s) => ({
            value: s._id,
            label: s.name,
        })),
    ];

    // Apply filter function
    const applyFilter = () => {
        let filtered = Array.isArray(products) ? [...products] : [];

        // 🔍 Filter by search term (name, category, sku)
        if (tempSearch) {
            const searchTerm = tempSearch.toLowerCase();
            filtered = filtered.filter(product => {
                try {
                    const name = (product?.name || '').toLowerCase();
                    const sku = (product?.sku || '').toLowerCase();
                    const category = (product?.category || '').toLowerCase();

                    return (
                        name.includes(searchTerm) ||
                        sku.includes(searchTerm) ||
                        category.includes(searchTerm)
                    );
                } catch (err) {
                    console.error("Error filtering by search:", err);
                    return false;
                }
            });
        }

        // 🏢 Filter by supplier
        if (tempSelectedSupplier) {
            filtered = filtered.filter(product => {
                try {
                    if (!Array.isArray(product?.suppliers) || product.suppliers.length === 0) {
                        return false;
                    }

                    // cek apakah ada supplierId yang cocok
                    const match = product.suppliers.some(sup => sup.supplierId === tempSelectedSupplier);

                    return match;
                } catch (err) {
                    console.error("Error filtering by Supplier:", err);
                    return false;
                }
            });
        }

        setFilteredData(filtered);
        setCurrentPage(1);
    };


    // Reset filters
    const resetFilter = () => {
        setTempSearch("");
        setTempSelectedSupplier("");
        setSearch("");
        setFilteredData(ensureArray(products));
        setCurrentPage(1);
    };

    // Paginate the filtered data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const result = filteredData.slice(startIndex, endIndex);
        return result;
    }, [currentPage, filteredData]);

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
        <div className="w-full">
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
                <Link
                    to="/admin/inventory/production-create"
                    className="w-full sm:w-auto bg-[#005429] text-white px-4 py-2 rounded border border-[#005429] text-[13px]"
                >
                    Produksi Produk
                </Link>
            </div>

            <MessageAlert />

            {/* Filters */}
            <div className="px-3 pb-4 mb-[60px]">
                <div className="my-3 py-3 px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-3 items-end rounded bg-slate-50 shadow-md shadow-slate-200">
                    {/* Supplier */}
                    <div className="flex flex-col col-span-2">
                        <label className="text-[13px] mb-1 text-gray-500">Supplier</label>
                        <Select
                            className="text-sm"
                            classNamePrefix="select"
                            options={options}
                            placeholder="Semua Supplier"
                            isSearchable
                            value={
                                tempSelectedSupplier
                                    ? options.find((opt) => opt.value === tempSelectedSupplier)
                                    : options[0]
                            }
                            onChange={(selected) => setTempSelectedSupplier(selected.value)}
                            styles={customSelectStyles}
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

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-md shadow-slate-200 mt-4">
                    <table className="min-w-full table-fixed text-xs sm:text-sm border-collapse">
                        <thead className="text-gray-400 bg-slate-50">
                            <tr className="text-left">
                                <th className="px-4 py-3 font-normal w-[20%]">Produk</th>
                                <th className="px-4 py-3 font-normal w-[12%]">SKU</th>
                                <th className="px-4 py-3 font-normal w-[15%]">Kategori</th>
                                <th className="px-4 py-3 font-normal w-[15%]">Supplier</th>
                                <th className="px-4 py-3 font-normal text-right w-[10%]">Min. Permintaan</th>
                                <th className="px-4 py-3 font-normal text-right w-[10%]">Limit Permintaan</th>
                                <th className="px-4 py-3 font-normal w-[10%]">Unit</th>
                                <th className="px-4 py-3 font-normal w-[2%]"></th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-gray-500 divide-y">
                                {paginatedData.flatMap((data) =>
                                    (data.suppliers?.length ? data.suppliers : [{}]).map((sup) => (
                                        <tr
                                            className="hover:bg-slate-50"
                                            key={`${data._id}`}
                                        >
                                            <td className="px-4 py-3">{capitalizeWords(data.name) || "-"}</td>
                                            <td className="px-4 py-3">{data.sku || "-"}</td>
                                            <td className="px-4 py-3">{data.category || "-"}</td>
                                            <td className="px-4 py-3">{sup.supplierName || "-"}</td>
                                            <td className="px-4 py-3 text-right">{data.minimumrequest || 0}</td>
                                            <td className="px-4 py-3 text-right">{data.limitperrequest || 0}</td>
                                            <td className="px-4 py-3 lowercase">{data.unit || "-"}</td>
                                            <td className="">
                                                {/* Dropdown Menu */}
                                                <div className="relative text-right">
                                                    <Link
                                                        to={`/admin/inventory/production-update/${data._id}`}
                                                        className="bg-transparent flex space-x-[18px] items-center px-[20px] py-[15px] text-sm cursor-pointer hover:bg-gray-100"
                                                    >
                                                        <FaPencilAlt size={18} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr className="text-center h-40">
                                    <td colSpan={10}>
                                        <div className="flex flex-col justify-center items-center text-gray-400">
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
                {paginatedData.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-2 sm:space-y-0">
                        <span className="text-xs sm:text-sm text-gray-600">
                            Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–
                            {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} dari {filteredData.length} data
                        </span>
                        <div className="flex justify-center space-x-1 sm:space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-2 py-1 border rounded disabled:opacity-50"
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

                                if (
                                    (page === currentPage - 2 && page > 1) ||
                                    (page === currentPage + 2 && page < totalPages)
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
                                className="px-2 py-1 border rounded disabled:opacity-50"
                            >
                                <FaChevronRight />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom bar */}
            <div className="bg-white w-full h-12 fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]" />
            </div>
        </div>

    );
};

export default ProductionListManagement;
