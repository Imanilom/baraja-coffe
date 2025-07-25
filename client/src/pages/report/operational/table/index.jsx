import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";

const TableManagement = () => {
    const [products, setProducts] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [area, setAreas] = useState([]);
    const [table, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showInput, setShowInput] = useState(false);
    const [showInputArea, setShowInputArea] = useState(false);
    const [showInputTable, setShowInputTable] = useState(false);
    const [search, setSearch] = useState("");
    const [tempSelectedOutlet, setTempSelectedOutlet] = useState("");
    const [tempSelectedArea, setTempSelectedArea] = useState("");
    const [tempSelectedTable, setTempSelectedTable] = useState("");
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

                const area = [
                    { _id: "abc", name: "ABC Selaras Depan & Samping" },
                    { _id: "de", name: "DRE Selaras Belakang & Bar Utama" },
                    { _id: "fgh", name: "FGH Lantai 2" }
                ];

                setAreas(area || []);

                const table = [
                    { _id: "abc", name: "ABC Selaras Depan & Samping" },
                    { _id: "de", name: "DRE Selaras Belakang & Bar Utama" },
                    { _id: "fgh", name: "FGH Lantai 2" }
                ];

                setTables(table || []);

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

    const uniqueAreas = useMemo(() => {
        return area.map(item => item.name);
    }, [area]);

    const uniqueTables = useMemo(() => {
        return table.map(item => item.name);
    }, [table]);

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

    const filteredArea = useMemo(() => {
        return uniqueAreas.filter(area =>
            area.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, uniqueAreas]);

    const filteredTables = useMemo(() => {
        return uniqueTables.filter(table =>
            table.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, uniqueTables]);

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

    const formatDateTime = (datetime) => {
        const date = new Date(datetime);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
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
        <div className="">
            {/* Header */}
            <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
                <FaBell size={23} className="text-gray-400" />
                <span className="text-[14px]">Hi Baraja</span>
                <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
                    <FaUser size={30} />
                </Link>
            </div>

            {/* Breadcrumb */}
            <div className="px-3 py-2 flex justify-between items-center border-b">
                <div className="flex items-center space-x-2">
                    <FaClipboardList size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Laporan</p>
                    <FaChevronRight className="text-[15px] text-gray-500" />
                    <Link to="/admin/operational-menu" className="text-[15px] text-gray-500">Laporan Operasional</Link>
                    <FaChevronRight className="text-[15px] text-gray-500" />
                    <span className="text-[15px] text-[#005429]">Laporan Meja</span>
                </div>
            </div>

            {/* Filters */}
            <div className="px-[15px] pb-[15px] mb-[60px]">
                <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-12 gap-[10px] items-end rounded bg-gray-50 shadow-md">
                    <div className="flex flex-col col-span-5">
                        <label className="text-[13px] mb-1 text-gray-500">Outlet</label>
                        <div className="relative">
                            {!showInput ? (
                                <button className="w-full text-[13px] text-gray-500 border py-[6px] pr-[25px] pl-[12px] rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]" onClick={() => setShowInput(true)}>
                                    {tempSelectedOutlet || "Semua Outlet"}
                                </button>
                            ) : (
                                <input
                                    type="text"
                                    className="w-full text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded text-left"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                    placeholder="Cari outlet..."
                                />
                            )}
                            {showInput && (
                                <ul className="absolute z-10 bg-white border mt-1 w-full rounded shadow max-h-48 overflow-auto" ref={dropdownRef}>
                                    {filteredOutlets.length > 0 ? (
                                        filteredOutlets.map((outlet, idx) => (
                                            <li
                                                key={idx}
                                                onClick={() => {
                                                    setTempSelectedOutlet(outlet);
                                                    setShowInput(false);
                                                }}
                                                className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                                            >
                                                {outlet}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-2 text-gray-500">Tidak ditemukan</li>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col col-span-5">
                        <label className="text-[13px] mb-1 text-gray-500">Tanggal</label>
                        <div className="relative text-gray-500 after:content-['▼'] after:absolute after:right-3 after:top-1/2 after:-translate-y-1/2 after:text-[10px] after:pointer-events-none">
                            <Datepicker
                                showFooter
                                showShortcuts
                                value={value}
                                onChange={setValue}
                                displayFormat="DD-MM-YYYY"
                                inputClassName="w-full text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded cursor-pointer"
                                popoverDirection="down"
                            />

                            {/* Overlay untuk menyembunyikan ikon kalender */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-white cursor-pointer"></div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 items-end col-span-2">
                        <button onClick={applyFilter} className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Terapkan</button>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-8 w-full">
                    <div className="border border-[#005429] rounded-lg py-[12px] px-[20px] text-gray-500 font-normal text-[14px]">
                        <h5 className="text-[15px]">Jumlah Meja Melebihi Kapasitas</h5>
                        <h2 className="text-[25px]">0 Meja</h2>
                        <div className="flex justify-end">
                            <span className="text-right text-[12px] text-[#005429] font-normal">Lihat Detail</span>
                        </div>
                    </div>
                    <div className="border border-[#005429] rounded-lg py-[12px] px-[20px] text-gray-500 font-normal text-[14px]">
                        <h5 className="text-[15px]">Jumlah Meja Melebihi Batas Waktu</h5>
                        <h2 className="text-[25px]">0 Meja</h2>
                        <div className="flex justify-end">
                            <span className="text-right text-[12px] text-[#005429] font-normal">Lihat Detail</span>
                        </div>
                    </div>
                    <div className="border border-[#005429] rounded-lg py-[12px] px-[20px] text-gray-500 font-normal text-[14px]">
                        <h5 className="text-[15px]">Rata-rata Durasi Waktu/Meja</h5>
                        <h2 className="text-[25px]">0 Menit</h2>
                        <div className="flex justify-end">
                            <span className="text-right text-[12px] text-[#005429] font-normal">Lihat Detail</span>
                        </div>
                    </div>
                    <div className="border border-[#005429] rounded-lg py-[12px] px-[20px] text-gray-500 font-normal text-[14px]">
                        <h5 className="text-[15px]">Rata-rata Pelanggan/Meja</h5>
                        <h2 className="text-[25px]">0 Orang</h2>
                        <div className="flex justify-end">
                            <span className="text-right text-[12px] text-[#005429] font-normal">Lihat Detail</span>
                        </div>
                    </div>
                </div>

                <div className="mt-[20px] mb-[10px]">
                    <h4 className="text-[16px] font-normal">Data Pengguna Meja</h4>
                </div>

                <div className="py-[10px] my-[13px] px-[15px] grid grid-cols-12 gap-[10px] items-end rounded bg-gray-50 shadow-md">
                    <div className="flex flex-col col-span-5">
                        <label className="text-[13px] mb-1 text-gray-500">Area</label>
                        <div className="relative">
                            {!showInputArea ? (
                                <button className="w-full text-[13px] text-gray-500 border py-[6px] pr-[25px] pl-[12px] rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]" onClick={() => setShowInputArea(true)}>
                                    {tempSelectedArea || "Semua Outlet"}
                                </button>
                            ) : (
                                <input
                                    type="text"
                                    className="w-full text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded text-left"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                    placeholder="Cari outlet..."
                                />
                            )}
                            {showInputArea && (
                                <ul className="absolute z-10 bg-white border mt-1 w-full rounded shadow max-h-48 overflow-auto" ref={dropdownRef}>
                                    {filteredArea.length > 0 ? (
                                        filteredArea.map((area, idx) => (
                                            <li
                                                key={idx}
                                                onClick={() => {
                                                    setTempSelectedArea(area);
                                                    setShowInputArea(false);
                                                }}
                                                className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                                            >
                                                {area}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-2 text-gray-500">Tidak ditemukan</li>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col col-span-5">
                        <label className="text-[13px] mb-1 text-gray-500">Meja</label>
                        {!showInputTable ? (
                            <button className="w-full text-[13px] text-gray-500 border py-[6px] pr-[25px] pl-[12px] rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]" onClick={() => setShowInputTable(true)} disabled>
                                {tempSelectedTable || "Pilih Meja"}
                            </button>
                        ) : (
                            <input
                                type="text"
                                className="w-full text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded text-left"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        )}
                        {showInputTable && (
                            <ul className="absolute z-10 bg-white border mt-1 w-full rounded shadow max-h-48 overflow-auto" ref={dropdownRef}>
                                {filteredTables.length > 0 ? (
                                    filteredTables.map((table, idx) => (
                                        <li
                                            key={idx}
                                            onClick={() => {
                                                setTempSelectedTable(table);
                                                setShowInputTable(false);
                                            }}
                                            className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                                        >
                                            {table}
                                        </li>
                                    ))
                                ) : (
                                    <li className="px-4 py-2 text-gray-500">Tidak ditemukan</li>
                                )}
                            </ul>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2 items-end col-span-2">
                        <button className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Terapkan</button>
                        <button className="border border-[#005429] text-[#005429] text-[13px] px-[15px] py-[7px] rounded">Export</button>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded shadow-md shadow-slate-200">
                    <table className="min-w-full table-auto">
                        <thead className="text-[14px] text-gray-400">
                            <tr>
                                <th className="px-4 py-4 text-left font-normal">Tanggal</th>
                                <th className="px-4 py-4 text-left font-normal">Area</th>
                                <th className="px-4 py-4 text-left font-normal">Meja</th>
                                <th className="px-4 py-4 font-normal">Jumlah Pelanggan/Kapasitas</th>
                                <th className="px-4 py-4 font-normal">Durasi Waktu</th>
                                <th className="px-4 py-4 font-normal">Batas Waktu</th>
                            </tr>
                        </thead>
                        {filteredData.length > 0 ? (
                            <tbody>
                                {filteredData.map((item, i) => {
                                    return (
                                        <tr key={i} className="hover:bg-gray-50 text-gray-500">
                                            <td className="p-[15px]">{formatDateTime(item.tanggal)}</td>
                                            <td className="p-[15px]">{item.area}</td>
                                            <td className="p-[15px]">{item.meja}</td>
                                            <td className="p-[15px]">{item.jumlahpelanggan}</td>
                                            <td className="p-[15px]">{formatDateTime(item.durasiwaktu)}</td>
                                            <td className="p-[15px]">{formatDateTime(item.bataswaktu)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr className="py-6 text-center w-full h-96 text-gray-500">
                                    <td colSpan={6} className="uppercase">Data tidak di temukan</td>
                                </tr>
                            </tbody>
                        )}
                    </table>
                </div>
            </div>

            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]">
                </div>
            </div>
        </div>
    );
};

export default TableManagement;