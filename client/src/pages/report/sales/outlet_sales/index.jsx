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

    const [search, setSearch] = useState("");
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [dateRange, setDateRange] = useState(null);
    const [filteredData, setFilteredData] = useState([]);
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
                startDate: startDateParam,
                endDate: endDateParam,
            });
        } else {
            const today = dayjs().format('YYYY-MM-DD');
            setDateRange({
                startDate: today,
                endDate: today
            });
        }

        if (outletParam) {
            setSelectedOutlet(outletParam);
        }

        if (pageParam) {
            setCurrentPage(parseInt(pageParam, 10));
        }
    }, [searchParams]);

    // Fetch products and outlets data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [productsResponse, outletsResponse] = await Promise.all([
                    axios.get('/api/orders'),
                    axios.get('/api/outlet')
                ]);

                const productsData = Array.isArray(productsResponse.data)
                    ? productsResponse.data
                    : Array.isArray(productsResponse.data?.data)
                        ? productsResponse.data.data
                        : [];

                const completedData = productsData.filter(item => item.status === "Completed");
                setProducts(completedData);

                const outletsData = Array.isArray(outletsResponse.data)
                    ? outletsResponse.data
                    : Array.isArray(outletsResponse.data?.data)
                        ? outletsResponse.data.data
                        : [];

                setOutlets(outletsData);
                setError(null);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load data. Please try again later.");
                setProducts([]);
                setOutlets([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Update URL when filters change
    const updateURLParams = useCallback((newDateRange, newOutlet, newPage) => {
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
    }, [setSearchParams]);

    // Handler functions
    const handleDateRangeChange = (newValue) => {
        setDateRange(newValue);
        setCurrentPage(1);
        updateURLParams(newValue, selectedOutlet, 1);
    };

    const handleOutletChange = (selected) => {
        const newOutlet = selected?.value || "";
        setSelectedOutlet(newOutlet);
        setCurrentPage(1);
        updateURLParams(dateRange, newOutlet, 1);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        updateURLParams(dateRange, selectedOutlet, newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Apply filter function - FIXED LOGIC
    const applyFilter = useCallback(() => {
        let filtered = [...products];

        // Filter by outlet - PERBAIKAN: cek struktur data yang benar
        if (selectedOutlet) {
            filtered = filtered.filter(product => {
                try {
                    // Cek berbagai kemungkinan struktur data
                    const outletId = product?.outlet?._id ||
                        product?.outlet?.id ||
                        product?.cashier?.outlet?.[0]?.outletId?._id ||
                        product?.cashier?.outlet?.[0]?.outletId?.id;

                    return outletId === selectedOutlet;
                } catch (err) {
                    console.error("Error filtering by outlet:", err);
                    return false;
                }
            });
        }

        // Filter by date range - PERBAIKAN: perbandingan tanggal yang lebih akurat
        if (dateRange?.startDate && dateRange?.endDate) {
            filtered = filtered.filter(product => {
                try {
                    if (!product.createdAt) return false;

                    const productDate = dayjs(product.createdAt);
                    const startDate = dayjs(dateRange.startDate).startOf('day');
                    const endDate = dayjs(dateRange.endDate).endOf('day');

                    return productDate.isAfter(startDate.subtract(1, 'second')) &&
                        productDate.isBefore(endDate.add(1, 'second'));
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

    // Group data by outlet - PERBAIKAN: perhitungan yang lebih akurat
    const groupedArray = useMemo(() => {
        const grouped = {};

        filteredData.forEach(product => {
            try {
                const outletName = product?.outlet?.name ||
                    product?.cashier?.outlet?.[0]?.outletId?.name ||
                    'Unknown';

                // PERBAIKAN: ambil subtotal dari semua items, bukan hanya item pertama
                let subtotal = 0;
                if (Array.isArray(product?.items)) {
                    subtotal = product.items.reduce((sum, item) => {
                        return sum + (Number(item?.subtotal) || 0);
                    }, 0);
                }

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
            } catch (err) {
                console.error("Error grouping product:", err);
            }
        });

        return Object.entries(grouped).map(([outletName, data]) => ({
            outletName,
            ...data
        })).sort((a, b) => b.subtotalTotal - a.subtotalTotal); // Sort by total sales descending
    }, [filteredData]);

    // Paginate grouped data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return groupedArray.slice(startIndex, endIndex);
    }, [groupedArray, currentPage]);

    const totalPages = Math.ceil(groupedArray.length / ITEMS_PER_PAGE);

    // Calculate grand totals - PERBAIKAN: perhitungan yang lebih akurat
    const { grandTotalItems, grandTotalSubtotal } = useMemo(() => {
        return groupedArray.reduce((totals, group) => ({
            grandTotalItems: totals.grandTotalItems + group.count,
            grandTotalSubtotal: totals.grandTotalSubtotal + group.subtotalTotal
        }), { grandTotalItems: 0, grandTotalSubtotal: 0 });
    }, [groupedArray]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const options = useMemo(() => [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((o) => ({ value: o._id, label: o.name })),
    ], [outlets]);

    // Export to Excel - PERBAIKAN: tambahkan informasi filter
    const exportToExcel = () => {
        const rows = groupedArray.map(group => ({
            'Outlet': group.outletName || 'Unknown',
            'Jumlah Transaksi': group.count,
            'Penjualan': group.subtotalTotal,
            'Rata-Rata': group.count > 0 ? Math.round(group.subtotalTotal / group.count) : 0
        }));

        rows.push({
            'Outlet': 'GRAND TOTAL',
            'Jumlah Transaksi': grandTotalItems,
            'Penjualan': grandTotalSubtotal,
            'Rata-Rata': grandTotalItems > 0 ? Math.round(grandTotalSubtotal / grandTotalItems) : 0
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Penjualan Per Outlet");

        const startDate = dayjs(dateRange.startDate).format('DD-MM-YYYY');
        const endDate = dayjs(dateRange.endDate).format('DD-MM-YYYY');
        const filename = `Penjualan_Per_Outlet_${startDate}_${endDate}.xlsx`;

        XLSX.writeFile(wb, filename);
    };

    if (loading) {
        return <SalesOutletSkeleton />;
    }

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
                                value={options.find((opt) => opt.value === selectedOutlet) || options[0]}
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
                                        <td className="px-4 py-3 text-right">
                                            {group.count > 0 ? formatCurrency(Math.round(group.subtotalTotal / group.count)) : formatCurrency(0)}
                                        </td>
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
                                        {grandTotalItems > 0 ? formatCurrency(Math.round(grandTotalSubtotal / grandTotalItems)) : formatCurrency(0)}
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