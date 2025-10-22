import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaDownload } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import TypeSalesSkeleton from "./skeleton";
import Paginated from "../../../../components/paginated";

const TypeSales = () => {

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
    const [tempSelectedOutlet, setTempSelectedOutlet] = useState("");
    const [value, setValue] = useState(null);
    const [tempSearch, setTempSearch] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    const [isExporting, setIsExporting] = useState(false);

    // Safety function to ensure we're always working with arrays
    const ensureArray = (data) => Array.isArray(data) ? data : [];
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const dropdownRef = useRef(null);

    // Fetch products and outlets data
    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch products data
            const productsResponse = await axios.get('/api/orders');

            // Ensure productsResponse.data is an array
            const productsData = Array.isArray(productsResponse.data) ?
                productsResponse.data :
                (productsResponse.data && Array.isArray(productsResponse.data.data)) ?
                    productsResponse.data.data : [];

            const completedData = productsData.filter(item => item.status === "Completed");

            setProducts(completedData);
            setFilteredData(completedData); // Initialize filtered data with all products

            // Fetch outlets data
            const outletsResponse = await axios.get('/api/outlet');

            // Ensure outletsResponse.data is an array
            const outletsData = Array.isArray(outletsResponse.data) ?
                outletsResponse.data :
                (outletsResponse.data && Array.isArray(outletsResponse.data.data)) ?
                    outletsResponse.data.data : [];

            setOutlets(outletsData);

            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load data. Please try again later.");
            // Set empty arrays as fallback
            setProducts([]);
            setFilteredData([]);
            setOutlets([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const options = [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((o) => ({ value: o._id, label: o.name })),
    ];

    const groupedArray = useMemo(() => {
        const grouped = {};

        filteredData.forEach(product => {
            const item = product?.items?.[0];
            if (!item) return;

            const orderType = product?.orderType || '';
            const subtotal = Number(item?.subtotal) || 0;

            const key = `${orderType}`; // unique key per produk

            if (!grouped[key]) {
                grouped[key] = {
                    orderType,
                    subtotal: 0,
                    count: 0
                };
            }

            grouped[key].subtotal += subtotal;
            grouped[key].count += 1;

        });

        return Object.values(grouped);
    }, [filteredData]);


    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return groupedArray.slice(startIndex, endIndex);
    }, [groupedArray, currentPage]);

    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(groupedArray.length / ITEMS_PER_PAGE);

    // Calculate grand totals for filtered data
    const grandTotal = useMemo(() => {
        return groupedArray.reduce(
            (acc, curr) => {
                acc.subtotal += curr.subtotal;
                acc.count += curr.count || 0; // pastikan count ada
                return acc;
            },
            {
                subtotal: 0,
                count: 0,
            }
        );
    }, [groupedArray]);


    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Apply filter function
    const applyFilter = useCallback(() => {

        // Make sure products is an array before attempting to filter
        let filtered = ensureArray([...products]);

        // Filter by search term (product name, category, or SKU)
        if (tempSearch) {
            filtered = filtered.filter(product => {
                try {
                    const orderType = product?.orderType.toLowerCase();

                    const searchTerm = tempSearch.toLowerCase();
                    return orderType.includes(searchTerm);
                } catch (err) {
                    console.error("Error filtering by search:", err);
                    return false;
                }
            });
        }

        // Filter by outlet
        if (tempSelectedOutlet) {
            filtered = filtered.filter(product => {
                try {
                    if (!product?.cashier?.outlet?.length > 0) {
                        return false;
                    }

                    const outletName = product.cashier.outlet[0]?.outletId?.name;
                    const matches = outletName === tempSelectedOutlet;

                    if (!matches) {
                    }

                    return matches;
                } catch (err) {
                    console.error("Error filtering by outlet:", err);
                    return false;
                }
            });
        }

        // Filter by date range
        if (value && value.startDate && value.endDate) {
            filtered = filtered.filter(product => {
                try {
                    if (!product.createdAt) {
                        return false;
                    }

                    const productDate = new Date(product.createdAt);
                    const startDate = new Date(value.startDate);
                    const endDate = new Date(value.endDate);

                    // Set time to beginning/end of day for proper comparison
                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(23, 59, 59, 999);

                    // Check if dates are valid
                    if (isNaN(productDate) || isNaN(startDate) || isNaN(endDate)) {
                        return false;
                    }

                    const isInRange = productDate >= startDate && productDate <= endDate;
                    if (!isInRange) {
                    }
                    return isInRange;
                } catch (err) {
                    console.error("Error filtering by date:", err);
                    return false;
                }
            });
        }

        setFilteredData(filtered);
        setCurrentPage(1); // Reset to first page after filter

    }, [products, tempSearch, tempSelectedOutlet, value]);

    // Auto-apply filter whenever dependencies change
    useEffect(() => {
        applyFilter();
    }, [applyFilter]);

    // Initial load
    useEffect(() => {
        applyFilter();
    }, []);

    useEffect(() => {
        const today = new Date();
        setValue({
            startDate: today,
            endDate: today,
        });
    }, []);

    // Export current data to Excel
    const exportToExcel = async () => {
        setIsExporting(true);

        try {
            // Small delay to show loading state
            await new Promise(resolve => setTimeout(resolve, 15000));

            // Get outlet name
            const outletName = tempSelectedOutlet
                ? outlets.find(o => o._id === tempSelectedOutlet)?.name || 'Semua Outlet'
                : 'Semua Outlet';

            // Get date range
            const dateRange = value && value.startDate && value.endDate
                ? `${new Date(value.startDate).toLocaleDateString('id-ID')} - ${new Date(value.endDate).toLocaleDateString('id-ID')}`
                : new Date().toLocaleDateString('id-ID');

            // 1. Group the data by orderType
            const grouped = {};

            filteredData.forEach(product => {
                const item = product?.items?.[0];
                if (!item) return;

                const orderType = product?.orderType || 'N/A';
                const subtotal = Number(item?.subtotal) || 0;

                if (!grouped[orderType]) {
                    grouped[orderType] = {
                        orderType,
                        subtotal: 0,
                        count: 0
                    };
                }

                grouped[orderType].subtotal += subtotal;
                grouped[orderType].count += 1;
            });

            // 2. Calculate totals
            const groupedArray = Object.values(grouped);
            const totalTransaksi = groupedArray.reduce((sum, item) => sum + item.count, 0);
            const totalSubtotal = groupedArray.reduce((sum, item) => sum + item.subtotal, 0);
            const totalFee = 0; // Ganti dengan perhitungan fee jika ada

            // Create export data
            const exportData = [
                { col1: 'Laporan Tipe Penjualan', col2: '', col3: '', col4: '' },
                { col1: '', col2: '', col3: '', col4: '' },
                { col1: 'Outlet', col2: outletName, col3: '', col4: '' },
                { col1: 'Tanggal', col2: dateRange, col3: '', col4: '' },
                { col1: '', col2: '', col3: '', col4: '' },
                { col1: 'Tipe Penjualan', col2: 'Jumlah Transaksi', col3: 'Total Transaksi', col4: 'Total Fee' }
            ];

            // Add data rows
            groupedArray.forEach(item => {
                exportData.push({
                    col1: item.orderType,
                    col2: item.count,
                    col3: item.subtotal,
                    col4: 0 // Ganti dengan perhitungan fee per item jika ada
                });
            });

            // Add Grand Total row
            exportData.push({
                col1: 'Grand Total',
                col2: totalTransaksi,
                col3: totalSubtotal,
                col4: totalFee
            });

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(exportData, {
                header: ['col1', 'col2', 'col3', 'col4'],
                skipHeader: true
            });

            // Set column widths
            ws['!cols'] = [
                { wch: 25 }, // Tipe Penjualan
                { wch: 20 }, // Jumlah Transaksi
                { wch: 20 }, // Total Transaksi
                { wch: 15 }  // Total Fee
            ];

            // Merge cells for title
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } } // Merge title across 4 columns
            ];

            // Apply bold styling to specific rows
            const boldRows = [0, 5, exportData.length - 1]; // Title, Header, Grand Total

            boldRows.forEach(rowIndex => {
                for (let col = 0; col < 4; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: col });
                    if (ws[cellAddress]) {
                        ws[cellAddress].s = { font: { bold: true } };
                    }
                }
            });

            // Create workbook and add worksheet
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Tipe Penjualan");

            // Export file
            const fileName = `Laporan_Tipe_Penjualan_${outletName}_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`;
            XLSX.writeFile(wb, fileName);

        } catch (error) {
            console.error("Error exporting to Excel:", error);
            alert("Gagal mengekspor data. Silakan coba lagi.");
        } finally {
            setIsExporting(false);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <TypeSalesSkeleton />
        );
    }

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
        <div className="">

            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <span>Laporan</span>
                    <FaChevronRight />
                    <Link to="/admin/sales-menu">Laporan Penjualan</Link>
                    <FaChevronRight />
                    <span>Tipe Penjualan</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={isExporting}
                    className="bg-green-900 text-white text-[13px] px-[15px] py-[7px] rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isExporting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            Mengekspor...
                        </>
                    ) : (
                        <>
                            <FaDownload /> Ekspor CSV
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
                                value={value}
                                onChange={setValue}
                                displayFormat="DD-MM-YYYY"
                                inputClassName="w-full text-[13px] border py-2 pr-[25px] pl-[12px] rounded cursor-pointer"
                                popoverDirection="down"
                            />
                        </div>
                    </div>

                    <div className="flex justify-between gap-4">
                        <div className="flex flex-col col-span-3">
                            <input
                                type="text"
                                placeholder="Tipe Penjualan"
                                value={tempSearch}
                                onChange={(e) => setTempSearch(e.target.value)}
                                className="text-[13px] border py-2 pr-[25px] pl-[12px] rounded"
                            />
                        </div>

                        <div className="flex flex-col col-span-3">
                            <Select
                                options={options}
                                value={
                                    tempSelectedOutlet
                                        ? options.find((opt) => opt.value === tempSelectedOutlet)
                                        : options[0]
                                }
                                onChange={(selected) => setTempSelectedOutlet(selected.value)}
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
                                <th className="px-4 py-3 font-normal">Tipe Penjualan</th>
                                <th className="px-4 py-3 font-normal text-right">Jumlah Transaksi</th>
                                <th className="px-4 py-3 font-normal text-right">Total Transaksi</th>
                                <th className="px-4 py-3 font-normal text-right">Total Fee</th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {paginatedData.map((group, index) => {
                                    try {
                                        return (
                                            <React.Fragment key={index}>
                                                <tr className="text-left text-sm">
                                                    <td className="px-4 py-3">
                                                        {group.orderType}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {group.count || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {formatCurrency(group.subtotal) || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {formatCurrency(0) || 'N/A'}
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        );
                                    } catch (err) {
                                        console.error(`Error rendering product ${index}:`, err, product);
                                        return (
                                            <tr className="text-left text-sm" key={index}>
                                                <td colSpan="7" className="px-4 py-3 text-red-500">
                                                    Error rendering product
                                                </td>
                                            </tr>
                                        );
                                    }
                                })}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr className="py-6 text-center w-full h-96">
                                    <td colSpan={7}>Tidak ada data ditemukan</td>
                                </tr>
                            </tbody>
                        )}
                        <tfoot className="border-t font-semibold text-sm">
                            <tr>
                                <td className="px-4 py-2">Grand Total</td>
                                <td className="px-2 py-2 text-right rounded"><p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">{grandTotal.count.toLocaleString()}</p></td>
                                <td className="px-2 py-2 text-right rounded"><p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">{formatCurrency(grandTotal.subtotal.toFixed())}</p></td>
                                <td className="px-2 py-2 text-right rounded"><p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">{formatCurrency(0)}</p></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Pagination Controls */}
                <Paginated
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                />
            </div>
        </div>
    );
};

export default TypeSales;