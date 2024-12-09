import React, { useEffect, useState } from "react";
import axios from "axios";

const UpdateMenu = ({ menuItem, fetchMenuItems, onCancel }) => {
  const [formData, setFormData] = useState({
    name: menuItem.name || "",
    price: menuItem.price || "",
    description: menuItem.description || "",
    category: menuItem.category || "",
    stock: menuItem.stock || 0,
    toppings: menuItem.toppings || [],
    addOns: menuItem.addOns || [],
  });
  const [toppings, setToppings] = useState([]);
  const [addOns, setAddOns] = useState([]);

  // Fetch available toppings and add-ons
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [toppingsRes, addOnsRes] = await Promise.all([
          axios.get("/api/toppings"),
          axios.get("/api/addons"),
        ]);
        setToppings(toppingsRes.data);
        setAddOns(addOnsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e, listName) => {
    const { value, checked } = e.target;
    const updatedList = checked
      ? [...formData[listName], value]
      : formData[listName].filter((id) => id !== value);

    setFormData({ ...formData, [listName]: updatedList });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/menu/${menuItem._id}`, formData);
      fetchMenuItems();
      onCancel();
    } catch (error) {
      console.error("Error updating menu item:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-lg"
      >
        <h2 className="text-xl font-bold mb-4">Update Menu Item</h2>

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
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Stock</label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Toppings</label>
          {toppings.map((topping) => (
            <div key={topping._id} className="flex items-center">
              <input
                type="checkbox"
                value={topping._id}
                checked={formData.toppings.includes(topping._id)}
                onChange={(e) => handleCheckboxChange(e, "toppings")}
              />
              <label className="ml-2">{topping.name}</label>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Add-Ons</label>
          {addOns.map((addOn) => (
            <div key={addOn._id} className="flex items-center">
              <input
                type="checkbox"
                value={addOn._id}
                checked={formData.addOns.includes(addOn._id)}
                onChange={(e) => handleCheckboxChange(e, "addOns")}
              />
              <label className="ml-2">{addOn.name}</label>
            </div>
          ))}
        </div>

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
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateMenu;
