import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import StateFunctionCreateMenu from "./statefunction/create"
import { FaTrashAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CreateMenu = () => {
  const navigate = useNavigate();

  // Panggil StateFunctionCreateMenu untuk mendapatkan state dan fungsi
  const {
    formData,
    categoryMap,
    rawMaterials,
    selectedCategories,
    selectedRawMaterials,
    searchTermCategories,
    searchTermRawMaterials,
    searchResultsRawMaterials,
    searchResultsCategories,
    outlets,
    imagePreview,
    handleDefaultOptionChange,
    handleAddOption,
    handleAddonOptionInputChange,
    handleRemoveAddonRawMaterial,
    handleRemoveAddonOption,
    handleRemoveToppingRawMaterial,
    searchResultsToppingRawMaterials,
    searchResultsAddonRawMaterials,
    selectedToppingRawMaterials,
    selectedAddonRawMaterials,
    searchTermToppings,
    searchTermAddons,
    setSearchTermToppings,
    setSearchTermAddons,
    handleAddToppingRawMaterial,
    handleAddAddonRawMaterial,
    setSearchTermCategories,
    setSearchTermRawMaterials,
    handleAddonInputChange,
    handleAvailableAtChange,
    handleRemoveCategory,
    handleAddRawMaterial,
    handleAddTopping,
    handleRemoveTopping,
    handleAddAddon,
    handleRemoveAddon,
    handleRemoveRawMaterial,
    handleImageChange,
    handleToppingInputChange,
    handleInputChange,
    handleAddCategory,
  } = StateFunctionCreateMenu();

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log(formData);

    // Format the data according to the desired output structure
    const formDataToSubmit = {
      name: formData.name,
      price: Number(formData.price),
      description: formData.description,
      category: selectedCategories.map(id => categoryMap[id]), // Get names instead of IDs
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
      rawMaterials: selectedRawMaterials.map((materialId) => ({
        materialId,
        quantityRequired: 0.2
      })),
      availableAt: [formData.availableAt] // Konversi ke array
    };

    try {
      const response = await axios.post("/api/menu/menu-items", formDataToSubmit);
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
        <div className="">
          <label className="block font-medium">Kategori</label>
          {/* Container untuk bubble kategori yang dipilih */}
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedCategories.map(categoryId => (
              <div
                key={categoryId}
                className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
              >
                {categoryMap[categoryId] || categoryId}
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(categoryId)}
                  className="ml-2 text-green-500 hover:text-green-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Input pencarian */}
          <div className="relative">
            <input
              type="text"
              value={searchTermCategories}
              onChange={(e) => setSearchTermCategories(e.target.value)}
              placeholder="Cari kategori..."
              className="w-full p-2 border rounded"
            />

            {/* Dropdown hasil pencarian */}
            {searchTermCategories && searchResultsCategories.length > 0 && (
              <div className="absolute z-10 w-full bg-white border rounded mt-1 shadow-lg max-h-60 overflow-y-auto">
                {searchResultsCategories.map(category => (
                  <div
                    key={category._id}
                    onClick={() => handleAddCategory(category._id)}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {category.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pesan jika tidak ada hasil */}
          {searchTermCategories && searchResultsCategories.length === 0 && (
            <div className="text-gray-500 text-sm mt-2">
              Tidak ada kategori yang cocok
            </div>
          )}
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

        {/* Bahan Baku */}
        <div>
          <label className="block font-medium">Bahan Baku</label>

          {/* Container untuk bubble bahan baku yang dipilih */}
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedRawMaterials.map(materialId => {
              const material = rawMaterials.find(m => m._id === materialId);
              return (
                <div
                  key={materialId}
                  className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                >
                  {material ? material.name : materialId}
                  <button
                    type="button"
                    onClick={() => handleRemoveRawMaterial(materialId)}
                    className="ml-2 text-green-500 hover:text-green-700"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          {/* Input pencarian bahan baku */}
          <div className="relative">
            <input
              type="text"
              value={searchTermRawMaterials}
              onChange={(e) => setSearchTermRawMaterials(e.target.value)}
              placeholder="Cari bahan baku..."
              className="w-full p-2 border rounded"
            />

            {/* Dropdown hasil pencarian bahan baku */}
            {searchTermRawMaterials && searchResultsRawMaterials.length > 0 && (
              <div className="absolute z-10 w-full bg-white border rounded mt-1 shadow-lg max-h-60 overflow-y-auto">
                {searchResultsRawMaterials.map(material => (
                  <div
                    key={material._id}
                    onClick={() => handleAddRawMaterial(material._id)}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {material.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pesan jika tidak ada hasil bahan baku */}
          {searchTermRawMaterials && searchResultsRawMaterials.length === 0 && (
            <div className="text-gray-500 text-sm mt-2">
              Tidak ada bahan baku yang cocok
            </div>
          )}
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
                  {/* Container untuk bubble raw materials yang dipilih */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedToppingRawMaterials.map(materialId => {
                      const material = rawMaterials.find(m => m._id === materialId);
                      return (
                        <div
                          key={materialId}
                          className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                        >
                          {material.name}
                          <button
                            type="button"
                            onClick={() => handleRemoveToppingRawMaterial(materialId)}
                            className="ml-2 text-green-500 hover:text-green-700"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Input pencarian */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTermToppings}
                      onChange={(e) => setSearchTermToppings(e.target.value)}
                      placeholder="Cari bahan baku..."
                      className="w-full p-2 border rounded"
                    />

                    {/* Dropdown hasil pencarian */}
                    {searchTermToppings && searchResultsToppingRawMaterials.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border rounded mt-1 shadow-lg max-h-60 overflow-y-auto">
                        {searchResultsToppingRawMaterials.map(material => (
                          <div
                            key={material._id}
                            onClick={() => handleAddToppingRawMaterial(material._id)}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                          >
                            {material.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pesan jika tidak ada hasil */}
                  {searchTermToppings && searchResultsToppingRawMaterials.length === 0 && (
                    <div className="text-gray-500 text-sm mt-2">
                      Tidak ada bahan baku yang cocok
                    </div>
                  )}
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

                {/* Addon Options Section */}
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

                {/* Raw Materials Section */}
                <div>
                  {/* Container untuk bubble raw materials yang dipilih */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedAddonRawMaterials?.map(materialId => {
                      const material = rawMaterials.find(m => m._id === materialId);
                      return (
                        <div
                          key={materialId}
                          className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                        >
                          {material.name}
                          <button
                            type="button"
                            onClick={() => handleRemoveAddonRawMaterial(materialId, addonIndex)}
                            className="ml-2 text-green-500 hover:text-green-700"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Input pencarian */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTermAddons}
                      onChange={(e) => setSearchTermAddons(e.target.value)}
                      placeholder="Cari bahan baku..."
                      className="w-full p-2 border rounded"
                    />

                    {/* Dropdown hasil pencarian */}
                    {searchTermAddons && searchResultsAddonRawMaterials.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border rounded mt-1 shadow-lg max-h-60 overflow-y-auto">
                        {searchResultsAddonRawMaterials.map(material => (
                          <div
                            key={material._id}
                            onClick={() => handleAddAddonRawMaterial(material._id, addonIndex)}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                          >
                            {material.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pesan jika tidak ada hasil */}
                  {searchTermAddons && searchResultsAddonRawMaterials.length === 0 && (
                    <div className="text-gray-500 text-sm mt-2">
                      Tidak ada bahan baku yang cocok
                    </div>
                  )}
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