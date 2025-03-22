import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const MenuCreate = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: [],
    discount: "",
    imageURL: "",
    toppings: [],
    addons: [],
    rawMaterials: [],
    availableAt: []
  });

  // State untuk menyimpan input topping dan add-ons
  const [toppingInputs, setToppingInputs] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [addonsInputs, setAddonsInputs] = useState([]);
  const [categoryInputs, setCategoryInputs] = useState([]);
  const [rawMaterialInputs, setRawMaterialInputs] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        const response = await axios.get("/api/outlet/"); // Endpoint API untuk mengambil data outlet
        setOutlets(response.data); // Menyimpan data outlet ke state
      } catch (error) {
        console.error("Error fetching outlets:", error);
        alert("Gagal memuat data outlet.");
      }
    };

    fetchOutlets(); // Memanggil fungsi untuk mengambil data outlet saat komponen dimuat
  }, []);

  // Fungsi untuk menambah input topping baru
  const addTopping = () => {
    setToppingInputs([...toppingInputs, { name: "", price: "" }]);  // Menambahkan objek kosong
  };

  // Fungsi untuk menambah input add-ons baru
  const addAddons = () => {
    setAddonsInputs([...addonsInputs, { name: "", option: "", price: "" }]);  // Menambahkan objek kosong
  };

  // Fungsi untuk menambah input category baru
  const addCategory = () => {
    setCategoryInputs([...categoryInputs, { category: "" }]);  // Menambahkan objek kosong
  };

  // Fungsi untuk menambah input raw material baru
  const addRawMaterial = () => {
    setRawMaterialInputs([...rawMaterialInputs, { name: "" }]);  // Menambahkan objek kosong
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

  const handleCategoryChange = (index, field, value) => {
    const updatedCategory = [...categoryInputs];
    updatedCategory[index][field] = value;  // Memperbarui nilai sesuai field dan index
    setCategoryInputs(updatedCategory);
  };

  const handleRawMaterialChange = (index, field, value) => {
    const updatedRawMaterial = [...rawMaterialInputs];
    updatedRawMaterial[index][field] = value;  // Memperbarui nilai sesuai field dan index
    setRawMaterialInputs(updatedRawMaterial);
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

  const removeCategories = (index) => {
    const updatedCategory = categoryInputs.filter((_, i) => i !== index);
    setCategoryInputs(updatedCategory);
  };

  const removeRawMaterial = (index) => {
    const updatedRawMaterial = rawMaterialInputs.filter((_, i) => i !== index);
    setRawMaterialInputs(updatedRawMaterial);
  };

  // const handleInputChange = (e) => {
  //   const { name, value, files } = e.target;
  //   if (name === "imageURL" && files?.length > 0) {
  //     setImagePreview(URL.createObjectURL(files[0]));
  //   }
  //   setFormData({ ...formData, [name]: value });
  // };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    // Cek jika input adalah file (imageURL)
    if (name === "imageURL" && files?.length > 0) {
      setImagePreview(URL.createObjectURL(files[0]));  // Menampilkan preview gambar
      setFormData({ ...formData, imageURL: files[0] });  // Menyimpan file gambar ke state formData
    } else {
      // Untuk input lainnya, cukup update value sesuai name
      setFormData({ ...formData, [name]: value });
    }
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

      // Untuk melihat isi FormData
      const formDataValues = {};
      formDataToSend.forEach((value, key) => {
        if (formDataValues[key]) {
          // Jika sudah ada key yang sama, jadikan array
          formDataValues[key] = [].concat(formDataValues[key], value);
        } else {
          formDataValues[key] = value;
        }
      });

      console.log('Data yang akan dikirim:', formDataValues); // Cek data yang dikirim

      await axios.post("/api/menu/menu-items", formDataToSend);
      // navigate("/");
    } catch (error) {
      console.error("Error creating menu item:", error);
      alert("Gagal menambahkan menu. Periksa koneksi atau data Anda.");
      if (error.response) {
        console.log('Server Error:', error.response.data); // Menampilkan pesan error dari server
      } else if (error.request) {
        console.log('Request Error:', error.request); // Jika tidak ada respons dari server
      } else {
        console.log('General Error:', error.message); // Menangkap error lain yang terjadi
      }
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Tambah Menu</h1>
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
            <div className="flex justify-between">
              <h3 className="block text-gray-700 text-sm font-bold mb-2">Topping</h3>
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
          {/* <div className="mb-4">
            <div className="flex justify-between">
              <h3 className="block text-gray-700 text-sm font-bold mb-2">Kategori</h3>
              <button
                onClick={addCategory}
                className="p-2 bg-blue-500 text-white rounded"
              >
                +
              </button>
            </div>
            <div className="flex flex-col">
              {categoryInputs.map((input, index) => (
                <div key={index} className="flex space-x-4 mb-2">
                  <input
                    type="text"
                    value={input.category}
                    onChange={(e) => handleCategoryChange(index, "category", e.target.value)}
                    className="w-1/2 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder=""
                  />
                  <button
                    onClick={() => removeCategories(index)}
                    className="p-2 bg-red-500 text-white rounded"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div> */}

          {/* Add-Ons Section */}
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <h3 className="block text-gray-700 text-sm font-bold mb-2">Add-Ons</h3>
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


          {/* Raw Material */}
          {/* <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Raw Material
            </label>
            <input
              type="string"
              name="raw material"
              value={formData.rawMaterials}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div> */}


          <div className="mb-4">
            <div className="flex justify-between">
              <h3 className="block text-gray-700 text-sm font-bold mb-2">Raw Material</h3>
              {/* Tombol untuk menambah input raw material */}
              <button
                onClick={addRawMaterial}
                className="p-2 bg-blue-500 text-white rounded"
              >
                +
              </button>
            </div>
            <div className="flex flex-col">
              {/* Menampilkan input Raw Material jika ada */}
              {rawMaterialInputs.map((input, index) => (
                <div key={index} className="flex space-x-4 mb-2">
                  <input
                    type="text"
                    value={input.rawMaterials}
                    onChange={(e) => handleRawMaterialChange(index, "name", e.target.value)}
                    className="w-1/2 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder=""
                  />
                  {/* Tombol Hapus untuk setiap add-on */}
                  <button
                    onClick={() => removeRawMaterial(index)}
                    className="p-2 bg-red-500 text-white rounded"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Outlate */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Outlate
            </label>
            <select
              name="availableAt"
              value={formData.availableAt}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Pilih Outlet</option>
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}> {/* Ganti dengan properti yang sesuai */}
                  {outlet.name} {/* Ganti dengan nama outlet */}
                </option>
              ))}
            </select>
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
            {imagePreview && (
              <img
                src={imagePreview}
                alt="preview"
                className="mt-2 w-full h-48 object-cover rounded-lg"
              />
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
          >
            Simpan Menu
          </button>
          <Link
            to="/admin/menu"  // Change this to your desired route (e.g., "/home")
            className="bg-gray-500 text-white px-4 py-2 rounded-lg"
          >
            Back
          </Link>
        </div>
      </form >
    </div >
  );
};

export default MenuCreate;