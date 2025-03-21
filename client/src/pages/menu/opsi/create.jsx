import React, { useState, useEffect } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";

const CreateTopping = ({ fetchToppings, onCancel }) => {
  const [formData, setFormData] = useState({ name: "", price: "", rawMaterials: [] });
  const [rawMaterials, setRawMaterials] = useState([]);

  // Fetch available raw materials on mount
  useEffect(() => {
    const fetchRawMaterials = async () => {
      try {
        const response = await axios.get("/api/storage/raw-material");
        setRawMaterials(response.data?.data || []);
      } catch (error) {
        console.error("Error fetching raw materials:", error);
      }
    };

    fetchRawMaterials();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRawMaterialChange = (e, materialId) => {
    const { value } = e.target;
    setFormData((prevData) => {
      const updatedRawMaterials = prevData.rawMaterials.map((material) => {
        if (material.materialId === materialId) {
          return { ...material, quantityRequired: value };
        }
        return material;
      });
      return { ...prevData, rawMaterials: updatedRawMaterials };
    });
  };

  const handleRawMaterialSelect = (e) => {
    const { value } = e.target;
    const materialExists = formData.rawMaterials.some(
      (material) => material.materialId === value
    );

    if (!materialExists) {
      setFormData((prevData) => ({
        ...prevData,
        rawMaterials: [
          ...prevData.rawMaterials,
          { materialId: value, quantityRequired: 1 },
        ],
      }));
    }
  };

  const handleRemoveRawMaterial = (materialId) => {
    setFormData((prevData) => ({
      ...prevData,
      rawMaterials: prevData.rawMaterials.filter(
        (material) => material.materialId !== materialId
      ),
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/toppings", formData);
      setFormData({ name: "", price: "", rawMaterials: [] });
      Navigate("/toppings");
      onCancel();
    } catch (error) {
      console.error("Error creating topping:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-end items-right z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-lg flex flex-col h-full overflow-y-auto"
      >
        <h2 className="text-xl font-bold mb-4">Add Topping</h2>

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

        <div className="mb-4">
          <label className="block text-gray-700">Raw Materials</label>
          <select
            onChange={handleRawMaterialSelect}
            className="w-full border rounded px-3 py-2 mb-2"
          >
            <option value="">Select Raw Material</option>
            {rawMaterials.map((rawMaterial) => (
              <option key={rawMaterial._id} value={rawMaterial._id}>
                {rawMaterial.name}
              </option>
            ))}
          </select>
          {formData.rawMaterials.map((material, index) => (
            <div key={index} className="flex items-center mb-2">
              <label className="w-2/3 text-gray-700">
                {rawMaterials.find((item) => item._id === material.materialId)?.name}
              </label>
              <input
                type="number"
                value={material.quantityRequired}
                onChange={(e) => handleRawMaterialChange(e, material.materialId)}
                className="w-20 border rounded px-3 py-2 mr-2"
                placeholder="Quantity"
                min="1"
              />
              <button
                type="button"
                onClick={() => handleRemoveRawMaterial(material.materialId)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mt-auto flex gap-4 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Topping
          </button>
        </div>
      </form>
    </div>

  );
};

export default CreateTopping;
