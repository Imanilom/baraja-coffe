import React, { useState, useEffect } from "react";
import axios from "axios";

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
    "superadmin"
];

const CreateRole = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        permissions: [],
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({ name: "", description: "", permissions: [] });
            setMessage("");
        }
    }, [isOpen]);

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
            const res = await axios.post("/api/roles", formData);

            // Reset form
            setFormData({ name: "", description: "", permissions: [] });

            // Call onSuccess callback if provided (ini akan trigger fetchData di parent)
            if (onSuccess) {
                onSuccess(res.data);
            }

            // Close modal setelah semua selesai
            setTimeout(() => {
                onClose();
            }, 100);

        } catch (err) {
            setMessage(err.response?.data?.message || "Error creating role");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={handleClose}
            ></div>

            {/* Sidebar Modal */}
            <div
                className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <h2 className="text-xl font-bold">Tambah Role</h2>
                        <button
                            onClick={handleClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {message && (
                            <div className={`mb-4 p-3 text-sm rounded-lg ${message.includes("Error")
                                ? "text-red-600 bg-red-50"
                                : "text-green-600 bg-green-50"
                                }`}>
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    className="w-full border rounded-lg p-2 lowercase focus:outline-none focus:ring-2 focus:ring-[#005429]"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Keterangan
                                </label>
                                <textarea
                                    name="description"
                                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#005429]"
                                    rows="3"
                                    value={formData.description}
                                    onChange={handleChange}
                                ></textarea>
                            </div>

                            {/* Permissions */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Hak Izin
                                </label>
                                <div className="border rounded-lg p-3 max-h-64 overflow-y-auto">
                                    <div className="space-y-2">
                                        {permissionsList.map((perm) => (
                                            <label
                                                key={perm}
                                                className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permissions.includes(perm)}
                                                    onChange={() => handlePermissionChange(perm)}
                                                    className="w-4 h-4 text-[#005429] focus:ring-[#005429]"
                                                />
                                                <span className="text-sm">{perm}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {formData.permissions.length} izin dipilih
                                </p>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t bg-gray-50">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-[#005429] text-white rounded-lg hover:bg-[#006633] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Menyimpan..." : "Simpan"}
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-4 py-2 bg-white text-[#005429] rounded-lg border border-[#005429] hover:bg-gray-50"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateRole;