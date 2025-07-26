// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { FaTrashAlt } from "react-icons/fa";
// import { useNavigate, useParams } from "react-router-dom";

// const UpdateMenu = () => {
// const { id } = useParams(); // Get the menu item ID from the URL
// const [formData, setFormData] = useState({
//   name: "",
//   price: "",
//   description: "",
//   category: [], // This should be an array
//   imageURL: "",
//   toppings: [],
//   addons: [],
//   rawMaterials: [],
//   availableAt: "",
// });

// const [categories, setCategories] = useState([]);
// const [rawMaterials, setRawMaterials] = useState([]);
// const [outlets, setOutlets] = useState([]);
// const [imagePreview, setImagePreview] = useState(null);
// const [categoryMap, setCategoryMap] = useState({});
// const navigate = useNavigate();

// useEffect(() => {
//   const fetchCategories = async () => {
//     try {
//       const response = await axios.get("/api/menu/categories");
//       const fetchedCategories = response.data.data || [];
//       setCategories(fetchedCategories);

//       // Create a mapping of category IDs to names
//       const map = {};
//       fetchedCategories.forEach(category => {
//         map[category._id] = category.name;
//       });
//       setCategoryMap(map);
//     } catch (error) {
//       console.error("Error fetching categories:", error);
//     }
//   };

//   const fetchOutlets = async () => {
//     try {
//       const response = await axios.get("/api/outlet/");
//       setOutlets(response.data || []);
//     } catch (error) {
//       console.error("Error fetching outlets:", error);
//     }
//   };

//   const fetchRawMaterial = async () => {
//     try {
//       const response = await axios.get("/api/storage/raw-material");
//       setRawMaterials(response.data.data || []);
//     } catch (error) {
//       console.error("Error fetching raw materials:", error);
//     }
//   };

//   const fetchMenuItem = async () => {
//     try {
//       const response = await axios.get(`/api/menu/menu-items/${id}`);
//       const menuItem = response.data.data;

//       // Ensure that the addons have options
//       if (menuItem.addons) {
//         menuItem.addons.forEach(addon => {
//           if (!addon.options) {
//             addon.options = []; // Initialize options if not present
//           }
//         });
//       }

//       setFormData(menuItem);
//       setImagePreview(menuItem.imageURL);
//     } catch (error) {
//       console.error("Error fetching menu item:", error);
//     }
//   };

//   fetchCategories();
//   fetchOutlets();
//   fetchRawMaterial();
//   fetchMenuItem(); // Fetch the menu item to update
// }, [id]);

// const handleInputChange = (e) => {
//   const { name, value } = e.target;
//   setFormData((prevData) => ({
//     ...prevData,
//     [name]: value,
//   }));
// };

// const handleCategoryChange = (e) => {
//   const { value, checked } = e.target;
//   setFormData((prevData) => {
//     const updatedCategories = checked
//       ? [...prevData.category, value]
//       : prevData.category.filter((category) => category !== value);
//     return {
//       ...prevData,
//       category: updatedCategories,
//     };
//   });
// };

// const handleImageChange = (e) => {
//   const file = e.target.files[0];
//   if (!file) return;

//   const reader = new FileReader();
//   reader.readAsDataURL(file);
//   reader.onload = () => {
//     setFormData((prevData) => ({
//       ...prevData,
//       imageURL: reader.result,
//     }));
//     setImagePreview(reader.result);
//   };
// };

// const handleAvailableAtChange = (e) => {
//   const { value } = e.target;
//   setFormData((prevData) => ({
//     ...prevData,
//     availableAt: value, // Update the availableAt field
//   }));
// };

// const handleRawMaterialChange = (e) => {
//   const { value, checked } = e.target;
//   setFormData((prevData) => {
//     let updatedRawMaterials = [...prevData.rawMaterials];

//     if (checked) {
//       // Add the materialId to the array
//       updatedRawMaterials.push({ materialId: { _id: value }, quantityRequired: 0.1 }); // Adjust quantity as needed
//     } else {
//       // Remove the materialId from the array
//       updatedRawMaterials = updatedRawMaterials.filter(raw => raw.materialId._id !== value);
//     }

