import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaDownload } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import Paginated from "../../../../components/paginated";
import DeviceSalesSkeleton from "./skeleton";

const DeviceSales = () => {
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

    const [deviceData, setDeviceData] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState(null);
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [dateRange, setDateRange] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [summary, setSummary] = useState({
        totalDevices: 0,
        totalTransactions: 0,
        totalSales: 0,
        averagePerTransaction: 0
    });

    const ITEMS_PER_PAGE = 50;

    // Initialize from URL params or set default to today
    useEffect(() => {
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const outletParam = searchParams.get('outletId');
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

        if (pageParam) {
            setCurrentPage(parseInt(pageParam, 10));
        }
    }, []);

    // Update URL when filters change
    const updateURLParams = useCallback((newDateRange, newOutlet, newPage) => {
        const params = new URLSearchParams();

        if (newDateRange?.startDate && newDateRange?.endDate) {
            const startDate = new Date(newDateRange.startDate).toISOString().split('T')[0];
            const endDate = new Date(newDateRange.endDate).toISOString().split('T')[0];
            params.set('startDate', startDate);
            params.set('endDate', endDate);
        }

        if (newOutlet) {
            params.set('outletId', newOutlet);
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

    // Fetch device sales data
    const fetchDeviceSales = useCallback(async () => {
        if (!dateRange?.startDate || !dateRange?.endDate) return;

        setLoading(true);
        try {
            const params = {
                startDate: new Date(dateRange.startDate).toISOString().split('T')[0],
                endDate: new Date(dateRange.endDate).toISOString().split('T')[0],
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

    // Auto-fetch when filters change
    useEffect(() => {
        fetchDeviceSales();
    }, [fetchDeviceSales]);

    // Handler functions
    const handleDateRangeChange = (newValue) => {
        setDateRange(newValue);
        setCurrentPage(1);
        updateURLParams(newValue, selectedOutlet, 1);
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
            await new Promise(resolve => setTimeout(resolve, 500));

            const outletName = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet'
                : 'Semua Outlet';

            const dateRangeText = dateRange?.startDate && dateRange?.endDate
                ? `${new Date(dateRange.startDate).toLocaleDateString('id-ID')} - ${new Date(dateRange.endDate).toLocaleDateString('id-ID')}`
                : new Date().toLocaleDateString('id-ID');

            // Create export data
            const exportData = [
                { col1: 'Laporan Penjualan Per Perangkat', col2: '', col3: '', col4: '', col5: '' },
                { col1: '', col2: '', col3: '', col4: '', col5: '' },
                { col1: 'Outlet', col2: outletName, col3: '', col4: '', col5: '' },
                { col1: 'Tanggal', col2: dateRangeText, col3: '', col4: '', col5: '' },
                { col1: '', col2: '', col3: '', col4: '', col5: '' },
                { col1: 'Nama Perangkat', col2: 'Tipe', col3: 'Jumlah Transaksi', col4: 'Penjualan', col5: 'Rata-Rata' }
            ];

            // Add data rows
            deviceData.forEach(device => {
                exportData.push({
                    col1: device.deviceName || '-',
                    col2: device.deviceType || '-',
                    col3: device.transactionCount || 0,
                    col4: device.totalSales || 0,
                    col5: device.averagePerTransaction || 0
                });
            });

            // Add Grand Total row
            exportData.push({
                col1: 'Grand Total',
                col2: '',
                col3: summary.totalTransactions,
                col4: summary.totalSales,
                col5: summary.averagePerTransaction
            });

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(exportData, {
                header: ['col1', 'col2', 'col3', 'col4', 'col5'],
                skipHeader: true
            });

            // Set column widths
            ws['!cols'] = [
                { wch: 25 },
                { wch: 15 },
                { wch: 20 },
                { wch: 20 },
                { wch: 15 }
            ];

            // Merge cells for title
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }
            ];

            // Create workbook and add worksheet
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Penjualan Per Perangkat");

            // Generate filename
            const startDate = new Date(dateRange.startDate).toLocaleDateString('id-ID').replace(/\//g, '-');
            const endDate = new Date(dateRange.endDate).toLocaleDateString('id-ID').replace(/\//g, '-');
            const fileName = `Laporan_Penjualan_Per_Perangkat_${outletName.replace(/\s+/g, '_')}_${startDate}_${endDate}.xlsx`;

            // Export file
            XLSX.writeFile(wb, fileName);

        } catch (error) {
            console.error("Error exporting to Excel:", error);
            alert("Gagal mengekspor data. Silakan coba lagi.");
        } finally {
            setIsExporting(false);
        }
    };

    // Show loading state
    if (loading && !dateRange) {
        return <DeviceSalesSkeleton />;
    }

    // Show error state
    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p>{error}</p>
                    <button
                        onClick={fetchDeviceSales}
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
                    <span>Penjualan Per Perangkat</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={isExporting || deviceData.length === 0}
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
                    <div className="flex flex-col col-span-5 w-2/5">
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

                    <div className="flex flex-col col-span-5">
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

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-md bg-white shadow-slate-200">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal">Nama Perangkat</th>
                                <th className="px-4 py-3 font-normal">Tipe</th>
                                <th className="px-4 py-3 font-normal">Outlet</th>
                                <th className="px-4 py-3 font-normal text-right">Jumlah Transaksi</th>
                                <th className="px-4 py-3 font-normal text-right">Penjualan</th>
                                <th className="px-4 py-3 font-normal text-right">Rata-Rata</th>
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
                        ) : paginatedData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {paginatedData.map((device, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">{device.deviceName || '-'}</td>
                                        <td className="px-4 py-3">{device.deviceType || '-'}</td>
                                        <td className="px-4 py-3">{device.outlet || '-'}</td>
                                        <td className="px-4 py-3 text-right">
                                            {device.transactionCount?.toLocaleString('id-ID') || 0}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {formatCurrency(device.totalSales || 0)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {formatCurrency(device.averagePerTransaction || 0)}
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
                                <td colSpan={3} className="px-4 py-2">Grand Total</td>
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
                    totalPages={totalPages}
                />
            </div>
        </div>
    );
};

export default DeviceSales;