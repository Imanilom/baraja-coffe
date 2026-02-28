import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Link, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaDownload } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import Paginated from "../../../../components/paginated";
import CustomerSalesSkeleton from "./skeleton";
import { exportCustomerSalesExcel } from '../../../../utils/exportCustomerSalesExcel';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = 'Asia/Jakarta';

const CustomerSales = () => {
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

    const [customerData, setCustomerData] = useState([]);
    const [allCustomerData, setAllCustomerData] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [dateRange, setDateRange] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10
    });
    const [summary, setSummary] = useState({
        totalCustomers: 0,
        totalTransactions: 0,
        totalSales: 0,
        averagePerCustomer: 0,
        averagePerTransaction: 0,
        topCustomers: {
            byTransactionCount: null,
            bySales: null
        }
    });

    const ITEMS_PER_PAGE = 10;

    const formatDateForAPI = (date) => {
        if (!date) return null;
        return dayjs(date).tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD');
    };

    const parseDateFromURL = (dateStr) => {
        if (!dateStr) return null;
        return dayjs.tz(dateStr, DEFAULT_TIMEZONE);
    };

    // Initialize from URL params or set default to today
    useEffect(() => {
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const outletParam = searchParams.get('outlet');
        const searchParam = searchParams.get('search');
        const pageParam = searchParams.get('page');

        if (startDateParam && endDateParam) {
            setDateRange({
                startDate: parseDateFromURL(startDateParam),
                endDate: parseDateFromURL(endDateParam),
            });
        } else {
            const today = dayjs().tz(DEFAULT_TIMEZONE);
            const newDateRange = {
                startDate: today,
                endDate: today
            };
            setDateRange(newDateRange);

            updateURLParams(1, searchParam || "", outletParam || "", newDateRange);
        }

        if (outletParam) {
            setSelectedOutlet(outletParam);
        }

        if (searchParam) {
            setSearch(searchParam);
        }

        if (pageParam) {
            setCurrentPage(parseInt(pageParam, 10));
        }
    }, []);

    // Update URL when filters change
    const updateURLParams = useCallback((newPage, newSearch, newOutlet, newDateRange) => {
        const params = new URLSearchParams();

        if (newDateRange?.startDate && newDateRange?.endDate) {
            const startDate = formatDateForAPI(newDateRange.startDate);
            const endDate = formatDateForAPI(newDateRange.endDate);
            params.set('startDate', startDate);
            params.set('endDate', endDate);
        }

        if (newOutlet) {
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
            }
        };

        fetchOutlets();
    }, []);

    // Fetch customer sales data
    const fetchCustomerSales = useCallback(async () => {
        if (!dateRange?.startDate || !dateRange?.endDate) return;

        setLoading(true);
        try {
            const params = {
                startDate: formatDateForAPI(dateRange.startDate),
                endDate: formatDateForAPI(dateRange.endDate),
                page: currentPage,
                limit: ITEMS_PER_PAGE
            };

            if (selectedOutlet) {
                params.outletId = selectedOutlet;
            }

            if (search) {
                params.search = search;
            }

            const response = await axios.get('/api/report/sales-report/transaction-customer', { params });

            if (response.data.success) {
                setCustomerData(response.data.data || []);
                setAllCustomerData(response.data.allData || []);
                setPagination(response.data.pagination || {
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: ITEMS_PER_PAGE
                });
                setSummary(response.data.summary || {
                    totalCustomers: 0,
                    totalTransactions: 0,
                    totalSales: 0,
                    averagePerCustomer: 0,
                    averagePerTransaction: 0,
                    topCustomers: {
                        byTransactionCount: null,
                        bySales: null
                    }
                });
                setError(null);
            }
        } catch (err) {
            console.error("Error fetching customer sales:", err);
            setError("Failed to load data. Please try again later.");
            setCustomerData([]);
            setAllCustomerData([]);
            setPagination({ totalPages: 0, totalItems: 0, itemsPerPage: ITEMS_PER_PAGE });
            setSummary({
                totalCustomers: 0,
                totalTransactions: 0,
                totalSales: 0,
                averagePerCustomer: 0,
                averagePerTransaction: 0,
                topCustomers: {
                    byTransactionCount: null,
                    bySales: null
                }
            });
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedOutlet, search, currentPage]);

    // Auto-fetch when filters change
    useEffect(() => {
        fetchCustomerSales();
    }, [fetchCustomerSales]);

    // Handler functions
    const handleDateRangeChange = (newValue) => {
        setDateRange(newValue);
        setCurrentPage(1);
        updateURLParams(1, search, selectedOutlet, newValue);
    };

    const handleSearchChange = (e) => {
        const newSearch = e.target.value;
        setSearch(newSearch);
        setCurrentPage(1);
        updateURLParams(1, newSearch, selectedOutlet, dateRange);
    };

    const handleOutletChange = (selected) => {
        const newOutlet = selected?.value || "";
        setSelectedOutlet(newOutlet);
        setCurrentPage(1);
        updateURLParams(1, search, newOutlet, dateRange);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        updateURLParams(newPage, search, selectedOutlet, dateRange);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const options = useMemo(() => [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((o) => ({ value: o._id, label: o.name })),
    ], [outlets]);

    const formatCurrency = (amount) => {
        if (isNaN(amount) || !isFinite(amount)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Export to Excel
    const exportToExcel = async () => {
        if (allCustomerData.length === 0) {
            alert("Tidak ada data untuk diekspor");
            return;
        }

        setIsExporting(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const outletName = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet'
                : 'Semua Outlet';

            const dateRangeText = dateRange?.startDate && dateRange?.endDate
                ? `${dayjs(dateRange.startDate).format('DD/MM/YYYY')} - ${dayjs(dateRange.endDate).format('DD/MM/YYYY')}`
                : dayjs().format('DD/MM/YYYY');

            const startDate = dayjs(dateRange.startDate).format('DD-MM-YYYY');
            const endDate = dayjs(dateRange.endDate).format('DD-MM-YYYY');

            await exportCustomerSalesExcel({
                data: allCustomerData,
                summary,
                fileName: `Laporan_Penjualan_Per_Pelanggan_${outletName.replace(/\s+/g, '_')}_${startDate}_${endDate}.xlsx`,
                headerInfo: [
                    ['Outlet', outletName],
                    ['Tanggal', dateRangeText],
                    ['Tanggal Export', dayjs().format('DD/MM/YYYY HH:mm:ss')]
                ]
            });

        } catch (error) {
            console.error("Error exporting to Excel:", error);
            alert("Gagal mengekspor data. Silakan coba lagi.");
        } finally {
            setIsExporting(false);
        }
    };

    // Show loading state
    if (loading && !dateRange) {
        return <CustomerSalesSkeleton />;
    }

    // Show error state
    if (error && !loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p>{error}</p>
                    <button
                        onClick={fetchCustomerSales}
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
                    <span>Penjualan Per Pelanggan</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={isExporting || allCustomerData.length === 0}
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
                {/* Top Customers Info */}
                {(summary.topCustomers?.byTransactionCount || summary.topCustomers?.bySales) && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {summary.topCustomers.byTransactionCount && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="text-xs text-blue-600 font-semibold mb-1">
                                    🏆 Pelanggan Paling Sering Transaksi
                                </div>
                                <div className="text-sm font-bold text-blue-900">
                                    {summary.topCustomers.byTransactionCount.customerName}
                                </div>
                                <div className="text-xs text-blue-700 mt-1">
                                    {summary.topCustomers.byTransactionCount.transactionCount.toLocaleString('id-ID')} transaksi • {formatCurrency(summary.topCustomers.byTransactionCount.totalSales)}
                                </div>
                            </div>
                        )}
                        {summary.topCustomers.bySales && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="text-xs text-green-600 font-semibold mb-1">
                                    💰 Pelanggan Pembelian Terbesar
                                </div>
                                <div className="text-sm font-bold text-green-900">
                                    {summary.topCustomers.bySales.customerName}
                                </div>
                                <div className="text-xs text-green-700 mt-1">
                                    {formatCurrency(summary.topCustomers.bySales.totalSales)} • {summary.topCustomers.bySales.transactionCount.toLocaleString('id-ID')} transaksi
                                </div>
                            </div>
                        )}
                    </div>
                )}

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
                                value={search}
                                placeholder="Pelanggan / Telepon"
                                onChange={handleSearchChange}
                                className="text-[13px] border py-2 pr-[25px] pl-[12px] rounded"
                            />
                        </div>

                        <div className="flex flex-col col-span-3">
                            <Select
                                options={options}
                                value={options.find((opt) => opt.value === selectedOutlet) || options[0]}
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
                                <th className="px-4 py-3 font-normal">Pelanggan</th>
                                <th className="px-4 py-3 font-normal text-right">Tipe Pelanggan</th>
                                <th className="px-4 py-3 font-normal text-right">Telepon</th>
                                <th className="px-4 py-3 font-normal text-right">Jumlah Transaksi</th>
                                <th className="px-4 py-3 font-normal text-right">Total</th>
                                <th className="px-4 py-3 font-normal text-right">Rata-rata</th>
                            </tr>
                        </thead>
                        {loading ? (
                            <tbody>
                                <tr>
                                    <td colSpan={6} className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-900 mx-auto"></div>
                                    </td>
                                </tr>
                            </tbody>
                        ) : customerData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {customerData.map((customer, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">{customer.customerName || 'Walk-in Customer'}</td>
                                        <td className="px-4 py-3 text-right">{customer.customerType || '-'}</td>
                                        <td className="px-4 py-3 text-right">{customer.customerPhone || '-'}</td>
                                        <td className="px-4 py-3 text-right">
                                            {customer.transactionCount?.toLocaleString('id-ID') || 0}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {formatCurrency(customer.totalSales || 0)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {formatCurrency(customer.averagePerTransaction || 0)}
                                        </td>
                                    </tr>
                                ))}
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
                                <td className="px-4 py-2" colSpan={3}>Grand Total</td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {summary.totalTransactions?.toLocaleString('id-ID') || 0}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(summary.totalSales || 0)}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(summary.averagePerTransaction || 0)}
                                    </p>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <Paginated
                    currentPage={currentPage}
                    setCurrentPage={handlePageChange}
                    totalPages={pagination.totalPages}
                />
            </div>
        </div>
    );
};

export default CustomerSales;