import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSearch, FaInfoCircle, FaShoppingCart } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";


const ShoppingList = () => {
    const [attendances, setAttendances] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showInput, setShowInput] = useState(false);
    const [search, setSearch] = useState("");
    const [tempSelectedOutlet, setTempSelectedOutlet] = useState("");
    const [value, setValue] = useState(null);
    const [tempSearch, setTempSearch] = useState("");
    const [filteredData, setFilteredData] = useState([]);

    // Safety function to ensure we're always working with arrays
    const ensureArray = (data) => Array.isArray(data) ? data : [];
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const dropdownRef = useRef(null);

    // Calculate the total subtotal first
    const totalSubtotal = selectedTrx && selectedTrx.items ? selectedTrx.items.reduce((acc, item) => acc + item.subtotal, 0) : 0;

    // Calculate PB1 as 10% of the total subtotal
    const pb1 = 10000;

    // Calculate the final total
    const finalTotal = totalSubtotal + pb1;

    // Fetch attendances and outlets data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch attendances data
                const attendancesResponse = [];

                setAttendances(attendancesResponse);
                setFilteredData(attendancesResponse); // Initialize filtered data with all attendances

                // Fetch outlets data
                const outletsResponse = await axios.get('/api/outlet');

                // Ensure outletsResponse.data is an array
                const outletsData = Array.isArray(outletsResponse.data) ?
                    outletsResponse.data :
                    (outletsResponse.data && Array.isArray(outletsResponse.data.data)) ?
                        outletsResponse.data.data : [];

                setOutlets(outletsData);

                setError(null);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load data. Please try again later.");
                // Set empty arrays as fallback
                setAttendances([]);
                setFilteredData([]);
                setOutlets([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
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

    // Paginate the filtered data
    const paginatedData = useMemo(() => {

        // Ensure filteredData is an array before calling slice
        if (!Array.isArray(filteredData)) {
            console.error('filteredData is not an array:', filteredData);
            return [];
        }

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const result = filteredData.slice(startIndex, endIndex);
        return result;
    }, [currentPage, filteredData]);

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

    const groupedArray = useMemo(() => {
        const grouped = {};

        filteredData.forEach(product => {
            const item = product?.items?.[0];
            if (!item) return;

            const categories = Array.isArray(item.menuItem?.category)
                ? item.menuItem.category
                : [item.menuItem?.category || 'Uncategorized'];
            const quantity = Number(item?.quantity) || 0;
            const subtotal = Number(item?.subtotal) || 0;

            categories.forEach(category => {
                const key = `${category}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        category,
                        quantity: 0,
                        subtotal: 0
                    };
                }

                grouped[key].quantity += quantity;
                grouped[key].subtotal += subtotal;
            });
        });

        return Object.values(grouped);
    }, [filteredData]);
    // Filter outlets based on search input
    const filteredOutlets = useMemo(() => {
        return uniqueOutlets.filter(outlet =>
            outlet.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, uniqueOutlets]);

    // Calculate grand totals for filtered data
    const grandTotal = useMemo(() => {
        return groupedArray.reduce(
            (acc, curr) => {
                acc.quantity += curr.quantity;
                acc.subtotal += curr.subtotal;
                return acc;
            },
            {
                quantity: 0,
                subtotal: 0,
            }
        );
    }, [groupedArray]);

    // Apply filter function
    const applyFilter = () => {

        // Make sure attendances is an array before attempting to filter
        let filtered = ensureArray([...attendances]);

        // Filter by search term (product name, category, or SKU)
        if (tempSearch) {
            filtered = filtered.filter(product => {
                try {
                    const menuItem = product?.items?.[0]?.menuItem;
                    if (!menuItem) {
                        return false;
                    }

                    const name = (menuItem.name || '').toLowerCase();
                    const customer = (menuItem.user || '').toLowerCase();
                    const receipt = (menuItem._id || '').toLowerCase();

                    const searchTerm = tempSearch.toLowerCase();
                    return name.includes(searchTerm) ||
                        customer.includes(searchTerm) ||
                        receipt.includes(searchTerm);
                } catch (err) {
                    console.error("Error filtering by search:", err);
                    return false;
                }
            });
        }

        // Filter by outlet
        if (tempSelectedOutlet) {
            filtered = filtered.filter(product => {
                try {
                    if (!product?.cashier?.outlet?.length > 0) {
                        return false;
                    }

                    const outletName = product.cashier.outlet[0]?.outletId?.name;
                    const matches = outletName === tempSelectedOutlet;

                    if (!matches) {
                    }

                    return matches;
                } catch (err) {
                    console.error("Error filtering by outlet:", err);
                    return false;
                }
            });
        }

        // Filter by date range
        if (value && value.startDate && value.endDate) {
            filtered = filtered.filter(product => {
                try {
                    if (!product.createdAt) {
                        return false;
                    }

                    const productDate = new Date(product.createdAt);
                    const startDate = new Date(value.startDate);
                    const endDate = new Date(value.endDate);

                    // Set time to beginning/end of day for proper comparison
                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(23, 59, 59, 999);

                    // Check if dates are valid
                    if (isNaN(productDate) || isNaN(startDate) || isNaN(endDate)) {
                        return false;
                    }

                    const isInRange = productDate >= startDate && productDate <= endDate;
                    if (!isInRange) {
                    }
                    return isInRange;
                } catch (err) {
                    console.error("Error filtering by date:", err);
                    return false;
                }
            });
        }

        setFilteredData(filtered);
        setCurrentPage(1); // Reset to first page after filter
    };

    // Reset filters
    const resetFilter = () => {
        setTempSearch("");
        setTempSelectedOutlet("");
        setValue(null);
        setSearch("");
        setFilteredData(ensureArray(attendances));
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
        <div className="">
            {/* Header */}
            <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
                <FaBell size={23} className="text-gray-400" />
                <span className="text-[14px]">Hi Baraja</span>
                <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
                    <FaUser size={30} />
                </Link>
            </div>

            {/* Breadcrumb */}
            <div className="px-3 py-2 flex justify-between items-center border-b">
                <div className="flex items-center space-x-2">
                    <FaClipboardList size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Pembelian</p>
                    <FaChevronRight className="text-[15px] text-gray-500" />
                    <span className="text-[15px] text-[#005429]">Daftar Belanja</span>
                    <FaInfoCircle className="text-[15px] text-gray-500" />
                </div>
                <div className="flex space-x-2">
                    <Link to="/admin/purchase/create-shopping-list" className="bg-[#005429] border-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Kelola Daftar Belanja</Link>
                </div>
            </div>

            {/* Filters */}
            <div className="px-[15px] pb-[15px] mb-[60px]">
                <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-3 gap-[20px] items-end rounded bg-slate-50 shadow-slate-200 shadow-md">
                    <div className="flex flex-col col-span-1">
                        <label className="text-[13px] mb-1 text-gray-500">Produk</label>
                        <div className="relative">
                            <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder=""
                                value={tempSearch}
                                onChange={(e) => setTempSearch(e.target.value)}
                                className="text-[13px] border py-[6px] pl-[30px] pr-[25px] rounded w-full"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col col-span-1">
                        <label className="text-[13px] mb-1 text-gray-500">Brand</label>
                        <div className="relative">
                            <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder=""
                                value={tempSearch}
                                onChange={(e) => setTempSearch(e.target.value)}
                                className="text-[13px] border py-[6px] pl-[30px] pr-[25px] rounded w-full"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col col-span-1">
                        <label className="text-[13px] mb-1 text-gray-500">Supplier</label>
                        <div className="relative">
                            <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder=""
                                value={tempSearch}
                                onChange={(e) => setTempSearch(e.target.value)}
                                className="text-[13px] border py-[6px] pl-[30px] pr-[25px] rounded w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-slate-200 shadow-md">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal">Produk</th>
                                <th className="px-4 py-3 font-normal">Brand</th>
                                <th className="px-4 py-3 font-normal">supplier</th>
                                <th className="px-4 py-3 font-normal text-right">Jumlah</th>
                                <th className="px-4 py-3 font-normal text-right">Satuan</th>
                                <th className="px-4 py-3 font-normal text-right">Harga Satuan</th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {paginatedData.map((data, index) => {
                                    try {
                                        return (
                                            <tr className="text-left text-sm cursor-pointer hover:bg-slate-50" key={data._id}>
                                                <td className="px-4 py-3">
                                                    {data.tanggal || []}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {data.jenis || []}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {data.jumlah || []}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {data.supplier || []}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {data.keterangan || []}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {data.keterangan || []}
                                                </td>
                                            </tr>
                                        );
                                    } catch (err) {
                                        console.error(`Error rendering product ${index}:`, err, product);
                                        return (
                                            <tr className="text-left text-sm" key={index}>
                                                <td colSpan="5" className="px-4 py-3 text-red-500">
                                                    Error rendering product
                                                </td>
                                            </tr>
                                        );
                                    }
                                })}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr className="py-6 text-center w-full h-96">
                                    <td colSpan={6}>
                                        <div className="flex justify-center items-center min-h-[300px] text-gray-500">
                                            <div className="grid grid-cols-3 gap-6 text-center">
                                                <div className="col-span-3 flex flex-col items-center justify-center space-y-4 max-w-[600px]">
                                                    <FaShoppingCart size={60} className="text-gray-500" />
                                                    <p className="text-lg font-semibold">Daftar Belanja</p>
                                                    <span className="text-sm text-justify">
                                                        Dengan mengisi daftar belanja yang biasanya menjadi keperluan bisnis Anda, kami dapat membantu Anda dengan memberikan penawaran harga dan produk menarik dari Foodia.
                                                    </span>
                                                    <Link to="/admin/purchase/create-shopping-list" className="bg-[#005429] border-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded transition">
                                                        Kelola Daftar Belanja
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                </tr>
                            </tbody>
                        )}

                        <tfoot className="border-t font-semibold text-sm">
                            <tr>
                                <td className="p-[15px]">Total Produk</td>
                                <td className="p-[15px] text-left rounded"><p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">{formatCurrency(grandTotal.subtotal + (grandTotal.subtotal * 0.10))}</p></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Pagination Controls */}
                {paginatedData.length > 0 && (
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-gray-600">
                            Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} dari {filteredData.length} data
                        </span>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sebelumnya
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Berikutnya
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

export default ShoppingList;
