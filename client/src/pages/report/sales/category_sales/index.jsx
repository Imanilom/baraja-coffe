import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import axios from '@/lib/axios';
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

import useDebounce from "../../../../hooks/useDebounce";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = 'Asia/Jakarta';

const CategorySales = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { outlets } = useSelector((state) => state.outlet);

    const [groupedArray, setGroupedArray] = useState([]);

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

    const [isExporting, setIsExporting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOutlet, setSelectedOutlet] = useState(searchParams.get('outletId') || "");
    const [selectedType, setSelectedType] = useState(searchParams.get('type') || ""); // ✅ State untuk filter type
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
        return {
            startDate: today,
            endDate: today,
        };
    });
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [grandTotal, setGrandTotal] = useState({ quantity: 0, subtotal: 0 });

    const formatDateForAPI = (date) => {
        if (!date) return null;
        return dayjs(date).tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD');
    };

    // Get outlet name for export
    const outletName = useMemo(() => {
        if (!selectedOutlet) return "Semua Outlet";
        const outlet = outlets.find(o => o._id === selectedOutlet);
        return outlet ? outlet.name : "Semua Outlet";
    }, [selectedOutlet, outlets]);

    // ✅ Options untuk filter type
    const typeOptions = [
        { value: "", label: "Semua Type" },
        { value: "food", label: "Food" },
        { value: "beverage", label: "Beverage" },
        { value: "event", label: "Event" },
    ];

    // Update URL when filters change
    const updateURLParams = useCallback((newDateRange, newOutlet, newSearch, newType) => {
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

        if (newType) {
            params.set('type', newType);
        }

        setSearchParams(params);
    }, [setSearchParams]);

    // Fetch category sales data
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

            if (debouncedSearchTerm) {
                params.append('category', debouncedSearchTerm);
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

    useEffect(() => {
        fetchData();
    }, [dateRange, selectedOutlet, debouncedSearchTerm]);

    // ✅ Filter data berdasarkan type (client-side filtering)
    const filteredData = useMemo(() => {
        if (!selectedType) return groupedArray;

        return groupedArray.filter(item => {
            // Filter berdasarkan type dari category
            return item.type === selectedType;
        });
    }, [groupedArray, selectedType]);

    // ✅ Recalculate grandTotal based on filteredData
    const recalculatedGrandTotal = useMemo(() => {
        if (!selectedType) return grandTotal;

        return filteredData.reduce((acc, item) => {
            return {
                quantity: acc.quantity + (item.quantity || 0),
                subtotal: acc.subtotal + (item.subtotal || 0),
                average: 0 // will calculate below
            };
        }, { quantity: 0, subtotal: 0, average: 0 });
    }, [filteredData, selectedType, grandTotal]);

    // Calculate average for recalculated grand total
    if (recalculatedGrandTotal.quantity > 0) {
        recalculatedGrandTotal.average = recalculatedGrandTotal.subtotal / recalculatedGrandTotal.quantity;
    }

    // Handler functions
    const handleDateRangeChange = (newValue) => {
        setDateRange(newValue);
        updateURLParams(newValue, selectedOutlet, searchTerm, selectedType);
    };

    const handleOutletChange = (selected) => {
        const newOutlet = selected?.value || "";
        setSelectedOutlet(newOutlet);
        updateURLParams(dateRange, newOutlet, searchTerm, selectedType);
    };

    const handleSearchChange = (e) => {
        const newSearch = e.target.value;
        setSearchTerm(newSearch);
        updateURLParams(dateRange, selectedOutlet, newSearch, selectedType);
    };

    // ✅ Handler untuk filter type
    const handleTypeChange = (selected) => {
        const newType = selected?.value || "";
        setSelectedType(newType);
        updateURLParams(dateRange, selectedOutlet, searchTerm, newType);
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

        const typeLabel = selectedType
            ? typeOptions.find(opt => opt.value === selectedType)?.label
            : "Semua Type";

        exportCategorySalesExcel({
            data: filteredData,
            grandTotal: recalculatedGrandTotal,
            fileName: `Laporan_Penjualan_Kategori_${outletName.replace(/\s+/g, '_')}_${startDate}_${endDate}.xlsx`,
            headerInfo: [
                ["Outlet", outletName],
                ["Type", typeLabel],
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
            <div className="flex justify-between items-center px-6 py-4 mb-4">
                <h1 className="flex gap-2 items-center text-xl text-primary font-bold">
                    <span className="opacity-60 font-medium text-lg">Laporan</span>
                    <FaChevronRight className="opacity-30 text-xs mt-1" />
                    <Link to="/admin/sales-menu" className="opacity-60 font-medium text-lg hover:opacity-100 transition-opacity">Laporan Penjualan</Link>
                    <FaChevronRight className="opacity-30 text-xs mt-1" />
                    <span className="text-lg">Penjualan Per Kategori</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={isExporting || filteredData.length === 0}
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
                                inputClassName="w-full text-[13px] border border-gray-200 py-2 pr-[25px] pl-[12px] rounded-lg cursor-pointer focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm h-[38px]"
                                popoverDirection="down"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 w-3/5">
                        <div className="flex flex-col w-1/4">
                            <input
                                type="text"
                                placeholder="Cari Kategori..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="h-[38px] text-[13px] border border-gray-200 py-2 px-3 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all shadow-sm"
                            />
                        </div>

                        {/* ✅ Filter Type */}
                        <div className="flex flex-col col-span-3 w-1/4">
                            <Select
                                options={typeOptions}
                                value={
                                    selectedType
                                        ? typeOptions.find((opt) => opt.value === selectedType)
                                        : typeOptions[0]
                                }
                                onChange={handleTypeChange}
                                placeholder="Pilih type..."
                                className="text-[13px]"
                                classNamePrefix="react-select"
                                styles={customStyles}
                                isSearchable
                            />
                        </div>

                        <div className="flex flex-col col-span-3 w-1/4">
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
                        <thead>
                            <tr className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                                <th className="px-5 py-3 font-bold">Kategori</th>
                                <th className="px-5 py-3 font-bold">Type</th>
                                <th className="px-5 py-3 font-bold text-right">Terjual</th>
                                <th className="px-5 py-3 font-bold text-right">Penjualan Bersih</th>
                                <th className="px-5 py-3 font-bold text-right">Rata-Rata</th>
                            </tr>
                        </thead>
                        {loading ? (
                            <tbody>
                                <tr>
                                    <td colSpan={5} className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-900 mx-auto"></div>
                                    </td>
                                </tr>
                            </tbody>
                        ) : filteredData.length > 0 ? (
                            <tbody className="text-xs text-gray-700 divide-y divide-gray-50">
                                {filteredData.map((group, index) => {
                                    const average = group.average !== undefined
                                        ? group.average
                                        : (group.quantity > 0 && group.subtotal > 0
                                            ? group.subtotal / group.quantity
                                            : 0);

                                    return (
                                        <tr
                                            key={`${group.category}-${index}`}
                                            className="text-left hover:bg-gray-50/50 transition-colors duration-150"
                                        >
                                            <td className="px-5 py-2.5 font-bold text-gray-800">
                                                {group.category || 'Tanpa Kategori'}
                                            </td>
                                            <td className="px-5 py-2.5">
                                                {group.type ? (
                                                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-gray-100 text-gray-600 uppercase tracking-tight">
                                                        {group.type}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-2.5 text-right font-medium text-gray-700 text-[11px]">
                                                {group.quantity?.toLocaleString('id-ID') || '0'}
                                            </td>
                                            <td className="px-5 py-2.5 text-right font-black text-gray-900 text-[11px]">
                                                {formatCurrency(group.subtotal || 0)}
                                            </td>
                                            <td className="px-5 py-2.5 text-right font-bold text-primary text-[11px]">
                                                {formatCurrency(average)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr>
                                    <td colSpan={5} className="py-12 text-center w-full">
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
                        <tfoot className="border-t font-bold text-xs bg-gray-50/50">
                            <tr>
                                <td className="px-5 py-3 text-gray-900 border-r border-gray-100" colSpan={2}>Grand Total</td>
                                <td className="px-5 py-3 text-right">
                                    <p className="bg-white border border-gray-200 inline-block px-3 py-1 rounded-lg">
                                        {recalculatedGrandTotal.quantity.toLocaleString('id-ID')}
                                    </p>
                                </td>
                                <td className="px-5 py-3 text-right font-black">
                                    <p className="bg-primary text-white inline-block px-3 py-1 rounded-lg">
                                        {formatCurrency(recalculatedGrandTotal.subtotal)}
                                    </p>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <p className="bg-white border border-gray-200 text-primary inline-block px-3 py-1 rounded-lg">
                                        {formatCurrency(recalculatedGrandTotal.average)}
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