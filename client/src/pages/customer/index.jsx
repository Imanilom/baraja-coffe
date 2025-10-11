import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSearch, FaIdBadge, FaThLarge, FaPencilAlt, FaTrash, FaUserFriends, FaFilter } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";


const CustomerManagement = () => {
    const [customer, setCustomer] = useState([]);
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
    const [openDropdown, setOpenDropdown] = useState([]);

    // Safety function to ensure we're always working with arrays
    const ensureArray = (data) => Array.isArray(data) ? data : [];
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const dropdownRef = useRef(null);

    // Calculate the total subtotal first
    const totalSubtotal = selectedTrx && selectedTrx.items ? selectedTrx.items.reduce((acc, item) => acc + item.subtotal, 0) : 0;

    // Calculate PB1 as 10% of the total subtotal
    const pb1 = 10000;

    // Calculate the final total
    const finalTotal = totalSubtotal + pb1;

    // Fetch customer and outlets data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const customerResponse = await axios.get(`/api/user/staff`);
                const customer = customerResponse.data.filter(
                    (user) => user.role?.name === "customer"
                );

                setCustomer(customer);
                setFilteredData(customer); // Initialize filtered data with all customer

                setError(null);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load data. Please try again later.");
                // Set empty arrays as fallback
                setCustomer([]);
                setFilteredData([]);
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
        <div className="pb-[60px]">
            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <span>Pelanggan</span>
                </h1>
                <div className="flex space-x-2">
                    {/* <button className="bg-white text-[#005429] border border-[#005429] hover:bg-[#005429] hover:text-white text-[13px] px-[15px] py-[7px] rounded">Impor</button> */}
                    <button className="bg-white text-[#005429] border border-[#005429] hover:bg-[#005429] hover:text-white text-[13px] px-[15px] py-[7px] rounded">Ekspor</button>
                    <Link to="/admin/customer-create" className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Tambah</Link>
                </div>
            </div>

            {/* Filters */}
            <div className="px-6">
                <div className="flex flex-wrap gap-4 md:justify-between items-center py-3">
                    <div className=""></div>
                    <div className="flex flex-col md:w-1/5">
                        <div className="relative">
                            <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Nama / Email"
                                value={tempSearch}
                                onChange={(e) => setTempSearch(e.target.value)}
                                className="text-[13px] border py-2 pl-[30px] pr-[25px] rounded w-full"
                            />
                        </div>
                    </div>
                </div>

                <div className="w-full border rounded mb-[15px] bg-gradient-to-r from-[#0F4F2A] via-[#1A6B3B] to-[#267C48] py-2">
                    <div className="flex justify-between p-4 text-[14px]">
                        <div className="">
                            <label htmlFor="" className="uppercase text-[#999999]">Total Pelanggan</label>
                            <h3 className="text-white font-semibold ">{customer.length}</h3>
                        </div>
                        <div className="">
                            <label htmlFor="" className="uppercase text-[#999999]">Pelanggan Paling Loyal</label>
                            <h3 className="text-white font-semibold underline decoration-dashed underline-offset-[5px]">staffdapur</h3>
                        </div>
                        <div className="">
                            <label htmlFor="" className="uppercase text-[#999999]">Pelanggan Baru Bulan Ini</label>
                            <h3 className="text-white font-semibold underline decoration-dashed underline-offset-[5px]">Belum ada Pelanggan</h3>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded shadow-slate-200 bg-white shadow-md">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal">Nama</th>
                                <th className="px-4 py-3 font-normal">Telepon</th>
                                <th className="px-4 py-3 font-normal">Email</th>
                                <th className="px-4 py-3 font-normal">Tipe Pelanggan</th>
                                <th className="px-4 py-3 font-normal">Catatan</th>
                                <th className="px-4 py-3 font-normal"></th>
                            </tr>
                        </thead>
                        {customer.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {customer.map((data, index) => {
                                    try {
                                        return (
                                            <tr className="text-left text-sm cursor-pointer hover:bg-slate-50" key={data._id}>
                                                <td className="px-4 py-3">
                                                    {data.username || "-"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {data.phone || "-"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {data.email || "-"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {data.consumerType || "-"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {data.catatan || "-"}
                                                </td>
                                                <td className="px-4 py-3">

                                                    {/* Dropdown Menu */}
                                                    <div className="relative text-right">
                                                        <button
                                                            className="px-2 bg-white border border-gray-200 hover:border-none hover:bg-green-800 rounded-sm"
                                                            onClick={() => setOpenDropdown(openDropdown === data._id ? null : data._id)}
                                                        >
                                                            <span className="text-xl text-gray-200 hover:text-white">
                                                                •••
                                                            </span>
                                                        </button>
                                                        {openDropdown === data._id && (
                                                            <div className="absolute text-left text-gray-500 right-0 top-full mt-2 bg-white border rounded-md shadow-md w-[240px] z-10">
                                                                <ul className="w-full">
                                                                    <li className="flex space-x-[18px] items-center px-[20px] py-[15px] text-sm cursor-pointer hover:bg-gray-100">
                                                                        <FaPencilAlt size={18} />
                                                                        <Link
                                                                            to={`/admin/menu-update/${data._id}`}
                                                                            className="block bg-transparent"
                                                                        >
                                                                            Edit
                                                                        </Link>
                                                                    </li>
                                                                    <li className="flex space-x-[18px] items-center px-[20px] py-[15px] text-sm cursor-pointer hover:bg-gray-100">
                                                                        <FaTrash size={18} />
                                                                        <button onClick={() => {
                                                                            setItemToDelete(data._id);
                                                                            setIsModalOpen(true);
                                                                        }}>
                                                                            Delete
                                                                        </button>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    } catch (err) {
                                        console.error(`Error rendering product ${index}:`, err, customer);
                                        return (
                                            <tr className="text-left text-sm" key={index}>
                                                <td colSpan="4" className="px-4 py-3 text-red-500">
                                                    Error rendering customer
                                                </td>
                                            </tr>
                                        );
                                    }
                                })}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr className="py-6 text-center w-full h-96">
                                    <td colSpan={4}>Tidak ada data ditemukan</td>
                                </tr>
                            </tbody>
                        )}
                    </table>
                </div>

                {/* Pagination Controls */}
                {/* {paginatedData.length > 0 && (
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-gray-600">
                            Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} dari {filteredData.length} data
                        </span>
                        {totalPages > 1 && (
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
                        )}
                    </div>
                )} */}
            </div>
        </div>
    );
};

export default CustomerManagement;
