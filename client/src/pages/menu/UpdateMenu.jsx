import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const UpdateMenu = () => {
  const { id } = useParams();
  const [menuData, setMenuData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    stock: '',
    imageURL: '',
  });

  useEffect(() => {
    const fetchMenuItem = async () => {
      try {
        const response = await axios.get(`/api/menu-items/${id}`);
        setMenuData(response.data.data);
      } catch (error) {
        console.error('Failed to fetch menu item', error);
      }
    };
    fetchMenuItem();
  }, [id]);

  const handleChange = (e) => {
    setMenuData({ ...menuData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/menu-items/${id}`, menuData);
      alert('Menu updated successfully');
    } catch (error) {
      console.error(error);
      alert('Failed to update menu');
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-bold mb-4">Update Menu</h2>
      <form onSubmit={handleSubmit}>
        {Object.keys(menuData).map((field) => (
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
          className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600"
        >
          Update
        </button>
      </form>
    </div>
  );
};

export default UpdateMenu;
