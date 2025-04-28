// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";
// import { FaTrashAlt } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";

// const CreateMenu = () => {
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const response = await axios.get("/api/menu/categories");
//         const fetchedCategories = response.data.data || [];
//         setCategories(fetchedCategories);

//         // Create a mapping of category IDs to names
//         const map = {};
//         fetchedCategories.forEach(category => {
//           map[category._id] = category.name;
//         });
//         setCategoryMap(map);
//       } catch (error) {
//         console.error("Error fetching categories:", error);
//       }
//     };

//     const fetchOutlets = async () => {
//       try {
//         const response = await axios.get("/api/outlet/");
//         setOutlets(response.data || []);
//       } catch (error) {
//         console.error("Error fetching outlets:", error);
//       }
//     };

//     const fetchRawMaterial = async () => {
//       try {
//         const response = await axios.get("/api/storage/raw-material");
//         setRawMaterials(response.data.data || []);
//       } catch (error) {
//         console.error("Error fetching raw materials:", error);
//       }
//     };

//     fetchCategories();
//     fetchOutlets();
//     fetchRawMaterial();
//   }, []);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prevData) => ({
//       ...prevData,
//       [name]: value,
//     }));
//   };

//   const handleCategoryChange = (e) => {
//     const { value, checked } = e.target;
//     setFormData((prevData) => {
//       const updatedCategories = checked
//         ? [...prevData.category, value]
//         : prevData.category.filter((category) => category !== value);
//       return {
//         ...prevData,
//         category: updatedCategories,
//       };
//     });
//   };

//   const compressImage = (file) => {
//     return new Promise((resolve) => {
//       const reader = new FileReader();
//       reader.readAsDataURL(file);
//       reader.onload = (event) => {
//         const img = new Image();
//         img.src = event.target.result;
//         img.onload = () => {
//           const canvas = document.createElement('canvas');
//           const ctx = canvas.getContext('2d');

//           // Mempertahankan aspek rasio tetapi mengurangi ukuran jika perlu
//           let width = img.width;
//           let height = img.height;
//           const MAX_WIDTH = 1200;
//           const MAX_HEIGHT = 1200;

//           if (width > height) {
//             if (width > MAX_WIDTH) {
//               height *= MAX_WIDTH / width;
//               width = MAX_WIDTH;
//             }
//           } else {
//             if (height > MAX_HEIGHT) {
//               width *= MAX_HEIGHT / height;
//               height = MAX_HEIGHT;
//             }
//           }

//           canvas.width = width;
//           canvas.height = height;

//           ctx.drawImage(img, 0, 0, width, height);

//           // Mengatur kualitas kompresi (0.7 berarti 70% kualitas)
//           canvas.toBlob((blob) => {
//             resolve(new File([blob], file.name, {
//               type: 'image/jpeg',
//               lastModified: Date.now()
//             }));
//           }, 'image/jpeg', 0.7); // Mengatur format ke JPEG dan kualitas 0.7
//         };
//       };
//     });
//   };

//   const handleImageChange = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     // Cek ukuran file (dalam bytes, 1MB = 1048576 bytes)
//     if (file.size > 1048576) {
//       // File lebih besar dari 1MB, kompresi diperlukan
//       const compressedFile = await compressImage(file);
//       const base64String = await convertToBase64(compressedFile);
//       setFormData((prevData) => ({
//         ...prevData,
//         imageURL: base64String,
//       }));
//       const imageUrl = URL.createObjectURL(compressedFile);
//       setImagePreview(imageUrl);
//     } else {
//       // File sudah di bawah 1MB
//       const base64String = await convertToBase64(file);
//       setFormData((prevData) => ({
//         ...prevData,
//         imageURL: base64String,
//       }));
//       const imageUrl = URL.createObjectURL(file);
//       setImagePreview(imageUrl);
//     }
//   };

//   // Helper function to convert file to base64
//   const convertToBase64 = (file) => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.readAsDataURL(file);
//       reader.onload = () => resolve(reader.result);
//       reader.onerror = (error) => reject(error);
//     });
//   };

//   const handleRawMaterialChange = (e) => {
//     const { value, checked } = e.target;
//     setFormData((prevData) => {
//       const updatedRawMaterials = checked
//         ? [...prevData.rawMaterials, value]
//         : prevData.rawMaterials.filter((rawMaterial) => rawMaterial !== value);
//       return {
//         ...prevData,
//         rawMaterials: updatedRawMaterials,
//       };
//     });
//   };

//   const handleToppingInputChange = (index, field, value) => {
//     setFormData((prevData) => {
//       const updatedToppings = [...prevData.toppings];
//       updatedToppings[index] = {
//         ...updatedToppings[index],
//         [field]: value,
//       };
//       return {
//         ...prevData,
//         toppings: updatedToppings,
//       };
//     });
//   };

//   const handleToppingRawMaterialChange = (toppingIndex, e) => {
//     const { value, checked } = e.target;
//     setFormData((prevData) => {
//       const updatedToppings = [...prevData.toppings];

