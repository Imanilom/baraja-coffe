import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTrashAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

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

    fetchCategories();
    fetchOutlets();
    fetchRawMaterial();
  }, []);

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

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Mempertahankan aspek rasio tetapi mengurangi ukuran jika perlu
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          ctx.drawImage(img, 0, 0, width, height);

          // Mengatur kualitas kompresi (0.7 berarti 70% kualitas)
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          }, 'image/jpeg', 0.7); // Mengatur format ke JPEG dan kualitas 0.7
        };
      };
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Cek ukuran file (dalam bytes, 1MB = 1048576 bytes)
    if (file.size > 1048576) {
      // File lebih besar dari 1MB, kompresi diperlukan
      const compressedFile = await compressImage(file);
      const base64String = await convertToBase64(compressedFile);
      setFormData((prevData) => ({
        ...prevData,
        imageURL: base64String,
      }));
      const imageUrl = URL.createObjectURL(compressedFile);
      setImagePreview(imageUrl);
    } else {
      // File sudah di bawah 1MB
      const base64String = await convertToBase64(file);
      setFormData((prevData) => ({
        ...prevData,
        imageURL: base64String,
      }));
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
    }
  };

  // Helper function to convert file to base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleRawMaterialChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prevData) => {
      const updatedRawMaterials = checked
        ? [...prevData.rawMaterials, value]
        : prevData.rawMaterials.filter((rawMaterial) => rawMaterial !== value);
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
        [field]: value,
      };
      return {
        ...prevData,
        toppings: updatedToppings,
      };
    });
  };

  const handleToppingRawMaterialChange = (toppingIndex, e) => {
    const { value, checked } = e.target;
    setFormData((prevData) => {
      const updatedToppings = [...prevData.toppings];

      // Initialize rawMaterials array if it doesn't exist
      if (!updatedToppings[toppingIndex].rawMaterials) {
        updatedToppings[toppingIndex].rawMaterials = [];
      }

      let updatedRawMaterials = [...updatedToppings[toppingIndex].rawMaterials];

      if (checked) {
        updatedRawMaterials.push(value);
      } else {
        updatedRawMaterials = updatedRawMaterials.filter(
          (materialId) => materialId !== value
        );
      }

      updatedToppings[toppingIndex] = {
        ...updatedToppings[toppingIndex],
        rawMaterials: updatedRawMaterials,
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
        [field]: value,
      };
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
        [field]: field === "price" ? value : value,
      };
      return {
        ...prevData,
        addons: updatedAddons,
      };
    });
  };

  const handleAddonRawMaterialChange = (addonIndex, e) => {
    const { value, checked } = e.target;
    setFormData((prevData) => {
      const updatedAddons = [...prevData.addons];

      // Initialize rawMaterials array if it doesn't exist
      if (!updatedAddons[addonIndex].rawMaterials) {
        updatedAddons[addonIndex].rawMaterials = [];
      }

      let updatedRawMaterials = [...updatedAddons[addonIndex].rawMaterials];

      if (checked) {
        updatedRawMaterials.push(value);
      } else {
        updatedRawMaterials = updatedRawMaterials.filter(
          (materialId) => materialId !== value
        );
      }

      updatedAddons[addonIndex] = {
        ...updatedAddons[addonIndex],
        rawMaterials: updatedRawMaterials,
      };

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

  const handleRemoveAddonOption = (addonIndex, optionIndex) => {
    setFormData((prevData) => {
      const updatedAddons = [...prevData.addons];
      updatedAddons[addonIndex].options = updatedAddons[addonIndex].options.filter(
        (_, i) => i !== optionIndex
      );
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

  const handleDefaultOptionChange = (addonIndex, optionIndex) => {
    setFormData((prevData) => {
      const updatedAddons = [...prevData.addons];
      updatedAddons[addonIndex].options = updatedAddons[addonIndex].options.map((option, index) => {
        if (index === optionIndex) {
          return { ...option, default: true };
        }
        return { ...option, default: false };
      });
      return {
        ...prevData,
        addons: updatedAddons,
      };
    });
  };

  const handleAvailableAtChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      availableAt: [e.target.value], // Simpan sebagai array dengan satu elemen
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Format the data according to the desired output structure
    const formDataToSubmit = {
      name: formData.name,
      price: Number(formData.price),
      description: formData.description,
      category: formData.category.map(id => categoryMap[id]), // Get names instead of IDs
      imageURL: formData.imageURL || "https://placehold.co/1920x1080/png",
      toppings: formData.toppings.map((topping) => ({
        name: topping.name,
        price: Number(topping.price),
        rawMaterials: topping.rawMaterials.map((materialId) => ({
          materialId,
          quantityRequired: 0.1
        }))
      })),
      addons: formData.addons.map((addon) => ({
        name: addon.name,
        options: addon.options.map((option) => ({
          label: option.label,
          price: Number(option.price),
          isdefault: option.default  // Changed from 'default' to 'isdefault' to match target format
        })),
        rawMaterials: addon.rawMaterials.map((materialId) => ({
          materialId,
          quantityRequired: 0.2
        }))
      })),
      rawMaterials: formData.rawMaterials.map((materialId) => ({
        materialId,
        quantityRequired: 0.2
      })),
      availableAt: [formData.availableAt] // Konversi ke array
    };

    // console.log(JSON.stringify(formDataToSubmit, null, 4));

    try {
      const response = await axios.post("/api/menu/menu-items", formDataToSubmit);
      // console.log("Response:", response.data);
      // alert("Menu item created successfully!");
      navigate("/admin/menu");
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
            {categories.map((category) => (
              <div key={category._id}>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    value={category._id}
                    checked={formData.category.includes(category._id)}
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
            value={formData.availableAt}
            onChange={handleAvailableAtChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Pilih Outlet</option>
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
                    checked={formData.rawMaterials.includes(material._id)}
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
                      value={topping.name}
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

                <div>
                  <label className="block text-sm mb-1">Raw Materials</label>
                  <div className="max-h-28 overflow-y-auto border p-2 rounded">
                    {rawMaterials.map((material) => (
                      <div key={material._id}>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            value={material._id}
                            checked={topping.rawMaterials.includes(material._id)}
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
                            checked={option.default}
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

                <div>
                  <label className="block text-sm mb-1">Raw Materials</label>
                  <div className="max-h-28 overflow-y-auto border p-2 rounded">
                    {rawMaterials.map((material) => (
                      <div key={material._id}>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            value={material._id}
                            checked={addon.rawMaterials.includes(material._id)}
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
            Create Menu Item
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMenu;