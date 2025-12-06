import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaDownload, FaChevronLeft } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import Paginated from "../../../../components/paginated";
import ProductSalesSkeleton from "./skeleton";

const ProductSales = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: '#d1d5db',
            minHeight: '34px',
            fontSize: '13px',
            color: '#6b7280',
            boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none',
            '&:hover': {
                borderColor: '#9ca3af',
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#6b7280',
        }),
        input: (provided) => ({
            ...provided,
            color: '#6b7280',
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9ca3af',
            fontSize: '13px',
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '13px',
            color: '#374151',
            backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white',
            cursor: 'pointer',
        }),
    };

    const [products, setProducts] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [dateRange, setDateRange] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredData, setFilteredData] = useState([]);

    // Safety function to ensure we're always working with arrays
    const ensureArray = (data) => Array.isArray(data) ? data : [];
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const dropdownRef = useRef(null);

    // Initialize from URL params or set default to today
    useEffect(() => {
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const outletParam = searchParams.get('outletId');
        const searchParam = searchParams.get('search');
        const pageParam = searchParams.get('page');

        if (startDateParam && endDateParam) {
            setDateRange({
                startDate: new Date(startDateParam),
                endDate: new Date(endDateParam),
            });
        } else {
            const today = new Date();
            setDateRange({
                startDate: today,
                endDate: today,
            });
        }

        if (outletParam) {
            setSelectedOutlet(outletParam);
        }

        if (searchParam) {
            setSearchTerm(searchParam);
        }

        if (pageParam) {
            setCurrentPage(parseInt(pageParam, 10));
        }
    }, []);

    // Update URL when filters change
    const updateURLParams = (newDateRange, newOutlet, newSearch, newPage) => {
        const params = new URLSearchParams();

        if (newDateRange?.startDate && newDateRange?.endDate) {
            const startDate = new Date(newDateRange.startDate).toISOString().split('T')[0];
            const endDate = new Date(newDateRange.endDate).toISOString().split('T')[0];
            params.set('startDate', startDate);
            params.set('endDate', endDate);
        }

        if (newOutlet) {
            params.set('outletId', newOutlet);
        }

        if (newSearch) {
            params.set('search', newSearch);
        }

        if (newPage && newPage > 1) {
            params.set('page', newPage.toString());
        }

        setSearchParams(params);
    };

    // Fetch products and outlets data
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

            const completedData = productsData.filter(item => item.status === "Completed");

            setProducts(completedData);

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

    useEffect(() => {
        fetchData();
    }, []);

    // Handler functions
    const handleDateRangeChange = (newValue) => {
        setDateRange(newValue);
        setCurrentPage(1);
        updateURLParams(newValue, selectedOutlet, searchTerm, 1);
    };

    const handleOutletChange = (selected) => {
        const newOutlet = selected.value;
        setSelectedOutlet(newOutlet);
        setCurrentPage(1);
        updateURLParams(dateRange, newOutlet, searchTerm, 1);
    };

    const handleSearchChange = (e) => {
        const newSearch = e.target.value;
        setSearchTerm(newSearch);
        setCurrentPage(1);
        updateURLParams(dateRange, selectedOutlet, newSearch, 1);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        updateURLParams(dateRange, selectedOutlet, searchTerm, newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const options = [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((o) => ({ value: o._id, label: o.name })),
    ];

    // Apply filter function
    const applyFilter = useCallback(() => {
        let filtered = ensureArray([...products]);

        // Filter by search term (product name, category, or SKU)
        if (searchTerm) {
            filtered = filtered.filter(order => {
                try {
                    // Search in all items
                    return order.items?.some(item => {
                        const menuItem = item?.menuItem;
                        if (!menuItem) return false;

                        const name = (menuItem.name || '').toLowerCase();
                        const categoryName = (menuItem.category?.name || '').toLowerCase();
                        const sku = (menuItem.sku || '').toLowerCase();

                        const searchTermLower = searchTerm.toLowerCase();
                        return name.includes(searchTermLower) ||
                            categoryName.includes(searchTermLower) ||
                            sku.includes(searchTermLower);
                    });
                } catch (err) {
                    console.error("Error filtering by search:", err);
                    return false;
                }
            });
        }

        // Filter by outlet
        if (selectedOutlet) {
            filtered = filtered.filter(order => {
                try {
                    const outletId = order.outlet?._id;
                    return outletId === selectedOutlet;
                } catch (err) {
                    console.error("Error filtering by outlet:", err);
                    return false;
                }
            });
        }

        // Filter by date range
        if (dateRange && dateRange.startDate && dateRange.endDate) {
            filtered = filtered.filter(order => {
                try {
                    if (!order.createdAt) return false;

                    const orderDate = new Date(order.createdAt);
                    const startDate = new Date(dateRange.startDate);
                    const endDate = new Date(dateRange.endDate);

                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(23, 59, 59, 999);

                    if (isNaN(orderDate) || isNaN(startDate) || isNaN(endDate)) {
                        return false;
                    }

                    return orderDate >= startDate && orderDate <= endDate;
                } catch (err) {
                    console.error("Error filtering by date:", err);
                    return false;
                }
            });
        }

        setFilteredData(filtered);
    }, [products, searchTerm, selectedOutlet, dateRange]);

    // Auto-apply filter whenever dependencies change
    useEffect(() => {
        applyFilter();
    }, [applyFilter]);

    // Group by product from filtered orders
    const groupedArray = useMemo(() => {
        const grouped = {};

        filteredData.forEach(order => {
            if (!order.items || !Array.isArray(order.items)) return;

            order.items.forEach(item => {
                if (!item || !item.menuItem) return;

                const productName = item.menuItem.name || 'Unknown';
                const category = item.menuItem.category?.name || 'Uncategorized';
                const sku = item.menuItem.sku || '-';
                const quantity = Number(item.quantity) || 0;
                const subtotal = Number(item.subtotal) || 0;
                const discount = Number(item.discount) || 0;

                const key = `${productName}_${sku}`;

                if (!grouped[key]) {
                    grouped[key] = {
                        productName,
                        category,
                        sku,
                        quantity: 0,
                        discount: 0,
                        subtotal: 0,
                        total: 0,
                    };
                }

                grouped[key].quantity += quantity;
                grouped[key].discount += discount;
                grouped[key].subtotal += subtotal;
                grouped[key].total += subtotal + discount;
            });
        });

        return Object.values(grouped);
    }, [filteredData]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return groupedArray.slice(startIndex, endIndex);
    }, [groupedArray, currentPage]);

    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(groupedArray.length / ITEMS_PER_PAGE);

    // Calculate grand totals from grouped data
    const grandTotal = useMemo(() => {
        return groupedArray.reduce(
            (acc, curr) => {
                acc.quantity += curr.quantity;
                acc.subtotal += curr.subtotal;
                acc.discount += curr.discount;
                acc.total += curr.total;
                return acc;
            },
            {
                quantity: 0,
                subtotal: 0,
                discount: 0,
                total: 0,
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

    // Export current data to Excel
    const exportToExcel = () => {
        // Prepare data for export
        const rows = groupedArray.map(group => ({
            'Produk': group.productName,
            'Kategori': group.category,
            'SKU': group.sku,
            'Terjual': group.quantity,
            'Penjualan Kotor': group.subtotal,
            'Diskon Produk': group.discount,
            'Total': group.total,
        }));

        // Add grand total row
        rows.push({
            'Produk': 'GRAND TOTAL',
            'Kategori': '',
            'SKU': '',
            'Terjual': grandTotal.quantity,
            'Penjualan Kotor': grandTotal.subtotal,
            'Diskon Produk': grandTotal.discount,
            'Total': grandTotal.total,
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Penjualan Produk");

        // Generate filename with date range
        const startDate = new Date(dateRange.startDate).toLocaleDateString('id-ID').replace(/\//g, '-');
        const endDate = new Date(dateRange.endDate).toLocaleDateString('id-ID').replace(/\//g, '-');
        const filename = `Penjualan_Produk_${startDate}_${endDate}.xlsx`;

        XLSX.writeFile(wb, filename);
    };

    // Show loading state
    if (loading) {
        return (
            <ProductSalesSkeleton />
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
            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <span>Laporan</span>
                    <FaChevronRight />
                    <Link to="/admin/sales-menu">Laporan Penjualan</Link>
                    <FaChevronRight />
                    <span>Penjualan Produk</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={groupedArray.length === 0}
                    className="flex items-center gap-3 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FaDownload />Ekspor Excel
                </button>
            </div>

            {/* Filters */}
            <div className="px-6 pb-[15px]">
                <div className="flex justify-between py-3 gap-2">
                    <div className="relative text-gray-500 w-2/5">
                        <div className="w-2/5">
                            <Datepicker
                                showFooter
                                showShortcuts
                                value={dateRange}
                                onChange={handleDateRangeChange}
                                displayFormat="DD-MM-YYYY"
                                inputClassName="w-full text-[13px] border py-2 pr-[25px] pl-[12px] rounded cursor-pointer"
                                popoverDirection="down"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end relative gap-3 w-2/5">
                        <div className="w-2/4">
                            <input
                                type="text"
                                placeholder="Produk / Kategori / SKU"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full block text-[13px] border py-2 pr-[25px] pl-[12px] rounded focus:ring-1 focus:ring-green-900 focus:outline-none"
                            />
                        </div>
                        <div className="">
                            <Select
                                options={options}
                                value={
                                    selectedOutlet
                                        ? options.find((opt) => opt.value === selectedOutlet)
                                        : options[0]
                                }
                                onChange={handleOutletChange}
                                placeholder="Cari outlet..."
                                isSearchable
                                className="text-[13px]"
                                classNamePrefix="react-select"
                                styles={customStyles}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-md bg-white shadow-slate-200">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal">Produk</th>
                                <th className="px-4 py-3 font-normal">Kategori</th>
                                <th className="px-4 py-3 font-normal text-right">Terjual</th>
                                <th className="px-4 py-3 font-normal text-right">Penjualan Kotor</th>
                                <th className="px-4 py-3 font-normal text-right">Diskon Produk</th>
                                <th className="px-4 py-3 font-normal text-right">Total</th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {paginatedData.map((group, index) => {
                                    try {
                                        return (
                                            <tr key={index} className="text-left text-sm hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    {group.productName || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {group.category}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {group.quantity || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {formatCurrency(group.subtotal) || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {formatCurrency(group.discount)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {formatCurrency(group.total)}
                                                </td>
                                            </tr>
                                        );
                                    } catch (err) {
                                        console.error(`Error rendering product ${index}:`, err);
                                        return (
                                            <tr className="text-left text-sm" key={index}>
                                                <td colSpan="6" className="px-4 py-3 text-red-500">
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
                                    <td colSpan={6}>Tidak ada data ditemukan</td>
                                </tr>
                            </tbody>
                        )}
                        <tfoot className="border-t font-semibold text-sm">
                            <tr>
                                <td className="px-4 py-2" colSpan="2">Grand Total</td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {grandTotal.quantity.toLocaleString()}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(grandTotal.subtotal)}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(grandTotal.discount)}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(grandTotal.total)}
                                    </p>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Pagination Controls */}
                <Paginated
                    currentPage={currentPage}
                    setCurrentPage={handlePageChange}
                    totalPages={totalPages}
                />
            </div>
        </div>
    );
};

export default ProductSales;