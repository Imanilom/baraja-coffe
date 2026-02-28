import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaCheckCircle, FaTimesCircle, FaPlus, FaEdit, FaHome, FaChevronRight } from "react-icons/fa";
import Header from "../../admin/header";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

const DepartementTable = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const navigate = useNavigate();

    const fetchWarehouses = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/api/warehouses", {
                params: {
                    page,
                    limit: 10,
                    search,
                },
                headers: {
                    Authorization: `Bearer ${currentUser.token}`, // pakai auth
                },
            });

            setWarehouses(res.data.data);
            setTotalPages(res.data.pagination.pages);
        } catch (error) {
            console.error("Error fetching warehouses:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWarehouses();
    }, [page, search]);

    return (
        <>
            {/* Breadcrumb */}
            <div className="px-3 py-2 flex justify-between items-center border-b">
                <div className="flex items-center space-x-2">
                    <FaHome size={21} className="text-gray-500 inline-block" />
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
                    <p className="text-[15px] text-gray-500">Departemen</p>
                </div>
            </div>

            <main className="p-6 md:p-10 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <h1 className="text-2xl font-bold text-gray-800">Daftar Departemen</h1>

                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Search */}
                            <input
                                type="text"
                                placeholder="🔍 Cari kode atau nama gudang..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full sm:w-72 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            {/* Tambah Departemen */}
                            <button
                                onClick={() => navigate("/admin/access-settings/departemen-create")}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
                            >
                                <FaPlus /> Tambah Departemen
                            </button>
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-600">
                                <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Kode</th>
                                        <th className="px-6 py-3">Nama</th>
                                        <th className="px-6 py-3">Tipe</th>
                                        <th className="px-6 py-3">Admin</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Dibuat</th>
                                        <th className="px-6 py-3 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-4 text-center">
                                                <span className="text-gray-500">Loading...</span>
                                            </td>
                                        </tr>
                                    ) : warehouses.length > 0 ? (
                                        warehouses.map((wh) => (
                                            <tr
                                                key={wh._id}
                                                className="border-t hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {wh.code}
                                                </td>
                                                <td className="px-6 py-4">{wh.name}</td>
                                                <td className="px-6 py-4 capitalize">{wh.type}</td>
                                                <td className="px-6 py-4">
                                                    {wh.admin
                                                        ? wh.admin.username.charAt(0).toUpperCase() + wh.admin.username.slice(1)
                                                        : "-"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {wh.isActive ? (
                                                        <span className="flex items-center gap-1 text-green-600 font-medium">
                                                            <FaCheckCircle /> Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-red-500 font-medium">
                                                            <FaTimesCircle /> Nonaktif
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {new Date(wh.createdAt).toLocaleDateString("id-ID")}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() =>
                                                            navigate(`/admin/access-settings/departemen-update/${wh._id}`)
                                                        }
                                                        className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                                                    >
                                                        <FaEdit /> Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="7"
                                                className="px-6 py-6 text-center text-gray-500"
                                            >
                                                Tidak ada data
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-between items-center px-6 py-4 bg-gray-50">
                            <span className="text-sm text-gray-600">
                                Halaman {page} dari {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-50"
                                >
                                    Prev
                                </button>
                                <button
                                    onClick={() =>
                                        setPage((prev) => Math.min(prev + 1, totalPages))
                                    }
                                    disabled={page === totalPages}
                                    className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};

export default DepartementTable;