//     return {
//       ...prevData,
//       rawMaterials: updatedRawMaterials,
//     };
//   });
// };

// const handleToppingInputChange = (index, field, value) => {
//   setFormData((prevData) => {
//     const updatedToppings = [...prevData.toppings];
//     updatedToppings[index] = {
//       ...updatedToppings[index],
//       [field]: value || "", // Ensure it defaults to an empty string
//     };
//     return {
//       ...prevData,
//       toppings: updatedToppings,
//     };
//   });
// };

// const handleAddonInputChange = (index, field, value) => {
//   setFormData((prevData) => {
//     const updatedAddons = [...prevData.addons];
//     updatedAddons[index] = {
//       ...updatedAddons[index],
//       [field]: value || "", // Ensure it defaults to an empty string
//     };
//     return {
//       ...prevData,
//       addons: updatedAddons,
//     };
//   });
// };

// const handleAddonRawMaterialChange = (addonIndex, e) => {
//   const { value, checked } = e.target; // Get the value and checked state of the checkbox
//   setFormData((prevData) => {
//     const updatedAddons = [...prevData.addons]; // Create a copy of the current addons
//     const addon = updatedAddons[addonIndex]; // Get the specific addon being modified

//     if (checked) {
//       // If the checkbox is checked, add the raw material
//       addon.rawMaterials.push({ materialId: { _id: value }, quantityRequired: 0.1 }); // Adjust quantity as needed
//     } else {
//       // If the checkbox is unchecked, remove the raw material
//       addon.rawMaterials = addon.rawMaterials.filter(raw => raw.materialId._id !== value);
//     }

//     return {
//       ...prevData,
//       addons: updatedAddons, // Update the state with the modified addons
//     };
//   });
// };

// const handleToppingRawMaterialChange = (toppingIndex, e) => {
//   const { value, checked } = e.target; // Get the value and checked state of the checkbox
//   setFormData((prevData) => {
//     const updatedToppings = [...prevData.toppings]; // Create a copy of the current toppings
//     const topping = updatedToppings[toppingIndex]; // Get the specific topping being modified

//     if (checked) {
//       // If the checkbox is checked, add the raw material
//       topping.rawMaterials.push({ materialId: { _id: value }, quantityRequired: 0.1 }); // Adjust quantity as needed
//     } else {
//       // If the checkbox is unchecked, remove the raw material
//       topping.rawMaterials = topping.rawMaterials.filter(raw => raw.materialId._id !== value);
//     }

//     return {
//       ...prevData,
//       toppings: updatedToppings, // Update the state with the modified toppings
//     };
//   });
// };

// const handleRemoveAddonOption = (addonIndex, optionIndex) => {
//   setFormData((prevData) => {
//     const updatedAddons = [...prevData.addons];
//     updatedAddons[addonIndex].options = updatedAddons[addonIndex].options.filter((_, i) => i !== optionIndex);
//     return {
//       ...prevData,
//       addons: updatedAddons,
//     };
//   });
// };

// const handleAddOption = (addonIndex) => {
//   setFormData((prevData) => {
//     const updatedAddons = [...prevData.addons];
//     updatedAddons[addonIndex].options.push({ label: "", price: "", default: false });
//     return {
//       ...prevData,
//       addons: updatedAddons,
//     };
//   });
// };

// const handleAddonOptionInputChange = (addonIndex, optionIndex, field, value) => {
//   setFormData((prevData) => {
//     const updatedAddons = [...prevData.addons];
//     updatedAddons[addonIndex].options[optionIndex] = {
//       ...updatedAddons[addonIndex].options[optionIndex],
//       [field]: value || "",
//     };
//     return {
//       ...prevData,
//       addons: updatedAddons,
//     };
//   });
// };

// const handleDefaultOptionChange = (addonIndex, optionIndex) => {
//   setFormData((prevData) => {
//     const updatedAddons = [...prevData.addons];
//     updatedAddons[addonIndex].options = updatedAddons[addonIndex].options.map((option, index) => {
//       return {
//         ...option,
//         default: index === optionIndex,
//       };
//     });
//     return {
//       ...prevData,
//       addons: updatedAddons,
//     };
//   });
// };

