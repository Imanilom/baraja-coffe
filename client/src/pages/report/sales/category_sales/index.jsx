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
import SalesCategorySkeleton from "./skeleton";
import { exportCategorySalesExcel } from "../../../../utils/exportCategorySalesExcel";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = 'Asia/Jakarta';

const CategorySales = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [groupedArray, setGroupedArray] = useState([]);

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
    const [grandTotal, setGrandTotal] = useState({ quantity: 0, subtotal: 0 });

    const formatDateForAPI = (date) => {
        if (!date) return null;
        return dayjs(date).tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD');
    };

    const parseDateFromURL = (dateStr) => {
        if (!dateStr) return null;
        return dayjs.tz(dateStr, DEFAULT_TIMEZONE);
    };

    // Get outlet name for export
    const outletName = useMemo(() => {
        if (!selectedOutlet) return "Semua Outlet";
        const outlet = outlets.find(o => o._id === selectedOutlet);
        return outlet ? outlet.name : "Semua Outlet";
    }, [selectedOutlet, outlets]);

    // Initialize from URL params or set default to today
    useEffect(() => {
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const outletParam = searchParams.get('outletId');
        const searchParam = searchParams.get('search');

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

            updateURLParams(newDateRange, outletParam || "", searchParam || "");
        }

        if (outletParam) {
            setSelectedOutlet(outletParam);
        }

        if (searchParam) {
            setSearchTerm(searchParam);
        }
    }, []);

    // Update URL when filters change
    const updateURLParams = useCallback((newDateRange, newOutlet, newSearch) => {
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

    // Fetch category sales data
    useEffect(() => {
        const fetchData = async () => {
            if (!dateRange?.startDate || !dateRange?.endDate) {
                return;
            }

            setLoading(true);
            try {
                const params = new URLSearchParams();

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

                const response = await axios.get(`/api/report/sales-report/transaction-category?${params.toString()}`);

                const categoryData = Array.isArray(response.data?.data)
                    ? response.data.data
                    : [];

                setGroupedArray(categoryData);

                if (response.data?.grandTotal) {
                    setGrandTotal(response.data.grandTotal);
                }

                setError(null);
            } catch (err) {
                console.error("Error fetching category sales:", err);
                setError("Failed to load category sales data.");
                setGroupedArray([]);
                setGrandTotal({ quantity: 0, subtotal: 0 });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dateRange, selectedOutlet, searchTerm]);

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

    const formatCurrency = (amount) => {
        if (isNaN(amount) || !isFinite(amount)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const exportToExcel = async () => {
        setIsExporting(true);

        const dateRangeText = dateRange?.startDate && dateRange?.endDate
            ? `${dayjs(dateRange.startDate).format('DD/MM/YYYY')} - ${dayjs(dateRange.endDate).format('DD/MM/YYYY')}`
            : dayjs().format('DD/MM/YYYY');

        const startDate = dayjs(dateRange.startDate).format('DD-MM-YYYY');
        const endDate = dayjs(dateRange.endDate).format('DD-MM-YYYY');

        exportCategorySalesExcel({
            data: groupedArray,
            grandTotal,
            fileName: `Laporan_Penjualan_Kategori_${outletName.replace(/\s+/g, '_')}_${startDate}_${endDate}.xlsx`,
            headerInfo: [
                ["Outlet", outletName],
                ["Periode", dateRangeText],
                ["Tanggal Export", dayjs().format('DD/MM/YYYY HH:mm:ss')]
            ]
        });

        setIsExporting(false);
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
                        {loading ? (
                            <tbody>
                                <tr>
                                    <td colSpan={4} className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-900 mx-auto"></div>
                                    </td>
                                </tr>
                            </tbody>
                        ) : groupedArray.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {groupedArray.map((group, index) => {
                                    const average = group.average !== undefined
                                        ? group.average
                                        : (group.quantity > 0 && group.subtotal > 0
                                            ? group.subtotal / group.quantity
                                            : 0);

                                    return (
                                        <tr
                                            key={`${group.category}-${index}`}
                                            className="text-left text-sm hover:bg-gray-50 transition-colors duration-150"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {group.category || 'Tanpa Kategori'}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {group.quantity?.toLocaleString('id-ID') || '0'}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {formatCurrency(group.subtotal || 0)}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {formatCurrency(average)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr>
                                    <td colSpan={4} className="py-12 text-center w-full">
                                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                            <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                            </svg>
                                            <p className="text-lg font-medium text-gray-500">
                                                Tidak ada data ditemukan
                                            </p>
                                            <p className="text-sm text-gray-400 mt-1">
                                                Data akan muncul di sini setelah ditambahkan
                                            </p>
                                        </div>
                                    </td>
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