//       // Initialize rawMaterials array if it doesn't exist
//       if (!updatedToppings[toppingIndex].rawMaterials) {
//         updatedToppings[toppingIndex].rawMaterials = [];
//       }

//       let updatedRawMaterials = [...updatedToppings[toppingIndex].rawMaterials];

//       if (checked) {
//         updatedRawMaterials.push(value);
//       } else {
//         updatedRawMaterials = updatedRawMaterials.filter(
//           (materialId) => materialId !== value
//         );
//       }

//       updatedToppings[toppingIndex] = {
//         ...updatedToppings[toppingIndex],
//         rawMaterials: updatedRawMaterials,
//       };

//       return {
//         ...prevData,
//         toppings: updatedToppings,
//       };
//     });
//   };

//   const handleAddonInputChange = (index, field, value) => {
//     setFormData((prevData) => {
//       const updatedAddons = [...prevData.addons];
//       updatedAddons[index] = {
//         ...updatedAddons[index],
//         [field]: value,
//       };
//       return {
//         ...prevData,
//         addons: updatedAddons,
//       };
//     });
//   };

//   const handleAddonOptionInputChange = (addonIndex, optionIndex, field, value) => {
//     setFormData((prevData) => {
//       const updatedAddons = [...prevData.addons];
//       updatedAddons[addonIndex].options[optionIndex] = {
//         ...updatedAddons[addonIndex].options[optionIndex],
//         [field]: field === "price" ? value : value,
//       };
//       return {
//         ...prevData,
//         addons: updatedAddons,
//       };
//     });
//   };

//   const handleAddonRawMaterialChange = (addonIndex, e) => {
//     const { value, checked } = e.target;
//     setFormData((prevData) => {
//       const updatedAddons = [...prevData.addons];

//       // Initialize rawMaterials array if it doesn't exist
//       if (!updatedAddons[addonIndex].rawMaterials) {
//         updatedAddons[addonIndex].rawMaterials = [];
//       }

//       let updatedRawMaterials = [...updatedAddons[addonIndex].rawMaterials];

//       if (checked) {
//         updatedRawMaterials.push(value);
//       } else {
//         updatedRawMaterials = updatedRawMaterials.filter(
//           (materialId) => materialId !== value
//         );
//       }

//       updatedAddons[addonIndex] = {
//         ...updatedAddons[addonIndex],
//         rawMaterials: updatedRawMaterials,
//       };

//       return {
//         ...prevData,
//         addons: updatedAddons,
//       };
//     });
//   };

//   const handleAddTopping = () => {
//     setFormData((prevData) => ({
//       ...prevData,
//       toppings: [...prevData.toppings, { name: "", price: "", rawMaterials: [] }],
//     }));
//   };

//   const handleAddAddon = () => {
//     setFormData((prevData) => ({
//       ...prevData,
//       addons: [
//         ...prevData.addons,
//         { name: "", options: [{ label: "", price: "", default: false }], rawMaterials: [] },
//       ],
//     }));
//   };

//   const handleRemoveTopping = (index) => {
//     setFormData((prevData) => {
//       const updatedToppings = prevData.toppings.filter((_, i) => i !== index);
//       return {
//         ...prevData,
//         toppings: updatedToppings,
//       };
//     });
//   };

//   const handleRemoveAddon = (index) => {
//     setFormData((prevData) => {
//       const updatedAddons = prevData.addons.filter((_, i) => i !== index);
//       return {
//         ...prevData,
//         addons: updatedAddons,
//       };
//     });
//   };

//   const handleRemoveAddonOption = (addonIndex, optionIndex) => {
//     setFormData((prevData) => {
//       const updatedAddons = [...prevData.addons];
//       updatedAddons[addonIndex].options = updatedAddons[addonIndex].options.filter(
//         (_, i) => i !== optionIndex
//       );
//       return {
//         ...prevData,
//         addons: updatedAddons,
//       };
//     });
//   };

//   const handleAddOption = (addonIndex) => {
//     setFormData((prevData) => {
//       const updatedAddons = [...prevData.addons];
//       updatedAddons[addonIndex].options.push({ label: "", price: "", default: false });
//       return {
//         ...prevData,
//         addons: updatedAddons,
//       };
//     });
//   };

//   const handleDefaultOptionChange = (addonIndex, optionIndex) => {
//     setFormData((prevData) => {
//       const updatedAddons = [...prevData.addons];
//       updatedAddons[addonIndex].options = updatedAddons[addonIndex].options.map((option, index) => {
//         if (index === optionIndex) {
//           return { ...option, default: true };
//         }
//         return { ...option, default: false };
//       });
//       return {
//         ...prevData,
//         addons: updatedAddons,
//       };
//     });
//   };

//   const handleAvailableAtChange = (e) => {
//     setFormData((prevData) => ({
//       ...prevData,
//       availableAt: [e.target.value], // Simpan sebagai array dengan satu elemen
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     console.log(formData);

