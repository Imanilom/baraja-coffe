import axios from "axios";
import { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaPencilAlt, FaSearch, FaTrash } from "react-icons/fa";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import RoleTableSkeleton from "./skeleton";
import CreateRole from "./create";
import UpdateRole from "./update";
import { useSelector } from "react-redux";

export default function RoleTable() {

    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const { currentUser } = useSelector((state) => state.user);

    const [roles, setRole] = useState([]);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");

    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Fetch roles and outlets data
    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch roles data
            const roleResponse = await axios.get("/api/roles", {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            const roleData = roleResponse.data.data ? roleResponse.data.data : roleResponse.data;

            setRole(roleData);

            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load data. Please try again later.");
            // Set empty arrays as fallback
            setRole([]);
            setOutlets([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateClick = (roleId) => {
        setSelectedRoleId(roleId);
        setIsUpdateModalOpen(true);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            await axios.delete(`/api/roles/${itemToDelete}`);

            // Refresh data after delete
            await fetchData();

            // Close modal
            setItemToDelete(null);

            // Optional: Show success message
            alert("Role berhasil dihapus!");
        } catch (error) {
            console.error("Error deleting role:", error);
            alert(error.response?.data?.message || "Gagal menghapus role");
        } finally {
            setIsDeleting(false);
        }
    };

    // Cancel delete
    const handleCancelDelete = () => {
        setItemToDelete(null);
    };

    // Apply filter
    const filteredData = roles.filter((role) => {
        const matchSearch =
            role.name?.toLowerCase().includes(search.toLowerCase())

        // const matchStatus =
        //     statusFilter === "all"
        //         ? true
        //         : statusFilter === "active"
        //             ? role.isActive
        //             : !role.isActive;

        return matchSearch;
    });

    // Pagination
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
    );

    // generate nomor halaman
    const renderPageNumbers = () => {
        let pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`px-3 py-1 border border-green-900 rounded ${currentPage === i
                        ? "bg-green-900 text-white"
                        : "hover:bg-green-900 hover:text-white text-green-900"
                        }`}
                >
                    {i}
                </button>
            );
        }
        return pages;
    };

    // Show loading state
    if (loading) return <RoleTableSkeleton />;

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
        <>
            {/* Filter bar */}
            <div className="flex flex-wrap gap-4 md:justify-between items-center px-6 py-3">
                {/* Search */}
                <div className="relative md:w-64 w-full">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari nama role / deskripsi"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-9 pr-3 py-2 w-full border rounded-md text-sm focus:ring-1 focus:ring-green-900 focus:outline-none"
                    />
                </div>
            </div>

            {/* Table */}
            <main className="flex-1 px-6">
                <div className="bg-white shadow rounded-lg overflow-x-auto">
                    <table className="min-w-full text-sm text-gray-700">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                {/* Checkbox all */}
                                <th className="flex justify-start px-4 py-3">
                                    <input
                                        type="checkbox"
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedItems(paginatedData.map((d) => d._id));
                                            } else {
                                                setSelectedItems([]);
                                            }
                                        }}
                                        checked={
                                            selectedItems.length === paginatedData.length &&
                                            paginatedData.length > 0
                                        }
                                        className="w-4 h-4"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left font-semibold w-3/12">Role</th>
                                <th className="px-6 py-3 text-left font-semibold w-5/12">Deskripsi</th>
                                <th className="px-6 py-3 text-left font-semibold w-2/12">
                                    Tanggal Dibuat
                                </th>
                                <th className="px-6 py-3 text-right font-semibold w-2/12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length > 0 ? (
                                paginatedData.map((data) => (
                                    <tr
                                        key={data._id}
                                        className="hover:bg-gray-50 transition-colors text-sm"
                                    >
                                        {/* Checkbox per row */}
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.includes(data._id)}
                                                onChange={() => {
                                                    if (selectedItems.includes(data._id)) {
                                                        setSelectedItems((prev) =>
                                                            prev.filter((id) => id !== data._id)
                                                        );
                                                    } else {
                                                        setSelectedItems((prev) => [...prev, data._id]);
                                                    }
                                                }}
                                                className="w-4 h-4"
                                            />
                                        </td>
                                        <td className="px-6 py-3">{data.name || "-"}</td>
                                        <td className="px-6 py-3">{data.description || "-"}</td>
                                        <td className="px-6 py-3">
                                            {data.createdAt
                                                ? dayjs(data.createdAt).format("DD-MM-YYYY")
                                                : "-"}
                                        </td>
                                        <td className="px-6 py-3 text-right flex justify-end gap-3">
                                            <button onClick={() => handleUpdateClick(data._id)}>
                                                <FaPencilAlt />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setItemToDelete(data._id);
                                                }}
                                                className="text-red-600 hover:text-red-800 flex items-center gap-1"
                                            >
                                                <FaTrash />
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
                {itemToDelete && (
                    <>
                        {/* Overlay */}
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 z-40"
                            onClick={handleCancelDelete}
                        ></div>

                        {/* Modal */}
                        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-bold mb-4">Konfirmasi Hapus</h3>
                            <p className="text-gray-600 mb-6">
                                Apakah Anda yakin ingin menghapus role ini? Tindakan ini tidak dapat dibatalkan.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={handleCancelDelete}
                                    disabled={isDeleting}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                                >
                                    {isDeleting ? "Menghapus..." : "Hapus"}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Pagination tetap */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4 text-sm text-white">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-2 px-3 py-1 border rounded disabled:opacity-50 bg-green-900"
                        >
                            <FaChevronLeft /> Sebelumnya
                        </button>

                        <div className="flex gap-2">{renderPageNumbers()}</div>

                        <button
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-2 px-3 py-1 border rounded disabled:opacity-50 bg-green-900"
                        >
                            Selanjutnya <FaChevronRight />
                        </button>
                    </div>
                )}

                <UpdateRole
                    isOpen={isUpdateModalOpen}
                    onClose={() => setIsUpdateModalOpen(false)}
                    onSuccess={(data) => {
                        fetchData(); // Refresh table
                    }}
                    roleId={selectedRoleId}
                />
            </main>
        </>
    )
}