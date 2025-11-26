import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaChevronRight, FaSearch, FaPlus, FaTicketAlt, FaTimes, FaCalendarAlt } from "react-icons/fa";
import CreateVoucher from "./create";
import PromoTable from "./promotable";
import DatePicker from "react-tailwindcss-datepicker";

const Voucher = () => {
    const [vouchers, setVouchers] = useState([]);
    const [tempSearch, setTempSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("aktif");
    const [filteredData, setFilteredData] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [value, setValue] = useState({
        startDate: null,
        endDate: null
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const ensureArray = (data) => Array.isArray(data) ? data : [];

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    const fetchVouchers = async () => {
        try {
            setError(null);
            setLoading(true);
            const response = await axios.get("/api/promotion/vouchers");
            setVouchers(ensureArray(response.data || []));
            setFilteredData(ensureArray(response.data || []));
        } catch (error) {
            console.error("Error fetching vouchers:", error);
            setError(error.message || "Gagal memuat data voucher");
            setVouchers([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = useCallback(() => {
        let filtered = ensureArray([...vouchers]);

        // Filter by search term
        if (tempSearch && tempSearch.trim()) {
            const searchTerm = tempSearch.toLowerCase();
            filtered = filtered.filter(voucher => {
                try {
                    const name = (voucher.name || '').toLowerCase();
                    const code = (voucher.code || '').toLowerCase();
                    const description = (voucher.description || '').toLowerCase();

                    return name.includes(searchTerm) ||
                        code.includes(searchTerm) ||
                        description.includes(searchTerm);
                } catch (err) {
                    console.error("Error filtering by search:", err);
                    return false;
                }
            });
        }

        // Filter by date range
        if (value?.startDate && value?.endDate) {
            filtered = filtered.filter(voucher => {
                try {
                    if (!voucher.createdAt) {
                        return false;
                    }

                    const voucherDate = new Date(voucher.createdAt);
                    const startDate = new Date(value.startDate);
                    const endDate = new Date(value.endDate);

                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(23, 59, 59, 999);

                    if (isNaN(voucherDate.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                        return false;
                    }

                    return voucherDate >= startDate && voucherDate <= endDate;
                } catch (err) {
                    console.error("Error filtering by date:", err);
                    return false;
                }
            });
        }

        // Apply active status filter based on current tab
        if (activeTab === "aktif") {
            filtered = filtered.filter(voucher => voucher.isActive === true);
        } else if (activeTab === "tidak-berlaku") {
            filtered = filtered.filter(voucher => voucher.isActive === false);
        }

        setFilteredData(filtered);
        setCurrentPage(1);
    }, [vouchers, tempSearch, value, activeTab]);

    useEffect(() => {
        fetchVouchers();
    }, []);

    useEffect(() => {
        applyFilter();
    }, [applyFilter]);

    const clearFilters = () => {
        setTempSearch("");
        setValue({ startDate: null, endDate: null });
    };

    const activeFilterCount = () => {
        let count = 0;
        if (tempSearch) count++;
        if (value.startDate && value.endDate) count++;
        return count;
    };

    // Calculate statistics
    const totalAktif = vouchers.filter(v => v.isActive === true).length;
    const totalTidakAktif = vouchers.filter(v => v.isActive === false).length;

    // Show loading state
    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-[#005429] border-b-[#005429] border-l-transparent border-r-transparent"></div>
                <p className="mt-4 text-gray-600 text-sm">Memuat data voucher...</p>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className="text-xl font-semibold mb-2 text-gray-900">Terjadi Kesalahan</p>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-[#005429] hover:bg-[#007038] text-white px-6 py-2.5 rounded-lg font-medium transition-all"
                        >
                            Muat Ulang
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className=" bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header with Breadcrumb */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Breadcrumb */}
                        <div className="flex items-center space-x-2 text-sm">
                            <Link to="/admin/promotion" className="text-gray-600 hover:text-[#005429] transition font-medium">
                                Promo
                            </Link>
                            <FaChevronRight size={10} className="text-gray-400" />
                            <span className="text-[#005429] font-semibold">Voucher</span>
                        </div>

                        {/* Add Button */}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#005429] to-[#007038] hover:shadow-lg text-white px-6 py-2.5 rounded-lg font-semibold transition-all transform hover:scale-105"
                        >
                            <FaPlus className="text-sm" />
                            Tambah Voucher
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Title & Stats */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Manajemen Voucher</h1>
                    <p className="text-gray-600">
                        Kelola kode voucher untuk memberikan diskon spesial kepada pelanggan
                    </p>
                    <div className="flex flex-wrap gap-4 mt-4">
                        <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                            <p className="text-sm text-gray-600">Total Voucher</p>
                            <p className="text-2xl font-bold text-gray-900">{vouchers.length}</p>
                        </div>
                        <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                            <p className="text-sm text-gray-600">Voucher Aktif</p>
                            <p className="text-2xl font-bold text-green-600">{totalAktif}</p>
                        </div>
                        <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                            <p className="text-sm text-gray-600">Tidak Berlaku</p>
                            <p className="text-2xl font-bold text-gray-600">{totalTidakAktif}</p>
                        </div>
                        <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                            <p className="text-sm text-gray-600">Hasil Filter</p>
                            <p className="text-2xl font-bold text-blue-600">{filteredData.length}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        <button
                            className={`relative flex-1 py-4 px-6 text-sm font-semibold transition-colors ${activeTab === "aktif"
                                ? "text-[#005429] bg-green-50"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                }`}
                            onClick={() => handleTabChange("aktif")}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <FaTicketAlt />
                                <span>Voucher Aktif</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "aktif"
                                    ? "bg-[#005429] text-white"
                                    : "bg-gray-200 text-gray-600"
                                    }`}>
                                    {totalAktif}
                                </span>
                            </div>
                            {activeTab === "aktif" && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#005429]" />
                            )}
                        </button>

                        <button
                            className={`relative flex-1 py-4 px-6 text-sm font-semibold transition-colors ${activeTab === "tidak-berlaku"
                                ? "text-[#005429] bg-green-50"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                }`}
                            onClick={() => handleTabChange("tidak-berlaku")}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <FaTicketAlt />
                                <span>Tidak Berlaku</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "tidak-berlaku"
                                    ? "bg-[#005429] text-white"
                                    : "bg-gray-200 text-gray-600"
                                    }`}>
                                    {totalTidakAktif}
                                </span>
                            </div>
                            {activeTab === "tidak-berlaku" && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#005429]" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Search & Filter Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search Bar */}
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <FaSearch className="inline mr-1.5 text-[#005429]" />
                                    Cari Voucher
                                </label>
                                <div className="relative">
                                    <FaSearch className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Cari berdasarkan nama, kode, atau deskripsi..."
                                        value={tempSearch}
                                        onChange={(e) => setTempSearch(e.target.value)}
                                        className="w-full text-sm border border-gray-300 focus:border-[#005429] focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 py-2.5 pl-11 pr-4 rounded-lg transition-all"
                                    />
                                    {tempSearch && (
                                        <button
                                            onClick={() => setTempSearch("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <FaTimes />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Date Filter */}
                            <div className="md:w-80">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <FaCalendarAlt className="inline mr-1.5 text-[#005429]" />
                                    Filter Tanggal
                                </label>
                                <DatePicker
                                    showFooter
                                    showShortcuts
                                    value={value}
                                    onChange={setValue}
                                    displayFormat="DD/MM/YYYY"
                                    placeholder="Pilih rentang tanggal"
                                    inputClassName="w-full text-sm border border-gray-300 focus:border-[#005429] focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 py-2.5 px-4 rounded-lg transition-all"
                                    popoverDirection="down"
                                />
                            </div>
                        </div>

                        {/* Active Filters Badge */}
                        {activeFilterCount() > 0 && (
                            <div className="mt-4 flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                    {activeFilterCount()} filter aktif
                                </span>
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                                >
                                    <FaTimes size={12} />
                                    Hapus Semua Filter
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {filteredData.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaTicketAlt className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak Ada Data</h3>
                            <p className="text-gray-600 mb-6">
                                {activeFilterCount() > 0
                                    ? "Tidak ada voucher yang sesuai dengan filter Anda."
                                    : "Belum ada voucher yang dibuat."}
                            </p>
                            {activeFilterCount() === 0 && (
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="inline-flex items-center gap-2 bg-[#005429] hover:bg-[#007038] text-white px-6 py-2.5 rounded-lg font-medium transition-all"
                                >
                                    <FaPlus />
                                    Tambah Voucher Pertama
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="p-4">
                            <PromoTable
                                vouchers={filteredData}
                                fetchVouchers={fetchVouchers}
                                currentPage={currentPage}
                                setCurrentPage={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <CreateVoucher
                    onClose={() => setIsModalOpen(false)}
                    fetchVouchers={fetchVouchers}
                />
            )}
        </div>
    );
};

export default Voucher;