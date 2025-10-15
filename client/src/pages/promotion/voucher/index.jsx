import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaChevronRight, FaSearch } from "react-icons/fa";
import CreateVoucher from "./create";
import PromoTable from "./promotable";
import DatePicker from "react-tailwindcss-datepicker";
import dayjs from "dayjs";

const Voucher = () => {
    const [vouchers, setVouchers] = useState([]);
    const [notification, setNotification] = useState("");
    const [tempSearch, setTempSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("aktif");
    const [filteredData, setFilteredData] = useState([]);
    const [value, setValue] = useState({
        startDate: null,
        endDate: null
        // startDate: dayjs().toDate(),
        // endDate: dayjs().toDate()
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const ensureArray = (data) => Array.isArray(data) ? data : [];

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1); // Reset pagination when changing tabs
    };

    // Fetch daftar voucher
    const fetchVouchers = async () => {
        try {
            setError(null);
            setLoading(true);
            const response = await axios.get("/api/promotion/vouchers");
            setVouchers(ensureArray(response.data || []));
            setFilteredData(ensureArray(response.data || []));
        } catch (error) {
            console.error("Error fetching vouchers:", error);
            setError(error.message || "Failed to fetch vouchers");
            setVouchers([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    };

    // Apply filter function
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

                    // Set time to beginning/end of day for proper comparison
                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(23, 59, 59, 999);

                    // Check if dates are valid
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

    // Initial load
    useEffect(() => {
        fetchVouchers();
    }, []);

    // Auto-apply filter whenever dependencies change
    useEffect(() => {
        applyFilter();
    }, [applyFilter]);

    // Calculate statistics
    const totalAktif = vouchers.filter(v => v.isActive === true).length;
    const totalTidakAktif = vouchers.filter(v => v.isActive === false).length;
    const totalVoucher = vouchers.length;

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
        <div className="w-full">
            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <div className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <Link to="/admin/promotion">Promo</Link>
                    <FaChevronRight />
                    <span>Voucher</span>
                </div>
            </div>

            <div className="flex px-6 justify-between">
                <div className="">
                    <button
                        className={`relative py-2 px-6 text-sm font-medium transition-colors ${activeTab === "aktif"
                            ? "text-[#005429]"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                        onClick={() => handleTabChange("aktif")}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span>Aktif</span>
                            <span className={`${activeTab === "aktif" ? "text-[#005429]" : "text-gray-400"}`}>
                                ({totalAktif})
                            </span>
                        </div>
                        {activeTab === "aktif" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#005429]" />
                        )}
                    </button>

                    <button
                        className={`relative py-2 px-6 text-sm font-medium transition-colors ${activeTab === "tidak-berlaku"
                            ? "text-[#005429]"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                        onClick={() => handleTabChange("tidak-berlaku")}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span>Tidak Berlaku</span>
                            <span className={`${activeTab === "tidak-berlaku" ? "text-[#005429]" : "text-gray-400"}`}>
                                ({totalTidakAktif})
                            </span>
                        </div>
                        {activeTab === "tidak-berlaku" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#005429]" />
                        )}
                    </button>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                >
                    Tambah
                </button>
            </div>

            <div className="">
                <div className="flex flex-wrap gap-4 md:justify-end items-center px-6 py-3">
                    {/* <div className="flex flex-col md:w-2/5 w-full">
                        <DatePicker
                            showFooter
                            showShortcuts
                            value={value}
                            onChange={setValue}
                            displayFormat="DD-MM-YYYY"
                            inputClassName="w-full text-[13px] border py-2 pr-[25px] pl-[12px] rounded cursor-pointer"
                            popoverDirection="down"
                        />
                    </div> */}
                    <div className="flex flex-col">
                        <div className="relative md:w-64 w-full">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari ..."
                                value={tempSearch}
                                onChange={(e) => setTempSearch(e.target.value)}
                                className="pl-9 pr-3 py-2 w-full border rounded-md text-sm focus:ring-1 focus:ring-green-900 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
                <div className="px-6">
                    <PromoTable
                        vouchers={filteredData}
                        fetchVouchers={fetchVouchers}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                    />
                </div>
            </div>
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