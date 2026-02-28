import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
    FaSearch,
    FaPencilAlt,
    FaUsers,
    FaTrophy,
    FaUserPlus,
    FaFileExport,
    FaEllipsisV,
    FaEnvelope,
    FaPhone,
    FaUser,
    FaStickyNote,
    FaStar,
    FaToggleOn,
    FaToggleOff
} from "react-icons/fa";
import * as XLSX from "xlsx";

const CustomerManagement = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [customer, setCustomer] = useState([]);
    const [orders, setOrders] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tempSearch, setTempSearch] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const dropdownRef = useRef(null);

    // Fetch customer and order data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch customers
                const customerResponse = await axios.get(`/api/user/staff`);
                const customers = customerResponse.data.filter(
                    (user) => user.role?.name === "customer"
                );

                // Fetch orders
                const orderResponse = await axios.get(`/api/orders`);
                const ordersData = orderResponse.data.data ? orderResponse.data.data : orderResponse.data;

                setCustomer(customers);
                setOrders(ordersData);
                setFilteredData(customers);
                setError(null);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Gagal memuat data. Silakan coba lagi.");
                setCustomer([]);
                setOrders([]);
                setFilteredData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Calculate order count for each customer
    const getCustomerOrderCount = (customerId, customerUsername) => {
        return orders.filter(order => {
            // Handle both cases:
            // 1. order.user is ObjectId string: "507f1f77bcf86cd799439011"
            // 2. order.user is username string: "ahmad"
            const userId = typeof order.user === 'string' ? order.user : order.user?._id;

            // Check if user matches by ID or username
            return userId === customerId || userId === customerUsername;
        }).length;
    };

    // Get most loyal customer
    const getMostLoyalCustomer = () => {
        if (customer.length === 0) return null;

        let maxOrders = 0;
        let loyalCustomer = null;

        customer.forEach(cust => {
            const orderCount = getCustomerOrderCount(cust._id, cust.username);
            if (orderCount > maxOrders) {
                maxOrders = orderCount;
                loyalCustomer = cust;
            }
        });

        return { customer: loyalCustomer, orderCount: maxOrders };
    };

    // Check if customer was created today
    const isCreatedToday = (createdAt) => {
        const today = new Date();
        const createdDate = new Date(createdAt);

        return (
            createdDate.getDate() === today.getDate() &&
            createdDate.getMonth() === today.getMonth() &&
            createdDate.getFullYear() === today.getFullYear()
        );
    };

    // Toggle active status
    const toggleActiveStatus = async (customerId, currentStatus) => {
        try {
            await axios.put(
                `/api/user/${customerId}`,
                { isActive: !currentStatus },
                {
                    headers: {
                        Authorization: `Bearer ${currentUser?.token}`
                    }
                }
            );

            // Update local state
            setCustomer(prevCustomers =>
                prevCustomers.map(cust =>
                    cust._id === customerId
                        ? { ...cust, isActive: !currentStatus }
                        : cust
                )
            );
            setOpenDropdown(null);
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Gagal mengubah status. Silakan coba lagi.");
        }
    };

    // Filter data based on search
    useEffect(() => {
        if (tempSearch.trim() === "") {
            setFilteredData(customer);
        } else {
            const filtered = customer.filter((item) =>
                item.username?.toLowerCase().includes(tempSearch.toLowerCase()) ||
                item.email?.toLowerCase().includes(tempSearch.toLowerCase()) ||
                item.phone?.toLowerCase().includes(tempSearch.toLowerCase())
            );
            setFilteredData(filtered);
        }
        setCurrentPage(1);
    }, [tempSearch, customer]);

    // Handle click outside dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Export to Excel
    const exportToExcel = () => {
        const dataToExport = filteredData.map(customer => ({
            "Nama": customer.username || "-",
            "Telepon": customer.phone || "-",
            "Email": customer.email || "-",
            "Tipe Pelanggan": customer.consumerType || "-",
            "Total Order": getCustomerOrderCount(customer._id, customer.username),
            "Catatan": customer.catatan || "-",
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Pelanggan");
        XLSX.writeFile(wb, "Data_Pelanggan.xlsx");
    };

    // Get statistics
    const totalCustomers = customer.length;
    const newCustomersThisMonth = customer.filter(c => {
        const date = new Date(c.createdAt);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    const loyalCustomerData = getMostLoyalCustomer();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Memuat data pelanggan...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200"
                    >
                        Muat Ulang
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-8">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <FaUsers className="text-green-600 text-xl" />
                                </div>
                                Manajemen Pelanggan
                            </h1>
                            <p className="text-gray-600 mt-1">Kelola dan pantau data pelanggan Anda</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={exportToExcel}
                                className="flex items-center gap-2 bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 font-medium px-5 py-2.5 rounded-lg transition-all duration-200"
                            >
                                <FaFileExport />
                                <span className="hidden sm:inline">Ekspor</span>
                            </button>
                            <Link
                                to="/admin/customer-create"
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-green-600/30"
                            >
                                <FaUserPlus />
                                <span className="hidden sm:inline">Tambah Pelanggan</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium mb-1">Total Pelanggan</p>
                                <h3 className="text-4xl font-bold">{totalCustomers}</h3>
                            </div>
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                <FaUsers className="text-3xl" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-amber-100 text-sm font-medium mb-1">Pelanggan Loyal</p>
                                {loyalCustomerData?.customer ? (
                                    <>
                                        <h3 className="text-2xl font-bold truncate">{loyalCustomerData.customer.username}</h3>
                                        <p className="text-amber-100 text-xs mt-1">{loyalCustomerData.orderCount} order</p>
                                    </>
                                ) : (
                                    <h3 className="text-xl font-bold">Belum ada data</h3>
                                )}
                            </div>
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                <FaTrophy className="text-3xl" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium mb-1">Pelanggan Baru</p>
                                <h3 className="text-4xl font-bold">{newCustomersThisMonth}</h3>
                                <p className="text-green-100 text-xs mt-1">Bulan ini</p>
                            </div>
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                <FaUserPlus className="text-3xl" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="relative max-w-md">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari nama, email, atau telepon..."
                            value={tempSearch}
                            onChange={(e) => setTempSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all duration-200"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <FaUser className="text-gray-400" />
                                            Nama
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <FaPhone className="text-gray-400" />
                                            Telepon
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <FaEnvelope className="text-gray-400" />
                                            Email
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Tipe
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Total Order
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <FaStickyNote className="text-gray-400" />
                                            Catatan
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            {paginatedData.length > 0 ? (
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedData.map((data) => {
                                        const orderCount = getCustomerOrderCount(data._id, data.username);
                                        const isNewToday = isCreatedToday(data.createdAt);

                                        return (
                                            <tr key={data._id} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold mr-3">
                                                            {data.username?.charAt(0).toUpperCase() || "?"}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-gray-900">{data.username || "-"}</span>
                                                                {isNewToday && (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 animate-pulse">
                                                                        <FaStar className="text-xs" />
                                                                        Baru Hari Ini
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                    {data.phone || "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                    {data.email || "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {data.consumerType || "Regular"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
                                                            {orderCount}
                                                        </span>
                                                        {orderCount >= 10 && (
                                                            <FaTrophy className="text-amber-500" title="Pelanggan Loyal" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${data.isActive !== false
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                        }`}>
                                                        {data.isActive !== false ? "Aktif" : "Tidak Aktif"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                                                    {data.catatan || "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="relative inline-block" ref={openDropdown === data._id ? dropdownRef : null}>
                                                        <button
                                                            onClick={() => setOpenDropdown(openDropdown === data._id ? null : data._id)}
                                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                                                        >
                                                            <FaEllipsisV className="text-gray-600" />
                                                        </button>
                                                        {openDropdown === data._id && (
                                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                                                                <Link
                                                                    to={`/admin/customer-update/${data._id}`}
                                                                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 rounded-t-lg"
                                                                >
                                                                    <FaPencilAlt className="text-blue-600" />
                                                                    <span>Edit</span>
                                                                </Link>
                                                                <button
                                                                    onClick={() => toggleActiveStatus(data._id, data.isActive)}
                                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 rounded-b-lg"
                                                                >
                                                                    {data.isActive !== false ? (
                                                                        <>
                                                                            <FaToggleOff className="text-red-600" />
                                                                            <span>Nonaktifkan</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <FaToggleOn className="text-green-600" />
                                                                            <span>Aktifkan</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            ) : (
                                <tbody>
                                    <tr>
                                        <td colSpan="8" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <FaUsers className="text-6xl mb-4" />
                                                <p className="text-lg font-medium">Tidak ada data pelanggan</p>
                                                <p className="text-sm mt-1">Coba ubah filter pencarian Anda</p>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            )}
                        </table>
                    </div>

                    {/* Pagination */}
                    {paginatedData.length > 0 && totalPages > 1 && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Menampilkan <span className="font-semibold">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> -
                                    <span className="font-semibold"> {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}</span> dari
                                    <span className="font-semibold"> {filteredData.length}</span> data
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        Sebelumnya
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={`w-10 h-10 rounded-lg font-medium transition-colors duration-200 ${currentPage === i + 1
                                                    ? "bg-green-600 text-white"
                                                    : "bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        Berikutnya
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerManagement;