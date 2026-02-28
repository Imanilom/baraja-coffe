import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSearch } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import Paginated from "../../../../components/paginated";
import dayjs from "dayjs";


const ProfitByProductManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [orders, setOrders] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showInput, setShowInput] = useState(false);
    const [search, setSearch] = useState("");
    const [tempSelectedOutlet, setTempSelectedOutlet] = useState("");
    const [tempSearch, setTempSearch] = useState("");
    const [value, setValue] = useState({
        startDate: dayjs(),
        endDate: dayjs()
    });
    const [filteredData, setFilteredData] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Safety function to ensure we're always working with arrays
    const ensureArray = (data) => Array.isArray(data) ? data : [];
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const dropdownRef = useRef(null);

    // Initialize filters from URL on component mount
    useEffect(() => {
        const page = parseInt(searchParams.get('page')) || 1;
        const searchQuery = searchParams.get('search') || '';
        const outlet = searchParams.get('outlet') || '';
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        setCurrentPage(page);
        setTempSearch(searchQuery);
        setTempSelectedOutlet(outlet);

        if (startDate && endDate) {
            setValue({
                startDate: startDate,
                endDate: endDate
            });
        } else {
            setValue({
                startDate: dayjs(),
                endDate: dayjs()
            });
        }

        setIsInitialized(true);
    }, []);

    // Update URL when filters change
    useEffect(() => {
        if (!isInitialized) return;

        const params = new URLSearchParams();

        if (currentPage > 1) {
            params.set('page', currentPage.toString());
        }

        if (tempSearch) {
            params.set('search', tempSearch);
        }

        if (tempSelectedOutlet) {
            params.set('outlet', tempSelectedOutlet);
        }

        if (value?.startDate && value?.endDate) {
            const formatDate = (dateStr) => {
                if (dayjs.isDayjs(dateStr)) {
                    return dateStr.format('YYYY-MM-DD');
                }
                const date = new Date(dateStr);
                return date.toISOString().split('T')[0];
            };

            params.set('startDate', formatDate(value.startDate));
            params.set('endDate', formatDate(value.endDate));
        }

        setSearchParams(params, { replace: true });
    }, [currentPage, tempSearch, tempSelectedOutlet, value, isInitialized]);

    // Fetch orders and outlets data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const orderResponse = await axios.get('/api/orders');

                const orderData = Array.isArray(orderResponse.data) ?
                    orderResponse.data :
                    (orderResponse.data && Array.isArray(orderResponse.data.data)) ?
                        orderResponse.data.data : [];

                const completedData = orderData.filter(item => item.status === "Completed");

                setOrders(completedData);
                setFilteredData(completedData);

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
                setOrders([]);
                setFilteredData([]);
                setOutlets([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Get unique outlet names for the dropdown
    const uniqueOutlets = useMemo(() => {
        return outlets.map(item => item.name);
    }, [outlets]);

    // Handle click outside dropdown to close
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowInput(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
        return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const formatDate = (dat) => {
        const date = new Date(dat);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
    };

    const formatTime = (time) => {
        const date = new Date(time);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const options = [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((outlet) => ({
            value: outlet.name, // PERBAIKAN: gunakan name, bukan _id
            label: outlet.name,
        })),
    ];

    // Apply filter function - PERBAIKAN LOGIC
    const applyFilter = useCallback(() => {
        let filteredOrders = ensureArray([...orders]);

        // 1. Filter by date range FIRST
        if (value && value.startDate && value.endDate) {
            filteredOrders = filteredOrders.filter(order => {
                try {
                    if (!order.createdAt) return false;

                    const orderDate = new Date(order.createdAt);
                    let startDate, endDate;

                    if (dayjs.isDayjs(value.startDate)) {
                        startDate = value.startDate.toDate();
                        endDate = value.endDate.toDate();
                    } else {
                        startDate = new Date(value.startDate);
                        endDate = new Date(value.endDate);
                    }

                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(23, 59, 59, 999);

                    if (isNaN(orderDate) || isNaN(startDate) || isNaN(endDate)) {
                        return false;
                    }

                    return orderDate >= startDate && orderDate <= endDate;
                } catch (err) {
                    console.error("Error filtering by date:", err);
                    return false;
                }
            });
        }

        // 2. Filter by outlet
        if (tempSelectedOutlet) {
            filteredOrders = filteredOrders.filter(order => {
                try {
                    // PERBAIKAN: cek berbagai kemungkinan struktur data outlet
                    const outletName =
                        order.cashier?.outlet?.[0]?.outletId?.name ||
                        order.cashier?.outlet?.[0]?.name ||
                        order.outlet?.name ||
                        order.outletName ||
                        "";

                    return outletName === tempSelectedOutlet;
                } catch (err) {
                    console.error("Error filtering by outlet:", err);
                    return false;
                }
            });
        }

        // 3. Filter items by product name/category
        let result = [];

        filteredOrders.forEach(order => {
            if (!order.items || !Array.isArray(order.items)) return;

            order.items.forEach(item => {
                try {
                    const menuItem = item?.menuItem;
                    if (!menuItem) return;

                    // Check if item matches search filter
                    let matchesSearch = true;
                    if (tempSearch) {
                        const name = (menuItem.name || '').toLowerCase();
                        const category = (menuItem.category?.name || '').toLowerCase();
                        const searchTerm = tempSearch.toLowerCase();

                        matchesSearch = name.includes(searchTerm) || category.includes(searchTerm);
                    }

                    if (matchesSearch) {
                        // Create new object with order info + item info
                        result.push({
                            ...order,
                            items: [item] // Only include the matching item
                        });
                    }
                } catch (err) {
                    console.error("Error processing item:", err);
                }
            });
        });

        setFilteredData(result);
        setCurrentPage(1);
    }, [orders, tempSearch, tempSelectedOutlet, value]);

    // Auto-apply filter whenever dependencies change
    useEffect(() => {
        if (isInitialized) {
            applyFilter();
        }
    }, [applyFilter, isInitialized]);

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

    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    // Export current data to Excel
    // Export current data to Excel
    const exportToExcel = () => {
        // Get outlet name
        const outletName = tempSelectedOutlet || 'Semua Outlet';

        // Format date for display
        const formatDateForExcel = (dateStr) => {
            if (dayjs.isDayjs(dateStr)) {
                return dateStr.format('DD-MM-YYYY');
            }
            const date = new Date(dateStr);
            const pad = (n) => n.toString().padStart(2, "0");
            return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
        };

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Create header data
        const headerData = [
            ['Laporan Laba Produk'],
            [],
            ['Outlet', outletName],
            ['Tanggal', `${formatDateForExcel(value.startDate)} s/d ${formatDateForExcel(value.endDate)}`],
            [],
            ['Produk', 'Kategori', 'Penjualan Kotor', 'Diskon Produk', 'Pembelian', 'Laba Produk', '% Laba Produk']
        ];

        // Prepare data rows
        const dataRows = filteredData.map(order => {
            const item = order.items?.[0] || {};
            const menuItem = item.menuItem || {};
            const price = menuItem.price || 0;
            const diskon = menuItem.diskon || 0;
            const pembelian = menuItem.pembelian || 0;
            const quantity = item.quantity || 1;

            const penjualanKotor = price * quantity;
            const diskonTotal = diskon * quantity;
            const pembelianTotal = pembelian * quantity;
            const labaProduk = (price - pembelian) * quantity;
            const labaPersen = price > 0 ? (labaProduk / penjualanKotor) : 0;

            return [
                menuItem.name || "-",
                menuItem.category?.name || "-",
                penjualanKotor,
                diskonTotal,
                pembelianTotal,
                labaProduk,
                labaPersen
            ];
        });

        // Add Grand Total row
        const grandTotal = [
            'Grand Total',
            '',
            totals.totalPenjualanKotor,
            totals.totalDiskon,
            totals.totalPembelian,
            totals.totalLabaProduk,
            totals.totalPenjualanKotor > 0 ? (totals.totalLabaProduk / totals.totalPenjualanKotor) : 0
        ];

        // Combine all data
        const allData = [...headerData, ...dataRows, grandTotal];

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(allData);

        // Set column widths
        ws['!cols'] = [
            { wch: 25 }, // Produk
            { wch: 18 }, // Kategori
            { wch: 18 }, // Penjualan Kotor
            { wch: 15 }, // Diskon Produk
            { wch: 15 }, // Pembelian
            { wch: 18 }, // Laba Produk
            { wch: 15 }  // % Laba Produk
        ];

        // Styling
        const range = XLSX.utils.decode_range(ws['!ref']);

        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellAddress]) continue;

                // Header title (row 0)
                if (R === 0) {
                    ws[cellAddress].s = {
                        font: { bold: true, sz: 14 },
                        alignment: { horizontal: 'left', vertical: 'center' }
                    };
                }

                // Outlet and Tanggal info (rows 2-3)
                if ((R === 2 || R === 3) && C === 0) {
                    ws[cellAddress].s = {
                        font: { bold: true },
                        alignment: { horizontal: 'left', vertical: 'center' }
                    };
                }

                // Column headers (row 5)
                if (R === 5) {
                    ws[cellAddress].s = {
                        font: { bold: true },
                        fill: { fgColor: { rgb: "F3F4F6" } },
                        border: {
                            top: { style: 'thin', color: { rgb: "000000" } },
                            bottom: { style: 'thin', color: { rgb: "000000" } },
                            left: { style: 'thin', color: { rgb: "000000" } },
                            right: { style: 'thin', color: { rgb: "000000" } }
                        },
                        alignment: { horizontal: 'center', vertical: 'center' }
                    };
                }

                // Data rows (from row 6 to before grand total)
                if (R > 5 && R < range.e.r) {
                    // Format currency columns (C, D, E, F = columns 2,3,4,5)
                    if (C >= 2 && C <= 5) {
                        ws[cellAddress].t = 'n';
                        ws[cellAddress].z = '#,##0';
                    }
                    // Format percentage column (G = column 6)
                    if (C === 6) {
                        ws[cellAddress].t = 'n';
                        ws[cellAddress].z = '0%';
                    }

                    ws[cellAddress].s = {
                        border: {
                            top: { style: 'thin', color: { rgb: "E5E7EB" } },
                            bottom: { style: 'thin', color: { rgb: "E5E7EB" } },
                            left: { style: 'thin', color: { rgb: "E5E7EB" } },
                            right: { style: 'thin', color: { rgb: "E5E7EB" } }
                        },
                        alignment: {
                            horizontal: C <= 1 ? 'left' : 'right',
                            vertical: 'center'
                        }
                    };
                }

                // Grand Total row (last row)
                if (R === range.e.r) {
                    ws[cellAddress].s = {
                        font: { bold: true },
                        fill: { fgColor: { rgb: "F3F4F6" } },
                        border: {
                            top: { style: 'thin', color: { rgb: "000000" } },
                            bottom: { style: 'thin', color: { rgb: "000000" } },
                            left: { style: 'thin', color: { rgb: "000000" } },
                            right: { style: 'thin', color: { rgb: "000000" } }
                        },
                        alignment: {
                            horizontal: C <= 1 ? 'left' : 'right',
                            vertical: 'center'
                        }
                    };

                    // Format currency for grand total
                    if (C >= 2 && C <= 5) {
                        ws[cellAddress].t = 'n';
                        ws[cellAddress].z = '#,##0';
                    }
                    // Format percentage for grand total
                    if (C === 6) {
                        ws[cellAddress].t = 'n';
                        ws[cellAddress].z = '0%';
                    }
                }
            }
        }

        // Merge cells for title
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } } // Merge title across all columns
        ];

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Laba Produk");

        // Generate filename
        const startDateStr = formatDateForExcel(value.startDate);
        const endDateStr = formatDateForExcel(value.endDate);
        const filename = `Laporan_Laba_Produk_${outletName.replace(/\s+/g, '_')}_${startDateStr}_to_${endDateStr}.xlsx`;

        // Write file
        XLSX.writeFile(wb, filename);
    };
    // Calculate totals - PERBAIKAN: dari filteredData bukan paginatedData
    const calculateTotals = () => {
        let totalPenjualanKotor = 0;
        let totalDiskon = 0;
        let totalPembelian = 0;
        let totalLabaProduk = 0;

        filteredData.forEach(order => {
            order.items?.forEach(item => {
                const menuItem = item.menuItem || {};
                const price = menuItem.price || 0;
                const diskon = menuItem.diskon || 0;
                const pembelian = menuItem.pembelian || 0;
                const quantity = item.quantity || 1; // Jika ada quantity

                totalPenjualanKotor += price * quantity;
                totalDiskon += diskon * quantity;
                totalPembelian += pembelian * quantity;
                totalLabaProduk += (price - pembelian) * quantity;
            });
        });

        const totalLabaPersen = totalPenjualanKotor > 0
            ? ((totalLabaProduk / totalPenjualanKotor) * 100).toFixed(2)
            : 0;

        return {
            totalPenjualanKotor,
            totalDiskon,
            totalPembelian,
            totalLabaProduk,
            totalLabaPersen
        };
    };

    const totals = calculateTotals();

    // Show loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
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
        <div className="px-6">
            {/* Breadcrumb */}
            <div className="flex justify-between items-center py-3 my-3">
                <div className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <span>Laporan</span>
                    <FaChevronRight />
                    <Link to="/admin/profit-menu">Laporan Laba & Rugi</Link>
                    <FaChevronRight />
                    <span>Laba Produk</span>
                </div>
                <button
                    onClick={exportToExcel}
                    className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                >
                    Ekspor ke Excel
                </button>
            </div>

            {/* Filters */}
            <div className="pb-[15px] mb-[60px]">
                <div className="flex w-full justify-between py-2">
                    <div className="w-2/5">
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
                        <div className="relative w-2/5">
                            <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari Produk / Kategori"
                                value={tempSearch}
                                onChange={(e) => setTempSearch(e.target.value)}
                                className="text-[13px] border py-2 pl-[30px] pr-[25px] rounded w-full"
                            />
                        </div>
                        <div className="relative text-gray-500 w-2/5">
                            <Select
                                className="text-sm"
                                classNamePrefix="react-select"
                                placeholder="Pilih Outlet"
                                options={options}
                                isSearchable
                                value={
                                    options.find((opt) => opt.value === tempSelectedOutlet) || options[0]
                                }
                                onChange={(selected) => setTempSelectedOutlet(selected.value)}
                                styles={customSelectStyles}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded bg-white shadow-slate-200 shadow-md">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal">Produk</th>
                                <th className="px-4 py-3 font-normal">Kategori</th>
                                <th className="px-4 py-3 font-normal text-right">Penjualan Kotor</th>
                                <th className="px-4 py-3 font-normal text-right">Diskon Produk</th>
                                <th className="px-4 py-3 font-normal text-right">Pembelian</th>
                                <th className="px-4 py-3 font-normal text-right">Laba Produk</th>
                                <th className="px-4 py-3 font-normal text-right">% Laba Produk</th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {paginatedData.map((order, orderIndex) => {
                                    const item = order.items?.[0];
                                    if (!item) return null;

                                    const menuItem = item.menuItem || {};
                                    const price = menuItem.price || 0;
                                    const diskon = menuItem.diskon || 0;
                                    const pembelian = menuItem.pembelian || 0;
                                    const labaproduk = price - pembelian;
                                    const labaprodukpersen = price > 0
                                        ? ((labaproduk / price) * 100).toFixed(2)
                                        : 0;

                                    return (
                                        <tr
                                            className="text-left text-sm cursor-pointer hover:bg-slate-50 border-b"
                                            key={`${order._id}-${orderIndex}`}
                                        >
                                            <td className="px-4 py-3">{menuItem.name || '-'}</td>
                                            <td className="px-4 py-3">{menuItem.category?.name || '-'}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(price)}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(diskon)}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(pembelian)}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(labaproduk)}</td>
                                            <td className="px-4 py-3 text-right">{labaprodukpersen}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr className="py-6 text-center w-full h-96">
                                    <td colSpan={7} className="text-gray-400">
                                        Tidak ada data ditemukan
                                    </td>
                                </tr>
                            </tbody>
                        )}
                        <tfoot className="border-t font-semibold text-sm">
                            <tr>
                                <td className="p-[15px]" colSpan={2}>Grand Total</td>
                                <td className="p-[15px] text-right">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(totals.totalPenjualanKotor)}
                                    </p>
                                </td>
                                <td className="p-[15px] text-right">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(totals.totalDiskon)}
                                    </p>
                                </td>
                                <td className="p-[15px] text-right">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(totals.totalPembelian)}
                                    </p>
                                </td>
                                <td className="p-[15px] text-right">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(totals.totalLabaProduk)}
                                    </p>
                                </td>
                                <td className="p-[15px] text-right">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {totals.totalLabaPersen}%
                                    </p>
                                </td>
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

export default ProfitByProductManagement;