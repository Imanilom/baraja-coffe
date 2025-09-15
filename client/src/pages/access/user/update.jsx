import axios from "axios";
import React, { useState, useEffect } from "react";
import Select from "react-select";
import {
    FaBell,
    FaChevronRight,
    FaIdBadge,
    FaUser,
} from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import MessageAlert from "../../../components/messageAlert";
import { useSelector } from "react-redux";
import Header from "../../admin/header";

const UpdateUser = () => {
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
    const { currentUser } = useSelector((state) => state.user);
    const { id } = useParams(); // ambil id user dari route
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [outlets, setOutlets] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedOutlets, setSelectedOutlets] = useState([]);
    const [employeeType, setEmployeeType] = useState(""); // role
    const [roleOptions, setRoleOptions] = useState([]);
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [formErrors, setFormErrors] = useState({});
    const [submitAction, setSubmitAction] = useState("stay");

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/roles");
            const formatted = res.data.map((role) => ({
                value: role._id,      // gunakan _id sebagai value
                label: role.name,     // tampilkan name sebagai label
            }));
            setRoleOptions(formatted);
        } catch (err) {
            console.error("Failed to fetch roles:", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data user by ID
    const fetchUser = async () => {
        try {
            const res = await axios.get(`/api/user/getUSerById/${id}`, {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            const u = res.data;

            setName(u.name || "");
            setUsername(u.username || "");
            setEmail(u.email || "");
            setPhone(u.phone || "");
            setEmployeeType(u.role || "");
            setSelectedOutlets(u.outlet?.map((o) => o.outletId) || []);
            setError(null);
        } catch (err) {
            setError("Gagal memuat data user.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch outlets
    const fetchOutlets = async () => {
        try {
            const res = await axios.get("/api/outlet");
            setOutlets(Array.isArray(res.data) ? res.data : res.data.data || []);
        } catch {
            setOutlets([]);
        }
    };

    useEffect(() => {
        fetchUser();
        fetchOutlets();
        fetchRoles();
    }, [id]);

    const filteredOutlets = outlets.filter((o) =>
        o.name.toLowerCase().includes(search.toLowerCase())
    );

    const toggleOutlet = (id) => {
        setSelectedOutlets((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const validateForm = () => {
        let errors = {};
        if (!employeeType) errors.employeeType = "Pilih role wajib.";
        if (!name) errors.name = "Nama wajib diisi.";
        if (!username) errors.username = "Username wajib diisi.";
        if (employeeType === "staff" && !email)
            errors.email = "Email wajib diisi.";
        if (!phone) errors.phone = "Nomor telepon wajib diisi.";
        if (selectedOutlets.length === 0)
            errors.outlets = "Minimal pilih 1 outlet.";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // if (!validateForm()) return;

        try {
            await axios.put(
                `/api/user/update/${id}`,
                {
                    name,
                    username,
                    email,
                    phone,
                    password: password || undefined, // kosong = tidak update password
                    role: employeeType,
                    outlets: selectedOutlets,
                },
                {
                    headers: { Authorization: `Bearer ${currentUser.token}` },
                }
            );


            if (submitAction === "exit") {
                navigate("/admin/access-settings/user", {
                    state: { success: "Karyawan berhasil diperbarui!" },
                });
            } else {
                navigate(".", {
                    state: { success: "Karyawan berhasil diperbarui!" },
                });
            }
        } catch (err) {
            alert(err.response?.data?.message || "Gagal update karyawan");
        }
    };

    if (loading) return <p className="text-center py-8">Loading...</p>;
    if (error) return <p className="text-center py-8 text-red-500">{error}</p>;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-700">
            {/* Header */}
            <Header />

            <MessageAlert />

            {/* Form */}
            <form
                className="max-w-5xl mx-auto mt-6 mb-12 bg-white shadow rounded-lg overflow-hidden"
                autoComplete="off"
                onSubmit={handleSubmit}
            >
                {/* Breadcrumb + Actions */}
                <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
                    <div className="flex items-center text-sm text-gray-500 space-x-2">
                        <FaIdBadge />
                        <span>Karyawan</span>
                        <FaChevronRight />
                        <span className="text-[#005429] font-medium">Edit karyawan</span>
                    </div>
                    <div className="flex space-x-2">
                        <Link
                            to="/admin/access-settings/user"
                            className="px-4 py-2 text-sm border border-[#005429] text-[#005429] rounded hover:bg-[#005429] hover:text-white transition"
                        >
                            Batal
                        </Link>
                        {/* <button
                            type="submit"
                            onClick={() => setSubmitAction("stay")}
                            className="px-4 py-2 text-sm bg-[#005429] text-white rounded hover:opacity-90"
                        >
                            Update
                        </button> */}
                        <button
                            type="submit"
                            onClick={() => setSubmitAction("exit")}
                            className="px-4 py-2 text-sm bg-[#005429] text-white rounded hover:opacity-90"
                        >
                            Update
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Input fields */}
                    <div className="space-y-4">
                        {/* Nama */}
                        {/* <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full border rounded px-3 py-2 text-sm focus:ring-1 outline-none focus:ring-[#005429]"
                            />
                            {formErrors.name && (
                                <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                            )}
                        </div> */}

                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full border rounded px-3 py-2 text-sm focus:ring-1 outline-none focus:ring-[#005429]"
                            />
                            {formErrors.username && (
                                <p className="text-xs text-red-500 mt-1">
                                    {formErrors.username}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full border rounded px-3 py-2 text-sm focus:ring-1 outline-none focus:ring-[#005429]"
                            />
                            {formErrors.email && (
                                <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nomor Telepon <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Masukkan nomor telepon"
                                value={phone}
                                onChange={(e) => {
                                    // Hanya izinkan angka
                                    const onlyNums = e.target.value.replace(/\D/g, "");
                                    setPhone(onlyNums);
                                }}
                                className="w-full border rounded px-3 py-2 text-sm focus:ring-1 outline-none focus:ring-[#005429]"
                            />
                            {formErrors.phone && (
                                <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>
                            )}
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role <span className="text-red-500">*</span>
                            </label>
                            <Select
                                options={roleOptions}
                                value={roleOptions.find((opt) => opt.value === employeeType)}
                                onChange={(opt) => setEmployeeType(opt.value)}
                                placeholder="Pilih role karyawan..."
                                styles={customSelectStyles}
                            />
                            {formErrors.employeeType && (
                                <p className="text-xs text-red-500 mt-1">
                                    {formErrors.employeeType}
                                </p>
                            )}
                        </div>

                        {/* Password (opsional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password (kosongkan jika tidak ingin diubah)
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-1/2 border rounded px-3 py-2 text-sm focus:ring-1 outline-none focus:ring-[#005429]"
                            />
                        </div>
                    </div>

                    {/* Outlet pilihan */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Outlet <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Cari outlet..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm mb-3 focus:ring-1 outline-none focus:ring-[#005429]"
                        />
                        <div className="border rounded p-3 max-h-64 overflow-y-auto space-y-2 bg-gray-50">
                            {filteredOutlets.map((outlet) => (
                                <label
                                    key={outlet._id}
                                    className="flex items-center space-x-2 text-sm cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedOutlets.includes(outlet._id)}
                                        onChange={() => toggleOutlet(outlet._id)}
                                        className="accent-[#005429] w-4 h-4"
                                    />
                                    <span>{outlet.name}</span>
                                </label>
                            ))}
                            {filteredOutlets.length === 0 && (
                                <p className="text-sm text-gray-400">Outlet tidak ditemukan.</p>
                            )}
                        </div>
                        {formErrors.outlets && (
                            <p className="text-xs text-red-500 mt-1">
                                {formErrors.outlets}
                            </p>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default UpdateUser;
