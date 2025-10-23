import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaDownload } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import dayjs from "dayjs";
import Paginated from "../../../../components/paginated";
import SalesOutletSkeleton from "./skeleton";

const OutletSales = () => {
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

    const [showInput, setShowInput] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [dateRange, setDateRange] = useState(null);
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
        const pageParam = searchParams.get('page');

        if (startDateParam && endDateParam) {
            setDateRange({
                startDate: dayjs(startDateParam),
                endDate: dayjs(endDateParam),
            });
        } else {
            setDateRange({
                startDate: dayjs(),
                endDate: dayjs()
            });
        }

        if (outletParam) {
            setSelectedOutlet(outletParam);
        }

        if (pageParam) {
            setCurrentPage(parseInt(pageParam, 10));
        }
    }, []);

    // Update URL when filters change
    const updateURLParams = (newDateRange, newOutlet, newPage) => {
        const params = new URLSearchParams();

        if (newDateRange?.startDate && newDateRange?.endDate) {
            const startDate = dayjs(newDateRange.startDate).format('YYYY-MM-DD');
            const endDate = dayjs(newDateRange.endDate).format('YYYY-MM-DD');
            params.set('startDate', startDate);
            params.set('endDate', endDate);
        }

        if (newOutlet) {
            params.set('outletId', newOutlet);
        }

        if (newPage && newPage > 1) {
            params.set('page', newPage.toString());
        }

        setSearchParams(params);
    };

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
        setCurrentPage(1);
        updateURLParams(newValue, selectedOutlet, 1);
    };

    const handleOutletChange = (selected) => {
        const newOutlet = selected.value;
        setSelectedOutlet(newOutlet);
        setCurrentPage(1);
        updateURLParams(dateRange, newOutlet, 1);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        updateURLParams(dateRange, selectedOutlet, newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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
            const outletName = product?.outlet.name || 'Unknown';
            const item = product?.items?.[0] || {};
            const subtotal = Number(item?.subtotal) || 0;

            if (!grouped[outletName]) {
                grouped[outletName] = {
                    count: 0,
                    subtotalTotal: 0,
                    products: []
                };
            }

            grouped[outletName].products.push(product);
            grouped[outletName].count++;
            grouped[outletName].subtotalTotal += subtotal;
        });

        return Object.entries(grouped).map(([outletName, data]) => ({
            outletName,
            ...data
        }));
    }, [filteredData]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return groupedArray.slice(startIndex, endIndex);
    }, [groupedArray, currentPage]);

    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(groupedArray.length / ITEMS_PER_PAGE);

    // Filter outlets based on search input
    const filteredOutlets = useMemo(() => {
        return uniqueOutlets.filter(outlet =>
            outlet.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, uniqueOutlets]);

    // Calculate grand totals for filtered data
    const {
        grandTotalItems,
        grandTotalSubtotal,
    } = useMemo(() => {
        const totals = {
            grandTotalItems: 0,
            grandTotalSubtotal: 0,
        };

        if (!Array.isArray(filteredData)) {
            return totals;
        }

        filteredData.forEach(product => {
            try {
                const item = product?.items?.[0];
                if (!item) return;

                const subtotal = Number(item.subtotal) || 0;

                totals.grandTotalItems += 1;
                totals.grandTotalSubtotal += subtotal;
            } catch (err) {
                console.error("Error calculating totals for product:", err);
            }
        });

        return totals;
    }, [filteredData]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const options = [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((o) => ({ value: o._id, label: o.name })),
    ];

    // Apply filter function
    const applyFilter = useCallback(() => {
        // Make sure products is an array before attempting to filter
        let filtered = ensureArray([...products]);

        // Filter by outlet
        if (selectedOutlet) {
            filtered = filtered.filter(product => {
                try {
                    if (!product?.cashier?.outlet?.length > 0) {
                        return false;
                    }

                    const outletName = product.cashier.outlet[0]?.outletId?.name;
                    const matches = outletName === selectedOutlet;

                    return matches;
                } catch (err) {
                    console.error("Error filtering by outlet:", err);
                    return false;
                }
            });
        }

        // Filter by date range
        if (dateRange && dateRange.startDate && dateRange.endDate) {
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
                    if (isNaN(productDate) || isNaN(startDate) || isNaN(endDate)) {
                        return false;
                    }

                    const isInRange = productDate >= startDate && productDate <= endDate;
                    return isInRange;
                } catch (err) {
                    console.error("Error filtering by date:", err);
                    return false;
                }
            });
        }

        setFilteredData(filtered);
    }, [products, selectedOutlet, dateRange]);

    // Auto-apply filter whenever dependencies change
    useEffect(() => {
        applyFilter();
    }, [applyFilter]);

    // Export current data to Excel
    const exportToExcel = () => {
        const rows = groupedArray.map(group => ({
            'Outlet': group.outletName || 'Unknown',
            'Jumlah Transaksi': group.count,
            'Penjualan': group.subtotalTotal,
            'Rata-Rata': Math.round(group.subtotalTotal / group.count)
        }));

        // Add grand total row
        rows.push({
            'Outlet': 'GRAND TOTAL',
            'Jumlah Transaksi': grandTotalItems,
            'Penjualan': grandTotalSubtotal,
            'Rata-Rata': Math.round(grandTotalSubtotal / grandTotalItems)
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Penjualan Per Outlet");

        // Generate filename with date range
        const startDate = dayjs(dateRange.startDate).format('DD-MM-YYYY');
        const endDate = dayjs(dateRange.endDate).format('DD-MM-YYYY');
        const filename = `Penjualan_Per_Outlet_${startDate}_${endDate}.xlsx`;

        XLSX.writeFile(wb, filename);
    };

    // Show loading state
    if (loading) {
        return (
            <SalesOutletSkeleton />
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
                    <span>Penjualan Per Outlet</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={groupedArray.length === 0}
                    className="flex gap-2 items-center bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FaDownload /> Ekspor Excel
                </button>
            </div>

            {/* Filters */}
            <div className="px-6">
                <div className="flex justify-between py-3 gap-2">
                    <div className="flex flex-col col-span-5 w-2/5">
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
                    <div className="flex flex-col col-span-5 w-1/5">
                        <div className="relative text-[13px]">
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
                                <th className="px-4 py-3 font-normal">Outlet</th>
                                <th className="px-4 py-3 font-normal text-right">Jumlah Transaksi</th>
                                <th className="px-4 py-3 font-normal text-right">Penjualan</th>
                                <th className="px-4 py-3 font-normal text-right">Rata-Rata</th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {paginatedData.map((group, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">{group.outletName}</td>
                                        <td className="px-4 py-3 text-right">{group.count}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(group.subtotalTotal)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency((group.subtotalTotal / group.count).toFixed(0))}</td>
                                    </tr>
                                ))}
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
                                        {grandTotalItems.toLocaleString()}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(grandTotalSubtotal)}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency((grandTotalSubtotal / grandTotalItems).toFixed(0))}
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

export default OutletSales;