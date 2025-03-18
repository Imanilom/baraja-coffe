import React, { useState, useEffect } from "react";
import axios from "axios";

const CreateAddon = ({ fetchAddons }) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "drink",
    type: "",
    options: [],
    rawMaterials: []
  });
  const [option, setOption] = useState({ label: "", price: "" });
  const [error, setError] = useState("");
  const [rawMaterials, setRawMaterials] = useState([]);

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

    const addOption = () => {
      if (!option.label || option.price === 0 || parseFloat(option.price) < 0) {
        setError("Please enter a valid label and price for the option.");
        return;
      }
      setError("");
      setFormData({
        ...formData,
        options: [...formData.options, option],
      });
      setOption({ label: "", price: "" });
    };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post("/api/menu/addons", formData);
      setFormData({ name: "", type: "size", options: [], rawMaterials: [] });
      
    } catch (error) {
      setError("Error creating add-on. Please try again.");
      console.error("Error creating add-on:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white shadow-md rounded">
      <h2 className="text-xl font-bold mb-4">Add Add-On</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
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
            min="0"
          />
          <button
            type="button"
            onClick={addOption}
            className="bg-blue-500 text-white px-3 py-2 rounded"
          >
            Add
          </button>
        </div>
        <ul className="list-disc pl-5">
          {formData.options.map((opt, index) => (
            <li key={index} className="text-gray-700">
              {opt.label} - IDR {opt.price}
            </li>
          ))}
        </ul>
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
