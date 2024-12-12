import React, { useState, useEffect } from "react";
import axios from "axios";

const UpdatePromotion = ({ promotion, onClose, fetchPromotions }) => {
  const [formData, setFormData] = useState({
    title: promotion.title || "",
    description: promotion.description || "",
    discountPercentage: promotion.discountPercentage || "",
    startDate: promotion.startDate ? promotion.startDate.split("T")[0] : "",
    endDate: promotion.endDate ? promotion.endDate.split("T")[0] : "",
    applicableItems: promotion.applicableItems || [],
  });

  const [menuItems, setMenuItems] = useState([]);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get("/api/menu-items");
      setMenuItems(response.data);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (id) => {
    const updatedApplicableItems = formData.applicableItems.includes(id)
      ? formData.applicableItems.filter((item) => item !== id)
      : [...formData.applicableItems, id];
    setFormData({ ...formData, applicableItems: updatedApplicableItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/promotions/${promotion._id}`, formData);
      fetchPromotions();
      onClose();
    } catch (error) {
      console.error("Error updating promotion:", error);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Update Promotion</h2>
        <form onSubmit={handleSubmit}>
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
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Applicable Items</label>
            <div className="max-h-40 overflow-y-scroll border rounded p-2">
              {menuItems.map((item) => (
                <label key={item._id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={formData.applicableItems.includes(item._id)}
                    onChange={() => handleCheckboxChange(item._id)}
                    className="mr-2"
                  />
                  {item.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePromotion;