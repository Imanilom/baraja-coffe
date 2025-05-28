import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Example = () => {
    //     const [formData, setFormData] = useState({
    //         name: "",
    //         price: "",
    //         description: "",
    //         category: "",
    //         promotionTitle: "",
    //         discount: "",
    //         imageURL: "",
    //         toppings: [],
    //         addons: [],
    //     });
    //     const [toppingsList, setToppingsList] = useState([]);
    //     const [addonsList, setAddonsList] = useState([]);
    //     const [imagePreview, setImagePreview] = useState(null);
    //     const navigate = useNavigate();

    //     useEffect(() => {
    //         // Fetch available toppings and addons
    //         const fetchOptions = async () => {
    //             try {
    //                 const toppings = await axios.get("/api/menu/toppings");
    //                 const addons = await axios.get("/api/menu/addons");
    //                 setToppingsList(toppings.data.data);
    //                 setAddonsList(addons.data.data);
    //             } catch (error) {
    //                 console.error("Error fetching options:", error);
    //             }
    //         };
    //         fetchOptions();
    //     }, []);

    //     const handleInputChange = (e) => {
    //         const { name, value, files } = e.target;
    //         if (name === "imageURL" && files?.length > 0) {
    //             setImagePreview(URL.createObjectURL(files[0]));
    //         }
    //         setFormData({ ...formData, [name]: value });
    //     };

    //     const handleCheckboxChange = (field, id) => {
    //         const selected = formData[field].includes(id);
    //         const newSelection = selected
    //             ? formData[field].filter((item) => item !== id)
    //             : [...formData[field], id];
    //         setFormData({ ...formData, [field]: newSelection });
    //     };

    //     const handleSubmit = async (e) => {
    //         e.preventDefault();

    //         try {
    //             const formDataToSend = new FormData();
    //             Object.entries(formData).forEach(([key, value]) => {
    //                 if (Array.isArray(value)) {
    //                     value.forEach((id) => formDataToSend.append(key, id));
    //                 } else {
    //                     formDataToSend.append(key, value);
    //                 }
    //             });

    //             await axios.post("/api/menu/menu-items", formDataToSend);
    //             navigate("/");
    //         } catch (error) {
    //             console.error("Error creating menu item:", error);

    //             alert("Gagal menambahkan menu. Periksa koneksi atau data Anda.");
    //         }
    //     };

    //     return (
    //         <div className="container mx-auto p-8">
    //             <h1 className="text-3xl font-bold mb-8 text-center">Tambah Menu</h1>
    //             <form
    //                 onSubmit={handleSubmit}
    //                 className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md"
    //             >

    //                 {/* Nama Menu */}
    //                 <div className="mb-4">
    //                     <label className="block text-gray-700 text-sm font-bold mb-2">
    //                         Nama Menu
    //                     </label>
    //                     <input
    //                         type="text"
    //                         name="name"
    //                         value={formData.name}
    //                         onChange={handleInputChange}
    //                         className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
    //                         required
    //                     />
    //                 </div>

    //                 {/* Deskripsi */}
    //                 <div className="mb-4">
    //                     <label className="block text-gray-700 text-sm font-bold mb-2">
    //                         Deskripsi
    //                     </label>
    //                     <textarea
    //                         name="description"
    //                         value={formData.description}
    //                         onChange={handleInputChange}
    //                         className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
    //                         rows="4"
    //                     ></textarea>
    //                 </div>

    //                 {/* Harga */}
    //                 <div className="mb-4">
    //                     <label className="block text-gray-700 text-sm font-bold mb-2">
    //                         Harga
    //                     </label>
    //                     <input
    //                         type="number"
    //                         name="price"
    //                         value={formData.price}
    //                         onChange={handleInputChange}
    //                         className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
    //                         required
    //                     />
    //                 </div>

    //                 {/* Kategori */}
    //                 <div className="mb-4">

    //                     <label className="block text-gray-700 text-sm font-bold mb-2">
    //                         Kategori
    //                     </label>
    //                     <select
    //                         name="category"
    //                         value={formData.category}
    //                         onChange={handleInputChange}
    //                         className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
    //                         required
    //                     />
    //                     <option value="">Pilih Kategori</option>
    //                     <option value="makanan">Makanan</option>
    //                     <option value="minuman">Minuman</option>
    //                     <option value="snack">Snack</option>
    //                 </select>
    //         </div >

    //         {/* Gambar */ }
    //     < div className="mb-4" >
    //         <label className="block text-gray-700">Image</label>
    //         <img
    //             src={formData.imageURL}
    //             alt="Uploaded"
    //             className="h-24 w-24 object-cover rounded mb-2"
    //             onClick={() => fileRef.current.click()}
    //         />
    //         <label className="block text-gray-700 text-sm font-bold mb-2">
    //             Gambar
    //         </label>
    //         <input
    //             ref={fileRef}
    //             type="file"
    //             className="hidden"
    //             onChange={(e) => setImage(e.target.files[0])}
    //             name="imageURL"
    //             onChange={handleInputChange}
    //             className="block w-full text-sm text-gray-500
    //                 file:mr-4 file:py-2 file:px-4
    //                 file:rounded-full file:border-0
    //                 file:text-sm file:font-semibold
    //                 file:bg-blue-500 file:text-white
    //                 hover:file:bg-blue-600"
    //             accept="image/*"
    //         />
    //         {imagePercent > 0 && <div>Upload Progress: {imagePercent}%</div>}
    //         {imageError && <div className="text-red-500">Image upload failed</div>}
    //         {
    //             imagePreview && (
    //                 <img
    //                     src={imagePreview}
    //                     alt="preview"
    //                     className="mt-2 w-full h-48 object-cover rounded-lg"
    //                 />
    //             )
    //         }
    //     </div >

    //     {/* Promo */ }
    //     < div className="mb-4" >
    //         <label className="block text-gray-700">Toppings</label>
    //         {
    //             toppings.map((topping) => (
    //                 <div key={topping._id} className="flex items-center">
    //                     <input
    //                         type="checkbox"
    //                         value={topping._id}
    //                         checked={formData.toppings.includes(topping._id)}
    //                         onChange={(e) => handleCheckboxChange(e, "toppings")}
    //                     />
    //                     <label className="ml-2">{topping.name}</label>
    //                 </div>
    //             ))
    //         }
    //         <label className="block text-gray-700 text-sm font-bold mb-2">
    //             Promo (Opsional)
    //         </label>
    //         <div className="flex space-x-4">
    //             <input
    //                 type="text"
    //                 name="promotionTitle"
    //                 value={formData.promotionTitle}
    //                 onChange={handleInputChange}
    //                 placeholder="Judul promo"
    //                 className="w-1/2 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
    //             />
    //             <input
    //                 type="number"
    //                 name="discount"
    //                 value={formData.discount}
    //                 onChange={handleInputChange}
    //                 placeholder="Diskon (%)"
    //                 className="w-1/2 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
    //             />
    //         </div>
    //     </div >

    //     {/* Topping Section */ }
    //     < div className="mb-4" >
    //         <label className="block text-gray-700">Add-Ons</label>
    //         {
    //             addOns.map((addOn) => (
    //                 <div key={addOn._id} className="flex items-center">
    //                     <input
    //                         type="checkbox"
    //                         value={addOn._id}
    //                         checked={formData.addOns.includes(addOn._id)}
    //                         onChange={(e) => handleCheckboxChange(e, "addOns")}
    //                     />
    //                     <label className="ml-2">{addOn.name}</label>
    //                 </div>
    //             ))
    //         }
    //         <h3 className="text-lg font-semibold mb-2">Topping</h3>
    //         <div className="space-y-2">
    //             {toppingsList.map((topping) => (
    //                 <div key={topping._id} className="flex items-center">
    //                     <input
    //                         type="checkbox"
    //                         checked={formData.toppings.includes(topping._id)}
    //                         onChange={() => handleCheckboxChange("toppings", topping._id)}
    //                         className="form-checkbox h-5 w-5 text-blue-500"
    //                     />
    //                     <label className="ml-2 text-gray-700">{topping.name}</label>
    //                 </div>
    //             ))}
    //         </div>
    //     </div >

    //     {/* Add-Ons Section */ }
    //     < div className="mb-4" >
    //         <label className="block text-gray-700">Raw Materials</label>
    //         <select
    //             onChange={handleRawMaterialSelect}
    //             className="w-full border rounded px-3 py-2 mb-2"
    //         >
    //             <option value="">Select Raw Material</option>
    //             {rawMaterials.map((rawMaterial) => (
    //                   <option key={rawMaterial._id} value={rawMaterial._id}>
    //                     {rawMaterial.name}
    //                   </option>
    //               <h3 className="text-lg font-semibold mb-2">Add-Ons</h3>
    //               <div className="space-y-2">
    //                 {addonsList.map((addon) => (
    //                   <div key={addon._id} className="flex items-center">
    //                     <input
    //                       type="checkbox"
    //                       checked={formData.addons.includes(addon._id)}
    //                       onChange={() => handleCheckboxChange("addons", addon._id)}
    //                       className="form-checkbox h-5 w-5 text-blue-500"
    //                     />
    //                     <label className="ml-2 text-gray-700">{addon.name}</label>
    //                   </div>
    //                 ))}
    //               </select>
    //               {
    //                     formData.rawMaterials.map((material, index) => (
    //                         <div key={index} className="flex items-center mb-2">
    //                             <label className="w-2/3 text-gray-700">
    //                                 {rawMaterials.find((item) => item._id === material.materialId)?.name}
    //                             </label>
    //                             <input
    //                                 type="number"
    //                                 value={material.quantityRequired}
    //                                 onChange={(e) => handleRawMaterialChange(e, material.materialId)}
    //                                 className="w-20 border rounded px-3 py-2 mr-2"
    //                                 placeholder="Quantity"
    //                                 min="1"
    //                             />
    //                             <button
    //                                 type="button"
    //                                 onClick={() => handleRemoveRawMaterial(material.materialId)}
    //                                 className="bg-red-500 text-white px-3 py-1 rounded"
    //                             >
    //                                 Remove
    //                             </button>
    //                         </div>
    //                     ))
    //                 }
    //               </div>
    //             </div >

    //     <div className="flex justify-between">
    //         <button
    //             type="button"
    //             onClick={onCancel}
    //             className="bg-gray-400 text-white px-4 py-2 rounded"
    //         >
    //             Cancel
    //         </button>
    //         <button
    //             type="submit"
    //             disabled={loading}
    //             className="bg-blue-500 text-white px-4 py-2 rounded"
    //         >
    //             {loading ? "Saving..." : "Save"}
    //         </button>
    //     </div>
    // {/* Submit Button */ }
    // <button
    //     type="submit"
    //     className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
    // >
    //     Simpan Menu
    // </button>
    //           </form >
    //         </div >
    //       );
};

export default Example;