import React, { useState } from "react";
import axios from "axios";

const UpdateAddon = ({ addon, fetchAddons, onCancel }) => {
  const [formData, setFormData] = useState({
    name: addon.name || "",
    category: addon.category || "drink",
    type: addon.type || "",
    options: addon.options || [],
  });
  const [option, setOption] = useState({ label: "", price: "" });

  const drinkTypes = ["Temperature", "Size", "Beans", "Sugar", "Ice Level", "Espresso", "Milk", "Syrup"];
  const foodTypes = ["Spiciness", "Custom"]; 

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "category") {
      setFormData({ ...formData, category: value, type: value === "drink" ? "Temperature" : "Spiciness" });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };


  const handleOptionChange = (e) => {
    const { name, value } = e.target;
    setOption({ ...option, [name]: value });
  };

  const addOption = () => {
    if (option.label && option.price) {
      setFormData({
        ...formData,
        options: [...formData.options, option],
      });
      setOption({ label: "", price: "" });
    }
  };

  const removeOption = (index) => {
    const updatedOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: updatedOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/menu/addons/${addon._id}`, formData);
      fetchAddons();
      onCancel();
    } catch (error) {
      console.error("Error updating addon:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-lg"
      >
        <h2 className="text-xl font-bold mb-4">Update Add-On</h2>

        {/* Name Field */}
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
          <label className="block text-gray-700">Category</label>
          <select name="category" value={formData.category} onChange={handleInputChange} className="w-full border rounded px-3 py-2">
            <option value="drink">Drink</option>
            <option value="food">Food</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Type</label>
          <select name="type" value={formData.type} onChange={handleInputChange} className="w-full border rounded px-3 py-2">
            {(formData.category === "drink" ? drinkTypes : foodTypes).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Options Field */}
        <div className="mb-4">
          <label className="block text-gray-700">Options</label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              name="label"
              placeholder="Label"
              value={option.label}
              onChange={handleOptionChange}
              className="border rounded px-3 py-2 flex-1"
            />
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={option.price}
              onChange={handleOptionChange}
              className="border rounded px-3 py-2 w-20"
            />
            <button
              type="button"
              onClick={addOption}
              className="bg-blue-500 text-white px-3 py-2 rounded"
            >
              Add
            </button>
          </div>

          {/* Current Options */}
          <ul>
            {formData.options.map((opt, index) => (
              <li key={index} className="flex items-center justify-between">
                <span>
                  {opt.label} - ${opt.price}
                </span>
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Update Add-On
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateAddon;
