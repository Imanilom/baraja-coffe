import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import Select from "react-select";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";

const Summary = () => {
    const [products, setProducts] = useState([]);
    const [outlets, setOutlets] = useState([]);
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

    // Fetch products and outlets data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch products data
                const productsResponse = await axios.get('/api/orders');

                // Ensure productsResponse.data is an array
                const productsData = Array.isArray(productsResponse.data) ?
                    productsResponse.data :
                    (productsResponse.data && Array.isArray(productsResponse.data.data)) ?
                        productsResponse.data.data : [];

                setProducts(productsData);
                setFilteredData(productsData); // Initialize filtered data with all products

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
                setProducts([]);
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Apply filter function
    const applyFilter = () => {

        // Make sure products is an array before attempting to filter
        let filtered = ensureArray([...products]);

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
        setFilteredData(ensureArray(products));
        setCurrentPage(1);
    };

    // Export current data to Excel
    const exportToExcel = () => {
        // Prepare data for export
        const dataToExport = filteredData.map(product => {
            const item = product.items?.[0] || {};
            const menuItem = item.menuItem || {};
            const addonsPrice = item.addons?.reduce((sum, addon) => sum + (addon?.price || 0), 0) || 0;

            return {
                "Produk": menuItem.name || 'N/A',
                "Kategori": menuItem.category?.join(', ') || 'N/A',
                "SKU": menuItem._id || 'N/A',
                "Terjual": item.quantity || 0,
                "Penjualan Kotor": item.subtotal || 0,
                "Diskon Produk": addonsPrice || 0,
                "Total": (item.subtotal || 0) + addonsPrice,
                "Outlet": product.cashier?.outlet?.[0]?.outletId?.name || 'N/A',
                "Tanggal": new Date(product.createdAt).toLocaleDateString('id-ID')
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Penjualan Produk");
        XLSX.writeFile(wb, "Penjualan_Produk.xlsx");
    };

    useEffect(() => {
        if (products.length > 0) {
            const today = new Date();
            const todayRange = { startDate: today, endDate: today };
            setValue(todayRange);
            setTimeout(() => applyFilter(), 0);
        }
    }, [products]);

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
        <div className="overflow-y-scroll h-screen">
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
                    <p className="text-[15px] text-gray-500">Laporan</p>
                    <FaChevronRight className="text-[15px] text-gray-500" />
                    <Link to="/admin/sales-menu" className="text-[15px] text-gray-500">Laporan Penjualan</Link>
                    <FaChevronRight className="text-[15px] text-gray-500" />
                    <Link to="/admin/summary" className="text-[15px] text-[#005429]">Ringkasan</Link>
                </div>
                <button onClick={exportToExcel} className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Ekspor</button>
            </div>

            {/* Filters */}
            <div className="px-[15px] pb-[15px]">
                <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-12 gap-[10px] items-end rounded bg-gray-50 shadow-md">
                    <div className="flex flex-col col-span-5">
                        <label className="text-[13px] mb-1 text-gray-500">Outlet</label>
                        <div className="relative">
                            {!showInput ? (
                                <button className="w-full text-[13px] text-gray-500 border py-[6px] pr-[25px] pl-[12px] rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]" onClick={() => setShowInput(true)}>
                                    {tempSelectedOutlet || "Semua Outlet"}
                                </button>
                            ) : (
                                <input
                                    type="text"
                                    className="w-full text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded text-left"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                    placeholder="Cari outlet..."
                                />
                            )}
                            {showInput && (
                                <ul className="absolute z-10 bg-white border mt-1 w-full rounded shadow max-h-48 overflow-auto" ref={dropdownRef}>
                                    {filteredOutlets.length > 0 ? (
                                        filteredOutlets.map((outlet, idx) => (
                                            <li
                                                key={idx}
                                                onClick={() => {
                                                    setTempSelectedOutlet(outlet);
                                                    setShowInput(false);
                                                }}
                                                className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                                            >
                                                {outlet}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-2 text-gray-500">Tidak ditemukan</li>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col col-span-5">
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

                    <div className="flex justify-end space-x-2 items-end col-span-2">
                        <button onClick={applyFilter} className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Terapkan</button>
                        <button onClick={resetFilter} className="text-gray-400 border text-[13px] px-[15px] py-[7px] rounded">Reset</button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-md shadow-slate-200">
                    <table className="min-w-full table-auto">
                        <tbody className="text-sm text-gray-400">
                            <React.Fragment>
                                <tr>
                                    <td className="font-medium text-gray-500 p-[15px]">Penjualan Kotor</td>
                                    <td className="text-right p-[15px]">{formatCurrency(grandTotal.subtotal) || 0}</td>
                                </tr>
                                <tr>
                                    <td className="font-medium text-gray-500 p-[15px]">Diskon Promo</td>
                                    <td className="text-right p-[15px]">{formatCurrency(0)}</td>
                                </tr>
                                <tr>
                                    <td className="font-medium text-gray-500 p-[15px]">Diskon Poin</td>
                                    <td className="text-right p-[15px]">{formatCurrency(0)}</td>
                                </tr>
                                <tr>
                                    <td className="font-medium text-gray-500 p-[15px]">Void</td>
                                    <td className="text-right p-[15px]">{formatCurrency(0)}</td>
                                </tr>
                                <tr>
                                    <td className="font-medium text-gray-500 p-[15px]">Pembulatan</td>
                                    <td className="text-right p-[15px]">{formatCurrency(0)}</td>
                                </tr>
                                <tr>
                                    <td className="font-medium text-gray-500 p-[15px]">Penjualan Bersih</td>
                                    <td className="text-right p-[15px]">{formatCurrency(grandTotal.subtotal) || 0}</td>
                                </tr>
                                <tr>
                                    <td className="font-medium text-gray-500 p-[15px]">Pajak</td>
                                    <td className="text-right p-[15px]">{formatCurrency(grandTotal.subtotal * 0.10)}</td>
                                </tr>
                            </React.Fragment>
                        </tbody>
                        <tfoot className="border-t font-semibold text-sm">
                            <tr>
                                <td className="p-[15px]">Total</td>
                                <td className="p-[15px] text-right rounded"><p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">{formatCurrency(grandTotal.subtotal + (grandTotal.subtotal * 0.10))}</p></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Summary;