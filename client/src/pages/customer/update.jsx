import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    FaUserEdit,
    FaUser,
    FaPhone,
    FaEnvelope,
    FaMapMarkerAlt,
    FaCity,
    FaCalendar,
    FaStickyNote,
    FaIdCard,
    FaVenusMars,
    FaArrowLeft,
    FaSave,
    FaTimes,
    FaPlus,
    FaTrash
} from "react-icons/fa";
import axios from "axios";
import { useSelector } from "react-redux";

const EditCustomer = () => {
    const { id } = useParams();
    const { currentUser } = useSelector((state) => state.user);
    const cities = [
        "Jakarta", "Bandung", "Surabaya", "Medan", "Semarang",
        "Palembang", "Makassar", "Yogyakarta", "Denpasar", "Balikpapan",
        "Malang", "Tangerang", "Depok", "Bekasi", "Bogor"
    ];

    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        username: "",
        phone: "",
        member: "",
        email: "",
        date: "",
        role: "68c249f748edd83e0ba3d5d6",
        address: [], // Array of addresses
        notes: "",
        sex: "man",
        isActive: true
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentAddress, setCurrentAddress] = useState(""); // Temporary address input

    // Fetch customer data
    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const response = await axios.get(
                    `/api/user/getUSerById/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${currentUser?.token}`
                        }
                    }
                );

                const customer = response.data;

                // Format date if exists
                const formattedDate = customer.date
                    ? new Date(customer.date).toISOString().split('T')[0]
                    : "";

                // Handle address - ensure it's an array
                const addressArray = Array.isArray(customer.address)
                    ? customer.address
                    : customer.address
                        ? [customer.address]
                        : [];

                setFormData({
                    _id: customer._id || "",
                    username: customer.username || "",
                    phone: customer.phone || "",
                    member: customer.member || "",
                    email: customer.email || "",
                    date: formattedDate,
                    address: addressArray,
                    notes: customer.notes || customer.catatan || "",
                    sex: customer.sex || "man",
                    isActive: customer.isActive || "",
                });

                setLoading(false);
            } catch (err) {
                console.error('Error fetching customer:', err);
                alert("Gagal memuat data pelanggan.");
                navigate("/admin/customers");
            }
        };

        fetchCustomer();
    }, [id, currentUser, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    // Add address to array
    const handleAddAddress = () => {
        if (currentAddress.trim()) {
            setFormData(prev => ({
                ...prev,
                address: [...prev.address, currentAddress.trim()]
            }));
            setCurrentAddress("");
        }
    };

    // Remove address from array
    const handleRemoveAddress = (index) => {
        setFormData(prev => ({
            ...prev,
            address: prev.address.filter((_, i) => i !== index)
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = "Nama pelanggan wajib diisi";
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "Nomor telepon wajib diisi";
        } else if (!/^[0-9]{10,15}$/.test(formData.phone.replace(/[-\s]/g, ''))) {
            newErrors.phone = "Nomor telepon tidak valid";
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Format email tidak valid";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Pastikan address dikirim sebagai array yang valid
            const dataToSend = {
                ...formData,
                address: formData.address.filter(addr => addr && addr.trim())
            };

            console.log("📤 Data being sent:", dataToSend); // Debug log

            const response = await axios.put(
                `/api/user/update/${id}`,
                dataToSend,
                {
                    headers: {
                        Authorization: `Bearer ${currentUser?.token}`,
                        'Content-Type': 'application/json' // Tambahkan ini
                    }
                }
            );

            console.log("✅ Customer updated:", response.data);
            alert("Pelanggan berhasil diperbarui!");
            navigate("/admin/customers");
        } catch (err) {
            console.error('❌ Error updating customer:', err);
            console.error('Error response:', err.response?.data); // Debug log
            const errorMessage = err.response?.data?.message || "Gagal memperbarui pelanggan. Silakan coba lagi.";
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Memuat data pelanggan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/admin/customers"
                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors duration-200"
                        >
                            <FaArrowLeft className="text-gray-600 text-lg" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FaUserEdit className="text-blue-600 text-lg" />
                                </div>
                                Edit Pelanggan
                            </h1>
                            <p className="text-gray-600 mt-1 text-sm">Perbarui informasi pelanggan</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informasi Dasar */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <FaUser />
                                Informasi Dasar
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Nama Pelanggan */}
                            <div className="grid md:grid-cols-3 gap-4 items-start">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 md:pt-3">
                                    <FaUser className="text-gray-400" />
                                    Nama Pelanggan
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="md:col-span-2">
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        placeholder="Masukkan nama lengkap pelanggan"
                                        className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-all duration-200 ${errors.username
                                            ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                                            : "border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                                            }`}
                                    />
                                    {errors.username && (
                                        <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                                            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                            {errors.username}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Telepon */}
                            <div className="grid md:grid-cols-3 gap-4 items-start">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 md:pt-3">
                                    <FaPhone className="text-gray-400" />
                                    Nomor Telepon
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="md:col-span-2">
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="Contoh: 081234567890"
                                        className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-all duration-200 ${errors.phone
                                            ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                                            : "border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                                            }`}
                                    />
                                    {errors.phone && (
                                        <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                                            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                            {errors.phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Email */}
                            <div className="grid md:grid-cols-3 gap-4 items-start">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 md:pt-3">
                                    <FaEnvelope className="text-gray-400" />
                                    Email
                                </label>
                                <div className="md:col-span-2">
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="customer@email.com"
                                        className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-all duration-200 ${errors.email
                                            ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                                            : "border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                                            }`}
                                    />
                                    {errors.email && (
                                        <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                                            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                            {errors.email}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Member ID */}
                            <div className="grid md:grid-cols-3 gap-4 items-start">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 md:pt-3">
                                    <FaIdCard className="text-gray-400" />
                                    Member ID
                                </label>
                                <div className="md:col-span-2">
                                    <input
                                        type="text"
                                        name="member"
                                        value={formData._id}
                                        onChange={handleInputChange}
                                        placeholder="ID Member (opsional)"
                                        className="w-full px-4 py-3 border-2 bg-gray-100 text-slate-400 border-gray-200 rounded-lg outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Informasi Personal */}
                    {/* <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <FaVenusMars />
                                Informasi Personal
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">

                            <div className="grid md:grid-cols-3 gap-4 items-start">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 md:pt-3">
                                    <FaCalendar className="text-gray-400" />
                                    Tanggal Lahir
                                </label>
                                <div className="md:col-span-2">
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4 items-start">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 md:pt-3">
                                    <FaVenusMars className="text-gray-400" />
                                    Jenis Kelamin
                                </label>
                                <div className="md:col-span-2">
                                    <select
                                        name="sex"
                                        value={formData.sex}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                                    >
                                        <option value="man">Laki-laki</option>
                                        <option value="girl">Perempuan</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div> */}

                    {/* Informasi Alamat */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <FaMapMarkerAlt />
                                Alamat & Lokasi
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid md:grid-cols-3 gap-4 items-start">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 md:pt-3">
                                    <FaMapMarkerAlt className="text-gray-400" />
                                    Alamat Lengkap
                                </label>
                                <div className="md:col-span-2 space-y-3">
                                    {formData.address.length > 0 && (
                                        <div className="space-y-2">
                                            {formData.address.map((addr, index) => (
                                                <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <FaMapMarkerAlt className="text-purple-600 mt-1 flex-shrink-0" />
                                                    <p className="flex-1 text-sm text-gray-700">{addr}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveAddress(index)}
                                                        className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add new address */}
                                    <div className="flex gap-2">
                                        <textarea
                                            value={currentAddress}
                                            onChange={(e) => setCurrentAddress(e.target.value)}
                                            placeholder="Masukkan alamat baru..."
                                            rows="2"
                                            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 resize-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddAddress}
                                            disabled={!currentAddress.trim()}
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-fit"
                                        >
                                            <FaPlus />
                                            Tambah
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Anda dapat menambahkan beberapa alamat (rumah, kantor, dll)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="bg-white rounded-xl shadow-md p-6 sticky bottom-0">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <p className="text-sm text-gray-600">
                                Kolom bertanda <span className="text-red-500 font-semibold">*</span> wajib diisi
                            </p>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <Link
                                    to="/admin/customers"
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-all duration-200"
                                >
                                    <FaTimes />
                                    Batal
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <FaSave />
                                            Update Pelanggan
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCustomer;