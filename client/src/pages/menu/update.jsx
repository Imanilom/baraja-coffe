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

const UpdateMenu = () => {
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: '#d1d5db', // Tailwind border-gray-300
      minHeight: '34px',
      fontSize: '14px',
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
  const { id } = useParams(); // Get the menu item ID from the URL
  const [title, setTitle] = useState([]);
  const MainCategories = ['makanan', 'minuman', 'dessert', 'snack'];
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    description: "",
    mainCategory: "",
    category: "",
    subCategory: "",
    imageURL: "",
    toppings: [],
    addons: [],
    rawMaterials: [],
    availableAt: [],
    workstation: ""
  });


  const [isChecked, setIsChecked] = useState(false);
  const [selectedMainCategory, setSelectedMainCategory] = useState("");

  const [isOptional, setIsOptional] = useState([false]);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
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

  const allCategoryOptions = allCategories
    .filter((cat) => cat.parentCategory === formData.category?.id)
    .map((cat) => ({
      value: cat._id,
      label: cat.name,
    }));

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

    const payload = {
      ...formData,
      category: formData.category?.id || "",      // ambil hanya ID
      subCategory: formData.subCategory?.id || "", // sama juga
    };

    try {
      await axios.put(`/api/menu/menu-items/${id}`, payload);
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
        <ConfirmationModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={() => navigate("/admin/menu")}
        />
        <div className="bg-slate-50 p-6">
          <div className="grid grid-cols-2 p-12 space-x-4 bg-white shadow-md">
            {/* grid 1 */}
            <div className="text-gray-500">

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

              {/* mainCategory */}
              <div>
                <label className="my-2.5 text-xs block font-medium">MAIN KATEGORI</label>
                <Select
                  options={mainCategoryOptions}
                  value={
                    mainCategoryOptions.find(opt => opt.value === formData.mainCategory) || null
                  }
                  onChange={(selectedOption) => {
                    setFormData(prev => ({
                      ...prev,
                      mainCategory: selectedOption?.value || ""
                    }));
                  }}
                  styles={customStyles}
                  placeholder="Pilih kategori utama..."
                />
              </div>

              {/* Category */}
              <div className="">
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
                    const selectedCategory = categories.find(cat => cat._id === selectedOption?.value);
                    setFormData(prev => ({
                      ...prev,
                      category: selectedCategory,
                      subCategory: "", // reset subCategory
                    }));
                  }}
                  styles={customStyles}
                />
              </div>

              <div className="mt-4">
                <label className="my-2.5 text-xs block font-medium">SUB KATEGORI</label>
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
                    const selectedSub = allCategories.find(sub => sub._id === selectedOption?.value);
                    setFormData(prev => ({
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

            <div className="text-[14px] text-gray-500">
              {/* <ToppingForm toppings={formData.toppings} setToppings={setToppings} /> */}
              <ToppingForm
                toppings={formData.toppings}
                setToppings={(updatedToppings) =>
                  setFormData((prev) => ({ ...prev, toppings: updatedToppings }))
                }
              />
              <AddonForm
                addons={formData.addons || []}
                setAddons={(addons) => setFormData((prev) => ({ ...prev, addons }))}
              />

              <div>
                <label className="block mb-1 text-sm font-medium">Pilih Outlet</label>
                <div className="grid gap-2">
                  {outlets.map((outlet) => (
                    <label key={outlet._id} className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={outlet._id}
                        checked={formData.availableAt
                          .map(item => typeof item === 'string' ? item : item._id)
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
    </div>
  );
};

export default UpdateMenu;



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