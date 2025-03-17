import React, { useState, useEffect } from "react";
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

  const [menuItems, setMenuItems] = useState([]); // To store the list of items
  const [loadingItems, setLoadingItems] = useState(true);

  // Fetch menu items from the backend
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await axios.get("/api/menu/menu-items");

        setMenuItems(response.data?.data || []);
        setLoadingItems(false);
      } catch (error) {
        console.error("Error fetching menu items:", error);
        setLoadingItems(false);
      }
    };

    fetchMenuItems();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    const updatedItems = checked
      ? [...formData.applicableItems, value]
      : formData.applicableItems.filter((itemId) => itemId !== value);

    setFormData({ ...formData, applicableItems: updatedItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/promotion", formData);
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
      <div className="mb-4">
        <label className="block text-gray-700">Applicable Items</label>
        {loadingItems ? (
          <p>Loading items...</p>
        ) : (
          <div className="border rounded p-3">
            {menuItems.map((item) => (
              <div key={item._id} className="mb-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value={item._id}
                    checked={formData.applicableItems.includes(item._id)}
                    onChange={handleCheckboxChange}
                    className="mr-2"
                  />
                  {item.name}
                </label>
              </div>
            ))}
          </div>
        )}
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
