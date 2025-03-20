import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Create = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    promotionTitle: "",
    discount: "",
    imageURL: "",
    toppings: [],
    addons: [],
  });

  // State untuk menyimpan input topping dan add-ons
  const [toppingInputs, setToppingInputs] = useState([]);
  const [addonsInputs, setAddonsInputs] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

  // Fungsi untuk menambah input topping baru
  const addTopping = () => {
    setToppingInputs([...toppingInputs, { name: "", price: "" }]);  // Menambahkan objek kosong
  };

  // Fungsi untuk menambah input add-ons baru
  const addAddons = () => {
    setAddonsInputs([...addonsInputs, { name: "", option: "", price: "" }]);  // Menambahkan objek kosong
  };

  // Fungsi untuk mengubah nilai input topping
  const handleToppingChange = (index, field, value) => {
    const updatedToppings = [...toppingInputs];
    updatedToppings[index][field] = value;  // Memperbarui nilai sesuai field dan index
    setToppingInputs(updatedToppings);
  };

  // Fungsi untuk mengubah nilai input add-ons
  const handleAddonsChange = (index, field, value) => {
    const updatedAddons = [...addonsInputs];
    updatedAddons[index][field] = value;  // Memperbarui nilai sesuai field dan index
    setAddonsInputs(updatedAddons);
  };

  // Fungsi untuk menghapus input topping
  const removeTopping = (index) => {
    const updatedToppings = toppingInputs.filter((_, i) => i !== index);
    setToppingInputs(updatedToppings);
  };

  // Fungsi untuk menghapus input add-ons
  const removeAddons = (index) => {
    const updatedAddons = addonsInputs.filter((_, i) => i !== index);
    setAddonsInputs(updatedAddons);
  };

  useEffect(() => {
    // Fetch available toppings and addons
    const fetchOptions = async () => {
      try {
        const toppings = await axios.get("/api/menu/toppings");
        const addons = await axios.get("/api/menu/addons");
        setToppingsList(toppings.data.data);
        setAddonsList(addons.data.data);
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };
    fetchOptions();
  }, []);

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

      await axios.post("/api/menu/menu-items", formDataToSend);
      navigate("/");
    } catch (error) {
      console.error("Error creating menu item:", error);
      alert("Gagal menambahkan menu. Periksa koneksi atau data Anda.");
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Tambah Menu</h1>
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md"
      >
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

        {/* Deskripsi */}
        <div className="mb-4">
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
            <option value="makanan">Makanan</option>
            <option value="minuman">Minuman</option>
            <option value="snack">Snack</option>
          </select>
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
          {imagePreview && (
            <img
              src={imagePreview}
              alt="preview"
              className="mt-2 w-full h-48 object-cover rounded-lg"
            />
          )}
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

        {/* Add-Ons Section */}
        {/* <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Add-Ons</h3>
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
        </div> */}

        {/* Topping Section */}
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <h3 className="text-lg font-semibold mb-2">Topping</h3>
            {/* Tombol untuk menambah input topping */}
            <button
              onClick={addTopping}
              className="p-2 bg-blue-500 text-white rounded"
            >
              +
            </button>
          </div>
          <div className="flex flex-col">
            {/* Menampilkan input Topping jika ada */}
            {toppingInputs.map((input, index) => (
              <div key={index} className="flex space-x-4 mb-2">
                <input
                  type="text"
                  value={input.name}
                  onChange={(e) => handleToppingChange(index, "name", e.target.value)}
                  className="w-1/2 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Nama"
                />
                <input
                  type="text"
                  value={input.price}
                  onChange={(e) => handleToppingChange(index, "price", e.target.value)}
                  className="w-1/2 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Harga"
                />
                {/* Tombol Hapus untuk setiap add-on */}
                <button
                  onClick={() => removeTopping(index)}
                  className="p-2 bg-red-500 text-white rounded"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add-Ons Section */}
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <h3 className="text-lg font-semibold mb-2">Add-Ons</h3>
            {/* Tombol untuk menambah input add-ons */}
            <button
              onClick={addAddons}
              className="p-2 bg-blue-500 text-white rounded"
            >
              +
            </button>
          </div>
          <div className="flex flex-col">
            {/* Menampilkan input Add-Ons jika ada */}
            {addonsInputs.map((input, index) => (
              <div key={index} className="flex space-x-4 mb-2">
                <input
                  type="text"
                  value={input.name}
                  onChange={(e) => handleAddonsChange(index, "name", e.target.value)}
                  className="w-1/2 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Nama"
                />
                <input
                  type="text"
                  value={input.option}
                  onChange={(e) => handleAddonsChange(index, "option", e.target.value)}
                  className="w-1/2 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Opsi"
                />
                <input
                  type="text"
                  value={input.price}
                  onChange={(e) => handleAddonsChange(index, "price", e.target.value)}
                  className="w-1/2 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Harga"
                />
                {/* Tombol Hapus untuk setiap add-on */}
                <button
                  onClick={() => removeAddons(index)}
                  className="p-2 bg-red-500 text-white rounded"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
        >
          Simpan Menu
        </button>
        <Link
          to="/menu"  // Change this to your desired route (e.g., "/home")
          className="block bg-gray-500 text-white px-4 py-2 rounded-lg mt-2 text-center"
        >
          Back
        </Link>
      </form >
    </div >
  );
};

export default Create;