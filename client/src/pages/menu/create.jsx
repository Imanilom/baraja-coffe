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

const CreateMenu = () => {
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isOptional, setIsOptional] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [image, setImage] = useState(undefined);
  const [imagePercent, setImagePercent] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: [],
    imageURL: "",
    toppings: [],
    addons: [],
    rawMaterials: [],
    availableAt: "",
  });

  const [categories, setCategories] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [rawMaterials, setRawMaterials] = useState([]);

  // State untuk pemilihan dan pencarian
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchTermCategories, setSearchTermCategories] = useState('');

  const [outlets, setOutlets] = useState([]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.category-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  useEffect(() => {
    setLoading(true);
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/menu/categories");
        const fetchedCategories = response.data.data || [];
        setCategories(fetchedCategories);

        // mapping id -> name
        const map = {};
        fetchedCategories.forEach(cat => {
          map[cat._id] = cat.name;
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
        const response = await axios.get("/api/outlet/");
        setOutlets(response.data || []);
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

    fetchCategories();
    fetchOutlets();
    fetchRawMaterial();
  }, []);

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
  // const handleAddCategory = (categoryId) => {
  //   const categoryName = categoryMap[categoryId];
  //   if (!formData.category.includes(categoryName)) {
  //     const newSelected = [...selectedCategories, categoryId];
  //     const newCategoryNames = [...formData.category, categoryName];

  //     setSelectedCategories(newSelected);
  //     setFormData((prev) => ({
  //       ...prev,
  //       category: newCategoryNames,
  //     }));

  //     setSearchTermCategories("");
  //   }
  // };

  const handleAddCategory = (categoryId) => {
    const categoryName = categoryMap[categoryId];

    setSelectedCategories([categoryId]);
    setFormData((prev) => ({
      ...prev,
      category: [categoryName],
    }));
    setSearchTermCategories(categoryName); // tampilkan namanya di input
    setShowDropdown(false);
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

  const visibleCategories = searchTermCategories
    ? searchResultsCategories
    : categories.filter(cat => !selectedCategories.includes(cat._id));

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
      // })) || '',
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
      // })) || '',
      // rawMaterials: selectedRawMaterials.map((materialId) => ({
      //   materialId,
      //   quantityRequired: 0.2
      // })) || '',
    };

    try {
      const response = await axios.post("/api/menu/menu-items", formDataToSubmit);
      navigate("/admin/menu");
    } catch (error) {
      console.error("Error creating menu item:", error);
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
            <Link
              to="/admin/menu-create"
              className="text-gray-400 inline-block"
            >
              Tambah Menu
            </Link>
          </div>
          <div className="flex space-x-2">
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
                />
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
              <div className="">
                <label className="my-2.5 text-xs block font-medium">KATEGORI</label>
                {/* <div className="flex flex-wrap gap-2 mb-4">
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
                </div> */}

                <div className="relative category-dropdown">
                  <input
                    type="text"
                    // value={searchTermCategories}
                    value={searchTermCategories}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchTermCategories(value);

                      // Jika input dikosongkan, reset kategori
                      if (value === '') {
                        setSelectedCategories([]);
                        setFormData((prev) => ({
                          ...prev,
                          category: [],
                        }));
                      }
                    }}
                    onFocus={() => setShowDropdown(true)} // tampilkan saat diklik
                    placeholder="Cari kategori..."
                    className="w-full py-2 px-3 border rounded-lg"
                  />

                  {showDropdown && visibleCategories.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border rounded mt-1 shadow-lg max-h-60 overflow-y-auto">
                      {visibleCategories.map(category => (
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
            <div className="">
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


                {/* Background Overlay */}
                {isOpen && (
                  <div
                    className="fixed inset-0 bg-black bg-opacity-30 z-40"
                    onClick={() => setIsOpen(false)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-50">
          {/* Header */}
          <button
            onClick={() => setIsOptional(!isOptional)}
            className="w-full flex text-left px-[20px] py-[15px] bg-slate-100 hover:bg-slate-200 transition font-medium items-center space-x-2 shadow-lg"
          >
            <span>{isOptional ? <FaChevronDown /> : <FaChevronRight />}</span>
            <span className="text-[14px]">Pengaturan Lanjutan (Opsional)</span>
          </button>

          {/* Body */}
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

        </div>
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
        <div className="fixed bottom-0 right-0 w-full max-w-screen-lg bg-white border-t px-4 py-3 flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateMenu;