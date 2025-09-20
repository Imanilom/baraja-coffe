import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import Header from "../../admin/header";
import Select from "react-select";

const UpdateDepartemen = () => {
    const { currentUser } = useSelector((state) => state.user);
    const { id } = useParams(); // ambil id dari URL
    const navigate = useNavigate();

    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: "#d1d5db",
            minHeight: "34px",
            fontSize: "13px",
            color: "#6b7280",
            boxShadow: state.isFocused ? "0 0 0 1px #005429" : "none",
            "&:hover": { borderColor: "#9ca3af" },
        }),
        singleValue: (provided) => ({ ...provided, color: "#6b7280" }),
        input: (provided) => ({ ...provided, color: "#6b7280" }),
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

    const [formData, setFormData] = useState({
        code: "",
        name: "",
        type: "",
        admin: "",
        isActive: true,
    });

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // Ambil user untuk pilihan admin
    const fetchUsers = async () => {
        try {
            const res = await axios.get("/api/user/staff", {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            setUsers(res.data || []);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    // Ambil data warehouse by id
    const fetchWarehouse = async () => {
        try {
            const res = await axios.get(`/api/warehouses/${id}`, {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            setFormData(res.data.data);
        } catch (error) {
            console.error("Error fetching warehouse:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchWarehouse();
    }, [id]);

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
            await axios.put(`/api/warehouses/${id}`, formData, {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            setMessage("Gudang berhasil diperbarui ✅");
            navigate("/admin/warehouse", {
                state: { success: "Gudang berhasil diperbarui!" },
            });
        } catch (err) {
            setMessage(err.response?.data?.message || "Error updating warehouse ❌");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            <main className="p-6 md:p-10 bg-gray-50 min-h-screen">
                <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">
                        Update Gudang
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
                                styles={customSelectStyles}
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
                                            value: formData.admin._id,
                                            label: users.find((u) => u._id === formData.admin._id)?.username,
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
                                {loading ? "Menyimpan..." : "Update"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
};

export default UpdateDepartemen;
