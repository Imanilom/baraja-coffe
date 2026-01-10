import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import Select from 'react-select';
import { ArrowLeft, Save, AlertCircle, Loader2 } from 'lucide-react';

const UpdateCategory = () => {
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: state.isFocused ? '#005429' : '#d1d5db',
            minHeight: '42px',
            fontSize: '14px',
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
            fontSize: '14px',
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '14px',
            color: '#374151',
            backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white',
            cursor: 'pointer',
            '&:active': {
                backgroundColor: 'rgba(0, 84, 41, 0.2)',
            },
        }),
    };

    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const categoryOptions = [
        { value: 'food', label: 'Food' },
        { value: 'beverage', label: 'Beverage' },
        { value: 'instan', label: 'Instan' },
        { value: 'event', label: 'Event' }
    ];

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await axios.get(`/api/menu/categories/${id}`);

                // ✅ Handle berbagai format response
                let category;

                if (response.data.data) {
                    // Format: { success: true, data: {...} }
                    category = response.data.data;
                } else if (response.data._id) {
                    // Format: { _id, name, ... } (langsung object)
                    category = response.data;
                } else {
                    throw new Error('Format response tidak valid');
                }

                console.log('Fetched category:', category);

                setName(category.name || '');
                setDescription(category.description || '');
                setType(category.type || '');
            } catch (error) {
                console.error("Error fetching category:", error);
                const errorMsg = error.response?.data?.message ||
                    error.response?.data?.error ||
                    'Gagal memuat data kategori';
                setError(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCategory();
        }
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        // Validasi
        if (!name.trim()) {
            setError('Nama kategori harus diisi');
            setSubmitting(false);
            return;
        }

        if (!type) {
            setError('Tipe kategori harus dipilih');
            setSubmitting(false);
            return;
        }

        try {
            const updatedCategory = {
                name: name.trim(),
                description: description.trim(),
                type,
            };

            console.log('🚀 [UPDATE] Sending request to:', `/api/menu/categories/${id}`);
            console.log('📦 [UPDATE] Payload:', updatedCategory);

            const response = await axios.put(`/api/menu/categories/${id}`, updatedCategory);

            console.log('✅ [UPDATE] Response Status:', response.status);
            console.log('📥 [UPDATE] Response Data:', response.data);
            console.log('📊 [UPDATE] Full Response:', response);

            // ✅ Jika sampai sini berarti request berhasil (tidak throw error)
            // Response status 200-299 dianggap success oleh axios

            // Ambil returnTab dari location.state (default 'category')
            const returnTab = location.state?.returnTab || 'category';

            console.log('🎯 [NAVIGATE] Redirecting to /admin/menu with returnTab:', returnTab);

            // Navigate dengan success message dan returnTab
            navigate('/admin/menu', {
                state: {
                    success: 'Kategori berhasil diperbarui!',
                    returnTab: returnTab
                }
            });

            console.log('✨ [SUCCESS] Navigation completed');

        } catch (err) {
            console.error('❌ [ERROR] Update failed');
            console.error('🔴 [ERROR] Error object:', err);
            console.error('🔴 [ERROR] Error message:', err.message);
            console.error('🔴 [ERROR] Error response:', err.response);
            console.error('🔴 [ERROR] Error request:', err.request);

            // ✅ Cek apakah ini error dari axios atau error lainnya
            if (err.response) {
                // Server responded with error status (4xx, 5xx)
                console.error('🔴 [ERROR] Server Error - Status:', err.response.status);
                console.error('🔴 [ERROR] Server Error - Data:', err.response.data);

                const errorMessage = err.response?.data?.error ||
                    err.response?.data?.message ||
                    err.response?.data?.details ||
                    `Gagal memperbarui kategori (Status: ${err.response.status})`;
                setError(errorMessage);
            } else if (err.request) {
                // Request was made but no response
                console.error('🔴 [ERROR] No response from server');
                setError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
            } else {
                // Something else happened
                console.error('🔴 [ERROR] Unexpected error');
                setError(err.message || 'Terjadi kesalahan tidak terduga');
            }
        } finally {
            setSubmitting(false);
            console.log('🏁 [FINALLY] Submit process completed');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-green-900 mx-auto mb-4" />
                    <p className="text-gray-600">Memuat data kategori...</p>
                </div>
            </div>
        );
    }

    // ✅ Error state yang lebih baik
    if (error && !name) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
                    <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Gagal Memuat Data</h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-green-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-800 transition-colors"
                        >
                            Coba Lagi
                        </button>
                        <button
                            onClick={() => navigate('/admin/menu?menu=category')}
                            className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Kembali
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/admin/menu?menu=category')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4 group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Kembali ke Daftar Kategori</span>
                    </button>

                    <h1 className="text-3xl font-bold text-gray-900">Edit Kategori</h1>
                    <p className="mt-2 text-gray-600">Perbarui informasi kategori yang sudah ada</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                        {/* Error Alert */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-sm font-semibold text-red-800">Terjadi Kesalahan</h3>
                                        <p className="text-sm text-red-700 mt-1">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* Nama Kategori */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Nama Kategori <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-900 focus:ring-opacity-20 focus:border-green-900 transition-colors text-gray-900 placeholder-gray-400"
                                    placeholder="Masukkan nama kategori"
                                    required
                                />
                                <p className="mt-1.5 text-xs text-gray-500">Nama kategori akan ditampilkan di menu</p>
                            </div>

                            {/* Deskripsi */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Deskripsi
                                </label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-900 focus:ring-opacity-20 focus:border-green-900 transition-colors text-gray-900 placeholder-gray-400 resize-none"
                                    rows="4"
                                    placeholder="Masukkan deskripsi kategori (opsional)"
                                />
                                <p className="mt-1.5 text-xs text-gray-500">Berikan deskripsi singkat tentang kategori ini</p>
                            </div>

                            {/* Tipe Kategori */}
                            <div>
                                <label htmlFor="type" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Tipe Kategori <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    id="type"
                                    value={categoryOptions.find(option => option.value === type)}
                                    onChange={(selectedOption) => setType(selectedOption?.value || '')}
                                    options={categoryOptions}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    placeholder="Pilih tipe kategori..."
                                    isClearable
                                    styles={customSelectStyles}
                                />
                                <p className="mt-1.5 text-xs text-gray-500">Pilih tipe yang sesuai dengan kategori yang akan diperbarui</p>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:justify-end">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/menu?menu=category')}
                                className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-20"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full sm:w-auto px-6 py-2.5 bg-green-900 text-white font-medium rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-900 focus:ring-opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        <span>Simpan Perubahan</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Helper Info Card */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-blue-900">Informasi</h4>
                            <p className="text-sm text-blue-800 mt-1">
                                Perubahan yang Anda lakukan akan mempengaruhi semua produk yang terkait dengan kategori ini. Pastikan data yang diinput sudah benar.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateCategory;