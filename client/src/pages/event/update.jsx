import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Select from "react-select";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaTimes, FaUpload } from "react-icons/fa";
import { useSelector } from "react-redux";

const UpdateEvent = () => {
    const { currentUser } = useSelector((state) => state.user);
    const { id } = useParams();
    const navigate = useNavigate();
    const fileRef = useRef(null);

    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: state.isFocused ? '#005429' : '#e5e7eb',
            minHeight: '44px',
            fontSize: '14px',
            borderRadius: '10px',
            boxShadow: state.isFocused ? '0 0 0 3px rgba(0, 84, 41, 0.1)' : 'none',
            '&:hover': {
                borderColor: '#005429',
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#1f2937',
        }),
        input: (provided) => ({
            ...provided,
            color: '#1f2937',
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9ca3af',
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.08)' : 'white',
            color: state.isSelected ? '#005429' : '#1f2937',
            fontWeight: state.isSelected ? '600' : '400',
            cursor: 'pointer',
            '&:active': {
                backgroundColor: 'rgba(0, 84, 41, 0.15)',
            }
        }),
        menu: (provided) => ({
            ...provided,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            borderRadius: '10px',
            overflow: 'hidden',
        }),
    };

    const [outlets, setOutlets] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [compressedImageURL, setCompressedImageURL] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        name: "",
        description: "",
        location: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        price: "",
        organizer: "",
        contactEmail: "",
        contactPhone: "",
        imageUrl: "",
        category: "",
        tags: "",
        status: "upcoming",
        capacity: "",
        privacy: "public",
        terms: "",
        availableAt: [],
        workstation: ""
    });

    // Fetch outlets
    useEffect(() => {
        const fetchOutlets = async () => {
            try {
                const response = await axios.get("/api/outlet", {
                    headers: { Authorization: `Bearer ${currentUser.token}` }
                });
                if (response.data.success) {
                    setOutlets(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching outlets:", error);
            }
        };
        fetchOutlets();
    }, [currentUser.token]);

    // Fetch event detail
    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await axios.get(`/api/event/${id}`, {
                    headers: { Authorization: `Bearer ${currentUser.token}` },
                });
                const data = res.data.data;

                // Parse date and time
                const startDate = data.date ? new Date(data.date) : null;
                const endDate = data.endDate ? new Date(data.endDate) : null;

                // Parse availableAt - bisa berupa array of strings atau array of objects
                let parsedAvailableAt = [];
                if (Array.isArray(data.availableAt)) {
                    parsedAvailableAt = data.availableAt.map(outlet => {
                        if (typeof outlet === 'string') {
                            return outlet;
                        } else if (outlet && outlet._id) {
                            return outlet._id;
                        }
                        return outlet;
                    });
                }

                const formData = {
                    name: data.name || "",
                    description: data.description || "",
                    location: data.location || "",
                    startDate: startDate ? startDate.toISOString().split('T')[0] : "",
                    startTime: startDate ? startDate.toISOString().split('T')[1].substring(0, 5) : "",
                    endDate: endDate ? endDate.toISOString().split('T')[0] : "",
                    endTime: endDate ? endDate.toISOString().split('T')[1].substring(0, 5) : "",
                    price: data.price || "",
                    organizer: data.organizer || "",
                    contactEmail: data.contactEmail || "",
                    contactPhone: data.contactPhone || "",
                    imageUrl: data.imageUrl || "",
                    category: data.category || "",
                    tags: data.tags ? data.tags.join(", ") : "",
                    status: data.status || "upcoming",
                    capacity: data.capacity || "",
                    privacy: data.privacy || "public",
                    terms: data.terms || "",
                    availableAt: data.menuItem?.availableAt,
                    workstation: data.menuItem?.workstation || ""
                };

                console.log("Form data set:", formData);
                setForm(formData);
                setCompressedImageURL(data.imageUrl || null);
            } catch (err) {
                console.error("Gagal load event:", err);
                alert("Gagal memuat data event");
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id, currentUser.token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validasi tipe file
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP');
            return;
        }

        // Validasi ukuran file (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('Ukuran file terlalu besar. Maksimal 5MB');
            return;
        }

        setImageFile(file);
        setCompressedImageURL(URL.createObjectURL(file));
    };

    const compressImage = (file, quality = 0.6, maxWidth = 800) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;

                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const scale = maxWidth / img.width;
                    canvas.width = maxWidth;
                    canvas.height = img.height * scale;

                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    canvas.toBlob(
                        (blob) => {
                            if (!blob) return reject("Blob is null");
                            resolve(blob);
                        },
                        "image/jpeg",
                        quality
                    );
                };

                img.onerror = (err) => reject(err);
            };

            reader.onerror = (err) => reject(err);
        });
    };

    const uploadToPHP = async (file) => {
        try {
            setUploading(true);
            const compressedBlob = await compressImage(file);
            const formData = new FormData();
            formData.append('image', compressedBlob, file.name);
            formData.append('kategori', 'menu');

            const response = await axios.post('https://img.barajacoffee.com/api.php', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                return response.data.imageURL;
            } else {
                throw new Error(response.data.message || 'Upload gagal');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Gagal upload gambar: ' + (error.response?.data?.message || error.message));
            throw error;
        } finally {
            setUploading(false);
        }
    };

    const handleOutletToggle = (outletId) => {
        setForm(prev => {
            const availableAt = prev.availableAt.includes(outletId)
                ? prev.availableAt.filter(id => id !== outletId)
                : [...prev.availableAt, outletId];
            return { ...prev, availableAt };
        });
    };

    const privacyOptions = [
        { value: "public", label: "Public" },
        { value: "private", label: "Private" }
    ];

    const statusOptions = [
        { value: "upcoming", label: "Upcoming" },
        { value: "ongoing", label: "Ongoing" },
        { value: "completed", label: "Completed" }
    ];

    const workstationOptions = [
        { value: "bar", label: "Bar" },
        { value: "kitchen", label: "Kitchen" },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let imageURL = form.imageUrl;

            // Upload image baru jika ada
            if (imageFile) {
                imageURL = await uploadToPHP(imageFile);
            }

            // Combine date and time
            const startDateTime = `${form.startDate}T${form.startTime}:00.000Z`;
            const endDateTime = `${form.endDate}T${form.endTime}:00.000Z`;

            const payload = {
                name: form.name,
                description: form.description,
                location: form.location,
                date: startDateTime,
                endDate: endDateTime,
                price: Number(form.price),
                organizer: form.organizer,
                contactEmail: form.contactEmail,
                contactPhone: form.contactPhone,
                imageUrl: imageURL,
                category: form.category,
                tags: form.tags.split(",").map((tag) => tag.trim()).filter(tag => tag),
                capacity: Number(form.capacity),
                privacy: form.privacy,
                terms: form.terms,
                availableAt: form.availableAt,
                workstation: form.workstation,
                status: form.status
            };

            console.log("Update data:", payload);
            await axios.put(`/api/event/${id}`, payload, {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            alert("Event berhasil diperbarui");
            navigate("/admin/event");
        } catch (error) {
            console.error("Error updating event:", error);
            alert("Gagal memperbarui event");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Update Event</h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
                {/* Main Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-200 bg-[#005429]">
                    </div>

                    <div className="p-6">
                        {/* Section 1: Basic Information */}
                        <div className="mb-8">
                            <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-gray-200">
                                <h2 className="text-base font-bold text-gray-800">Informasi Dasar</h2>
                            </div>

                            <div className="space-y-5">
                                {/* Nama Event */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Nama Event <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 focus:border-[#005429] transition-all"
                                        placeholder="Workshop Barista Professional"
                                        required
                                    />
                                </div>

                                {/* Deskripsi */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Deskripsi <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 focus:border-[#005429] transition-all resize-none"
                                        placeholder="Jelaskan secara detail tentang event ini..."
                                        rows="5"
                                        required
                                    />
                                </div>

                                {/* Upload Gambar */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Gambar Event
                                    </label>

                                    <div className="flex items-center space-x-4 py-4">
                                        {compressedImageURL ? (
                                            <img
                                                src={compressedImageURL}
                                                alt="Preview"
                                                className="h-24 w-24 object-cover rounded cursor-pointer"
                                                onClick={() => fileRef.current.click()}
                                            />
                                        ) : (
                                            <div
                                                className="h-24 w-24 flex items-center justify-center bg-gray-200 rounded cursor-pointer"
                                                onClick={() => fileRef.current.click()}
                                            >
                                                <span className="text-gray-500 text-xl">+</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                            ref={fileRef}
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                        {compressedImageURL && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setCompressedImageURL(null);
                                                }}
                                                className="text-red-500 text-sm hover:underline"
                                            >
                                                Hapus gambar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Location & Schedule */}
                        <div className="mb-8">
                            <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-gray-200">
                                <h2 className="text-base font-bold text-gray-800">Lokasi & Jadwal</h2>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {/* Lokasi */}
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Lokasi <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={form.location}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 focus:border-[#005429] transition-all"
                                        placeholder="Main Cafe - Training Room"
                                        required
                                    />
                                </div>

                                {/* Tanggal Mulai */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tanggal Mulai <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={form.startDate}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 focus:border-[#005429] transition-all"
                                        required
                                    />
                                </div>

                                {/* Waktu Mulai */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Waktu Mulai <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        name="startTime"
                                        value={form.startTime}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 focus:border-[#005429] transition-all"
                                        required
                                    />
                                </div>

                                {/* Tanggal Selesai */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tanggal Selesai <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={form.endDate}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 focus:border-[#005429] transition-all"
                                        required
                                    />
                                </div>

                                {/* Waktu Selesai */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Waktu Selesai <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        name="endTime"
                                        value={form.endTime}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 focus:border-[#005429] transition-all"
                                        required
                                    />
                                </div>

                                {/* Kategori */}
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Kategori
                                    </label>
                                    <input
                                        type="text"
                                        name="category"
                                        value={form.category}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 focus:border-[#005429] transition-all"
                                        placeholder="Workshop, Seminar, Training"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Pricing & Capacity */}
                        <div className="mb-8">
                            <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-gray-200">
                                <h2 className="text-base font-bold text-gray-800">Harga & Kapasitas</h2>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Harga Tiket (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={form.price}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 focus:border-[#005429] transition-all"
                                        placeholder="350000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Kapasitas Peserta
                                    </label>
                                    <input
                                        type="number"
                                        name="capacity"
                                        value={form.capacity}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 focus:border-[#005429] transition-all"
                                        placeholder="15"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Organizer Info */}
                        <div className="mb-8">
                            <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-gray-200">
                                <h2 className="text-base font-bold text-gray-800">Informasi Penyelenggara</h2>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Nama Penyelenggara
                                    </label>
                                    <input
                                        type="text"
                                        name="organizer"
                                        value={form.organizer}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 focus:border-[#005429] transition-all"
                                        placeholder="Coffee Masters Academy"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email Kontak
                                    </label>
                                    <input
                                        type="email"
                                        name="contactEmail"
                                        value={form.contactEmail}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 focus:border-[#005429] transition-all"
                                        placeholder="workshop@coffeemasters.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Nomor Telepon
                                    </label>
                                    <input
                                        type="tel"
                                        name="contactPhone"
                                        value={form.contactPhone}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 focus:border-[#005429] transition-all"
                                        placeholder="+6281234567890"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tags
                                    </label>
                                    <input
                                        type="text"
                                        name="tags"
                                        value={form.tags}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 focus:border-[#005429] transition-all"
                                        placeholder="coffee, barista, training, professional"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Pisahkan dengan koma</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 5: Settings */}
                        <div className="mb-8">
                            <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-gray-200">
                                <h2 className="text-base font-bold text-gray-800">Pengaturan Event</h2>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <Select
                                        options={statusOptions}
                                        value={statusOptions.find(option => option.value === form.status)}
                                        onChange={(selected) =>
                                            setForm(prev => ({ ...prev, status: selected.value }))
                                        }
                                        styles={customSelectStyles}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Workstation
                                    </label>
                                    <Select
                                        options={workstationOptions}
                                        value={workstationOptions.find(option => option.value === form.workstation)}
                                        onChange={(selected) =>
                                            setForm(prev => ({ ...prev, workstation: selected?.value || "" }))
                                        }
                                        styles={customSelectStyles}
                                        isClearable
                                        placeholder="Pilih workstation..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Privasi
                                    </label>
                                    <Select
                                        options={privacyOptions}
                                        value={privacyOptions.find(option => option.value === form.privacy)}
                                        onChange={(selected) =>
                                            setForm(prev => ({ ...prev, privacy: selected.value }))
                                        }
                                        styles={customSelectStyles}
                                    />
                                </div>
                            </div>

                            {/* Available At - Checkbox Outlets */}
                            <div className="mt-5">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Tersedia Di Outlet
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {outlets.map((outlet) => (
                                        <label
                                            key={outlet._id}
                                            className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={form.availableAt.includes(outlet._id)}
                                                onChange={() => handleOutletToggle(outlet._id)}
                                                className="mt-1 w-4 h-4 text-[#005429] border-gray-300 rounded focus:ring-[#005429]"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-800">{outlet.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{outlet.city}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {outlets.length === 0 && (
                                    <p className="text-sm text-gray-500 italic">Tidak ada outlet tersedia</p>
                                )}
                            </div>
                        </div>

                        {/* Section 6: Terms */}
                        <div>
                            <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-gray-200">
                                <h2 className="text-base font-bold text-gray-800">Syarat & Ketentuan</h2>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Syarat & Ketentuan <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="terms"
                                    value={form.terms}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 focus:border-[#005429] transition-all resize-none"
                                    placeholder="Contoh: Peserta harus berusia 18+ tahun. Semua materi disediakan. Sertifikat akan diberikan setelah menyelesaikan workshop..."
                                    rows="5"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Footer */}
                    <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                        <p className="text-sm text-gray-500">
                            <span className="text-red-500">*</span> Wajib diisi
                        </p>
                        <div className="flex gap-3">
                            <Link
                                to="/admin/event"
                                className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={uploading}
                                className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#005429] to-[#007038] text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>{uploading ? "Menyimpan..." : "Update Event"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default UpdateEvent;