//     // Format the data according to the desired output structure
//     const formDataToSubmit = {
//       name: formData.name,
//       price: Number(formData.price),
//       description: formData.description,
//       category: selectedCategories.map(id => categoryMap[id]), // Get names instead of IDs
//       imageURL: formData.imageURL || "https://placehold.co/1920x1080/png",
//       toppings: formData.toppings.map((topping) => ({
//         name: topping.name,
//         price: Number(topping.price),
//         rawMaterials: topping.rawMaterials.map((materialId) => ({
//           materialId,
//           quantityRequired: 0.1
//         }))
//       })),
//       addons: formData.addons.map((addon) => ({
//         name: addon.name,
//         options: addon.options.map((option) => ({
//           label: option.label,
//           price: Number(option.price),
//           isdefault: option.default  // Changed from 'default' to 'isdefault' to match target format
//         })),
//         rawMaterials: addon.rawMaterials.map((materialId) => ({
//           materialId,
//           quantityRequired: 0.2
//         }))
//       })),
//       rawMaterials: selectedRawMaterials.map((materialId) => ({
//         materialId,
//         quantityRequired: 0.2
//       })),
//       availableAt: [formData.availableAt] // Konversi ke array
//     };

//     try {
//       const response = await axios.post("/api/menu/menu-items", formDataToSubmit);
//       navigate("/admin/menu");
//     } catch (error) {
//       console.error("Error creating menu item:", error);
//     }
//   };

//   return (
//     <div className="max-w-2xl mx-auto p-4">
//       <h2 className="text-2xl font-bold mb-4">Create Menu Item</h2>
//       <form onSubmit={handleSubmit} className="space-y-4">
//         {/* Name */}
//         <div>
//           <label className="block font-medium">Name</label>
//           <input
//             type="text"
//             name="name"
//             value={formData.name}
//             onChange={handleInputChange}
//             className="w-full p-2 border rounded"
//             required
//           />
//         </div>

//         {/* Price */}
//         <div>
//           <label className="block font-medium">Price</label>
//           <input
//             type="number"
//             name="price"
//             value={formData.price}
//             onChange={handleInputChange}
//             className="w-full p-2 border rounded"
//             required
//           />
//         </div>

//         {/* Description */}
//         <div>
//           <label className="block font-medium">Description</label>
//           <textarea
//             name="description"
//             value={formData.description}
//             onChange={handleInputChange}
//             className="w-full p-2 border rounded"
//           />
//         </div>

//         {/* Category (Checkboxes) */}
//         <div>
//           <label className="block font-medium">Categories</label>
//           <div className="space-y-2">
//             {categories.map((category) => (
//               <div key={category._id}>
//                 <label className="inline-flex items-center">
//                   <input
//                     type="checkbox"
//                     value={category._id}
//                     checked={formData.category.includes(category._id)}
//                     onChange={handleCategoryChange}
//                     className="mr-2"
//                   />
//                   {category.name}
//                 </label>
//               </div>
//             ))}
//           </div >
//         </div >

//         {/* Image File Input */}
//         < div >
//           <label className="block font-medium">Image</label>
//           <input
//             type="file"
//             name="imageURL"
//             accept="image/*"
//             onChange={handleImageChange}
//             className="w-full p-2 border rounded"
//           />
//         </div >

//         {/* Display the image preview */}
//         {
//           imagePreview && (
//             <div className="mt-4">
//               <img src={imagePreview} alt="Image Preview" className="w-full max-h-60 object-cover rounded" />
//             </div>
//           )
//         }

//         {/* Available At (Dropdown) */}
//         <div>
//           <label className="block font-medium">Available At</label>
//           <select
//             name="availableAt"
//             value={formData.availableAt}
//             onChange={handleAvailableAtChange}
//             className="w-full p-2 border rounded"
//           >
//             <option value="">Pilih Outlet</option>
//             {outlets.length > 0 ? (
//               outlets.map((outlet) => (
//                 <option key={outlet._id} value={outlet._id}>
//                   {outlet.name}
//                 </option>
//               ))
//             ) : (
//               <option value="">Loading outlets...</option>
//             )}
//           </select>
//         </div>

//         {/* Bahan Baku */}
//         <div>
//           <label className="block font-medium">Bahan Baku</label>

//           {/* Container untuk bubble bahan baku yang dipilih */}
//           <div className="flex flex-wrap gap-2 mb-4">
//             {selectedRawMaterials.map(materialId => {
//               const material = rawMaterials.find(m => m._id === materialId);
//               return (
//                 <div
//                   key={materialId}
//                   className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
//                 >
//                   {material ? material.name : materialId}
//                   <button
//                     type="button"
//                     onClick={() => handleRemoveRawMaterial(materialId)}
//                     className="ml-2 text-green-500 hover:text-green-700"
//                   >
//                     ×
//                   </button>
//                 </div>
//               );
//             })}
//           </div>

