import React, { useState } from "react";
import axios from "axios";

const CreatePromotion = ({ fetchPromotions }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discountPercentage: "",
    startDate: "",
    endDate: "",
    applicableItems: [],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/promotions", formData);
      fetchPromotions();
      setFormData({
        title: "",
        description: "",
        discountPercentage: "",
        startDate: "",
        endDate: "",
        applicableItems: [],
      });
    } catch (error) {
      console.error("Error creating promotion:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow-md">
      <h2 className="text-lg font-bold mb-4">Create Promotion</h2>
      <div className="mb-4">
        <label className="block text-gray-700">Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Discount Percentage</label>
        <input
          type="number"
          name="discountPercentage"
          value={formData.discountPercentage}
          onChange={handleInputChange}
          className="w-full border rounded px-3 py-2"
          min="0"
          max="100"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Start Date</label>
        <input
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleInputChange}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">End Date</label>
        <input
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleInputChange}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Create
      </button>
    </form>
  );
};

export default CreatePromotion;
