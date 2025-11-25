import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    FaUserPlus,
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
    FaTimes
} from "react-icons/fa";
import axios from "axios";
import { useSelector } from "react-redux";

const CreateCustomer = () => {
    const { currentUser } = useSelector((state) => state.user);
    const cities = [
        "Jakarta", "Bandung", "Surabaya", "Medan", "Semarang",
        "Palembang", "Makassar", "Yogyakarta", "Denpasar", "Balikpapan",
        "Malang", "Tangerang", "Depok", "Bekasi", "Bogor"
    ];

    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: "",
        phone: "",
        member: "",
        email: "",
        date: "",
        role: "68c249f748edd83e0ba3d5d6", // ObjectId role customer
        address: "",
        city: "",
        kode: "",
        notes: "",
        sex: "man"
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            const response = await axios.post(
                '/api/user/create',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${currentUser?.token}`
                    }
                }
            );

            console.log("Customer created:", response.data);
            alert("Pelanggan berhasil ditambahkan!");
            navigate("/admin/customers");
        } catch (err) {
            console.error('Error adding customer:', err);
            const errorMessage = err.response?.data?.message || "Gagal menambahkan pelanggan. Silakan coba lagi.";
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <FaUserPlus className="text-green-600 text-lg" />
                                </div>
                                Tambah Pelanggan Baru
                            </h1>
                            <p className="text-gray-600 mt-1 text-sm">Isi formulir di bawah untuk menambahkan pelanggan baru</p>
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
                                        value={formData.member}
                                        onChange={handleInputChange}
                                        placeholder="ID Member otomatis (opsional)"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Informasi Personal */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <FaVenusMars />
                                Informasi Personal
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Tanggal Lahir */}
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

                            {/* Jenis Kelamin */}
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
                    </div>

                    {/* Informasi Alamat */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <FaMapMarkerAlt />
                                Alamat & Lokasi
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Alamat */}
                            <div className="grid md:grid-cols-3 gap-4 items-start">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 md:pt-3">
                                    <FaMapMarkerAlt className="text-gray-400" />
                                    Alamat Lengkap
                                </label>
                                <div className="md:col-span-2">
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Masukkan alamat lengkap pelanggan"
                                        rows="3"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 resize-none"
                                    />
                                </div>
                            </div>

                            {/* Kota & Kode Pos */}
                            <div className="grid md:grid-cols-3 gap-4 items-start">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 md:pt-3">
                                    <FaCity className="text-gray-400" />
                                    Kota & Kode Pos
                                </label>
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <select
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                                    >
                                        <option value="">-- Pilih Kota --</option>
                                        {cities.map((city, index) => (
                                            <option key={index} value={city}>
                                                {city}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        name="kode"
                                        value={formData.kode}
                                        onChange={handleInputChange}
                                        placeholder="Kode Pos"
                                        maxLength="5"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Catatan */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <FaStickyNote />
                                Catatan Tambahan
                            </h2>
                        </div>
                        <div className="p-6">
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                placeholder="Tambahkan catatan atau informasi penting tentang pelanggan ini..."
                                rows="4"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 resize-none"
                            />
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
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 shadow-lg shadow-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <FaSave />
                                            Simpan Pelanggan
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

export default CreateCustomer;