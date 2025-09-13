import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const ViewMenu = () => {
    const { id } = useParams();
    const [menuItem, setMenuItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMenuItem = async () => {
            try {
                const response = await axios.get(`/api/menu/menu-items/${id}`);
                const menuItem = response.data.data || [];
                setMenuItem(menuItem);
                setLoading(false);
                setImagePreview(menuItem.imageURL);
            } catch (error) {
                console.error("Error fetching menu item:", error);
                setError(error);
                setLoading(false);
            }
        };
        fetchMenuItem();
    }, [id]);

    // Fungsi untuk kembali ke halaman sebelumnya
    const handleGoBack = () => {
        // navigate(-1); // Kembali ke halaman sebelumnya
        // Atau bisa diganti dengan path spesifik
        navigate('/admin/menu');
    };

    // Kondisi loading
    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
        </div>
    );

    // Kondisi error
    if (error) return (
        <div className="flex justify-center items-center h-screen text-red-500">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Ups! Terjadi Kesalahan</h2>
                <p>Tidak dapat memuat item menu. Silakan coba lagi.</p>
            </div>
        </div>
    );

    // Kondisi tidak ada data
    if (!menuItem) return (
        <div className="flex justify-center items-center h-screen text-gray-500">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Item Menu Tidak Ditemukan</h2>
                <p>Maaf, item menu yang Anda cari tidak tersedia.</p>
            </div>
        </div>
    );

    // Kondisi untuk field yang mungkin kosong
    const hasCategories = menuItem.category && menuItem.category.length > 0;
    const hasToppings = menuItem.toppings && menuItem.toppings.length > 0;
    const hasAddons = menuItem.addons && menuItem.addons.length > 0 && menuItem.addons[0].options.length > 0;

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Detail Menu Item</h2>
            <div className="mb-6">
                {imagePreview && (
                    <div className="mt-4">
                        <img src={imagePreview} alt="Image Preview" className="w-full max-h-60 object-cover rounded" />
                    </div>
                )}
            </div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {menuItem.name || 'Nama Tidak Tersedia'}
                    </h1>
                    <p className="text-gray-600">
                        {menuItem.description || 'Deskripsi tidak tersedia'}
                    </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${menuItem.isAvailable
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {menuItem.isAvailable ? 'Tersedia' : 'Tidak Tersedia'}
                </span>
            </div>

            <div className="mb-4">
                <div className="text-2xl font-bold text-green-600">
                    {menuItem.price
                        ? `Rp ${menuItem.price.toLocaleString()}`
                        : 'Harga tidak tersedia'}
                </div>
            </div>

            {hasCategories && (
                <div className="mb-4">
                    <h3 className="font-semibold mb-2 text-gray-700">Kategori</h3>
                    <div className="flex gap-2">
                        {menuItem.category.map((cat, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                            >
                                {cat}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {hasToppings && (
                <div className="mb-4">
                    <h3 className="font-semibold mb-2 text-gray-700">Topping</h3>
                    {menuItem.toppings.map((topping, index) => (
                        <div key={index} className="flex justify-between py-1 px-3">
                            <span>{topping.name}</span>
                            <span className="text-green-600">
                                + Rp {topping.price.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {hasAddons && (
                <div>
                    <h3 className="font-semibold mb-2 text-gray-700">Pilihan Tambahan</h3>
                    {menuItem.addons.map((addon, addonIndex) => (
                        <div key={addonIndex} className="mb-4">
                            <h4 className="font-medium text-gray-600 mb-2">{addon.name}</h4>
                            {addon.options.map((option, optionIndex) => (
                                <div
                                    key={optionIndex}
                                    className={`flex justify-between py-2 px-3 rounded-md ${option.isdefault ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                >
                                    <span>{option.label}</span>
                                    <span className="text-green-600">
                                        {option.price > 0
                                            ? `+ Rp ${option.price.toLocaleString()}`
                                            : 'Gratis'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Pesan tambahan jika tidak ada data tambahan */}
            {!hasCategories && !hasToppings && !hasAddons && (
                <div className="text-center text-gray-500 py-4">
                    Tidak ada informasi tambahan yang tersedia
                </div>
            )}
            <div className="mt-6">
                <button
                    onClick={handleGoBack}
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-300"
                >
                    Kembali
                </button>
            </div>
        </div>
    );
};

export default ViewMenu;