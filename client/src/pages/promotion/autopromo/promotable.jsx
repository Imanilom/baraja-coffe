import axios from "axios";
import React, { useState } from "react";
import { FaPencilAlt, FaTrash } from "react-icons/fa";
import ConfirmationModal from "./confirmmodal";
import ConfirmationModalActive from "../confirmationModalActive";
import UpdateAutoPromo from "./update";

const PromoTable = ({ filteredPromos, refreshPromos }) => {
    const [selectedPromos, setSelectedPromos] = useState([]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedAutoPromo, setSelectedAutoPromo] = useState(null);
    const [newStatus, setNewStatus] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedPromo, setSelectedPromo] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const promosPerPage = 50;

    const formatTanggal = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
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
            refreshPromos();
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
            <div className="bg-white shadow rounded-lg overflow-x-auto">
                <table className="min-w-full text-sm text-gray-700">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                            <th className="px-6 py-3 text-left font-semibold w-3/12">Nama Promo</th>
                            <th className="px-6 py-3 text-left font-semibold w-3/12">Tanggal Berlaku</th>
                            <th className="px-6 py-3 text-left font-semibold w-2/12">Status</th>
                            <th className="px-6 py-3 text-left font-semibold w-2/12">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentPromos.length > 0 ? (
                            currentPromos.map((promo) => (
                                <tr key={promo._id} className="hover:bg-gray-50 transition-colors">
                                    {/* Nama Promo */}
                                    <td className="px-6 py-3 truncate">{promo.name}</td>

                                    {/* Tanggal */}
                                    <td className="px-6 py-3 truncate">
                                        {formatTanggal(promo.validFrom)} s/d {formatTanggal(promo.validTo)}
                                    </td>

                                    {/* Status Toggle */}
                                    <td className="px-6 py-3">
                                        <span
                                            onClick={() => {
                                                setSelectedAutoPromo(promo);
                                                setNewStatus(!promo.isActive);
                                                setIsConfirmOpen(true);
                                            }}
                                            className={`px-2 py-1 text-xs rounded-full cursor-pointer ${promo.isActive
                                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                                }`}
                                        >
                                            {promo.isActive ? "Aktif" : "Tidak Aktif"}
                                        </span>
                                    </td>

                                    {/* Aksi */}
                                    <td className="px-6 py-3">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedPromo(promo);
                                                    setIsUpdateModalOpen(true);
                                                }}
                                                className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            >
                                                <FaPencilAlt size={14} />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setItemToDelete(promo._id);
                                                    setIsModalOpen(true);
                                                }}
                                                className="flex items-center gap-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <FaTrash size={14} />
                                                <span>Hapus</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-gray-500 text-sm">
                                    Tidak ada promo ditemukan
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                    >
                        Sebelumnya
                    </button>

                    <span>
                        Menampilkan {indexOfFirst + 1}–{Math.min(indexOfLast, filteredPromos.length)} dari {filteredPromos.length} data
                    </span>

                    <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                    >
                        Berikutnya
                    </button>
                </div>
            )}

            {/* Modal Hapus */}
            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => handleDelete(itemToDelete)}
            />

            {/* Modal Toggle Aktif */}
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

            {/* Modal Update */}
            <UpdateAutoPromo
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                onSuccess={() => {
                    refreshPromos();
                    setIsUpdateModalOpen(false);
                }}
                promoData={selectedPromo}
            />
        </div>
    );
};

export default PromoTable;