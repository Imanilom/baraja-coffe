import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { Link, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaDownload } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import { useSelector } from "react-redux";
import Select from "react-select";
import Paginated from "../../../../components/paginated";
import SalesHourlySkeleton from "./skeleton";
import { exportHourlySalesExcel } from '../../../../utils/exportHourlySalesExcel';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const HourlySales = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { outlets } = useSelector((state) => state.outlet);

    const [grandTotalItems, setGrandTotalItems] = useState(0);
    const [grandTotalPenjualan, setGrandTotalPenjualan] = useState(0);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    const [selectedOutlet, setSelectedOutlet] = useState(searchParams.get('outletId') || "");
    const [dateRange, setDateRange] = useState(() => {
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        if (startDateParam && endDateParam) {
            return { startDate: startDateParam, endDate: endDateParam };
        }
        const today = dayjs().format('YYYY-MM-DD');
        return { startDate: today, endDate: today };
    });

    const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page'), 10) || 1);
    const ITEMS_PER_PAGE = 50;

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

    // Update URL params
    const updateURLParams = useCallback((newDateRange, newOutlet, newPage) => {
        const params = new URLSearchParams();

        if (newDateRange?.startDate && newDateRange?.endDate) {
            params.set('startDate', dayjs(newDateRange.startDate).format('YYYY-MM-DD'));
            params.set('endDate', dayjs(newDateRange.endDate).format('YYYY-MM-DD'));
        }

        if (newOutlet) params.set('outletId', newOutlet);
        if (newPage && newPage > 1) params.set('page', newPage.toString());

        setSearchParams(params);
    }, [setSearchParams]);

    // Fetch data
    const fetchData = useCallback(async () => {
        if (!dateRange) return;

        setLoading(true);
        try {
            const params = {
                startDate: dayjs(dateRange.startDate).format('YYYY-MM-DD'),
                endDate: dayjs(dateRange.endDate).format('YYYY-MM-DD')
            };

            if (selectedOutlet) params.outlet = selectedOutlet;

            const response = await axios.get('/api/report/hourly-profit/range', { params });

            if (!response.data?.success) {
                throw new Error('Invalid response');
            }

            setProducts(response.data.data || []);
            setGrandTotalItems(response.data.metadata?.grandTotalItems || 0);
            setGrandTotalPenjualan(response.data.metadata?.grandTotalPenjualan || 0);
            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError(err.response?.data?.message || err.message || "Failed to load data");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedOutlet]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handlers
    const handleDateRangeChange = (newValue) => {
        if (newValue?.startDate && newValue?.endDate) {
            setDateRange(newValue);
            setCurrentPage(1);
            updateURLParams(newValue, selectedOutlet, 1);
        }
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

    const options = useMemo(() => [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((o) => ({ value: o._id, label: o.name })),
    ], [outlets]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return products.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [products, currentPage]);

    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Export to Excel
    const exportToExcel = async () => {
        if (products.length === 0) {
            alert("Tidak ada data untuk diekspor");
            return;
        }

        setIsExporting(true);
        try {
            const outletName = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet'
                : 'Semua Outlet';

            const startDate = dayjs(dateRange.startDate).format('DD-MM-YYYY');
            const endDate = dayjs(dateRange.endDate).format('DD-MM-YYYY');
            const dateRangeText = `${startDate} - ${endDate}`;

            await exportHourlySalesExcel({
                data: products,
                grandTotalItems,
                grandTotalPenjualan,
                fileName: `Laporan_Penjualan_Per_Jam_${outletName.replace(/\s+/g, '_')}_${startDate.replace(/\//g, '-')}_${endDate.replace(/\//g, '-')}.xlsx`,
                headerInfo: [
                    ['Outlet', outletName],
                    ['Tanggal', dateRangeText],
                    ['Tanggal Export', dayjs().format('DD MMMM YYYY HH:mm')]
                ]
            });
        } catch (error) {
            console.error("Error exporting to Excel:", error);
            alert("Gagal mengekspor data. Silakan coba lagi.");
        } finally {
            setIsExporting(false);
        }
    };

    if (loading && products.length === 0) return <SalesHourlySkeleton />;

    if (error && !loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p>{error}</p>
                    <button
                        onClick={fetchData}
                        className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                    >
                        Coba Lagi
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
                    <span className="text-lg">Penjualan Per Jam</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={isExporting || products.length === 0}
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

            <div className="px-6 pb-6">
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

                    <div className="w-1/4">
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

                <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-100 bg-white">
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                                <th className="px-5 py-3 font-bold">Waktu</th>
                                <th className="px-5 py-3 font-bold text-right">Jumlah Transaksi</th>
                                <th className="px-5 py-3 font-bold text-right">Penjualan</th>
                                <th className="px-5 py-3 font-bold text-right">Rata-Rata</th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-sm">
                                {paginatedData.map((group, index) => {
                                    const avgPerTransaction = group.count > 0
                                        ? Math.round(group.grandTotalSum / group.count)
                                        : 0;

                                    return (
                                        <tr key={index} className="hover:bg-gray-50/50 border-b border-gray-50 last:border-0 transition-colors duration-150 text-xs">
                                            <td className="px-5 py-2.5 font-bold text-gray-800">{group.hour}</td>
                                            <td className="px-5 py-2.5 text-right font-medium text-gray-700 text-[11px]">{group.count.toLocaleString('id-ID')}</td>
                                            <td className="px-5 py-2.5 text-right font-black text-gray-900 text-[11px]">{formatCurrency(group.grandTotalSum)}</td>
                                            <td className="px-5 py-2.5 text-right font-bold text-primary text-[11px]">{formatCurrency(avgPerTransaction)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-gray-400">Tidak ada data ditemukan</td>
                                </tr>
                            </tbody>
                        )}

                        <tfoot className="border-t font-bold text-xs bg-gray-50/50">
                            <tr>
                                <td className="px-5 py-3 text-gray-900 border-r border-gray-100">Grand Total</td>
                                <td className="px-5 py-3 text-right">
                                    <span className="bg-white border border-gray-200 text-gray-900 inline-block px-3 py-1 rounded-lg">
                                        {grandTotalItems.toLocaleString('id-ID')}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right font-black">
                                    <span className="bg-primary text-white inline-block px-3 py-1 rounded-lg">
                                        {formatCurrency(grandTotalPenjualan)}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <span className="bg-white border border-gray-200 text-primary inline-block px-3 py-1 rounded-lg">
                                        {grandTotalItems > 0
                                            ? formatCurrency(Math.round(grandTotalPenjualan / grandTotalItems))
                                            : formatCurrency(0)
                                        }
                                    </span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="mt-6">
                        <Paginated
                            currentPage={currentPage}
                            setCurrentPage={handlePageChange}
                            totalPages={totalPages}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default HourlySales;