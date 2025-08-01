import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import Select from "react-select";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import ExportFilter from "../export";


const SalesTransaction = () => {
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
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showInput, setShowInput] = useState(false);
    const [search, setSearch] = useState("");
    const [tempSelectedOutlet, setTempSelectedOutlet] = useState("");
    const [value, setValue] = useState(null);
    const [tempSearch, setTempSearch] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Safety function to ensure we're always working with arrays
    const ensureArray = (data) => Array.isArray(data) ? data : [];
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const dropdownRef = useRef(null);

    // Calculate the total subtotal first
    const totalSubtotal = selectedTrx && selectedTrx.items ? selectedTrx.items.reduce((acc, item) => acc + item.subtotal, 0) : 0;

    // Calculate PB1 as 10% of the total subtotal
    const pb1 = totalSubtotal * 0.10;

    // Calculate the final total
    const finalTotal = totalSubtotal + pb1;

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

                // Ambil hanya data dengan status "Completed"
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
        ...outlets.map((outlet) => ({
            value: outlet._id,
            label: outlet.name,
        })),
    ];

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

    // Paginate the filtered data
    const paginatedData = useMemo(() => {

        // Ensure filteredData is an array before calling slice
        if (!Array.isArray(filteredData)) {
            console.error('filteredData is not an array:', filteredData);
            return [];
        }

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const result = filteredData.slice(startIndex, endIndex);
        return result;
    }, [currentPage, filteredData]);

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

    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    // Calculate grand totals for filtered data
    const {
        grandTotalFinal,
    } = useMemo(() => {
        const totals = {
            grandTotalFinal: 0,
        };

        if (!Array.isArray(filteredData)) {
            return totals;
        }

        filteredData.forEach(product => {
            try {
                const item = product?.items?.[0];
                if (!item) return;

                const subtotal = Number(item.subtotal) || 0;

                totals.grandTotalFinal += subtotal + pb1;
            } catch (err) {
                console.error("Error calculating totals for product:", err);
            }
        });

        return totals;
    }, [filteredData]);

    // Apply filter function
    const applyFilter = () => {

        // Make sure products is an array before attempting to filter
        let filtered = ensureArray([...products]);

        // Filter by search term (product name, category, or SKU)
        if (tempSearch) {
            filtered = filtered.filter(product => {
                try {
                    const searchTerm = tempSearch.toLowerCase();

                    // Periksa semua items, bukan hanya items[0]
                    return product.items?.some(item => {
                        const menuItem = item?.menuItem;
                        if (!menuItem) return false;

                        const name = (menuItem.name || '').toLowerCase();
                        const customer = (menuItem.user || '').toLowerCase();
                        const receipt = (menuItem._id || '').toLowerCase();

                        return name.includes(searchTerm) || receipt.includes(searchTerm) || customer.includes(searchTerm);
                    });
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
                    const outletId = product.outlet;

                    return outletId === tempSelectedOutlet;
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
                    <Link to="/admin/sales-menu" className="text-[15px] text-gray-500">Laporan Penjualan</Link>
                    <FaChevronRight className="text-[15px] text-gray-500" />
                    <Link to="/admin/transaction-sales" className="text-[15px] text-[#005429]">Data Transaksi Penjualan</Link>
                </div>

                <ExportFilter
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Ekspor</button>
            </div>

            {/* Filters */}
            <div className="px-[15px] pb-[15px]">
                <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-8 gap-[10px] items-end rounded bg-slate-50 shadow-slate-200 shadow-md">
                    <div className="flex flex-col col-span-2">
                        <label className="text-[13px] mb-1 text-gray-500">Outlet</label>
                        <Select
                            className="text-sm"
                            classNamePrefix="react-select"
                            placeholder="Pilih Outlet"
                            options={options}
                            isSearchable
                            value={
                                options.find((opt) => opt.value === tempSelectedOutlet) ||
                                options[0]
                            }
                            onChange={(selected) => setTempSelectedOutlet(selected.value)}
                            styles={customSelectStyles}
                        />
                    </div>

                    <div className="flex flex-col col-span-2">
                        <label className="text-[13px] mb-1 text-gray-500">Tanggal</label>
                        <div className="relative text-gray-500 after:content-['▼'] after:absolute after:right-3 after:top-1/2 after:-translate-y-1/2 after:text-[10px] after:pointer-events-none">
                            <Datepicker
                                showFooter
                                showShortcuts
                                value={value}
                                onChange={setValue}
                                displayFormat="DD-MM-YYYY"
                                inputClassName="w-full text-[13px] border py-[8px] pr-[25px] pl-[12px] rounded cursor-pointer"
                                popoverDirection="down"
                            />

                            {/* Overlay untuk menyembunyikan ikon kalender */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-white cursor-pointer"></div>
                        </div>
                    </div>

                    <div className="flex flex-col col-span-2">
                        <label className="text-[13px] mb-1 text-gray-500">Cari</label>
                        <input
                            type="text"
                            placeholder="Produk / Pelanggan / Kode Struk"
                            value={tempSearch}
                            onChange={(e) => setTempSearch(e.target.value)}
                            className="text-[13px] border py-[8px] pr-[25px] pl-[12px] rounded"
                        />
                    </div>

                    <div className="flex justify-end space-x-2 items-end col-span-2">
                        <button onClick={applyFilter} className="bg-[#005429] text-white text-[13px] px-[15px] py-[8px] rounded">Terapkan</button>
                        <button onClick={resetFilter} className="text-gray-400 border text-[13px] px-[15px] py-[8px] rounded">Reset</button>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded shadow-slate-200 shadow-md overflow-y-auto">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal">Waktu</th>
                                <th className="px-4 py-3 font-normal">Kasir</th>
                                <th className="px-4 py-3 font-normal">ID Struk</th>
                                <th className="px-4 py-3 font-normal">Produk</th>
                                <th className="px-4 py-3 font-normal">Tipe Penjualan</th>
                                <th className="px-4 py-3 font-normal text-right">Total</th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {paginatedData.map((product, index) => {
                                    try {
                                        const item = product?.items?.[0] || {};
                                        const orderId = product?.order_id || {};
                                        const date = product?.createdAt || {};
                                        const cashier = product?.cashierId || {};
                                        const orderType = product?.orderType || {};
                                        const menuItem = item?.menuItem || {};
                                        let menuNames = [];
                                        let totalSubtotal = 0;

                                        if (Array.isArray(product?.items)) {
                                            menuNames = product.items.map(i => i?.menuItem.name || 'N/A');
                                            totalSubtotal = product.items.reduce((sum, i) => {
                                                return sum + (Number(i?.subtotal) || 0);
                                            }, 0);
                                        }

                                        const pbn = totalSubtotal * 0.10;
                                        const total = Math.round(totalSubtotal + pbn);

                                        return (
                                            <tr className="text-left text-sm cursor-pointer hover:bg-slate-50" key={product._id} onClick={() => setSelectedTrx(product)}>
                                                <td className="px-4 py-3">
                                                    {formatDateTime(date) || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {cashier?.username || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {orderId || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {menuNames.join(', ')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {orderType || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {total || ""}
                                                </td>
                                            </tr>
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
                                <td className="px-4 py-2" colSpan="4">Grand Total</td>
                                <td className="px-2 py-2 text-right rounded" colSpan="2"><p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full text-right">Rp {grandTotalFinal.toLocaleString()}</p></td>
                            </tr>
                        </tfoot>
                    </table>
                    {selectedTrx && (
                        <div className="fixed inset-0 z-50 flex justify-end">
                            {/* Backdrop */}
                            <div
                                className="absolute inset-0 bg-black bg-opacity-40"
                                onClick={() => setSelectedTrx(null)}
                            ></div>

                            {/* Modal panel */}
                            <div className={`relative w-full max-w-md bg-gray-300 shadow-slate-200 shadow-md transform transition-transform duration-300 ease-in-out translate-x-0 overflow-y-auto h-screen`}>
                                <div className="p-3 border-b font-semibold text-lg bg-white text-gray-700 flex justify-between items-center">
                                    DATA TRANSAKSI PENJUALAN
                                    <button onClick={() => setSelectedTrx(null)} className="text-gray-400 hover:text-red-500 text-2xl leading-none">
                                        &times;
                                    </button>
                                </div>
                                <div className="p-4 ">
                                    <div className="w-full overflow-hidden">
                                        <div className="flex">
                                            {Array.from({ length: 50 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="w-4 h-4 rotate-45 bg-white origin-bottom-left"
                                                    style={{ marginRight: '4px' }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-lg text-gray-700 bg-white font-medium">Baraja Coffee Indonesia</h3>
                                    </div>
                                    <div className="p-6 text-sm text-gray-700 space-y-2 bg-white">
                                        <p>ID Struk: {selectedTrx.order_id}</p>
                                        <p>Waktu: {formatDateTime(selectedTrx?.createdAt)}</p>
                                        <p>
                                            Outlet: Baraja Coffe Tentara Pelajar
                                            {/* {selectedTrx.outlet?.[0]?.name || 'No Outlet'} */}
                                        </p>
                                        {console.log(selectedTrx)}
                                        <p>Kasir: {selectedTrx.cashierId?.username || "-"}</p>
                                        <p>Pelanggan: {selectedTrx.user}</p>
                                        <p className="text-center text-lg font-medium">{selectedTrx.orderType}</p>
                                        <hr className="my-4 border-t-2 border-dashed border-gray-400 w-full" />
                                        <div className="grid grid-cols-3 text-sm">
                                            {selectedTrx.items?.map((item, index) => (
                                                <React.Fragment key={index}>
                                                    <div>{item.menuItem?.name || '-'}</div>
                                                    <div className="text-center">× {item.quantity}</div>
                                                    <div className="text-right">{formatCurrency(item.subtotal)}</div>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        <hr className="my-4 border-t-2 border-dashed border-gray-400 w-full" />
                                        <div className="">
                                            <div className="flex justify-between">
                                                <p>Total Subtotal</p>
                                                <p>{formatCurrency(totalSubtotal)}</p>
                                            </div>
                                            <div className="flex justify-between">
                                                <p>PB1 (10%)</p>
                                                <p>{formatCurrency(pb1)}</p>
                                            </div>
                                            <div className="flex justify-between">
                                                <strong>Total</strong>
                                                <p>{formatCurrency(finalTotal)}</p>
                                            </div>
                                        </div>
                                        <hr className="my-4 border-t-2 border-dashed border-gray-400 w-full" />
                                        <div className="">
                                            <div className="flex justify-between">
                                                <p>Tunai</p>
                                                <p>{formatCurrency(finalTotal)}</p>
                                            </div>
                                            <div className="flex justify-between">
                                                <p>Kembali</p>
                                                <p>{formatCurrency(0)}</p>
                                            </div>
                                        </div>
                                        <hr className="my-4 border-t-2 border-dashed border-gray-400 w-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {paginatedData.length > 0 && (
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-gray-600">
                            Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} dari {filteredData.length} data
                        </span>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sebelumnya
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Berikutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesTransaction;
