import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import dayjs from "dayjs";
import { Link, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaDownload } from "react-icons/fa";
import { useSelector } from "react-redux";
import TypeTransactionTable from "./table";
import TypeTransactionTableSkeleton from "./skeleton";
import { exportTypeTransactionExcel } from '../../../../utils/exportTypeTransactionExcel';
import useDebounce from "@/hooks/useDebounce";

const TypeTransaction = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { outlets } = useSelector((state) => state.outlet);

    const customSelectStyles = {
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

    const [products, setProducts] = useState([]);
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const [selectedOutlet, setSelectedOutlet] = useState(searchParams.get('outletId') || "");
    const [selectedStatus, setSelectedStatus] = useState(() => {
        const statusParam = searchParams.get('status');
        if (!statusParam) return [];
        return statusParam.includes(',') ? statusParam.split(',') : [statusParam];
    });
    const [dateRange, setDateRange] = useState(() => {
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        if (startDateParam && endDateParam) {
            return {
                startDate: dayjs(startDateParam),
                endDate: dayjs(endDateParam),
            };
        }
        return { startDate: dayjs(), endDate: dayjs() };
    });
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page'), 10) || 1);
    const [isExporting, setIsExporting] = useState(false);

    // Update status transaksi
    const updateStatus = useCallback(async (orderId, newStatus) => {
        setIsUpdatingStatus(true);

        // Endpoint candidates: coba berurutan sampai yang berhasil
        const endpoints = [
            { method: 'patch', url: `/api/report/orders/${orderId}/status`, body: { status: newStatus } },
            { method: 'put', url: `/api/report/orders/${orderId}`, body: { status: newStatus } },
        ];

        let lastError = null;
        for (const ep of endpoints) {
            try {
                console.log(`[updateStatus] Trying ${ep.method.toUpperCase()} ${ep.url}`);
                await axios[ep.method](ep.url, ep.body);
                console.log(`[updateStatus] Success with ${ep.method.toUpperCase()} ${ep.url}`);
                // Update local state tanpa refetch
                setProducts(prev => prev.map(p =>
                    p._id === orderId ? { ...p, status: newStatus } : p
                ));
                setSelectedTrx(prev => prev && prev._id === orderId ? { ...prev, status: newStatus } : prev);
                setIsUpdatingStatus(false);
                return { success: true };
            } catch (err) {
                const statusCode = err.response?.status;
                console.warn(`[updateStatus] ${ep.method.toUpperCase()} ${ep.url} failed (${statusCode}):`, err.message);
                if (statusCode === 404) {
                    lastError = null; // Endpoint tidak ada, coba berikutnya
                    continue;
                }
                // Error lain (400, 500, etc) = endpoint ada tapi ada masalah lain
                lastError = err.response?.data?.message || err.message || 'Gagal mengubah status';
                break;
            }
        }

        setIsUpdatingStatus(false);
        return {
            success: false,
            message: lastError || 'Endpoint update status belum tersedia di backend. Hubungi developer.'
        };
    }, []);

    const ITEMS_PER_PAGE = 20;

    const statusOptions = [
        { value: "Waiting", label: "Waiting" },
        { value: "Pending", label: "Pending" },
        { value: "OnProcess", label: "OnProcess" },
        { value: "Completed", label: "Completed" },
        { value: "Cancelled", label: "Cancelled" },
    ];

    // Update URL params
    const updateURLParams = useCallback((newDateRange, newOutlet, newStatus, newSearch, newPage) => {
        const params = new URLSearchParams();

        if (newDateRange?.startDate && newDateRange?.endDate) {
            params.set('startDate', dayjs(newDateRange.startDate).format('YYYY-MM-DD'));
            params.set('endDate', dayjs(newDateRange.endDate).format('YYYY-MM-DD'));
        }

        if (newOutlet) params.set('outletId', newOutlet);
        if (newStatus && Array.isArray(newStatus) && newStatus.length > 0) params.set('status', newStatus.join(','));
        if (newSearch) params.set('search', newSearch);
        if (newPage && newPage > 1) params.set('page', newPage.toString());

        setSearchParams(params);
    }, [setSearchParams]);

    const fetchData = useCallback(async () => {
        if (!dateRange?.startDate || !dateRange?.endDate) return;

        setLoading(true);
        try {
            const params = {
                mode: 'all',
                startDate: dayjs(dateRange.startDate).format('YYYY-MM-DD'),
                endDate: dayjs(dateRange.endDate).format('YYYY-MM-DD')
            };

            if (selectedOutlet) params.outlet = selectedOutlet;
            if (debouncedSearchTerm) params.search = debouncedSearchTerm;

            const response = await axios.get('/api/report/orders', { params });
            const productsData = Array.isArray(response.data?.data) ? response.data.data : [];

            setProducts(productsData);
            setError(null);
        } catch (err) {
            console.error("Error fetching products:", err);
            setError("Gagal memuat data transaksi.");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedOutlet, debouncedSearchTerm]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const options = useMemo(() => [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((outlet) => ({ value: outlet._id, label: outlet.name })),
    ], [outlets]);

    // Handle filter changes
    const handleDateRangeChange = (newValue) => {
        setDateRange(newValue);
        setCurrentPage(1);
        updateURLParams(newValue, selectedOutlet, selectedStatus, searchTerm, 1);
    };

    const handleOutletChange = (selected) => {
        const newOutlet = selected.value;
        setSelectedOutlet(newOutlet);
        setCurrentPage(1);
        updateURLParams(dateRange, newOutlet, selectedStatus, searchTerm, 1);
    };

    const handleStatusChange = (selectedValues) => {
        const newStatus = Array.isArray(selectedValues)
            ? selectedValues.map(v => v.value || v)
            : (selectedValues?.value ? [selectedValues.value] : []);

        setSelectedStatus(newStatus);
        setCurrentPage(1);
        updateURLParams(dateRange, selectedOutlet, newStatus, searchTerm, 1);
    };

    const handleSearchChange = (newSearch) => {
        setSearchTerm(newSearch);
        setCurrentPage(1);
        updateURLParams(dateRange, selectedOutlet, selectedStatus, newSearch, 1);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        updateURLParams(dateRange, selectedOutlet, selectedStatus, searchTerm, newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Apply filter function
    const filteredData = useMemo(() => {
        let filtered = Array.isArray(products) ? [...products] : [];
        if (selectedStatus && Array.isArray(selectedStatus) && selectedStatus.length > 0) {
            filtered = filtered.filter(product => selectedStatus.includes(product.status));
        }
        return filtered;
    }, [products, selectedStatus]);

    // Paginate the filtered data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, endIndex);
    }, [currentPage, filteredData]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDateTime = (datetime) => {
        const date = new Date(datetime);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    const { grandTotalFinal } = useMemo(() => {
        const totals = { grandTotalFinal: 0 };
        filteredData.forEach(product => {
            totals.grandTotalFinal += Math.round(Number(product?.grandTotal) || 0);
        });
        return totals;
    }, [filteredData]);

    // Export to Excel function
    const handleExportExcel = async () => {
        if (!filteredData || filteredData.length === 0) {
            alert("Tidak ada data untuk diekspor");
            return;
        }

        setIsExporting(true);
        try {
            const outletName = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet'
                : 'Semua Outlet';

            const dateRangeText = `${dayjs(dateRange.startDate).format('DD/MM/YYYY')} - ${dayjs(dateRange.endDate).format('DD/MM/YYYY')}`;
            const statusText = selectedStatus && selectedStatus.length > 0 ? selectedStatus.join(', ') : 'Semua Status';

            const summary = {
                totalTransactions: filteredData.length,
                totalRevenue: grandTotalFinal,
                averageTransaction: filteredData.length > 0 ? Math.round(grandTotalFinal / filteredData.length) : 0,
                statusBreakdown: filteredData.reduce((acc, item) => {
                    acc[item.status || 'Unknown'] = (acc[item.status || 'Unknown'] || 0) + 1;
                    return acc;
                }, {})
            };

            const startDate = dayjs(dateRange.startDate).format('DD-MM-YYYY');
            const endDate = dayjs(dateRange.endDate).format('DD-MM-YYYY');
            const fileName = `Laporan_Status_Penjualan_${outletName.replace(/\s+/g, '_')}_${startDate}_${endDate}.xlsx`;

            await exportTypeTransactionExcel({
                data: filteredData,
                grandTotal: grandTotalFinal,
                summary,
                fileName,
                headerInfo: [
                    ["Outlet", outletName],
                    ["Tanggal", dateRangeText],
                    ["Status", statusText],
                    ["Pencarian", searchTerm || "-"]
                ]
            });
        } catch (error) {
            console.error("Error exporting to Excel:", error);
            alert("Gagal mengekspor data. Silakan coba lagi.");
        } finally {
            setIsExporting(false);
        }
    };

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
        <div className="min-h-screen bg-transparent mb-[50px]">
            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-4 mb-4">
                <h1 className="flex gap-2 items-center text-xl text-primary font-bold">
                    <span className="opacity-60 font-medium text-lg">Laporan</span>
                    <FaChevronRight className="opacity-30 text-xs mt-1" />
                    <Link to="/admin/sales-menu" className="opacity-60 font-medium text-lg hover:opacity-100 transition-opacity">Laporan Penjualan</Link>
                    <FaChevronRight className="opacity-30 text-xs mt-1" />
                    <span className="text-lg">Status Penjualan</span>
                </h1>

                <button
                    onClick={handleExportExcel}
                    disabled={isExporting || !filteredData || filteredData.length === 0}
                    className="bg-primary hover:bg-primary/90 text-white text-[13px] px-5 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                    {isExporting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            Mengekspor...
                        </>
                    ) : (
                        <>
                            <FaDownload />
                            Ekspor Excel
                        </>
                    )}
                </button>
            </div>

            {loading && filteredData.length === 0 ? (
                <TypeTransactionTableSkeleton />
            ) : (
                <TypeTransactionTable
                    paginatedData={paginatedData}
                    grandTotalFinal={grandTotalFinal}
                    setSelectedTrx={setSelectedTrx}
                    selectedTrx={selectedTrx}
                    formatDateTime={formatDateTime}
                    formatCurrency={formatCurrency}
                    options={options}
                    selectedOutlet={selectedOutlet}
                    handleOutletChange={handleOutletChange}
                    statusOptions={statusOptions}
                    selectedStatus={selectedStatus}
                    handleStatusChange={handleStatusChange}
                    dateRange={dateRange}
                    handleDateRangeChange={handleDateRangeChange}
                    searchTerm={searchTerm}
                    handleSearchChange={handleSearchChange}
                    customSelectStyles={customSelectStyles}
                    currentPage={currentPage}
                    handlePageChange={handlePageChange}
                    totalPages={totalPages}
                    ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                    filteredData={filteredData}
                    updateStatus={updateStatus}
                    isUpdatingStatus={isUpdatingStatus}
                />
            )}
        </div>
    );
};

export default TypeTransaction;
