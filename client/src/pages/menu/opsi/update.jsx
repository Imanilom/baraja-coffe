import React, { useState } from "react";
import axios from "axios";

const UpdateTopping = ({ topping, fetchToppings, onCancel }) => {
  const [formData, setFormData] = useState({
    name: topping.name,
    price: topping.price,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/toppings/${topping._id}`, formData);
      fetchToppings();
      onCancel();
    } catch (error) {
      console.error("Error updating topping:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white shadow-md rounded mt-6">
      <h2 className="text-xl font-bold mb-4">Edit Topping</h2>
      <div className="mb-4">
        <label className="block text-gray-700">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Price</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleInputChange}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded mr-2">
          Save
        </button>
        <button onClick={onCancel} className="bg-gray-500 text-white px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default UpdateTopping;
