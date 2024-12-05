import React, { useState } from 'react';
import axios from 'axios';

const CreateMenu = () => {
  const [menuData, setMenuData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    stock: '',
    imageURL: '',
    toppings: [],
  });

  const handleChange = (e) => {
    setMenuData({ ...menuData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/menu-items', menuData);
      alert('Menu created successfully');
    } catch (error) {
      console.error(error);
      alert('Failed to create menu');
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-bold mb-4">Create Menu</h2>
      <form onSubmit={handleSubmit}>
        {['name', 'price', 'description', 'category', 'stock', 'imageURL'].map((field) => (
          <div key={field} className="mb-4">
            <label htmlFor={field} className="block text-gray-700 capitalize">
              {field}
            </label>
            <input
              type="text"
              id={field}
              name={field}
              value={menuData[field]}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
        ))}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
        >
          Create
        </button>
      </form>
    </div>
  );
};

export default CreateMenu;
