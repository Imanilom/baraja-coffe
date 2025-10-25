import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import UnderDevelopment from "../../../../components/repair";

const DailyProfitManagement = () => {
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

    const [products, setProducts] = useState([]);
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

    // Fetch products and outlets data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch products data
                const data = [];

                setProducts(data || []);
                setFilteredData(data || []); // Initialize filtered data with all products

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


    const options = [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((outlet) => ({
            value: outlet._id,
            label: outlet.name,
        })),
    ];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dat) => {
        const date = new Date(dat);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
    };
    // Apply filter function
    const applyFilter = () => {

        // Make sure products is an array before attempting to filter
        let filtered = ensureArray([...products]);

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
    };

    // Reset filters
    const resetFilter = () => {
        setTempSearch("");
        setTempSelectedOutlet("");
        setValue(null);
        setSearch("");
        setFilteredData(ensureArray(products));
        setCurrentPage(1);
    };

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
        if (products.length > 0) {
            const today = new Date();
            const todayRange = { startDate: today, endDate: today };
            setValue(todayRange);
            setTimeout(() => applyFilter(), 0);
        }
    }, [products]);

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
        // <div className="">

        //     {/* Breadcrumb */}
        //     <div className="flex justify-between items-center px-6 py-3 my-3">
        //         <div className="flex gap-2 items-center text-xl text-green-900 font-semibold">
        //             <p>Laporan</p>
        //             <FaChevronRight />
        //             <Link to="/admin/profit-menu">Laporan Laba Rugi</Link>
        //             <FaChevronRight />
        //             <span>Laba Harian</span>
        //         </div>
        //         {/* <button
        //             onClick={exportToExcel} 
        //             className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Ekspor</button> */}
        //     </div>

        //     {/* Filters */}
        //     <div className="px-6">
        //         <div className="flex justify-between py-3">
        //             <div className="w-2/5">
        //                 <div className="relative text-gray-500">
        //                     <Datepicker
        //                         showFooter
        //                         showShortcuts
        //                         value={value}
        //                         onChange={setValue}
        //                         displayFormat="DD-MM-YYYY"
        //                         inputClassName="w-full text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded cursor-pointer"
        //                         popoverDirection="down"
        //                     />
        //                 </div>
        //             </div>
        //             <div className="w-1/5">
        //                 <div className="relative">
        //                     <Select
        //                         className="text-sm"
        //                         classNamePrefix="react-select"
        //                         placeholder="Pilih Outlet"
        //                         options={options}
        //                         isSearchable
        //                         value={
        //                             options.find((opt) => opt.value === tempSelectedOutlet) || options[0]
        //                         }
        //                         onChange={(selected) => setTempSelectedOutlet(selected.value)}
        //                         styles={customSelectStyles}
        //                     />
        //                 </div>
        //             </div>
        //             {/* <div className="flex justify-end space-x-2 items-end col-span-2">
        //                 <button onClick={applyFilter} className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Terapkan</button>
        //                 <button onClick={resetFilter} className="text-gray-400 border text-[13px] px-[15px] py-[7px] rounded">Reset</button>
        //             </div> */}
        //         </div>

        //         {/* Table */}
        //         <div className="rounded shadow-md bg-white shadow-slate-200">
        //             <table className="min-w-full table-auto">
        //                 <thead className="text-[14px] text-gray-400">
        //                     <tr>
        //                         <th className="px-4 py-4 text-left font-normal">Tanggal</th>
        //                         <th className="px-4 py-4 text-left font-normal">Penjualan Kotor</th>
        //                         <th className="px-4 py-4 text-left font-normal">Diskon</th>
        //                         <th className="px-4 py-4 text-right font-normal">Pembulatan</th>
        //                         <th className="px-4 py-4 text-right font-normal">Pembelian</th>
        //                         <th className="px-4 py-4 text-right font-normal">Laba Kotor</th>
        //                         <th className="px-4 py-4 text-right font-normal">% Laba Kotor</th>
        //                     </tr>
        //                 </thead>
        //                 {filteredData.length > 0 ? (
        //                     <tbody>
        //                         {filteredData.map((item, i) => {
        //                             return (
        //                                 <tr key={i} className="hover:bg-gray-50 text-gray-500">
        //                                     <td className="p-[15px]">{formatDate(item.tanggal)}</td>
        //                                     <td className="p-[15px] text-right">{formatRupiah(item.penjualankotor)}</td>
        //                                     <td className="p-[15px] text-right">{formatRupiah(item.discount)}</td>
        //                                     <td className="p-[15px] text-right">{formatRupiah(item.pembulatan)}</td>
        //                                     <td className="p-[15px] text-right">{formatRupiah(item.pembelian)}</td>
        //                                     <td className="p-[15px] text-right">{formatRupiah(item.labakotor)}</td>
        //                                     <td className="p-[15px] text-right">{item.total}</td>
        //                                 </tr>
        //                             );
        //                         })}
        //                     </tbody>
        //                 ) : (
        //                     <tbody>
        //                         <tr className="py-6 text-center w-full h-96 text-gray-500">
        //                             <td colSpan={7} className="uppercase">Data tidak di temukan</td>
        //                         </tr>
        //                     </tbody>
        //                 )}
        //                 <tfoot className="border-t font-semibold text-sm">
        //                     <tr>
        //                         <td className="p-[15px]">Grand Total</td>
        //                         <td className="p-[15px] text-right rounded"><p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">{formatCurrency(0)}</p></td>
        //                         <td className="p-[15px] text-right rounded"><p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">{formatCurrency(0)}</p></td>
        //                         <td className="p-[15px] text-right rounded"><p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">{formatCurrency(0)}</p></td>
        //                         <td className="p-[15px] text-right rounded"><p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">{formatCurrency(0)}</p></td>
        //                         <td className="p-[15px] text-right rounded"><p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">{formatCurrency(0)}</p></td>
        //                         <td className="p-[15px] text-right rounded"><p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">{(0) + "%"}</p></td>
        //                     </tr>
        //                 </tfoot>
        //             </table>
        //         </div>
        //     </div>
        // </div>

        <UnderDevelopment />
    );
};

export default DailyProfitManagement;