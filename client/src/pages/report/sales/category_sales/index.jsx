import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaDownload } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import SalesCategorySkeleton from "./skeleton";
import { exportCategorySalesExcel } from "../../../../utils/exportCategorySalesExcel";

const CategorySales = () => {
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

    const [outlets, setOutlets] = useState([]);
    const [isExporting, setIsExporting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [dateRange, setDateRange] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);

    const ITEMS_PER_PAGE = 50;
    const dropdownRef = useRef(null);

    // Safety function to ensure we're always working with arrays
    const ensureArray = (data) => Array.isArray(data) ? data : [];

    // Initialize from URL params or set default to today
    useEffect(() => {
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const outletParam = searchParams.get('outletId');
        const searchParam = searchParams.get('search');

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
    }, [searchParams]);

    // Update URL when filters change
    const updateURLParams = useCallback((newDateRange, newOutlet, newSearch) => {
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

        setSearchParams(params);
    }, [setSearchParams]);

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

        fetchData();
    }, []);

    // Handler functions
    const handleDateRangeChange = (newValue) => {
        setDateRange(newValue);
        updateURLParams(newValue, selectedOutlet, searchTerm);
    };

    const handleOutletChange = (selected) => {
        const newOutlet = selected?.value || "";
        setSelectedOutlet(newOutlet);
        updateURLParams(dateRange, newOutlet, searchTerm);
    };

    const handleSearchChange = (e) => {
        const newSearch = e.target.value;
        setSearchTerm(newSearch);
        updateURLParams(dateRange, selectedOutlet, newSearch);
    };

    const options = useMemo(() => [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((o) => ({ value: o._id, label: o.name })),
    ], [outlets]);

    // Apply filter function - FIXED LOGIC
    const applyFilter = useCallback(() => {
        // Make sure products is an array before attempting to filter
        let filtered = ensureArray([...products]);

        // Filter by outlet FIRST
        if (selectedOutlet) {
            filtered = filtered.filter(product => {
                try {
                    // Fixed: Check if outlet array exists and has items
                    if (!product?.cashier?.outlet || product.cashier.outlet.length === 0) {
                        return false;
                    }

                    // Fixed: Compare by ID, not name
                    const outletId = product.cashier.outlet[0]?.outletId?._id || product.cashier.outlet[0]?.outletId;
                    return outletId === selectedOutlet;
                } catch (err) {
                    console.error("Error filtering by outlet:", err);
                    return false;
                }
            });
        }

        // Filter by date range
        if (dateRange?.startDate && dateRange?.endDate) {
            filtered = filtered.filter(product => {
                try {
                    if (!product.createdAt) {
                        return false;
                    }

                    const productDate = new Date(product.createdAt);
                    const startDate = new Date(dateRange.startDate);
                    const endDate = new Date(dateRange.endDate);

                    // Set time to beginning/end of day for proper comparison
                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(23, 59, 59, 999);

                    // Check if dates are valid
                    if (isNaN(productDate.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                        return false;
                    }

                    return productDate >= startDate && productDate <= endDate;
                } catch (err) {
                    console.error("Error filtering by date:", err);
                    return false;
                }
            });
        }

        // Filter by search term (category) - FIXED: Apply after other filters
        if (searchTerm) {
            filtered = filtered.flatMap(product => {
                try {
                    const searchTermLower = searchTerm.toLowerCase();

                    // Process all items in the order, not just the first one
                    return (product?.items || []).flatMap(item => {
                        const menuItem = item?.menuItem;
                        if (!menuItem) return [];

                        // Handle category as string or object
                        let categoryName = '';
                        if (typeof menuItem.category === 'string') {
                            categoryName = menuItem.category;
                        } else if (menuItem.category?.name) {
                            categoryName = menuItem.category.name;
                        } else {
                            categoryName = 'Uncategorized';
                        }

                        // Check if category matches search term
                        const categoryLower = categoryName.toLowerCase();
                        if (!categoryLower.includes(searchTermLower)) {
                            return [];
                        }

                        // Return filtered product with single item
                        return [{
                            ...product,
                            items: [{
                                ...item,
                                menuItem: {
                                    ...menuItem,
                                    category: categoryName
                                }
                            }]
                        }];
                    });
                } catch (err) {
                    console.error("Error filtering by search:", err);
                    return [];
                }
            });
        }

        setFilteredData(filtered);
    }, [products, searchTerm, selectedOutlet, dateRange]);

    // Auto-apply filter whenever dependencies change
    useEffect(() => {
        applyFilter();
    }, [applyFilter]);

    // Group data by category - FIXED LOGIC
    const groupedArray = useMemo(() => {
        const grouped = {};

        filteredData.forEach(product => {
            // Process all items in the order
            (product?.items || []).forEach(item => {
                if (!item?.menuItem) return;

                // Handle category as string or object
                let categoryName = '';
                if (typeof item.menuItem.category === 'string') {
                    categoryName = item.menuItem.category;
                } else if (item.menuItem.category?.name) {
                    categoryName = item.menuItem.category.name;
                } else {
                    categoryName = 'Uncategorized';
                }

                const quantity = Number(item?.quantity) || 0;
                const subtotal = Number(item?.subtotal) || 0;

                if (!grouped[categoryName]) {
                    grouped[categoryName] = {
                        category: categoryName,
                        quantity: 0,
                        subtotal: 0
                    };
                }

                grouped[categoryName].quantity += quantity;
                grouped[categoryName].subtotal += subtotal;
            });
        });

        // Sort by category name
        return Object.values(grouped).sort((a, b) =>
            a.category.localeCompare(b.category, 'id')
        );
    }, [filteredData]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return groupedArray.slice(startIndex, endIndex);
    }, [groupedArray, currentPage]);

    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(groupedArray.length / ITEMS_PER_PAGE);

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
        if (isNaN(amount) || !isFinite(amount)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Export current data to Excel
    const exportToExcel = async () => {
        setIsExporting(true);

        try {
            // Small delay to show loading state
            await new Promise(resolve => setTimeout(resolve, 500));

            // Get outlet name
            const outletName = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet'
                : 'Semua Outlet';

        // Get date range
        const dateRangeText = dateRange?.startDate && dateRange?.endDate
            ? `${new Date(dateRange.startDate).toLocaleDateString('id-ID')} - ${new Date(dateRange.endDate).toLocaleDateString('id-ID')}`
            : new Date().toLocaleDateString('id-ID');

            // Create export data
            const exportData = [
                { col1: 'Laporan Penjualan Per Kategori', col2: '', col3: '', col4: '' },
                { col1: '', col2: '', col3: '', col4: '' },
                { col1: 'Outlet', col2: outletName, col3: '', col4: '' },
                { col1: 'Tanggal', col2: dateRangeText, col3: '', col4: '' },
                { col1: '', col2: '', col3: '', col4: '' },
                { col1: 'Kategori', col2: 'Terjual', col3: 'Penjualan Bersih', col4: 'Rata-rata' }
            ];

            // Add data rows from groupedArray
            groupedArray.forEach(group => {
                const average = group.quantity > 0 ? Math.round(group.subtotal / group.quantity) : 0;
                exportData.push({
                    col1: group.category || '-',
                    col2: group.quantity,
                    col3: group.subtotal,
                    col4: average,
                });
            });

            // Add Grand Total row
            const grandAverage = grandTotal.quantity > 0
                ? Math.round(grandTotal.subtotal / grandTotal.quantity)
                : 0;

            exportData.push({
                col1: 'Grand Total',
                col2: grandTotal.quantity,
                col3: grandTotal.subtotal,
                col4: grandAverage,
            });

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(exportData, {
                header: ['col1', 'col2', 'col3', 'col4'],
                skipHeader: true
            });

            // Set column widths
            ws['!cols'] = [
                { wch: 25 }, // Kategori
                { wch: 12 }, // Terjual
                { wch: 18 }, // Penjualan Bersih
                { wch: 15 }, // Rata-rata
            ];

            // Merge cells for title
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } } // Merge title across 4 columns
            ];

            // Create workbook and add worksheet
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Penjualan Per Kategori");

            // Generate filename with date range
            const startDate = new Date(dateRange.startDate).toLocaleDateString('id-ID').replace(/\//g, '-');
            const endDate = new Date(dateRange.endDate).toLocaleDateString('id-ID').replace(/\//g, '-');
            const fileName = `Laporan_Penjualan_Per_Kategori_${outletName}_${startDate}_${endDate}.xlsx`;

            // Export file
            XLSX.writeFile(wb, fileName);

        } catch (error) {
            console.error("Error exporting to Excel:", error);
            alert("Gagal mengekspor data. Silakan coba lagi.");
        } finally {
            setIsExporting(false);
        }
    };

    // Show loading state
    if (loading) {
        return <SalesCategorySkeleton />;
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
                    <span>Penjualan Per Kategori</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={isExporting || groupedArray.length === 0}
                    className="bg-green-900 text-white text-[13px] px-[15px] py-[7px] rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isExporting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            Mengekspor...
                        </>
                    ) : (
                        <>
                            <FaDownload /> Ekspor Excel
                        </>
                    )}
                </button>
            </div>

            {/* Filters */}
            <div className="px-6 pb-6">
                <div className="flex justify-between py-3 gap-2">
                    <div className="flex flex-col col-span-3 w-2/5">
                        <div className="relative text-gray-500">
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

                    <div className="flex justify-end gap-2 w-2/5">
                        <div className="flex flex-col col-span-3 w-2/5">
                            <input
                                type="text"
                                placeholder="Kategori"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="text-[13px] border py-2 pr-[25px] pl-[12px] rounded focus:ring-1 focus:ring-green-900 focus:outline-none"
                            />
                        </div>

                        <div className="flex flex-col col-span-3">
                            <Select
                                options={options}
                                value={
                                    selectedOutlet
                                        ? options.find((opt) => opt.value === selectedOutlet)
                                        : options[0]
                                }
                                onChange={handleOutletChange}
                                placeholder="Pilih outlet..."
                                className="text-[13px]"
                                classNamePrefix="react-select"
                                styles={customStyles}
                                isSearchable
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-md bg-white shadow-slate-200">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal">Kategori</th>
                                <th className="px-4 py-3 font-normal text-right">Terjual</th>
                                <th className="px-4 py-3 font-normal text-right">Penjualan Bersih</th>
                                <th className="px-4 py-3 font-normal text-right">Rata-Rata</th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {paginatedData.map((group, index) => {
                                    const average = group.quantity > 0
                                        ? group.subtotal / group.quantity
                                        : 0;

                                    return (
                                        <tr key={index} className="text-left text-sm hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                {group.category}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {group.quantity.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {formatCurrency(group.subtotal)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {formatCurrency(average)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr className="py-6 text-center w-full h-96">
                                    <td colSpan={4}>Tidak ada data ditemukan</td>
                                </tr>
                            </tbody>
                        )}
                        <tfoot className="border-t font-semibold text-sm">
                            <tr>
                                <td className="px-4 py-2">Grand Total</td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {grandTotal.quantity.toLocaleString('id-ID')}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(grandTotal.subtotal)}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(
                                            grandTotal.average ||
                                            (grandTotal.quantity > 0 ? grandTotal.subtotal / grandTotal.quantity : 0)
                                        )}
                                    </p>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CategorySales;