// import axios from "axios";
// import React, { useState, useEffect } from "react";
// import Select from "react-select";
// import {
//     FaBell,
//     FaChevronRight,
//     FaIdBadge,
//     FaUser,
// } from "react-icons/fa";
// import { Link, useNavigate } from "react-router-dom";
// import MessageAlert from "../../../components/messageAlert";
// import Header from "../../admin/header";

// const CreateRole = () => {

//     const customSelectStyles = {
//         control: (provided, state) => ({
//             ...provided,
//             borderColor: "#d1d5db",
//             minHeight: "34px",
//             fontSize: "13px",
//             color: "#6b7280",
//             boxShadow: state.isFocused ? "0 0 0 1px #005429" : "none",
//             "&:hover": {
//                 borderColor: "#9ca3af",
//             },
//         }),
//         singleValue: (provided) => ({
//             ...provided,
//             color: "#6b7280",
//         }),
//         input: (provided) => ({
//             ...provided,
//             color: "#6b7280",
//         }),
//         placeholder: (provided) => ({
//             ...provided,
//             color: "#9ca3af",
//             fontSize: "13px",
//         }),
//         option: (provided, state) => ({
//             ...provided,
//             fontSize: "13px",
//             color: "#374151",
//             backgroundColor: state.isFocused ? "rgba(0, 84, 41, 0.1)" : "white",
//             cursor: "pointer",
//         }),
//         menuPortal: (base) => ({ ...base, zIndex: 9999 }),
//     };

//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [outlets, setOutlets] = useState([]);
//     const [search, setSearch] = useState("");
//     const [selectedOutlets, setSelectedOutlets] = useState([]);
//     const [employeeType, setEmployeeType] = useState(""); // role
//     const [name, setName] = useState("");
//     const [username, setUsername] = useState("");
//     const [email, setEmail] = useState("");
//     const [phone, setPhone] = useState("");
//     const [pin, setPin] = useState("");
//     const [password, setPassword] = useState("");
//     const [formErrors, setFormErrors] = useState({});
//     const [submitAction, setSubmitAction] = useState("stay"); // default stay
//     const [alertMsg, setAlertMsg] = useState("");
//     const navigate = useNavigate();

//     const roleOptions = [
//         { value: "admin", label: "Admin" },
//         { value: "customer", label: "Customer" },
//         { value: "waiter", label: "Waiter" },
//         { value: "kitchen", label: "Kitchen" },
//         { value: "cashier_junior", label: "Cashier Junior" },
//         { value: "cashier_senior", label: "Cashier Senior" },
//         { value: "akuntan", label: "Akuntan" },
//         { value: "inventory", label: "Inventory" },
//         { value: "marketing", label: "Marketing" },
//         { value: "operational", label: "Operational" },
//         { value: "qc", label: "Qc" },
//         { value: "hrd", label: "HRD" },
//     ];

//     // Fetch outlet list
//     const fetchData = async () => {
//         setLoading(true);
//         try {
//             const res = await axios.get("/api/outlet");
//             const data = Array.isArray(res.data)
//                 ? res.data
//                 : Array.isArray(res.data.data)
//                     ? res.data.data
//                     : [];
//             setOutlets(data);
//             setError(null);
//         } catch (err) {
//             setError("Gagal memuat data outlet.");
//             setOutlets([]);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchData();
//     }, []);

//     const filteredOutlets = outlets.filter((o) =>
//         o.name.toLowerCase().includes(search.toLowerCase())
//     );

//     const toggleOutlet = (id) => {
//         setSelectedOutlets((prev) =>
//             prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
//         );
//     };

//     const validateForm = () => {
//         let errors = {};
//         if (!employeeType) errors.employeeType = "Pilih role wajib.";
//         // if (!name) errors.name = "Nama wajib diisi.";
//         if (!username) errors.username = "Username wajib diisi.";
//         if (employeeType === "staff" && !email)
//             errors.email = "Email wajib diisi.";
//         if (!phone) errors.phone = "Nomor telepon wajib diisi.";
//         // if (!pin || pin.length !== 4)
//         //     errors.pin = "PIN wajib 4 digit.";
//         if (!password)
//             errors.password = "Password wajib diisi.";
//         if (selectedOutlets.length === 0)
//             errors.outlets = "Minimal pilih 1 outlet.";

//         setFormErrors(errors);
//         return Object.keys(errors).length === 0;
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         if (!validateForm()) return;

//         try {
//             const res = await axios.post("/api/user/create", {
//                 name: username,
//                 username,
//                 email,
//                 phone,
//                 password: password,
//                 role: employeeType,
//                 outlets: selectedOutlets,
//             });

