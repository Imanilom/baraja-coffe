import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaDownload, FaEye, FaChevronLeft } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import PaymentDetailModal from "./detailModal";
import { exportPaymentMethodExcel } from '../../../../utils/exportPaymentMethodExcel';

const PaymentMethodSales = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [reportData, setReportData] = useState(null);
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [dateRange, setDateRange] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [includeTax, setIncludeTax] = useState(true); // New state for tax toggle
    const ITEMS_PER_PAGE = 50;

    const formatDateLocal = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

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

    // Initialize from URL params or set default to today
    useEffect(() => {
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const outletParam = searchParams.get('outletId');
        const pageParam = searchParams.get('page');
        const taxParam = searchParams.get('includeTax');

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

        if (taxParam !== null) {
            setIncludeTax(taxParam === 'true');
        }
    }, [searchParams]);

    // Update URL when filters change
    const updateURLParams = (newDateRange, newOutlet, newPage, newIncludeTax) => {
        const params = new URLSearchParams();

        if (newDateRange?.startDate && newDateRange?.endDate) {
            const startDate = formatDateLocal(newDateRange.startDate);
            const endDate = formatDateLocal(newDateRange.endDate);
            params.set('startDate', startDate);
            params.set('endDate', endDate);
        }

        if (newOutlet) {
            params.set('outletId', newOutlet);
        }

        if (newPage && newPage > 1) {
            params.set('page', newPage.toString());
        }

        params.set('includeTax', newIncludeTax.toString());

        setSearchParams(params);
    };

    // Fetch outlets
    const fetchOutlets = async () => {
        try {
            const response = await axios.get('/api/outlet');
            const outletsData = Array.isArray(response.data) ? response.data :
                (response.data && Array.isArray(response.data.data)) ? response.data.data : [];
            setOutlets(outletsData);
        } catch (err) {
            console.error("Error fetching outlets:", err);
            setOutlets([]);
        }
    };

    // Fetch sales report data
    const fetchSalesReport = async () => {
        if (!dateRange?.startDate || !dateRange?.endDate) return;

        setLoading(true);
        setError(null);

        try {
            const params = {
                startDate: formatDateLocal(dateRange.startDate),
                endDate: formatDateLocal(dateRange.endDate),
                groupBy: 'daily',
                includeTax: includeTax.toString()
            };

            if (selectedOutlet) {
                params.outletId = selectedOutlet;
            }

            // ✅ Add timeout for large datasets
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

            const response = await axios.get('/api/report/sales-report', {
                params,
                signal: controller.signal,
                timeout: 60000 // 60 seconds
            });

            clearTimeout(timeoutId);

            if (response.data?.success && response.data?.data) {
                setReportData(response.data.data);
            } else {
                setError("Format data tidak valid");
            }
        } catch (err) {
            if (err.code === 'ECONNABORTED' || err.name === 'AbortError') {
                setError("Request timeout. Dataset terlalu besar, coba dengan rentang tanggal yang lebih kecil.");
            } else {
                console.error("Error fetching sales report:", err);
                setError(err.response?.data?.message || "Gagal memuat data. Silakan coba lagi.");
            }
            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOutlets();
    }, []);

    useEffect(() => {
        if (dateRange?.startDate && dateRange?.endDate) {
            fetchSalesReport();
        }
    }, [dateRange, selectedOutlet, includeTax]);

    // Handle date range change
    const handleDateRangeChange = (newValue) => {
        if (newValue?.startDate && newValue?.endDate) {
            setDateRange(newValue);
            setCurrentPage(1);
            updateURLParams(newValue, selectedOutlet, 1, includeTax);
        }
    };

    // Handle outlet change
    const handleOutletChange = (selected) => {
        const newOutlet = selected?.value || "";
        setSelectedOutlet(newOutlet);
        setCurrentPage(1);
        updateURLParams(dateRange, newOutlet, 1, includeTax);
    };

    // Handle tax toggle
    const handleTaxToggle = (newIncludeTax) => {
        setIncludeTax(newIncludeTax);
        setCurrentPage(1);
        updateURLParams(dateRange, selectedOutlet, 1, newIncludeTax);
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        updateURLParams(dateRange, selectedOutlet, newPage, includeTax);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const options = useMemo(() => [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((o) => ({ value: o._id, label: o.name })),
    ], [outlets]);

    // Process payment data dari struktur API
    const paymentMethodData = useMemo(() => {
        if (!reportData?.paymentMethods || !Array.isArray(reportData.paymentMethods)) {
            return [];
        }

        return reportData.paymentMethods.map(method => ({
            paymentMethod: method.displayName || 'Unknown',
            count: method.transactionCount || 0,
            subtotal: method.totalAmount || 0,
            percentage: method.percentageOfTotal?.toFixed(2) || '0.00',
            orderIds: method.orderIds || []
        }));
    }, [reportData]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return paymentMethodData.slice(startIndex, endIndex);
    }, [paymentMethodData, currentPage]);

    const totalPages = Math.ceil(paymentMethodData.length / ITEMS_PER_PAGE);

    const grandTotal = useMemo(() => {
        return paymentMethodData.reduce(
            (acc, curr) => {
                acc.count += curr.count;
                acc.subtotal += curr.subtotal;
                return acc;
            },
            { count: 0, subtotal: 0 }
        );
    }, [paymentMethodData]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const exportToExcel = async () => {
        if (paymentMethodData.length === 0) {
            alert("Tidak ada data untuk diekspor");
            return;
        }

        setIsExporting(true);

        try {
            const outletName = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet'
                : 'Semua Outlet';

            const dateRangeText = dateRange?.startDate && dateRange?.endDate
                ? `${new Date(dateRange.startDate).toLocaleDateString('id-ID')} - ${new Date(dateRange.endDate).toLocaleDateString('id-ID')}`
                : 'Semua Tanggal';

            const taxLabel = includeTax ? 'Dengan Pajak' : 'Tanpa Pajak';
            const startDate = new Date(dateRange.startDate).toLocaleDateString('id-ID').replace(/\//g, '-');
            const endDate = new Date(dateRange.endDate).toLocaleDateString('id-ID').replace(/\//g, '-');

            await exportPaymentMethodExcel({
                data: paymentMethodData,
                grandTotal,
                summary: reportData?.summary,
                includeTax,
                fileName: `Metode_Pembayaran_${taxLabel}_${outletName}_${startDate}_${endDate}.xlsx`,
                headerInfo: [
                    ['Outlet', outletName],
                    ['Periode', dateRangeText],
                    ['Jenis Laporan', taxLabel],
                    ['Tanggal Export', new Date().toLocaleString('id-ID')]
                ]
            });

        } catch (err) {
            console.error("Error exporting:", err);
            alert("Gagal mengekspor data. Silakan coba lagi.");
        } finally {
            setIsExporting(false);
        }
    };

    const openModal = (paymentMethod) => {
        setSelectedPaymentMethod(paymentMethod);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedPaymentMethod('');
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            pages.push(
                <button
                    key={1}
                    onClick={() => handlePageChange(1)}
                    className="px-3 py-1 border border-green-900 rounded text-green-900 hover:bg-green-900 hover:text-white transition-colors"
                >
                    1
                </button>
            );
            if (startPage > 2) {
                pages.push(<span key="ellipsis1" className="px-2 text-green-900">...</span>);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-1 border border-green-900 rounded transition-colors ${currentPage === i
                        ? "bg-green-900 text-white"
                        : "text-green-900 hover:bg-green-900 hover:text-white"
                        }`}
                >
                    {i}
                </button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(<span key="ellipsis2" className="px-2 text-green-900">...</span>);
            }
            pages.push(
                <button
                    key={totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className="px-3 py-1 border border-green-900 rounded text-green-900 hover:bg-green-900 hover:text-white transition-colors"
                >
                    {totalPages}
                </button>
            );
        }

        return pages;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-green-900 flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-900"></div>
                    <p className="font-medium">Memuat data...</p>
                    <p className="text-sm text-gray-500">Mohon tunggu, sedang memproses laporan</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p>{error}</p>
                    <button
                        onClick={fetchSalesReport}
                        className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded hover:bg-[#003d1f] transition-colors"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <span>Laporan</span>
                    <FaChevronRight className="text-sm" />
                    <Link to="/admin/sales-menu" className="hover:underline">Laporan Penjualan</Link>
                    <FaChevronRight className="text-sm" />
                    <span>Metode Pembayaran</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={isExporting || paymentMethodData.length === 0}
                    className="bg-green-900 text-white text-[13px] px-[15px] py-[7px] rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-800 transition-colors"
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
                <div className="flex justify-between py-3 gap-4">
                    <div className="w-2/5">
                        <Datepicker
                            showFooter
                            showShortcuts
                            value={dateRange}
                            onChange={handleDateRangeChange}
                            displayFormat="DD-MM-YYYY"
                            inputClassName="w-full text-[13px] border py-2 pr-[25px] pl-[12px] rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-900"
                            popoverDirection="down"
                        />
                    </div>
                    <div className="w-1/3">
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
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleTaxToggle(false)}
                            className={`px-4 py-2 text-[13px] rounded transition-colors ${!includeTax
                                ? 'bg-green-900 text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Tanpa Pajak
                        </button>
                        <button
                            onClick={() => handleTaxToggle(true)}
                            className={`px-4 py-2 text-[13px] rounded transition-colors ${includeTax
                                ? 'bg-green-900 text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Dengan Pajak
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                {reportData?.summary && (
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="bg-white p-4 rounded shadow">
                            <p className="text-gray-500 text-xs mb-1">Total Transaksi</p>
                            <p className="text-2xl font-bold text-green-900">
                                {reportData.summary.totalTransactions?.toLocaleString() || 0}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded shadow">
                            <p className="text-gray-500 text-xs mb-1">Total Order</p>
                            <p className="text-2xl font-bold text-green-900">
                                {reportData.summary.totalOrders?.toLocaleString() || 0}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded shadow">
                            <p className="text-gray-500 text-xs mb-1">
                                Total Pendapatan {includeTax ? '(Dengan Pajak)' : '(Tanpa Pajak)'}
                            </p>
                            <p className="text-2xl font-bold text-green-900">
                                {formatCurrency(reportData.summary.totalRevenue)}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded shadow">
                            <p className="text-gray-500 text-xs mb-1">Rata-rata per Transaksi</p>
                            <p className="text-2xl font-bold text-green-900">
                                {formatCurrency(reportData.summary.averageTransaction)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-md bg-white">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400 bg-gray-50">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal">Metode Pembayaran</th>
                                <th className="px-4 py-3 font-normal text-right">Jumlah Transaksi</th>
                                <th className="px-4 py-3 font-normal text-right">Total</th>
                                <th className="px-4 py-3 font-normal text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-400">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((group, index) => (
                                    <tr key={index} className="text-left text-sm hover:bg-gray-50 border-t transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-700">
                                            {group.paymentMethod}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {group.count.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {formatCurrency(group.subtotal)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => openModal(group.paymentMethod)}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                                title="Lihat Detail Transaksi"
                                            >
                                                <FaEye className="text-xs" />
                                                Detail
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-gray-400">
                                        Tidak ada data ditemukan
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {paginatedData.length > 0 && (
                            <tfoot className="border-t-2 font-semibold text-sm bg-gray-50">
                                <tr>
                                    <td className="px-4 py-3 text-gray-700">Grand Total</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="bg-green-100 text-green-900 inline-block px-3 py-1 rounded-full">
                                            {grandTotal.count.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="bg-green-100 text-green-900 inline-block px-3 py-1 rounded-full">
                                            {formatCurrency(grandTotal.subtotal)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4 text-sm">
                        <button
                            onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-2 px-4 py-2 border rounded bg-green-900 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-800 transition-colors"
                        >
                            <FaChevronLeft /> Sebelumnya
                        </button>

                        <div className="flex gap-2">{renderPageNumbers()}</div>

                        <button
                            onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-2 px-4 py-2 border rounded bg-green-900 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-800 transition-colors"
                        >
                            Selanjutnya <FaChevronRight />
                        </button>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <PaymentDetailModal
                isOpen={isModalOpen}
                onClose={closeModal}
                paymentMethod={selectedPaymentMethod}
                dateRange={dateRange}
                outletId={selectedOutlet}
                includeTax={includeTax}
                formatCurrency={formatCurrency}
            />
        </div>
    );
};

export default PaymentMethodSales;