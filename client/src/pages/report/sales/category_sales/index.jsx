import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaDownload } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import Paginated from "../../../../components/paginated";
import SalesCategorySkeleton from "./skeleton";

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

    const [products, setProducts] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [isExporting, setIsExporting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [dateRange, setDateRange] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);

    const ITEMS_PER_PAGE = 50;
    const limit = ITEMS_PER_PAGE;
    const dropdownRef = useRef(null);

    // Helper function to format date for API
    const formatDateForAPI = (date) => {
        return new Date(date).toISOString().split('T')[0];
    };

    // Safety function to ensure we're always working with arrays
    const ensureArray = (data) => Array.isArray(data) ? data : [];

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
    }, [searchParams]);

    // Update URL when filters change
    const updateURLParams = useCallback((newDateRange, newOutlet, newSearch, newPage) => {
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
    }, [setSearchParams]);

    // Fetch outlets data
    useEffect(() => {
        const fetchOutlets = async () => {
            try {
                const response = await axios.get('/api/outlet');
                const outletsData = Array.isArray(response.data)
                    ? response.data
                    : Array.isArray(response.data?.data)
                        ? response.data.data
                        : [];
                setOutlets(outletsData);
            } catch (err) {
                console.error("Error fetching outlets:", err);
                setOutlets([]);
            }
        };

        fetchOutlets();
    }, []);

    // Fetch products data
    useEffect(() => {
        const fetchData = async () => {
            if (!dateRange?.startDate || !dateRange?.endDate) {
                return;
            }

            setLoading(true);
            try {
                const params = new URLSearchParams();

                params.append('mode', 'paginated');
                params.append('page', currentPage);
                params.append('limit', limit);
                params.append('status', 'Completed');

                if (selectedOutlet) {
                    params.append('outlet', selectedOutlet);
                }

                if (dateRange?.startDate && dateRange?.endDate) {
                    params.append('startDate', formatDateForAPI(dateRange.startDate));
                    params.append('endDate', formatDateForAPI(dateRange.endDate));
                }

                if (searchTerm) {
                    params.append('category', searchTerm);
                }

                const response = await axios.get(`/api/report/orders?${params.toString()}`);

                const productsData = Array.isArray(response.data?.data)
                    ? response.data.data
                    : [];

                setProducts(productsData);

                if (response.data?.pagination) {
                    setTotalPages(response.data.pagination.totalPages);
                    setTotalOrders(response.data.pagination.totalOrders);
                }
                setError(null);
            } catch (err) {
                console.error("Error fetching products:", err);
                setError("Failed to load products.");
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dateRange, selectedOutlet, currentPage, searchTerm, limit]);

    // Handler functions
    const handleDateRangeChange = (newValue) => {
        setDateRange(newValue);
        setCurrentPage(1);
        updateURLParams(newValue, selectedOutlet, searchTerm, 1);
    };

    const handleOutletChange = (selected) => {
        const newOutlet = selected?.value || "";
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

    const options = useMemo(() => [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((o) => ({ value: o._id, label: o.name })),
    ], [outlets]);

    // Group data by category
    const groupedArray = useMemo(() => {
        const grouped = {};

        products.forEach(product => {
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
    }, [products]);

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

    // Export data to Excel - fetch all data without pagination
    const exportToExcel = async () => {
        setIsExporting(true);

        try {
            // Fetch all data for export (without pagination)
            const params = new URLSearchParams();
            params.append('status', 'Completed');

            if (selectedOutlet) {
                params.append('outlet', selectedOutlet);
            }

            if (dateRange?.startDate && dateRange?.endDate) {
                params.append('startDate', formatDateForAPI(dateRange.startDate));
                params.append('endDate', formatDateForAPI(dateRange.endDate));
            }

            if (searchTerm) {
                params.append('category', searchTerm);
            }

            const response = await axios.get(`/api/report/orders?${params.toString()}`);
            const allProducts = Array.isArray(response.data?.data) ? response.data.data : [];

            // Group all data
            const grouped = {};
            allProducts.forEach(product => {
                (product?.items || []).forEach(item => {
                    if (!item?.menuItem) return;

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

            const groupedData = Object.values(grouped).sort((a, b) =>
                a.category.localeCompare(b.category, 'id')
            );

            // Calculate grand total for export
            const exportGrandTotal = groupedData.reduce(
                (acc, curr) => {
                    acc.quantity += curr.quantity;
                    acc.subtotal += curr.subtotal;
                    return acc;
                },
                { quantity: 0, subtotal: 0 }
            );

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

            // Add data rows
            groupedData.forEach(group => {
                const average = group.quantity > 0 ? Math.round(group.subtotal / group.quantity) : 0;
                exportData.push({
                    col1: group.category || '-',
                    col2: group.quantity,
                    col3: group.subtotal,
                    col4: average,
                });
            });

            // Add Grand Total row
            const grandAverage = exportGrandTotal.quantity > 0
                ? Math.round(exportGrandTotal.subtotal / exportGrandTotal.quantity)
                : 0;

            exportData.push({
                col1: 'Grand Total',
                col2: exportGrandTotal.quantity,
                col3: exportGrandTotal.subtotal,
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
                { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }
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
            <div className="px-6">
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
                        {groupedArray.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {groupedArray.map((group, index) => {
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
                                        {formatCurrency(grandTotal.quantity > 0 ? grandTotal.subtotal / grandTotal.quantity : 0)}
                                    </p>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <Paginated
                    currentPage={currentPage}
                    setCurrentPage={handlePageChange}
                    totalPages={totalPages}
                />
            </div>
        </div>
    );
};

export default CategorySales;