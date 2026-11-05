import { useState, useEffect, useRef } from "react";
import Select from 'react-select';
import axios from '@/lib/axios';
import { Link, useLocation } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ConfirmationModal from "./dialog/confirmmodal";
import ToppingForm from "./component/topping";
import AddonForm from "./component/varian";

const CreateMenu = () => {
  const location = useLocation();

  // Ambil returnPage dari state yang dikirim dari halaman menu
  const returnPage = location.state?.returnPage || 1;
  const [categories, setCategories] = useState([]);
  const MainCategories = ['makanan', 'minuman', 'instan', 'dessert', 'snack', 'event', 'bazar'];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [outlets, setOutlets] = useState([]);
  const [isChecked, setIsChecked] = useState(false);
  const [selectedMainCategory, setSelectedMainCategory] = useState("");
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [compressedImageURL, setCompressedImageURL] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    mainCat: "",
    category: "",
    subCategory: "",
    rawMaterials: [],
    availableAt: [],
    imageURL: "",
  });

  const [toppings, setToppings] = useState([]);
  const [addons, setAddons] = useState([]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi tipe file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP');
      return;
    }

    // Validasi ukuran file (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Ukuran file terlalu besar. Maksimal 5MB');
      return;
    }

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

  // ===== NEW: UPLOAD KE PHP SERVER =====
  const uploadToPHP = async (file) => {
    try {
      setUploading(true);

      // Compress image terlebih dahulu
      const compressedBlob = await compressImage(file);

      // Buat FormData untuk kirim file
      const formData = new FormData();
      formData.append('image', compressedBlob, file.name);
      formData.append('kategori', 'menu'); // kategori untuk organize file

      // Upload ke PHP backend
      const response = await fetch('https://img.barajacoffee.com/api.php', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();

      if (data.success) {
        return data.imageURL;
      } else {
        toast.warning(data.message || 'Gagal upload gambar ke server external. Menu akan dibuat tanpa gambar baru.');
        return "";
      }

    } catch (error) {
      console.error('Error uploading image:', error);
      toast.warning('Gagal upload gambar: ' + (error.message || 'Server image offline') + '. Menu tetap akan dibuat.');
      return "";
    } finally {
      setUploading(false);
    }
  };

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: '#d1d5db',
      minHeight: '34px',
      fontSize: '13px',
      color: '#6b7280',
      boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none',
      '&:hover': {
        borderColor: '#9ca3af',
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#6b7280',
    }),
    input: (provided) => ({
      ...provided,
      color: '#6b7280',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
      fontSize: '13px',
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: '13px',
      color: '#374151',
      backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white',
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
      setCategories(data);
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

    // Validasi kategori utama
    if (!selectedMainCategory) {
      toast.error("Pilih Kategori Utama terlebih dahulu.");
      return;
    }

    // Validasi kategori
    if (!formData.category) {
      toast.error("Pilih Kategori terlebih dahulu.");
      return;
    }

    // Validasi toppings
    if (toppings && toppings.length > 0) {
      for (let i = 0; i < toppings.length; i++) {
        if (!toppings[i].name || !toppings[i].name.trim()) {
          toast.error(`Nama topping ke-${i + 1} tidak boleh kosong.`);
          return;
        }
      }
    }

    // Validasi addons (variasi)
    if (addons && addons.length > 0) {
      for (let i = 0; i < addons.length; i++) {
        const addon = addons[i];
        if (!addon.name || !addon.name.trim()) {
          toast.error(`Nama variasi ke-${i + 1} tidak boleh kosong.`);
          return;
        }
        if (!addon.options || addon.options.length === 0) {
          toast.error(`Variasi "${addon.name}" harus memiliki minimal satu opsi.`);
          return;
        }
        for (let j = 0; j < addon.options.length; j++) {
          const opt = addon.options[j];
          if (!opt.label || !opt.label.trim()) {
            toast.error(`Nama opsi ke-${j + 1} pada variasi "${addon.name}" tidak boleh kosong.`);
            return;
          }
        }
      }
    }

    try {
      let imageURL = formData.imageURL;

      // Upload image ke PHP jika ada
      if (imageFile) {
        const uploadedUrl = await uploadToPHP(imageFile); // Upload ke PHP, dapat URL
        if (uploadedUrl) imageURL = uploadedUrl;
      }

      // Payload untuk database Anda sendiri
      const payload = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        imageURL: imageURL || "", // HANYA URL/LINK gambar yang disimpan
        mainCat: selectedMainCategory,
        category: formData.category,
        subCategory: (formData.subCategory && formData.subCategory !== "") ? formData.subCategory : null,
        availableAt: formData.availableAt,
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

      // Simpan ke database Anda (data + URL gambar)
      await axios.post("/api/menu/menu-items", payload);
      toast.success(`Menu ${formData.name} berhasil dibuat`);
      navigate(`/admin/menu?page=${returnPage}`, { state: { success: `Menu ${formData.name} berhasil dibuat` } });

    } catch (err) {
      console.error("Gagal kirim data:", err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Gagal menyimpan menu. Silakan coba lagi.";
      toast.error(errMsg);
    }
  };

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
            <Link to="/admin/menu">Menu</Link>
            <FaChevronRight />
            <span>Tambah Menu</span>
          </h1>
          <div className="flex items-center gap-3">
            <span
              onClick={() => setIsModalOpen(true)}
              className="block border border-[#005429] text-[#005429] hover:bg-[#005429] hover:text-white text-sm px-3 py-1.5 rounded cursor-pointer"
            >
              Batal
            </span>
            <button
              type="submit"
              disabled={uploading}
              className="block bg-[#005429] text-white text-sm px-3 py-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Simpan'}
            </button>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-2">
            <div className="bg-white p-6 rounded shadow-md text-center space-y-4 w-full max-w-md">
              <p className="text-lg font-semibold">Yakin ingin membatalkan?</p>
              <div className="flex justify-center gap-4 flex-wrap">
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

        <div className="px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 shadow-md p-4 sm:p-6 md:p-12 rounded-lg bg-white">
            <div className="text-green-900 space-y-4">
              <div>
                <label className="text-xs block font-medium after:content-['*'] after:text-red-500 after:text-lg after:ml-1 mb-2.5">
                  NAMA MENU
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full py-2 px-3 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="my-2.5 text-xs block font-medium">
                  MAIN KATEGORI
                </label>
                <Select
                  options={MainCategories.map((cat) => ({
                    label: cat.charAt(0).toUpperCase() + cat.slice(1),
                    value: cat.toLowerCase(),
                  }))}
                  value={
                    MainCategories.find((cat) => cat === selectedMainCategory)
                      ? {
                        label:
                          selectedMainCategory.charAt(0).toUpperCase() +
                          selectedMainCategory.slice(1),
                        value: selectedMainCategory,
                      }
                      : null
                  }
                  onChange={(selectedOption) => {
                    setSelectedMainCategory(selectedOption.value);
                  }}
                  styles={customSelectStyles}
                  placeholder="Pilih kategori utama..."
                />
              </div>

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
                        label:
                          categories.find((cat) => cat._id === formData.category)
                            ?.name || "",
                        value: formData.category,
                      }
                      : null
                  }
                  onChange={(selected) => {
                    setFormData((prev) => ({
                      ...prev,
                      category: selected.value,
                    }));
                  }}
                  styles={customSelectStyles}
                  placeholder="Pilih kategori..."
                  className="mb-2"
                />
              </div>

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

              <div className="py-4 space-y-3">
                <label className="text-xs block font-medium uppercase text-green-950">Gambar Menu</label>
                <div className="flex items-center space-x-4">
                  {compressedImageURL || formData.imageURL ? (
                    <img
                      src={compressedImageURL || formData.imageURL}
                      alt="Preview"
                      className="h-24 w-24 object-cover rounded cursor-pointer border"
                      onClick={() => fileRef.current.click()}
                    />
                  ) : (
                    <div
                      className="h-24 w-24 flex items-center justify-center bg-gray-100 border border-gray-300 rounded cursor-pointer hover:bg-gray-200 transition"
                      onClick={() => fileRef.current.click()}
                    >
                      <span className="text-gray-500 text-2xl">+</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    ref={fileRef}
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileRef.current.click()}
                      className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border text-xs text-gray-700 font-medium rounded-lg transition"
                    >
                      Pilih File Gambar
                    </button>
                    {(compressedImageURL || formData.imageURL) && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setCompressedImageURL(null);
                          setFormData((prev) => ({ ...prev, imageURL: "" }));
                        }}
                        className="text-red-600 text-xs hover:underline text-left font-medium"
                      >
                        Hapus gambar
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[11px] block font-semibold text-gray-500 mb-1.5 uppercase">
                    Atau Paste Link/URL Gambar
                  </label>
                  <input
                    type="text"
                    name="imageURL"
                    placeholder="https://example.com/gambar.jpg"
                    value={formData.imageURL || ""}
                    onChange={(e) => {
                      setImageFile(null);
                      setCompressedImageURL(null);
                      setFormData((prev) => ({ ...prev, imageURL: e.target.value }));
                    }}
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-800"
                  />
                </div>
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

            <div className="text-[14px] text-green-900 space-y-4">
              <ToppingForm toppings={toppings} setToppings={setToppings} />
              <AddonForm addons={addons} setAddons={setAddons} />

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

              <div className="flex justify-between items-center">
                <span>Apakah menu ini berada di dapur?</span>
                <label className="inline-flex items-center cursor-pointer space-x-3">
                  <span className="text-sm font-medium text-gray-900">
                    {isChecked ? "Ya" : "Tidak"}
                  </span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-1 peer-checked:bg-[#005429] relative after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => navigate(`/admin/menu?page=${returnPage}`)}
      />
    </div>
  );
};

export default CreateMenu;