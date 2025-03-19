import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Create = () => {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    imageURL: "",
    toppings: [],
    addons: [],
  });
  const [toppingsList, setToppingsList] = useState([]);
  const [addonsList, setAddonsList] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch available toppings and addons
    const fetchOptions = async () => {
      try {
        const [toppingsRes, addOnsRes, rawMaterialsRes] = await Promise.all([
          axios.get("/api/menu/toppings"),
          axios.get("/api/menu/addons"),
          axios.get("/api/storage/raw-material"),
        ]);
        setToppings(toppingsRes.data?.data || []);
        // console.log(toppingsRes);
        setAddOns(addOnsRes.data?.data || []);
        setRawMaterials(rawMaterialsRes.data?.data || []);
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
    e.preventDefault(); // Prevent page refresh
    setLoading(true);
    try {
      await axios.post("/api/menu/menu-items", formData);
      fetchMenuItems();
      onCancel();
    } catch (error) {
      console.error("Error creating menu item:", error);
      alert("Gagal menambahkan menu. Periksa koneksi atau data Anda.");
    }
  };

  // return (
  //   <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
  //     <form
  //       onSubmit={handleSubmit}
  //       className="bg-white p-6 rounded shadow-md w-full max-w-lg"
  //     >
  //       <h2 className="text-xl font-bold mb-4">Tambah Menu</h2>

  //       <div className="mb-4">
  //         <label className="block text-gray-700">Nama Menu</label>
  //         <input
  //           type="text"
  //           name="name"
  //           value={formData.name}
  //           onChange={handleInputChange}
  //           className="w-full border rounded px-3 py-2"
  //           required
  //         />
  //       </div>

  //       <div className="mb-4">
  //         <label className="block text-gray-700">Kategori</label>
  //         <input
  //           type="text"
  //           name="category"
  //           value={formData.category}
  //           onChange={handleInputChange}
  //           className="w-full border rounded px-3 py-2"
  //           required
  //         />
  //       </div>

  //       <div className="mb-4">
  //         <label className="block text-gray-700">Harga</label>
  //         <input
  //           type="number"
  //           name="price"
  //           value={formData.price}
  //           onChange={handleInputChange}
  //           className="w-full border rounded px-3 py-2"
  //           required
  //         />
  //       </div>

  //       {/* <div className="mb-4">
  //         <label className="block text-gray-700">Description</label>
  //         <textarea
  //           name="description"
  //           value={formData.description}
  //           onChange={handleInputChange}
  //           className="w-full border rounded px-3 py-2"
  //         />
  //       </div> */}

  //       <div className="mb-4">
  //         <label className="block text-gray-700">SKU</label>
  //         <input
  //           name="sku"
  //           value={formData.description}
  //           onChange={handleInputChange}
  //           className="w-full border rounded px-3 py-2"
  //         />
  //       </div>

  //       <div className="mb-4">
  //         <label className="block text-gray-700">Barcode</label>
  //         <input
  //           name="barcode"
  //           value={formData.description}
  //           onChange={handleInputChange}
  //           className="w-full border rounded px-3 py-2"
  //         />
  //       </div>

  //       <div className="mb-4">
  //         <label className="block text-gray-700">Satuan Stok</label>
  //         <input
  //           type="number"
  //           name="stock"
  //           value={formData.stock}
  //           onChange={handleInputChange}
  //           className="w-full border rounded px-3 py-2"
  //         />
  //       </div>

  //       <div className="mb-4">
  //         <label className="block text-gray-700">Foto Produk</label>
  //         <img
  //           src={formData.imageURL}
  //           alt="Uploaded"
  //           className="h-24 w-24 object-cover rounded mb-2"
  //           onClick={() => fileRef.current.click()}
  //         />
  //         <input
  //           ref={fileRef}
  //           type="file"
  //           className="hidden"
  //           onChange={(e) => setImage(e.target.files[0])}
  //         />
  //         {imagePercent > 0 && <div>Upload Progress: {imagePercent}%</div>}
  //         {imageError && <div className="text-red-500">Image upload failed</div>}
  //       </div>

  //       <div className="mb-4">
  //         <label className="block text-gray-700">Toppings</label>
  //         {toppings.map((topping) => (
  //           <div key={topping._id} className="flex items-center">
  //             <input
  //               type="checkbox"
  //               value={topping._id}
  //               checked={formData.toppings.includes(topping._id)}
  //               onChange={(e) => handleCheckboxChange(e, "toppings")}
  //             />
  //             <label className="ml-2">{topping.name}</label>
  //           </div>
  //         ))}
  //       </div>

  //       <div className="mb-4">
  //         <label className="block text-gray-700">Add-Ons</label>
  //         {addOns.map((addOn) => (
  //           <div key={addOn._id} className="flex items-center">
  //             <input
  //               type="checkbox"
  //               value={addOn._id}
  //               checked={formData.addOns.includes(addOn._id)}
  //               onChange={(e) => handleCheckboxChange(e, "addOns")}
  //             />
  //             <label className="ml-2">{addOn.name}</label>
  //           </div>
  //         ))}
  //       </div>

  //       <div className="mb-4">
  //         <label className="block text-gray-700">Raw Materials</label>
  //         <select
  //           onChange={handleRawMaterialSelect}
  //           className="w-full border rounded px-3 py-2 mb-2"
  //         >
  //           <option value="">Select Raw Material</option>
  //           {rawMaterials.map((rawMaterial) => (
  //             <option key={rawMaterial._id} value={rawMaterial._id}>
  //               {rawMaterial.name}
  //             </option>
  //           ))}
  //         </select>
  //         {formData.rawMaterials.map((material, index) => (
  //           <div key={index} className="flex items-center mb-2">
  //             <label className="w-2/3 text-gray-700">
  //               {rawMaterials.find((item) => item._id === material.materialId)?.name}
  //             </label>
  //             <input
  //               type="number"
  //               value={material.quantityRequired}
  //               onChange={(e) => handleRawMaterialChange(e, material.materialId)}
  //               className="w-20 border rounded px-3 py-2 mr-2"
  //               placeholder="Quantity"
  //               min="1"
  //             />
  //             <button
  //               type="button"
  //               onClick={() => handleRemoveRawMaterial(material.materialId)}
  //               className="bg-red-500 text-white px-3 py-1 rounded"
  //             >
  //               Remove
  //             </button>
  //           </div>
  //         ))}
  //       </div>

  //       <div className="flex justify-between">
  //         <button
  //           type="button"
  //           onClick={onCancel}
  //           className="bg-gray-400 text-white px-4 py-2 rounded"
  //         >
  //           Cancel
  //         </button>
  //         <button
  //           type="submit"
  //           disabled={loading}
  //           className="bg-blue-500 text-white px-4 py-2 rounded"
  //         >
  //           {loading ? "Saving..." : "Save"}
  //         </button>
  //       </div>
  //     </form>
  //   </div>
  // );
  return (

    <div className="container mx-auto p-4">
      <div className="flex justify-between border-b border-gray-200 py-2">
        <h1 className="text-2xl font-bold">Tambah Menu</h1>
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-white py-6 w-full flex flex-col h-full"
      >

        <div className="grid grid-cols-2 gap-4">
          <div className="mb-4">
            <label className="block mb-2 font-medium">Nama Menu</label>
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
            <label className="block mb-2 font-medium">Kategori</label>
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
            <label className="block mb-2 font-medium">Harga</label>
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
            <label className="block mb-2 font-medium">Raw Materials</label>
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

          <div className="mb-4 col-span-2">
            <label className="block mb-2 font-medium">Foto Produk</label>
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
            <label className="block mb-2 font-medium">Toppings</label>
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
            <label className="block mb-2 font-medium">Add-Ons</label>
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
        </div>

        {/* Fixed buttons at the bottom */}
        <div className="mt-auto flex justify-end gap-4">
          <Link
            to="/menu" // Specify the route to the menu page
            className="bg-gray-400 text-white px-4 py-2 rounded inline-block"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {loading ? "Saving..." : "Save"}
          </button>
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

        {/* Topping Section */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Topping</h3>
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

        {/* Add-Ons Section */}
        <div className="mb-4">
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
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
        >
          Simpan Menu
        </button>
      </form>
    </div>
  );
};

export default Create;