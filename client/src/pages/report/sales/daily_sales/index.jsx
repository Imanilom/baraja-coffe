import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { Link, useSearchParams } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaDownload } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import Paginated from "../../../../components/paginated";
import DailySalesSkeleton from "./skeleton";

// Extend dayjs with plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const DailySales = () => {
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

    const [products, setProducts] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [dateRange, setDateRange] = useState(null);
    const [filteredData, setFilteredData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);

    const ITEMS_PER_PAGE = 50;

    // Initialize from URL params or set default to today
    useEffect(() => {
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const outletParam = searchParams.get('outletId');
        const pageParam = searchParams.get('page');

        if (startDateParam && endDateParam) {
            setDateRange({
                startDate: startDateParam,
                endDate: endDateParam,
            });
        } else {
            const today = dayjs().format('YYYY-MM-DD');
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
    }, [searchParams]);

    // Update URL when filters change
    const updateURLParams = useCallback((newDateRange, newOutlet, newPage) => {
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

        if (newPage && newPage > 1) {
            params.set('page', newPage.toString());
        }

        setSearchParams(params);
    }, [setSearchParams]);

    // Fetch products and outlets data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [productsResponse, outletsResponse] = await Promise.all([
                    axios.get('/api/orders'),
                    axios.get('/api/outlet')
                ]);

                const productsData = Array.isArray(productsResponse.data)
                    ? productsResponse.data
                    : Array.isArray(productsResponse.data?.data)
                        ? productsResponse.data.data
                        : [];

                const completedData = productsData.filter(item => item.status === "Completed");
                setProducts(completedData);

                const outletsData = Array.isArray(outletsResponse.data)
                    ? outletsResponse.data
                    : Array.isArray(outletsResponse.data?.data)
                        ? outletsResponse.data.data
                        : [];

                setOutlets(outletsData);
                setError(null);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load data. Please try again later.");
                setProducts([]);
                setOutlets([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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

    // Apply filter function - FIXED LOGIC
    const applyFilter = useCallback(() => {
        let filtered = [...products];

        // Filter by outlet - Compare by ID
        if (selectedOutlet) {
            filtered = filtered.filter(product => {
                try {
                    // Check various possible data structures
                    const outletId = product?.outlet?._id ||
                        product?.outlet?.id ||
                        product?.cashier?.outlet?.[0]?.outletId?._id ||
                        product?.cashier?.outlet?.[0]?.outletId?.id;

                    return outletId === selectedOutlet;
                } catch (err) {
                    console.error("Error filtering by outlet:", err);
                    return false;
                }
            });
        }

        // Filter by date range - Use dayjs for consistency
        if (dateRange?.startDate && dateRange?.endDate) {
            filtered = filtered.filter(product => {
                try {
                    if (!product.createdAt) return false;

                    const productDate = dayjs(product.createdAt);
                    const startDate = dayjs(dateRange.startDate).startOf('day');
                    const endDate = dayjs(dateRange.endDate).endOf('day');

                    return productDate.isSameOrAfter(startDate) &&
                        productDate.isSameOrBefore(endDate);
                } catch (err) {
                    console.error("Error filtering by date:", err);
                    return false;
                }
            });
        }

        setFilteredData(filtered);
    }, [products, selectedOutlet, dateRange]);

    // Auto-apply filter whenever dependencies change
    useEffect(() => {
        applyFilter();
    }, [applyFilter]);

    // FIXED: Group data by date - Use grandTotal from product
    const groupedArray = useMemo(() => {
        const grouped = {};

        filteredData.forEach(product => {
            try {
                const date = dayjs(product.createdAt).format('DD-MM-YYYY');

                // PERBAIKAN UTAMA: Ambil grandTotal dari product, bukan menghitung manual
                // Jika grandTotal tidak ada, fallback ke perhitungan manual
                let penjualan = 0;
                if (product.grandTotal !== undefined && product.grandTotal !== null) {
                    penjualan = Number(product.grandTotal) || 0;
                } else if (Array.isArray(product?.items)) {
                    // Fallback: sum dari items jika grandTotal tidak tersedia
                    penjualan = product.items.reduce((sum, item) => {
                        return sum + (Number(item?.subtotal) || 0);
                    }, 0);
                }

                if (!grouped[date]) {
                    grouped[date] = {
                        count: 0,
                        penjualanTotal: 0,
                        products: [],
                        timestamp: product.createdAt
                    };
                }

                grouped[date].products.push(product);
                grouped[date].count++;
                grouped[date].penjualanTotal += penjualan;
            } catch (err) {
                console.error("Error grouping product:", err);
            }
        });

        // Convert to array and sort by date (descending - newest first)
        return Object.entries(grouped)
            .map(([date, data]) => ({
                date,
                ...data
            }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [filteredData]);

    // Paginate data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return groupedArray.slice(startIndex, endIndex);
    }, [groupedArray, currentPage]);

    const totalPages = Math.ceil(groupedArray.length / ITEMS_PER_PAGE);

    // FIXED: Calculate grand totals - Use penjualanTotal from groupedArray
    const { grandTotalItems, grandTotalPenjualan } = useMemo(() => {
        return groupedArray.reduce((totals, group) => ({
            grandTotalItems: totals.grandTotalItems + group.count,
            grandTotalPenjualan: totals.grandTotalPenjualan + group.penjualanTotal
        }), { grandTotalItems: 0, grandTotalPenjualan: 0 });
    }, [groupedArray]);

    const formatCurrency = (amount) => {
        if (isNaN(amount) || !isFinite(amount)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Export to Excel - FIXED: Use grandTotal data
    const exportToExcel = async () => {
        if (groupedArray.length === 0) {
            alert("Tidak ada data untuk diekspor");
            return;
        }

        setIsExporting(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            // Get outlet name
            const outletName = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet'
                : 'Semua Outlet';

            // Get date range
            const startDate = dayjs(dateRange.startDate).format('DD-MM-YYYY');
            const endDate = dayjs(dateRange.endDate).format('DD-MM-YYYY');
            const dateRangeText = `${startDate} - ${endDate}`;

            // Calculate average from grandTotal
            const rataRataTotal = grandTotalItems > 0
                ? Math.round(grandTotalPenjualan / grandTotalItems)
                : 0;

            // Create export data
            const exportData = [
                { col1: 'Laporan Penjualan Harian', col2: '', col3: '', col4: '' },
                { col1: '', col2: '', col3: '', col4: '' },
                { col1: 'Outlet', col2: outletName, col3: '', col4: '' },
                { col1: 'Tanggal', col2: dateRangeText, col3: '', col4: '' },
                { col1: '', col2: '', col3: '', col4: '' },
                { col1: 'Tanggal', col2: 'Jumlah Transaksi', col3: 'Penjualan', col4: 'Rata-Rata' }
            ];

            // Add data rows (already sorted by groupedArray)
            groupedArray.forEach(group => {
                const avgPerTransaction = group.count > 0
                    ? Math.round(group.penjualanTotal / group.count)
                    : 0;

                exportData.push({
                    col1: group.date,
                    col2: group.count,
                    col3: group.penjualanTotal,
                    col4: avgPerTransaction
                });
            });

            // Add Grand Total row
            exportData.push({
                col1: 'Grand Total',
                col2: grandTotalItems,
                col3: grandTotalPenjualan,
                col4: rataRataTotal
            });

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(exportData, {
                header: ['col1', 'col2', 'col3', 'col4'],
                skipHeader: true
            });

            // Set column widths
            ws['!cols'] = [
                { wch: 20 },
                { wch: 20 },
                { wch: 20 },
                { wch: 15 }
            ];

            // Merge cells for title
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }
            ];

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Penjualan Harian");

            // Generate filename
            const fileName = `Laporan_Penjualan_Harian_${outletName.replace(/\s+/g, '_')}_${startDate.replace(/\//g, '-')}_${endDate.replace(/\//g, '-')}.xlsx`;

            // Export file
            XLSX.writeFile(wb, fileName);

        } catch (error) {
            console.error("Error exporting to Excel:", error);
            alert("Gagal mengekspor data. Silakan coba lagi.");
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) {
        return <DailySalesSkeleton />;
    }

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
        <div className="">
            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <div className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <span>Laporan</span>
                    <FaChevronRight />
                    <Link to="/admin/sales-menu">Laporan Penjualan</Link>
                    <FaChevronRight />
                    <span>Penjualan Harian</span>
                </div>
                <button
                    onClick={exportToExcel}
                    disabled={isExporting || groupedArray.length === 0}
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
                                <th className="px-4 py-3 font-normal">Tanggal</th>
                                <th className="px-4 py-3 font-normal text-right">Jumlah Transaksi</th>
                                <th className="px-4 py-3 font-normal text-right">Penjualan</th>
                                <th className="px-4 py-3 font-normal text-right">Rata-Rata</th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {paginatedData.map((group, index) => {
                                    const avgPerTransaction = group.count > 0
                                        ? group.penjualanTotal / group.count
                                        : 0;

                                    return (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">{group.date}</td>
                                            <td className="px-4 py-3 text-right">{group.count.toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(group.penjualanTotal)}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(avgPerTransaction)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr className="py-6 text-center w-full h-96">
                                    <td colSpan={4}>Tidak ada data ditemukan</td>
                                </tr>
                            </tbody>
                        )}

                        <tfoot className="border-t font-semibold text-sm">
                            <tr>
                                <td className="px-4 py-2">Grand Total</td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {grandTotalItems.toLocaleString('id-ID')}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(grandTotalPenjualan)}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {grandTotalItems > 0
                                            ? formatCurrency(grandTotalPenjualan / grandTotalItems)
                                            : formatCurrency(0)
                                        }
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

export default DailySales;