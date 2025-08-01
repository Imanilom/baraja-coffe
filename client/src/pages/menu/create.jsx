import { useState, useEffect, useMemo, useRef } from "react";
import Select from 'react-select';
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

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: '#d1d5db', // Tailwind border-gray-300
      minHeight: '34px',
      fontSize: '13px',
      color: '#6b7280', // text-gray-500
      boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none', // blue-500 on focus
      '&:hover': {
        borderColor: '#9ca3af', // Tailwind border-gray-400
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#6b7280', // text-gray-500
    }),
    input: (provided) => ({
      ...provided,
      color: '#6b7280', // text-gray-500 for typed text
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
        subCategory: formData.subCategory || null,
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
                <Select
                  options={MainCategories.map((cat) => ({
                    label: cat.charAt(0).toUpperCase() + cat.slice(1),
                    value: cat.toLowerCase()
                  }))}
                  value={MainCategories.find(cat => cat === selectedMainCategory) ? {
                    label: selectedMainCategory.charAt(0).toUpperCase() + selectedMainCategory.slice(1),
                    value: selectedMainCategory
                  } : null}
                  onChange={(selectedOption) => {
                    setSelectedMainCategory(selectedOption.value);
                    setSearchTermMainCategories(selectedOption.value);
                  }}
                  styles={customSelectStyles}
                  placeholder="Pilih kategori utama..."
                />

              </div>

              {/* KATEGORI UTAMA */}

              <div>
                <label className="my-2.5 text-xs block font-medium">KATEGORI</label>
                <Select
                  options={categories.map((cat) => ({
                    label: cat.name,
                    value: cat._id,
                  }))}
                  value={
                    formData.category
                      ? {
                        label: categories.find((cat) => cat._id === formData.category)?.name || "",
                        value: formData.category,
                      }
                      : null
                  }
                  onChange={(selected) => {
                    setSearchTermCategories(selected.label);
                    setFormData((prev) => ({
                      ...prev,
                      category: selected.value,
                    }));
                    const sub = allCategories.filter(
                      (cat) => cat.parentCategory === selected.value
                    );
                    setSubCategories(sub);
                  }}
                  styles={customSelectStyles}
                  placeholder="Pilih kategori..."
                  className="mb-2"
                />
              </div>

              {/* Sub Kategori */}
              {subCategories.length > 0 && (
                <div>
                  <label className="my-2.5 text-xs block font-medium">SUB KATEGORI</label>
                  <Select
                    options={subCategories.map((sub) => ({
                      label: sub.name,
                      value: sub._id,
                    }))}
                    onChange={(selected) => {
                      setSearchTermSub(selected.label);
                      setFormData((prev) => ({
                        ...prev,
                        subCategory: selected.value,
                      }));
                    }}
                    placeholder="Pilih sub kategori..."
                    className="mb-2"
                    styles={customSelectStyles}
                  />
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