//             if (submitAction === "exit") {
//                 fetchData();
//                 navigate("/admin/access-settings/user", {
//                     state: { success: "Karyawan berhasil dibuat!" },
//                 });
//             } else {
//                 // tetap di halaman, reset form
//                 setName("");
//                 setUsername("");
//                 setEmail("");
//                 setPhone("");
//                 setPin("");
//                 setEmployeeType("");
//                 setSelectedOutlets([]);

//                 setAlertMsg("Karyawan berhasil dibuat!"); // ✅ langsung show di page yg sama
//             }
//         } catch (err) {
//             alert(err.response?.data?.message || "Gagal membuat karyawan");
//         }
//     };

//     if (loading) return <p className="text-center py-8">Loading...</p>;
//     if (error) return <p className="text-center py-8 text-red-500">{error}</p>;

//     return (
//         <div className="min-h-screen bg-gray-50 text-gray-700">
//             {/* Header */}
//             <Header />

//             <MessageAlert message={alertMsg} type="success" />

//             {/* Form Container */}
//             <form
//                 className="max-w-5xl mx-auto mt-6 mb-12 bg-white shadow rounded-lg overflow-hidden"
//                 autoComplete="off"
//                 onSubmit={handleSubmit}
//             >
//                 {/* Breadcrumb + Actions */}
//                 <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
//                     <div className="flex items-center text-sm text-gray-500 space-x-2">
//                         <FaIdBadge />
//                         <span>Role</span>
//                         <FaChevronRight />
//                         <span className="text-[#005429] font-medium">
//                             Tambah Role
//                         </span>
//                     </div>
//                     <div className="flex space-x-2">
//                         <Link
//                             to="/admin/access-settings/user"
//                             className="px-4 py-2 text-sm border border-[#005429] text-[#005429] rounded hover:bg-[#005429] hover:text-white transition"
//                         >
//                             Batal
//                         </Link>
//                         <button
//                             type="submit"
//                             onClick={() => setSubmitAction("stay")}
//                             className="px-4 py-2 text-sm bg-[#005429] text-white rounded hover:opacity-90"
//                         >
//                             Simpan
//                         </button>
//                         <button
//                             type="submit"
//                             onClick={() => setSubmitAction("exit")}
//                             className="px-4 py-2 text-sm bg-[#005429] text-white rounded hover:opacity-90"
//                         >
//                             Simpan & Keluar
//                         </button>
//                     </div>
//                 </div>

//                 {/* Content */}
//                 <div className="p-6 space-y-6">

//                     {/* Input fields */}
//                     <div className="grid grid-cols-1 gap-6">
//                         {/* Left */}
//                         <div className="space-y-4">
//                             {/* Nama */}
//                             {/* <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                                     Nama <span className="text-red-500">*</span>
//                                 </label>
//                                 <input
//                                     type="text"
//                                     placeholder="Masukkan nama"
//                                     value={name}
//                                     onChange={(e) => setName(e.target.value)}
//                                     className="w-full border rounded px-3 py-2 text-sm focus:ring-1 outline-none focus:ring-[#005429]"
//                                 />
//                                 {formErrors.name && (
//                                     <p className="text-xs text-red-500 mt-1">
//                                         {formErrors.name}
//                                     </p>
//                                 )}
//                             </div> */}

//                             {/* Username */}
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                                     Username <span className="text-red-500">*</span>
//                                 </label>
//                                 <input
//                                     type="text"
//                                     placeholder="Masukkan username"
//                                     value={username}
//                                     onChange={(e) => setUsername(e.target.value)}
//                                     className="w-full border rounded px-3 py-2 text-sm focus:ring-1 outline-none focus:ring-[#005429]"
//                                 />
//                                 {formErrors.username && (
//                                     <p className="text-xs text-red-500 mt-1">
//                                         {formErrors.username}
//                                     </p>
//                                 )}
//                             </div>

//                             {/* Email khusus staff */}
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                                     Email <span className="text-red-500">*</span>
//                                 </label>
//                                 <input
//                                     type="email"
//                                     placeholder="Masukkan email"
//                                     value={email}
//                                     onChange={(e) => setEmail(e.target.value)}
//                                     className="w-full border rounded px-3 py-2 text-sm focus:ring-1 outline-none focus:ring-[#005429]"
//                                 />
//                                 {formErrors.email && (
//                                     <p className="text-xs text-red-500 mt-1">
//                                         {formErrors.email}
//                                     </p>
//                                 )}
//                             </div>

