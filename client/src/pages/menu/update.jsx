<<<<<<< Updated upstream
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
=======
// import React, { useRef, useEffect, useState } from "react";
// import { useParams, Link } from "react-router-dom";
// import axios from "axios";
// import {
//   getDownloadURL,
//   getStorage,
//   ref,
//   uploadBytesResumable,
// } from "firebase/storage";
// import { app } from "../../firebase";

// const UpdateMenu = ({ fetchMenuItems, onCancel }) => {
//   const { id } = useParams(); // Get the ID from the URL
//   const [formData, setFormData] = useState({
//     name: "",
//     price: "",
//     category: "",
//     toppings: [],
//     addOns: [],
//     imageURL: "", // Added imageURL
//   });
//   const [toppings, setToppings] = useState([]);
//   const [addOns, setAddOns] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);

//   const fileRef = useRef(null);
//   const [image, setImage] = useState(undefined);
//   const [imagePercent, setImagePercent] = useState(0);
//   const [imageError, setImageError] = useState(false);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (image) {
//       handleFileUpload(image);
//     }
//   }, [image]);

//   const handleFileUpload = async (image) => {
//     const storage = getStorage(app);
//     const fileName = new Date().getTime() + image.name;
//     const storageRef = ref(storage, fileName);
//     const uploadTask = uploadBytesResumable(storageRef, image);
//     uploadTask.on(
//       "state_changed",
//       (snapshot) => {
//         const progress =
//           (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
//         setImagePercent(Math.round(progress));
//       },
//       (error) => {
//         setImageError(true);
//       },
//       () => {
//         getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) =>
//           setFormData((prevData) => ({ ...prevData, imageURL: downloadURL }))
//         );
//       }
//     );
//   };

//   // Fetch the menu item data by ID
//   useEffect(() => {
//     const fetchMenuItem = async () => {
//       try {
//         const response = await axios.get(`/api/menu/menu-items/${id}`);
//         const menuItem = response.data.data;
//         setFormData({
//           name: menuItem.name || "",
//           price: menuItem.price || "",
//           category: menuItem.category || "",
//           toppings: menuItem.toppings.map((topping) => topping._id) || [],
//           addOns: menuItem.addOns.map((addOn) => addOn._id) || [],
//           imageURL: menuItem.imageURL || "", // Populate imageURL
//         });
//         setIsLoading(false);
//       } catch (error) {
//         console.error("Error fetching menu item:", error);
//         setIsLoading(false);
//       }
//     };
//     fetchMenuItem();
//   }, [id]);

