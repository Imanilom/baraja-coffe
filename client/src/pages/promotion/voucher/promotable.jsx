import axios from "axios";
import React, { useEffect, useState } from "react";
import ConfirmationModalActive from "../confirmationModalActive";
import Paginated from "../../../components/paginated";

const PromoTable = ({ vouchers, fetchVouchers, currentPage, setCurrentPage }) => {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [newStatus, setNewStatus] = useState(null);
    const promosPerPage = 50;

    const handleToggleActive = async (id, newStatus) => {
        try {
            await axios.put(`/api/promotion/vouchers/${id}`, { isActive: newStatus });
            fetchVouchers();
        } catch (error) {
            console.error("Gagal update status voucher", error);
        }
    };

    const formatTanggal = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${day}-${month}-${year} ${hours}:${minutes}`;
    };

    const formatCurrency = (amount) => {
        if (!amount) return "Rp0";
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Hitung data untuk halaman saat ini
    const indexOfLast = currentPage * promosPerPage;
    const indexOfFirst = indexOfLast - promosPerPage;
    const currentVoucher = vouchers.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(vouchers.length / promosPerPage);

    return (
        <div className="w-full mx-auto">
            <table className="min-w-full text-[14px] text-[#999999] bg-white shadow-md text-sm">
                <thead className="border-b">
                    <tr>
                        <th className="px-4 py-3 text-left">Nama Vouchera</th>
                        <th className="px-4 py-3 text-right">Kuota</th>
                        <th className="px-4 py-3 text-right">Nilai</th>
                        <th className="px-4 py-3 text-left">Tanggal Berlaku</th>
                        <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {currentVoucher.length > 0 ? (
                        currentVoucher.map((voucher) => (
                            <tr key={voucher._id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 truncate">{voucher.name || "-"}</td>
                                <td className="px-4 py-3 text-right">{voucher.quota || 0}</td>
                                <td className="px-4 py-3 text-right">
                                    {voucher.discountType === "percentage"
                                        ? `${voucher.discountAmount}%`
                                        : formatCurrency(voucher.discountAmount)}
                                </td>
                                <td className="px-4 py-3 text-left truncate">
                                    {formatTanggal(voucher.validFrom)} s/d {formatTanggal(voucher.validTo)}
                                </td>
                                <td className="px-4 py-3 flex justify-center items-center">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={voucher.isActive === true}
                                            onChange={() => {
                                                setSelectedVoucher(voucher);
                                                setNewStatus(!voucher.isActive);
                                                setIsConfirmOpen(true);
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-300 peer-checked:bg-green-500 rounded-full transition-colors"></div>
                                        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                                    </label>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="text-center py-6 text-gray-500">
                                Tidak ada promo ditemukan.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
                <Paginated
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                />
            )}

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
                    if (selectedVoucher) {
                        await handleToggleActive(selectedVoucher._id, newStatus);
                    }
                    setIsConfirmOpen(false);
                    setSelectedVoucher(null);
                    setNewStatus(null);
                }}
            />
        </div>
    );
};

export default PromoTable;