import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSearch, FaIdBadge, FaThLarge, FaPencilAlt, FaTrash } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import DetailMejaModal from "./detailtablemodal";


const TablePlanManagement = () => {
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showInput, setShowInput] = useState(false);
    const [search, setSearch] = useState("");
    const [tempSelectedOutlet, setTempSelectedOutlet] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    const [labelMap, setLabelMap] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [showDetail, setShowDetail] = useState(false);

    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

    const dropdownRef = useRef(null);

    // Fetch attendances and outlets data
    const fetchOutlet = async () => {
        setLoading(true);
        try {

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
            setFilteredData([]);
            setOutlets([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTable = async () => {
        try {
            // Simulasi response dari API
            const dataFromAPI = [
                { code: "A01", pax: 4 },
                { code: "A02", pax: 2 },
                { code: "B01", pax: 6 },
                { code: "C07", pax: 5 },
                { code: "D02", pax: 3 },
                { code: "Z99", pax: 8 }
            ];

            // Penempatan posisi
            const placement = {
                A01: 0,
                A02: 2,   // index 1 akan kosong
                B01: 10,
                C07: 15,
                D02: 20,
                Z99: 25
            };

            // Hitung totalBoxes minimal berdasarkan index tertinggi
            const maxIndex = Math.max(...Object.values(placement));
            const totalBoxes = Math.max(maxIndex + 1, 100);

            const grid = Array(totalBoxes).fill(null);

            dataFromAPI.forEach(item => {
                const position = placement[item.code];
                if (position !== undefined && position < totalBoxes) {
                    grid[position] = item;
                }
            });

            setLabelMap(grid);
        } catch (error) {
            console.error("Error fetching table data:", error);
        }
    };


    useEffect(() => {
        fetchOutlet();
        fetchTable();
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

    // Filter outlets based on search input
    const filteredOutlets = useMemo(() => {
        return uniqueOutlets.filter(outlet =>
            outlet.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, uniqueOutlets]);


    // Apply filter function
    const applyFilter = () => {

        // // Make sure products is an array before attempting to filter
        // let filtered = ensureArray([...products]);

        // // Filter by search term (category)
        // const searchTerm = tempSearch.toLowerCase();

        // filtered = filtered.flatMap(product => {
        //     const item = product?.items?.[0];
        //     const menuItem = item?.menuItem;
        //     if (!menuItem) return [];

        //     const categories = Array.isArray(menuItem.category)
        //         ? menuItem.category
        //         : [menuItem.category || 'Uncategorized'];

        //     // Pecah kategori menjadi entri produk terpisah
        //     return categories
        //         .filter(category => {
        //             const categoryLower = (category || '').toLowerCase();
        //             return !searchTerm || categoryLower.includes(searchTerm);
        //         })
        //         .map(category => ({
        //             ...product,
        //             items: [{
        //                 ...item,
        //                 menuItem: {
        //                     ...menuItem,
        //                     category: category
        //                 }
        //             }]
        //         }));
        // });

        // // Filter by outlet
        // if (tempSelectedOutlet) {
        //     filtered = filtered.filter(product => {
        //         try {
        //             if (!product?.cashier?.outlet?.length > 0) {
        //                 return false;
        //             }

        //             const outletName = product.cashier.outlet[0]?.outletId?.name;
        //             const matches = outletName === tempSelectedOutlet;

        //             if (!matches) {
        //             }

        //             return matches;
        //         } catch (err) {
        //             console.error("Error filtering by outlet:", err);
        //             return false;
        //         }
        //     });
        // }

        // // Filter by date range
        // if (value && value.startDate && value.endDate) {
        //     filtered = filtered.filter(product => {
        //         try {
        //             if (!product.createdAt) {
        //                 return false;
        //             }

        //             const productDate = new Date(product.createdAt);
        //             const startDate = new Date(value.startDate);
        //             const endDate = new Date(value.endDate);

        //             // Set time to beginning/end of day for proper comparison
        //             startDate.setHours(0, 0, 0, 0);
        //             endDate.setHours(23, 59, 59, 999);

        //             // Check if dates are valid
        //             if (isNaN(productDate) || isNaN(startDate) || isNaN(endDate)) {
        //                 return false;
        //             }

        //             const isInRange = productDate >= startDate && productDate <= endDate;
        //             if (!isInRange) {
        //             }
        //             return isInRange;
        //         } catch (err) {
        //             console.error("Error filtering by date:", err);
        //             return false;
        //         }
        //     });
        // }

        // setFilteredData(filtered);
    };


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
        <div className="relative">
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
                    <FaIdBadge size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Pengaturan Meja</p>
                    <FaChevronRight size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Denah Meja</p>
                </div>
            </div>

            {/* Filters */}
            <div className="px-[15px] pb-[15px] mb-[60px]">
                <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-9 gap-[10px] items-end rounded bg-slate-50 shadow-slate-200 shadow-md">
                    <div className="flex flex-col col-span-3">
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
                                    placeholder=""
                                />
                            )}
                            {showInput && (
                                <ul className="absolute z-10 bg-white border mt-1 w-full rounded shadow-slate-200 shadow-md max-h-48 overflow-auto" ref={dropdownRef}>
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

                    <div className="flex flex-col col-span-3">
                        <label className="text-[13px] mb-1 text-gray-500">Area</label>
                        <div className="relative">
                            {!showInput ? (
                                <button className="w-full text-[13px] text-gray-500 border py-[6px] pr-[25px] pl-[12px] rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]" onClick={() => setShowInput(true)}>
                                    {tempSelectedOutlet || "Semua Tipe"}
                                </button>
                            ) : (
                                <input
                                    type="text"
                                    className="w-full text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded text-left"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                    placeholder=""
                                />
                            )}
                            {showInput && (
                                <ul className="absolute z-10 bg-white border mt-1 w-full rounded shadow-slate-200 shadow-md max-h-48 overflow-auto" ref={dropdownRef}>
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

                    <div className="flex flex-col col-span-3 justify-self-end">
                        <button onClick={applyFilter} className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Terapkan</button>
                    </div>
                </div>

                <div className="rounded shadow-slate-200 shadow-md">
                    <div className="grid grid-cols-8 border">
                        {labelMap.map((item, index) => (
                            <div key={index} className="col-span-1 p-2 border text-center">
                                {item ? (
                                    <div
                                        key={index}
                                        className="border w-[90px] h-[90px] mx-auto flex flex-col items-center justify-center rounded cursor-pointer"
                                        onClick={() => {
                                            if (item) {
                                                setShowDetail(true); // open modal
                                                // bisa juga simpan item yg diklik ke state jika dinamis
                                            }
                                        }}
                                    >
                                        <p className="text-sm text-gray-800 font-semibold">{item.code}</p>
                                        <p className="text-[12px] text-gray-500">{item.pax} pax</p>
                                    </div>
                                ) : (
                                    <div className="w-[90px] h-[90px] mx-auto flex flex-col items-center justify-center rounded cursor-pointer"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <button
                onClick={openModal}
                className="fixed right-5 bottom-20 bg-[#005429] text-white px-4 py-2 rounded text-sm hover:bg-[#006d34]"
            >
                Atur Denah
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="w-[450px] bg-white rounded shadow-lg animate-fadeIn relative">
                        {/* Header */}
                        <div className="border-b px-5 py-3 flex justify-between items-center">
                            <h4 className="text-lg font-semibold flex items-center gap-2">
                                <span className="text-blue-500">ℹ</span> ATUR DENAH
                            </h4>
                            <button
                                type="button"
                                className="text-gray-500 hover:text-gray-700 text-xl"
                                onClick={closeModal}
                            >
                                ×
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-6 text-center">
                            <form className="space-y-6" id="form-set-table-position">
                                <p className="text-gray-700 text-sm leading-relaxed">
                                    Klik layout yang disertai icon tambah, lalu masukan <br />
                                    lantai yang ingin dipindahkan.
                                </p>

                                <div className="flex justify-center mt-6">
                                    <button
                                        type="submit"
                                        className="bg-[#005429] hover:bg-[#006d34] text-white text-sm py-2 px-4 rounded"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            closeModal();
                                        }}
                                    >
                                        Saya Mengerti
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <DetailMejaModal
                isOpen={showDetail}
                onClose={() => setShowDetail(false)}
                data={{
                    tableName: "A01",
                    areaName: "Selasar Depan",
                    areaStatus: "Aktif",
                    timeLimit: "90 Menit",
                    reminderTime: "15 Menit",
                }}
            />;

            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]">
                </div>
            </div>
        </div>
    );
};

export default TablePlanManagement;
