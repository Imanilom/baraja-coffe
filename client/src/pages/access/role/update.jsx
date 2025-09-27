import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import Header from "../../admin/header";

const permissionsList = [
    "manage_users",
    "manage_roles",
    "manage_products",
    "view_reports",
    "manage_outlets",
    "manage_inventory",
    "manage_vouchers",
    "manage_promo",
    "manage_orders",
    "manage_shifts",
    "manage_operational",
    "manage_loyalty",
    "manage_finance",
];

const UpdateRole = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // ambil id role dari URL
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        permissions: [],
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // ambil data role saat pertama kali load
    useEffect(() => {
        const fetchRole = async () => {
            try {
                const res = await axios.get(`/api/roles/${id}`);
                setFormData({
                    name: res.data.name,
                    description: res.data.description,
                    permissions: res.data.permissions || [],
                });
            } catch (err) {
                setMessage("Gagal mengambil data role");
            }
        };
        fetchRole();
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePermissionChange = (perm) => {
        setFormData((prev) => {
            if (prev.permissions.includes(perm)) {
                return { ...prev, permissions: prev.permissions.filter((p) => p !== perm) };
            } else {
                return { ...prev, permissions: [...prev.permissions, perm] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const res = await axios.put(`/api/roles/${id}`, formData);
            setMessage(res.data.message);
            navigate("/admin/access-settings/role", {
                state: { success: "Role berhasil diperbarui!" },
            });
        } catch (err) {
            setMessage(err.response?.data?.message || "Error updating role");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <Header />
            <div className="p-6 max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">Update Role</h1>

                {message && (
                    <div className="mb-4 text-sm text-green-600">{message}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Role</label>
                        <input
                            type="text"
                            name="name"
                            className="w-full border rounded-lg p-2 lowercase"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Keterangan</label>
                        <textarea
                            name="description"
                            className="w-full border rounded-lg p-2"
                            rows="2"
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    {/* Permissions */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Hak Izin</label>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-2 rounded-lg">
                            {permissionsList.map((perm) => (
                                <label key={perm} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.permissions.includes(perm)}
                                        onChange={() => handlePermissionChange(perm)}
                                    />
                                    <span className="text-sm">{perm}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex pt-4 gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-[#005429] text-white rounded-lg border border-[#005429]"
                        >
                            {loading ? "Updating..." : "Update"}
                        </button>
                        <Link
                            to="/admin/access-settings/role"
                            className="px-4 py-2 bg-white text-[#005429] rounded-lg border border-[#005429]"
                        >
                            Kembali
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateRole;
