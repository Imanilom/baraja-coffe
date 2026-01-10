import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

const AddCategory = () => {
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

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const { currentUser } = useSelector((state) => state.user);

  const categoryOptions = [
    { value: 'food', label: 'Food' },
    { value: 'beverage', label: 'Beverage' },
    { value: 'instan', label: 'Instan' },
    { value: 'event', label: 'Event' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!name.trim()) {
      setError('Nama kategori harus diisi');
      setLoading(false);
      return;
    }

    if (!type) {
      setError('Tipe kategori harus dipilih');
      setLoading(false);
      return;
    }

    try {
      const newCategory = {
        name: name.trim(),
        description: description.trim(),
        type,
        user: currentUser._id,
      };

      const response = await axios.post('/api/menu/categories', newCategory);

      navigate('/admin/menu?menu=category', {
        state: { message: 'Kategori berhasil ditambahkan!' }
      });
    } catch (err) {
      const errorMessage = err.response?.data?.error ||
        err.response?.data?.details ||
        'Failed to add category';
      setError(errorMessage);
      console.error('Error adding category:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

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

          <h1 className="text-3xl font-bold text-gray-900">Tambah Kategori Baru</h1>
          <p className="mt-2 text-gray-600">Isi formulir di bawah untuk menambahkan kategori baru ke sistem</p>
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
                <p className="mt-1.5 text-xs text-gray-500">Pilih tipe yang sesuai dengan kategori yang akan dibuat</p>
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
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 bg-green-900 text-white font-medium rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-900 focus:ring-opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Simpan Kategori</span>
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
                Pastikan nama kategori unik dan mudah dipahami. Kategori yang sudah dibuat dapat diedit kembali dari halaman daftar kategori.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCategory;