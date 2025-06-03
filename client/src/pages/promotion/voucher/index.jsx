import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaCut, FaBell, FaUser, FaChevronRight } from "react-icons/fa";
import CreateVoucher from "./create";

const Voucher = () => {
    const [vouchers, setVouchers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isCreating, setIsCreating] = useState(false);
    const itemsPerPage = 50; // Jumlah voucher per halaman

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

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentVouchers = vouchers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(vouchers.length / itemsPerPage);

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
        <div className="max-w-8xl mx-auto">
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
                    <FaCut size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Promo</p>
                    <FaChevronRight className="text-[15px] text-gray-500" />
                    <Link to="/admin/voucher" className="text-[15px] text-gray-500">Voucher</Link>
                </div>
                <Link
                    to="/admin/voucher-create"
                    className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                >
                    Tambah Voucher
                </Link>
            </div>

            {/* Tombol untuk membuat voucher */}
            {/* <button
                onClick={() => setIsCreating(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
            >
                Add Voucher
            </button> */}

            {/* Komponen CreateVoucher */}
            {/* {isCreating && (
                <CreateVoucher
                    fetchVouchers={fetchVouchers}
                    onClose={() => setIsCreating(false)}
                />
            )} */}

            <div className="px-[15px] pb-[15px]">
                <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-11 gap-[10px] items-end rounded bg-slate-50 shadow-slate-200 shadow-md">

                </div>
                {/* Tabel daftar voucher */}
                <div className="overflow-x-auto shadow-slate-200 shadow-md">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400">
                            <tr className="text-[13px]">
                                <th className="px-4 py-3 font-normal text-left">Kode</th>
                                <th className="px-4 py-3 font-normal text-left">Deskripsi</th>
                                <th className="px-4 py-3 font-normal text-right">Diskon</th>
                                <th className="px-4 py-3 font-normal text-right">Min Order</th>
                                <th className="px-4 py-3 font-normal text-left">Tanggal Awal</th>
                                <th className="px-4 py-3 font-normal text-left">Tanggal Akhir</th>
                                <th className="px-4 py-3 font-normal text-right">Maks Klaim</th>
                                <th className="px-4 py-3 font-normal"></th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-400">
                            {currentVouchers.map((voucher) => (
                                <tr key={voucher._id}>
                                    <td className="px-4 py-3">{voucher.code}</td>
                                    <td className="px-4 py-3">{voucher.description}</td>
                                    <td className="px-4 py-3">${voucher.discountAmount}</td>
                                    <td className="px-4 py-3">${voucher.minimumOrder}</td>
                                    <td className="px-4 py-3">{voucher.startDate}</td>
                                    <td className="px-4 py-3">{voucher.endDate}</td>
                                    <td className="px-4 py-3">{voucher.maxClaims}</td>
                                    <td className="px-4 py-3">
                                        {/* <button className="bg-slate-50">
                                            <p>&copy;</p>
                                        </button> */}
                                        <button
                                            onClick={() => deleteVoucher(voucher._id)}
                                            className="bg-red-500 text-white px-4 py-2 rounded mr-2"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            className="bg-yellow-500 text-white px-4 py-2 rounded"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                    {/* <button
                                            onClick={() => deleteVoucher(voucher._id)}
                                            className="bg-red-500 text-white px-4 py-2 rounded mr-2"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            className="bg-yellow-500 text-white px-4 py-2 rounded"
                                        >
                                            Edit
                                        </button> */}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-center mt-4">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`px-4 py-2 mx-1 rounded ${currentPage === i + 1
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-700"
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Voucher;
