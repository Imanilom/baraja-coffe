import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaDownload, FaEye, FaChevronLeft } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import PaymentDetailModal from "./detailModal";

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
    const ITEMS_PER_PAGE = 50;

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
    const updateURLParams = (newDateRange, newOutlet, newPage) => {
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

    // Fetch sales report data dari API baru
    const fetchSalesReport = async () => {
        if (!dateRange?.startDate || !dateRange?.endDate) return;

        setLoading(true);
        try {
            const params = {
                startDate: new Date(dateRange.startDate).toISOString().split('T')[0],
                endDate: new Date(dateRange.endDate).toISOString().split('T')[0],
                groupBy: 'daily'
            };

            if (selectedOutlet) {
                params.outletId = selectedOutlet;
            }

            const response = await axios.get('/api/report/sales-report', { params });

            if (response.data?.success && response.data?.data) {
                setReportData(response.data.data);
                setError(null);
            } else {
                setError("Invalid data format received");
            }
        } catch (err) {
            console.error("Error fetching sales report:", err);
            setError("Failed to load data. Please try again later.");
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
    }, [dateRange, selectedOutlet]);

    // Handle date range change
    const handleDateRangeChange = (newValue) => {
        setDateRange(newValue);
        setCurrentPage(1);
        updateURLParams(newValue, selectedOutlet, 1);
    };

    // Handle outlet change
    const handleOutletChange = (selected) => {
        const newOutlet = selected.value;
        setSelectedOutlet(newOutlet);
        setCurrentPage(1);
        updateURLParams(dateRange, newOutlet, 1);
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        updateURLParams(dateRange, selectedOutlet, newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const options = [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((o) => ({ value: o._id, label: o.name })),
    ];

    // Process payment data dari struktur API baru
    const paymentMethodData = useMemo(() => {
        if (!reportData?.paymentMethods) return [];

        return reportData.paymentMethods.map(method => ({
            paymentMethod: method.method,
            count: method.totalTransactions,
            subtotal: method.totalAmount,
            percentage: method.percentage,
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
        }).format(amount);
    };

    const exportToExcel = () => {
        setIsExporting(true);
        try {
            // Header info
            const outletName = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet'
                : 'Semua Outlet';

            const dateRangeText = dateRange && dateRange.startDate && dateRange.endDate
                ? `${new Date(dateRange.startDate).toLocaleDateString('id-ID')} - ${new Date(dateRange.endDate).toLocaleDateString('id-ID')}`
                : 'Semua Tanggal';

            const rows = [
                { col1: 'Laporan Metode Pembayaran', col2: '', col3: '', col4: '' },
                { col1: '', col2: '', col3: '', col4: '' },
                { col1: 'Outlet', col2: outletName, col3: '', col4: '' },
                { col1: 'Periode', col2: dateRangeText, col3: '', col4: '' },
                { col1: '', col2: '', col3: '', col4: '' },
                { col1: 'Metode Pembayaran', col2: 'Jumlah Transaksi', col3: 'Total', col4: 'Persentase' },
            ];

            // Add data rows
            paymentMethodData.forEach(group => {
                rows.push({
                    col1: group.paymentMethod,
                    col2: group.count,
                    col3: group.subtotal,
                    col4: `${group.percentage}%`
                });
            });

            // Add summary row
            rows.push({ col1: '', col2: '', col3: '', col4: '' });
            rows.push({
                col1: 'GRAND TOTAL',
                col2: grandTotal.count,
                col3: grandTotal.subtotal,
                col4: '100%'
            });

            const ws = XLSX.utils.json_to_sheet(rows, {
                header: ['col1', 'col2', 'col3', 'col4'],
                skipHeader: true
            });

            // Set column widths
            ws['!cols'] = [
                { wch: 25 },
                { wch: 20 },
                { wch: 20 },
                { wch: 15 }
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Metode Pembayaran");

            // Generate filename with date range
            const startDate = new Date(dateRange.startDate).toLocaleDateString('id-ID').replace(/\//g, '-');
            const endDate = new Date(dateRange.endDate).toLocaleDateString('id-ID').replace(/\//g, '-');
            const filename = `Metode_Pembayaran_${outletName}_${startDate}_${endDate}.xlsx`;

            XLSX.writeFile(wb, filename);
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
        let pages = [];
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
                    className="px-3 py-1 border border-green-900 rounded text-green-900 hover:bg-green-900 hover:text-white"
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
                    className={`px-3 py-1 border border-green-900 rounded ${currentPage === i
                        ? "bg-green-900 text-white border-green-900"
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
                    className="px-3 py-1 border border-green-900 rounded text-green-900 hover:bg-green-900 hover:text-white"
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
                    <p>Memuat data...</p>
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
                        className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                    >
                        Coba Lagi
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
                    <span>Metode Pembayaran</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={isExporting || paymentMethodData.length === 0}
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

                {/* Summary Cards */}
                {reportData?.summary && (
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="bg-white p-4 rounded shadow">
                            <p className="text-gray-500 text-xs">Total Transaksi</p>
                            <p className="text-2xl font-bold text-green-900">{reportData.summary.totalTransactions}</p>
                        </div>
                        <div className="bg-white p-4 rounded shadow">
                            <p className="text-gray-500 text-xs">Total Order</p>
                            <p className="text-2xl font-bold text-green-900">{reportData.summary.totalOrders}</p>
                        </div>
                        <div className="bg-white p-4 rounded shadow">
                            <p className="text-gray-500 text-xs">Total Pendapatan</p>
                            <p className="text-2xl font-bold text-green-900">{formatCurrency(reportData.summary.totalRevenue)}</p>
                        </div>
                        <div className="bg-white p-4 rounded shadow">
                            <p className="text-gray-500 text-xs">Rata-rata per Transaksi</p>
                            <p className="text-2xl font-bold text-green-900">
                                {formatCurrency(reportData.summary.averageTransaction)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-md bg-white shadow-slate-200">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400 bg-gray-50">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal">Metode Pembayaran</th>
                                <th className="px-4 py-3 font-normal text-right">Jumlah Transaksi</th>
                                <th className="px-4 py-3 font-normal text-right">Total</th>
                                <th className="px-4 py-3 font-normal text-center">Aksi</th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {paginatedData.map((group, index) => (
                                    <tr key={index} className="text-left text-sm hover:bg-gray-50 border-t">
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
                                ))}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr className="py-6 text-center w-full h-96">
                                    <td colSpan={5}>Tidak ada data ditemukan</td>
                                </tr>
                            </tbody>
                        )}
                        <tfoot className="border-t-2 font-semibold text-sm bg-gray-50">
                            <tr>
                                <td className="px-4 py-3">Grand Total</td>
                                <td className="px-4 py-3 text-right">
                                    <p className="bg-green-100 text-green-900 inline-block px-3 py-1 rounded-full">
                                        {grandTotal.count.toLocaleString()}
                                    </p>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <p className="bg-green-100 text-green-900 inline-block px-3 py-1 rounded-full">
                                        {formatCurrency(grandTotal.subtotal)}
                                    </p>
                                </td>
                                <td className="px-4 py-3"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4 text-sm text-white">
                        <button
                            onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-2 px-3 py-1 border rounded bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FaChevronLeft /> Sebelumnya
                        </button>

                        <div className="flex gap-2">{renderPageNumbers()}</div>

                        <button
                            onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-2 px-3 py-1 border rounded bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
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
                formatCurrency={formatCurrency}
            />
        </div>
    );
};

export default PaymentMethodSales;