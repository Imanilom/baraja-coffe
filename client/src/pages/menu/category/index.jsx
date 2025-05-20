import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import axios from 'axios';

const CategoryIndex = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState('all'); // State untuk menyimpan tipe yang dipilih
  const [currentPage, setCurrentPage] = useState(1); // Halaman saat ini
  const itemsPerPage = 6; // Jumlah kategori per halaman

  // Fungsi untuk mengambil daftar kategori dari API
  const fetchCategories = async (type) => {
    try {
      let url = '/api/storage/category'; // URL default untuk mendapatkan semua kategori
      if (type && type !== 'all') {
        url += `/${type}`; // Tambahkan parameter type jika ada
      }

      const response = await axios.get(url);
      setCategories(response.data.data || []);
      setFilteredCategories(response.data.data || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch categories');
      setLoading(false);
      console.error('Error fetching categories:', err);
    }
  };

  // Fungsi untuk menghapus kategori
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      await axios.delete(`/category/${categoryId}`);
      setCategories((prevCategories) =>
        prevCategories.filter((category) => category._id !== categoryId)
      );
      setFilteredCategories((prevFilteredCategories) =>
        prevFilteredCategories.filter((category) => category._id !== categoryId)
      );
    } catch (err) {
      alert('Failed to delete category');
      console.error('Error deleting category:', err);
    }
  };

  // Fungsi untuk menangani perubahan filter berdasarkan tipe
  const handleTypeChange = async (e) => {
    const type = e.target.value;
    setSelectedType(type);

    if (type === 'all') {
      // Jika pilihan adalah "all", muat semua kategori
      await fetchCategories();
    } else {
      // Jika pilihan bukan "all", muat kategori berdasarkan tipe
      await fetchCategories(type);
    }
    setCurrentPage(1); // Reset halaman ketika filter diubah
  };

  useEffect(() => {
    // Saat komponen dimuat, ambil semua kategori
    fetchCategories();
  }, []);

  // Menghitung kategori yang ditampilkan untuk halaman saat ini
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  return (
    <div className="">
      <h1 className="text-3xl font-bold mb-6">Kategori</h1>

      {/* Dropdown untuk filter berdasarkan tipe */}
      <div className="mb-4">

        <Link
          to="/admin/category-create"
          className="bg-blue-500 text-white px-4 py-2 rounded inline-block"
        >
          Add Category
        </Link>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-4">
          Filter by Type:
        </label>
        <select
          id="type"
          value={selectedType}
          onChange={handleTypeChange}
          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="all">All</option>
          <option value="food">Food</option>
          <option value="beverage">Beverages</option>
          <option value="instan">Dessert</option>
          {/* Tambahkan opsi lain sesuai kebutuhan */}
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.length > 0 ? (
                currentItems.map((category) => (
                  <tr key={category._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{category.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{category.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteCategory(category._id)}
                        className="text-red-500 hover:text-red-700 mr-2"
                      >
                        Delete
                      </button>
                      <a
                        href={`/category/${category._id}/menu`}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        View Menu
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 mx-1 rounded bg-gray-300 text-gray-700"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-4 py-2 mx-1 rounded ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 mx-1 rounded bg-gray-300 text-gray-700"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CategoryIndex;
