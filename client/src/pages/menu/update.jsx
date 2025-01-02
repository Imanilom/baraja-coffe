import React, { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../../firebase";
import { Link } from "react-router-dom";

const UpdateMenu = ({ fetchMenuItems, onCancel }) => {
  const { id } = useParams(); // Get the ID from the URL
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    stock: 0,
    toppings: [],
    addOns: [],
    imageURL: "", // Added imageURL
  });
  const [toppings, setToppings] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fileRef = useRef(null);
  const [image, setImage] = useState(undefined);
  const [imagePercent, setImagePercent] = useState(0);
  const [imageError, setImageError] = useState(false);

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

  // Fetch the menu item data by ID
  useEffect(() => {
    const fetchMenuItem = async () => {
      try {
        const response = await axios.get(`/api/menu-items/${id}`);
        const menuItem = response.data.data;
        setFormData({
          name: menuItem.name || "",
          price: menuItem.price || "",
          description: menuItem.description || "",
          category: menuItem.category || "",
          stock: menuItem.stock || 0,
          toppings: menuItem.toppings.map((topping) => topping._id) || [],
          addOns: menuItem.addOns.map((addOn) => addOn._id) || [],
          imageURL: menuItem.imageURL || "", // Populate imageURL
        });
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching menu item:", error);
        setIsLoading(false);
      }
    };
    fetchMenuItem();
  }, [id]);

  // Fetch available toppings and add-ons
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
    setFormData((prevState) => ({
      ...prevState,
      [listName]: checked
        ? [...prevState[listName], value]
        : prevState[listName].filter((id) => id !== value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        toppings: formData.toppings.map((id) => id.toString()),
        addOns: formData.addOns.map((id) => id.toString()),
      };
      await axios.put(`/api/menu-items/${id}`, payload);
      fetchMenuItems();
      onCancel();
    } catch (error) {
      console.error("Error updating menu item:", error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-lg"
      >
        <h2 className="text-xl font-bold mb-4">Update Menu Item</h2>

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
          <Link
            to={`/menu`}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </Link>
         
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
