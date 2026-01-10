import axios from "axios";
import React, { useState, useEffect } from "react";
import Select from "react-select";
import {
    FaChevronRight,
    FaIdBadge,
    FaEye,
    FaEyeSlash,
} from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import MessageAlert from "../../../components/messageAlert";
import { useSelector } from "react-redux";
import UpdateUserSkeleton from "./update_user_skeleton";

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
    const { id } = useParams();
    const navigate = useNavigate();

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
    const [cashierType, setCashierType] = useState("");
    const [formErrors, setFormErrors] = useState({});
    const [submitAction, setSubmitAction] = useState("exit");
    const [alertMsg, setAlertMsg] = useState("");

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

    const cashierTypeOptions = [
        { value: "bar-1-amphi", label: "Bar 1 Amphi" },
        { value: "bar-2-amphi", label: "Bar 2 Amphi" },
        { value: "bar-3-amphi", label: "Bar 3 Amphi" },
        { value: "bar-tp", label: "Bar TP" },
        { value: "bar-dp", label: "Bar DP" },
        { value: "drive-thru", label: "Drive Thru" },
        { value: "event", label: "Event" },
    ];

    // Tentukan tab berdasarkan role user yang sedang di-edit
    const determineTabFromRole = (roleName) => {
        const lowerRole = roleName?.toLowerCase();

        if (["cashier", "cashier junior", "cashier senior"].includes(lowerRole)) {
            return "cashier";
        } else if (lowerRole === "customer") {
            return "customer";
        } else {
            return "staff";
        }
    };

    const fetchRoles = async (userRole = null) => {
        try {
            const res = await axios.get("/api/roles", {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });

            // Filter roles berdasarkan tab aktif
            let filtered = res.data;
            const currentTab = tabs.find(t => t.id === activeTab);

            if (currentTab.roles) {
                filtered = res.data.filter(role =>
                    currentTab.roles.some(r => r.toLowerCase() === role.name.toLowerCase())
                );
            } else if (currentTab.exclude) {
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
        }
    };

    // Fetch data user by ID
    const fetchUser = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/user/getUSerById/${id}`, {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            const u = res.data;

            setUsername(u.username || "");
            setEmail(u.email || "");
            setPhone(u.phone || "");
            setCashierType(u.cashierType || "");

            // ✅ Handle role sebagai object atau string
            const roleId = typeof u.role === 'object' ? u.role._id : u.role;
            setEmployeeType(roleId || "");

            // ✅ Handle outlet array - extract _id dari setiap outlet object
            const outletIds = u.outlet?.map((o) => {
                // Jika outlet adalah object dengan _id langsung
                if (o._id) return o._id;
                // Jika outlet punya outletId property
                if (o.outletId) return typeof o.outletId === 'object' ? o.outletId._id : o.outletId;
                return o;
            }).filter(Boolean) || [];

            setSelectedOutlets(outletIds);

            // ✅ Tentukan tab berdasarkan role name
            const roleName = typeof u.role === 'object' ? u.role.name : u.role;
            const tab = determineTabFromRole(roleName);
            setActiveTab(tab);

            setError(null);
        } catch (err) {
            setError("Gagal memuat data user.");
            console.error("Error fetching user:", err);
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
    }, [id]);

    // Refetch roles ketika tab berubah
    useEffect(() => {
        if (!loading) {
            fetchRoles();
        }
    }, [activeTab, loading]);

    const filteredOutlets = outlets.filter((o) =>
        o.name.toLowerCase().includes(search.toLowerCase())
    );

    const toggleOutlet = (outletId) => {
        setSelectedOutlets((prev) =>
            prev.includes(outletId) ? prev.filter((x) => x !== outletId) : [...prev, outletId]
        );
    };

    const validateForm = () => {
        let errors = {};
        if (!employeeType) errors.employeeType = "Pilih role wajib.";
        if (!username) errors.username = "Username wajib diisi.";
        if (!email) errors.email = "Email wajib diisi.";
        if (!phone) errors.phone = "Nomor telepon wajib diisi.";

        // Validasi cashier type untuk tab cashier
        if (activeTab === "cashier" && !cashierType) {
            errors.cashierType = "Tipe kasir wajib diisi.";
        }

        // Validasi password/PIN jika diisi
        if (activeTab === "cashier" && pin && pin.length !== 4) {
            errors.pin = "PIN harus 4 digit.";
        }

        if (selectedOutlets.length === 0)
            errors.outlets = "Minimal pilih 1 outlet.";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const payload = {
            username,
            email,
            phone,
            role: employeeType,
            outlets: selectedOutlets,
            cashierType: activeTab === "cashier" ? cashierType : null
        };

        // Hanya kirim password jika diisi
        if (activeTab === "cashier" && pin) {
            payload.password = pin;
        } else if (activeTab !== "cashier" && password) {
            payload.password = password;
        }

        try {
            await axios.put(
                `/api/user/update/${id}`,
                payload,
                {
                    headers: { Authorization: `Bearer ${currentUser.token}` },
                }
            );

            if (submitAction === "exit") {
                navigate("/admin/access-settings/user", {
                    state: { success: "User berhasil diperbarui!" },
                });
            } else {
                setAlertMsg("User berhasil diperbarui!");
                setPassword("");
                setPin("");
            }
        } catch (err) {
            alert(err.response?.data?.message || "Gagal update user");
        }
    };

    if (loading) return <UpdateUserSkeleton />;
    if (error) return <p className="text-center py-8 text-red-500">{error}</p>;

    return (
        <div className="text-gray-700">
            <MessageAlert message={alertMsg} type="success" />

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
                        <span>User</span>
                        <FaChevronRight />
                        <span className="text-[#005429] font-medium">Edit User</span>
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
                            onClick={() => setSubmitAction("exit")}
                            className="px-4 py-2 text-sm bg-[#005429] text-white rounded hover:opacity-90"
                        >
                            Update
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
                    <div className="space-y-4">
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
                                value={phone}
                                onChange={(e) => {
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
                                placeholder="Pilih role..."
                                styles={customSelectStyles}
                            />
                            {formErrors.employeeType && (
                                <p className="text-xs text-red-500 mt-1">
                                    {formErrors.employeeType}
                                </p>
                            )}
                        </div>

                        {/* Cashier Type - hanya muncul di tab cashier */}
                        {activeTab === "cashier" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipe Kasir <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    options={cashierTypeOptions}
                                    value={cashierTypeOptions.find((opt) => opt.value === cashierType)}
                                    onChange={(opt) => setCashierType(opt.value)}
                                    placeholder="Pilih tipe kasir..."
                                    styles={customSelectStyles}
                                />
                                {formErrors.cashierType && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {formErrors.cashierType}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Password atau PIN berdasarkan tab */}
                        {activeTab === "cashier" ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    PIN (4 digit) <span className="text-gray-500">(kosongkan jika tidak ingin diubah)</span>
                                </label>
                                <div className="relative w-1/2">
                                    <input
                                        type={showPin ? "text" : "password"}
                                        placeholder="Masukkan PIN 4 digit"
                                        value={pin}
                                        maxLength={4}
                                        onChange={(e) => {
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
                                    Password <span className="text-gray-500">(kosongkan jika tidak ingin diubah)</span>
                                </label>
                                <div className="relative w-1/2">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Masukkan password baru"
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
                            </div>
                        )}
                    </div>

                    {/* Outlet pilihan */}
                    {activeTab !== "customer" && (
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
                    )}
                </div>
            </form>
        </div>
    );
};

export default UpdateUser;