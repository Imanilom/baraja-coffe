import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaDownload, FaChevronLeft } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import Paginated from "../../../../components/paginated";
import ProductSalesSkeleton from "./skeleton";

const ProductSales = () => {
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
    const [summary, setSummary] = useState(null);
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedOutlet, setSelectedOutlet] = useState("all");
    const [dateRange, setDateRange] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [includeDeleted, setIncludeDeleted] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    // Initialize from URL params or set default to today
    useEffect(() => {
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const outletParam = searchParams.get('outletId');
        const searchParam = searchParams.get('search');
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
            const startDate = new Date(newDateRange.startDate).toISOString().split('T')[0];
            const endDate = new Date(newDateRange.endDate).toISOString().split('T')[0];
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

    // Fetch products and outlets data
    const fetchData = async () => {
        if (!dateRange?.startDate || !dateRange?.endDate) return;

        setLoading(true);
        try {
            const startDate = new Date(dateRange.startDate).toISOString().split('T')[0];
            const endDate = new Date(dateRange.endDate).toISOString().split('T')[0];

            // Fetch products data with new endpoint
            const productsResponse = await axios.get('/api/report/sales/product-sales', {
                params: {
                    startDate,
                    endDate,
                    outletId: selectedOutlet,
                    includeDeleted: includeDeleted.toString()
                }
            });

            if (productsResponse.data.success) {
                setProducts(productsResponse.data.data.products || []);
                setSummary(productsResponse.data.data.summary || null);
            } else {
                setProducts([]);
                setSummary(null);
            }

            // Fetch outlets data
            const outletsResponse = await axios.get('/api/outlet');
            const outletsData = Array.isArray(outletsResponse.data) ?
                outletsResponse.data :
                (outletsResponse.data && Array.isArray(outletsResponse.data.data)) ?
                    outletsResponse.data.data : [];

            setOutlets(outletsData);
            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load data. Please try again later.");
            setProducts([]);
            setSummary(null);
            setOutlets([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when filters change
    useEffect(() => {
        if (dateRange?.startDate && dateRange?.endDate) {
            fetchData();
        }
    }, [dateRange, selectedOutlet, includeDeleted]);

    // Handler functions
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

    const handleSearchChange = (e) => {
        const newSearch = e.target.value;
        setSearchTerm(newSearch);
        setCurrentPage(1);
        updateURLParams(dateRange, selectedOutlet, newSearch, 1);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        updateURLParams(dateRange, selectedOutlet, searchTerm, newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const options = [
        { value: "all", label: "Semua Outlet" },
        ...outlets.map((o) => ({ value: o._id, label: o.name })),
    ];

    // Filter products by search term (client-side filtering)
    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;

        return products.filter(product => {
            const searchLower = searchTerm.toLowerCase();
            const productName = (product.productName || '').toLowerCase();
            const baseProductName = (product.baseProductName || '').toLowerCase();
            const category = (product.category || '').toLowerCase();

            return productName.includes(searchLower) ||
                baseProductName.includes(searchLower) ||
                category.includes(searchLower);
        });
    }, [products, searchTerm]);

    // Pagination
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredProducts.slice(startIndex, endIndex);
    }, [filteredProducts, currentPage]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

    // Calculate totals from filtered data
    const filteredTotals = useMemo(() => {
        return filteredProducts.reduce(
            (acc, curr) => {
                acc.quantity += curr.totalQuantity || 0;
                acc.grossSales += curr.grossSales || 0;
                acc.discount += curr.totalDiscount || 0;
                acc.revenue += curr.totalRevenue || 0;
                return acc;
            },
            {
                quantity: 0,
                grossSales: 0,
                discount: 0,
                revenue: 0,
            }
        );
    }, [filteredProducts]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Export current data to Excel
    const exportToExcel = () => {
        // Prepare header info
        const outletName = selectedOutlet === 'all'
            ? 'Semua Outlet'
            : outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet';

        const startDateFormatted = new Date(dateRange.startDate).toLocaleDateString('id-ID');
        const endDateFormatted = new Date(dateRange.endDate).toLocaleDateString('id-ID');

        // Create header rows
        const headerInfo = [
            ['LAPORAN PENJUALAN PRODUK'],
            [],
            ['Periode', `: ${startDateFormatted} - ${endDateFormatted}`],
            ['Outlet', `: ${outletName}`],
            ['Tanggal Export', `: ${new Date().toLocaleString('id-ID')}`],
            [],
            []
        ];

        // Prepare data rows
        const dataRows = filteredProducts.map((product, index) => ({
            'Produk': product.productName,
            'Kategori': product.category,
            'Variant': product.addons ? product.addons.map(a => a.label).join(', ') : '-',
            'Qty Terjual': product.totalQuantity,
            'Penjualan Kotor (Rp)': product.grossSales,
            'Diskon (Rp)': product.totalDiscount,
            'Total Pendapatan (Rp)': product.totalRevenue,
            'Status': product.isDeleted ? 'Dihapus' : (product.isActive ? 'Aktif' : 'Nonaktif'),
        }));

        // Add grand total row
        dataRows.push({
            'Produk': 'GRAND TOTAL',
            'Kategori': '',
            'Variant': '',
            'Qty Terjual': filteredTotals.quantity,
            'Penjualan Kotor (Rp)': filteredTotals.grossSales,
            'Diskon (Rp)': filteredTotals.discount,
            'Total Pendapatan (Rp)': filteredTotals.revenue,
            'Status': '',
        });

        // Create worksheet from header and data
        const ws = XLSX.utils.aoa_to_sheet(headerInfo);
        XLSX.utils.sheet_add_json(ws, dataRows, { origin: -1, skipHeader: false });

        // Add summary section separately
        const currentRow = headerInfo.length + dataRows.length + 2;

        const summaryData = [
            [''],
            ['RINGKASAN'],
            ['Total Produk', `: ${filteredProducts.length} produk`],
            ['Total Item Terjual', `: ${filteredTotals.quantity.toLocaleString()} item`],
            ['Total Penjualan Kotor', `: Rp ${filteredTotals.grossSales.toLocaleString('id-ID')}`],
            ['Total Diskon', `: Rp ${filteredTotals.discount.toLocaleString('id-ID')}`],
            ['Total Pendapatan Bersih', `: Rp ${filteredTotals.revenue.toLocaleString('id-ID')}`],
        ];

        XLSX.utils.sheet_add_aoa(ws, summaryData, { origin: currentRow });

        // Set column widths
        ws['!cols'] = [
            { wch: 35 },  // Produk
            { wch: 15 },  // Kategori
            { wch: 20 },  // Variant
            { wch: 12 },  // Qty Terjual
            { wch: 18 },  // Penjualan Kotor
            { wch: 15 },  // Diskon
            { wch: 20 },  // Total Pendapatan
            { wch: 12 },  // Status
        ];

        // Style the header
        const headerStyle = {
            font: { bold: true, sz: 14 },
            alignment: { horizontal: 'center', vertical: 'center' }
        };

        // Apply header style
        if (ws['A1']) ws['A1'].s = headerStyle;

        // Merge cells for title
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } } // Merge title row
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Penjualan Produk");

        const startDate = new Date(dateRange.startDate).toLocaleDateString('id-ID').replace(/\//g, '-');
        const endDate = new Date(dateRange.endDate).toLocaleDateString('id-ID').replace(/\//g, '-');
        const filename = `Laporan_Penjualan_Produk_${startDate}_${endDate}.xlsx`;

        XLSX.writeFile(wb, filename);
    };

    if (loading) {
        return <ProductSalesSkeleton />;
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
                    <span>Penjualan Produk</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={filteredProducts.length === 0}
                    className="flex items-center gap-3 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FaDownload />Ekspor Excel
                </button>
            </div>

            {/* Filters */}
            <div className="px-6 pb-[15px]">
                <div className="flex justify-between py-3 gap-2">
                    <div className="relative text-gray-500 w-2/5">
                        <div className="w-2/5">
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

                    <div className="flex justify-end relative gap-3 w-3/5">
                        <div className="w-2/4">
                            <input
                                type="text"
                                placeholder="Cari produk / kategori..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full block text-[13px] border py-2 pr-[25px] pl-[12px] rounded focus:ring-1 focus:ring-green-900 focus:outline-none"
                            />
                        </div>
                        <div className="w-1/4">
                            <Select
                                options={options}
                                value={options.find((opt) => opt.value === selectedOutlet) || options[0]}
                                onChange={handleOutletChange}
                                placeholder="Pilih outlet..."
                                isSearchable
                                className="text-[13px]"
                                classNamePrefix="react-select"
                                styles={customStyles}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="includeDeleted"
                                checked={includeDeleted}
                                onChange={(e) => setIncludeDeleted(e.target.checked)}
                                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                            />
                            <label htmlFor="includeDeleted" className="text-[13px] text-gray-600">
                                Tampilkan produk dihapus
                            </label>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="bg-white p-4 rounded shadow-md">
                            <p className="text-xs text-gray-500">Total Produk</p>
                            <p className="text-xl font-semibold text-green-900">{summary.totalProducts}</p>
                        </div>
                        <div className="bg-white p-4 rounded shadow-md">
                            <p className="text-xs text-gray-500">Total Terjual</p>
                            <p className="text-xl font-semibold text-green-900">{summary.totalQuantity?.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded shadow-md">
                            <p className="text-xs text-gray-500">Total Pendapatan</p>
                            <p className="text-xl font-semibold text-green-900">{formatCurrency(summary.totalRevenue)}</p>
                        </div>
                        <div className="bg-white p-4 rounded shadow-md">
                            <p className="text-xs text-gray-500">Total Diskon</p>
                            <p className="text-xl font-semibold text-red-600">{formatCurrency(summary.totalDiscount)}</p>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-md bg-white shadow-slate-200">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal">Produk</th>
                                <th className="px-4 py-3 font-normal">Kategori</th>
                                <th className="px-4 py-3 font-normal">Addons</th>
                                <th className="px-4 py-3 font-normal text-right">Terjual</th>
                                <th className="px-4 py-3 font-normal text-right">Penjualan Kotor</th>
                                <th className="px-4 py-3 font-normal text-right">Diskon</th>
                                <th className="px-4 py-3 font-normal text-right">Total</th>
                                <th className="px-4 py-3 font-normal text-center">Status</th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {paginatedData.map((product, index) => (
                                    <tr key={index} className="text-left text-sm hover:bg-gray-50 border-b">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium text-gray-700">{product.productName}</p>
                                                {product.baseProductName !== product.productName && (
                                                    <p className="text-xs text-gray-400">{product.baseProductName}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{product.category}</td>
                                        <td className="px-4 py-3">
                                            {product.addons ? (
                                                <div className="text-xs">
                                                    {product.addons.map((addon, i) => (
                                                        <span key={i} className="inline-block bg-gray-100 px-2 py-1 rounded mr-1 mb-1">
                                                            {addon.label} {addon.price > 0 && `(+${formatCurrency(addon.price)})`}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right">{product.totalQuantity}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(product.grossSales)}</td>
                                        <td className="px-4 py-3 text-right text-red-600">{formatCurrency(product.totalDiscount)}</td>
                                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(product.totalRevenue)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {product.isDeleted ? (
                                                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Dihapus</span>
                                            ) : product.isActive ? (
                                                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Aktif</span>
                                            ) : (
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Nonaktif</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr className="py-6 text-center w-full h-96">
                                    <td colSpan={8}>Tidak ada data ditemukan</td>
                                </tr>
                            </tbody>
                        )}
                        <tfoot className="border-t font-semibold text-sm">
                            <tr>
                                <td className="px-4 py-2" colSpan="3">Grand Total (Filtered)</td>
                                <td className="px-2 py-2 text-right">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {filteredTotals.quantity.toLocaleString()}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(filteredTotals.grossSales)}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right">
                                    <p className="bg-red-100 text-red-600 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(filteredTotals.discount)}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right">
                                    <p className="bg-green-100 text-green-700 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(filteredTotals.revenue)}
                                    </p>
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Pagination Controls */}
                <Paginated
                    currentPage={currentPage}
                    setCurrentPage={handlePageChange}
                    totalPages={totalPages}
                />
            </div>
        </div>
    );
};

export default ProductSales;