// import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
// import axios from "axios";
// import dayjs from "dayjs";
// import { Link, useSearchParams } from "react-router-dom";
// import { FaChevronRight, FaDownload } from "react-icons/fa";
// import ExportFilter from "../export";
// import { useReactToPrint } from "react-to-print";
// import SalesTransactionTable from "./table";
// import SalesTransactionTableSkeleton from "./skeleton";

// const SalesTransaction = () => {
//     const [searchParams, setSearchParams] = useSearchParams();

//     const customSelectStyles = {
//         control: (provided, state) => ({
//             ...provided,
//             borderColor: '#d1d5db',
//             minHeight: '34px',
//             fontSize: '13px',
//             color: '#6b7280',
//             boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none',
//             '&:hover': {
//                 borderColor: '#9ca3af',
//             },
//         }),
//         singleValue: (provided) => ({
//             ...provided,
//             color: '#6b7280',
//         }),
//         input: (provided) => ({
//             ...provided,
//             color: '#6b7280',
//         }),
//         placeholder: (provided) => ({
//             ...provided,
//             color: '#9ca3af',
//             fontSize: '13px',
//         }),
//         option: (provided, state) => ({
//             ...provided,
//             fontSize: '13px',
//             color: '#374151',
//             backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white',
//             cursor: 'pointer',
//         }),
//     };

//     const [products, setProducts] = useState([]);
//     const [outlets, setOutlets] = useState([]);
//     const [selectedTrx, setSelectedTrx] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);

//     const [selectedOutlet, setSelectedOutlet] = useState("");
//     const [dateRange, setDateRange] = useState(null);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [filteredData, setFilteredData] = useState([]);
//     const [isModalOpen, setIsModalOpen] = useState(false);

//     // Safety function to ensure we're always working with arrays
//     const ensureArray = (data) => Array.isArray(data) ? data : [];
//     const [currentPage, setCurrentPage] = useState(1);
//     const ITEMS_PER_PAGE = 10;

//     const dropdownRef = useRef(null);
//     const receiptRef = useRef();
//     const handlePrint = useReactToPrint({
//         content: () => receiptRef.current,
//         documentTitle: `Resi_${selectedTrx?.order_id || "transaksi"}`
//     });

//     // Initialize from URL params or set default to today
//     useEffect(() => {
//         const startDateParam = searchParams.get('startDate');
//         const endDateParam = searchParams.get('endDate');
//         const outletParam = searchParams.get('outletId');
//         const searchParam = searchParams.get('search');
//         const pageParam = searchParams.get('page');

//         if (startDateParam && endDateParam) {
//             setDateRange({
//                 startDate: dayjs(startDateParam),
//                 endDate: dayjs(endDateParam),
//             });
//         } else {
//             setDateRange({
//                 startDate: dayjs(),
//                 endDate: dayjs()
//             });
//         }

//         if (outletParam) {
//             setSelectedOutlet(outletParam);
//         }

//         if (searchParam) {
//             setSearchTerm(searchParam);
//         }

//         if (pageParam) {
//             setCurrentPage(parseInt(pageParam, 10));
//         }
//     }, []);

//     // Update URL when filters change
//     const updateURLParams = (newDateRange, newOutlet, newSearch, newPage) => {
//         const params = new URLSearchParams();

//         if (newDateRange?.startDate && newDateRange?.endDate) {
//             const startDate = dayjs(newDateRange.startDate).format('YYYY-MM-DD');
//             const endDate = dayjs(newDateRange.endDate).format('YYYY-MM-DD');
//             params.set('startDate', startDate);
//             params.set('endDate', endDate);
//         }

//         if (newOutlet) {
//             params.set('outletId', newOutlet);
//         }

//         if (newSearch) {
//             params.set('search', newSearch);
//         }

//         if (newPage && newPage > 1) {
//             params.set('page', newPage.toString());
//         }

//         setSearchParams(params);
//     };

//     // Fetch products and outlets data
//     const fetchProducts = async () => {
//         setLoading(true);
//         try {
//             const response = await axios.get('/api/orders');
//             const productsData = Array.isArray(response.data)
//                 ? response.data
//                 : response.data?.data ?? [];

//             const completedData = productsData.filter(item => item.status === "Completed");

//             setProducts(completedData);
//             // setProducts(productsData);
//             setError(null);
//         } catch (err) {
//             console.error("Error fetching products:", err);
//             setError("Failed to load products.");
//             setProducts([]);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchOutlets = async () => {
//         try {
//             const response = await axios.get('/api/outlet');

//             const outletsData = Array.isArray(response.data)
//                 ? response.data
//                 : (response.data && Array.isArray(response.data.data))
//                     ? response.data.data
//                     : [];

