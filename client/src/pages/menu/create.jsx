import React, { useEffect, useState } from "react";
import axios from "axios";

const CreateMenu = ({ fetchMenuItems, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    stock: 0,
    toppings: [],
    addOns: [],
  });
  const [toppings, setToppings] = useState([]);
  const [addOns, setAddOns] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [toppingsRes, addOnsRes] = await Promise.all([
          axios.get("http://localhost:3000/api/toppings"),
          axios.get("http://localhost:3000/api/addons"),
        ]);
        setToppings(Array.isArray(toppingsRes.data) ? toppingsRes.data : []);
        setAddOns(Array.isArray(addOnsRes.data) ? addOnsRes.data : []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setToppings([]);
        setAddOns([]);
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
      await axios.post("http://localhost:3000/api/menu", formData);
      fetchMenuItems();
      onCancel();
    } catch (error) {
      console.error("Error creating menu item:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-lg"
      >
        <h2 className="text-xl font-bold mb-4">Create Menu Item</h2>

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
          <label className="block text-gray-700">Toppings</label>
          {toppings.length > 0 ? (
            toppings.map((topping) => (
              <div key={topping._id} className="flex items-center">
                <input
                  type="checkbox"
                  value={topping._id}
                  onChange={(e) => handleCheckboxChange(e, "toppings")}
                />
                <label className="ml-2">{topping.name}</label>
              </div>
            ))
          ) : (
            <p>No toppings available</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Add-Ons</label>
          {addOns.length > 0 ? (
            addOns.map((addOn) => (
              <div key={addOn._id} className="flex items-center">
                <input
                  type="checkbox"
                  value={addOn._id}
                  onChange={(e) => handleCheckboxChange(e, "addOns")}
                />
                <label className="ml-2">{addOn.name}</label>
              </div>
            ))
          ) : (
            <p>No add-ons available</p>
          )}
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
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMenu;
