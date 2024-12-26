import React, { useRef, useEffect, useState } from "react";
import axios from "axios";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../../firebase";

const CreateMenu = ({ fetchMenuItems, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    stock: 0,
    imageURL: "",
    toppings: [],
    addOns: [],
  });

  const fileRef = useRef(null);
  const [image, setImage] = useState(undefined);
  const [imagePercent, setImagePercent] = useState(0);
  const [imageError, setImageError] = useState(false);

  const [toppings, setToppings] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (image) {
      handleFileUpload(image);
    }
  }, [image]);

  const handleFileUpload = async (image) => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + image.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, image);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setImagePercent(Math.round(progress));
      },
      (error) => {
        setImageError(true);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) =>
          setFormData((prevData) => ({ ...prevData, imageURL: downloadURL }))
        );
      }
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [toppingsRes, addOnsRes] = await Promise.all([
          axios.get("/api/toppings"),
          axios.get("/api/addons"),
        ]);
        setToppings(toppingsRes.data?.data || []);
        setAddOns(addOnsRes.data?.data || []);
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
    setFormData((prevData) => ({
      ...prevData,
      [listName]: checked
        ? [...prevData[listName], value]
        : prevData[listName].filter((id) => id !== value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log(formData)
    try {
      await axios.post("/api/menu-items", formData);
      fetchMenuItems(); // Refresh menu list
      onCancel(); // Close the modal
    } catch (error) {
      console.error("Error creating menu item:", error);
    } finally {
      setLoading(false);
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
          <label className="block text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2"
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
          <label className="block text-gray-700">Image</label>
          <img
            src={formData.imageURL}
            alt="Uploaded"
            className="h-24 w-24 object-cover rounded mb-2"
            onClick={() => fileRef.current.click()}
          />
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => setImage(e.target.files[0])}
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
            className={`${
              loading ? "bg-blue-300" : "bg-blue-500"
            } text-white px-4 py-2 rounded`}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMenu;
