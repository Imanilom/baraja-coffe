import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTrashAlt } from "react-icons/fa"; // Import ikon trash untuk tombol remove

const CreateMenu = () => {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: [],
    imageURL: "",
    toppings: [],
    addons: [],
    rawMaterials: [],
    availableAt: "", // Menyimpan outlet yang dipilih
  });

  const [categories, setCategories] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [outlets, setOutlets] = useState([]); // Menyimpan daftar outlet untuk dropdown
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/menu/categories"); // Sesuaikan URL API kategori
        setCategories(response.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    const fetchOutlets = async () => {
      try {
        const response = await axios.get("/api/outlet/"); // Sesuaikan URL API outlets
        setOutlets(response.data || []); // Asumsikan API mengembalikan list outlet
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


    fetchCategories();
    fetchOutlets();
    fetchRawMaterial();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prevData) => {
      const updatedCategories = checked
        ? [...prevData.category, value] // Menambahkan kategori jika dicentang
        : prevData.category.filter((category) => category !== value); // Menghapus kategori jika dicabut
      return {
        ...prevData,
        category: updatedCategories,
      };
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormData({
      ...formData,
      imageURL: file,
    });
    const imageUrl = URL.createObjectURL(file);
    setImagePreview(imageUrl);
  };

  const handleRawMaterialChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prevData) => {
      const updatedRawMaterials = checked
        ? [...prevData.rawMaterials, value]  // Menambahkan rawMaterial
        : prevData.rawMaterials.filter((rawMaterial) => rawMaterial !== value); // Menghapus rawMaterial

      return {
        ...prevData,
        rawMaterials: updatedRawMaterials,  // Pastikan ini diupdate
      };
    });
  };

  const handleAddTopping = () => {
    setFormData({
      ...formData,
      toppings: [
        ...formData.toppings,
        { name: "", price: "" },
      ],
    });
  };

  const handleAddAddon = () => {
    setFormData({
      ...formData,
      addons: [
        ...formData.addons,
        { name: "", options: [{ label: "", price: "" }] }, // Input option langsung ditambahkan
      ],
    });
  };

  const handleRemoveTopping = (index) => {
    const updatedToppings = formData.toppings.filter((_, i) => i !== index);
    setFormData({ ...formData, toppings: updatedToppings });
  };

  const handleRemoveAddon = (index) => {
    const updatedAddons = formData.addons.filter((_, i) => i !== index);
    setFormData({ ...formData, addons: updatedAddons });
  };

  const handleRemoveAddonOption = (addonIndex, optionIndex) => {
    const updatedAddons = [...formData.addons];
    updatedAddons[addonIndex].options = updatedAddons[addonIndex].options.filter((_, i) => i !== optionIndex);
    setFormData({ ...formData, addons: updatedAddons });
  };

  const handleAddOption = (addonIndex) => {
    const updatedAddons = [...formData.addons];
    updatedAddons[addonIndex].options.push({ label: "", price: "", default: false }); // Add default flag
    setFormData({ ...formData, addons: updatedAddons });
  };

  const handleDefaultOptionChange = (addonIndex, optionIndex) => {
    const updatedAddons = [...formData.addons];
    updatedAddons[addonIndex].options = updatedAddons[addonIndex].options.map((option, index) => {
      if (index === optionIndex) {
        return { ...option, default: true }; // Mark this option as default
      }
      return { ...option, default: false }; // Unmark other options as default
    });
    setFormData({ ...formData, addons: updatedAddons });
  };

  const handleAvailableAtChange = (e) => {
    setFormData({
      ...formData,
      availableAt: e.target.value,  // Menyimpan ID outlet yang dipilih sebagai string
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log(formData);

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("name", formData.name);
    formDataToSubmit.append("price", formData.price);
    formDataToSubmit.append("description", formData.description);
    formDataToSubmit.append("category", JSON.stringify(formData.category));
    if (formData.image) {
      formDataToSubmit.append("imageURL", formData.imageURL);
    }
    formDataToSubmit.append("toppings", JSON.stringify(formData.toppings));
    formDataToSubmit.append("addons", JSON.stringify(formData.addons));
    formDataToSubmit.append("rawMaterials", JSON.stringify(formData.rawMaterials));
    formDataToSubmit.append("availableAt", JSON.stringify(formData.availableAt));

    try {
      await axios.post("/api/menu/menu-items", formDataToSubmit, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      console.error("Error creating menu item:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Create Menu Item</h2>
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
            {categories.length > 0 ? (
              categories.map((category) => (
                <div key={category._id}>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      value={category._id}
                      checked={formData.category.includes(category._id)}
                      onChange={handleCategoryChange}
                      className="mr-2"
                    />
                    {category.name} {/* Tampilkan nama kategori */}
                  </label>
                </div>
              ))
            ) : (
              <div>Loading categories...</div>
            )}
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
            value={formData.availableAt}  // Pastikan ini adalah satu ID outlet yang dipilih
            onChange={handleAvailableAtChange}
            className="w-full p-2 border rounded"
          >
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
          <h3 className="text-lg font-semibold">Raw Materials</h3>
          {rawMaterials.length > 0 ? (
            rawMaterials.map((rawMaterial) => (
              <div key={rawMaterial._id} >
                <label className="inline-flex items-center" >
                  <input
                    type="checkbox"
                    value={rawMaterial._id}
                    checked={formData.rawMaterials.includes(rawMaterial._id)}
                    onChange={handleRawMaterialChange}
                    className="mr-2"
                  />
                  {rawMaterial.name}  {/* Tampilkan nama raw material */}
                </label>
              </div>
            ))
          ) : (
            <div>Loading raw materials...</div>
          )}
        </div >


        {/* Toppings */}
        < div >
          <h3 className="text-lg font-semibold">Toppings</h3>
          {
            formData.toppings.map((topping, index) => (
              <div key={index} className="flex space-x-4 items-center">
                <input
                  type="text"
                  placeholder="Topping Name"
                  value={topping.name}
                  onChange={(e) => {
                    const updatedToppings = [...formData.toppings];
                    updatedToppings[index].name = e.target.value;
                    setFormData({ ...formData, toppings: updatedToppings });
                  }}
                  className="p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={topping.price}
                  onChange={(e) => {
                    const updatedToppings = [...formData.toppings];
                    updatedToppings[index].price = e.target.value;
                    setFormData({ ...formData, toppings: updatedToppings });
                  }}
                  className="p-2 border rounded"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTopping(index)}
                  className="text-red-500"
                >
                  <FaTrashAlt />
                </button>
              </div>
            ))
          }
          <button
            type="button"
            onClick={handleAddTopping}
            className="mt-2 text-blue-500"
          >
            Add Topping
          </button>
        </div >

        {/* Addons */}
        < div >
          <h3 className="text-lg font-semibold">Addons</h3>
          {
            formData.addons.map((addon, addonIndex) => (
              <div key={addonIndex} className="space-y-2">
                <div className="flex space-x-4 items-center">
                  <input
                    type="text"
                    placeholder="Addon Name"
                    value={addon.name}
                    onChange={(e) => {
                      const updatedAddons = [...formData.addons];
                      updatedAddons[addonIndex].name = e.target.value;
                      setFormData({ ...formData, addons: updatedAddons });
                    }}
                    className="p-2 border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAddon(addonIndex)}
                    className="text-red-500"
                  >
                    <FaTrashAlt />
                  </button>
                </div>

                {/* Add options for each addon */}
                {addon.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex space-x-4 items-center">
                    <input
                      type="text"
                      placeholder="Option Label"
                      value={option.label}
                      onChange={(e) => {
                        const updatedAddons = [...formData.addons];
                        updatedAddons[addonIndex].options[optionIndex].label = e.target.value;
                        setFormData({ ...formData, addons: updatedAddons });
                      }}
                      className="p-2 border rounded"
                    />
                    <input
                      type="number"
                      placeholder="Option Price"
                      value={option.price}
                      onChange={(e) => {
                        const updatedAddons = [...formData.addons];
                        updatedAddons[addonIndex].options[optionIndex].price = e.target.value;
                        setFormData({ ...formData, addons: updatedAddons });
                      }}
                      className="p-2 border rounded"
                    />

                    {/* Radio button for Default Option */}
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`defaultOption-${addonIndex}`} // Same name group to make it a radio button group
                        checked={option.default}
                        onChange={() => handleDefaultOptionChange(addonIndex, optionIndex)} // Mark this option as default
                        className="mr-2"
                      />
                      Default
                    </label>

                    <button
                      type="button"
                      onClick={() => handleRemoveAddonOption(addonIndex, optionIndex)}
                      className="text-red-500"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddOption(addonIndex)}
                  className="mt-2 text-blue-500"
                >
                  Add Option
                </button>
              </div>
            ))
          }
          <button
            type="button"
            onClick={handleAddAddon}
            className="mt-2 text-blue-500"
          >
            Add Addon
          </button>
        </div >

        {/* Submit Button */}
        < div >
          <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">
            Submit
          </button>
        </div >
      </form >
    </div >
  );
};

export default CreateMenu;
