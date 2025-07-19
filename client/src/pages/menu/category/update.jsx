import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';

const UpdateCategory = () => {
    const { id } = useParams(); // Get the menu item ID from the URL
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('food'); // Default type adalah "food"
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        setLoading(true);
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`/api/storage/categories/${id}`);
                const fetchedCategories = response.data.data || [];
                setCategories(fetchedCategories);
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories(); // Fetch the menu item to update
    }, [id]);

    useEffect(() => {
        if (categories && categories.name) {
            setName(categories.name);
        }
    }, [categories]);

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
            };
            const response = await axios.put(`/api/storage/categories/${id}`, newCategory); // Kirim sebagai array
            navigate('/admin/categories');
        } catch (err) {
            setError('Failed to add category');
            console.error('Error adding category:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Ubah Kategori</h1>

            {successMessage && (
                <p className="text-green-500 mb-4">{successMessage}</p>
            )}

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Nama Kategori
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

                {/* <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description:
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
                        Type:
                    </label>
                    <select
                        id="type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                        <option value="food">Food</option>
                        <option value="beverage">Beverage</option>
                        <option value="instan">Instant Food</option>
                        <option value="inventory">Inventory</option>
                    </select>
                </div> */}
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

export default UpdateCategory;