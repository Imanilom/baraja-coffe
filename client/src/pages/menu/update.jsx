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
    availableAt: [],
    workstation: ""
  });


  const [isChecked, setIsChecked] = useState(false);
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
                  value={formData.category.name || ""}
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
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>

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
              <ToppingForm toppings={formData.toppings} setToppings={setToppings} />
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
                      {console.log(formData.availableAt.includes(outlet._id))}
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
                    checked={formData.workstation === "kitchen" && isChecked}
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