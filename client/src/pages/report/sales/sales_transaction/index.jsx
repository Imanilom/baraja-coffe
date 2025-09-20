import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Select from "react-select";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaChevronLeft } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import ExportFilter from "../export";
import Header from "../../../admin/header";
import { useReactToPrint } from "react-to-print";
import PdfButton from "../pdfButton";


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
    // const [value, setValue] = useState(null);
    const [value, setValue] = useState({
        startDate: dayjs(),
        endDate: dayjs()
    });
    const [tempSearch, setTempSearch] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Safety function to ensure we're always working with arrays
    const ensureArray = (data) => Array.isArray(data) ? data : [];
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const dropdownRef = useRef(null);
    const receiptRef = useRef();
    const handlePrint = useReactToPrint({
        content: () => receiptRef.current,
        documentTitle: `Resi_${selectedTrx?.order_id || "transaksi"}`
    });

    // Calculate the total subtotal first
    const totalSubtotal = selectedTrx && selectedTrx.items ? selectedTrx.items.reduce((acc, item) => acc + item.subtotal, 0) : 0;

    // Calculate PB1 as 10% of the total subtotal
    const pb1 = totalSubtotal * 0.10;

    // Calculate the final total
    const finalTotal = totalSubtotal + pb1;

    // Fetch products and outlets data
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/orders');
            const productsData = Array.isArray(response.data)
                ? response.data
                : response.data?.data ?? [];

            const completedData = productsData.filter(item => item.status === "Completed");

            setProducts(completedData); // simpan semua data mentah
            setError(null);
        } catch (err) {
            console.error("Error fetching products:", err);
            setError("Failed to load products.");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };


    const fetchOutlets = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/outlet');

            const outletsData = Array.isArray(response.data)
                ? response.data
                : (response.data && Array.isArray(response.data.data))
                    ? response.data.data
                    : [];

            setOutlets(outletsData);
            setError(null);
        } catch (err) {
            console.error("Error fetching outlets:", err);
            setError("Failed to load outlets. Please try again later.");
            setOutlets([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchOutlets();
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
        return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
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
                        const customer = (product.user || '').toLowerCase();
                        const receipt = (product.order_id || '').toLowerCase();

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
        setValue({
            startDate: dayjs(),
            endDate: dayjs(),
        });
        setSearch("");
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
            <Header />

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
                                <th className="px-4 py-3 font-normal">Tanggal</th>
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
                                        const orderId = product?.order_id || {};
                                        const date = product?.createdAt || {};
                                        const cashier = product?.cashierId || {};
                                        const orderType = product?.orderType || {};
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
                                                    {product.grandTotal.toLocaleString() || ""}
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

                            {/* Modal */}
                            <div className="relative w-full max-w-md bg-white shadow-lg transform transition-transform duration-300 ease-in-out h-screen flex flex-col overflow-hidden">
                                {/* Header */}
                                <div className="p-4 flex justify-between items-center font-semibold">
                                    <h2 className="text-lg font-semibold">Detail Transaksi</h2>
                                    <button
                                        onClick={() => setSelectedTrx(null)}
                                        className="text-xl font-bold hover:text-red-400"
                                    >
                                        &times;
                                    </button>
                                </div>

                                {/* Body */}
                                <div id="receipt-pdf" ref={receiptRef} className="flex-1 overflow-y-auto p-6 text-sm text-gray-700">
                                    {/* Brand */}
                                    <div className="text-center mb-6">
                                        <img
                                            src="/images/logo_resi.png"
                                            alt="Logo"
                                            className="mx-auto w-1/2"
                                        />
                                        <h2 className="mx-auto w-4/5 text-sm font-medium">{selectedTrx.cashierId?.outlet?.[0]?.outletId?.address}</h2>
                                    </div>
                                    <div className="text-sm">
                                    </div>

                                    {/* Info Transaksi */}
                                    <div className="space-y-1 text-sm mb-6">
                                        <div className="flex justify-between">
                                            <span className="font-medium">Kode Struk</span>
                                            <p>{selectedTrx.order_id}</p>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium">Tanggal</span>
                                            <p>{formatDateTime(selectedTrx?.createdAt)}</p>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium">Kasir</span>
                                            <p>{selectedTrx.cashierId?.username || "-"}</p>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium">Pelanggan</span>
                                            <p>{selectedTrx.user}</p>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium">No Meja</span>
                                            <p>{selectedTrx.tableNumber}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1 mb-6">
                                        <p className="text-center text-base font-semibold text-gray-800 mt-2">{selectedTrx.orderType}</p>
                                    </div>

                                    {/* Items */}
                                    <div className="border-t border-b border-dashed py-4 space-y-2">
                                        {selectedTrx.items?.map((item, index) => (
                                            <div key={index} className="flex justify-between text-sm">
                                                <div className="flex-1">{item.menuItem?.name || '-'}</div>
                                                <div className="w-12 text-center">× {item.quantity}</div>
                                                <div className="w-20 text-right">{formatCurrency(item.subtotal)}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Total Section */}
                                    <div className="my-2 space-y-2">
                                        <div className="flex justify-between">
                                            <span>Sub Total Harga</span>
                                            <span>{formatCurrency(selectedTrx.totalAfterDiscount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>{selectedTrx.taxAndServiceDetails?.[0]?.name}</span>
                                            <span>{formatCurrency(selectedTrx.taxAndServiceDetails?.[0]?.amount)}</span>
                                        </div>
                                        <div className="flex justify-between text-base font-bold text-green-700 border-t border-dashed pt-2">
                                            <span>Total Harga</span>
                                            <span>{formatCurrency(finalTotal)}</span>
                                        </div>
                                    </div>

                                    {/* Payment */}
                                    <div className="border-t border-dashed space-y-2">
                                        <div className="flex my-2 justify-between">
                                            <span>Tunai</span>
                                            <span>{formatCurrency(finalTotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Kembali</span>
                                            <span>{formatCurrency(0)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="p-4 border-t space-y-4 bg-gray-50">
                                    {/* <button
                                        onClick={() => handlePrint()}
                                        className="w-full bg-green-700 hover:bg-green-800 text-white text-sm font-medium py-2.5 rounded-lg shadow"
                                    >
                                        Cetak Resi
                                    </button> */}
                                    <PdfButton
                                        targetId="receipt-pdf"
                                        fileName={`Resi_${selectedTrx?.order_id || "transaksi"}.pdf`}
                                    />
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
                        <div className="flex items-center space-x-2 mt-4">
                            {/* Tombol Sebelumnya */}
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 border rounded disabled:opacity-50"
                            >
                                <FaChevronLeft />
                            </button>

                            {/* Tombol Angka */}
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

                            {/* Tombol Berikutnya */}
                            <button
                                onClick={() =>
                                    setCurrentPage(prev => Math.min(prev + 1, totalPages))
                                }
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 border rounded disabled:opacity-50"
                            >
                                <FaChevronRight />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesTransaction;
