// Contoh lengkap dengan state management
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import Select from 'react-select';

const AddCategory = () => {

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: '#d1d5db', // Tailwind border-gray-300
      minHeight: '34px',
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState(''); // 'product' atau 'menu'
  const [parentCategory, setParentCategory] = useState(''); // Optional
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

    // Validasi di frontend
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
        ...(parentCategory && { parentCategory }), // Hanya kirim jika ada
        user: currentUser._id,
      };

      const response = await axios.post('/api/menu/categories', newCategory);

      // Redirect dengan success message (optional)
      navigate('/admin/categories', {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block mb-2">Nama Kategori *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block mb-2">Deskripsi</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          rows="3"
        />
      </div>

      <div>
        <label className="block mb-2">Tipe Kategori *</label>
        <Select
          value={categoryOptions.find(option => option.value === type)}
          onChange={(selectedOption) => setType(selectedOption?.value || '')}
          options={categoryOptions}
          className="react-select-container"
          classNamePrefix="react-select"
          placeholder="Pilih tipe kategori..."
          isClearable
          styles={customSelectStyles}
        />
      </div>

      <div>
        <label className="block mb-2">Parent Category (Optional)</label>
        <select
          value={parentCategory}
          onChange={(e) => setParentCategory(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">Tidak Ada Parent</option>
          {/* Map categories dari API */}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-green-900 text-white rounded hover:bg-green-800 disabled:opacity-50"
      >
        {loading ? 'Menyimpan...' : 'Simpan Kategori'}
      </button>
    </form>
  );
};

export default AddCategory;