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
import ConfirmationModal from "./confirmmodal";
import Select from "react-select";
import Header from "../admin/header";

const UpdateMenu = () => {
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: '#d1d5db', // Tailwind border-gray-300
      minHeight: '34px',
      fontSize: '14px',
      color: '#6b7280', // text-green-900
      boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none', // blue-500 on focus
      '&:hover': {
        borderColor: '#9ca3af', // Tailwind border-gray-400
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#6b7280', // text-green-900
    }),
    input: (provided) => ({
      ...provided,
      color: '#6b7280', // text-green-900 for typed text
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af', // text-gray-400
      fontSize: '13px',
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: '13px',
      color: '#374151', // gray-700
      backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white', // blue-50
      cursor: 'pointer',
    }),
  };
  const { id } = useParams(); // Get the menu item ID from the URL
  const [title, setTitle] = useState([]);
  const MainCategories = ['makanan', 'minuman', 'dessert', 'snack'];
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    description: "",
    mainCategory: "",
    category: "",
    subCategory: null,
    imageURL: "",
    toppings: [],
    addons: [],
    availableAt: [],
    workstation: ""
  });


  const [isChecked, setIsChecked] = useState(false);
  const [selectedMainCategory, setSelectedMainCategory] = useState("");

  const [isOptional, setIsOptional] = useState([false]);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [categoryMap, setCategoryMap] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const fetchCategories = async () => {
      try {
        const res = await axios.get("/api/menu/categories");
        const data = res.data.data;

        setAllCategories(data);
        const main = data.filter((cat) => !cat.parentCategory);
        setCategories(main);
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

    const fetchMenuItem = async () => {
      try {
        const response = await axios.get(`/api/menu/menu-items/${id}`);
        const menuItem = response.data.data;

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
    fetchMenuItem(); // Fetch the menu item to update
  }, [id]);

  useEffect(() => {
    if (formData.workstation === "kitchen") {
      setIsChecked(true);
    } else {
      setIsChecked(false);
    }
  }, [formData.workstation]);

  const mainCategoryOptions = MainCategories.map((cat) => ({
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: cat.toLowerCase()
  }));


  const categoryOptions = categories.map(category => ({
    value: category._id,
    label: category.name,
  }));

  const allCategoryOptions = useMemo(() => {
    // Validasi formData.category dan allCategories
    if (!formData.category || allCategories.length === 0) return [];

    // Ambil ID dari category - bisa _id atau id
    let categoryId;
    if (typeof formData.category === 'string') {
      categoryId = formData.category;
    } else if (formData.category) {
      // Coba _id dulu, kalau tidak ada coba id
      categoryId = formData.category._id || formData.category.id;
    }

    if (!categoryId) {
      console.warn('Category ID tidak ditemukan:', formData.category);
      return [];
    }

    // Filter sub-kategori yang parentCategory === categoryId
    return allCategories
      .filter((cat) => {
        // Pastikan cat memiliki parentCategory
        if (!cat.parentCategory) return false;

        // Handle jika parentCategory berupa objek atau string
        let parentId;
        if (typeof cat.parentCategory === 'string') {
          parentId = cat.parentCategory;
        } else if (cat.parentCategory) {
          // Coba _id dulu, kalau tidak ada coba id
          parentId = cat.parentCategory._id || cat.parentCategory.id;
        }

        return parentId === categoryId;
      })
      .map((cat) => ({
        value: cat._id || cat.id,
        label: cat.name,
      }));
  }, [allCategories, formData.category]);

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

    console.log(formData.category);

    const payload = {
      ...formData,
      category: typeof formData.category === 'string'
        ? formData.category
        : formData.category?._id || formData.category?.id,
      subCategory: typeof formData.subCategory === 'string'
        ? formData.subCategory || null
        : formData.subCategory?._id || "",
    };

    console.log(payload)

    try {
      await axios.put(`/api/menu/menu-items/${id}`, payload);
      navigate("/admin/menu", { state: { success: "Menu berhasil diperbarui" } });
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
      <form onSubmit={handleSubmit}>

        <div className="flex justify-between items-center px-6 py-3 my-3">
          <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
            <Link to="/admin/menu">
              Menu
            </Link>
            <FaChevronRight />
            <span>{title}</span>
          </h1>
          <div className="flex items-center gap-3">
            <span
              onClick={() => setShowModal(true)}
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
        <ConfirmationModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={() => navigate("/admin/menu")}
        />

        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shadow-md rounded-xl p-6 bg-white">
            {/* Bagian kiri */}
            <div className="space-y-4 text-green-900">
              {/* Name */}
              <div>
                <label className="text-xs block font-medium after:content-['*'] after:text-red-500 after:text-lg after:ml-1 mb-2.5">
                  NAMA MENU
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full py-2 px-3 border rounded-lg focus:ring focus:ring-green-200"
                  required
                />
              </div>

              {/* Main Category */}
              <div>
                <label className="my-2.5 text-xs block font-medium">
                  MAIN KATEGORI
                </label>
                <Select
                  options={mainCategoryOptions}
                  value={
                    mainCategoryOptions.find(
                      (opt) => opt.value === formData.mainCategory
                    ) || null
                  }
                  onChange={(selectedOption) => {
                    setFormData((prev) => ({
                      ...prev,
                      mainCategory: selectedOption?.value || "",
                    }));
                  }}
                  styles={customStyles}
                  placeholder="Pilih kategori utama..."
                />
              </div>

              {/* Category */}
              <div>
                <label className="my-2.5 text-xs block font-medium">KATEGORI</label>
                <Select
                  className="w-full text-sm"
                  options={categoryOptions}
                  value={
                    formData.category && formData.category.name
                      ? {
                        value: formData.category._id || "",
                        label: formData.category.name,
                      }
                      : null
                  }
                  onChange={(selectedOption) => {
                    const selectedCategory = categories.find(
                      (cat) => cat._id === selectedOption?.value
                    );
                    setFormData((prev) => ({
                      ...prev,
                      category: selectedCategory,
                      subCategory: "",
                    }));
                  }}
                  styles={customStyles}
                />
              </div>

              {/* Sub Category */}
              <div>
                <label className="my-2.5 text-xs block font-medium">
                  SUB KATEGORI
                </label>
                <Select
                  className="w-full text-sm"
                  options={allCategoryOptions}
                  value={
                    formData.subCategory
                      ? {
                        value: formData.subCategory._id,
                        label: formData.subCategory.name,
                      }
                      : null
                  }
                  onChange={(selectedOption) => {
                    const selectedSub = allCategories.find(
                      (sub) => sub._id === selectedOption?.value
                    );
                    setFormData((prev) => ({
                      ...prev,
                      subCategory: selectedSub,
                    }));
                  }}
                  styles={customStyles}
                  placeholder="Pilih sub kategori"
                />
              </div>

              {/* Price */}
              <div>
                <label className="my-2.5 text-xs block font-medium">HARGA</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full py-2 px-3 border rounded-lg focus:ring focus:ring-green-200"
                  required
                />
              </div>

              {/* SKU */}
              {/* <div>
                <label className="my-2.5 text-xs block font-medium">SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className="w-full py-2 px-3 border rounded-lg focus:ring focus:ring-green-200"
                />
              </div> */}

              {/* Barcode */}
              {/* <div>
                <label className="my-2.5 text-xs block font-medium">BARCODE</label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  className="w-full py-2 px-3 border rounded-lg focus:ring focus:ring-green-200"
                />
              </div> */}

              {/* Stock unit */}
              {/* <div>
                <label className="my-2.5 text-xs block font-medium">
                  SATUAN STOK
                </label>
                <input
                  type="text"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  className="w-full py-2 px-3 border rounded-lg focus:ring focus:ring-green-200"
                />
              </div> */}

              {/* Image Upload */}
              <div className="flex items-center space-x-4 p-4 rounded-lg">
                <img
                  src={formData.imageURL}
                  alt="Uploaded"
                  className="h-20 w-20 object-cover rounded cursor-pointer"
                  onClick={() => fileRef.current.click()}
                />
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setImage(e.target.files[0])}
                />
                {imagePercent > 0 && (
                  <div className="text-sm text-gray-600">
                    Upload Progress: {imagePercent}%
                  </div>
                )}
                {imageError && (
                  <div className="text-red-500 text-sm">Image upload failed</div>
                )}
              </div>

              <div>
                <label className="block mb-2.5 text-xs font-medium uppercase">Deskripsi</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2 h-36"
                />
              </div>
            </div>

            {/* Bagian kanan */}
            <div className="space-y-4 text-sm text-green-900">
              <ToppingForm
                toppings={formData.toppings}
                setToppings={(updatedToppings) =>
                  setFormData((prev) => ({ ...prev, toppings: updatedToppings }))
                }
              />

              <AddonForm
                addons={formData.addons || []}
                setAddons={(addons) =>
                  setFormData((prev) => ({ ...prev, addons }))
                }
              />

              {/* Outlet */}
              <div>
                <label className="block mb-1 text-sm font-medium">Pilih Outlet</label>
                <div className="grid gap-2">
                  {outlets.map((outlet) => (
                    <label
                      key={outlet._id}
                      className="inline-flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        value={outlet._id}
                        checked={formData.availableAt
                          .map((item) =>
                            typeof item === "string" ? item : item._id
                          )
                          .includes(outlet._id)}
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
                        className="form-checkbox text-green-600"
                      />
                      <span>{outlet.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dapur / Bar toggle */}
              <div className="flex justify-between items-center">
                <span>Apakah menu ini berada di dapur?</span>
                <label className="inline-flex items-center cursor-pointer space-x-3">
                  <span className="text-sm font-medium text-gray-900">
                    {isChecked ? "Ya" : "Tidak"}
                  </span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsChecked(checked);
                      setFormData((prevData) => ({
                        ...prevData,
                        workstation: checked ? "kitchen" : "bar",
                      }));
                    }}
                    className="sr-only peer"
                  />
                  <div
                    className="w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-1
                peer-checked:bg-[#005429] relative after:content-[''] after:absolute after:top-0.5 
                after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
                after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"
                  ></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>

  );
};

export default UpdateMenu;
