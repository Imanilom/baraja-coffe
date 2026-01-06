import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Link, useSearchParams } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaDownload } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import TypeSalesSkeleton from "./skeleton";
import Paginated from "../../../../components/paginated";
import { exportTypeSalesExcel } from '../../../../utils/exportTypeSalesExcel';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = 'Asia/Jakarta';

const TypeSales = () => {
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [dateRange, setDateRange] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [groupedData, setGroupedData] = useState([]);
    const [grandTotal, setGrandTotal] = useState({ penjualanTotal: 0, count: 0 });
    const [totalPages, setTotalPages] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const ITEMS_PER_PAGE = 50;

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
        const outletParam = searchParams.get('outletId');
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

            updateURLParams(newDateRange, outletParam || "", searchParam || "", parseInt(pageParam, 10) || 1);
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

    // Fetch outlets data
    useEffect(() => {
        const fetchOutlets = async () => {
            try {
                const response = await axios.get('/api/outlet');
                setOutlets(response.data.data || []);
            } catch (err) {
                console.error("Error fetching outlets:", err);
            }
        };
        fetchOutlets();
    }, []);

    // Update URL when filters change
    const updateURLParams = useCallback((newDateRange, newOutlet, newSearch, newPage) => {
        const params = new URLSearchParams();

        if (newDateRange?.startDate && newDateRange?.endDate) {
            const startDate = formatDateForAPI(newDateRange.startDate);
            const endDate = formatDateForAPI(newDateRange.endDate);
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

    // Fetch data from API
    useEffect(() => {
        const fetchData = async () => {
            // Skip if dateRange is not set yet
            if (!dateRange?.startDate || !dateRange?.endDate) {
                return;
            }

            setLoading(true);
            try {
                const params = new URLSearchParams();

                // Format dates properly
                const startDate = formatDateForAPI(dateRange.startDate);
                const endDate = formatDateForAPI(dateRange.endDate);

                params.append('startDate', startDate);
                params.append('endDate', endDate);

                if (selectedOutlet) {
                    params.append('outletId', selectedOutlet);
                }
                if (searchTerm) {
                    params.append('search', searchTerm);
                }
                params.append('page', currentPage);
                params.append('limit', ITEMS_PER_PAGE);

                const response = await axios.get(`/api/report/sales-report/transaction-type?${params}`);

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
        };

        fetchData();
    }, [dateRange, selectedOutlet, searchTerm, currentPage]);

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

    // Export to Excel - Using data from API
    const exportToExcel = async () => {
        const outletName = selectedOutlet
            ? outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet'
            : 'Semua Outlet';

        const dateRangeText = dateRange?.startDate && dateRange?.endDate
            ? `${dayjs(dateRange.startDate).format('DD/MM/YYYY')} - ${dayjs(dateRange.endDate).format('DD/MM/YYYY')}`
            : dayjs().format('DD/MM/YYYY');

        const startDate = dayjs(dateRange.startDate).format('DD-MM-YYYY');
        const endDate = dayjs(dateRange.endDate).format('DD-MM-YYYY');

        await exportTypeSalesExcel({
            data: groupedData,
            grandTotal: grandTotal,
            summary: {
                totalTransactions: grandTotal.count,
                totalRevenue: grandTotal.penjualanTotal,
                averageTransaction: grandTotal.count > 0
                    ? Math.round(grandTotal.penjualanTotal / grandTotal.count)
                    : 0
            },
            fileName: `Laporan_Tipe_Penjualan_${outletName.replace(/\s+/g, '_')}_${startDate}_${endDate}.xlsx`,
            headerInfo: [
                ["Outlet", outletName],
                ["Tanggal", dateRangeText],
                ["Tanggal Export", dayjs().format('DD/MM/YYYY HH:mm:ss')]
            ]
        });
    };

    // Show loading state
    if (loading && !dateRange) {
        return <TypeSalesSkeleton />;
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
                    <span>Tipe Penjualan</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={isExporting || groupedData.length === 0}
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
                                placeholder="Tipe Penjualan"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="text-[13px] border py-2 pr-[25px] pl-[12px] rounded focus:ring-1 focus:ring-green-900 focus:outline-none"
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
                                <th className="px-4 py-3 font-normal">Tipe Penjualan</th>
                                <th className="px-4 py-3 font-normal text-right">Jumlah Transaksi</th>
                                <th className="px-4 py-3 font-normal text-right">Total Transaksi</th>
                                <th className="px-4 py-3 font-normal text-right">Total Fee</th>
                            </tr>
                        </thead>
                        {loading ? (
                            <tbody>
                                <tr>
                                    <td colSpan={4} className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-900 mx-auto"></div>
                                    </td>
                                </tr>
                            </tbody>
                        ) : groupedData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {groupedData.map((group, index) => (
                                    <tr key={index} className="text-left text-sm hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            {group.orderType}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {group.count.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {formatCurrency(group.penjualanTotal)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {formatCurrency(0)}
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
                                        {grandTotal.count.toLocaleString('id-ID')}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(grandTotal.penjualanTotal)}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(0)}
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

export default TypeSales;