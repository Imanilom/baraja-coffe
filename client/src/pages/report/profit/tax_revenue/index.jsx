import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";

const TaxRevenueManagement = () => {
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: '#d1d5db', // Tailwind border-gray-300
            minHeight: '34px',
            fontSize: '13px',
            color: '#6b7280', // text-gray-500
            boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none', // blue-500 on focus
            '&:hover': {
                borderColor: '#9ca3af', // Tailwind border-gray-400
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#6b7280', // text-gray-500
        }),
        input: (provided) => ({
            ...provided,
            color: '#6b7280', // text-gray-500 for typed text
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9ca3af', // text-gray-400
            fontSize: '13px',
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '13px',
            color: '#374151', // gray-700
            backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white', // blue-50
            cursor: 'pointer',
        }),
    };
    const [tax, setTax] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showInput, setShowInput] = useState(false);
    const [search, setSearch] = useState("");
    const [tempSelectedOutlet, setTempSelectedOutlet] = useState("");
    const [value, setValue] = useState(null);
    const [tempSearch, setTempSearch] = useState("");
    const [filteredData, setFilteredData] = useState([]);

    // Safety function to ensure we're always working with arrays
    const ensureArray = (data) => Array.isArray(data) ? data : [];
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const dropdownRef = useRef(null);

    // Fetch tax and outlets data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch tax data
                const responseOrder = await axios.get("/api/orders");
                const dataOrder = responseOrder.data.data ? responseOrder.data.data : responseOrder.data

                const apiTax = await axios.get("/api/tax-service");
                const taxData = apiTax.data.data ? apiTax.data.data : apiTax.data;

                // Buat map untuk quick lookup
                const taxMap = {};
                taxData.forEach(tax => {
                    taxMap[tax._id] = tax.percentage; // atau tax jika mau ambil semua data
                });

                // Enrich dataOrder dengan percentage dari taxData
                const enrichedData = dataOrder.map(order => ({
                    ...order,
                    taxAndServiceDetails: order.taxAndServiceDetails?.map(taxService => ({
                        ...taxService,
                        percentage: taxMap[taxService.id] || taxMap[taxService._id] || 0
                    }))
                }));

                setTax(enrichedData || []);
                setFilteredData(enrichedData || []); // Initialize filtered data with all tax

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
                setTax([]);
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

    // Filter outlets based on search input
    const filteredOutlets = useMemo(() => {
        return uniqueOutlets.filter(outlet =>
            outlet.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, uniqueOutlets]);

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

    // Di luar return
    const groupedTaxes = useMemo(() => {
        const allTaxes = filteredData.flatMap(item =>
            item.taxAndServiceDetails || []
        );

        const grouped = allTaxes.reduce((acc, tax) => {
            if (!acc[tax.name]) {
                acc[tax.name] = {
                    name: tax.name,
                    type: tax.type,
                    percentage: tax.percentage,
                    totalAmount: 0,
                    count: 0
                };
            }
            acc[tax.name].totalAmount += tax.amount;
            acc[tax.name].count += 1;
            return acc;
        }, {});

        return Object.values(grouped);
    }, [filteredData]);

    // Hitung total
    const totalAllTax = groupedTaxes.reduce((sum, tax) => sum + tax.totalAmount, 0);

    const options = [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((outlet) => ({
            value: outlet._id,
            label: outlet.name,
        })),
    ];

    // Apply filter function
    const applyFilter = useCallback(() => {

        // Make sure tax is an array before attempting to filter
        let filtered = ensureArray([...tax]);

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
    }, [tax, tempSearch, tempSelectedOutlet, value]);

    // Auto-apply filter whenever dependencies change
    useEffect(() => {
        applyFilter();
    }, [applyFilter]);

    // Initial load
    useEffect(() => {
        applyFilter();
    }, []);


    // Export current data to Excel
    const exportToExcel = () => {
        // Prepare data for export
        const dataToExport = filteredData.map(product => {
            const item = product.items?.[0] || {};
            const menuItem = item.menuItem || {};
            const addonsPrice = item.addons?.reduce((sum, addon) => sum + (addon?.price || 0), 0) || 0;

            return {
                "Produk": menuItem.name || 'N/A',
                "Kategori": menuItem.category?.join(', ') || 'N/A',
                "SKU": menuItem._id || 'N/A',
                "Terjual": item.quantity || 0,
                "Penjualan Kotor": item.subtotal || 0,
                "Diskon Produk": addonsPrice || 0,
                "Total": (item.subtotal || 0) + addonsPrice,
                "Outlet": product.cashier?.outlet?.[0]?.outletId?.name || 'N/A',
                "Tanggal": new Date(product.createdAt).toLocaleDateString('id-ID')
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Penjualan Produk");
        XLSX.writeFile(wb, "Penjualan_Produk.xlsx");
    };

    useEffect(() => {
        if (tax.length > 0) {
            const today = new Date();
            const todayRange = { startDate: today, endDate: today };
            setValue(todayRange);
            setTimeout(() => applyFilter(), 0);
        }
    }, [tax]);

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
                    <Link to="/admin/profit-menu">Laporan Laba Rugi</Link>
                    <FaChevronRight />
                    <span>Pajak</span>
                </div>
                {/* <button
                    onClick={exportToExcel} 
                    className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Ekspor</button> */}
            </div>

            {/* Filters */}
            <div className="pb-[15px] mb-[60px]">
                <div className="flex w-full justify-between py-2">
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
                        <div className="relative">
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
                <div className="rounded shadow-md bg-white shadow-slate-200">
                    <table className="min-w-full table-auto">
                        <thead className="text-[14px] text-gray-400">
                            <tr>
                                <th className="px-4 py-4 text-left font-normal">Nama Pajak</th>
                                <th className="px-4 py-4 text-right font-normal">% Pajak</th>
                                <th className="px-4 py-4 text-left font-normal">Tipe Pajak</th>
                                <th className="px-4 py-4 text-right font-normal">Transaksi</th>
                                <th className="px-4 py-4 text-right font-normal">Total Pajak</th>
                            </tr>
                        </thead>
                        {groupedTaxes.length > 0 ? (
                            <>
                                <tbody>
                                    {groupedTaxes.map((tax, i) => (
                                        <tr key={i} className="hover:bg-gray-50 text-gray-500">
                                            <td className="p-[15px]">{tax.name}</td>
                                            <td className="p-[15px] text-right">{tax.percentage}</td>
                                            <td className="p-[15px]">{tax.type}</td>
                                            <td className="p-[15px] text-right">{tax.count}</td>
                                            <td className="p-[15px] text-right">{formatCurrency(tax.totalAmount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="border-t font-semibold text-sm">
                                    <tr>
                                        <td className="p-[15px]" colSpan={4}>Total</td>
                                        <td className="p-[15px] text-right rounded">
                                            <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                                {formatCurrency(totalAllTax)}
                                            </p>
                                        </td>
                                    </tr>
                                </tfoot>
                            </>
                        ) : (
                            <tbody>
                                <tr className="py-6 text-center w-full h-96 text-gray-500">
                                    <td colSpan={5} className="uppercase">Data tidak di temukan</td>
                                </tr>
                            </tbody>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TaxRevenueManagement;