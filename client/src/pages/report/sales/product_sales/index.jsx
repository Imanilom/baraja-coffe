import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaDownload, FaChevronLeft } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import Paginated from "../../../../components/paginated";
import ProductSalesSkeleton from "./skeleton";
import dayjs from "dayjs";
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { exportProductSalesExcel } from '../../../../utils/exportProductSalesExcel';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

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
    const [grandTotal, setGrandTotal] = useState(null);
    const [metadata, setMetadata] = useState(null);
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedOutlet, setSelectedOutlet] = useState("all");
    const [dateRange, setDateRange] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    // Initialize from URL params or set default to today
    useEffect(() => {
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const outletParam = searchParams.get('outlet');
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
    const updateURLParams = useCallback((newDateRange, newOutlet, newSearch, newPage) => {
        const params = new URLSearchParams();

        if (newDateRange?.startDate && newDateRange?.endDate) {
            params.set('startDate', dayjs(newDateRange.startDate).format('YYYY-MM-DD'));
            params.set('endDate', dayjs(newDateRange.endDate).format('YYYY-MM-DD'));
        }

        if (newOutlet && newOutlet !== 'all') {
            params.set('outlet', newOutlet);
        }

        if (newSearch) {
            params.set('search', newSearch);
        }

        if (newPage && newPage > 1) {
            params.set('page', newPage.toString());
        }

        setSearchParams(params);
    }, [setSearchParams]);

    // Fetch products and outlets data
    const fetchData = async () => {
        if (!dateRange?.startDate || !dateRange?.endDate) return;

        setLoading(true);
        try {
            const startDate = dayjs(dateRange.startDate).format('YYYY-MM-DD');
            const endDate = dayjs(dateRange.endDate).format('YYYY-MM-DD');

            // Fetch products data with new endpoint
            const productsResponse = await axios.get('/api/report/sales/product-sales', {
                params: {
                    startDate,
                    endDate,
                    outlet: selectedOutlet !== 'all' ? selectedOutlet : undefined,
                    product: searchTerm || undefined
                }
            });

            if (productsResponse.data.success) {
                setProducts(productsResponse.data.data || []);
                setGrandTotal(productsResponse.data.grandTotal || null);
                setMetadata(productsResponse.data.metadata || null);
            } else {
                setProducts([]);
                setGrandTotal(null);
                setMetadata(null);
            }

            // Fetch outlets data
            const outletsResponse = await axios.get('/api/outlet');
            const outletsData = Array.isArray(outletsResponse.data) ?
                outletsResponse.data :
                (outletsResponse.data && Array.isArray(outletsResponse.data.data)) ?
                    outletsResponse.data.data : [];

            setOutlets(outletsData);
            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load data. Please try again later.");
            setProducts([]);
            setGrandTotal(null);
            setMetadata(null);
            setOutlets([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when filters change
    useEffect(() => {
        if (dateRange?.startDate && dateRange?.endDate) {
            fetchData();
        }
    }, [dateRange, selectedOutlet, searchTerm]);

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
        { value: "all", label: "Semua Outlet" },
        ...outlets.map((o) => ({ value: o._id, label: o.name })),
    ];

    // Pagination
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return products.slice(startIndex, endIndex);
    }, [products, currentPage]);

    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Export current data to Excel
    const exportToExcel = async () => {
        const outletName = selectedOutlet === 'all'
            ? 'Semua Outlet'
            : outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet';

        const startDateFormatted = new Date(dateRange.startDate).toLocaleDateString('id-ID');
        const endDateFormatted = new Date(dateRange.endDate).toLocaleDateString('id-ID');

        const startDate = dayjs(dateRange.startDate).format('DD-MM-YYYY');
        const endDate = dayjs(dateRange.endDate).format('DD-MM-YYYY');

        await exportProductSalesExcel({
            data: products,
            grandTotal,
            metadata,
            fileName: `Laporan_Penjualan_Produk_${startDate}_${endDate}.xlsx`,
            headerInfo: [
                ['Periode', `${startDateFormatted} - ${endDateFormatted}`],
                ['Outlet', outletName],
                ['Tanggal Export', new Date().toLocaleString('id-ID')]
            ]
        });
    };

    if (loading) {
        return <ProductSalesSkeleton />;
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
                    <span>Penjualan Produk</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={products.length === 0}
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

                    <div className="flex justify-end relative gap-3 w-3/5">
                        <div className="w-2/4">
                            <input
                                type="text"
                                placeholder="Cari produk..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full block text-[13px] border py-2 pr-[25px] pl-[12px] rounded focus:ring-1 focus:ring-green-900 focus:outline-none"
                            />
                        </div>
                        <div className="w-1/4">
                            <Select
                                options={options}
                                value={options.find((opt) => opt.value === selectedOutlet) || options[0]}
                                onChange={handleOutletChange}
                                placeholder="Pilih outlet..."
                                isSearchable
                                className="text-[13px]"
                                classNamePrefix="react-select"
                                styles={customStyles}
                            />
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                {metadata && grandTotal && (
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="bg-white p-4 rounded shadow-md">
                            <p className="text-xs text-gray-500">Total Produk</p>
                            <p className="text-xl font-semibold text-green-900">{metadata.totalProducts}</p>
                        </div>
                        <div className="bg-white p-4 rounded shadow-md">
                            <p className="text-xs text-gray-500">Total Orders</p>
                            <p className="text-xl font-semibold text-green-900">{metadata.totalOrders?.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded shadow-md">
                            <p className="text-xs text-gray-500">Total Terjual</p>
                            <p className="text-xl font-semibold text-green-900">{grandTotal.quantity?.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded shadow-md">
                            <p className="text-xs text-gray-500">Total Penjualan</p>
                            <p className="text-xl font-semibold text-green-900">{formatCurrency(grandTotal.subtotal)}</p>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-md bg-white shadow-slate-200">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal">No</th>
                                <th className="px-4 py-3 font-normal">Nama Produk</th>
                                <th className="px-4 py-3 font-normal">Kategori</th>
                                <th className="px-4 py-3 font-normal text-right">Qty Terjual</th>
                                <th className="px-4 py-3 font-normal text-right">Total Penjualan</th>
                                <th className="px-4 py-3 font-normal text-right">Rata-rata</th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {paginatedData.map((product, index) => (
                                    <tr key={index} className="text-left text-sm hover:bg-gray-50 border-b">
                                        <td className="px-4 py-3 text-gray-500">
                                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-700">{product.productName}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-700">{product.category}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right">{product.quantity?.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(product.subtotal)}</td>
                                        <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(product.average)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr className="py-6 text-center w-full h-96">
                                    <td colSpan={5}>Tidak ada data ditemukan</td>
                                </tr>
                            </tbody>
                        )}
                        {grandTotal && (
                            <tfoot className="border-t font-semibold text-sm">
                                <tr>
                                    <td className="px-4 py-2" colSpan="2">Grand Total</td>
                                    <td className="px-2 py-2 text-right">
                                        <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                            {grandTotal.quantity?.toLocaleString()}
                                        </p>
                                    </td>
                                    <td className="px-2 py-2 text-right">
                                        <p className="bg-green-100 text-green-700 inline-block px-2 py-[2px] rounded-full">
                                            {formatCurrency(grandTotal.subtotal)}
                                        </p>
                                    </td>
                                    <td className="px-2 py-2 text-right">
                                        <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                            {formatCurrency(grandTotal.average)}
                                        </p>
                                    </td>
                                </tr>
                            </tfoot>
                        )}
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