import axios from "axios";
import React, { useState } from "react";
import { FaPencilAlt, FaTrash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import ConfirmationModal from "./confirmmodal";
import ConfirmationModalActive from "../confirmationModalActive";

const PromoTable = ({ filteredPromos, refreshPromos }) => {
    const [selectedPromos, setSelectedPromos] = useState([]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedAutoPromo, setSelectedAutoPromo] = useState(null);
    const [newStatus, setNewStatus] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [openDropdown, setOpenDropdown] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const promosPerPage = 50;

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

    const handleToggleActive = async (id, newStatus) => {
        try {
            await axios.put(`/api/promotion/autopromos/${id}`, { isActive: newStatus });
            refreshPromos(); // refresh data setelah update
        } catch (error) {
            console.error("Gagal update status voucher", error);
        }
    };

    // Hitung data untuk halaman saat ini
    const indexOfLast = currentPage * promosPerPage;
    const indexOfFirst = indexOfLast - promosPerPage;
    const currentPromos = filteredPromos.slice(indexOfFirst, indexOfLast);

    const totalPages = Math.ceil(filteredPromos.length / promosPerPage);

    const isAllSelected =
        currentPromos.length > 0 &&
        currentPromos.every((p) => selectedPromos.includes(p._id));

    const togglePromo = (id) => {
        setSelectedPromos((prev) =>
            prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (isAllSelected) {
            setSelectedPromos((prev) =>
                prev.filter((id) => !currentPromos.map((p) => p._id).includes(id))
            );
        } else {
            setSelectedPromos((prev) => [
                ...prev,
                ...currentPromos
                    .map((p) => p._id)
                    .filter((id) => !prev.includes(id)),
            ]);
        }
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
            <div className="w-full overflow-x-auto">
                <table className="min-w-full text-[14px] text-[#555] bg-white shadow-md text-sm">
                    <thead className="border-b bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left w-[25%]">Nama Promo</th>
                            <th className="px-4 py-3 text-left w-[20%]">Tanggal Berlaku</th>
                            <th className="px-4 py-3 w-[10%]"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentPromos.map((promo) => (
                            <tr key={promo._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 truncate w-[25%]">{promo.name}</td>
                                <td className="px-4 py-3 truncate w-[20%]">
                                    {formatTanggal(promo.validFrom)} s/d {formatTanggal(promo.validTo)}
                                </td>
                                <td className="px-4 py-3 text-right w-[10%] truncate">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={promo.isActive}
                                            onChange={() => {
                                                setSelectedAutoPromo(promo);
                                                setNewStatus(!promo.isActive);
                                                setIsConfirmOpen(true);
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-300 peer-checked:bg-green-500 rounded-full transition-colors"></div>
                                        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                                        <span className="ml-3 text-sm font-medium text-gray-700">
                                            {promo.isActive ? "Aktif" : "Tidak Aktif"}
                                        </span>
                                    </label>
                                    {/* <div className="relative inline-block">
                                        <Link
                                            to={`/admin/promo-otomatis-update/${promo._id}`}
                                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100"
                                        >
                                            <FaPencilAlt />
                                            <span>Edit</span>
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setItemToDelete(promo._id);
                                                setIsModalOpen(true);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100"
                                        >
                                            <FaTrash />
                                            <span>Hapus</span>
                                        </button>
                                    </div> */}
                                </td>
                            </tr>
                        ))}
                        {filteredPromos.length === 0 && (
                            <tr>
                                <td colSpan="5" className="text-center py-6 text-gray-500">
                                    Tidak ada promo ditemukan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginate */}
            {totalPages > 0 && (
                <div className="flex justify-between items-center mt-4 px-2 text-sm text-gray-700">
                    <span>
                        Menampilkan {indexOfFirst + 1}–{Math.min(indexOfLast, filteredPromos.length)} dari {filteredPromos.length} data
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

            <ConfirmationModalActive
                isOpen={isConfirmOpen}
                voucher={selectedAutoPromo}
                newStatus={newStatus}
                onClose={() => {
                    setIsConfirmOpen(false);
                    setSelectedAutoPromo(null);
                    setNewStatus(null);
                }}
                onConfirm={async () => {
                    await handleToggleActive(selectedAutoPromo._id, newStatus);
                    setIsConfirmOpen(false);
                    setSelectedAutoPromo(null);
                    setNewStatus(null);
                }}
            />
        </div>
    );
};

export default PromoTable;
