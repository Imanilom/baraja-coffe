import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { Link, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaDownload } from "react-icons/fa";
import { useReactToPrint } from "react-to-print";
import TypeTransactionTable from "./table";
import TypeTransactionTableSkeleton from "./skeleton";
import { exportTypeTransactionExcel } from '../../../../utils/exportTypeTransactionExcel';

const TypeTransaction = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const customSelectStyles = {
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
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [selectedStatus, setSelectedStatus] = useState([]);
    const [dateRange, setDateRange] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false); // State for export loading

    const ITEMS_PER_PAGE = 20;

    const dropdownRef = useRef(null);
    const receiptRef = useRef();
    const handlePrint = useReactToPrint({
        content: () => receiptRef.current,
        documentTitle: `Resi_${selectedTrx?.order_id || "transaksi"}`
    });

    const statusOptions = [
        { value: "Waiting", label: "Waiting" },
        { value: "Pending", label: "Pending" },
        { value: "OnProcess", label: "OnProcess" },
        { value: "Completed", label: "Completed" },
        { value: "Cancelled", label: "Cancelled" },
    ];

    // Initialize from URL params
    useEffect(() => {
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const outletParam = searchParams.get('outletId');
        const statusParam = searchParams.get('status');
        const searchParam = searchParams.get('search');
        const pageParam = searchParams.get('page');

        if (startDateParam && endDateParam) {
            setDateRange({
                startDate: dayjs(startDateParam),
                endDate: dayjs(endDateParam),
            });
        } else {
            setDateRange({
                startDate: dayjs(),
                endDate: dayjs()
            });
        }

        if (outletParam) {
            setSelectedOutlet(outletParam);
        }

        if (statusParam) {
            const statusArray = statusParam.includes(',')
                ? statusParam.split(',')
                : [statusParam];
            setSelectedStatus(statusArray);
        }

        if (searchParam) {
            setSearchTerm(searchParam);
        }

        if (pageParam) {
            setCurrentPage(parseInt(pageParam, 10));
        }
    }, []);

    // Update URL params
    const updateURLParams = (newDateRange, newOutlet, newStatus, newSearch, newPage) => {
        const params = new URLSearchParams();

        if (newDateRange?.startDate && newDateRange?.endDate) {
            const startDate = dayjs(newDateRange.startDate).format('YYYY-MM-DD');
            const endDate = dayjs(newDateRange.endDate).format('YYYY-MM-DD');
            params.set('startDate', startDate);
            params.set('endDate', endDate);
        }

        if (newOutlet) {
            params.set('outletId', newOutlet);
        }

        if (newStatus && Array.isArray(newStatus) && newStatus.length > 0) {
            params.set('status', newStatus.join(','));
        }

        if (newSearch) {
            params.set('search', newSearch);
        }

        if (newPage && newPage > 1) {
            params.set('page', newPage.toString());
        }

        setSearchParams(params);
    };

    // Fetch products with payment details
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('mode', 'all');

            if (dateRange?.startDate && dateRange?.endDate) {
                params.append('startDate', dayjs(dateRange.startDate).format('YYYY-MM-DD'));
                params.append('endDate', dayjs(dateRange.endDate).format('YYYY-MM-DD'));
            }

            if (selectedOutlet) {
                params.append('outlet', selectedOutlet);
            }

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            const response = await axios.get(`/api/report/orders?${params.toString()}`);

            const productsData = Array.isArray(response.data?.data)
                ? response.data.data
                : [];

            setProducts(productsData);
            setError(null);
        } catch (err) {
            console.error("Error fetching products:", err);
            setError("Failed to load products.");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchOutlets = async () => {
        try {
            const response = await axios.get('/api/outlet');

            const outletsData = Array.isArray(response.data)
                ? response.data
                : (response.data && Array.isArray(response.data.data))
                    ? response.data.data
                    : [];

            setOutlets(outletsData);
            setError(null);
        } catch (err) {
            console.error("Error fetching outlets:", err);
            setError("Failed to load outlets. Please try again later.");
            setOutlets([]);
        }
    };

    useEffect(() => {
        fetchOutlets();
    }, []);

    useEffect(() => {
        if (dateRange) {
            fetchProducts();
        }
    }, [dateRange, selectedOutlet, searchTerm]);

    const options = [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((outlet) => ({
            value: outlet._id,
            label: outlet.name,
        })),
    ];

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
        let newStatus;

        if (Array.isArray(selectedValues)) {
            newStatus = selectedValues.map(v => v.value || v);
        } else if (selectedValues && selectedValues.value !== undefined) {
            newStatus = selectedValues.value ? [selectedValues.value] : [];
        } else if (selectedValues === null || selectedValues === undefined) {
            newStatus = [];
        } else {
            newStatus = [];
        }

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
            filtered = filtered.filter(product => {
                return selectedStatus.includes(product.status);
            });
        }

        return filtered;
    }, [products, selectedStatus]);

    // Paginate the filtered data
    const paginatedData = useMemo(() => {
        if (!Array.isArray(filteredData)) {
            console.error('filteredData is not an array:', filteredData);
            return [];
        }
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
        if (!Array.isArray(filteredData)) return totals;
        filteredData.forEach(product => {
            try {
                const grandTotal = Math.round(Number(product?.grandTotal) || 0);
                totals.grandTotalFinal += grandTotal;
            } catch (err) {
                console.error("Error calculating totals for product:", err);
            }
        });
        return totals;
    }, [filteredData]);

    // Export to Excel function - Direct export without modal
    const handleExportExcel = async () => {
        if (!filteredData || filteredData.length === 0) {
            alert("Tidak ada data untuk diekspor");
            return;
        }

        setIsExporting(true);

        try {
            // Get outlet name
            const outletName = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet'
                : 'Semua Outlet';

            // Get date range text
            const dateRangeText = dateRange?.startDate && dateRange?.endDate
                ? `${dayjs(dateRange.startDate).format('DD/MM/YYYY')} - ${dayjs(dateRange.endDate).format('DD/MM/YYYY')}`
                : dayjs().format('DD/MM/YYYY');

            // Get status text
            const statusText = selectedStatus && selectedStatus.length > 0
                ? selectedStatus.join(', ')
                : 'Semua Status';

            // Calculate summary statistics
            const statusBreakdown = {};
            filteredData.forEach(item => {
                const status = item.status || 'Unknown';
                statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
            });

            // Calculate top outlet
            const outletCounts = {};
            filteredData.forEach(item => {
                const outletName = item.outlet?.name || 'Unknown';
                outletCounts[outletName] = (outletCounts[outletName] || 0) + 1;
            });
            const topOutlet = Object.entries(outletCounts).reduce((max, [name, count]) =>
                count > (max.count || 0) ? { name, count } : max, {});

            // Calculate top payment method
            const paymentCounts = {};
            filteredData.forEach(item => {
                const method = item.payments?.[0]?.payment_method || 'Unknown';
                paymentCounts[method] = (paymentCounts[method] || 0) + 1;
            });
            const topPaymentMethod = Object.entries(paymentCounts).reduce((max, [method, count]) =>
                count > (max.count || 0) ? { method, count } : max, {});

            // Calculate top order type
            const orderTypeCounts = {};
            filteredData.forEach(item => {
                const type = item.orderType || 'Unknown';
                orderTypeCounts[type] = (orderTypeCounts[type] || 0) + 1;
            });
            const topOrderType = Object.entries(orderTypeCounts).reduce((max, [type, count]) =>
                count > (max.count || 0) ? { type, count } : max, {});

            const summary = {
                totalTransactions: filteredData.length,
                totalRevenue: grandTotalFinal,
                averageTransaction: filteredData.length > 0
                    ? Math.round(grandTotalFinal / filteredData.length)
                    : 0,
                statusBreakdown,
                topOutlet: topOutlet.name ? topOutlet : null,
                topPaymentMethod: topPaymentMethod.method ? topPaymentMethod : null,
                topOrderType: topOrderType.type ? topOrderType : null
            };

            // Generate filename
            const startDate = dayjs(dateRange.startDate).format('DD-MM-YYYY');
            const endDate = dayjs(dateRange.endDate).format('DD-MM-YYYY');
            const fileName = `Laporan_Status_Penjualan_${outletName.replace(/\s+/g, '_')}_${startDate}_${endDate}.xlsx`;

            // Call export helper
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
        <div className="mb-[50px]">
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <span>Laporan</span>
                    <FaChevronRight />
                    <Link to="/admin/sales-menu">Laporan Penjualan</Link>
                    <FaChevronRight />
                    <span>Status Penjualan</span>
                </h1>

                {/* Direct Export Button - No Modal */}
                <button
                    onClick={handleExportExcel}
                    disabled={isExporting || !filteredData || filteredData.length === 0}
                    className="bg-[#005429] text-white px-4 py-2 rounded flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

            {loading ? (
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
                    receiptRef={receiptRef}
                    currentPage={currentPage}
                    handlePageChange={handlePageChange}
                    totalPages={totalPages}
                    ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                    filteredData={filteredData}
                />
            )}
        </div>
    );
};

export default TypeTransaction;