import React, { useState } from "react";
import axios from "axios";

const CreateAddon = ({ fetchAddons }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "size",
    options: [],
  });
  const [option, setOption] = useState({ label: "", price: "" });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/addons", formData);
      setFormData({ name: "", type: "size", options: [] });
      fetchAddons();
    } catch (error) {
      console.error("Error creating addon:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white shadow-md rounded">
      <h2 className="text-xl font-bold mb-4">Add Add-On</h2>
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
        <label className="block text-gray-700">Type</label>
        <select
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="size">Size</option>
          <option value="temperature">Temperature</option>
          <option value="spiciness">Spiciness</option>
          <option value="custom">Custom</option>
        </select>
      </div>
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
        <ul>
          {formData.options.map((opt, index) => (
            <li key={index}>
              {opt.label} - ${opt.price}
            </li>
          ))}
        </ul>
      </div>
      <button
        type="submit"
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Create Add-On
      </button>
    </form>
  );
};

export default CreateAddon;
