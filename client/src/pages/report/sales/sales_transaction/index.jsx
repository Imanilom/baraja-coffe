import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { Link, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaDownload } from "react-icons/fa";
import { exportToExcel } from "../../../../utils/exportHelper";
import { useReactToPrint } from "react-to-print";
import SalesTransactionTable from "./table";
import SalesTransactionTableSkeleton from "./skeleton";

const SalesTransaction = () => {
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
    const [isExporting, setIsExporting] = useState(false);

    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [dateRange, setDateRange] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredData, setFilteredData] = useState([]);

    const ensureArray = (data) => Array.isArray(data) ? data : [];
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const dropdownRef = useRef(null);
    const receiptRef = useRef();
    const handlePrint = useReactToPrint({
        content: () => receiptRef.current,
        documentTitle: `Resi_${selectedTrx?.order_id || "transaksi"}`
    });

    // Initialize from URL params or set default to today
    useEffect(() => {
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const outletParam = searchParams.get('outletId');
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

        if (searchParam) {
            setSearchTerm(searchParam);
        }

        if (pageParam) {
            setCurrentPage(parseInt(pageParam, 10));
        }
    }, []);

    // Update URL when filters change
    const updateURLParams = (newDateRange, newOutlet, newSearch, newPage) => {
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

        if (newSearch) {
            params.set('search', newSearch);
        }

        if (newPage && newPage > 1) {
            params.set('page', newPage.toString());
        }

        setSearchParams(params);
    };

    // Fungsi untuk fetch payment details berdasarkan order_id
    const fetchPaymentDetails = async (orderId) => {
        try {
            const response = await axios.get(`/api/getPaymentStatus/${orderId}`);
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return null;
        } catch (err) {
            console.error(`Error fetching payment for order ${orderId}:`, err);
            return null;
        }
    };

    // Fetch products and outlets data with payment details
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/orders');
            const productsData = Array.isArray(response.data)
                ? response.data
                : response.data?.data ?? [];

            const completedData = productsData.filter(item => item.status === "Completed");

            // Fetch payment details untuk setiap order
            const productsWithPayment = await Promise.all(
                completedData.map(async (product) => {
                    try {
                        const paymentDetails = await fetchPaymentDetails(product.order_id);
                        return {
                            ...product,
                            paymentDetails: paymentDetails || null,
                            actualPaymentMethod: paymentDetails?.method || product.paymentMethod || 'N/A'
                        };
                    } catch (err) {
                        console.error(`Error processing payment for ${product.order_id}:`, err);
                        return {
                            ...product,
                            paymentDetails: null,
                            actualPaymentMethod: product.paymentMethod || 'N/A'
                        };
                    }
                })
            );

            setProducts(productsWithPayment);
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
        fetchProducts();
        fetchOutlets();
    }, []);

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
        updateURLParams(newValue, selectedOutlet, searchTerm, 1);
    };

    const handleOutletChange = (selected) => {
        const newOutlet = selected.value;
        setSelectedOutlet(newOutlet);
        setCurrentPage(1);
        updateURLParams(dateRange, newOutlet, searchTerm, 1);
    };

    const handleSearchChange = (newSearch) => {
        setSearchTerm(newSearch);
        setCurrentPage(1);
        updateURLParams(dateRange, selectedOutlet, newSearch, 1);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        updateURLParams(dateRange, selectedOutlet, searchTerm, newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Apply filter function
    const applyFilter = useCallback(() => {
        let filtered = ensureArray([...products]);

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(product => {
                try {
                    const searchTermLower = searchTerm.toLowerCase();
                    return product.items?.some(item => {
                        const menuItem = item?.menuItem;
                        if (!menuItem) return false;
                        const name = (menuItem.name || '').toLowerCase();
                        const customer = (product.user || '').toLowerCase();
                        const receipt = (product.order_id || '').toLowerCase();
                        return name.includes(searchTermLower) ||
                            receipt.includes(searchTermLower) ||
                            customer.includes(searchTermLower);
                    });
                } catch (err) {
                    console.error("Error filtering by search:", err);
                    return false;
                }
            });
        }

        // Filter by outlet
        if (selectedOutlet) {
            filtered = filtered.filter(product => {
                try {
                    const outletId = product.outlet?._id;
                    return outletId === selectedOutlet;
                } catch (err) {
                    console.error("Error filtering by outlet:", err);
                    return false;
                }
            });
        }

        // Filter by date range
        if (dateRange && dateRange.startDate && dateRange.endDate) {
            filtered = filtered.filter(product => {
                try {
                    if (!product.createdAt) return false;
                    const productDate = new Date(product.createdAt);
                    const startDate = new Date(dateRange.startDate);
                    const endDate = new Date(dateRange.endDate);
                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(23, 59, 59, 999);
                    if (isNaN(productDate) || isNaN(startDate) || isNaN(endDate)) {
                        return false;
                    }
                    return productDate >= startDate && productDate <= endDate;
                } catch (err) {
                    console.error("Error filtering by date:", err);
                    return false;
                }
            });
        }

        setFilteredData(filtered);
    }, [products, searchTerm, selectedOutlet, dateRange]);

    useEffect(() => {
        applyFilter();
    }, [applyFilter]);

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

    // Handle Export - langsung dari filtered data
    const handleExport = async () => {
        setIsExporting(true);

        try {
            const formatDateTimeExport = (isoString) => {
                const date = new Date(isoString);
                const pad = (num) => String(num).padStart(2, '0');
                return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
            };

            const exportData = filteredData.flatMap((order) => {
                const outletObj = outlets.find(o => o._id === order.outlet._id);
                const outletName = outletObj?.name || '';
                const outletCode = outletObj?._id || '';

                const paymentMethod = order.actualPaymentMethod || order.paymentMethod || '-';
                const paymentStatus = order.paymentDetails?.status || order.status || '-';
                const paymentCode = order.paymentDetails?.payment_code || '-';
                const transactionId = order.paymentDetails?.transaction_id || '-';

                const filteredItemsSubtotal = order.items.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0);
                const proportionalTax = order.totalTax || 0;
                const proportionalServiceCharge = order.totalServiceFee || 0;
                const filteredGrandTotal = filteredItemsSubtotal + proportionalTax + proportionalServiceCharge;

                const totalDiscount = (order.discounts?.autoPromoDiscount || 0) +
                    (order.discounts?.manualDiscount || 0) +
                    (order.discounts?.voucherDiscount || 0);

                return order.items.map((item, index) => ({
                    "Tanggal & Waktu": formatDateTimeExport(order.createdAt),
                    "ID Struk": order.order_id || '-',
                    "Status Order": order.status || '-',
                    "Status Pembayaran": paymentStatus,
                    "ID / Kode Outlet": outletCode,
                    "Outlet": outletName,
                    "Tipe Penjualan": order.orderType || '-',
                    "Kasir": order.cashierId?.username || '-',
                    "No. Hp Pelanggan": order.cashierId?.phone || '-',
                    "Nama Pelanggan": order.user || '-',
                    "SKU": item.menuItem?.sku || '-',
                    "Nama Produk": item.menuItem?.name || '-',
                    "Kategori": item.menuItem?.category?.name || '-',
                    "Jumlah Produk": item.quantity || 0,
                    "Harga Produk": item.menuItem?.price || 0,
                    "Penjualan Kotor": Number(item.subtotal) || 0,
                    "Diskon Produk": 0,
                    "Subtotal": index === 0 ? filteredItemsSubtotal : '',
                    "Diskon Transaksi": index === 0 ? totalDiscount : '',
                    "Pajak": index === 0 ? Math.round(proportionalTax) : '',
                    "Service Charge": index === 0 ? Math.round(proportionalServiceCharge) : '',
                    "Pembulatan": 0,
                    "Poin Ditukar": 0,
                    "Biaya Admin": 0,
                    "Total": index === 0 ? Math.round(filteredGrandTotal) : '',
                    "Metode Pembayaran": index === 0 ? paymentMethod : '',
                    "Kode Pembayaran": index === 0 ? paymentCode : '',
                    "Transaction ID": index === 0 ? transactionId : '',
                    "Pembayaran": index === 0 ? Math.round(filteredGrandTotal) : '',
                    "Kode Voucher": order.appliedVoucher?.code || '-'
                }));
            });

            const formatDate = (dateStr) => {
                if (!dateStr) return "semua-tanggal";
                const date = new Date(dateStr);
                const dd = String(date.getDate()).padStart(2, '0');
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const yyyy = date.getFullYear();
                return `${dd}-${mm}-${yyyy}`;
            };

            const startLabel = formatDate(dateRange?.startDate);
            const endLabel = formatDate(dateRange?.endDate);
            const fileName = `Penjualan_${startLabel}_${endLabel}.xlsx`;

            const outletLabel = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name || "Semua Outlet"
                : "Semua Outlet";

            const headerInfo = [
                ["Tanggal", `${startLabel} - ${endLabel}`],
                ["Outlet", outletLabel],
                ["Status Transaksi", "Completed"],
                ["Total Data", `${exportData.length} baris`],
            ];

            if (searchTerm) {
                headerInfo.splice(2, 0, ["Filter Pencarian", searchTerm]);
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            exportToExcel(exportData, fileName, headerInfo);
        } catch (error) {
            console.error('Error exporting:', error);
            alert('Terjadi kesalahan saat mengekspor data');
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
                    <span>Data Transaksi Penjualan</span>
                </h1>

                <button
                    onClick={handleExport}
                    disabled={isExporting || filteredData.length === 0}
                    className={`px-4 py-2 rounded flex items-center gap-2 text-sm ${isExporting || filteredData.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#005429] text-white hover:bg-[#003d1f]'
                        }`}
                >
                    {isExporting ? (
                        <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Mengekspor...</span>
                        </>
                    ) : (
                        <>
                            <FaDownload />
                            Ekspor
                        </>
                    )}
                </button>
            </div>

            {loading ? (
                <SalesTransactionTableSkeleton />
            ) : (
                <SalesTransactionTable
                    paginatedData={paginatedData}
                    grandTotalFinal={grandTotalFinal}
                    setSelectedTrx={setSelectedTrx}
                    selectedTrx={selectedTrx}
                    formatDateTime={formatDateTime}
                    formatCurrency={formatCurrency}
                    options={options}
                    selectedOutlet={selectedOutlet}
                    handleOutletChange={handleOutletChange}
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

export default SalesTransaction;