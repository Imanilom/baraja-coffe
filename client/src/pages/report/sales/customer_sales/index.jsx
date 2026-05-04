import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Link, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaDownload } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import { useSelector } from "react-redux";
import Select from "react-select";
import Paginated from "../../../../components/paginated";
import CustomerSalesSkeleton from "./skeleton";
import { exportCustomerSalesExcel } from '../../../../utils/exportCustomerSalesExcel';
import useDebounce from "@/hooks/useDebounce";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = 'Asia/Jakarta';

const CustomerSales = () => {
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

    const [customerData, setCustomerData] = useState([]);
    const [allCustomerData, setAllCustomerData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState(searchParams.get('search') || "");
    const debouncedSearch = useDebounce(search, 500);
    const [selectedOutlet, setSelectedOutlet] = useState(searchParams.get('outlet') || "");

    const [dateRange, setDateRange] = useState(() => {
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        if (startDateParam && endDateParam) {
            return {
                startDate: dayjs.tz(startDateParam, DEFAULT_TIMEZONE),
                endDate: dayjs.tz(endDateParam, DEFAULT_TIMEZONE),
            };
        }
        const today = dayjs().tz(DEFAULT_TIMEZONE);
        return { startDate: today, endDate: today };
    });

    const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page'), 10) || 1);
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

    // Update URL when filters change
    const updateURLParams = useCallback((newPage, newSearch, newOutlet, newDateRange) => {
        const params = new URLSearchParams();

        if (newDateRange?.startDate && newDateRange?.endDate) {
            params.set('startDate', formatDateForAPI(newDateRange.startDate));
            params.set('endDate', formatDateForAPI(newDateRange.endDate));
        }

        if (newOutlet) params.set('outlet', newOutlet);
        if (newSearch) params.set('search', newSearch);
        if (newPage && newPage > 1) params.set('page', newPage.toString());

        setSearchParams(params);
    }, [setSearchParams]);

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

            if (selectedOutlet) params.outletId = selectedOutlet;
            if (debouncedSearch) params.search = debouncedSearch;

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
                    topCustomers: { byTransactionCount: null, bySales: null }
                });
                setError(null);
            }
        } catch (err) {
            console.error("Error fetching customer sales:", err);
            setError("Gagal memuat data. Silakan coba lagi nanti.");
            setCustomerData([]);
            setAllCustomerData([]);
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedOutlet, debouncedSearch, currentPage]);

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
            const outletName = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet'
                : 'Semua Outlet';

            const dateRangeText = `${dayjs(dateRange.startDate).format('DD/MM/YYYY')} - ${dayjs(dateRange.endDate).format('DD/MM/YYYY')}`;
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

    if (loading && customerData.length === 0) return <CustomerSalesSkeleton />;

    if (error && !loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="text-red-500 text-center bg-white p-8 rounded-2xl shadow-sm border">
                    <p className="text-xl font-bold mb-2">Terjadi Kesalahan</p>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={fetchCustomerSales}
                        className="bg-primary text-white text-[13px] px-6 py-2 rounded-lg hover:bg-primary/90 transition-all font-medium"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent">
            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-4 mb-4">
                <h1 className="flex gap-2 items-center text-xl text-primary font-bold">
                    <span className="opacity-60 font-medium text-lg">Laporan</span>
                    <FaChevronRight className="opacity-30 text-xs mt-1" />
                    <Link to="/admin/sales-menu" className="opacity-60 font-medium text-lg hover:opacity-100 transition-opacity">Laporan Penjualan</Link>
                    <FaChevronRight className="opacity-30 text-xs mt-1" />
                    <span className="text-lg">Penjualan Per Pelanggan</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={isExporting || allCustomerData.length === 0}
                    className="bg-primary hover:bg-primary/90 text-white text-[13px] px-5 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95"
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

            <div className="px-6">
                {/* Summary Cards */}
                {(summary.topCustomers?.byTransactionCount || summary.topCustomers?.bySales) && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {summary.topCustomers.byTransactionCount && (
                            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                                <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">🏆 Paling Sering Transaksi</div>
                                <div className="text-[13px] font-black text-blue-900">{summary.topCustomers.byTransactionCount.customerName}</div>
                                <div className="text-[11px] text-blue-700 mt-0.5">
                                    {summary.topCustomers.byTransactionCount.transactionCount.toLocaleString('id-ID')} transaksi • {formatCurrency(summary.topCustomers.byTransactionCount.totalSales)}
                                </div>
                            </div>
                        )}
                        {summary.topCustomers.bySales && (
                            <div className="bg-green-50/50 border border-green-100 rounded-lg p-3">
                                <div className="text-[10px] text-green-600 font-bold uppercase tracking-wider mb-1">💰 Pembelian Terbesar</div>
                                <div className="text-[13px] font-black text-green-900">{summary.topCustomers.bySales.customerName}</div>
                                <div className="text-[11px] text-green-700 mt-0.5">
                                    {formatCurrency(summary.topCustomers.bySales.totalSales)} • {summary.topCustomers.bySales.transactionCount.toLocaleString('id-ID')} transaksi
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-between py-3 gap-4">
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

                    <div className="flex justify-end gap-3 w-1/2">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={search}
                                placeholder="Cari pelanggan / telepon..."
                                onChange={handleSearchChange}
                                className="w-full text-[13px] border border-gray-200 py-2 pr-[25px] pl-[12px] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm h-[38px] focus:outline-none"
                            />
                        </div>

                        <div className="w-1/3">
                            <Select
                                options={options}
                                value={options.find((opt) => opt.value === selectedOutlet) || options[0]}
                                onChange={handleOutletChange}
                                placeholder="Semua Outlet"
                                className="text-[13px]"
                                classNamePrefix="react-select"
                                styles={customStyles}
                                isSearchable
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-100 bg-white">
                    <table className="min-w-full table-auto">
                        <thead>
                                <tr className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                                    <th className="px-5 py-3 font-bold">Pelanggan</th>
                                    <th className="px-5 py-3 font-bold text-right">Tipe</th>
                                    <th className="px-5 py-3 font-bold text-right">Telepon</th>
                                    <th className="px-5 py-3 font-bold text-right">Jml Transaksi</th>
                                    <th className="px-5 py-3 font-bold text-right">Total</th>
                                    <th className="px-5 py-3 font-bold text-right">Rata-rata</th>
                                </tr>
                        </thead>
                        <tbody className="text-sm">
                            {customerData.length > 0 ? (
                                customerData.map((customer, index) => (
                                    <tr key={index} className="hover:bg-gray-50/50 border-b border-gray-50 last:border-0 transition-colors duration-150">
                                        <td className="px-5 py-2.5">
                                            <div className="font-bold text-gray-800 text-xs">{customer.customerName || 'Walk-in Customer'}</div>
                                            <div className="text-[10px] text-gray-400 font-medium">ID: {customer.customerId || '-'}</div>
                                        </td>
                                        <td className="px-5 py-2.5 text-right">
                                            <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-600 uppercase tracking-tight">
                                                {customer.customerType || '-'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-2.5 text-right text-gray-600 text-[11px]">{customer.customerPhone || '-'}</td>
                                        <td className="px-5 py-2.5 text-right text-gray-700 font-medium text-[11px]">{customer.transactionCount?.toLocaleString('id-ID') || 0}</td>
                                        <td className="px-5 py-2.5 text-right text-gray-900 font-black text-[11px]">{formatCurrency(customer.totalSales || 0)}</td>
                                        <td className="px-5 py-2.5 text-right text-primary font-bold text-[11px]">{formatCurrency(customer.averagePerTransaction || 0)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-gray-400">Tidak ada data ditemukan</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-gray-50/50 font-bold text-xs border-t">
                            <tr>
                                <td className="px-5 py-3 text-gray-900 border-r border-gray-100" colSpan={3}>Grand Total</td>
                                <td className="px-5 py-3 text-right">
                                    <span className="bg-white border border-gray-200 text-gray-900 inline-block px-3 py-1 rounded-lg">
                                        {summary.totalTransactions?.toLocaleString('id-ID') || 0}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <span className="bg-primary text-white inline-block px-3 py-1 rounded-lg">
                                        {formatCurrency(summary.totalSales || 0)}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <span className="bg-white border border-gray-200 text-primary inline-block px-3 py-1 rounded-lg">
                                        {formatCurrency(summary.averagePerTransaction || 0)}
                                    </span>
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