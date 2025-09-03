import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaPencilAlt, FaTrash, FaTrashAlt } from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import ConfirmationModal from "./confirmmodalDelete";
import UpdateVoucher from "./update";
import ConfirmationModalActive from "../confirmationModalActive";

const PromoTable = ({ vouchers, fetchVouchers, refreshPromos }) => {
    const { id } = useParams();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [newStatus, setNewStatus] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalUpdate, setIsModalUpdate] = useState(false);
    const [voucherToUpdate, setVoucherToUpdate] = useState([]);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const promosPerPage = 50;

    const fetchUpdateVoucher = async (voucher) => {
        try {
            const response = await axios.get(`/api/promotion/vouchers/${voucher._id}`);
            setVoucherToUpdate(response.data || {});
        } catch (error) {
            console.error("Error fetching voucher:", error);
        }
    };

    const handleToggleActive = async (id, newStatus) => {
        try {
            await axios.put(`/api/promotion/vouchers/${id}`, { isActive: newStatus });
            fetchVouchers(); // refresh data setelah update
        } catch (error) {
            console.error("Gagal update status voucher", error);
        }
    };


    useEffect(() => {
        if (id) {
            fetchUpdateVoucher(id); // ✅ langsung kirim string id
        }
    }, [id]);


    const formatTanggal = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0"); // bulan dimulai dari 0
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const formatJam = (dateString) => {
        const date = new Date(dateString);
        const hour = String(date.getHours()).padStart(2, "0");
        const minute = String(date.getMinutes()).padStart(2, "0");
        const second = String(date.getSeconds()).padStart(2, "0");
        return `${hour}:${minute}:${second}`;
    };

    // Hitung data untuk halaman saat ini
    const indexOfLast = currentPage * promosPerPage;
    const indexOfFirst = indexOfLast - promosPerPage;
    const currentVoucher = vouchers.slice(indexOfFirst, indexOfLast);

    const totalPages = Math.ceil(vouchers.length / promosPerPage);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleDelete = async (promoId) => {
        try {
            await axios.delete(`/api/promotion/autopromos/${promoId}`);
            setIsModalOpen(false);
            refreshPromos();
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    };

    return (
        <div className="w-full mx-auto">
            <table className="min-w-full text-[14px] text-[#999999] bg-white shadow-md text-sm">
                <thead className="border-b">
                    <tr>
                        {/* <th className="px-4 py-3">
                            <input type="checkbox" checked={isAllSelected} onChange={toggleAll} />
                        </th> */}
                        <th className="px-4 py-3 text-left">Nama Voucher</th>
                        <th className="px-4 py-3 text-right">Kuota</th>
                        <th className="px-4 py-3 text-right">Nilai</th>
                        <th className="px-4 py-3 text-left">Tanggal Berlaku</th>
                    </tr>
                </thead>
                <tbody>
                    {currentVoucher.map((voucher) => (
                        <tr key={voucher._id} className="">
                            <td className="px-4 py-3 truncate">{voucher.name}</td>
                            <td className="px-4 py-3 text-right">
                                {voucher.quota}
                            </td>
                            <td className="px-4 py-3 text-right">
                                {voucher.discountType === "percentage"
                                    ? `${voucher.discountAmount}%`
                                    : `${formatCurrency(voucher.discountAmount)}`}

                            </td>
                            <td className="px-4 py-3 text-left truncate">
                                {formatTanggal(voucher.validFrom)} s/d {formatTanggal(voucher.validTo)}
                            </td>
                            <td className="px-4 py-3 flex justify-end items-center space-x-2 truncate">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={voucher.isActive}
                                        onChange={() => {
                                            setSelectedVoucher(voucher);
                                            setNewStatus(!voucher.isActive);
                                            setIsConfirmOpen(true);
                                        }}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-300 peer-checked:bg-green-500 rounded-full transition-colors"></div>
                                    <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-700">
                                        {voucher.isActive ? "Aktif" : "Tidak Aktif"}
                                    </span>
                                </label>


                                {/* Edit button */}
                                {/* <button
                                    onClick={() => {
                                        fetchUpdateVoucher(voucher);
                                        setIsModalUpdate(true);
                                    }}
                                    aria-label="Edit Voucher"
                                    className="flex items-center px-3 py-1 text-xs text-white bg-blue-500 hover:bg-blue-600 rounded-md shadow-sm transition"
                                >
                                    <FaPencilAlt className="mr-1" /> Edit
                                </button> */}

                                {/* Delete button */}
                                {/* <button
                                    onClick={() => handleDelete(voucher._id)}
                                    aria-label="Delete Voucher"
                                    className="flex items-center px-3 py-1 text-xs text-white bg-red-500 hover:bg-red-600 rounded-md shadow-sm transition"
                                >
                                    <FaTrashAlt className="mr-1" /> Hapus
                                </button> */}
                            </td>

                        </tr>
                    ))}
                    {vouchers.length === 0 && (
                        <tr>
                            <td colSpan="5" className="text-center py-6 text-gray-500">
                                Tidak ada promo ditemukan.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Paginate */}
            {totalPages > 0 && (
                <div className="flex justify-between items-center mt-4 px-2 text-sm text-gray-700">
                    <span>
                        Menampilkan {indexOfFirst + 1}–{Math.min(indexOfLast, vouchers.length)} dari {vouchers.length} data
                    </span>
                    {totalPages > 1 && (
                        <div className="space-x-2">
                            <button
                                className="px-3 py-1 border rounded disabled:opacity-50"
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Sebelumnya
                            </button>
                            <button
                                className="px-3 py-1 border rounded disabled:opacity-50"
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Berikutnya
                            </button>
                        </div>
                    )}
                </div>
            )}

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => handleDelete(itemToDelete)}
            />

            <UpdateVoucher
                isOpen={isModalUpdate}
                onClose={() => setIsModalUpdate(false)}
                fetchVouchers={fetchVouchers}
                voucherData={voucherToUpdate}  // ✅ sekarang data voucher dikirim
            />

            <ConfirmationModalActive
                isOpen={isConfirmOpen}
                voucher={selectedVoucher}
                newStatus={newStatus}
                onClose={() => {
                    setIsConfirmOpen(false);
                    setSelectedVoucher(null);
                    setNewStatus(null);
                }}
                onConfirm={async () => {
                    await handleToggleActive(selectedVoucher._id, newStatus);
                    setIsConfirmOpen(false);
                    setSelectedVoucher(null);
                    setNewStatus(null);
                }}
            />

        </div>
    );
};

export default PromoTable;
