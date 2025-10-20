import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import Select from "react-select";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaDownload } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import SalesReportSkeleton from "./skeleton";

const Summary = () => {

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
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState(null);

    const [tempSelectedOutlet, setTempSelectedOutlet] = useState("");
    const [value, setValue] = useState(null);
    const [filteredData, setFilteredData] = useState([]);

    // Safety function to ensure we're always working with arrays
    const ensureArray = (data) => Array.isArray(data) ? data : [];

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

            const completedOrders = productsData.filter(order => order.status === 'Completed');
            setProducts(completedOrders);
            setFilteredData(completedOrders); // Initialize filtered data with all products

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

            const categories = Array.isArray(item.menuItem?.category)
                ? item.menuItem.category
                : [item.menuItem?.category || 'Uncategorized'];
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

    const applyFilter = useCallback(() => {
        // Make sure products is an array before attempting to filter
        let filtered = ensureArray([...products]);

        // Filter by outlet
        if (tempSelectedOutlet) {
            filtered = filtered.filter(product => {
                try {
                    const outletName = product.outlet?._id;
                    const matches = outletName === tempSelectedOutlet;

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
                    return isInRange;
                } catch (err) {
                    console.error("Error filtering by date:", err);
                    return false;
                }
            });
        }

        setFilteredData(filtered);
    }, [products, tempSelectedOutlet, value]);

    // Auto-apply filter whenever dependencies change
    useEffect(() => {
        applyFilter();
    }, [applyFilter]);

    // Initial load
    useEffect(() => {
        applyFilter();
    }, []);

    // Export current data to Excel
    const exportToExcel = async () => {
        setIsExporting(true);

        try {
            // Small delay to show loading state
            await new Promise(resolve => setTimeout(resolve, 15000));

            // Get outlet name and date range
            const outletName = tempSelectedOutlet
                ? outlets.find(o => o._id === tempSelectedOutlet)?.name || 'Semua Outlet'
                : 'Semua Outlet';

            const dateRange = value && value.startDate && value.endDate
                ? `${new Date(value.startDate).toLocaleDateString('id-ID')} - ${new Date(value.endDate).toLocaleDateString('id-ID')}`
                : 'Semua Tanggal';

            // Calculate totals (using values from the table)
            const penjualanKotor = grandTotal.subtotal;
            const diskonPromo = 0; // You can calculate this based on your data
            const diskonPoin = 0;
            const voidAmount = 0;
            const pembulatan = 0;
            const penjualanBersih = penjualanKotor - diskonPromo - diskonPoin - voidAmount + pembulatan;
            const serviceCharge = 0;
            const pajak = grandTotal.subtotal * 0.10;
            const totalPenjualan = penjualanBersih + serviceCharge + pajak;

            // Create export data with the summary format
            const exportData = [
                { col1: 'Laporan Ringkasan', col2: '' },
                { col1: '', col2: '' },
                { col1: 'Outlet', col2: outletName },
                { col1: 'Tanggal', col2: dateRange },
                { col1: '', col2: '' },
                { col1: '', col2: 'Total Nominal (Rp)' },
                { col1: 'Penjualan Kotor', col2: penjualanKotor },
                { col1: 'Diskon Promo', col2: diskonPromo },
                { col1: 'Diskon Poin', col2: diskonPoin },
                { col1: 'Void', col2: voidAmount },
                { col1: 'Pembulatan', col2: pembulatan },
                { col1: 'Penjualan Bersih', col2: penjualanBersih },
                { col1: 'Service Charge', col2: serviceCharge },
                { col1: 'Pajak', col2: pajak },
                { col1: 'Total Penjualan', col2: totalPenjualan }
            ];

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(exportData, {
                header: ['col1', 'col2'],
                skipHeader: true
            });

            // Set column widths
            ws['!cols'] = [
                { wch: 20 },
                { wch: 20 }
            ];

            // Apply bold styling to specific cells
            const boldRows = [1, 6, 12, 15]; // Row indices for: Laporan Ringkasan, header Total Nominal, Penjualan Bersih, Total Penjualan

            boldRows.forEach(rowIndex => {
                const cellAddressCol1 = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
                const cellAddressCol2 = XLSX.utils.encode_cell({ r: rowIndex, c: 1 });

                if (ws[cellAddressCol1]) {
                    ws[cellAddressCol1].s = { font: { bold: true } };
                }
                if (ws[cellAddressCol2]) {
                    ws[cellAddressCol2].s = { font: { bold: true } };
                }
            });

            // Create workbook and add worksheet
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Laporan Ringkasan");

            // Export file
            XLSX.writeFile(wb, `Laporan_Ringkasan_${outletName}_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`);
        } catch (error) {
            console.error("Error exporting to Excel:", error);
            alert("Gagal mengekspor data. Silakan coba lagi.");
        } finally {
            setIsExporting(false);
        }
    };

    // Saat pertama kali render → set default value ke hari ini
    useEffect(() => {
        const today = new Date();
        setValue({
            startDate: today,
            endDate: today,
        });
    }, []);


    // Show loading state
    if (loading) {
        return (
            <SalesReportSkeleton />
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
                    <span>Ringkasan</span>
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
                    <div className="flex flex-col col-span-5 w-2/5">
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
                    <div className="flex flex-col col-span-5 w-1/5">
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

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-md shadow-slate-200 bg-white">
                    <table className="min-w-full table-auto">
                        <tbody className="text-sm text-gray-400">
                            <React.Fragment>
                                <tr>
                                    <td className="font-medium text-gray-500 p-[15px]">Penjualan Kotor</td>
                                    <td className="text-right p-[15px]">{formatCurrency(grandTotal.subtotal) || 0}</td>
                                </tr>
                                <tr>
                                    <td className="font-medium text-gray-500 p-[15px]">Diskon Promo</td>
                                    <td className="text-right p-[15px]">{formatCurrency(0)}</td>
                                </tr>
                                <tr>
                                    <td className="font-medium text-gray-500 p-[15px]">Diskon Poin</td>
                                    <td className="text-right p-[15px]">{formatCurrency(0)}</td>
                                </tr>
                                <tr>
                                    <td className="font-medium text-gray-500 p-[15px]">Void</td>
                                    <td className="text-right p-[15px]">{formatCurrency(0)}</td>
                                </tr>
                                <tr>
                                    <td className="font-medium text-gray-500 p-[15px]">Pembulatan</td>
                                    <td className="text-right p-[15px]">{formatCurrency(0)}</td>
                                </tr>
                                <tr>
                                    <td className="font-medium text-gray-500 p-[15px]">Penjualan Bersih</td>
                                    <td className="text-right p-[15px]">{formatCurrency(grandTotal.subtotal) || 0}</td>
                                </tr>
                                <tr>
                                    <td className="font-medium text-gray-500 p-[15px]">Pajak</td>
                                    <td className="text-right p-[15px]">{formatCurrency(grandTotal.subtotal * 0.10)}</td>
                                </tr>
                            </React.Fragment>
                        </tbody>
                        <tfoot className="font-semibold text-sm border-t">
                            <tr>
                                <td className="p-[15px]">Total</td>
                                <td className="p-[15px] text-right rounded"><p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">{formatCurrency(grandTotal.subtotal + (grandTotal.subtotal * 0.10))}</p></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Summary;