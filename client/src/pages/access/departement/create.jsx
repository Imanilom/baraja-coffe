import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import Header from "../../admin/header";
import Select from "react-select";

const CreateDepartemen = () => {
    const { currentUser } = useSelector((state) => state.user);
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: "#d1d5db",
            minHeight: "34px",
            fontSize: "13px",
            color: "#6b7280",
            boxShadow: state.isFocused ? "0 0 0 1px #005429" : "none",
            "&:hover": {
                borderColor: "#9ca3af",
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: "#6b7280",
        }),
        input: (provided) => ({
            ...provided,
            color: "#6b7280",
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "#9ca3af",
            fontSize: "13px",
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: "13px",
            color: "#374151",
            backgroundColor: state.isFocused ? "rgba(0, 84, 41, 0.1)" : "white",
            cursor: "pointer",
        }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    };
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        code: "",
        name: "",
        type: "central",
        admin: "",
        isActive: true,
    });

    const [users, setUsers] = useState([]); // list admin
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // Ambil user untuk pilihan admin
    const fetchUsers = async () => {
        try {
            const res = await axios.get("/api/user/staff")
            setUsers(res.data || []);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const res = await axios.post("/api/warehouses", formData, {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            setMessage("Gudang berhasil dibuat ✅");
            navigate("/admin/access-settings/departement", {
                state: { success: "Gudang berhasil dibuat!" },
            });
        } catch (err) {
            setMessage(err.response?.data?.message || "Error creating warehouse ❌");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <main className="p-6 md:p-10 bg-gray-50">
                <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">
                        Tambah Departemen
                    </h1>

                    {message && (
                        <div className="mb-4 text-sm text-center py-2 px-4 rounded-lg bg-blue-50 text-blue-700">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Code */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Kode Gudang
                            </label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2 mt-1"
                                placeholder="contoh: pusat, kitchen"
                                required
                            />
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Nama Gudang
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2 mt-1"
                                placeholder="contoh: Gudang Pusat"
                                required
                            />
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Tipe Gudang
                            </label>
                            <Select
                                options={[
                                    { value: "central", label: "Central" },
                                    { value: "department", label: "Department" },
                                ]}
                                value={
                                    formData.type
                                        ? { value: formData.type, label: formData.type.charAt(0).toUpperCase() + formData.type.slice(1) }
                                        : null
                                }
                                onChange={(selected) =>
                                    setFormData({ ...formData, type: selected ? selected.value : "" })
                                }
                                placeholder="Pilih tipe gudang"
                                className="mt-1"
                            />
                        </div>

                        {/* Admin */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Admin Gudang
                            </label>
                            <Select
                                options={users.map((user) => ({
                                    value: user._id,
                                    label: user.username,
                                }))}
                                value={
                                    formData.admin
                                        ? {
                                            value: formData.admin,
                                            label: users.find((u) => u._id === formData.admin)?.username,
                                        }
                                        : null
                                }
                                onChange={(selected) =>
                                    setFormData({ ...formData, admin: selected ? selected.value : "" })
                                }
                                placeholder="Pilih Admin"
                                isClearable
                                className="mt-1"
                                styles={customSelectStyles}
                            />
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                            />
                            <label className="text-sm font-medium text-gray-700">
                                Aktif
                            </label>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Link
                                to="/admin/access-settings/departement"
                                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                Kembali
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                {loading ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
};

export default CreateDepartemen;