// const handleAddTopping = () => {
//   setFormData((prevData) => ({
//     ...prevData,
//     toppings: [...prevData.toppings, { name: "", price: "", rawMaterials: [] }],
//   }));
// };

// const handleAddAddon = () => {
//   setFormData((prevData) => ({
//     ...prevData,
//     addons: [
//       ...prevData.addons,
//       { name: "", options: [{ label: "", price: "", default: false }], rawMaterials: [] },
//     ],
//   }));
// };

// const handleRemoveTopping = (index) => {
//   setFormData((prevData) => {
//     const updatedToppings = prevData.toppings.filter((_, i) => i !== index);
//     return {
//       ...prevData,
//       toppings: updatedToppings,
//     };
//   });
// };

// const handleRemoveAddon = (index) => {
//   setFormData((prevData) => {
//     const updatedAddons = prevData.addons.filter((_, i) => i !== index);
//     return {
//       ...prevData,
//       addons: updatedAddons,
//     };
//   });
// };

// const handleSubmit = async (e) => {
//   e.preventDefault();

//   try {
//     const response = await axios.put(`/api/menu/menu-items/${id}`, formData);
//     console.log(response);
//     navigate("/admin/menu");
//   } catch (error) {
//     console.error("Error updating menu item:", error);
//   }
// };

//   return (
//     <div className="max-w-2xl mx-auto p-4">
//       <h2 className="text-2xl font-bold mb-4">Update Menu Item</h2>
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
//                     value={category.name}
//                     checked={formData.category.includes(category.name)} // Check if the category is included
//                     onChange={handleCategoryChange}
//                     className="mr-2"
//                   />
//                   {category.name}
//                 </label>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Image File Input */}
//         <div>
//           <label className="block font-medium">Image</label>
//           <input
//             type="file"
//             name="imageURL"
//             accept="image/*"
//             onChange={handleImageChange}
//             className="w-full p-2 border rounded"
//           />
//         </div>

//         {/* Display the image preview */}
//         {imagePreview && (
//           <div className="mt-4">
//             <img src={imagePreview} alt="Image Preview" className="w-full max-h-60 object-cover rounded" />
//           </div>
//         )}

//         {/* Available At (Dropdown) */}
//         <div>
//           <label className="block font-medium">Available At</label>
//           <select
//             name="availableAt"
//             value={formData.availableAt} // Set the value to the current availableAt
//             onChange={handleAvailableAtChange} // Handle changes
//             className="w-full p-2 border rounded"
//           >
//             {/* <option value="">Pilih Outlet</option> */}
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

//         {/* Raw Materials */}
//         <div>
//           <label className="block font-medium">Raw Materials</label>
//           <div className="space-y-2 border p-3 rounded">
//             {rawMaterials.map((material) => (
//               <div key={material._id}>
//                 <label className="inline-flex items-center">
//                   <input
//                     type="checkbox"
//                     value={material._id}
//                     checked={formData.rawMaterials.some(raw => raw.materialId._id === material._id)} // Check if the materialId matches
//                     onChange={handleRawMaterialChange}
//                     className="mr-2"
//                   />
//                   {material.name}
//                 </label>
//               </div>
//             ))}
//           </div>
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
//                       value={topping.name || ""} // Use an empty string as a fallback
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

//                 {/* Raw Materials for Topping */}
//                 <div>
//                   <label className="block text-sm mb-1">Raw Materials</label>
//                   <div className="max-h-28 overflow-y-auto border p-2 rounded">
//                     {rawMaterials.map((material) => (
//                       < div key={material._id} >
//                         <label className="inline-flex items-center">
//                           <input
//                             type="checkbox"
//                             value={material._id}
//                             checked={topping.rawMaterials.some(raw => raw.materialId._id === material._id)} // Check if the materialId matches
//                             onChange={(e) => handleToppingRawMaterialChange(toppingIndex, e)}
//                             className="mr-2"
//                           />
//                           {material.name}
//                         </label>
//                       </div>
//                     ))}
//                   </div>
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