//           {/* Input pencarian bahan baku */}
//           <div className="relative">
//             <input
//               type="text"
//               value={searchTermRawMaterials}
//               onChange={(e) => setSearchTermRawMaterials(e.target.value)}
//               placeholder="Cari bahan baku..."
//               className="w-full p-2 border rounded"
//             />

//             {/* Dropdown hasil pencarian bahan baku */}
//             {searchTermRawMaterials && searchResultsRawMaterials.length > 0 && (
//               <div className="absolute z-10 w-full bg-white border rounded mt-1 shadow-lg max-h-60 overflow-y-auto">
//                 {searchResultsRawMaterials.map(material => (
//                   <div
//                     key={material._id}
//                     onClick={() => handleAddRawMaterial(material._id)}
//                     className="p-2 hover:bg-gray-100 cursor-pointer"
//                   >
//                     {material.name}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Pesan jika tidak ada hasil bahan baku */}
//           {searchTermRawMaterials && searchResultsRawMaterials.length === 0 && (
//             <div className="text-gray-500 text-sm mt-2">
//               Tidak ada bahan baku yang cocok
//             </div>
//           )}
//         </div>

//         {/* Toppings */}
//         <div>
//           <div className="flex justify-between items-center mb-2">
//             <label className="block font-medium">Toppings</label>
//             <button
//               type="button"
//               onClick={handleAddTopping}
//               className="bg-green-500 text-white px-2 py-1 rounded text-sm"
//             >
//               + Add Topping
//             </button>
//           </div>

//           <div className="space-y-4">
//             {formData.toppings.map((topping, toppingIndex) => (
//               <div key={toppingIndex} className="border p-3 rounded">
//                 <div className="flex justify-between items-center mb-2">
//                   <h4 className="font-medium">Topping #{toppingIndex + 1}</h4>
//                   <button
//                     type="button"
//                     onClick={() => handleRemoveTopping(toppingIndex)}
//                     className="text-red-500"
//                   >
//                     <FaTrashAlt />
//                   </button>
//                 </div>

//                 <div className="grid grid-cols-2 gap-2 mb-2">
//                   <div>
//                     <label className="block text-sm">Name</label>
//                     <input
//                       type="text"
//                       value={topping.name}
//                       onChange={(e) => handleToppingInputChange(toppingIndex, "name", e.target.value)}
//                       className="w-full p-2 border rounded"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm">Price</label>
//                     <input
//                       type="number"
//                       value={topping.price}
//                       onChange={(e) => handleToppingInputChange(toppingIndex, "price", e.target.value)}
//                       className="w-full p-2 border rounded"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   {/* Container untuk bubble raw materials yang dipilih */}
//                   <div className="flex flex-wrap gap-2 mb-4">
//                     {selectedToppingRawMaterials.map(materialId => {
//                       const material = rawMaterials.find(m => m._id === materialId);
//                       return (
//                         <div
//                           key={materialId}
//                           className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
//                         >
//                           {material.name}
//                           <button
//                             type="button"
//                             onClick={() => handleRemoveToppingRawMaterial(materialId)}
//                             className="ml-2 text-green-500 hover:text-green-700"
//                           >
//                             ×
//                           </button>
//                         </div>
//                       );
//                     })}
//                   </div>

//                   {/* Input pencarian */}
//                   <div className="relative">
//                     <input
//                       type="text"
//                       value={searchTermToppings}
//                       onChange={(e) => setSearchTermToppings(e.target.value)}
//                       placeholder="Cari bahan baku..."
//                       className="w-full p-2 border rounded"
//                     />

//                     {/* Dropdown hasil pencarian */}
//                     {searchTermToppings && searchResultsToppingRawMaterials.length > 0 && (
//                       <div className="absolute z-10 w-full bg-white border rounded mt-1 shadow-lg max-h-60 overflow-y-auto">
//                         {searchResultsToppingRawMaterials.map(material => (
//                           <div
//                             key={material._id}
//                             onClick={() => handleAddToppingRawMaterial(material._id)}
//                             className="p-2 hover:bg-gray-100 cursor-pointer"
//                           >
//                             {material.name}
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>

//                   {/* Pesan jika tidak ada hasil */}
//                   {searchTermToppings && searchResultsToppingRawMaterials.length === 0 && (
//                     <div className="text-gray-500 text-sm mt-2">
//                       Tidak ada bahan baku yang cocok
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Addons */}
//         <div>
//           <div className="flex justify-between items-center mb-2">
//             <label className="block font-medium">Addons</label>
//             <button
//               type="button"
//               onClick={handleAddAddon}
//               className="bg-green-500 text-white px-2 py-1 rounded text-sm"
//             >
//               + Add Addon
//             </button>
//           </div>

//           <div className="space-y-4">
//             {formData.addons.map((addon, addonIndex) => (
//               <div key={addonIndex} className="border p-3 rounded">
//                 <div className="flex justify-between items-center mb-2">
//                   <h4 className="font-medium">Addon #{addonIndex + 1}</h4>
//                   <button
//                     type="button"
//                     onClick={() => handleRemoveAddon(addonIndex)}
//                     className="text-red-500"
//                   >
//                     <FaTrashAlt />
//                   </button>
//                 </div>

