import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const AddSubCategory = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('food');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate(); // ← inisialisasi

    useEffect(() => {
        fetchCategory();
    }, []);

    const fetchCategory = async () => {
        setLoading(true);
        try {
            const categoryResponse = await axios.get('/api/menu/categories');
            const categoryData = categoryResponse.data.data || [];
            const filteredCategories = categoryData.filter(cat => cat.parentCategory === null);
            setCategories(filteredCategories);
        } catch (err) {
            setError('Failed to fetch categories');
            setCategories([]);
            console.error('Error fetching categories:', err);
        } finally {
            setLoading(false);
        }
    };


    // Fungsi untuk menangani pengiriman formulir
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const newCategory = {
                name,
                description,
                type,
                parentCategory: selectedCategory
            };

            await axios.post('/api/menu/categories', newCategory); // Kirim sebagai array
            // if (response.data.success) {
            //   // setSuccessMessage('Category added successfully!');
            navigate('/admin/categories');
            //   setName('');
            //   setDescription('');
            //   setParentCategory('')
            //   setType(''); // Reset form
            // }
        } catch (err) {
            setError('Failed to add category');
            console.error('Error adding category:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Tambah Sub Kategori</h1>

            {/* {successMessage && (
        <p className="text-green-500 mb-4">{successMessage}</p>
      )} */}

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Nama Sub Kategori
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Deskripsi:
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Tipe:
                    </label>
                    <select
                        id="type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                        <option value="food">Makanan</option>
                        <option value="beverage">Minuman</option>
                        <option value="instan">Makanan Instan</option>
                        <option value="inventory">Inventori</option>
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block font-semibold">Kategori Induk</label>
                    <select
                        name="parentCategory"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                    >
                        <option value="">-- Pilih Kategori --</option>
                        {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>
                {/* <div className="flex items-center justify-between space-x-4 mb-4">
          <span>Tampilkan pada Pawoon Order</span>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-1">
              <input type="radio" name="pawoon_order" value="yes" />
              <span>Ya</span>
            </label>
            <label className="flex items-center space-x-1">
              <input type="radio" name="pawoon_order" value="no" />
              <span>Tidak</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between space-x-4">
          <span>Tampilkan pada Digi Pawon</span>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-1">
              <input type="radio" name="digi_pawon" value="yes" />
              <span>Ya</span>
            </label>
            <label className="flex items-center space-x-1">
              <input type="radio" name="digi_pawon" value="no" />
              <span>Tidak</span>
            </label>
          </div>
        </div> */}


                <div className="absolute h-[50px] bottom-0 right-6 space-x-2">
                    <Link to="/admin/categories" className="bg-white text-[#005429] border border-[#005429] inline-flex justify-center py-2 px-4 shadow-sm text-sm font-medium rounded-md hover:text-white hover:bg-[#005429]">Batal</Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#005429]"
                    >
                        {loading ? 'Adding...' : 'Simpan'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddSubCategory;