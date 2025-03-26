import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTrashAlt } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";

const UpdateMenu = () => {
  const { id } = useParams(); // Get the menu item ID from the URL
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: [], // This should be an array
    imageURL: "",
    toppings: [],
    addons: [],
    rawMaterials: [],
    availableAt: "",
  });

  const [categories, setCategories] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [categoryMap, setCategoryMap] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/menu/categories");
        const fetchedCategories = response.data.data || [];
        setCategories(fetchedCategories);

        // Create a mapping of category IDs to names
        const map = {};
        fetchedCategories.forEach(category => {
          map[category._id] = category.name;
        });
        setCategoryMap(map);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    const fetchOutlets = async () => {
      try {
        const response = await axios.get("/api/outlet/");
        setOutlets(response.data || []);
      } catch (error) {
        console.error("Error fetching outlets:", error);
      }
    };

    const fetchRawMaterial = async () => {
      try {
        const response = await axios.get("/api/storage/raw-material");
        setRawMaterials(response.data.data || []);
      } catch (error) {
        console.error("Error fetching raw materials:", error);
      }
    };

    const fetchMenuItem = async () => {
      try {
        const response = await axios.get(`/api/menu/menu-items/${id}`);
        const menuItem = response.data.data;

        // Ensure that the addons have options
        if (menuItem.addons) {
          menuItem.addons.forEach(addon => {
            if (!addon.options) {
              addon.options = []; // Initialize options if not present
            }
          });
        }

        setFormData(menuItem);
        setImagePreview(menuItem.imageURL);
      } catch (error) {
        console.error("Error fetching menu item:", error);
      }
    };

    fetchCategories();
    fetchOutlets();
    fetchRawMaterial();
    fetchMenuItem(); // Fetch the menu item to update
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prevData) => {
      const updatedCategories = checked
        ? [...prevData.category, value]
        : prevData.category.filter((category) => category !== value);
      return {
        ...prevData,
        category: updatedCategories,
      };
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setFormData((prevData) => ({
        ...prevData,
        imageURL: reader.result,
      }));
      setImagePreview(reader.result);
    };
  };

  const handleAvailableAtChange = (e) => {
    const { value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      availableAt: value, // Update the availableAt field
    }));
  };

  const handleRawMaterialChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prevData) => {
      let updatedRawMaterials = [...prevData.rawMaterials];

      if (checked) {
        // Add the materialId to the array
        updatedRawMaterials.push({ materialId: { _id: value }, quantityRequired: 0.1 }); // Adjust quantity as needed
      } else {
        // Remove the materialId from the array
        updatedRawMaterials = updatedRawMaterials.filter(raw => raw.materialId._id !== value);
      }

      return {
        ...prevData,
        rawMaterials: updatedRawMaterials,
      };
    });
  };

  const handleToppingInputChange = (index, field, value) => {
    setFormData((prevData) => {
      const updatedToppings = [...prevData.toppings];
      updatedToppings[index] = {
        ...updatedToppings[index],
        [field]: value || "", // Ensure it defaults to an empty string
      };
      return {
        ...prevData,
        toppings: updatedToppings,
      };
    });
  };

  const handleAddonInputChange = (index, field, value) => {
    setFormData((prevData) => {
      const updatedAddons = [...prevData.addons];
      updatedAddons[index] = {
        ...updatedAddons[index],
        [field]: value || "", // Ensure it defaults to an empty string
      };
      return {
        ...prevData,
        addons: updatedAddons,
      };
    });
  };

  const handleAddonRawMaterialChange = (addonIndex, e) => {
    const { value, checked } = e.target; // Get the value and checked state of the checkbox
    setFormData((prevData) => {
      const updatedAddons = [...prevData.addons]; // Create a copy of the current addons
      const addon = updatedAddons[addonIndex]; // Get the specific addon being modified

      if (checked) {
        // If the checkbox is checked, add the raw material
        addon.rawMaterials.push({ materialId: { _id: value }, quantityRequired: 0.1 }); // Adjust quantity as needed
      } else {
        // If the checkbox is unchecked, remove the raw material
        addon.rawMaterials = addon.rawMaterials.filter(raw => raw.materialId._id !== value);
      }

      return {
        ...prevData,
        addons: updatedAddons, // Update the state with the modified addons
      };
    });
  };

  const handleToppingRawMaterialChange = (toppingIndex, e) => {
    const { value, checked } = e.target; // Get the value and checked state of the checkbox
    setFormData((prevData) => {
      const updatedToppings = [...prevData.toppings]; // Create a copy of the current toppings
      const topping = updatedToppings[toppingIndex]; // Get the specific topping being modified

      if (checked) {
        // If the checkbox is checked, add the raw material
        topping.rawMaterials.push({ materialId: { _id: value }, quantityRequired: 0.1 }); // Adjust quantity as needed
      } else {
        // If the checkbox is unchecked, remove the raw material
        topping.rawMaterials = topping.rawMaterials.filter(raw => raw.materialId._id !== value);
      }

      return {
        ...prevData,
        toppings: updatedToppings, // Update the state with the modified toppings
      };
    });
  };

  const handleRemoveAddonOption = (addonIndex, optionIndex) => {
    setFormData((prevData) => {
      const updatedAddons = [...prevData.addons];
      updatedAddons[addonIndex].options = updatedAddons[addonIndex].options.filter((_, i) => i !== optionIndex);
      return {
        ...prevData,
        addons: updatedAddons,
      };
    });
  };

  const handleAddOption = (addonIndex) => {
    setFormData((prevData) => {
      const updatedAddons = [...prevData.addons];
      updatedAddons[addonIndex].options.push({ label: "", price: "", default: false });
      return {
        ...prevData,
        addons: updatedAddons,
      };
    });
  };

  const handleAddonOptionInputChange = (addonIndex, optionIndex, field, value) => {
    setFormData((prevData) => {
      const updatedAddons = [...prevData.addons];
      updatedAddons[addonIndex].options[optionIndex] = {
        ...updatedAddons[addonIndex].options[optionIndex],
        [field]: value || "",
      };
      return {
        ...prevData,
        addons: updatedAddons,
      };
    });
  };

  const handleDefaultOptionChange = (addonIndex, optionIndex) => {
    setFormData((prevData) => {
      const updatedAddons = [...prevData.addons];
      updatedAddons[addonIndex].options = updatedAddons[addonIndex].options.map((option, index) => {
        return {
          ...option,
          default: index === optionIndex,
        };
      });
      return {
        ...prevData,
        addons: updatedAddons,
      };
    });
  };

  const handleAddTopping = () => {
    setFormData((prevData) => ({
      ...prevData,
      toppings: [...prevData.toppings, { name: "", price: "", rawMaterials: [] }],
    }));
  };

  const handleAddAddon = () => {
    setFormData((prevData) => ({
      ...prevData,
      addons: [
        ...prevData.addons,
        { name: "", options: [{ label: "", price: "", default: false }], rawMaterials: [] },
      ],
    }));
  };

  const handleRemoveTopping = (index) => {
    setFormData((prevData) => {
      const updatedToppings = prevData.toppings.filter((_, i) => i !== index);
      return {
        ...prevData,
        toppings: updatedToppings,
      };
    });
  };

  const handleRemoveAddon = (index) => {
    setFormData((prevData) => {
      const updatedAddons = prevData.addons.filter((_, i) => i !== index);
      return {
        ...prevData,
        addons: updatedAddons,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.put(`/api/menu/menu-items/${id}`, formData);
      console.log(response);
      navigate("/admin/menu");
    } catch (error) {
      console.error("Error updating menu item:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Update Menu Item</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block font-medium">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Price */}
        <div>
          <label className="block font-medium">Price</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Category (Checkboxes) */}
        <div>
          <label className="block font-medium">Categories</label>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category._id}>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    value={category.name}
                    checked={formData.category.includes(category.name)} // Check if the category is included
                    onChange={handleCategoryChange}
                    className="mr-2"
                  />
                  {category.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Image File Input */}
        <div>
          <label className="block font-medium">Image</label>
          <input
            type="file"
            name="imageURL"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Display the image preview */}
        {imagePreview && (
          <div className="mt-4">
            <img src={imagePreview} alt="Image Preview" className="w-full max-h-60 object-cover rounded" />
          </div>
        )}

        {/* Available At (Dropdown) */}
        <div>
          <label className="block font-medium">Available At</label>
          <select
            name="availableAt"
            value={formData.availableAt} // Set the value to the current availableAt
            onChange={handleAvailableAtChange} // Handle changes
            className="w-full p-2 border rounded"
          >
            {/* <option value="">Pilih Outlet</option> */}
            {outlets.length > 0 ? (
              outlets.map((outlet) => (
                <option key={outlet._id} value={outlet._id}>
                  {outlet.name}
                </option>
              ))
            ) : (
              <option value="">Loading outlets...</option>
            )}
          </select>
        </div>

        {/* Raw Materials */}
        <div>
          <label className="block font-medium">Raw Materials</label>
          <div className="space-y-2 border p-3 rounded">
            {rawMaterials.map((material) => (
              <div key={material._id}>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    value={material._id}
                    checked={formData.rawMaterials.some(raw => raw.materialId._id === material._id)} // Check if the materialId matches
                    onChange={handleRawMaterialChange}
                    className="mr-2"
                  />
                  {material.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Toppings */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block font-medium">Toppings</label>
            <button
              type="button"
              onClick={handleAddTopping}
              className="bg-green-500 text-white px-2 py-1 rounded text-sm"
            >
              + Add Topping
            </button>
          </div>

          <div className="space-y-4">
            {formData.toppings.map((topping, toppingIndex) => (
              <div key={toppingIndex} className="border p-3 rounded">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Topping #{toppingIndex + 1}</h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveTopping(toppingIndex)}
                    className="text-red-500"
                  >
                    <FaTrashAlt />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-sm">Name</label>
                    <input
                      type="text"
                      value={topping.name || ""} // Use an empty string as a fallback
                      onChange={(e) => handleToppingInputChange(toppingIndex, "name", e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Price</label>
                    <input
                      type="number"
                      value={topping.price}
                      onChange={(e) => handleToppingInputChange(toppingIndex, "price", e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>

                {/* Raw Materials for Topping */}
                <div>
                  <label className="block text-sm mb-1">Raw Materials</label>
                  <div className="max-h-28 overflow-y-auto border p-2 rounded">
                    {rawMaterials.map((material) => (
                      < div key={material._id} >
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            value={material._id}
                            checked={topping.rawMaterials.some(raw => raw.materialId._id === material._id)} // Check if the materialId matches
                            onChange={(e) => handleToppingRawMaterialChange(toppingIndex, e)}
                            className="mr-2"
                          />
                          {material.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>



        {/* Addons */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block font-medium">Addons</label>
            <button
              type="button"
              onClick={handleAddAddon}
              className="bg-green-500 text-white px-2 py-1 rounded text-sm"
            >
              + Add Addon
            </button>
          </div>

          <div className="space-y-4">
            {formData.addons.map((addon, addonIndex) => (
              <div key={addonIndex} className="border p-3 rounded">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Addon #{addonIndex + 1}</h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveAddon(addonIndex)}
                    className="text-red-500"
                  >
                    <FaTrashAlt />
                  </button>
                </div>

                <div className="mb-2">
                  <label className="block text-sm">Name</label>
                  <input
                    type="text"
                    value={addon.name}
                    onChange={(e) => handleAddonInputChange(addonIndex, "name", e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>

                {/* Addon Options */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Options</label>
                    <button
                      type="button"
                      onClick={() => handleAddOption(addonIndex)}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                    >
                      + Add Option
                    </button>
                  </div>

                  <div className="space-y-2">
                    {addon.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-2 border p-2 rounded">
                        <div className="flex-1">
                          <label className="block text-xs">Label</label>
                          <input
                            type="text"
                            value={option.label}
                            onChange={(e) =>
                              handleAddonOptionInputChange(addonIndex, optionIndex, "label", e.target.value)
                            }
                            className="w-full p-1 border rounded"
                          />
                        </div>
                        <div className="w-20">
                          <label className="block text-xs">Price</label>
                          <input
                            type="number"
                            value={option.price}
                            onChange={(e) =>
                              handleAddonOptionInputChange(addonIndex, optionIndex, "price", e.target.value)
                            }
                            className="w-full p-1 border rounded"
                          />
                        </div>
                        <div className="w-16 text-center">
                          <label className="block text-xs">Default</label>
                          <input
                            type="radio"
                            checked={option.isdefault || false}
                            onChange={() => handleDefaultOptionChange(addonIndex, optionIndex)}
                            className="mt-1"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAddonOption(addonIndex, optionIndex)}
                          className="text-red-500"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Raw Materials for Addon */}
                <div>
                  <label className="block text-sm mb-1">Raw Materials</label>
                  <div className="max-h-28 overflow-y-auto border p-2 rounded">
                    {rawMaterials.map((material) => (
                      <div key={material._id}>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            value={material._id}
                            checked={addon.rawMaterials.some(raw => raw.materialId._id === material._id)}
                            onChange={(e) => handleAddonRawMaterialChange(addonIndex, e)}
                            className="mr-2"
                          />
                          {material.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded"
          >
            Update Menu Item
          </button>
        </div>
      </form >
    </div >
  );
};

export default UpdateMenu;