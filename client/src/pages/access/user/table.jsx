import { useState, useEffect } from "react";
import axios from "axios";
import {
    FaTrash,
    FaPencilAlt,
    FaChevronRight,
    FaChevronLeft,
    FaSearch,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import ConfirmationModalActive from "./ConfirmationModalActive";
import Select from "react-select";
import UserTableSkeleton from "./skeleton";
import Paginated from "../../../components/paginated";

const ITEMS_PER_PAGE = 10;

export default function UserTable({ currentUser, customSelectStyles }) {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteId, setDeleteId] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newStatus, setNewStatus] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // filter states
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [roleFilter, setRoleFilter] = useState("all");

    // Fetch data user
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/user/staff", {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });

            const employeeData = (res.data || []).filter(
                (emp) => emp.role !== "customer"
            );

            setUsers(employeeData);
            setError(null);
        } catch (err) {
            setError("Gagal memuat data karyawan.");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ✅ Options untuk Status
    const statusOptions = [
        { value: "all", label: "Semua Status" },
        { value: "active", label: "Aktif" },
        { value: "inactive", label: "Tidak Aktif" },
    ];

    // ✅ Generate options untuk Role dari data users
    const roleOptions = [
        { value: "all", label: "Semua Role" },
        ...[...new Set(users.map((u) => u.role?.name))]
            .filter(Boolean) // buang undefined/null
            .map((role) => ({ value: role, label: role })),
    ];

    const handleUpdate = async (itemId, username, newStatus) => {
        // 🔹 langsung update state lokal biar tampilan berubah
        setUsers((prev) =>
            prev.map((user) =>
                user._id === itemId ? { ...user, isActive: newStatus } : user
            )
        );

        try {
            await axios.put(
                `/api/user/update/${itemId}`,
                { isActive: newStatus },
                { headers: { Authorization: `Bearer ${currentUser.token}` } }
            );

            navigate("/admin/access-settings/user", {
                state: { success: `${username} berhasil ${newStatus ? "diaktifkan" : "dinonaktifkan"}` },
            });

            // opsional: fetch ulang buat sync dengan backend
            fetchData();
        } catch (error) {
            console.error("Error updating User:", error);
            alert("Terjadi kesalahan saat update status");
        }
    };


    // Hapus user
    const handleDelete = async () => {
        try {
            await axios.delete(`/api/user/delete/${deleteId}`, {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            setUsers((prev) => prev.filter((u) => u._id !== deleteId));
        } catch (err) {
            alert("Gagal menghapus karyawan.");
        } finally {
            setShowConfirm(false);
            setDeleteId(null);
        }
    };

    // Apply filter
    const filteredData = users.filter((user) => {
        const matchSearch =
            user.username?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase());

        const matchStatus =
            statusFilter === "all"
                ? true
                : statusFilter === "active"
                    ? user.isActive
                    : !user.isActive;

        const matchRole =
            roleFilter === "all" ? true : user.role?.name === roleFilter;

        return matchSearch && matchStatus && matchRole;
    });

    // Pagination
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
    );

    if (loading) return <UserTableSkeleton />;

    if (error) {
        return (
            <div className="flex justify-center items-center">
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

    // generate nomor halaman
    const renderPageNumbers = () => {
        let pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`px-3 py-1 border rounded ${currentPage === i
                        ? "bg-green-900 text-white border-green-900"
                        : "hover:bg-gray-100"
                        }`}
                >
                    {i}
                </button>
            );
        }
        return pages;
    };

    return (
        <>
            {/* Filter bar */}
            <div className="flex flex-wrap gap-4 md:justify-between items-center px-6 py-3">
                {/* Search */}
                <div className="relative md:w-64 w-full">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari nama / email"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-9 pr-3 py-2 w-full border rounded-md text-sm focus:ring-1 focus:ring-green-900 focus:outline-none"
                    />
                </div>

                <div className="flex flex-wrap gap-3">
                    {/* Status Filter */}
                    <div className="w-48">
                        <Select
                            value={statusOptions.find((opt) => opt.value === statusFilter)}
                            onChange={(selected) => {
                                setStatusFilter(selected.value);
                                setCurrentPage(1);
                            }}
                            options={statusOptions}
                            className="text-sm"
                            styles={customSelectStyles}
                        />
                    </div>

                    {/* Role Filter */}
                    <div className="w-64">
                        <Select
                            value={roleOptions.find((opt) => opt.value === roleFilter)}
                            onChange={(selected) => {
                                setRoleFilter(selected.value);
                                setCurrentPage(1);
                            }}
                            options={roleOptions}
                            className="text-sm"
                            styles={customSelectStyles}
                            isSearchable
                        />
                    </div>
                </div>

            </div>

            {/* Table */}
            <main className="flex-1 px-6">
                <div className="bg-white shadow rounded-lg overflow-x-auto">
                    <table className="min-w-full text-sm text-gray-900">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-4 py-3 flex justify-start">
                                    <input type="checkbox" className="w-4 h-4" />
                                </th>
                                <th className="px-6 py-3 text-left font-semibold w-3/12">User</th>
                                <th className="px-6 py-3 text-left font-semibold w-2/12">Status</th>
                                <th className="px-6 py-3 text-left font-semibold w-2/12">Role</th>
                                <th className="px-6 py-3 text-left font-semibold w-2/12">
                                    Email address
                                </th>
                                <th className="px-6 py-3 text-left font-semibold w-2/12">Teams</th>
                                <th className="px-6 py-3 text-right font-semibold w-1/12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length > 0 ? (
                                paginatedData.map((user) => (
                                    <tr
                                        key={user._id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <input type="checkbox" className="w-4 h-4" />
                                        </td>

                                        {/* Avatar + name */}
                                        <td className="px-6 py-3 flex items-center gap-3">
                                            {user.avatarUrl ? (
                                                <img
                                                    src={user.avatarUrl}
                                                    alt={user.username}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium">
                                                    {user.username?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {user.username}
                                                </div>
                                                <div className="text-gray-500 text-xs">
                                                    @{user.username}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-3">
                                            <span
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setNewStatus(!user.isActive); // toggle status
                                                    setIsConfirmOpen(true);
                                                }}
                                                className={`px-2 py-1 text-xs rounded-full cursor-pointer ${user.isActive
                                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                                    }`}
                                            >
                                                {user.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>

                                        <td className="px-6 py-3">{user.role?.name || "-"}</td>
                                        <td className="px-6 py-3">{user.email}</td>

                                        {/* Teams */}
                                        <td className="px-6 py-3">
                                            <div className="flex gap-2 flex-wrap">
                                                {user.outlet && user.outlet.length > 0 ? (
                                                    <div className="flex gap-2 flex-wrap">
                                                        {user.outlet.slice(0, 3).map((o, i) => (
                                                            <span
                                                                key={i}
                                                                className="px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-600"
                                                            >
                                                                {o.outletId?.name}
                                                            </span>
                                                        ))}
                                                        {user.outlet.length > 3 && (
                                                            <span className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-600">
                                                                +{user.outlet.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    "-"
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-3 text-right flex justify-end gap-3">
                                            <Link
                                                to={`/admin/access-settings/user-update/${user._id}`}
                                                className="text-gray-500 hover:text-green-900"
                                            >
                                                <FaPencilAlt />
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setDeleteId(user._id);
                                                    setShowConfirm(true);
                                                }}
                                                className="flex items-center gap-2 text-red-600 hover:text-red-800"
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={7}
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
                <Paginated
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                />

                <ConfirmationModalActive
                    isOpen={isConfirmOpen}
                    user={selectedUser}
                    newStatus={newStatus}
                    onClose={() => {
                        setIsConfirmOpen(false);
                        setSelectedUser(null);
                        setNewStatus(null);
                    }}
                    onConfirm={async () => {
                        await handleUpdate(selectedUser._id, selectedUser.username, newStatus);
                        setIsConfirmOpen(false);
                        setSelectedUser(null);
                        setNewStatus(null);
                    }}
                />

                {/* Modal Konfirmasi */}
                {showConfirm && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                            <h2 className="text-lg font-semibold mb-4">
                                Konfirmasi Hapus
                            </h2>
                            <p className="text-sm text-gray-600 mb-6">
                                Apakah Anda yakin ingin menghapus karyawan ini? Aksi ini tidak
                                bisa dibatalkan.
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
            </main>
        </>
    );
}