//                 {/* Addon Options */}
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
//                             checked={option.isdefault || false}
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

//                 {/* Raw Materials for Addon */}
//                 <div>
//                   <label className="block text-sm mb-1">Raw Materials</label>
//                   <div className="max-h-28 overflow-y-auto border p-2 rounded">
//                     {rawMaterials.map((material) => (
//                       <div key={material._id}>
//                         <label className="inline-flex items-center">
//                           <input
//                             type="checkbox"
//                             value={material._id}
//                             checked={addon.rawMaterials.some(raw => raw.materialId._id === material._id)}
//                             onChange={(e) => handleAddonRawMaterialChange(addonIndex, e)}
//                             className="mr-2"
//                           />
//                           {material.name}
//                         </label>
//                       </div>
//                     ))}
//                   </div>
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
//             Update Menu Item
//           </button>
//         </div>
//       </form >
//     </div >
//   );
// };

// export default UpdateMenu;

import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { app } from '../../firebase';
import { Link } from "react-router-dom";
import { FaChevronRight, FaShoppingBag, FaBell, FaUser, FaImage, FaCamera, FaGift, FaPizzaSlice, FaChevronDown, FaInfoCircle } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import ToppingForm from "./varianmodal";
import AddonForm from "./opsimodal";

const UpdateMenu = () => {
  const { id } = useParams(); // Get the menu item ID from the URL
  const [title, setTitle] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    description: "",
    category: { id: "", name: "" },
    imageURL: "",
    toppings: [],
    addons: [],
    rawMaterials: [],
    availableAt: "",
  });

  const [toppings, setToppings] = useState([]);
  const [addons, setAddons] = useState([]);

  const [isOptional, setIsOptional] = useState([false]);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [categoryMap, setCategoryMap] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/menu/categories");
        const fetchedCategories = response.data.data || [];
        setCategories(fetchedCategories);

        // Create a mapping of category IDs to names
        const map = {};
        fetchedCategories.forEach(category => {
          map[category._id] = category.name;
        });
        setCategoryMap(map);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchOutlets = async () => {
      try {
        const response = await axios.get("/api/outlet");
        setOutlets(response.data.data || []);
      } catch (error) {
        console.error("Error fetching outlets:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRawMaterial = async () => {
      try {
        const response = await axios.get("/api/storage/raw-material");
        setRawMaterials(response.data.data || []);
      } catch (error) {
        console.error("Error fetching raw materials:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchMenuItem = async () => {
      try {
        const response = await axios.get(`/api/menu/menu-items/${id}`);
        const menuItem = response.data.data;
        console.log(menuItem)

        // Ensure that the addons have options
        if (menuItem.addons) {
          menuItem.addons.forEach(addon => {
            if (!addon.options) {
              addon.options = []; // Initialize options if not present
            }
          });
        }

        setFormData(menuItem);
        setTitle(menuItem?.name);
        setImagePreview(menuItem.imageURL);
      } catch (error) {
        console.error("Error fetching menu item:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    fetchOutlets();
    fetchRawMaterial();
    fetchMenuItem(); // Fetch the menu item to update
  }, [id]);

  const fileRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [image, setImage] = useState(undefined);
  const [imagePercent, setImagePercent] = useState(0);
  const [imageError, setImageError] = useState(false);

  // State untuk pemilihan dan pencarian
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchTermCategories, setSearchTermCategories] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Cari kategori yang sesuai input, kecuali yang sudah dipilih
  const searchCategories = (term) => {
    if (!term) return [];

    const lower = term.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(lower) &&
        !selectedCategories.includes(cat._id)
    );
  };

  // Memo hasil pencarian
  const searchResultsCategories = useMemo(
    () => searchCategories(searchTermCategories),
    [searchTermCategories, selectedCategories, categories]
  );

  // Tambahkan kategori (pakai nama)
  const handleAddCategory = (categoryId) => {
    const categoryName = categoryMap[categoryId];
    if (!formData.category.includes(categoryName)) {
      const newSelected = [...selectedCategories, categoryId];
      const newCategoryNames = [...formData.category, categoryName];

      setSelectedCategories(newSelected);
      setFormData((prev) => ({
        ...prev,
        category: newCategoryNames,
      }));

      setSearchTermCategories("");
    }
  };

  // Hapus kategori
  const handleRemoveCategory = (categoryId) => {
    const categoryName = categoryMap[categoryId];

    const newSelected = selectedCategories.filter((id) => id !== categoryId);
    const newCategoryNames = formData.category.filter((name) => name !== categoryName);

    setSelectedCategories(newSelected);
    setFormData((prev) => ({
      ...prev,
      category: newCategoryNames,
    }));
  };

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
      'state_changed',
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
          setFormData({ ...formData, imageURL: downloadURL })
        );
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log(formData)

    // const data = new FormData();
    const formDataToSubmit = {
      name: formData.name,
      price: Number(formData.price),
      description: formData.description,
      category: selectedCategories.map(id => categoryMap[id]), // Get names instead of IDs
      imageURL: formData.imageURL || "https://placehold.co/1920x1080/png",
      toppings: [],
      addons: [],
      rawMaterials: []
      // toppings: formData.toppings.map((topping) => ({
      //   name: topping.name,
      //   price: Number(topping.price),
      //   rawMaterials: topping.rawMaterials.map((materialId) => ({
      //     materialId,
      //     quantityRequired: 0.1
      //   }))
      // })),
      // addons: formData.addons.map((addon) => ({
      //   name: addon.name,
      //   options: addon.options.map((option) => ({
      //     label: option.label,
      //     price: Number(option.price),
      //     isdefault: option.default  // Changed from 'default' to 'isdefault' to match target format
      //   })),
      //   rawMaterials: addon.rawMaterials.map((materialId) => ({
      //     materialId,
      //     quantityRequired: 0.2
      //   }))
      // })),
      // rawMaterials: selectedRawMaterials.map((materialId) => ({
      //   materialId,
      //   quantityRequired: 0.2
      // })),
    };

    try {
      const response = await axios.put(`/api/menu/menu-items/${id}`, formData);
      console.log(response);
      navigate("/admin/menu");
    } catch (error) {
      console.error("Error updating menu item:", error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
      </div>
    );
  }

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
            <span
              className="text-gray-400 inline-block"
            >
              {title}
            </span>
          </div>
          <div className="flex space-x-2">
            <span
              onClick={() => setShowModal(true)}
              className="block border border-[#005429] hover:bg-[#005429] text-[#005429] hover:text-white text-sm px-3 py-1.5 rounded cursor-pointer"
            >
              Batal
            </span>
            <button
              type="submit"
              className="block bg-[#005429] text-white text-sm px-3 py-1.5 rounded"
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
          <div className="grid grid-cols-2 p-12 space-x-4 bg-white shadow-md">
            {/* grid 1 */}
            <div className="text-[#999999]">

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
                <select
                  className="w-full py-2 px-3 border rounded-lg"
                  value={formData.category.name} // sesuai state
                  onChange={(e) => {
                    const selected = categories.find(cat => cat.name === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      category: selected || { id: "", name: "" }
                    }));
                  }}
                >
                  <option value="">Pilih kategori</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category (Checkboxes) */}
              {/* <div className="">
                <label className="my-2.5 text-xs block font-medium">KATEGORI</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedCategories.map(categoryId => (
                    <div
                      key={categoryId}
                      className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                    >
                      {categoryMap[categoryId] || categoryId || formData.category}
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
                <div className="relative">
                  <input
                    type="text"
                    value={searchTermCategories}
                    onChange={(e) => setSearchTermCategories(e.target.value)}
                    placeholder="Cari kategori..."
                    className="w-full py-2 px-3 border rounded-lg"
                  />

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
                {searchTermCategories && searchResultsCategories.length === 0 && (
                  <div className="text-gray-500 text-sm mt-2">
                    Tidak ada kategori yang cocok
                  </div>
                )}
              </div> */}

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
                />
              </div>

              {/* Barcode */}
              <div>
                <label className="my-2.5 text-xs block font-medium">BARCODE</label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  className="w-full py-2 px-3 border rounded-lg"
                />
              </div>

              {/* stock unit */}
              <div>
                <label className="my-2.5 text-xs block font-medium">SATUAN STOK</label>
                <input
                  type="text"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  className="w-full py-2 px-3 border rounded-lg"
                />
              </div>

              {/* Image File Input */}
              <div className="flex items-center space-x-4 p-4 w-full max-w-md">

                {/* Form Upload */}
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
            </div>

            {/* grid 2  */}
            {/* <div className="">
              <div className="mb-20">
                <div className="flex justify-between">
                  <div className="flex">
                    <label htmlFor="varian">Varian Produk</label>
                  </div>
                  <input type="radio" />
                </div>
                <h3>Apakah produk ini memiliki varian seperti warna dan ukuran ?</h3>
              </div>
              <div className="">
                <div className="">
                  <div className="flex">
                    <label htmlFor="varian">Opsi Tambahan</label>
                  </div>
                  <button
                    type="button"
                    className="bg-slate-50 shadow-sm p-2"
                    onClick={() => setIsOpen(true)}
                  >
                    Tambah Opsi Tambahan
                  </button>
                </div>
                <h3>Anda dapat memilih lebih dari satu opsi tambahan</h3>

                {isOpen && (
                  <div
                    className="fixed inset-0 bg-black bg-opacity-30 z-40"
                    onClick={() => setIsOpen(false)}
                  />
                )}
              </div>
            </div> */}

            <div className="text-[14px] text-[#999999]">
              <ToppingForm toppings={toppings} setToppings={setToppings} />
              <AddonForm addons={addons} setAddons={setAddons} />
              <div>
                <label className="block mb-1 text-sm font-medium">Pilih Outlet</label>
                <div className="grid gap-2">
                  {outlets.map((outlet) => (
                    <label key={outlet._id} className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={outlet._id}
                        checked={formData.availableAt.includes(outlet._id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const value = outlet._id;
                          setFormData((prev) => ({
                            ...prev,
                            availableAt: checked
                              ? [...prev.availableAt, value]
                              : prev.availableAt.filter((id) => id !== value),
                          }));
                        }}
                        className="form-checkbox text-blue-600"
                      />
                      <span>{outlet.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* <div className="mb-5 space-y-1">
                            <div className="flex justify-between">
                              <div className="flex items-center space-x-4">
                                <label htmlFor="varian" className="font-semibold">Varian Produk</label>
                                <div className="relative group">
                                  <p className="cursor-help w-4 h-4 rounded-full border text-center text-[9px]">i</p>
                                  <span className="absolute w-[340px] top-6 ml-2 hidden group-hover:inline-block bg-white border text-[#999999] text-xs rounded px-2 py-1 whitespace-wrap z-10 shadow-lg">
                                    Varian produk adalah variasi pilihan dari sebuah produk seperti, ukuran (Contoh: S, M, L), warna (Contoh: merah, kuning, hijau), corak atau motif.
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <h3>{isChecked ? "Ya" : "Tidak"}</h3>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer"
                                    checked={isChecked}
                                    onChange={(e) => setIsChecked(e.target.checked)} />
                                  <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-1 
                                peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                                peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 
                                after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
                                after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005429]"></div>
                                </label>
                              </div>
                            </div>
                            <h3>Apakah produk ini memiliki varian seperti warna dan ukuran ?</h3>
                          </div>
                          {isChecked && (
                            <VariantModal
                              formData={formData}
                            />
                          )}
                          <div className="">
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <label htmlFor="varian" className="font-semibold">Opsi Tambahan</label>
                                <div className="flex items-center space-x-2">
                                  <h3>{isOpsiOpen ? "Ya" : "Tidak"}</h3>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="sr-only peer"
                                      checked={isOpsiOpen}
                                      onChange={(e) => setIsOpsiOpen(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-1 
                    peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                    peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 
                    after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
                    after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005429]"></div>
                                  </label>
                                </div>
                              </div>
                              <h3>Anda dapat memilih lebih dari satu opsi tambahan</h3>
                            </div>
                          </div>
                          {isOpsiOpen && (
                            <FormOpsi
                              formData={formData}
                              options={options}
                              handleInputChange={handleInputChange}
                              handleOptionChange={handleOptionChange}
                              removeOption={removeOption}
                              addOption={addOption}
                            />
                          )} */}
            </div>
          </div>
        </div>

        {/* <div className="p-6 bg-slate-50 shadow-lg">
          <button
            onClick={() => setIsOptional(!isOptional)}
            className="w-full flex text-left px-[20px] py-[15px] bg-slate-100 hover:bg-slate-200 transition font-medium items-center space-x-2"
          >
            <span>{isOptional ? <FaChevronDown /> : <FaChevronRight />}</span>
            <span className="text-[14px]">Pengaturan Lanjutan (Opsional)</span>
          </button>

          {isOptional && (
            <div className="bg-white px-6 py-4 shadow-lg">
              <div className="row">
                <div className="grid grid-cols-3 gap-4 py-[25px] px-[15px] text-[12px]">
                  <div className="row my-[15px]">
                    <div className="flex items-center space-x-2">
                      <h5 className="uppercase my-[10px] font-medium">Jual Di POS</h5>
                      <FaInfoCircle />
                    </div>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-1">
                        <input type="radio" name="pos" value="yes" />
                        <span>Ya</span>
                      </label>
                      <label className="flex items-center space-x-1">
                        <input type="radio" name="pos" value="no" />
                        <span>Tidak</span>
                      </label>
                    </div>
                  </div>
                  <div className="row my-[15px]">
                    <div className="flex items-center space-x-2">
                      <h5 className="uppercase my-[10px] font-medium">Jual Di Pawoon Order</h5>
                    </div>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-1">
                        <input type="radio" name="po" value="yes" />
                        <span>Ya</span>
                      </label>
                      <label className="flex items-center space-x-1">
                        <input type="radio" name="po" value="no" />
                        <span>Tidak</span>
                      </label>
                    </div>
                  </div>
                  <div className="row my-[15px]">
                    <div className="flex items-center space-x-2">
                      <h2 className="uppercase my-[10px] font-medium">Jual Di Digital Pawoon</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-1">
                        <input type="radio" name="digital" value="yes" />
                        <span>Ya</span>
                      </label>
                      <label className="flex items-center space-x-1">
                        <input type="radio" name="digital" value="no" />
                        <span>Tidak</span>
                      </label>
                    </div>
                  </div>
                  <div className="row my-[15px]">
                    <div className="flex items-center space-x-2">
                      <h5 className="uppercase my-[10px] font-medium">Kelola Stok</h5>
                    </div>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-1">
                        <input type="radio" name="stock" value="yes" />
                        <span>Ya</span>
                      </label>
                      <label className="flex items-center space-x-1">
                        <input type="radio" name="stock" value="no" />
                        <span>Tidak</span>
                      </label>
                    </div>
                  </div>
                  <div className="row my-[15px]">
                    <div className="flex items-center space-x-2">
                      <h5 className="uppercase my-[10px] font-medium">Penjualan berdasarkan stok</h5>
                      <FaInfoCircle />
                    </div>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-1">
                        <input type="radio" name="pos" value="yes" />
                        <span>Ya</span>
                      </label>
                      <label className="flex items-center space-x-1">
                        <input type="radio" name="pos" value="no" />
                        <span>Tidak</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="row w-full my-[15px]">
                    <div className="flex items-center space-x-2 my-[10px]">
                      <h5 className="uppercase font-medium text-[12px]">deskripsi produk</h5>
                      <FaInfoCircle size={12} />
                    </div>
                    <textarea name="" id="" className="w-full h-[120px] block border rounded"></textarea>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="row w-full my-[15px]">
                    <div className="flex items-center space-x-2 my-[10px]">
                      <h5 className="uppercase font-medium text-[12px]">Pajak</h5>
                      <FaInfoCircle size={12} />
                    </div>
                    <select name="" id="" className="block border w-full p-2 rounded">
                      <option value="">Mengikuti pajak outlet</option>
                      <option value="">Tidak ada pajak</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="block w-full my-[15px] border">
                <div className=" px-[10px] py-[5px] bg-gray-100">
                  <h5 className="uppercase my-[10px] text-[12px] font-medium">detail produk</h5>
                </div>
                <div className="p-[20px]">
                  <div className="mb-[15px]">
                    <h3 className="uppercase text-[12px] font-medium my-[10px]">jenis produk</h3>
                  </div>
                  <div className="flex space-x-10">
                    <div className="w-1/2 h-[200px] flex items-center justify-center py-[45px] px-[15px] cursor-pointer rounded border hover:bg-[#005429] hover:text-white active:bg-[#005429] active:text-white group">
                      <div className="text-center">
                        <FaGift className="mx-auto mb-2 text-xl text-[#005429] group-hover:text-white group-active:text-white" />
                        <h4 className="font-semibold text-[14px]">Tunggal</h4>
                        <p className="text-[13px]">Produk tidak memiliki bahan baku.</p>
                        <p className="text-[13px]">Contoh: Buah Jeruk</p>
                      </div>
                    </div>

                    <div className="w-1/2 h-[200px] flex items-center justify-center py-[45px] px-[15px] cursor-pointer active:bg-[#005429] active:text-white hover:bg-[#005429] hover:text-white bg-[#005429] rounded border text-white">
                      <div className="text-center">
                        <FaPizzaSlice className="mx-auto mb-2 text-xl text-white group-hover:text-white group-active:text-white" />
                        <h4 className="font-semibold text-[14px]">Komposit</h4>
                        <p className="text-[13px]">Produk memiliki bahan baku.</p>
                        <p className="text-[13px]">Contoh: Donat, bahan baku: Tepung 100 gr dan Telur 2 butir</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div> */}
      </form>

      {/* Modal Slide */}
      <div
        className={`fixed top-0 right-0 h-full max-w-screen-sm w-full bg-white shadow-lg transform transition-transform duration-300 z-50 ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold">Tambah Opsi Tambahan</h2>
          <button onClick={() => setIsOpen(false)} className="text-gray-600 hover:text-black">
            ✕
          </button>
        </div>

        <div className="p-4 pb-32 overflow-y-auto h-[calc(100%-4rem)]"> {/* extra bottom padding for fixed button */}
          {/* <form> */}
          <div className="w-full">
            <label htmlFor="">Nama Grup Opsi Tambahan</label>
            <input type="text" className="border block w-full" />
          </div>
          <span>
            <label htmlFor="">Jumlah Pilihan</label>
          </span>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="">Minimal pilihan Opsi Tambahan</label>
            </div>
            <div className="flex justify-end">
              <input type="number" className="border" />
            </div>
            <div>
              <label htmlFor="">Maksimal pilihan Opsi Tambahan</label>
            </div>
            <div className="flex justify-end">
              <input type="number" className="border" />
            </div>
            <div>
              <label htmlFor="">Nama Opsi Tambahan</label>
              <input type="text" className="block border w-full" />
            </div>
            <div>
              <label htmlFor="">Harga</label>
              <input type="number" className="block border w-full" />
            </div>
            <div className="col-span-2">
              <Link>
                <span>+ Tambah Opsi Lain</span>
              </Link>
            </div>
            <div className="col-span-2 flex justify-between">
              <div className="flex-wrap">
                <label htmlFor="">Bahan Baku</label>
                <p>Apakah opsi tambahan ini memiliki bahan baku?</p>
              </div>
              <p>Tidak</p>
            </div>
          </div>
          {/* </form> */}
        </div>

        {/* Fixed Bottom Button */}
        {/* <div className="fixed bottom-0 right-0 w-full max-w-screen-lg bg-white border-t px-4 py-3 flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Simpan
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default UpdateMenu;