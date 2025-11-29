import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { Link, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaDownload } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import Paginated from "../../../../components/paginated";
import CustomerSalesSkeleton from "./skeleton";

// Extend dayjs with plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const CustomerSales = () => {
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

    const [search, setSearch] = useState("");
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [dateRange, setDateRange] = useState(null);
    const [filteredData, setFilteredData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isInitialized, setIsInitialized] = useState(false);

    const ITEMS_PER_PAGE = 10;

    // Initialize filters from URL on component mount
    useEffect(() => {
        const page = parseInt(searchParams.get('page')) || 1;
        const searchQuery = searchParams.get('search') || '';
        const outlet = searchParams.get('outlet') || '';
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        setCurrentPage(page);
        setSearch(searchQuery);
        setSelectedOutlet(outlet);

        if (startDate && endDate) {
            setDateRange({
                startDate: startDate,
                endDate: endDate
            });
        } else {
            const today = dayjs().format('YYYY-MM-DD');
            setDateRange({
                startDate: today,
                endDate: today
            });
        }

        setIsInitialized(true);
    }, [searchParams]);

    // Update URL when filters change
    const updateURLParams = useCallback((newPage, newSearch, newOutlet, newDateRange) => {
        const params = new URLSearchParams();

        if (newPage > 1) {
            params.set('page', newPage.toString());
        }

        if (newSearch) {
            params.set('search', newSearch);
        }

        if (newOutlet) {
            params.set('outlet', newOutlet);
        }

        if (newDateRange?.startDate && newDateRange?.endDate) {
            const startDate = dayjs(newDateRange.startDate).format('YYYY-MM-DD');
            const endDate = dayjs(newDateRange.endDate).format('YYYY-MM-DD');
            params.set('startDate', startDate);
            params.set('endDate', endDate);
        }

        setSearchParams(params, { replace: true });
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

    const options = useMemo(() => [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((o) => ({ value: o._id, label: o.name })),
    ], [outlets]);

    // Handler functions
    const handleDateRangeChange = (newValue) => {
        setDateRange(newValue);
        setCurrentPage(1);
        updateURLParams(1, search, selectedOutlet, newValue);
    };

    const handleSearchChange = (e) => {
        const newSearch = e.target.value;
        setSearch(newSearch);
        setCurrentPage(1);
        updateURLParams(1, newSearch, selectedOutlet, dateRange);
    };

    const handleOutletChange = (selected) => {
        const newOutlet = selected?.value || "";
        setSelectedOutlet(newOutlet);
        setCurrentPage(1);
        updateURLParams(1, search, newOutlet, dateRange);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        updateURLParams(newPage, search, selectedOutlet, dateRange);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Apply filter function - FIXED LOGIC
    const applyFilter = useCallback(() => {
        let filtered = [...products];

        // Filter by search term - PERBAIKAN: search di nama customer dan phone
        if (search) {
            filtered = filtered.filter(product => {
                try {
                    const customerName = (product?.user || '').toLowerCase();
                    const customerPhone = (product?.user_id?.phone || '').toLowerCase();
                    const searchTerm = search.toLowerCase();

                    return customerName.includes(searchTerm) ||
                        customerPhone.includes(searchTerm);
                } catch (err) {
                    console.error("Error filtering by search:", err);
                    return false;
                }
            });
        }

        // Filter by outlet - PERBAIKAN: cek struktur data yang benar
        if (selectedOutlet) {
            filtered = filtered.filter(product => {
                try {
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

        // Filter by date range - PERBAIKAN: gunakan dayjs untuk konsistensi
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
    }, [products, search, selectedOutlet, dateRange]);

    // Auto-apply filter whenever dependencies change
    useEffect(() => {
        if (isInitialized) {
            applyFilter();
        }
    }, [applyFilter, isInitialized]);

    // Group data by customer - PERBAIKAN: gunakan grandTotal bukan subtotal
    const groupedArray = useMemo(() => {
        const grouped = {};

        filteredData.forEach(product => {
            try {
                const customer = product?.user_id || {};
                const customerPhone = customer.phone || null;
                const customerName = product?.user || 'Unknown';

                // ✅ PERBAIKAN: gunakan grandTotal dari product
                const grandTotal = Number(product?.grandTotal) || 0;

                // Group by phone+name or just name if no phone
                const groupKey = customerPhone
                    ? `${customerPhone}|${customerName}`
                    : `${customerName}`;

                if (!grouped[groupKey]) {
                    grouped[groupKey] = {
                        customerName,
                        customer,
                        count: 0,
                        grandTotalSum: 0,  // ← nama field berubah
                        products: []
                    };
                }

                grouped[groupKey].products.push(product);
                grouped[groupKey].count++;
                grouped[groupKey].grandTotalSum += grandTotal;  // ← akumulasi grandTotal
            } catch (err) {
                console.error("Error grouping product:", err);
            }
        });

        // Convert to array and sort by total sales descending
        return Object.values(grouped).sort((a, b) => b.grandTotalSum - a.grandTotalSum);
    }, [filteredData]);

    // Paginate data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return groupedArray.slice(startIndex, endIndex);
    }, [groupedArray, currentPage]);

    const totalPages = Math.ceil(groupedArray.length / ITEMS_PER_PAGE);

    // Calculate grand totals - PERBAIKAN: gunakan grandTotalSum
    const { totalTransaksi, totalPenjualan } = useMemo(() => {
        return groupedArray.reduce((totals, group) => ({
            totalTransaksi: totals.totalTransaksi + group.count,
            totalPenjualan: totals.totalPenjualan + group.grandTotalSum  // ← dari grandTotalSum
        }), { totalTransaksi: 0, totalPenjualan: 0 });
    }, [groupedArray]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Export to Excel - PERBAIKAN: gunakan grandTotal
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

            // Create export data
            const exportData = [
                { col1: 'Laporan Penjualan Per Pelanggan', col2: '', col3: '', col4: '', col5: '', col6: '' },
                { col1: '', col2: '', col3: '', col4: '', col5: '', col6: '' },
                { col1: 'Outlet', col2: outletName, col3: '', col4: '', col5: '', col6: '' },
                { col1: 'Tanggal', col2: dateRangeText, col3: '', col4: '', col5: '', col6: '' },
                { col1: '', col2: '', col3: '', col4: '', col5: '', col6: '' },
                { col1: 'Id Member', col2: 'Nama', col3: 'Tipe Pelanggan', col4: 'No Telepon', col5: 'Jumlah Transaksi', col6: 'Total' }
            ];

            // Add data rows - menggunakan grandTotalSum
            groupedArray.forEach(group => {
                exportData.push({
                    col1: group.customer._id || '-',
                    col2: group.customerName || '-',
                    col3: group.customer.consumerType || '-',
                    col4: group.customer.phone || '-',
                    col5: group.count,
                    col6: group.grandTotalSum  // ← dari grandTotalSum
                });
            });

            // Add Grand Total row
            exportData.push({
                col1: 'Grand Total',
                col2: '',
                col3: '',
                col4: '',
                col5: totalTransaksi,
                col6: totalPenjualan  // ← dari totalPenjualan (yang sudah pakai grandTotalSum)
            });

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(exportData, {
                header: ['col1', 'col2', 'col3', 'col4', 'col5', 'col6'],
                skipHeader: true
            });

            // Set column widths
            ws['!cols'] = [
                { wch: 25 }, // Id Member
                { wch: 25 }, // Nama
                { wch: 20 }, // Tipe Pelanggan
                { wch: 18 }, // No Telepon
                { wch: 20 }, // Jumlah Transaksi
                { wch: 18 }  // Total
            ];

            // Merge cells for title
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }
            ];

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Penjualan Per Pelanggan");

            // Generate filename
            const fileName = `Laporan_Penjualan_Per_Pelanggan_${outletName.replace(/\s+/g, '_')}_${startDate.replace(/\//g, '-')}_${endDate.replace(/\//g, '-')}.xlsx`;

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
        return <CustomerSalesSkeleton />;
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
                <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <span>Laporan</span>
                    <FaChevronRight />
                    <Link to="/admin/sales-menu">Laporan Penjualan</Link>
                    <FaChevronRight />
                    <span>Penjualan Per Pelanggan</span>
                </h1>
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

                    <div className="flex justify-end gap-2 w-2/5">
                        <div className="flex flex-col col-span-3 w-2/5">
                            <input
                                type="text"
                                value={search}
                                placeholder="Pelanggan / Telepon"
                                onChange={handleSearchChange}
                                className="text-[13px] border py-2 pr-[25px] pl-[12px] rounded"
                            />
                        </div>

                        <div className="flex flex-col col-span-3">
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
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-md bg-white shadow-slate-200">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal">Pelanggan</th>
                                <th className="px-4 py-3 font-normal text-right">Tipe Pelanggan</th>
                                <th className="px-4 py-3 font-normal text-right">Telepon</th>
                                <th className="px-4 py-3 font-normal text-right">Jumlah Transaksi</th>
                                <th className="px-4 py-3 font-normal text-right">Total</th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {paginatedData.map((group, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">{group.customerName}</td>
                                        <td className="px-4 py-3 text-right">{group.customer.consumerType || "-"}</td>
                                        <td className="px-4 py-3 text-right">{group.customer.phone || "-"}</td>
                                        <td className="px-4 py-3 text-right">{group.count}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(group.grandTotalSum)}</td>
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

                        <tfoot className="border-t font-semibold text-sm">
                            <tr>
                                <td className="px-4 py-2" colSpan={3}>Grand Total</td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {totalTransaksi.toLocaleString()}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(totalPenjualan)}
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

export default CustomerSales;