//                 <div className="mb-2">
//                   <label className="block text-sm">Name</label>
//                   <input
//                     type="text"
//                     value={addon.name}
//                     onChange={(e) => handleAddonInputChange(addonIndex, "name", e.target.value)}
//                     className="w-full p-2 border rounded"
//                   />
//                 </div>

//                 {/* Addon Options Section */}
//                 <div className="mb-3">
//                   <div className="flex justify-between items-center mb-2">
//                     <label className="block text-sm font-medium">Options</label>
//                     <button
//                       type="button"
//                       onClick={() => handleAddOption(addonIndex)}
//                       className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
//                     >
//                       + Add Option
//                     </button>
//                   </div>

//                   <div className="space-y-2">
//                     {addon.options.map((option, optionIndex) => (
//                       <div key={optionIndex} className="flex items-center space-x-2 border p-2 rounded">
//                         <div className="flex-1">
//                           <label className="block text-xs">Label</label>
//                           <input
//                             type="text"
//                             value={option.label}
//                             onChange={(e) =>
//                               handleAddonOptionInputChange(addonIndex, optionIndex, "label", e.target.value)
//                             }
//                             className="w-full p-1 border rounded"
//                           />
//                         </div>
//                         <div className="w-20">
//                           <label className="block text-xs">Price</label>
//                           <input
//                             type="number"
//                             value={option.price}
//                             onChange={(e) =>
//                               handleAddonOptionInputChange(addonIndex, optionIndex, "price", e.target.value)
//                             }
//                             className="w-full p-1 border rounded"
//                           />
//                         </div>
//                         <div className="w-16 text-center">
//                           <label className="block text-xs">Default</label>
//                           <input
//                             type="radio"
//                             checked={option.default}
//                             onChange={() => handleDefaultOptionChange(addonIndex, optionIndex)}
//                             className="mt-1"
//                           />
//                         </div>
//                         <button
//                           type="button"
//                           onClick={() => handleRemoveAddonOption(addonIndex, optionIndex)}
//                           className="text-red-500"
//                         >
//                           <FaTrashAlt />
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Raw Materials Section */}
//                 <div>
//                   {/* Container untuk bubble raw materials yang dipilih */}
//                   <div className="flex flex-wrap gap-2 mb-4">
//                     {selectedAddonRawMaterials?.map(materialId => {
//                       const material = rawMaterials.find(m => m._id === materialId);
//                       return (
//                         <div
//                           key={materialId}
//                           className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
//                         >
//                           {material.name}
//                           <button
//                             type="button"
//                             onClick={() => handleRemoveAddonRawMaterial(materialId, addonIndex)}
//                             className="ml-2 text-green-500 hover:text-green-700"
//                           >
//                             ×
//                           </button>
//                         </div>
//                       );
//                     })}
//                   </div>

//                   {/* Input pencarian */}
//                   <div className="relative">
//                     <input
//                       type="text"
//                       value={searchTermAddons}
//                       onChange={(e) => setSearchTermAddons(e.target.value)}
//                       placeholder="Cari bahan baku..."
//                       className="w-full p-2 border rounded"
//                     />

//                     {/* Dropdown hasil pencarian */}
//                     {searchTermAddons && searchResultsAddonRawMaterials.length > 0 && (
//                       <div className="absolute z-10 w-full bg-white border rounded mt-1 shadow-lg max-h-60 overflow-y-auto">
//                         {searchResultsAddonRawMaterials.map(material => (
//                           <div
//                             key={material._id}
//                             onClick={() => handleAddAddonRawMaterial(material._id, addonIndex)}
//                             className="p-2 hover:bg-gray-100 cursor-pointer"
//                           >
//                             {material.name}
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>

//                   {/* Pesan jika tidak ada hasil */}
//                   {searchTermAddons && searchResultsAddonRawMaterials.length === 0 && (
//                     <div className="text-gray-500 text-sm mt-2">
//                       Tidak ada bahan baku yang cocok
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         <div>
//           <button
//             type="submit"
//             className="w-full bg-blue-500 text-white py-2 rounded"
//           >
//             Create Menu Item
//           </button>
//         </div>
//       </form >
//     </div >
//   );
// };

