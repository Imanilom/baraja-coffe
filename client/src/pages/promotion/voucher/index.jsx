import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { FaCut, FaBell, FaUser, FaChevronRight } from "react-icons/fa";
import CreateVoucher from "./create";
import PromoTable from "./promotable";
import DatePicker from "react-tailwindcss-datepicker";
import Header from "../../admin/header";

const Voucher = () => {
    const [vouchers, setVouchers] = useState([]);
    const [notification, setNotification] = useState("");
    const [tempSearch, setTempSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("aktif");
    const [filters, setFilters] = useState({
        date: {
            startDate: null,
            endDate: null,
        },
    });

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch daftar voucher
    const fetchVouchers = async () => {
        try {
            setError(null);
            const response = await axios.get("/api/promotion/vouchers");
            // setVouchers(response.data?.data || []);
            setVouchers(response.data || []);
        } catch (error) {
            console.error("Error fetching vouchers:", error);
        } finally {
            setLoading(false);
        }
    };

    // Hapus voucher
    const deleteVoucher = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this voucher?");
        if (!confirmDelete) return;

        try {
            await axios.delete(`/api/vouchers/${id}`);
            fetchVouchers();
        } catch (error) {
            console.error("Error deleting voucher:", error);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, []);


    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleDateRangeChange = (value) => {
        setFilters((prev) => ({
            ...prev,
            date: value, // { startDate, endDate }
        }));
    };

    // Filter berdasarkan isActive
    const voucherAktif = vouchers.filter(voucher => voucher.isActive === true);
    const voucherTidakAktif = vouchers.filter(voucher => voucher.isActive === false);
    const totalAktif = vouchers.filter(voucher => voucher.isActive === true).length;
    const totalTidakAktif = vouchers.filter(voucher => voucher.isActive === false).length;
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
            {/* Header */}
            <Header />

            {/* Breadcrumb */}
            <div className="px-3 py-3 flex justify-between items-center border-b">
                <div className="flex items-center space-x-2">
                    <FaCut size={21} className="text-gray-500 inline-block" />
                    <Link to="/admin/promotion" className="text-[15px] text-gray-500">Promo</Link>
                    <FaChevronRight className="text-[15px] text-gray-500" />
                    <Link to="/admin/voucher" className="text-[15px] text-gray-500">Voucher</Link>
                </div>
            </div>

            <div className="px-[15px] pt-[15px]">
                <div className="flex justify-between items-center py-[10px] px-[15px]">
                    <h3 className="text-gray-500 font-semibold">{totalVoucher} Voucher</h3>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                    >
                        Tambah
                    </button>

                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 py-4">

                <button
                    className={`bg-white border-b-2 py-2 hover:border-b-[#005429] ${activeTab === "aktif" ? "border-b-[#005429]" : "border-b-white"
                        }`}
                    onClick={() => handleTabChange("aktif")}
                >
                    <div className="flex justify-between items-center border-l border-l-gray-200 p-4">
                        <div className="flex space-x-4">
                            <h2 className="text-gray-400 ml-2 text-sm">Aktif</h2>
                        </div>
                        <div className="text-sm text-gray-400">({totalAktif})</div>
                    </div>
                </button>

                <button
                    className={`bg-white border-b-2 py-2 hover:border-b-[#005429] ${activeTab === "tidak-berlaku" ? "border-b-[#005429]" : "border-b-white"
                        }`}
                    onClick={() => handleTabChange("tidak-berlaku")}
                >
                    <div className="flex justify-between items-center border-l border-l-gray-200 p-4">
                        <div className="flex space-x-4">
                            <h2 className="text-gray-400 ml-2 text-sm">Tidak Berlaku</h2>
                        </div>
                        <div className="text-sm text-gray-400">({totalTidakAktif})</div>
                    </div>
                </button>
            </div>

            <div className="pb-[15px]">
                <div className="mx-[15px] my-[13px] py-[10px] px-[15px] grid grid-cols-1 md:grid-cols-2 gap-[10px] items-end rounded bg-slate-50 shadow-slate-200 shadow-md">
                    <div className="relative">
                        <label className="text-[13px] mb-1 text-gray-500">Tanggal :</label>
                        <DatePicker
                            showFooter
                            showShortcuts
                            value={filters.date}
                            onChange={handleDateRangeChange}
                            displayFormat="DD-MM-YYYY"
                            inputClassName="w-full text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded cursor-pointer"
                            popoverDirection="down"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[13px] mb-1 text-gray-500">Cari</label>
                        <input
                            type="text"
                            placeholder=""
                            value={tempSearch}
                            onChange={(e) => setTempSearch(e.target.value)}
                            className="text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded"
                        />
                    </div>
                </div>
                <div className="mt-6">
                    {activeTab === "aktif" && (
                        <div className="py-[10px] px-[15px]">
                            <PromoTable vouchers={voucherAktif} fetchVouchers={fetchVouchers} />
                        </div>
                    )}
                    {activeTab === "tidak-berlaku" && (
                        <div className="py-[10px] px-[15px]">
                            <PromoTable vouchers={voucherTidakAktif} fetchVouchers={fetchVouchers} />
                        </div>
                    )}
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
