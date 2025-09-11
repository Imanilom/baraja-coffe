import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
    FaTrash,
    FaSearch,
    FaChevronRight,
    FaUsers,
    FaPencilAlt,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import Header from "../../admin/header";
import MessageAlert from "../../../components/messageAlert";

const UserManagement = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const [showConfirm, setShowConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [alertMsg, setAlertMsg] = useState("");

    // Fetch data user
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await axios.get("/api/user/staff", {
                    headers: { Authorization: `Bearer ${currentUser.token}` },
                });

                const employeeData = (res.data || []).filter(
                    (emp) => emp.role !== "customer"
                );

                setAttendances(employeeData);
                setError(null);
            } catch (err) {
                setError("Gagal memuat data karyawan.");
                setAttendances([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser.token]);

    const filteredData = useMemo(() => {
        return attendances.filter(
            (emp) =>
                emp.username?.toLowerCase().includes(search.toLowerCase()) ||
                emp.email?.toLowerCase().includes(search.toLowerCase())
        );
    }, [attendances, search]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Hapus user
    const handleDelete = async () => {
        try {
            await axios.delete(`/api/user/delete/${deleteId}`, {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            setAttendances((prev) => prev.filter((u) => u._id !== deleteId));
            setAlertMsg("Karyawan berhasil dihapus!"); // ✅ langsung show di page yg sama
        } catch (err) {
            setAlertMsg("Gagal menghapus karyawan."); // ✅ pesan error
        } finally {
            setShowConfirm(false);
            setDeleteId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <p className="text-lg font-semibold text-red-600">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-[#005429] text-white px-4 py-2 rounded text-sm"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <Header />

            <MessageAlert message={alertMsg} type="success" />

            {/* Breadcrumb */}
            <div className="px-3 py-2 flex justify-between items-center border-b">
                <div className="flex items-center space-x-2">
                    <FaUsers size={21} className="text-gray-500 inline-block" />
                    <Link
                        to="/admin/access-settings"
                        className="text-[15px] text-gray-500"
                    >
                        Access
                    </Link>
                    <FaChevronRight
                        size={18}
                        className="text-gray-500 inline-block"
                    />
                    <p className="text-[15px] text-gray-500">User</p>
                </div>
                <Link
                    to="/admin/access-settings/user-create"
                    className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                >
                    Tambah
                </Link>
            </div>

            {/* Action Bar */}
            <div className="flex md:justify-end items-center px-6 py-3 bg-white shadow-sm">
                <div className="relative md:w-64 w-full">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari nama / email"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-3 py-2 w-full border rounded-md text-sm focus:ring-1 focus:ring-[#005429] focus:outline-none"
                    />
                </div>
            </div>

            {/* Table */}
            <main className="flex-1 p-6">
                <div className="bg-white shadow rounded-lg overflow-x-auto">
                    <table className="min-w-full text-sm text-gray-700">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left font-semibold">
                                    Nama
                                </th>
                                <th className="px-6 py-3 text-left font-semibold">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left font-semibold">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left font-semibold">
                                    Outlet
                                </th>
                                <th className="px-6 py-3 text-right font-semibold">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length > 0 ? (
                                paginatedData.map((data) => (
                                    <tr
                                        key={data._id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-3">{data.username}</td>
                                        <td className="px-6 py-3">{data.email}</td>
                                        <td className="px-6 py-3 capitalize">
                                            {data.role}
                                        </td>
                                        <td className="px-6 py-3">
                                            {data.outlet?.[0]?.outletId?.name || "-"}
                                        </td>
                                        <td className="px-6 py-3 flex justify-end gap-4">
                                            <Link
                                                to={`/admin/access-settings/user-update/${data._id}`}
                                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                                            >
                                                <FaPencilAlt /> Edit
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setDeleteId(data._id);
                                                    setShowConfirm(true);
                                                }}
                                                className="flex items-center gap-2 text-red-600 hover:text-red-800"
                                            >
                                                <FaTrash /> Hapus
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="text-center py-8 text-gray-500 text-sm"
                                    >
                                        Tidak ada data ditemukan
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
                        <span>
                            Menampilkan{" "}
                            {Math.min(
                                (currentPage - 1) * ITEMS_PER_PAGE + 1,
                                filteredData.length
                            )}{" "}
                            –{" "}
                            {Math.min(
                                currentPage * ITEMS_PER_PAGE,
                                filteredData.length
                            )}{" "}
                            dari {filteredData.length}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.max(prev - 1, 1)
                                    )
                                }
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                            >
                                Sebelumnya
                            </button>
                            <button
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(prev + 1, totalPages)
                                    )
                                }
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                            >
                                Berikutnya
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal Konfirmasi */}
            {showConfirm && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                        <h2 className="text-lg font-semibold mb-4">
                            Konfirmasi Hapus
                        </h2>
                        <p className="text-sm text-gray-600 mb-6">
                            Apakah Anda yakin ingin menghapus karyawan ini? Aksi
                            ini tidak bisa dibatalkan.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