//                             {/* Telepon */}
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                                     Nomor Telepon <span className="text-red-500">*</span>
//                                 </label>
//                                 <input
//                                     type="text"
//                                     placeholder="Masukkan nomor telepon"
//                                     value={phone}
//                                     onChange={(e) => {
//                                         // Hanya izinkan angka
//                                         const onlyNums = e.target.value.replace(/\D/g, "");
//                                         setPhone(onlyNums);
//                                     }}
//                                     className="w-full border rounded px-3 py-2 text-sm focus:ring-1 outline-none focus:ring-[#005429]"
//                                 />
//                                 {formErrors.phone && (
//                                     <p className="text-xs text-red-500 mt-1">
//                                         {formErrors.phone}
//                                     </p>
//                                 )}
//                             </div>

//                             {/* Role select */}
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                                     Role <span className="text-red-500">*</span>
//                                 </label>
//                                 <Select
//                                     options={roleOptions}
//                                     value={roleOptions.find((opt) => opt.value === employeeType)}
//                                     onChange={(opt) => setEmployeeType(opt.value)}
//                                     placeholder="Pilih role karyawan..."
//                                     className="text-sm"
//                                     styles={customSelectStyles}
//                                 />
//                                 {formErrors.employeeType && (
//                                     <p className="text-xs text-red-500 mt-1">
//                                         {formErrors.employeeType}
//                                     </p>
//                                 )}
//                             </div>

//                             {/* PIN */}
//                             {/* <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                                     PIN (4 digit) <span className="text-red-500">*</span>
//                                 </label>
//                                 <input
//                                     type="password"
//                                     maxLength="4"
//                                     placeholder="Masukkan PIN"
//                                     value={pin}
//                                     onChange={(e) => setPin(e.target.value)}
//                                     className="w-1/2 border rounded px-3 py-2 text-sm focus:ring-1 outline-none focus:ring-[#005429]"
//                                 />
//                                 {formErrors.pin && (
//                                     <p className="text-xs text-red-500 mt-1">
//                                         {formErrors.pin}
//                                     </p>
//                                 )}
//                             </div> */}
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                                     Password <span className="text-red-500">*</span>
//                                 </label>
//                                 <input
//                                     type="password"
//                                     placeholder="Masukkan password"
//                                     value={password} // bisa ganti state name ke password kalau mau lebih rapi
//                                     onChange={(e) => setPassword(e.target.value)}
//                                     className="w-1/2 border rounded px-3 py-2 text-sm focus:ring-1 outline-none focus:ring-[#005429]"
//                                 />
//                                 {formErrors.password && (
//                                     <p className="text-xs text-red-500 mt-1">
//                                         {formErrors.password}
//                                     </p>
//                                 )}
//                             </div>
//                         </div>
//                     </div>

//                     {/* Outlet pilihan */}
//                     <div>
//                         <label className="block text-sm font-semibold mb-2">
//                             Outlet <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                             type="text"
//                             placeholder="Cari outlet..."
//                             value={search}
//                             onChange={(e) => setSearch(e.target.value)}
//                             className="w-full border rounded px-3 py-2 text-sm mb-3 focus:ring-1 outline-none focus:ring-[#005429]"
//                         />
//                         <div className="border rounded p-3 max-h-64 overflow-y-auto space-y-2 bg-gray-50">
//                             {filteredOutlets.map((outlet) => (
//                                 <label
//                                     key={outlet._id}
//                                     className="flex items-center space-x-2 text-sm cursor-pointer"
//                                 >
//                                     <input
//                                         type="checkbox"
//                                         checked={selectedOutlets.includes(outlet._id)}
//                                         onChange={() => toggleOutlet(outlet._id)}
//                                         className="accent-[#005429] w-4 h-4"
//                                     />
//                                     <span>{outlet.name}</span>
//                                 </label>
//                             ))}
//                             {filteredOutlets.length === 0 && (
//                                 <p className="text-sm text-gray-400">
//                                     Outlet tidak ditemukan.
//                                 </p>
//                             )}
//                         </div>
//                         {formErrors.outlets && (
//                             <p className="text-xs text-red-500 mt-1">
//                                 {formErrors.outlets}
//                             </p>
//                         )}
//                     </div>
//                 </div>
//             </form>
//         </div>
//     );
// };

// export default CreateRole;


import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
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

const CreateRole = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        permissions: [],
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

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
            setMessage(res.data.message);
            setFormData({ name: "", description: "", permissions: [] });
            navigate("/admin/access-settings/role", {
                state: { success: "Role berhasil dibuat!" },
            });
        } catch (err) {
            setMessage(err.response?.data?.message || "Error creating role");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <Header />
            <div className="p-6 max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">Create New Role</h1>

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
                            {loading ? "Saving..." : "Simpan"}
                        </button>
                        <Link to="/admin/access-settings/role"
                            className="px-4 py-2 bg-white text-[#005429] rounded-lg border border-[#005429]">Kembali</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRole;
