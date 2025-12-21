import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Link, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaDownload } from "react-icons/fa";
import { exportToExcel } from "../../../../utils/exportHelper";
import { useReactToPrint } from "react-to-print";
import SalesTransactionTable from "./table";
import SalesTransactionTableSkeleton from "./skeleton";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = 'Asia/Jakarta';

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

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [limit, setLimit] = useState(20);

    const dropdownRef = useRef(null);
    const receiptRef = useRef();
    const handlePrint = useReactToPrint({
        content: () => receiptRef.current,
        documentTitle: `Resi_${selectedTrx?.order_id || "transaksi"}`
    });

    const formatDateForAPI = (date) => {
        if (!date) return null;
        return dayjs(date).tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD');
    };

    const parseDateFromURL = (dateStr) => {
        if (!dateStr) return null;
        return dayjs.tz(dateStr, DEFAULT_TIMEZONE);
    };

    useEffect(() => {
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const outletParam = searchParams.get('outletId');
        const searchParam = searchParams.get('search');
        const pageParam = searchParams.get('page');
        const limitParam = searchParams.get('limit');

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

            updateURLParams(newDateRange, outletParam || "", searchParam || "",
                parseInt(pageParam, 10) || 1, parseInt(limitParam, 10) || 20);
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

        if (limitParam) {
            setLimit(parseInt(limitParam, 10));
        }
    }, []);

    const updateURLParams = (newDateRange, newOutlet, newSearch, newPage, newLimit) => {
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

        if (newPage && newPage > 1) {
            params.set('page', newPage.toString());
        }

        if (newLimit && newLimit !== 20) {
            params.set('limit', newLimit.toString());
        }

        setSearchParams(params);
    };

    const fetchProducts = async () => {
        if (!dateRange?.startDate || !dateRange?.endDate) {
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams();

            params.append('mode', 'paginated');
            params.append('page', currentPage);
            params.append('limit', limit);
            params.append('status', 'Completed');

            if (selectedOutlet) {
                params.append('outlet', selectedOutlet);
            }

            if (dateRange?.startDate && dateRange?.endDate) {
                params.append('startDate', formatDateForAPI(dateRange.startDate));
                params.append('endDate', formatDateForAPI(dateRange.endDate));
            }

            const response = await axios.get(`/api/report/orders?${params.toString()}`);

            const productsData = Array.isArray(response.data?.data)
                ? response.data.data
                : [];

            setProducts(productsData);

            if (response.data?.pagination) {
                setTotalPages(response.data.pagination.totalPages);
                setTotalOrders(response.data.pagination.totalOrders);
            }
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
    }, [currentPage, limit, selectedOutlet, dateRange]);

    useEffect(() => {
        fetchOutlets();
    }, []);

    const options = [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((outlet) => ({
            value: outlet._id,
            label: outlet.name,
        })),
    ];

    const handleDateRangeChange = (newValue) => {
        setDateRange(newValue);
        setCurrentPage(1);
        updateURLParams(newValue, selectedOutlet, searchTerm, 1, limit);
    };

    const handleOutletChange = (selected) => {
        const newOutlet = selected.value;
        setSelectedOutlet(newOutlet);
        setCurrentPage(1);
        updateURLParams(dateRange, newOutlet, searchTerm, 1, limit);
    };

    const handleSearchChange = (newSearch) => {
        setSearchTerm(newSearch);
        updateURLParams(dateRange, selectedOutlet, newSearch, currentPage, limit);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        updateURLParams(dateRange, selectedOutlet, searchTerm, newPage, limit);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLimitChange = (newLimit) => {
        setLimit(newLimit);
        setCurrentPage(1);
        updateURLParams(dateRange, selectedOutlet, searchTerm, 1, newLimit);
    };

    const applyFilter = useCallback((data, search) => {
        if (!search) return data;

        const searchTermLower = search.toLowerCase();
        return data.filter(product => {
            try {
                const receipt = (product.order_id || '').toLowerCase();
                if (receipt.includes(searchTermLower)) return true;

                const customer = (product.user || '').toLowerCase();
                if (customer.includes(searchTermLower)) return true;

                // Search dalam items
                const itemsMatch = product.items?.some(item => {
                    const menuItemDataName = (item?.menuItemData?.name || '').toLowerCase();
                    if (menuItemDataName.includes(searchTermLower)) return true;

                    const menuItemName = (item?.menuItem?.name || '').toLowerCase();
                    if (menuItemName.includes(searchTermLower)) return true;

                    if (Array.isArray(item?.addons)) {
                        return item.addons.some(addon => {
                            if (Array.isArray(addon?.options)) {
                                return addon.options.some(option => {
                                    const label = (option?.label || '').toLowerCase();
                                    return label.includes(searchTermLower);
                                });
                            }
                            return false;
                        });
                    }

                    return false;
                });

                if (itemsMatch) return true;

                // Search dalam customAmountItems
                const customAmountMatch = product.customAmountItems?.some(customItem => {
                    const customName = (customItem?.name || '').toLowerCase();
                    return customName.includes(searchTermLower);
                });

                return customAmountMatch;
            } catch (err) {
                console.error("Error filtering by search:", err);
                return false;
            }
        });
    }, []);

    const filteredData = useMemo(() => {
        return applyFilter(products, searchTerm);
    }, [products, searchTerm, applyFilter]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDateTime = (datetime) => {
        return dayjs(datetime).tz(DEFAULT_TIMEZONE).format('DD/MM/YYYY HH:mm:ss');
    };

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

    const handleExport = async () => {
        setIsExporting(true);

        try {
            // Pastikan outlets sudah di-load
            if (outlets.length === 0) {
                await fetchOutlets();
            }

            const params = new URLSearchParams();
            params.append('mode', 'all');
            params.append('status', 'Completed');

            if (selectedOutlet) {
                params.append('outlet', selectedOutlet);
            }

            if (dateRange?.startDate && dateRange?.endDate) {
                params.append('startDate', formatDateForAPI(dateRange.startDate));
                params.append('endDate', formatDateForAPI(dateRange.endDate));
            }

            // PERBAIKAN KRITIS: Kirim searchTerm ke backend
            if (searchTerm) {
                params.append('search', searchTerm);
            }

            const response = await axios.get(`/api/report/orders?${params.toString()}`, {
                timeout: 120000 // 120 detik untuk data besar
            });

            const allData = Array.isArray(response.data?.data) ? response.data.data : [];

            // Validasi jumlah data
            const expectedCount = searchTerm ? filteredData.length : totalOrders;
            if (allData.length < expectedCount * 0.9) { // Toleransi 10%
                console.warn(`⚠️ WARNING: Expected ~${expectedCount} orders but got ${allData.length}`);
                const proceed = window.confirm(
                    `Peringatan: Hanya ${allData.length} dari ~${expectedCount} transaksi yang berhasil di-fetch.\n\n` +
                    `Kemungkinan ada masalah pada backend API atau koneksi.\n\n` +
                    `Apakah Anda tetap ingin melanjutkan export dengan data yang ada?`
                );
                if (!proceed) {
                    setIsExporting(false);
                    return;
                }
            }

            // Validasi setiap order
            const validOrders = allData.filter(order => {
                if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
                    console.warn('⚠️ Order without items:', order.order_id);
                    return false;
                }
                return true;
            });

            // PERBAIKAN: Tidak perlu filter lagi karena backend sudah filter
            const exportData = validOrders;

            if (exportData.length === 0) {
                alert('Tidak ada data untuk di-export. Pastikan filter yang dipilih menghasilkan data.');
                setIsExporting(false);
                return;
            }

            const formatDateTimeExport = (isoString) => {
                return dayjs(isoString).tz(DEFAULT_TIMEZONE).format('DD-MM-YYYY HH:mm:ss');
            };

            let totalRowsGenerated = 0;
            const formattedExportData = exportData.flatMap((order) => {
                try {
                    if (!order.items || !Array.isArray(order.items)) {
                        console.warn('⚠️ Invalid order structure:', order.order_id);
                        return [];
                    }

                    const outletObj = outlets.find(o => o._id === (order.outlet?._id || order.outlet));
                    const outletName = outletObj?.name || 'Unknown Outlet';
                    const outletCode = outletObj?._id || '-';

                    const paymentMethod = order.actualPaymentMethod || order.paymentMethod || '-';
                    const paymentStatus = order.paymentDetails?.status || order.status || '-';
                    const paymentCode = order.paymentDetails?.payment_code || '-';
                    const transactionId = order.paymentDetails?.transaction_id || '-';

                    // Hitung subtotal dari items dan customAmountItems
                    const itemsSubtotal = order.items.reduce((acc, item) => {
                        return acc + (Number(item.subtotal) || 0);
                    }, 0);

                    const customAmountSubtotal = (order.customAmountItems || []).reduce((acc, customItem) => {
                        return acc + (Number(customItem.amount) || 0);
                    }, 0);

                    const filteredItemsSubtotal = itemsSubtotal + customAmountSubtotal;

                    const proportionalTax = order.totalTax || 0;
                    const proportionalServiceCharge = order.totalServiceFee || 0;
                    const filteredGrandTotal = filteredItemsSubtotal + proportionalTax + proportionalServiceCharge;

                    const totalDiscount = (order.discounts?.autoPromoDiscount || 0) +
                        (order.discounts?.manualDiscount || 0) +
                        (order.discounts?.voucherDiscount || 0);

                    // Process regular items
                    const itemRows = order.items.map((item, index) => {
                        const itemName = item.menuItemData?.name || item.menuItem?.name || 'Produk tidak diketahui';
                        const itemSKU = item.menuItemData?.sku || item.menuItem?.sku || '-';
                        const itemPrice = item.menuItemData?.price || item.menuItem?.price || 0;

                        // Extract category
                        let itemCategory = '-';
                        if (item.menuItemData?.category) {
                            itemCategory = typeof item.menuItemData.category === 'object'
                                ? item.menuItemData.category.name
                                : item.menuItemData.category;
                        } else if (item.menuItem?.category) {
                            itemCategory = typeof item.menuItem.category === 'object'
                                ? item.menuItem.category.name
                                : item.menuItem.category;
                        } else if (item.menuItem?.mainCategory) {
                            itemCategory = item.menuItem.mainCategory;
                        }

                        // Extract addons
                        const addonLabels = [];
                        if (Array.isArray(item?.addons)) {
                            item.addons.forEach(addon => {
                                if (Array.isArray(addon?.options)) {
                                    addon.options.forEach(option => {
                                        if (option?.label) {
                                            addonLabels.push(option.label);
                                        }
                                    });
                                }
                            });
                        }

                        if (Array.isArray(item?.menuItemData?.selectedAddons)) {
                            item.menuItemData.selectedAddons.forEach(addon => {
                                if (Array.isArray(addon?.options)) {
                                    addon.options.forEach(option => {
                                        if (option?.label && !addonLabels.includes(option.label)) {
                                            addonLabels.push(option.label);
                                        }
                                    });
                                }
                            });
                        }

                        let fullProductName = itemName;
                        if (addonLabels.length > 0) {
                            fullProductName = `${itemName} ( ${addonLabels.join(', ')} )`;
                        }

                        return {
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
                            "SKU": itemSKU,
                            "Nama Produk": fullProductName,
                            "Kategori": itemCategory,
                            "Jumlah Produk": item.quantity || 0,
                            "Harga Produk": itemPrice,
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
                        };
                    });

                    // Process customAmountItems
                    const customAmountRows = (order.customAmountItems || []).map((customItem, index) => {
                        const isFirstRow = index === 0 && order.items.length === 0;

                        return {
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
                            "SKU": '-',
                            "Nama Produk": `[Custom] ${customItem.name || 'Custom Amount'}`,
                            "Kategori": 'Custom Amount',
                            "Jumlah Produk": 1,
                            "Harga Produk": Number(customItem.amount) || 0,
                            "Penjualan Kotor": Number(customItem.amount) || 0,
                            "Diskon Produk": 0,
                            "Subtotal": isFirstRow ? filteredItemsSubtotal : '',
                            "Diskon Transaksi": isFirstRow ? totalDiscount : '',
                            "Pajak": isFirstRow ? Math.round(proportionalTax) : '',
                            "Service Charge": isFirstRow ? Math.round(proportionalServiceCharge) : '',
                            "Pembulatan": 0,
                            "Poin Ditukar": 0,
                            "Biaya Admin": 0,
                            "Total": isFirstRow ? Math.round(filteredGrandTotal) : '',
                            "Metode Pembayaran": isFirstRow ? paymentMethod : '',
                            "Kode Pembayaran": isFirstRow ? paymentCode : '',
                            "Transaction ID": isFirstRow ? transactionId : '',
                            "Pembayaran": isFirstRow ? Math.round(filteredGrandTotal) : '',
                            "Kode Voucher": order.appliedVoucher?.code || '-'
                        };
                    });

                    totalRowsGenerated += itemRows.length + customAmountRows.length;
                    return [...itemRows, ...customAmountRows];
                } catch (err) {
                    console.error('❌ Error processing order:', order.order_id, err);
                    return [];
                }
            });

            if (formattedExportData.length === 0) {
                alert('Tidak ada data untuk di-export setelah processing. Periksa struktur data order.');
                setIsExporting(false);
                return;
            }

            const formatDate = (dateObj) => {
                if (!dateObj) return "semua-tanggal";
                return dayjs(dateObj).tz(DEFAULT_TIMEZONE).format('DD-MM-YYYY');
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
                ["Total Transaksi", `${exportData.length} transaksi`],
                ["Total Baris Data", `${formattedExportData.length} baris`],
            ];

            if (searchTerm) {
                headerInfo.splice(2, 0, ["Filter Pencarian", searchTerm]);
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            exportToExcel(formattedExportData, fileName, headerInfo);

        } catch (error) {
            console.error('❌ Error exporting:', error);
            let errorMessage = 'Terjadi kesalahan saat mengekspor data: ' + error.message;

            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Timeout: Waktu export terlalu lama. Coba kurangi range tanggal atau filter data.';
            } else if (error.response?.status === 504) {
                errorMessage = 'Gateway Timeout: Server membutuhkan waktu terlalu lama. Coba kurangi jumlah data.';
            }

            alert(errorMessage);
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
                    paginatedData={filteredData}
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
                    ITEMS_PER_PAGE={limit}
                    filteredData={filteredData}
                    handleLimitChange={handleLimitChange}
                    totalOrders={totalOrders}
                />
            )}
        </div>
    );
};

export default SalesTransaction;