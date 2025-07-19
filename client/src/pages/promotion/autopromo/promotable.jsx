import axios from "axios";
import React, { useState } from "react";
import { FaPencilAlt, FaTrash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import ConfirmationModal from "./confirmmodal";

const PromoTable = ({ filteredPromos, refreshPromos }) => {
    const [selectedPromos, setSelectedPromos] = useState([]);
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
            <table className="min-w-full text-[14px] text-[#999999] bg-white shadow-md text-sm">
                <thead className="border-b">
                    <tr>
                        <th className="px-4 py-3">
                            <input type="checkbox" checked={isAllSelected} onChange={toggleAll} />
                        </th>
                        <th className="px-4 py-3 text-left">Nama Promo</th>
                        <th className="px-4 py-3 text-left">Tanggal Berlaku</th>
                        <th className="px-4 py-3 text-left">Hari Berlaku</th>
                        <th className="px-4 py-3 text-left">Jam Berlaku</th>
                        <th className="px-4 py-3"></th>
                    </tr>
                </thead>
                <tbody>
                    {currentPromos.map((promo) => (
                        <tr key={promo._id} className="">
                            <td className="px-4 py-3 text-center">
                                <input
                                    type="checkbox"
                                    checked={selectedPromos.includes(promo._id)}
                                    onChange={() => togglePromo(promo._id)}
                                />
                            </td>
                            <td className="px-4 py-3">{promo.name}</td>
                            <td className="px-4 py-3 text-center">
                                {formatTanggal(promo.validFrom)} <br />
                                <p>s/d</p>
                                {formatTanggal(promo.validTo)}
                            </td>
                            <td className="px-4 py-3">
                                Setiap Hari
                            </td>
                            <td className="px-4 py-3 text-center">
                                {formatJam(promo.validFrom)}
                                <p>s/d</p>
                                {formatJam(promo.validTo)}
                            </td>
                            <td className="px-4 py-3 text-center">
                                <div className="relative text-right">
                                    <button
                                        className="px-2 bg-white border border-gray-200 hover:bg-green-800 rounded-sm"
                                        onClick={() =>
                                            setOpenDropdown(openDropdown === promo._id ? null : promo._id)
                                        }
                                    >
                                        <span className="text-xl text-gray-200 hover:text-white">•••</span>
                                    </button>
                                    {openDropdown === promo._id && (
                                        <div className="absolute right-0 top-full mt-2 bg-white border rounded-md shadow-md w-[200px] z-10">
                                            <ul>
                                                <Link
                                                    to={`/admin/promo-otomatis-update/${promo._id}`}
                                                    className="flex items-center space-x-3 px-4 py-4 hover:bg-gray-100"
                                                >
                                                    <FaPencilAlt />
                                                    <span>Edit</span>
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        setItemToDelete(promo._id);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="w-full flex items-center space-x-3 px-4 py-4 hover:bg-gray-100"
                                                >
                                                    <FaTrash />
                                                    <p>Hapus</p>
                                                </button>
                                                <li className="flex items-center space-x-3 px-4 py-4 hover:bg-gray-100 cursor-pointer">
                                                    <span className="w-3 h-3 bg-green-700 rounded-full"></span>
                                                    <span>Aktifkan</span>
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
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
        </div>
    );
};

export default PromoTable;
