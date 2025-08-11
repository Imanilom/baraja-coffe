import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSearch, FaInfoCircle, FaBoxes, FaChevronLeft } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Modal from './modal';


const InStockManagement = () => {
    const [inStock, setInStock] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [value, setValue] = useState({
        startDate: dayjs(),
        endDate: dayjs()
    });
    const [hasFiltered, setHasFiltered] = useState(false);
    const [showInput, setShowInput] = useState(false);
    const [search, setSearch] = useState("");
    const [tempSelectedOutlet, setTempSelectedOutlet] = useState("");
    const [tempSearch, setTempSearch] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    const [showModal, setShowModal] = useState(false);

    // Safety function to ensure we're always working with arrays
    const ensureArray = (data) => Array.isArray(data) ? data : [];
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const dropdownRef = useRef(null);

    // Calculate the total subtotal first
    const totalSubtotal = selectedTrx && selectedTrx.items ? selectedTrx.items.reduce((acc, item) => acc + item.subtotal, 0) : 0;

    // Calculate PB1 as 10% of the total subtotal
    const pb1 = 10000;

    // Calculate the final total
    const finalTotal = totalSubtotal + pb1;

    // Fetch inStock and outlets data
    const fetchStock = async () => {
        try {
            const stockResponse = await axios.get('/api/product/stock/all');
            const stockData = stockResponse.data.data || [];

            const stockWithMovements = await Promise.all(
                stockData.map(async (item) => {
                    const movementResponse = await axios.get(`/api/product/stock/${item.productId._id}/movements`);
                    const movements = movementResponse.data.data.movements || [];

                    return {
                        ...item,
                        movements
                    };
                })
            );

            setInStock(stockWithMovements);
            // 🔹 Default awal langsung filter semua movements type "in"
            const defaultMovements = [];
            stockWithMovements.forEach(stock => {
                (stock.movements || []).forEach(movement => {
                    if (movement.type === "in") {
                        defaultMovements.push({
                            ...movement,
                            product: stock.productId?.name,
                            unit: stock.productId?.unit
                        });
                    }
                });
            });
            const sortedDefault = defaultMovements.sort(
                (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
            );
            setFilteredData(sortedDefault);

        } catch (err) {
            console.error("Error fetching stock or movements:", err);
            setInStock([]);
            setFilteredData([]);
        }
    };




    const fetchOutlets = async () => {
        try {
            const outletsResponse = await axios.get('/api/outlet');
            const outletsData = Array.isArray(outletsResponse.data)
                ? outletsResponse.data
                : (outletsResponse.data && Array.isArray(outletsResponse.data.data))
                    ? outletsResponse.data.data
                    : [];

            setOutlets(outletsData);
        } catch (err) {
            console.error("Error fetching outlets:", err);
            setOutlets([]);
        }
    };

    // const fetchCategories = async () => {
    //     try {
    //         const categoryResponse = await axios.get('/api/storage/categories');
    //         const categoryData = Array.isArray(categoryResponse.data)
    //             ? categoryResponse.data
    //             : (categoryResponse.data && Array.isArray(categoryResponse.data.data))
    //                 ? categoryResponse.data.data
    //                 : [];

    //         setCategory(categoryData);
    //     } catch (err) {
    //         console.error("Error fetching categories:", err);
    //         setCategory([]);
    //     }
    // };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            await Promise.all([
                fetchStock(),
                fetchOutlets(),
                // fetchCategories()
            ]);
            // fetchStatus();
        } catch (err) {
            console.error("General error:", err);
            setError("Failed to load data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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

    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    // Filter outlets based on search input
    const filteredOutlets = useMemo(() => {
        return uniqueOutlets.filter(outlet =>
            outlet.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, uniqueOutlets]);

    const capitalizeWords = (text) => {
        return text
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    // Apply filter function
    const applyFilter = () => {
        const allMovements = [];

        inStock.forEach(stock => {
            const movements = stock.movements || [];

            const movementsInRange = movements.filter(movement => {
                const movementDate = dayjs(movement.date);
                return (
                    movement.type === "in" && // hanya ambil stok masuk
                    movementDate.isAfter(dayjs(value.startDate).startOf('day').subtract(1, 'second')) &&
                    movementDate.isBefore(dayjs(value.endDate).endOf('day').add(1, 'second'))
                );
            });

            movementsInRange.forEach(movement => {
                allMovements.push({
                    ...movement,
                    product: stock.productId?.name,
                    unit: stock.productId?.unit
                });
            });
        });

        // Filter berdasarkan pencarian jika ada
        const searched = tempSearch
            ? allMovements.filter(m =>
                m._id.toLowerCase().includes(tempSearch.toLowerCase()) ||
                m.product?.toLowerCase().includes(tempSearch.toLowerCase())
            )
            : allMovements;

        // Urutkan berdasarkan tanggal terbaru
        const sorted = searched.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());

        setFilteredData(sorted); // ← bikin state baru khusus movement hasil filter
        setCurrentPage(1);
    };

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, endIndex);
    }, [currentPage, filteredData]);

    useEffect(() => {
        applyFilter();
    }, []);

    const resetFilter = () => {
        setTempSearch("");
        setValue({
            startDate: dayjs(),
            endDate: dayjs(),
        });
        setCurrentPage(1);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert('File berhasil diimpor!');
        setShowModal(false);
    };

    // Export current data to Excel
    const exportToExcel = () => {
        // Prepare data for export
        const dataToExport = filteredData.map(product => {
            const item = product.items?.[0] || {};
            const menuItem = item.menuItem || {};

            return {
                "Waktu": new Date(product.createdAt).toLocaleDateString('id-ID'),
                "Kasir": product.cashier?.username || "-",
                "ID Struk": product._id,
                "Produk": menuItem.name || "-",
                "Tipe Penjualan": product.orderType,
                "Total (Rp)": (item.subtotal || 0) + pb1,
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);

        // Set auto width untuk tiap kolom
        const columnWidths = Object.keys(dataToExport[0]).map(key => ({
            wch: Math.max(key.length + 2, 20)  // minimal lebar 20 kolom
        }));
        worksheet['!cols'] = columnWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Penjualan");
        XLSX.writeFile(wb, "Data_Transaksi_Penjualan.xlsx");
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
                    <FaBoxes size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Inventori</p>
                    <FaChevronRight className="text-[15px] text-gray-500" />
                    <span className="text-[15px] text-[#005429]">Stok Masuk</span>
                    <FaInfoCircle size={17} className="text-gray-400 inline-block" />
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setShowModal(true)} className="text-[#005429] hover:text-white bg-white hover:bg-[#005429] border border-[#005429] text-[13px] px-[15px] py-[7px] rounded">Impor Stok Masuk</button>
                    <Link to="/admin/inventory/instock-create" className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Tambah Stok Masuk</Link>
                </div>
            </div>

            {/* Filters */}
            <div className="px-[15px] pb-[15px] mb-[60px]">
                <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-8 gap-[10px] items-end rounded bg-slate-50 shadow-slate-200 shadow-md">
                    {/* <div className="flex flex-col col-span-2">
                        <label className="text-[13px] mb-1 text-gray-500">Lokasi</label>
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
                                    <li
                                        onClick={() => {
                                            setTempSelectedOutlet(""); // Kosong berarti semua
                                            setShowInput(false);
                                        }}
                                        className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                                    >
                                        Semua Outlet
                                    </li>
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
                    </div> */}

                    <div className="flex flex-col col-span-2">
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

                    <div className="col-span-3"></div>

                    <div className="flex flex-col col-span-2">
                        <label className="text-[13px] mb-1 text-gray-500">Cari</label>
                        <div className="relative">
                            <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari"
                                value={tempSearch}
                                onChange={(e) => setTempSearch(e.target.value)}
                                className="text-[13px] border py-[6px] pl-[30px] pr-[25px] rounded w-full"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 items-end col-span-1">
                        <button onClick={applyFilter} className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Terapkan</button>
                        <button onClick={resetFilter} className="text-[#005429] hover:text-white hover:bg-[#005429] border border-[#005429] text-[13px] px-[15px] py-[7px] rounded">Reset</button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-slate-200 shadow-md">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal">Waktu Submit</th>
                                <th className="px-4 py-3 font-normal">ID Stok Masuk</th>
                                <th className="px-4 py-3 font-normal">Produk</th>
                                <th className="px-4 py-3 font-normal">Unit</th>
                                <th className="px-4 py-3 font-normal">Qty</th>
                                <th className="px-4 py-3 font-normal">Keterangan</th>
                                {/* <th className="px-4 py-3 font-normal">Outlet</th>
                                <th className="px-4 py-3 font-normal">Tanggal</th> */}
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {paginatedData.map((movement) => (
                                    <tr key={movement._id} className="text-left text-sm cursor-pointer hover:bg-slate-50">
                                        <td className="px-4 py-3">{formatDateTime(movement.date)}</td>
                                        <td className="px-4 py-3">{movement._id}</td>
                                        <td className="px-4 py-3">{movement.product && capitalizeWords(movement.product)}</td>
                                        <td className="px-4 py-3 lowercase">{movement.unit}</td>
                                        <td className="px-4 py-3">{movement.quantity}</td>
                                        <td className="px-4 py-3">{movement.notes || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr className="py-6 text-center w-full h-96">
                                    <td colSpan={10}>
                                        <div className="flex justify-center items-center">
                                            <div className="text-gray-400">
                                                <div className="flex justify-center">
                                                    <FaSearch size={100} />
                                                </div>
                                                <p className="uppercase">Data Tidak ditemukan</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        )}

                    </table>
                </div>

                {/* Pagination Controls */}
                {paginatedData.length > 0 && (
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-gray-600">
                            Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} dari {filteredData.length} data
                        </span>
                        <div className="flex justify-center space-x-2 mt-4">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 border rounded disabled:opacity-50"
                            >
                                <FaChevronLeft />
                            </button>

                            {[...Array(totalPages)].map((_, index) => {
                                const page = index + 1;

                                if (
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 2 && page <= currentPage + 2)
                                ) {
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-3 py-1 rounded border ${currentPage === page
                                                ? "bg-[#005429] text-white"
                                                : ""
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                }

                                // Tampilkan "..." jika melompati halaman
                                if (
                                    (page === currentPage - 3 && page > 1) ||
                                    (page === currentPage + 3 && page < totalPages)
                                ) {
                                    return (
                                        <span key={`dots-${page}`} className="px-2 text-gray-500">
                                            ...
                                        </span>
                                    );
                                }

                                return null;
                            })}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 border rounded disabled:opacity-50"
                            >
                                <FaChevronRight />
                            </button>
                        </div>

                    </div>
                )}
            </div>

            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]">
                </div>
            </div>

            <Modal show={showModal} onClose={() => setShowModal(false)} onSubmit={handleSubmit} />
        </div >
    );
};

export default InStockManagement;
