import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaDownload } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import Paginated from "../../../../components/paginated";
import SalesCategorySkeleton from "./skeleton";

const CategorySales = () => {

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
    const [isExporting, setIsExporting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tempSelectedOutlet, setTempSelectedOutlet] = useState("");
    const [value, setValue] = useState(null);
    const [tempSearch, setTempSearch] = useState("");
    const [filteredData, setFilteredData] = useState([]);

    // Safety function to ensure we're always working with arrays
    const ensureArray = (data) => Array.isArray(data) ? data : [];
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const dropdownRef = useRef(null);

    // Fetch products and outlets data
    useEffect(() => {
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

            const categories = Array.isArray(item.menuItem?.category)
                ? item.menuItem?.category?.name
                : [item.menuItem?.category?.name || 'Uncategorized'];
            const quantity = Number(item?.quantity) || 0;
            const subtotal = Number(item?.subtotal) || 0;

            categories.forEach(category => {
                const key = `${category}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        category,
                        quantity: 0,
                        subtotal: 0
                    };
                }

                grouped[key].quantity += quantity;
                grouped[key].subtotal += subtotal;
            });
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
                acc.quantity += curr.quantity;
                acc.subtotal += curr.subtotal;
                return acc;
            },
            {
                quantity: 0,
                subtotal: 0,
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

        // Filter by search term (category)
        if (tempSearch) {
            filtered = filtered.flatMap(product => {
                try {
                    const searchTerm = tempSearch.toLowerCase();
                    const item = product?.items?.[0];
                    const menuItem = item?.menuItem;
                    if (!menuItem) return [];

                    const categories = Array.isArray(menuItem.category)
                        ? menuItem.category
                        : [menuItem.category || 'Uncategorized'];

                    // Pecah kategori menjadi entri produk terpisah
                    return categories
                        .filter(category => {
                            const categoryLower = (category || '').toLowerCase();
                            return !searchTerm || categoryLower.includes(searchTerm);
                        })
                        .map(category => ({
                            ...product,
                            items: [{
                                ...item,
                                menuItem: {
                                    ...menuItem,
                                    category: category
                                }
                            }]
                        }));
                } catch (err) {
                    console.error("Error filtering by search:", err);
                    return false;
                }
            }
            );
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

            // Calculate totals
            let totalTerjual = 0;
            let totalPenjualanBersih = 0;
            let totalRata = 0;

            // Create export data
            const exportData = [
                { col1: 'Laporan Penjualan Produk', col2: '', col3: '', col4: '', col5: '', col6: '', col7: '', col8: '', col9: '' },
                { col1: '', col2: '', col3: '', col4: '', col5: '', col6: '', col7: '', col8: '', col9: '' },
                { col1: 'Outlet', col2: outletName, col3: '', col4: '', col5: '', col6: '', col7: '', col8: '', col9: '' },
                { col1: 'Tanggal', col2: dateRange, col3: '', col4: '', col5: '', col6: '', col7: '', col8: '', col9: '' },
                { col1: '', col2: '', col3: '', col4: '', col5: '', col6: '', col7: '', col8: '', col9: '' },
                { col1: 'Kategori', col2: 'Terjual', col3: 'Penjualan Bersih', col4: 'Rata-rata' }
            ];

            // Add data rows
            filteredData.forEach(product => {
                const item = product.items?.[0] || {};
                const menuItem = item.menuItem || {};

                const terjual = item.quantity || 0;
                const penjualanBersih = item.subtotal || 0;
                const rata = penjualanBersih / terjual;

                // Add to totals
                totalTerjual += terjual;
                totalPenjualanBersih += penjualanBersih;
                totalRata += rata;

                exportData.push({
                    col1: menuItem.category?.name || '-',
                    col2: terjual,
                    col3: penjualanBersih,
                    col4: rata,
                });
            });

            // Add Grand Total row
            exportData.push({
                col1: 'Grand Total',
                col2: totalTerjual,
                col3: totalPenjualanBersih,
                col4: totalRata,
            });

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(exportData, {
                header: ['col1', 'col2', 'col3', 'col4', 'col5', 'col6', 'col7', 'col8', 'col9'],
                skipHeader: true
            });

            // Set column widths
            ws['!cols'] = [
                { wch: 20 }, // Kategori
                { wch: 12 }, // Terjual
                { wch: 18 }, // Penjualan Bersih
                { wch: 18 }, // Ratta-rata
            ];

            // Merge cells for title
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } } // Merge title across 9 columns
            ];

            // Apply bold styling to specific rows
            const boldRows = [0, 5, exportData.length - 1]; // Title, Header, Grand Total

            boldRows.forEach(rowIndex => {
                for (let col = 0; col < 9; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: col });
                    if (ws[cellAddress]) {
                        ws[cellAddress].s = { font: { bold: true } };
                    }
                }
            });

            // Create workbook and add worksheet
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Penjualan Produk");

            // Export file
            const fileName = `Laporan_Penjualan_Produk_${outletName}_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`;
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
            <SalesCategorySkeleton />
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
                    <sapn>Penjualan Per Kategori</sapn>
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

                    <div className="flex justify-end gap-2 w-2/5">
                        <div className="flex flex-col col-span-3 w-2/5">
                            <input
                                type="text"
                                placeholder="Kategori"
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
                                <th className="px-4 py-3 font-normal">Kategori</th>
                                <th className="px-4 py-3 font-normal text-right">Terjual</th>
                                <th className="px-4 py-3 font-normal text-right">Penjualan Bersih</th>
                                <th className="px-4 py-3 font-normal text-right">Rata-Rata</th>
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
                                                        {group.category}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {group.quantity || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {formatCurrency(group.subtotal) || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {formatCurrency(group.subtotal / group.quantity) || 'N/A'}
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        );
                                    } catch (err) {
                                        console.error(`Error rendering product ${index}:`, err);
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
                                <td className="px-2 py-2 text-right rounded"><p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">{grandTotal.quantity.toLocaleString()}</p></td>
                                <td className="px-2 py-2 text-right rounded"><p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">{formatCurrency(grandTotal.subtotal.toFixed())}</p></td>
                                <td className="px-2 py-2 text-right rounded"><p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">{formatCurrency(grandTotal.subtotal.toFixed() / grandTotal.quantity)}</p></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <Paginated
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                />

            </div>
        </div>
    );
};

export default CategorySales;