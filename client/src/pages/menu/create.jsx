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
import { FaChevronRight, FaShoppingBag, FaBell, FaUser, FaImage, FaCamera, FaInfoCircle, FaGift, FaPizzaSlice, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ConfirmationModal from "./confirmmodal";
import ToppingForm from "./varianmodal";
import AddonForm from "./opsimodal";

const CreateMenu = () => {
  const [allCategories, setAllCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const MainCategories = ['makanan', 'minuman', 'dessert', 'snack'];
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [outlets, setOutlets] = useState([]);
  const [file, setFile] = useState(null);
  const [isVariationOpen, setIsVariationOpen] = useState(false);
  const [isOpsiOpen, setIsOpsiOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState("");
  const [searchTermMainCategories, setSearchTermMainCategories] = useState("");
  const [searchTermCategories, setSearchTermCategories] = useState("");
  const [searchTermSub, setSearchTermSub] = useState("");

  const [showMainDropdown, setShowMainDropdown] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSubDropdown, setShowSubDropdown] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isOptional, setIsOptional] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [imageFile, setImageFile] = useState(null);

  const [compressedImageURL, setCompressedImageURL] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    mainCat: "",
    category: "",
    subCategory: "",
    rawMaterials: [],
    availableAt: [],
  });

  const [toppings, setToppings] = useState([]);
  const [addons, setAddons] = useState([]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setCompressedImageURL(URL.createObjectURL(file)); // tampilkan preview
  };

  const compressImage = (file, quality = 0.6, maxWidth = 800) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;

        img.onload = () => {
          const canvas = document.createElement("canvas");

          const scale = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scale;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            (blob) => {
              if (!blob) return reject("Blob is null");
              resolve(blob);
            },
            "image/jpeg",
            quality
          );
        };

        img.onerror = (err) => reject(err);
      };

      reader.onerror = (err) => reject(err);
    });
  };

  const uploadToFirebase = (file) => {
    return new Promise((resolve, reject) => {
      const storage = getStorage(app);
      const fileRef = ref(storage, `menu/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        "state_changed",
        null,
        (err) => reject(err),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  useEffect(() => {
    fetchCategories();
    fetchOutlets();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/menu/categories");
      const data = res.data.data;

      setAllCategories(data);
      const main = data.filter((cat) => !cat.parentCategory);
      setCategories(main);
    } catch (error) {
      console.error("Gagal fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOutlets = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/outlet");
      const data = res.data.data;

      setOutlets(data);
    } catch (error) {
      console.error("Gagal fetch outlet:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMainCategories = MainCategories.filter((category) =>
    category.toLowerCase().includes(searchTermMainCategories.toLowerCase())
  );

  const handleMainCategorySearch = (e) => {
    setSearchTermMainCategories(e.target.value);
    setShowMainDropdown(true);
  };

  const handleSelectMainCategory = (category) => {
    const lowerCased = category.toLowerCase();
    setSelectedMainCategory(lowerCased);
    setSearchTermMainCategories(lowerCased);
    setShowMainDropdown(false);
  };

  const handleCategorySearch = (e) => {
    setSearchTermCategories(e.target.value);
    setShowDropdown(true);
  };

  const handleSubCategorySearch = (e) => {
    setSearchTermSub(e.target.value);
    setShowSubDropdown(true);
  };

  const visibleCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTermCategories.toLowerCase())
  );

  const visibleSubCategories = subCategories.filter((sub) =>
    sub.name.toLowerCase().includes(searchTermSub.toLowerCase())
  );

  const handleSelectCategory = (category) => {
    setSearchTermCategories(category.name);
    setShowDropdown(false);
    setShowSubDropdown(false);
    setSearchTermSub("");

    setFormData((prev) => ({
      ...prev,
      category: category._id,
    }));

    // Filter subcategories with matching parentCategory._id
    const sub = allCategories.filter(
      (cat) => cat.parentCategory === category._id
    );
    setSubCategories(sub);
  };

  const handleSelectSubCategory = (sub) => {
    setSearchTermSub(sub.name);
    setShowSubDropdown(false);
    setFormData((prev) => ({
      ...prev,
      subCategory: sub._id,
    }));
  };

  const [options, setOptions] = useState([
    { opsi: "", price: "" },
  ]);

  const handleOptionChange = (index, key, value) => {
    const updated = [...options];
    updated[index][key] = value;
    setOptions(updated);
  };

  const addOption = () => {
    setOptions([...options, { opsi: "", price: "" }]);
  };

  const removeOption = (index) => {
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
  };

  const handleSubmit = async (e) => {
    const valueToSend = isChecked ? "kitchen" : "bar";
    e.preventDefault();
    try {
      let imageURL = "";
      if (imageFile) {
        imageURL = await uploadToFirebase(imageFile);
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        // discountedPrice: Number(formData.price), // bisa ubah sesuai diskon
        imageURL: imageURL || "",
        mainCat: selectedMainCategory,
        category: formData.category,
        subCategory: formData.subCategory,
        availableAt: formData.availableAt, // array of outlet ids
        rawMaterials: formData.rawMaterials || [],
        toppings: toppings.map((top) => ({
          name: top.name,
          price: Number(top.price),
        })),
        addons: addons.map((addon) => ({
          name: addon.name,
          options: addon.options.map((opt) => ({
            label: opt.label,
            price: Number(opt.price),
            isDefault: opt.isDefault,
          })),
        })),
        workstation: valueToSend
      };

      console.log(payload);

      await axios.post("/api/menu/menu-items", payload);
      navigate("/admin/menu");
      // alert("Berhasil");
    } catch (err) {
      console.error("Gagal kirim data:", err);
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
    <div className="h-screen">
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
            <span
              onClick={() => setIsModalOpen(true)}
              className="block border border-[#005429] text-[#005429] hover:bg-[#005429] hover:text-white text-sm px-3 py-1.5 rounded cursor-pointer"
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
          <div className="grid grid-cols-2 p-12 gap-10 bg-white shadow-md">
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
                />
              </div>

              <div>
                <label className="my-2.5 text-xs block font-medium">MAIN KATEGORI</label>
                <div className="relative category-dropdown">
                  <input
                    type="text"
                    value={searchTermMainCategories.charAt(0).toUpperCase() + searchTermMainCategories.slice(1)}
                    onChange={handleMainCategorySearch}
                    onFocus={() => setShowMainDropdown(true)}
                    placeholder="Cari kategori utama..."
                    className="w-full py-2 px-3 border rounded-lg"
                  />

                  {showMainDropdown && (
                    <div className="absolute z-10 w-full bg-white border rounded mt-1 shadow-lg max-h-60 overflow-y-auto">
                      {filteredMainCategories.length > 0 ? (
                        filteredMainCategories.map((category, index) => (
                          <div
                            key={index}
                            onClick={() => handleSelectMainCategory(category)}
                            className="p-2 hover:bg-gray-100 cursor-pointer capitalize"
                          >
                            {category}
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-gray-400 text-sm">Tidak ditemukan</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* KATEGORI UTAMA */}

              <div>
                <label className="my-2.5 text-xs block font-medium">KATEGORI</label>
                <div className="relative category-dropdown">
                  <input
                    type="text"
                    value={searchTermCategories}
                    onChange={handleCategorySearch}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Cari kategori utama..."
                    className="w-full py-2 px-3 border rounded-lg"
                  />

                  {showDropdown && visibleCategories.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border rounded mt-1 shadow-lg max-h-60 overflow-y-auto">
                      {visibleCategories.map((category) => (
                        <div
                          key={category._id}
                          onClick={() => handleSelectCategory(category)}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {category.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sub Kategori */}
              {visibleSubCategories.length > 0 && (
                <div>
                  <label className="my-2.5 text-xs block font-medium">SUB KATEGORI</label>
                  <div className="relative subcategory-dropdown">
                    <input
                      type="text"
                      value={searchTermSub}
                      onChange={handleSubCategorySearch}
                      onFocus={() => setShowSubDropdown(true)}
                      placeholder="Cari sub kategori..."
                      className="w-full py-2 px-3 border rounded-lg"
                    />

                    {showSubDropdown && visibleSubCategories.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border rounded mt-1 shadow-lg max-h-60 overflow-y-auto">
                        {visibleSubCategories.map((sub) => (
                          <div
                            key={sub._id}
                            onClick={() => handleSelectSubCategory(sub)}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                          >
                            {sub.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Price */}
              <div>
                <label className="my-2.5 text-xs block font-medium">HARGA</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full py-2 px-3 border rounded-lg"
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

              <div className="flex items-center space-x-4 py-4">
                {compressedImageURL ? (
                  <img
                    src={compressedImageURL}
                    alt="Compressed Preview"
                    className="h-24 w-24 object-cover rounded cursor-pointer"
                    onClick={() => fileRef.current.click()}
                  />
                ) : (
                  <div
                    className="h-24 w-24 flex items-center justify-center bg-gray-200 rounded cursor-pointer"
                    onClick={() => fileRef.current.click()}
                  >
                    <span className="text-gray-500 text-xl">+</span>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  ref={fileRef}
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            </div>

            {/* grid 2  */}
            <div className="text-[14px] text-[#999999] relative">
              <div className="">
                <label className="block mb-1 text-sm font-medium">Deskripsi</label>
                <textarea
                  name="description"
                  id="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                />
              </div>
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
              <div className="flex justify-between">
                <span>Apakah menu ini berada di dapur?</span>

                <label className="inline-flex items-center cursor-pointer space-x-3">
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {isChecked ? "Ya" : "Tidak"}
                  </span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-1
          peer-checked:bg-[#005429] relative after:content-[''] after:absolute after:top-0.5 
          after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
          after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full">
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Modal Slide */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => navigate("/admin/menu")}
      />
    </div>
  );
};

export default CreateMenu;
// import React, { useEffect, useState } from "react";

// const CreateMenu = () => {
//   const [formData, setFormData] = useState({
//     name: "",
//     category: "",
//     subCategory: "",
//     imageUrl: "",
//     originalPrice: "",
//     discountedPrice: "",
//     description: "",
//     toppings: [],
//     addons: [],
//   });
//   const [allCategories, setAllCategories] = useState([]);
//   const [mainCategories, setMainCategories] = useState([]);
//   const [filteredSubCategories, setFilteredSubCategories] = useState([]);

//   // Fetch categories & subCategories saat komponen mount
//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   const fetchCategories = async () => {
//     try {
//       const res = await axios.get("/api/menu/categories");
//       const data = res.data.data;

//       setAllCategories(data);
//       // filter category yang tidak punya parent
//       const parentNull = data.filter(cat => !cat.parentCategory);
//       setMainCategories(parentNull);
//     } catch (error) {
//       console.error("Gagal fetch categories:", error);
//     }
//   };

//   const handleCategoryChange = (e) => {
//     const selectedId = e.target.value;
//     setFormData((prev) => ({ ...prev, category: selectedId, subCategory: "" }));

//     // filter subCategory dengan parentCategory._id === selectedId
//     const subCats = allCategories.filter(
//       (cat) => cat.parentCategory === selectedId
//     );
//     console.log(subCats);
//     setFilteredSubCategories(subCats);
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleToppingChange = (index, field, value) => {
//     const newToppings = [...formData.toppings];
//     newToppings[index][field] = value;
//     setFormData((prev) => ({ ...prev, toppings: newToppings }));
//   };

//   const addTopping = () => {
//     setFormData((prev) => ({
//       ...prev,
//       toppings: [...prev.toppings, { name: "", price: "" }],
//     }));
//   };

//   const removeTopping = (index) => {
//     const newToppings = [...formData.toppings];
//     newToppings.splice(index, 1);
//     setFormData((prev) => ({ ...prev, toppings: newToppings }));
//   };

//   const handleAddonChange = (index, field, value) => {
//     const newAddons = [...formData.addons];
//     newAddons[index][field] = value;
//     setFormData((prev) => ({ ...prev, addons: newAddons }));
//   };

//   const handleAddonOptionChange = (addonIndex, optionIndex, field, value) => {
//     const newAddons = [...formData.addons];
//     newAddons[addonIndex].options[optionIndex][field] = value;
//     setFormData((prev) => ({ ...prev, addons: newAddons }));
//   };

//   const addAddon = () => {
//     setFormData((prev) => ({
//       ...prev,
//       addons: [...prev.addons, { name: "", options: [{ label: "", price: "", isDefault: false }] }],
//     }));
//   };

//   const addAddonOption = (addonIndex) => {
//     const newAddons = [...formData.addons];
//     newAddons[addonIndex].options.push({ label: "", price: "", isDefault: false });
//     setFormData((prev) => ({ ...prev, addons: newAddons }));
//   };

//   const removeAddon = (index) => {
//     const newAddons = [...formData.addons];
//     newAddons.splice(index, 1);
//     setFormData((prev) => ({ ...prev, addons: newAddons }));
//   };

//   return (
//     <form className="space-y-4 p-4 max-w-2xl mx-auto">
//       <h2 className="text-xl font-semibold mb-2">Form Produk</h2>

//       <div>
//         <label className="block mb-1 font-medium">Nama Produk</label>
//         <input name="name" onChange={handleChange} className="border rounded w-full px-3 py-2" />
//       </div>

//       <div>
//         <label className="block mb-1 font-medium">Kategori</label>
//         <select
//           name="category"
//           value={formData.category}
//           onChange={handleCategoryChange}
//           className="border rounded w-full px-3 py-2"
//         >
//           <option value="">Pilih Kategori</option>
//           {mainCategories.map((cat) => (
//             <option key={cat._id} value={cat._id}>{cat.name}</option>
//           ))}
//         </select>
//       </div>

//       <div>
//         <label className="block mb-1 font-medium">Sub Kategori</label>
//         <select
//           name="subCategory"
//           value={formData.subCategory}
//           onChange={handleChange}
//           className="border rounded w-full px-3 py-2"
//           disabled={!formData.category}
//         >
//           <option value="">Pilih Sub Kategori</option>
//           {filteredSubCategories.map((sub) => (
//             <option key={sub._id} value={sub._id}>{sub.name}</option>
//           ))}
//         </select>
//       </div>

//       <div>
//         <label className="block mb-1 font-medium">Harga Asli</label>
//         <input name="originalPrice" type="number" onChange={handleChange} className="border rounded w-full px-3 py-2" />
//       </div>

//       <div>
//         <label className="block mb-1 font-medium">Harga Diskon</label>
//         <input name="discountedPrice" type="number" onChange={handleChange} className="border rounded w-full px-3 py-2" />
//       </div>

//       <div>
//         <label className="block mb-1 font-medium">Deskripsi</label>
//         <textarea name="description" onChange={handleChange} className="border rounded w-full px-3 py-2"></textarea>
//       </div>

//       {/* Toppings */}
//       <div>
//         <label className="block mb-1 font-bold">Toppings</label>
//         {formData.toppings.map((topping, index) => (
//           <div key={index} className="flex gap-2 mb-2">
//             <input
//               placeholder="Nama"
//               value={topping.name}
//               onChange={(e) => handleToppingChange(index, "name", e.target.value)}
//               className="border px-2 py-1 rounded w-1/2"
//             />
//             <input
//               placeholder="Harga"
//               type="number"
//               value={topping.price}
//               onChange={(e) => handleToppingChange(index, "price", e.target.value)}
//               className="border px-2 py-1 rounded w-1/2"
//             />
//             <button type="button" onClick={() => removeTopping(index)} className="text-red-500">✕</button>
//           </div>
//         ))}
//         <button type="button" onClick={addTopping} className="text-blue-500">+ Tambah Topping</button>
//       </div>

//       {/* Addons */}
//       <div>
//         <label className="block mb-1 font-bold">Addons</label>
//         {formData.addons.map((addon, addonIndex) => (
//           <div key={addonIndex} className="mb-4 p-2 border rounded">
//             <input
//               placeholder="Nama Addon"
//               value={addon.name}
//               onChange={(e) => handleAddonChange(addonIndex, "name", e.target.value)}
//               className="border px-2 py-1 rounded w-full mb-2"
//             />
//             {addon.options.map((opt, optIndex) => (
//               <div key={optIndex} className="flex gap-2 mb-2">
//                 <input
//                   placeholder="Label"
//                   value={opt.label}
//                   onChange={(e) => handleAddonOptionChange(addonIndex, optIndex, "label", e.target.value)}
//                   className="border px-2 py-1 rounded w-1/2"
//                 />
//                 <input
//                   placeholder="Harga"
//                   type="number"
//                   value={opt.price}
//                   onChange={(e) => handleAddonOptionChange(addonIndex, optIndex, "price", e.target.value)}
//                   className="border px-2 py-1 rounded w-1/2"
//                 />
//                 <label className="flex items-center space-x-1">
//                   <input
//                     type="checkbox"
//                     checked={opt.isDefault}
//                     onChange={(e) =>
//                       handleAddonOptionChange(addonIndex, optIndex, "isDefault", e.target.checked)
//                     }
//                   />
//                   <span className="text-sm">Default</span>
//                 </label>
//               </div>
//             ))}
//             <button type="button" onClick={() => addAddonOption(addonIndex)} className="text-blue-500">+ Tambah Opsi</button>
//             <button type="button" onClick={() => removeAddon(addonIndex)} className="text-red-500 ml-4">✕ Hapus Addon</button>
//           </div>
//         ))}
//         <button type="button" onClick={addAddon} className="text-blue-500">+ Tambah Addon</button>
//       </div>

//       <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Simpan</button>
//     </form>
//   );
// };

// export default CreateMenu;

