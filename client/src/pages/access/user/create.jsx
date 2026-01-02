import axios from "axios";
import React, { useState, useEffect } from "react";
import Select from "react-select";
import {
    FaChevronRight,
    FaIdBadge,
    FaEye,
    FaEyeSlash,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import MessageAlert from "../../../components/messageAlert";
import CreateUserSkeleton from "./create_user_skeleton"; // Import skeleton

const CreateUser = () => {
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

    // Tab state
    const [activeTab, setActiveTab] = useState("staff");
    const [showPassword, setShowPassword] = useState(false);
    const [showPin, setShowPin] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [outlets, setOutlets] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedOutlets, setSelectedOutlets] = useState([]);
    const [employeeType, setEmployeeType] = useState("");
    const [roleOptions, setRoleOptions] = useState([]);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [pin, setPin] = useState("");
    const [formErrors, setFormErrors] = useState({});
    const [submitAction, setSubmitAction] = useState("stay");
    const [alertMsg, setAlertMsg] = useState("");
    const navigate = useNavigate();

    const tabs = [
        {
            id: "staff",
            label: "Staff & Admin",
            exclude: ["cashier", "cashier junior", "cashier senior", "customer"]
        },
        {
            id: "cashier",
            label: "Cashier",
            roles: ["cashier", "cashier junior", "cashier senior"]
        },
        {
            id: "customer",
            label: "Customer",
            roles: ["customer"]
        },
    ];

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/roles");

            // Filter roles berdasarkan tab aktif
            let filtered = res.data;
            const currentTab = tabs.find(t => t.id === activeTab);

            if (currentTab.roles) {
                // Jika ada roles yang specific (untuk cashier tab)
                filtered = res.data.filter(role =>
                    currentTab.roles.some(r => r.toLowerCase() === role.name.toLowerCase())
                );
            } else if (currentTab.exclude) {
                // Jika ada exclude (untuk staff tab)
                filtered = res.data.filter(role =>
                    !currentTab.exclude.some(r => r.toLowerCase() === role.name.toLowerCase())
                );
            }

            const formatted = filtered.map((role) => ({
                value: role._id,
                label: role.name,
            }));
            setRoleOptions(formatted);
        } catch (err) {
            console.error("Failed to fetch roles:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOutlets = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/outlet");
            const data = Array.isArray(res.data)
                ? res.data
                : Array.isArray(res.data.data)
                    ? res.data.data
                    : [];
            setOutlets(data);
            setError(null);
        } catch (err) {
            setError("Gagal memuat data outlet.");
            setOutlets([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOutlets();
    }, []);

    // Refetch roles ketika tab berubah
    useEffect(() => {
        fetchRoles();
        // Reset selected role dan password/pin ketika pindah tab
        setEmployeeType("");
        setPassword("");
        setPin("");
    }, [activeTab]);

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
        if (!username) errors.username = "Username wajib diisi.";
        if (!email) errors.email = "Email wajib diisi.";
        if (!phone) errors.phone = "Nomor telepon wajib diisi.";

        // Validasi berbeda untuk Staff vs Cashier
        if (activeTab === "cashier") {
            if (!pin || pin.length !== 4) errors.pin = "PIN wajib 4 digit.";
        } else {
            if (!password) errors.password = "Password wajib diisi.";
        }

        if (selectedOutlets.length === 0)
            errors.outlets = "Minimal pilih 1 outlet.";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const res = await axios.post("/api/user/create", {
                name: username,
                username,
                email,
                phone,
                password: activeTab === "cashier" ? pin : password, // kirim pin atau password
                role: employeeType,
                outlets: selectedOutlets,
            });

            if (submitAction === "exit") {
                navigate("/admin/access-settings/user", {
                    state: { success: "User berhasil dibuat!" },
                });
            } else {
                // Reset form
                setUsername("");
                setEmail("");
                setPhone("");
                setEmployeeType("");
                setSelectedOutlets([]);
                setPassword("");
                setPin("");
                setAlertMsg("User berhasil dibuat!");
            }
        } catch (err) {
            alert(err.response?.data?.message || "Gagal membuat user");
        }
    };

    if (loading) return <CreateUserSkeleton />;
    if (error) return <p className="text-center py-8 text-red-500">{error}</p>;

    return (
        <div className="text-gray-700">
            <MessageAlert message={alertMsg} type="success" />

            {/* Form Container */}
            <form
                className="max-w-5xl mx-auto mt-6 mb-12 bg-white shadow rounded-lg overflow-hidden"
                autoComplete="off"
                onSubmit={handleSubmit}
            >
                {/* Breadcrumb + Actions */}
                <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
                    <div className="flex items-center text-sm text-gray-500 space-x-2">
                        <FaIdBadge />
                        <span>User</span>
                        <FaChevronRight />
                        <span className="text-[#005429] font-medium">
                            Tambah User
                        </span>
                    </div>
                    <div className="flex space-x-2">
                        <Link
                            to="/admin/access-settings/user"
                            className="px-4 py-2 text-sm border border-[#005429] text-[#005429] rounded hover:bg-[#005429] hover:text-white transition"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            onClick={() => setSubmitAction("stay")}
                            className="px-4 py-2 text-sm bg-[#005429] text-white rounded hover:opacity-90"
                        >
                            Simpan
                        </button>
                        <button
                            type="submit"
                            onClick={() => setSubmitAction("exit")}
                            className="px-4 py-2 text-sm bg-[#005429] text-white rounded hover:opacity-90"
                        >
                            Simpan & Keluar
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="px-6 pt-4">
                    <div className="border-b border-gray-200">
                        <div className="flex gap-1">
                            {tabs.map((tab) => (
                                <button
                                    type="button"
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                        ? "border-green-900 text-green-900"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Input fields */}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-4">
                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Masukkan username"
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
                                    placeholder="Masukkan email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border rounded px-3 py-2 text-sm focus:ring-1 outline-none focus:ring-[#005429]"
                                />
                                {formErrors.email && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {formErrors.email}
                                    </p>
                                )}
                            </div>

                            {/* Telepon */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nomor Telepon <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Masukkan nomor telepon"
                                    value={phone}
                                    onChange={(e) => {
                                        const onlyNums = e.target.value.replace(/\D/g, "");
                                        setPhone(onlyNums);
                                    }}
                                    className="w-full border rounded px-3 py-2 text-sm focus:ring-1 outline-none focus:ring-[#005429]"
                                />
                                {formErrors.phone && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {formErrors.phone}
                                    </p>
                                )}
                            </div>

                            {/* Role select - filtered based on active tab */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    options={roleOptions}
                                    value={roleOptions.find((opt) => opt.value === employeeType)}
                                    onChange={(opt) => setEmployeeType(opt.value)}
                                    placeholder="Pilih role..."
                                    styles={customSelectStyles}
                                />
                                {formErrors.employeeType && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {formErrors.employeeType}
                                    </p>
                                )}
                            </div>

                            {/* Password atau PIN berdasarkan tab */}
                            {activeTab === "cashier" ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        PIN (4 digit) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative w-1/2">
                                        <input
                                            type={showPin ? "text" : "password"}
                                            placeholder="Masukkan PIN 4 digit"
                                            value={pin}
                                            maxLength={4}
                                            onChange={(e) => {
                                                // Hanya izinkan angka
                                                const onlyNums = e.target.value.replace(/\D/g, "");
                                                setPin(onlyNums);
                                            }}
                                            className="w-full border rounded px-3 py-2 pr-10 text-sm focus:ring-1 outline-none focus:ring-[#005429]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPin(!showPin)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPin ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                    {formErrors.pin && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {formErrors.pin}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative w-1/2">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Masukkan password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full border rounded px-3 py-2 pr-10 text-sm focus:ring-1 outline-none focus:ring-[#005429]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                    {formErrors.password && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {formErrors.password}
                                        </p>
                                    )}
                                </div>
                            )}
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
                                <p className="text-sm text-gray-400">
                                    Outlet tidak ditemukan.
                                </p>
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

export default CreateUser;