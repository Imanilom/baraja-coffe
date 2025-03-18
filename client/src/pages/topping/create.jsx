import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CreateTopping = ({ fetchToppings, onCancel }) => {
  const navigate = useNavigate(); 
  const [formData, setFormData] = useState({ name: "", price: "", category: "food", rawMaterials: [] });
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
    let quantity = parseInt(e.target.value, 10);
    if (isNaN(quantity) || quantity < 1) {
      quantity = 1;
    }
    setFormData((prevData) => {
      const updatedRawMaterials = prevData.rawMaterials.map((material) => {
        if (material.materialId === materialId) {
          return { ...material, quantityRequired: quantity };
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
  
    if (!materialExists && value) {
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
      await axios.post("/api/menu/toppings", formData);
      setFormData({ name: "", price: "", category: "food", rawMaterials: [] });
      navigate("/toppings");
      if (onCancel) onCancel();
    } catch (error) {
      console.error("Error creating topping:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 mt-6 bg-white shadow-md rounded">
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
              step="1"
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

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Add Topping
      </button>
    </form>
  );
};

export default CreateTopping;
