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
    rawMaterials: [],
  });

  const fileRef = useRef(null);
  const [image, setImage] = useState(undefined);
  const [imagePercent, setImagePercent] = useState(0);
  const [imageError, setImageError] = useState(false);

  const [toppings, setToppings] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (image) {
      handleFileUpload(image);
    }
  }, [image]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [toppingsRes, addOnsRes, rawMaterialsRes] = await Promise.all([
          axios.get("/api/toppings"),
          axios.get("/api/addons"),
          axios.get("/api/storage/raw-material"),
        ]);
        setToppings(toppingsRes.data?.data || []);
        setAddOns(addOnsRes.data?.data || []);
        setRawMaterials(rawMaterialsRes.data?.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setToppings([]);
        setAddOns([]);
        setRawMaterials([]);
      }
    };
    fetchData();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh
    setLoading(true);
    console.log(formData)
    try {
      await axios.post("/api/menu-items", formData);
      fetchMenuItems();
      onCancel();
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
          {imagePercent > 0 && <div>Upload Progress: {imagePercent}%</div>}
          {imageError && <div className="text-red-500">Image upload failed</div>}
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

        <div className="flex justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMenu;
