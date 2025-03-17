import React, { useState } from "react";
import axios from "axios";

const UpdateTopping = ({ topping, fetchToppings, onCancel }) => {
  const [formData, setFormData] = useState({
    name: topping.name,
    category: topping.category || "drink",
    price: topping.price,
    rawMaterials: topping.rawMaterials || [], // Menyertakan raw materials
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Mengubah nilai raw material
  const handleRawMaterialChange = (index, field, value) => {
    const updatedMaterials = [...formData.rawMaterials];
    updatedMaterials[index][field] = value;
    setFormData({ ...formData, rawMaterials: updatedMaterials });
  };

  // Menambahkan raw material baru
  const addRawMaterial = () => {
    setFormData({
      ...formData,
      rawMaterials: [...formData.rawMaterials, { materialId: "", quantityRequired: 0 }],
    });
  };

  // Menghapus raw material
  const removeRawMaterial = (index) => {
    const updatedMaterials = formData.rawMaterials.filter((_, i) => i !== index);
    setFormData({ ...formData, rawMaterials: updatedMaterials });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/menu/toppings/${topping._id}`, formData);
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
        <label className="block text-gray-700">Category</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="food">Food</option>
          <option value="drink">Drink</option>
        </select>
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

      {/* Raw Materials Section */}
      <div className="mb-4">
        <label className="block text-gray-700">Raw Materials</label>
        {formData.rawMaterials.map((material, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <input
              type="text"
              placeholder="Material ID"
              value={material.materialId}
              onChange={(e) => handleRawMaterialChange(index, "materialId", e.target.value)}
              className="border rounded px-2 py-1 w-2/3"
              required
            />
            <input
              type="number"
              placeholder="Quantity"
              value={material.quantityRequired}
              onChange={(e) => handleRawMaterialChange(index, "quantityRequired", e.target.value)}
              className="border rounded px-2 py-1 w-1/3"
              required
            />
            <button
              type="button"
              onClick={() => removeRawMaterial(index)}
              className="bg-red-500 text-white px-2 py-1 rounded"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addRawMaterial}
          className="bg-blue-500 text-white px-3 py-2 rounded mt-2"
        >
          + Add Material
        </button>
      </div>

      <div>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded mr-2">
          Save
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-500 text-white px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default UpdateTopping;