// export default CreateMenu;

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import StateFunctionCreateMenu from "./statefunction/create"
import { FaTrashAlt, FaChevronRight, FaShoppingBag, FaBell, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CreateMenu = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  // Panggil StateFunctionCreateMenu untuk mendapatkan state dan fungsi
  const {
    formData,
    categoryMap,
    rawMaterials,
    selectedCategories,
    selectedRawMaterials,
    searchTermCategories,
    searchTermRawMaterials,
    searchResultsRawMaterials,
    searchResultsCategories,
    outlets,
    imagePreview,
    handleDefaultOptionChange,
    handleAddOption,
    handleAddonOptionInputChange,
    handleRemoveAddonRawMaterial,
    handleRemoveAddonOption,
    handleRemoveToppingRawMaterial,
    searchResultsToppingRawMaterials,
    searchResultsAddonRawMaterials,
    selectedToppingRawMaterials,
    selectedAddonRawMaterials,
    searchTermToppings,
    searchTermAddons,
    setSearchTermToppings,
    setSearchTermAddons,
    handleAddToppingRawMaterial,
    handleAddAddonRawMaterial,
    setSearchTermCategories,
    setSearchTermRawMaterials,
    handleAddonInputChange,
    handleAvailableAtChange,
    handleRemoveCategory,
    handleAddRawMaterial,
    handleAddTopping,
    handleRemoveTopping,
    handleAddAddon,
    handleRemoveAddon,
    handleRemoveRawMaterial,
    handleImageChange,
    handleToppingInputChange,
    handleInputChange,
    handleAddCategory,
  } = StateFunctionCreateMenu();

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log(formData);

    // Format the data according to the desired output structure
    const formDataToSubmit = {
      name: formData.name,
      price: Number(formData.price),
      description: formData.description,
      category: selectedCategories.map(id => categoryMap[id]), // Get names instead of IDs
      imageURL: formData.imageURL || "https://placehold.co/1920x1080/png",
      toppings: formData.toppings.map((topping) => ({
        name: topping.name,
        price: Number(topping.price),
        rawMaterials: topping.rawMaterials.map((materialId) => ({
          materialId,
          quantityRequired: 0.1
        }))
      })),
      addons: formData.addons.map((addon) => ({
        name: addon.name,
        options: addon.options.map((option) => ({
          label: option.label,
          price: Number(option.price),
          isdefault: option.default  // Changed from 'default' to 'isdefault' to match target format
        })),
        rawMaterials: addon.rawMaterials.map((materialId) => ({
          materialId,
          quantityRequired: 0.2
        }))
      })),
      rawMaterials: selectedRawMaterials.map((materialId) => ({
        materialId,
        quantityRequired: 0.2
      })),
      availableAt: [formData.availableAt] // Konversi ke array
    };

    try {
      const response = await axios.post("/api/menu/menu-items", formDataToSubmit);
      navigate("/admin/menu");
    } catch (error) {
      console.error("Error creating menu item:", error);
    }
  };

  return (
    <div className="">
      <div className="flex justify-end px-6 items-center py-5 space-x-2 border-b">
        <FaBell className="text-2xl text-gray-400" />
        <Link
          to="/admin/menu"
          className="text-gray-400 inline-block text-2xl"
        >
          <FaUser />
        </Link>

      </div>
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-2 flex justify-between items-center border-b">
          <div className="flex items-center space-x-2">
            <FaShoppingBag className="text-gray-400 inline-block" />
            <Link
              to="/admin/menu"
              className="text-gray-400 inline-block"
            >
              Menu
            </Link>
            <FaChevronRight className="text-gray-400 inline-block" />
            <Link
              to="/admin/menu-create"
              className="text-gray-400 inline-block"
            >
              Tambah Menu
            </Link>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowModal(true)}
              className="block border border-blue-500 text-blue-500 text-sm px-3 py-1.5 rounded"
            >
              Batal
            </button>
            <button
              type="submit"
              className="block bg-blue-500 text-white text-sm px-3 py-1.5 rounded"
            >
              Simpan
            </button>
          </div>
        </div>
        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-md text-center space-y-4">
              <p className="text-lg font-semibold">Yakin ingin membatalkan?</p>
              <div className="flex justify-center gap-4">
                <Link
                  to="/admin/menu"
                  className="px-4 py-2 bg-red-500 text-white rounded"
                >
                  Ya, Batalkan
                </Link>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Tidak
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="bg-slate-50 p-6">
          <div className="grid grid-cols-2 p-12 bg-white shadow-md">
            <div className="">

              {/* Name */}
              <div>
                <label className="text-xs block font-medium after:content-['*'] after:text-red-500 after:text-lg after:ml-1 mb-2.5">NAMA MENU</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full py-2 px-3 border rounded-lg"
                  required
                />
              </div>

              {/* Category (Checkboxes) */}
              <div className="">
                <label className="my-2.5 text-xs block font-medium">KATEGORI</label>
                {/* Container untuk bubble kategori yang dipilih */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedCategories.map(categoryId => (
                    <div
                      key={categoryId}
                      className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                    >
                      {categoryMap[categoryId] || categoryId}
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(categoryId)}
                        className="ml-2 text-green-500 hover:text-green-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* Input pencarian */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchTermCategories}
                    onChange={(e) => setSearchTermCategories(e.target.value)}
                    placeholder="Cari kategori..."
                    className="w-full py-2 px-3 border rounded-lg"
                  />

                  {/* Dropdown hasil pencarian */}
                  {searchTermCategories && searchResultsCategories.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border rounded mt-1 shadow-lg max-h-60 overflow-y-auto">
                      {searchResultsCategories.map(category => (
                        <div
                          key={category._id}
                          onClick={() => handleAddCategory(category._id)}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {category.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pesan jika tidak ada hasil */}
                {searchTermCategories && searchResultsCategories.length === 0 && (
                  <div className="text-gray-500 text-sm mt-2">
                    Tidak ada kategori yang cocok
                  </div>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="my-2.5 text-xs block font-medium">HARGA</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full py-2 px-3 border rounded-lg"
                  required
                />
              </div>

              {/* SKU */}
              <div>
                <label className="my-2.5 text-xs block font-medium">SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className="w-full py-2 px-3 border rounded-lg"
                  required
                />
              </div>

              {/* Image File Input */}
              <div>
                <label className="my-2.5 text-xs block font-medium">FOTO MENU</label>
                <input
                  type="file"
                  name="imageURL"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full py-2 px-3 border rounded-lg"
                />
              </div>

              {/* Display the image preview */}
              {imagePreview && (
                <div className="mt-4">
                  <img src={imagePreview} alt="Image Preview" className="w-full max-h-60 object-cover rounded" />
                </div>
              )}


              {/* stock unit */}
              <div>
                <label className="my-2.5 text-xs block font-medium">SATUAN STOK</label>
                <input
                  type="text"
                  name="sku"
                  value=""
                  onChange={handleInputChange}
                  className="w-full py-2 px-3 border rounded-lg"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="my-2.5 text-xs block font-medium">DESKRIPSI</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full py-2 px-3 border rounded-lg"
                />
              </div>

              {/* Available At (Dropdown) */}
              <div>
                <label className="my-2.5 text-xs block font-medium">NAMA OUTLET</label>
                <select
                  name="availableAt"
                  value={formData.availableAt}
                  onChange={handleAvailableAtChange}
                  className="w-full py-2 px-3 border rounded-lg"
                >
                  <option value="">Pilih Outlet</option>
                  {outlets.length > 0 ? (
                    outlets.map((outlet) => (
                      <option key={outlet._id} value={outlet._id}>
                        {outlet.name}
                      </option>
                    ))
                  ) : (
                    <option value="">Loading outlets...</option>
                  )}
                </select>
              </div>

              {/* Bahan Baku */}
              <div>
                <label className="my-2.5 text-xs block font-medium">Bahan Baku</label>

                {/* Container untuk bubble bahan baku yang dipilih */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedRawMaterials.map(materialId => {
                    const material = rawMaterials.find(m => m._id === materialId);
                    return (
                      <div
                        key={materialId}
                        className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                      >
                        {material ? material.name : materialId}
                        <button
                          type="button"
                          onClick={() => handleRemoveRawMaterial(materialId)}
                          className="ml-2 text-green-500 hover:text-green-700"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Input pencarian bahan baku */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchTermRawMaterials}
                    onChange={(e) => setSearchTermRawMaterials(e.target.value)}
                    placeholder="Cari bahan baku..."
                    className="w-full py-2 px-3 border rounded-lg"
                  />

                  {/* Dropdown hasil pencarian bahan baku */}
                  {searchTermRawMaterials && searchResultsRawMaterials.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border rounded mt-1 shadow-lg max-h-60 overflow-y-auto">
                      {searchResultsRawMaterials.map(material => (
                        <div
                          key={material._id}
                          onClick={() => handleAddRawMaterial(material._id)}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {material.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pesan jika tidak ada hasil bahan baku */}
                {searchTermRawMaterials && searchResultsRawMaterials.length === 0 && (
                  <div className="text-gray-500 text-sm mt-2">
                    Tidak ada bahan baku yang cocok
                  </div>
                )}
              </div>

              {/* Toppings */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="my-2.5 text-xs block font-medium">Toppings</label>
                  <button
                    type="button"
                    onClick={handleAddTopping}
                    className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                  >
                    + Add Topping
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.toppings.map((topping, toppingIndex) => (
                    <div key={toppingIndex} className="border p-3 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Topping #{toppingIndex + 1}</h4>
                        <button
                          type="button"
                          onClick={() => handleRemoveTopping(toppingIndex)}
                          className="text-red-500"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="my-2.5 block text-sm">Name</label>
                          <input
                            type="text"
                            value={topping.name}
                            onChange={(e) => handleToppingInputChange(toppingIndex, "name", e.target.value)}
                            className="w-full py-2 px-3 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="my-2.5 block text-sm">Price</label>
                          <input
                            type="number"
                            value={topping.price}
                            onChange={(e) => handleToppingInputChange(toppingIndex, "price", e.target.value)}
                            className="w-full py-2 px-3 border rounded-lg"
                          />
                        </div>
                      </div>

                      <div>
                        {/* Container untuk bubble raw materials yang dipilih */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {selectedToppingRawMaterials.map(materialId => {
                            const material = rawMaterials.find(m => m._id === materialId);
                            return (
                              <div
                                key={materialId}
                                className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                              >
                                {material.name}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveToppingRawMaterial(materialId)}
                                  className="ml-2 text-green-500 hover:text-green-700"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Input pencarian */}
                        <div className="relative">
                          <input
                            type="text"
                            value={searchTermToppings}
                            onChange={(e) => setSearchTermToppings(e.target.value)}
                            placeholder="Cari bahan baku..."
                            className="w-full py-2 px-3 border rounded-lg"
                          />

                          {/* Dropdown hasil pencarian */}
                          {searchTermToppings && searchResultsToppingRawMaterials.length > 0 && (
                            <div className="absolute z-10 w-full bg-white border rounded mt-1 shadow-lg max-h-60 overflow-y-auto">
                              {searchResultsToppingRawMaterials.map(material => (
                                <div
                                  key={material._id}
                                  onClick={() => handleAddToppingRawMaterial(material._id)}
                                  className="p-2 hover:bg-gray-100 cursor-pointer"
                                >
                                  {material.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Pesan jika tidak ada hasil */}
                        {searchTermToppings && searchResultsToppingRawMaterials.length === 0 && (
                          <div className="text-gray-500 text-sm mt-2">
                            Tidak ada bahan baku yang cocok
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Addons */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="my-2.5 text-xs block font-medium">Addons</label>
                  <button
                    type="button"
                    onClick={handleAddAddon}
                    className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                  >
                    + Add Addon
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.addons.map((addon, addonIndex) => (
                    <div key={addonIndex} className="border p-3 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Addon #{addonIndex + 1}</h4>
                        <button
                          type="button"
                          onClick={() => handleRemoveAddon(addonIndex)}
                          className="text-red-500"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>

                      <div className="mb-2">
                        <label className="my-2.5 block text-sm">Name</label>
                        <input
                          type="text"
                          value={addon.name}
                          onChange={(e) => handleAddonInputChange(addonIndex, "name", e.target.value)}
                          className="w-full py-2 px-3 border rounded-lg"
                        />
                      </div>

                      {/* Addon Options Section */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <label className="my-2.5 block text-sm font-medium">Options</label>
                          <button
                            type="button"
                            onClick={() => handleAddOption(addonIndex)}
                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                          >
                            + Add Option
                          </button>
                        </div>

                        <div className="space-y-2">
                          {addon.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2 border p-2 rounded">
                              <div className="flex-1">
                                <label className="my-2.5 block text-xs">Label</label>
                                <input
                                  type="text"
                                  value={option.label}
                                  onChange={(e) =>
                                    handleAddonOptionInputChange(addonIndex, optionIndex, "label", e.target.value)
                                  }
                                  className="w-full p-1 border rounded"
                                />
                              </div>
                              <div className="w-20">
                                <label className="my-2.5 block text-xs">Price</label>
                                <input
                                  type="number"
                                  value={option.price}
                                  onChange={(e) =>
                                    handleAddonOptionInputChange(addonIndex, optionIndex, "price", e.target.value)
                                  }
                                  className="w-full p-1 border rounded"
                                />
                              </div>
                              <div className="w-16 text-center">
                                <label className="my-2.5 block text-xs">Default</label>
                                <input
                                  type="radio"
                                  checked={option.default}
                                  onChange={() => handleDefaultOptionChange(addonIndex, optionIndex)}
                                  className="mt-1"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveAddonOption(addonIndex, optionIndex)}
                                className="text-red-500"
                              >
                                <FaTrashAlt />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Raw Materials Section */}
                      <div>
                        {/* Container untuk bubble raw materials yang dipilih */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {selectedAddonRawMaterials?.map(materialId => {
                            const material = rawMaterials.find(m => m._id === materialId);
                            return (
                              <div
                                key={materialId}
                                className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                              >
                                {material.name}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAddonRawMaterial(materialId, addonIndex)}
                                  className="ml-2 text-green-500 hover:text-green-700"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Input pencarian */}
                        <div className="relative">
                          <input
                            type="text"
                            value={searchTermAddons}
                            onChange={(e) => setSearchTermAddons(e.target.value)}
                            placeholder="Cari bahan baku..."
                            className="w-full py-2 px-3 border rounded-lg"
                          />

                          {/* Dropdown hasil pencarian */}
                          {searchTermAddons && searchResultsAddonRawMaterials.length > 0 && (
                            <div className="absolute z-10 w-full bg-white border rounded mt-1 shadow-lg max-h-60 overflow-y-auto">
                              {searchResultsAddonRawMaterials.map(material => (
                                <div
                                  key={material._id}
                                  onClick={() => handleAddAddonRawMaterial(material._id, addonIndex)}
                                  className="p-2 hover:bg-gray-100 cursor-pointer"
                                >
                                  {material.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Pesan jika tidak ada hasil */}
                        {searchTermAddons && searchResultsAddonRawMaterials.length === 0 && (
                          <div className="text-gray-500 text-sm mt-2">
                            Tidak ada bahan baku yang cocok
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateMenu;