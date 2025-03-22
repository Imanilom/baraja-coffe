import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";

const Update = () => {
  const { id } = useParams();
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: [],
    discount: "",
    imageURL: "",
    toppings: [],
    addons: [],
    rawMaterials: []
  });
  const [toppingsList, setToppingsList] = useState([]);
  const [addonsList, setAddonsList] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    // Fetch menu item details
    const fetchMenuItem = async () => {
      try {
        const response = await axios.get(`/api/menu/menu-items/${id}`);
        setFormData(response.data.data);
        setImagePreview(response.data.data.imageURL);
      } catch (error) {
        console.error("Error fetching menu item:", error);
        navigate('/')
      }
    };
    fetchMenuItem();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imageURL" && files?.length > 0) {
      setImagePreview(URL.createObjectURL(files[0]));
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (field, id) => {
    const selected = formData[field].includes(id);
    const newSelection = selected
      ? formData[field].filter((item) => item !== id)
      : [...formData[field], id];
    setFormData({ ...formData, [field]: newSelection });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((id) => formDataToSend.append(key, id));
        } else {
          formDataToSend.append(key, value);
        }
      });

      await axios.put(`/api/menu/menu-items/${id}`, formDataToSend);
      navigate('/')
    } catch (error) {
      console.error("Error updating menu item:", error);
      alert("Gagal memperbarui menu. Periksa koneksi atau data Anda.");
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Perbarui Menu</h1>
      <form
        onSubmit={handleSubmit}
        className="mx-auto bg-white p-8 rounded-lg shadow-md"
      >
        <div className="grid grid-cols-2 gap-4">

          {/* Nama Menu */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Nama Menu
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Topping Section */}
          <div className="mb-4">
            <h3 className="block text-gray-700 text-sm font-bold mb-2">Topping</h3>
            <div className="space-y-2">
              {toppingsList.map((topping) => (
                <div key={topping._id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.toppings.includes(topping._id)}
                    onChange={() => handleCheckboxChange("toppings", topping._id)}
                    className="form-checkbox h-5 w-5 text-blue-500"
                  />
                  <label className="ml-2 text-gray-700">{topping.name}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Kategori */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Kategori
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Pilih Kategori</option>
              <option value="beverage">Beverage</option>
              <option value="food">Food</option>
              <option value="instan">Instan</option>
            </select>
          </div>



          {/* Add-Ons Section */}
          <div className="mb-4">
            <h3 className="block text-gray-700 text-sm font-bold mb-2">Add-Ons</h3>
            <div className="space-y-2">
              {addonsList.map((addon) => (
                <div key={addon._id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.addons.includes(addon._id)}
                    onChange={() => handleCheckboxChange("addons", addon._id)}
                    className="form-checkbox h-5 w-5 text-blue-500"
                  />
                  <label className="ml-2 text-gray-700">{addon.name}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Harga */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Harga
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Promo */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Promo (Opsional)
            </label>
            <div className="flex space-x-4">
              <input
                type="text"
                name="promotionTitle"
                value={formData.promotionTitle}
                onChange={handleInputChange}
                placeholder="Judul promo"
                className="w-1/2 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleInputChange}
                placeholder="Diskon (%)"
                className="w-1/2 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Raw material */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Raw Material
            </label>
            <input
              type="string"
              name="rawMaterial"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Deskripsi */}
          <div className="mb-4 row-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Deskripsi
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              rows="4"
            ></textarea>
          </div>

          {/* Gambar */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Gambar
            </label>
            <input
              type="file"
              name="imageURL"
              onChange={handleInputChange}
              className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-500 file:text-white
            hover:file:bg-blue-600"
              accept="image/*"
            />
            <div className="mt-2">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <p className="text-gray-500 text-xs mt-1">
                *Biarkan kosong untuk tidak mengubah gambar
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
          >
            Simpan Perubahan
          </button>
          <Link
            to="/admin/menu"  // Change this to your desired route (e.g., "/home")
            className="bg-gray-500 text-white px-4 py-2 rounded-lg"
          >
            Back
          </Link>
        </div>
      </form>
    </div>
  );

}

export default Update;
