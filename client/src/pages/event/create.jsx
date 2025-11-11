import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Select from "react-select";
import { Link, useNavigate } from "react-router-dom";
import { FaTimes, FaChevronRight, FaBell, FaUser, FaSearch, FaInfoCircle, FaBoxes, FaChevronLeft, FaTicketAlt, FaPlus } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import Header from "../admin/header";
import { useSelector } from "react-redux";


const CreateEvent = () => {

    const { currentUser } = useSelector((state) => state.user);
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: '#d1d5db', // Tailwind border-gray-300
            minHeight: '36px',
            fontSize: '13px',
            color: '#6b7280', // text-gray-500
            boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none', // blue-500 on focus
            '&:hover': {
                borderColor: '#9ca3af', // Tailwind border-gray-400
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#6b7280', // text-gray-500
        }),
        input: (provided) => ({
            ...provided,
            color: '#6b7280', // text-gray-500 for typed text
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9ca3af', // text-gray-400
            fontSize: '13px',
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '13px',
            color: '#374151', // gray-700
            backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white', // blue-50
            cursor: 'pointer',
        }),
    };

    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        description: "",
        location: "",
        date: null,
        price: "",
        organizer: "",
        contactEmail: "",
        imageUrl: "",
        category: "",
        tags: "",
        status: "upcoming",
        capacity: "",
        privacy: "public",
        terms: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (newValue) => {
        // Convert ke ISO string (sesuai API)
        if (newValue && newValue.startDate) {
            const isoDate = new Date(newValue.startDate).toISOString();
            setForm(prev => ({ ...prev, date: isoDate }));
        } else {
            setForm(prev => ({ ...prev, date: "" }));
        }
    };

    const [imagePreview, setImagePreview] = useState(form.imageUrl || "");

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        document.getElementById("file-upload").value = ""; // reset input file
    };

    const privacyOptions = [
        { value: "public", label: "Public" },
        { value: "private", label: "Private" }
    ];

    const status = [
        { value: "upcoming", label: "Upcoming" },
        { value: "ongoing", label: "Ongoing" },
        { value: "completed", label: "Completed" }
    ]

    const handleSubmit = (e) => {
        e.preventDefault();
        // Convert tags from string to array
        const payload = {
            ...form,
            price: Number(form.price),
            capacity: Number(form.capacity),
            tags: form.tags.split(",").map((tag) => tag.trim())
        };
        console.log("Submit data:", payload);
        axios.post("/api/event", payload, {
            headers: { Authorization: `Bearer ${currentUser.token}` },
        });
        navigate("/admin/event");
    };

    return (
        <div className="">
            {/* Breadcrumb */}
            <div className="px-3 py-2 flex justify-between items-center border-b">
                <div className="flex items-center space-x-2">
                    <FaTicketAlt size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Event</p>
                    <FaChevronRight size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Tambah Event</p>
                </div>
            </div>
            <form
                onSubmit={handleSubmit}
                className="space-y-8 p-8 max-w-5xl mx-auto mb-[60px]"
            >

                {/* Grid Input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nama Event */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Event
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm"
                            placeholder="Masukkan nama event"
                            required
                        />
                    </div>

                    {/* Lokasi */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lokasi
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm"
                            placeholder="Lokasi event"
                            required
                        />
                    </div>

                    {/* Deskripsi */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Deskripsi
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm resize-y min-h-[120px]"
                            placeholder="Ceritakan tentang event ini..."
                            required
                        />
                    </div>

                    {/* Tanggal & Waktu */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tanggal & Waktu
                        </label>
                        <Datepicker
                            primaryColor="green"
                            useRange={false}
                            asSingle={true}
                            value={{
                                startDate: form.date ? new Date(form.date) : null,
                                endDate: form.date ? new Date(form.date) : null,
                            }}
                            onChange={handleDateChange}
                            showShortcuts={false}
                            displayFormat="DD-MM-YYYY HH:mm"
                            showTimePicker={true}
                            inputClassName="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm"
                        />

                    </div>

                    {/* Harga */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Harga Tiket (Rp)
                        </label>
                        <input
                            type="number"
                            name="price"
                            value={form.price}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm"
                            placeholder="150000"
                        />
                    </div>

                    {/* Penyelenggara */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Penyelenggara
                        </label>
                        <input
                            type="text"
                            name="organizer"
                            value={form.organizer}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm"
                            placeholder="Nama penyelenggara"
                        />
                    </div>

                    {/* Email Kontak */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Kontak
                        </label>
                        <input
                            type="email"
                            name="contactEmail"
                            value={form.contactEmail}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm"
                            placeholder="contoh@email.com"
                        />
                    </div>

                    {/* Gambar Event */}
                    <div>
                        <label className="block font-medium mb-2">Gambar</label>

                        <div className="relative w-40 h-40 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-500">
                            {/* Kotak klik */}
                            <label
                                htmlFor="file-upload"
                                className="w-full h-full flex items-center justify-center cursor-pointer"
                            >
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <span className="text-gray-400 text-center px-2">
                                        <FaPlus size={48} />
                                    </span>
                                )}
                            </label>

                            {/* Tombol hapus */}
                            {imagePreview && (
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                                >
                                    <FaTimes size={14} />
                                </button>
                            )}
                        </div>

                        {/* Input file hidden */}
                        <input
                            id="file-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Kategori */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kategori
                        </label>
                        <input
                            type="text"
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm"
                            placeholder="Contoh: Music, Seminar..."
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tags
                        </label>
                        <input
                            type="text"
                            name="tags"
                            value={form.tags}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm"
                            placeholder="Pisahkan dengan koma"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <Select
                            options={status}
                            value={status.find(option => option.value === form.status)}
                            onChange={(selected) =>
                                setForm(prev => ({ ...prev, status: selected.value }))
                            }
                            classNamePrefix="react-select"
                            styles={customSelectStyles}
                        />
                    </div>


                    {/* Kapasitas */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kapasitas
                        </label>
                        <input
                            type="number"
                            name="capacity"
                            value={form.capacity}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm"
                            placeholder="300"
                        />
                    </div>

                    {/* Privasi */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Privasi
                        </label>
                        <Select
                            options={privacyOptions}
                            value={privacyOptions.find(option => option.value === form.privacy)}
                            onChange={(selected) =>
                                setForm(prev => ({ ...prev, privacy: selected.value }))
                            }
                            classNamePrefix="react-select"
                            styles={customSelectStyles}
                        />
                    </div>

                    {/* Syarat & Ketentuan */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Syarat & Ketentuan
                        </label>
                        <textarea
                            name="terms"
                            value={form.terms}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm resize-y min-h-[100px]"
                            placeholder="Tulis syarat & ketentuan..."
                            required
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    <Link
                        to="/admin/event"
                        className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600"
                    >
                        Batal
                    </Link>
                    <button
                        type="submit"
                        className="px-5 py-2.5 rounded-lg border bg-[#005429] text-white"
                    >
                        Simpan
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateEvent;