//             setOutlets(outletsData);
//             setError(null);
//         } catch (err) {
//             console.error("Error fetching outlets:", err);
//             setError("Failed to load outlets. Please try again later.");
//             setOutlets([]);
//         }
//     };

//     useEffect(() => {
//         fetchProducts();
//         fetchOutlets();
//     }, []);

//     const options = [
//         { value: "", label: "Semua Outlet" },
//         ...outlets.map((outlet) => ({
//             value: outlet._id,
//             label: outlet.name,
//         })),
//     ];

//     // Handle filter changes
//     const handleDateRangeChange = (newValue) => {
//         setDateRange(newValue);
//         setCurrentPage(1);
//         updateURLParams(newValue, selectedOutlet, searchTerm, 1);
//     };

//     const handleOutletChange = (selected) => {
//         const newOutlet = selected.value;
//         setSelectedOutlet(newOutlet);
//         setCurrentPage(1);
//         updateURLParams(dateRange, newOutlet, searchTerm, 1);
//     };

//     const handleSearchChange = (newSearch) => {
//         setSearchTerm(newSearch);
//         setCurrentPage(1);
//         updateURLParams(dateRange, selectedOutlet, newSearch, 1);
//     };

//     const handlePageChange = (newPage) => {
//         setCurrentPage(newPage);
//         updateURLParams(dateRange, selectedOutlet, searchTerm, newPage);
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//     };

//     // Apply filter function
//     const applyFilter = useCallback(() => {
//         let filtered = ensureArray([...products]);

//         // Filter by search term (product name, customer, or receipt ID)
//         if (searchTerm) {
//             filtered = filtered.filter(product => {
//                 try {
//                     const searchTermLower = searchTerm.toLowerCase();

//                     return product.items?.some(item => {
//                         const menuItem = item?.menuItem;
//                         if (!menuItem) return false;

//                         const name = (menuItem.name || '').toLowerCase();
//                         const customer = (product.user || '').toLowerCase();
//                         const receipt = (product.order_id || '').toLowerCase();

//                         return name.includes(searchTermLower) ||
//                             receipt.includes(searchTermLower) ||
//                             customer.includes(searchTermLower);
//                     });
//                 } catch (err) {
//                     console.error("Error filtering by search:", err);
//                     return false;
//                 }
//             });
//         }

//         // Filter by outlet
//         if (selectedOutlet) {
//             filtered = filtered.filter(product => {
//                 try {
//                     const outletId = product.outlet?._id;
//                     return outletId === selectedOutlet;
//                 } catch (err) {
//                     console.error("Error filtering by outlet:", err);
//                     return false;
//                 }
//             });
//         }

//         // Filter by date range
//         if (dateRange && dateRange.startDate && dateRange.endDate) {
//             filtered = filtered.filter(product => {
//                 try {
//                     if (!product.createdAt) {
//                         return false;
//                     }

//                     const productDate = new Date(product.createdAt);
//                     const startDate = new Date(dateRange.startDate);
//                     const endDate = new Date(dateRange.endDate);

//                     // Set time to beginning/end of day for proper comparison
//                     startDate.setHours(0, 0, 0, 0);
//                     endDate.setHours(23, 59, 59, 999);

//                     // Check if dates are valid
//                     if (isNaN(productDate) || isNaN(startDate) || isNaN(endDate)) {
//                         return false;
//                     }

//                     const isInRange = productDate >= startDate && productDate <= endDate;
//                     return isInRange;
//                 } catch (err) {
//                     console.error("Error filtering by date:", err);
//                     return false;
//                 }
//             });
//         }

//         setFilteredData(filtered);
//     }, [products, searchTerm, selectedOutlet, dateRange]);

//     // Auto-apply filter whenever dependencies change
//     useEffect(() => {
//         applyFilter();
//     }, [applyFilter]);

//     // Paginate the filtered data
//     const paginatedData = useMemo(() => {
//         if (!Array.isArray(filteredData)) {
//             console.error('filteredData is not an array:', filteredData);
//             return [];
//         }

//         const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
//         const endIndex = startIndex + ITEMS_PER_PAGE;
//         const result = filteredData.slice(startIndex, endIndex);
//         return result;
//     }, [currentPage, filteredData]);

//     const formatCurrency = (amount) => {
//         return new Intl.NumberFormat('id-ID', {
//             style: 'currency',
//             currency: 'IDR',
//             minimumFractionDigits: 0,
//             maximumFractionDigits: 0
//         }).format(amount);
//     };

//     const formatDateTime = (datetime) => {
//         const date = new Date(datetime);
//         const pad = (n) => n.toString().padStart(2, "0");
//         return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
//     };

//     // Calculate total pages based on filtered data
//     const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

//     // PERBAIKAN: Calculate grand totals berdasarkan grandTotal dari setiap order
//     const { grandTotalFinal } = useMemo(() => {
//         const totals = {
//             grandTotalFinal: 0,
//         };

