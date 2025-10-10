import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaPlus, FaPencilAlt, FaTrash } from "react-icons/fa";
import { useSelector } from "react-redux";
import Header from "../../admin/header"

const IndexSidebarMenu = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchMenus = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/sidebar/admin/menus", {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            setMenus(res.data.data || []);
        } catch (err) {
            console.error("Error fetching menus:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenus();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus menu ini?")) return;
        try {
            await axios.delete(`/api/sidebar/admin/menus/${id}`, {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            setMenus((prev) => prev.filter((m) => m._id !== id));
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    return (
        <>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-lg font-bold">Sidebar Menu</h1>
                    <Link
                        to="/admin/access-settings/bar-menu/create-bar-menu"
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                    >
                        <FaPlus /> Tambah
                    </Link>
                </div>

                <div className="bg-white shadow rounded overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-4 py-2 text-left">Nama</th>
                                <th className="px-4 py-2 text-left">Path</th>
                                <th className="px-4 py-2 text-left">Icon</th>
                                <th className="px-4 py-2 text-left">Urutan</th>
                                <th className="px-4 py-2 text-left">Status</th>
                                <th className="px-4 py-2 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-4">
                                        Loading...
                                    </td>
                                </tr>
                            ) : menus.length > 0 ? (
                                menus.map((menu) => (
                                    <tr key={menu._id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-2">{menu.name}</td>
                                        <td className="px-4 py-2">{menu.path}</td>
                                        <td className="px-4 py-2">{menu.icon}</td>
                                        <td className="px-4 py-2">{menu.order}</td>
                                        <td className="px-4 py-2">
                                            {menu.isActive ? (
                                                <span className="text-green-600">Aktif</span>
                                            ) : (
                                                <span className="text-red-600">Nonaktif</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 flex justify-end gap-2">
                                            <Link
                                                to={`/admin/access-settings/bar-menu/update-bar-menu/${menu._id}`}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <FaPencilAlt />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(menu._id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-4">
                                        Tidak ada menu
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default IndexSidebarMenu;
