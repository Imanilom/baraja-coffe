import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AssignMenuItemToCategory = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedMenuItems, setSelectedMenuItems] = useState([]);
  const [selectedCategoryNames, setSelectedCategoryNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get('/api/menu/menu-items');
      setMenuItems(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch menu items');
      console.error('Error fetching menu items:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/storage/category');
      setCategories(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch categories');
      console.error('Error fetching categories:', err);
    }
  };

  const handleMenuItemChange = (e) => {
    const value = e.target.value;
    setSelectedMenuItems((prev) =>
      e.target.checked ? [...prev, value] : prev.filter((id) => id !== value)
    );
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedCategoryNames((prev) =>
      e.target.checked ? [...prev, value] : prev.filter((name) => name !== value)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (selectedMenuItems.length === 0 || selectedCategoryNames.length === 0) {
      setError('Please select at least one menu item and one category.');
      setLoading(false);
      return;
    }

    try {
      const data = { categoryNames: selectedCategoryNames, menuItems: selectedMenuItems };
      const response = await axios.post('/api/storage/category/assign', data);
      if (response.data.success) {
        setSuccessMessage('Menu items assigned to categories successfully!');
        setSelectedMenuItems([]);
        setSelectedCategoryNames([]);
      }
    } catch (err) {
      setError('Failed to assign menu items to categories');
      console.error('Error assigning menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Assign Menu Items to Categories</h1>

      {successMessage && <p className="text-green-600 font-medium mb-4">{successMessage}</p>}
      {error && <p className="text-red-500 font-medium mb-4">{error}</p>}

      <form onSubmit={handleSubmit}>
        {/* Menu Items */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">Select Menu Items:</h2>
          <div className="grid grid-cols-2 gap-2 border p-4 rounded-md bg-gray-50">
            {menuItems.length > 0 ? (
              menuItems.map((menuItem) => (
                <label
                  key={menuItem._id}
                  className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md cursor-pointer"
                >
                  <input
                    type="checkbox"
                    value={menuItem._id}
                    onChange={handleMenuItemChange}
                    checked={selectedMenuItems.includes(menuItem._id)}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <span className="text-gray-700">{menuItem.name}</span>
                </label>
              ))
            ) : (
              <p className="text-gray-500">No menu items found.</p>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">Select Categories:</h2>
          <div className="grid grid-cols-2 gap-2 border p-4 rounded-md bg-gray-50">
            {categories.length > 0 ? (
              categories.map((category) => (
                <label
                  key={category._id}
                  className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md cursor-pointer"
                >
                  <input
                    type="checkbox"
                    value={category.name}
                    onChange={handleCategoryChange}
                    checked={selectedCategoryNames.includes(category.name)}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <span className="text-gray-700">
                    {category.name} <span className="text-gray-500">({category.type})</span>
                  </span>
                </label>
              ))
            ) : (
              <p className="text-gray-500">No categories found.</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 text-white text-lg font-medium rounded-md transition duration-200 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loading ? 'Assigning...' : 'Assign'}
        </button>
      </form>
    </div>
  );
};

export default AssignMenuItemToCategory;
    