//         if (!Array.isArray(filteredData)) {
//             return totals;
//         }

//         filteredData.forEach(product => {
//             try {
//                 // PENTING: Pastikan grandTotal adalah number, dibulatkan, dan tidak undefined/null
//                 const grandTotal = Math.round(Number(product?.grandTotal) || 0);
//                 totals.grandTotalFinal += grandTotal;
//             } catch (err) {
//                 console.error("Error calculating totals for product:", err);
//             }
//         });

//         return totals;
//     }, [filteredData]);

//     // Show error state
//     if (error) {
//         return (
//             <div className="flex justify-center items-center h-screen">
//                 <div className="text-red-500 text-center">
//                     <p className="text-xl font-semibold mb-2">Error</p>
//                     <p>{error}</p>
//                     <button
//                         onClick={() => window.location.reload()}
//                         className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
//                     >
//                         Refresh
//                     </button>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="mb-[50px]">
//             {/* Breadcrumb */}
//             <div className="flex justify-between items-center px-6 py-3 my-3">
//                 <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
//                     <span>Laporan</span>
//                     <FaChevronRight />
//                     <Link to="/admin/sales-menu">Laporan Penjualan</Link>
//                     <FaChevronRight />
//                     <span>Data Transaksi Penjualan</span>
//                 </h1>

//                 <ExportFilter
//                     isOpen={isModalOpen}
//                     onClose={() => setIsModalOpen(false)}
//                 />
//                 <button
//                     onClick={() => setIsModalOpen(true)}
//                     className="bg-[#005429] text-white px-4 py-2 rounded flex items-center gap-2 text-sm">
//                     <FaDownload />Ekspor
//                 </button>
//             </div>

//             {/* Filters & Table */}
//             {loading ? (
//                 <SalesTransactionTableSkeleton />
//             ) : (
//                 <SalesTransactionTable
//                     paginatedData={paginatedData}
//                     grandTotalFinal={grandTotalFinal}
//                     setSelectedTrx={setSelectedTrx}
//                     selectedTrx={selectedTrx}
//                     formatDateTime={formatDateTime}
//                     formatCurrency={formatCurrency}
//                     options={options}
//                     selectedOutlet={selectedOutlet}
//                     handleOutletChange={handleOutletChange}
//                     dateRange={dateRange}
//                     handleDateRangeChange={handleDateRangeChange}
//                     searchTerm={searchTerm}
//                     handleSearchChange={handleSearchChange}
//                     customSelectStyles={customSelectStyles}
//                     receiptRef={receiptRef}
//                     currentPage={currentPage}
//                     handlePageChange={handlePageChange}
//                     totalPages={totalPages}
//                     ITEMS_PER_PAGE={ITEMS_PER_PAGE}
//                     filteredData={filteredData}
//                 />
//             )}
//         </div>
//     );
// };

// export default SalesTransaction;

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { Link, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaDownload } from "react-icons/fa";
import ExportFilter from "../export";
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

    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [dateRange, setDateRange] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Safety function to ensure we're always working with arrays
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
                            // Gunakan payment method dari payment details jika ada
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

        // Filter by search term (product name, customer, or receipt ID)
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
                    if (!product.createdAt) {
                        return false;
                    }

                    const productDate = new Date(product.createdAt);
                    const startDate = new Date(dateRange.startDate);
                    const endDate = new Date(dateRange.endDate);

                    // Set time to beginning/end of day for proper comparison
                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(23, 59, 59, 999);

                    // Check if dates are valid
                    if (isNaN(productDate) || isNaN(startDate) || isNaN(endDate)) {
                        return false;
                    }

                    const isInRange = productDate >= startDate && productDate <= endDate;
                    return isInRange;
                } catch (err) {
                    console.error("Error filtering by date:", err);
                    return false;
                }
            });
        }

        setFilteredData(filtered);
    }, [products, searchTerm, selectedOutlet, dateRange]);

    // Auto-apply filter whenever dependencies change
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
        const result = filteredData.slice(startIndex, endIndex);
        return result;
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

    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    // Calculate grand totals berdasarkan grandTotal dari setiap order
    const { grandTotalFinal } = useMemo(() => {
        const totals = {
            grandTotalFinal: 0,
        };

        if (!Array.isArray(filteredData)) {
            return totals;
        }

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
        <div className="mb-[50px]">
            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <span>Laporan</span>
                    <FaChevronRight />
                    <Link to="/admin/sales-menu">Laporan Penjualan</Link>
                    <FaChevronRight />
                    <span>Data Transaksi Penjualan</span>
                </h1>

                <ExportFilter
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#005429] text-white px-4 py-2 rounded flex items-center gap-2 text-sm">
                    <FaDownload />Ekspor
                </button>
            </div>

            {/* Filters & Table */}
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