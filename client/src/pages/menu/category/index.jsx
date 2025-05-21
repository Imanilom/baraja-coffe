import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import axios from 'axios';

const CategoryIndex = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchCategories = async (type) => {
    try {
      let url = '/api/storage/category';
      if (type && type !== 'all') {
        url += `/${type}`;
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

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      await axios.delete(`/category/${categoryId}`);
      setCategories((prev) => prev.filter((c) => c._id !== categoryId));
      setFilteredCategories((prev) => prev.filter((c) => c._id !== categoryId));
    } catch (err) {
      alert('Failed to delete category');
      console.error('Error deleting category:', err);
    }
  };

  const handleTypeChange = async (e) => {
    const type = e.target.value;
    setSelectedType(type);
    await fetchCategories(type === 'all' ? undefined : type);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Kategori</h1>
        <Link
          to="/admin/category-create"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md transition"
        >
          + Add Category
        </Link>
      </div>

      <div className="mb-6">
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Type:
        </label>
        <select
          id="type"
          value={selectedType}
          onChange={handleTypeChange}
          className="w-full sm:w-60 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
        >
          <option value="all">All</option>
          <option value="food">Food</option>
          <option value="beverage">Beverages</option>
          <option value="instan">Dessert</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentItems.length > 0 ? (
                currentItems.map((category) => (
                  <tr key={category._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{category.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">{category.type || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleDeleteCategory(category._id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                      <Link
                        to={`/category/${category._id}/menu`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Menu
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-4 text-gray-500">
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 flex-wrap gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded ${
                currentPage === i + 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryIndex;
