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
import TypeSalesSkeleton from "./skeleton";
import Paginated from "../../../../components/Paginated";
import { exportTypeSalesExcel } from '../../../../utils/exportTypeSalesExcel';
import useDebounce from "@/hooks/useDebounce";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = 'Asia/Jakarta';

const TypeSales = () => {
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

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOutlet, setSelectedOutlet] = useState(searchParams.get('outletId') || "");
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
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [groupedData, setGroupedData] = useState([]);
    const [grandTotal, setGrandTotal] = useState({ penjualanTotal: 0, count: 0 });
    const [totalPages, setTotalPages] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page'), 10) || 1);

    const ITEMS_PER_PAGE = 50;

    const formatDateForAPI = (date) => {
        if (!date) return null;
        return dayjs(date).tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD');
    };

    // Update URL when filters change
    const updateURLParams = useCallback((newDateRange, newOutlet, newSearch, newPage) => {
        const params = new URLSearchParams();

        if (newDateRange?.startDate && newDateRange?.endDate) {
            params.set('startDate', formatDateForAPI(newDateRange.startDate));
            params.set('endDate', formatDateForAPI(newDateRange.endDate));
        }

        if (newOutlet) params.set('outletId', newOutlet);
        if (newSearch) params.set('search', newSearch);
        if (newPage && newPage > 1) params.set('page', newPage.toString());

        setSearchParams(params);
    }, [setSearchParams]);

    // Fetch data from API
    const fetchData = useCallback(async () => {
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
            if (debouncedSearchTerm) params.search = debouncedSearchTerm;

            const response = await axios.get('/api/report/sales-report/transaction-type', { params });

            if (response.data.success) {
                setGroupedData(response.data.data.items || []);
                setGrandTotal(response.data.data.grandTotal || { penjualanTotal: 0, count: 0 });
                setTotalPages(response.data.data.pagination.totalPages || 1);
            } else {
                setError(response.data.message || 'Failed to fetch data');
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            setError(err.response?.data?.message || 'Terjadi kesalahan saat mengambil data');
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedOutlet, debouncedSearchTerm, currentPage]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
        const outletName = selectedOutlet
            ? outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet'
            : 'Semua Outlet';

        const dateRangeText = `${dayjs(dateRange.startDate).format('DD/MM/YYYY')} - ${dayjs(dateRange.endDate).format('DD/MM/YYYY')}`;
        const startDate = dayjs(dateRange.startDate).format('DD-MM-YYYY');
        const endDate = dayjs(dateRange.endDate).format('DD-MM-YYYY');

        setIsExporting(true);
        try {
            await exportTypeSalesExcel({
                data: groupedData,
                grandTotal: grandTotal,
                summary: {
                    totalTransactions: grandTotal.count,
                    totalRevenue: grandTotal.penjualanTotal,
                    averageTransaction: grandTotal.count > 0 ? Math.round(grandTotal.penjualanTotal / grandTotal.count) : 0
                },
                fileName: `Laporan_Tipe_Penjualan_${outletName.replace(/\s+/g, '_')}_${startDate}_${endDate}.xlsx`,
                headerInfo: [
                    ["Outlet", outletName],
                    ["Tanggal", dateRangeText],
                    ["Tanggal Export", dayjs().format('DD/MM/YYYY HH:mm:ss')]
                ]
            });
        } catch (error) {
            console.error("Export error:", error);
        } finally {
            setIsExporting(false);
        }
    };

    if (loading && groupedData.length === 0) return <TypeSalesSkeleton />;

    if (error) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="text-red-500 text-center bg-white p-8 rounded-2xl shadow-sm border">
                    <p className="text-xl font-bold mb-2">Terjadi Kesalahan</p>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={fetchData}
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
                    <span className="text-lg">Tipe Penjualan</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={isExporting || groupedData.length === 0}
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
                                placeholder="Cari tipe penjualan..."
                                value={searchTerm}
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
                            <tr className="text-left text-[13px] text-gray-400 border-b border-gray-50">
                                <th className="px-6 py-4 font-medium uppercase tracking-wider">Tipe Penjualan</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Jumlah Transaksi</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Total Transaksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {groupedData.length > 0 ? (
                                groupedData.map((group, index) => (
                                    <tr key={index} className="hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                                        <td className="px-6 py-4 text-gray-900 font-medium">{group.orderType}</td>
                                        <td className="px-6 py-4 text-right text-gray-600 font-medium">
                                            {group.count?.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                                            {formatCurrency(group.penjualanTotal)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="py-20 text-center text-gray-400">Tidak ada data ditemukan</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-gray-50/50 font-semibold text-sm border-t">
                            <tr>
                                <td className="px-6 py-4 text-gray-900 border-r border-gray-100">Grand Total</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="bg-white border border-gray-200 text-gray-900 inline-block px-3 py-1 rounded-lg">
                                        {grandTotal.count.toLocaleString('id-ID')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="bg-primary text-white inline-block px-3 py-1 rounded-lg">
                                        {formatCurrency(grandTotal.penjualanTotal)}
                                    </span>
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

export default TypeSales;