//   // Fetch available toppings and add-ons
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [toppingsRes, addOnsRes] = await Promise.all([
//           axios.get("/api/menu/toppings"),
//           axios.get("/api/menu/addons"),
//         ]);
//         setToppings(toppingsRes.data?.data || []);
//         setAddOns(addOnsRes.data?.data || []);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       }
//     };
//     fetchData();
//   }, []);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//   };

//   const handleCheckboxChange = (e, listName) => {
//     const { value, checked } = e.target;
//     setFormData((prevState) => ({
//       ...prevState,
//       [listName]: checked
//         ? [...prevState[listName], value]
//         : prevState[listName].filter((id) => id !== value),
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const payload = {
//         ...formData,
//         toppings: formData.toppings.map((id) => id.toString()),
//         addOns: formData.addOns.map((id) => id.toString()),
//       };
//       console.log('Payload:', payload);
//       await axios.put(`/api/menu/menu-items/${id}`, payload);
//       fetchMenuItems();
//       onCancel();
//     } catch (error) {
//       console.error("Error updating menu item:", error);
//     }
//   };

//   if (isLoading) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
//       <form
//         onSubmit={handleSubmit}
//         className="bg-white p-6 rounded shadow-md w-full max-w-lg"
//       >
//         <h2 className="text-xl font-bold mb-4">Update Menu Item</h2>

//         <div className="mb-4">
//           <label className="block text-gray-700">Image</label>
//           <img
//             src={formData.imageURL}
//             alt="Uploaded"
//             className="h-24 w-24 object-cover rounded mb-2"
//             onClick={() => fileRef.current.click()}
//           />
//           <input
//             ref={fileRef}
//             type="file"
//             className="hidden"
//             onChange={(e) => setImage(e.target.files[0])}
//           />
//         </div>

//         <div className="mb-4">
//           <label className="block text-gray-700">Name</label>
//           <input
//             type="text"
//             name="name"
//             value={formData.name}
//             onChange={handleInputChange}
//             className="w-full border rounded px-3 py-2"
//             required
//           />
//         </div>

//         <div className="mb-4">
//           <label className="block text-gray-700">Price</label>
//           <input
//             type="number"
//             name="price"
//             value={formData.price}
//             onChange={handleInputChange}
//             className="w-full border rounded px-3 py-2"
//             required
//           />
//         </div>

//         <div className="mb-4">
//           <label className="block text-gray-700">Category</label>
//           <input
//             type="text"
//             name="category"
//             value={formData.category}
//             onChange={handleInputChange}
//             className="w-full border rounded px-3 py-2"
//             required
//           />
//         </div>

//         {/* <div className="mb-4">
//           <label className="block text-gray-700">Stock</label>
//           <input
//             type="number"
//             name="stock"
//             value={formData.stock}
//             onChange={handleInputChange}
//             className="w-full border rounded px-3 py-2"
//           />
//         </div> */}

//         <div className="mb-4">
//           <label className="block text-gray-700">Toppings</label>
//           {toppings.map((topping) => (
//             <div key={topping._id} className="flex items-center">
//               <input
//                 type="checkbox"
//                 value={topping._id}
//                 checked={formData.toppings.includes(topping._id)}
//                 onChange={(e) => handleCheckboxChange(e, "toppings")}
//               />
//               <label className="ml-2">{topping.name}</label>
//             </div>
//           ))}
//         </div>

//         <div className="mb-4">
//           <label className="block text-gray-700">Add-Ons</label>
//           {addOns.map((addOn) => (
//             <div key={addOn._id} className="flex items-center">
//               <input
//                 type="checkbox"
//                 value={addOn._id}
//                 checked={formData.addOns.includes(addOn._id)}
//                 onChange={(e) => handleCheckboxChange(e, "addOns")}
//               />
//               <label className="ml-2">{addOn.name}</label>
//             </div>
//           ))}
//         </div>

//         <div className="flex justify-end space-x-4">
//           {/* <Link
//             to={`/menu`}
//             className="bg-gray-500 text-white px-4 py-2 rounded"
//           >
//             Cancel
//           </Link> */}

//           <button
//             type="button"
//             onClick={onCancel}
//             className="bg-gray-400 text-white px-4 py-2 rounded"
//           >
//             Cancel
//           </button>

//           <button
//             type="submit"
//             disabled={loading}
//             className="bg-blue-500 text-white px-4 py-2 rounded"
//           >
//             {loading ? "Saving..." : "Save"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default UpdateMenu;

import React, { useRef, useEffect, useState } from "react";
import axios from "axios";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../../firebase";
import { Link, useParams } from "react-router-dom"
>>>>>>> Stashed changes

const Update = () => {
  const { id } = useParams();
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: "",
<<<<<<< Updated upstream
    description: "",
    price: "",
    category: "",
    promotionTitle: "",
    discount: "",
    imageURL: "",
=======
    price: "",
    category: "",
>>>>>>> Stashed changes
    toppings: [],
    addons: [],
  });
<<<<<<< Updated upstream
  const [toppingsList, setToppingsList] = useState([]);
  const [addonsList, setAddonsList] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
=======
  const [toppings, setToppings] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fileRef = useRef(null);
  const [image, setImage] = useState(undefined);
  const [imagePercent, setImagePercent] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);
>>>>>>> Stashed changes

  useEffect(() => {
    // Fetch menu item details
    const fetchMenuItem = async () => {
      try {
<<<<<<< Updated upstream
        const response = await axios.get(`/api/menu/menu-items/${id}`);
        setFormData(response.data.data);
        setImagePreview(response.data.data.imageURL);
=======
        const response = await axios.get(`/api/menu/menu-items/${menu._id}`);
        const menuItem = response.data.data;
        // console.log(menuItem);
        setFormData({
          name: menuItem.name || "",
          price: menuItem.price || "",
          category: menuItem.category || "",
          toppings: menuItem.toppings.map((topping) => topping._id) || [],
          addOns: menuItem.addOns.map((addOn) => addOn._id) || [],
          imageURL: menuItem.imageURL || "", // Populate imageURL
        });
        setIsLoading(false);
>>>>>>> Stashed changes
      } catch (error) {
        console.error("Error fetching menu item:", error);
        navigate('/')
      }
    };
    fetchMenuItem();
<<<<<<< Updated upstream
=======
  });
>>>>>>> Stashed changes

    // Fetch available toppings and addons
    const fetchOptions = async () => {
      try {
<<<<<<< Updated upstream
        const toppings = await axios.get("/api/menu/toppings");
        const addons = await axios.get("/api/menu/addons");
        setToppingsList(toppings.data.data);
        setAddonsList(addons.data.data);
=======
        const [toppingsRes, addOnsRes] = await Promise.all([
          axios.get("/api/menu/toppings"),
          axios.get("/api/menu/addons"),
        ]);
        setToppings(toppingsRes.data?.data || []);
        setAddOns(addOnsRes.data?.data || []);
>>>>>>> Stashed changes
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };
    fetchOptions();
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
<<<<<<< Updated upstream

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
=======
    setLoading(true);
    try {
      const payload = {
        ...formData,
        toppings: formData.toppings.map((id) => id.toString()),
        addOns: formData.addOns.map((id) => id.toString()),
      };
      console.log('Payload:', payload);
      await axios.put(`/api/menu/menu-items/${id}`, payload);
      fetchMenuItems();
      onCancel();
>>>>>>> Stashed changes
    } catch (error) {
      console.error("Error updating menu item:", error);
      alert("Gagal memperbarui menu. Periksa koneksi atau data Anda.");
    }
  };

<<<<<<< Updated upstream
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Perbarui Menu</h1>
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
=======
  //loading
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between border-b border-gray-200 py-2">
        <h1 className="text-2xl font-bold">Update Menu</h1>
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-white py-6 w-full"
      >
        <div className="grid grid-cols-2 gap-4">

          <div className="mb-4">
            <label className="block mb-2 font-medium">Name</label>
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
            <label className="block mb-2 font-medium">Price</label>
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
            <label className="block mb-2 font-medium">Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div className="mb-4 col-span-2">
            <label className="block mb-2 font-medium">Image</label>
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
            <label className="block mb-2 font-medium">Toppings</label>
            {/* {console.log(toppings)} */}
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

        <div className="flex justify-end space-x-4">
          <Link
            to={`/menu`}
            className="bg-gray-500 text-white px-4 py-2 rounded"
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
>>>>>>> Stashed changes
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
          Simpan Perubahan
        </button>
      </form>
    </div>
  );
};

<<<<<<< Updated upstream
export default Update;
=======
export default UpdateMenu;
>>>>>>> Stashed changes
