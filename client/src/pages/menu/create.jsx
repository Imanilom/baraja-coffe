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
import { FaChevronRight, FaShoppingBag, FaBell, FaUser, FaImage, FaCamera, FaInfoCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CreateMenu = () => {
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isOptional, setIsOptional] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [image, setImage] = useState(undefined);
  const [imagePercent, setImagePercent] = useState(0);
  const [imageError, setImageError] = useState(false);
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
      }
    };

    const fetchOutlets = async () => {
      try {
        const response = await axios.get("/api/outlet/");
        setOutlets(response.data || []);
      } catch (error) {
        console.error("Error fetching outlets:", error);
      }
    };

    const fetchRawMaterial = async () => {
      try {
        const response = await axios.get("/api/storage/raw-material");
        setRawMaterials(response.data.data || []);
      } catch (error) {
        console.error("Error fetching raw materials:", error);
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
            <span
              onClick={() => setShowModal(true)}
              className="block border border-green-600 text-green-600 text-sm px-3 py-1.5 rounded cursor-pointer"
            >
              Batal
            </span>
            <button
              type="submit"
              className="block bg-green-600 text-white text-sm px-3 py-1.5 rounded"
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
        <div className="p-6">
          {/* Header */}
          <button
            onClick={() => setIsOptional(!isOptional)}
            className="w-full text-left px-6 py-4 bg-slate-100 hover:bg-slate-200 transition font-medium flex justify-between items-center"
          >
            <span>Pengaturan Lanjutan (Opsional)</span>
            <span>{isOptional ? "−" : "+"}</span>
          </button>

          {/* Body */}
          {isOptional && (
            <div className="bg-slate-50 px-6 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="row">
                  <div className="flex items-center space-x-2">
                    <span>Jual Di POS</span>
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
                <div className="row">
                  <div className="flex items-center space-x-2">
                    <span className="uppercase">Jual Di Pawoon Order</span>
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
                <div className="row">
                  <div className="flex items-center space-x-2">
                    <span className="uppercase">Jual Di Digital Pawoon</span>
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
                <div className="row">
                  <div className="flex items-center space-x-2">
                    <span className="uppercase">Kelola Stok</span>
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
                <div className="row">
                  <div className="flex items-center space-x-2">
                    <span className="uppercase">Penjualan berdasarkan stok</span>
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
                <div className="row w-full">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="" className="uppercase">deskripsi produk</label>
                    <FaInfoCircle />
                  </div>
                  <textarea name="" id="" className="w-full h-[120px] block border rounded"></textarea>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="row">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="" className="uppercase">Pajak</label>
                    <FaInfoCircle />
                  </div>
                  <select name="" id="" className="block border w-full p-2 rounded">
                    <option value="">Mengikuti pajak outlet</option>
                    <option value="">Tidak ada pajak</option>
                  </select>
                </div>
              </div>
              <div className="w-full">
                <span className="p-3 uppercase bg-gray-500">detail produk</span>
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