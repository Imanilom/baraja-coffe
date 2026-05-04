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
import Paginated from "../../../../components/Paginated";
import DeviceSalesSkeleton from "./skeleton";
import { exportDeviceSalesExcel } from '../../../../utils/exportDeviceSalesExcel';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = 'Asia/Jakarta';

const DeviceSales = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { outlets } = useSelector((state) => state.outlet);

    const [deviceData, setDeviceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState({
        totalDevices: 0,
        totalTransactions: 0,
        totalSales: 0,
        averagePerTransaction: 0
    });

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

    const formatDateForAPI = (date) => {
        if (!date) return null;
        return dayjs(date).tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD');
    };

    // Update URL when filters change
    const updateURLParams = useCallback((newDateRange, newOutlet, newPage) => {
        const params = new URLSearchParams();

        if (newDateRange?.startDate && newDateRange?.endDate) {
            params.set('startDate', formatDateForAPI(newDateRange.startDate));
            params.set('endDate', formatDateForAPI(newDateRange.endDate));
        }

        if (newOutlet) params.set('outletId', newOutlet);
        if (newPage && newPage > 1) params.set('page', newPage.toString());

        setSearchParams(params);
    }, [setSearchParams]);

    // Fetch device sales data
    const fetchDeviceSales = useCallback(async () => {
        if (!dateRange?.startDate || !dateRange?.endDate) return;

        setLoading(true);
        try {
            const params = {
                startDate: formatDateForAPI(dateRange.startDate),
                endDate: formatDateForAPI(dateRange.endDate),
            };

            if (selectedOutlet) {
                params.outletId = selectedOutlet;
            }

            const response = await axios.get('/api/report/sales-report/device', { params });

            if (response.data.success) {
                setDeviceData(response.data.data || []);
                setSummary(response.data.summary || {
                    totalDevices: 0,
                    totalTransactions: 0,
                    totalSales: 0,
                    averagePerTransaction: 0
                });
                setError(null);
            }
        } catch (err) {
            console.error("Error fetching device sales:", err);
            setError("Failed to load data. Please try again later.");
            setDeviceData([]);
            setSummary({
                totalDevices: 0,
                totalTransactions: 0,
                totalSales: 0,
                averagePerTransaction: 0
            });
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedOutlet]);

    useEffect(() => {
        fetchDeviceSales();
    }, [fetchDeviceSales]);

    // Handler functions
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

    // Pagination
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return deviceData.slice(startIndex, endIndex);
    }, [deviceData, currentPage]);

    const totalPages = Math.ceil(deviceData.length / ITEMS_PER_PAGE);

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
        if (deviceData.length === 0) {
            alert("Tidak ada data untuk diekspor");
            return;
        }

        setIsExporting(true);
        try {
            const outletName = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet'
                : 'Semua Outlet';

            const dateRangeText = dateRange?.startDate && dateRange?.endDate
                ? `${dayjs(dateRange.startDate).format('DD/MM/YYYY')} - ${dayjs(dateRange.endDate).format('DD/MM/YYYY')}`
                : dayjs().format('DD/MM/YYYY');

            const startDate = dayjs(dateRange.startDate).format('DD-MM-YYYY');
            const endDate = dayjs(dateRange.endDate).format('DD-MM-YYYY');

            await exportDeviceSalesExcel({
                data: deviceData,
                summary,
                fileName: `Laporan_Penjualan_Per_Perangkat_${outletName.replace(/\s+/g, '_')}_${startDate}_${endDate}.xlsx`,
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

    if (loading && deviceData.length === 0) {
        return <DeviceSalesSkeleton />;
    }

    if (error && !loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="text-red-500 text-center bg-white p-8 rounded-2xl shadow-sm border">
                    <p className="text-xl font-bold mb-2">Terjadi Kesalahan</p>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={fetchDeviceSales}
                        className="bg-primary text-white text-[13px] px-6 py-2 rounded-lg hover:bg-primary/90 transition-all font-medium"
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
                    <span className="text-lg">Penjualan Per Perangkat</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={isExporting || deviceData.length === 0}
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
                            <tr className="text-left text-[13px] text-gray-400 border-b border-gray-50">
                                <th className="px-6 py-4 font-medium uppercase tracking-wider">Nama Perangkat</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider">Tipe</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider">Outlet</th>
                                <th className="px-6 py-4 font-medium text-right uppercase tracking-wider">Jumlah Transaksi</th>
                                <th className="px-6 py-4 font-medium text-right uppercase tracking-wider">Penjualan</th>
                                <th className="px-6 py-4 font-medium text-right uppercase tracking-wider">Rata-Rata</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((device, index) => (
                                    <tr key={index} className="hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                                        <td className="px-6 py-4 text-gray-900 font-medium">{device.deviceName || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-[11px] font-medium text-gray-600">
                                                {device.deviceType || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{device.outlet || '-'}</td>
                                        <td className="px-6 py-4 text-right text-gray-600 font-medium">
                                            {device.transactionCount?.toLocaleString('id-ID') || 0}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                                            {formatCurrency(device.totalSales || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-primary font-medium">
                                            {formatCurrency(device.averagePerTransaction || 0)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-gray-400">Tidak ada data ditemukan</td>
                                </tr>
                            )}
                        </tbody>

                        <tfoot className="bg-gray-50/50 font-semibold text-sm border-t">
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-gray-900 border-r border-gray-100">Grand Total</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="bg-white border border-gray-200 text-gray-900 inline-block px-3 py-1 rounded-lg">
                                        {summary.totalTransactions?.toLocaleString('id-ID') || 0}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="bg-primary text-white inline-block px-3 py-1 rounded-lg">
                                        {formatCurrency(summary.totalSales || 0)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="bg-white border border-gray-200 text-primary inline-block px-3 py-1 rounded-lg">
                                        {formatCurrency(summary.averagePerTransaction || 0)}
                                    </span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {totalPages > 1 && (
                    <Paginated
                        currentPage={currentPage}
                        setCurrentPage={handlePageChange}
                        totalPages={totalPages}
                    />
                )}
            </div>
        </div>
    );
};

export default DeviceSales;
