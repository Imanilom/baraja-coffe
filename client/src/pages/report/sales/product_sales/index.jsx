import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import axios from '@/lib/axios';
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

import useDebounce from "../../../../hooks/useDebounce";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const ProductSales = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { outlets } = useSelector((state) => state.outlet);

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: state.isFocused ? 'var(--primary-color, #005429)' : '#e5e7eb',
            minHeight: '38px',
            fontSize: '13px',
            borderRadius: '0.5rem',
            boxShadow: state.isFocused ? '0 0 0 1px var(--primary-color, #005429)' : 'none',
            '&:hover': {
                borderColor: 'var(--primary-color, #005429)',
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#374151',
            fontWeight: '500',
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '13px',
            color: state.isSelected ? 'white' : '#374151',
            backgroundColor: state.isSelected 
                ? 'var(--primary-color, #005429)' 
                : state.isFocused ? 'rgba(0, 84, 41, 0.05)' : 'white',
            cursor: 'pointer',
            '&:active': {
                backgroundColor: 'var(--primary-color, #005429)',
            }
        }),
    };

    const [products, setProducts] = useState([]);
    const [grandTotal, setGrandTotal] = useState(null);
    const [metadata, setMetadata] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedOutlet, setSelectedOutlet] = useState(searchParams.get('outlet') || "all");
    const [dateRange, setDateRange] = useState(() => {
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        if (startDateParam && endDateParam) {
            return {
                startDate: new Date(startDateParam),
                endDate: new Date(endDateParam),
            };
        }
        const today = new Date();
        return {
            startDate: today,
            endDate: today,
        };
    });

    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page'), 10) || 1);
    const ITEMS_PER_PAGE = 50;

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

    // Fetch products data
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
                    product: debouncedSearchTerm || undefined
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
            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load data. Please try again later.");
            setProducts([]);
            setGrandTotal(null);
            setMetadata(null);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when filters change
    useEffect(() => {
        if (dateRange?.startDate && dateRange?.endDate) {
            fetchData();
        }
    }, [dateRange, selectedOutlet, debouncedSearchTerm]);

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
            <div className="flex justify-between items-center px-6 py-4 mb-4">
                <h1 className="flex gap-2 items-center text-xl text-primary font-bold">
                    <span className="opacity-60 font-medium text-lg">Laporan</span>
                    <FaChevronRight className="opacity-30 text-xs mt-1" />
                    <Link to="/admin/sales-menu" className="opacity-60 font-medium text-lg hover:opacity-100 transition-opacity">Laporan Penjualan</Link>
                    <FaChevronRight className="opacity-30 text-xs mt-1" />
                    <span className="text-lg">Penjualan Produk</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={products.length === 0}
                    className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-white text-[13px] px-5 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                    <FaDownload />Ekspor Excel
                </button>
            </div>

            {/* Filters */}
            <div className="px-6 pb-6">
                <div className="flex justify-between py-3 gap-2">
                    <div className="relative text-gray-500 w-2/5">
                        <div className="w-2/5">
                            <Datepicker
                                showFooter
                                showShortcuts
                                value={dateRange}
                                onChange={handleDateRangeChange}
                                displayFormat="DD-MM-YYYY"
                                inputClassName="w-full text-[13px] border border-gray-200 py-2 pr-[25px] pl-[12px] rounded-lg cursor-pointer focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm h-[38px]"
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
                                className="h-[38px] w-full block text-[13px] border border-gray-200 py-2 px-3 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all shadow-sm"
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
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Produk</p>
                            <p className="text-xl font-black text-gray-900">{metadata.totalProducts}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Orders</p>
                            <p className="text-xl font-black text-gray-900">{metadata.totalOrders?.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Terjual</p>
                            <p className="text-xl font-black text-gray-900">{grandTotal.quantity?.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Penjualan</p>
                            <p className="text-xl font-black text-green-700">{formatCurrency(grandTotal.subtotal)}</p>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-md bg-white shadow-slate-200">
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50/50">
                                <th className="px-5 py-3 font-bold">No</th>
                                <th className="px-5 py-3 font-bold">Nama Produk</th>
                                <th className="px-5 py-3 font-bold">Kategori</th>
                                <th className="px-5 py-3 font-bold text-right">Qty Terjual</th>
                                <th className="px-5 py-3 font-bold text-right">Total Penjualan</th>
                                <th className="px-5 py-3 font-bold text-right">Rata-rata</th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                                {paginatedData.map((product, index) => (
                                    <tr key={index} className="text-left hover:bg-gray-50/50 transition-colors duration-150">
                                        <td className="px-5 py-2.5 text-gray-500 text-[11px]">
                                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                        </td>
                                        <td className="px-5 py-2.5">
                                            <p className="font-bold text-gray-800">{product.productName}</p>
                                        </td>
                                        <td className="px-5 py-2.5">
                                            <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-600 uppercase tracking-tight">{product.category}</span>
                                        </td>
                                        <td className="px-5 py-2.5 text-right font-medium text-[11px]">{product.quantity?.toLocaleString()}</td>
                                        <td className="px-5 py-2.5 text-right font-bold text-gray-800 text-[11px]">{formatCurrency(product.subtotal)}</td>
                                        <td className="px-5 py-2.5 text-right text-gray-500 text-[11px]">{formatCurrency(product.average)}</td>
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
                            <tfoot className="border-t font-bold text-xs bg-gray-50/50">
                                <tr>
                                    <td className="px-5 py-3 text-gray-900 border-r border-gray-100" colSpan="2">Grand Total</td>
                                    <td className="px-5 py-3 text-right">
                                        <p className="bg-white border border-gray-200 inline-block px-2 py-[2px] rounded-lg">
                                            {grandTotal.quantity?.toLocaleString()}
                                        </p>
                                    </td>
                                    <td className="px-5 py-3 text-right font-black">
                                        <p className="bg-green-100 text-green-700 inline-block px-2 py-[2px] rounded-lg">
                                            {formatCurrency(grandTotal.subtotal)}
                                        </p>
                                    </td>
                                    <td className="px-5 py-3 text-right font-bold">
                                        <p className="bg-white border border-gray-200 inline-block px-2 py-[2px] rounded-lg text-gray-600">
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