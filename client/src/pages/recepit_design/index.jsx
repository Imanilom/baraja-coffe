import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { 
  FaReceipt, FaStoreAlt, FaBullseye, FaClipboardList, 
  FaUser, FaBell, FaCheck, FaTimes, FaImage, FaUpload,
  FaTrash
} from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from "../../firebase"; // Adjust the path to your firebase config

const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif"];

const ReceiptDesign = () => {
  const [outlets, setOutlets] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [applyToAll, setApplyToAll] = useState(false);
  const [loading, setLoading] = useState({
    outlets: false,
    settings: false,
    submit: false
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [noteImage, setNoteImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({
    logo: 0,
    note: 0
  });
  const [uploadError, setUploadError] = useState({
    logo: false,
    note: false
  });
  const navigate = useNavigate();
  const logoRef = useRef(null);
  const noteRef = useRef(null);

  const defaultFormData = {
    logoUrl: "",
    showDate: true,
    showTime: true,
    outletName: "",
    outletAddress: "",
    outletPhone: "",
    footerNote: "Password_Wifi : ramadhandibaraja Yuk,jadi saksi pelestarian budaya di Amphitheater!Cek jadwalnya di IG & TikTok kami!",
    thanksMessage: "Terima kasih atas kunjungan Anda!",
    socialMedia: {
      instagram: "barajacoffee",
      tiktok: "barajacoffee.id",
      showInstagram: true,
      showTiktok: false,
    },
    showVoucherCode: true,
    showPoweredBy: false,
    noteImageUrl: "",
    customFields: [],
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [customFieldInput, setCustomFieldInput] = useState({
    label: "",
    value: ""
  });

  // Firebase storage
  const storage = getStorage(app);

  // Handle file upload to Firebase
  const handleFileUpload = async (image, type) => {
    try {
      setUploadError(prev => ({ ...prev, [type]: false }));
      
      // Validate image
      if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
        toast.error("Format gambar tidak didukung. Gunakan JPEG, PNG, atau GIF.");
        return;
      }

      if (image.size > MAX_IMAGE_SIZE) {
        toast.error(`Ukuran file maksimal ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
        return;
      }

      const fileName = `receipt-${type}-${new Date().getTime()}-${image.name}`;
      const storageRef = ref(storage, `receipts/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, image);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(prev => ({ ...prev, [type]: Math.round(progress) }));
        },
        (error) => {
          console.error(`Error uploading ${type} image:`, error);
          setUploadError(prev => ({ ...prev, [type]: true }));
          toast.error(`Gagal mengunggah gambar ${type}`);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          if (type === "logo") {
            setPreviewImage(downloadURL);
            setFormData(prev => ({ ...prev, logoUrl: downloadURL }));
          } else {
            setNoteImage(downloadURL);
            setFormData(prev => ({ ...prev, noteImageUrl: downloadURL }));
          }
          
          toast.success(`Gambar ${type} berhasil diunggah`);
          setUploadProgress(prev => ({ ...prev, [type]: 0 }));
        }
      );
    } catch (error) {
      console.error(`Error in ${type} upload:`, error);
      setUploadError(prev => ({ ...prev, [type]: true }));
      toast.error(`Gagal mengunggah gambar ${type}`);
    }
  };

  // Image upload handlers
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file, "logo");
  };

  const handleNoteUpload = (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file, "note");
  };

  // Fetch outlets and receipt settings
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, outlets: true }));
      
      const [outletsRes] = await Promise.all([
        axios.get("/api/outlet"),
      ]);
      
      const outletsData = outletsRes.data?.data || [];
      setOutlets(outletsData);

      if (outletsData.length > 0) {
        const firstOutlet = outletsData[0];
        setSelectedOutlet(firstOutlet._id);
        await fetchReceiptSetting(firstOutlet._id, firstOutlet);
      }
    } catch (err) {
      console.error("Failed to load initial data:", err);
      toast.error("Gagal memuat data outlet dan pengaturan struk");
    } finally {
      setLoading(prev => ({ ...prev, outlets: false }));
    }
  }, []);

  const fetchReceiptSetting = async (outletId, outletData = null) => {
    try {
      setLoading(prev => ({ ...prev, settings: true }));
      
      const res = await axios.get(`/api/receipt-settings/${outletId}`);
      const data = res.data;

      const mergedData = {
        ...defaultFormData,
        ...data,
        socialMedia: {
          ...defaultFormData.socialMedia,
          ...(data.socialMedia || {})
        },
        outletName: data.outletName || outletData?.name || "",
        outletAddress: data.outletAddress || outletData?.address || "",
        outletPhone: data.outletPhone || outletData?.phone || "",
      };

      setFormData(mergedData);
      setPreviewImage(mergedData.logoUrl || null);
      setNoteImage(mergedData.noteImageUrl || null);
    } catch (err) {
      console.warn(`Receipt settings not found for outlet ${outletId}, using defaults.`);
      
      if (outletData) {
        setFormData(prev => ({
          ...prev,
          outletName: outletData.name,
          outletAddress: outletData.address,
          outletPhone: outletData.phone,
        }));
      }
    } finally {
      setLoading(prev => ({ ...prev, settings: false }));
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (selectedOutlet && !applyToAll) {
      const outlet = outlets.find(o => o._id === selectedOutlet);
      if (outlet) {
        fetchReceiptSetting(selectedOutlet, outlet);
      }
    }
  }, [selectedOutlet, applyToAll]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const isCheckbox = type === "checkbox";

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: isCheckbox ? checked : value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: isCheckbox ? checked : value,
      }));
    }
  };

  // Handle custom field changes
  const handleCustomFieldChange = (e) => {
    const { name, value } = e.target;
    setCustomFieldInput(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add custom field
  const addCustomField = () => {
    if (!customFieldInput.label || !customFieldInput.value) {
      toast.warn("Label dan value harus diisi");
      return;
    }

    setFormData(prev => ({
      ...prev,
      customFields: [
        ...prev.customFields,
        {
          label: customFieldInput.label,
          value: customFieldInput.value
        }
      ]
    }));

    setCustomFieldInput({ label: "", value: "" });
  };

  // Remove custom field
  const removeCustomField = (index) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index)
    }));
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedOutlet && !applyToAll) {
      toast.warn("Pilih outlet terlebih dahulu");
      return;
    }

    try {
      setLoading(prev => ({ ...prev, submit: true }));
      
      const payload = {
        ...formData,
        outlet: selectedOutlet,
        applyToAll,
      };

      await axios.post("/api/receipt-settings", payload);
      toast.success("✅ Pengaturan struk berhasil disimpan!");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error(`❌ Gagal menyimpan: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const currentOutlet = outlets.find(o => o._id === selectedOutlet);

  return (
    <div className="overflow-y-auto pb-[100px] bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="flex justify-end px-3 items-center py-4 space-x-2 border-b bg-white sticky top-0 z-10">
        <FaBell size={23} className="text-gray-400" />
        <span className="text-[14px]">Hi Baraja</span>
        <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
          <FaUser size={30} />
        </Link>
      </header>

      {/* Breadcrumb & Nav */}
      <div className="px-3 py-2 flex justify-between items-center border-b bg-white sticky top-16 z-10">
        <div className="flex items-center space-x-2">
          <FaReceipt size={21} className="text-gray-500" />
          <p className="text-[15px] text-gray-500">Desain Struk</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading.submit || uploadProgress.logo > 0 || uploadProgress.note > 0}
          className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded hover:bg-green-800 disabled:opacity-70 flex items-center"
        >
          {loading.submit ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Menyimpan...
            </>
          ) : (
            "Simpan"
          )}
        </button>
      </div>

      {/* Navigation Tabs */}
      <nav className="px-[15px] mt-[15px]">
        <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-4 bg-white rounded-t-lg overflow-hidden">
          <button className="bg-white border-b-2 border-b-white hover:border-b-[#005429] transition-colors">
            <Link className="flex justify-between items-center p-4" to="/admin/outlet">
              <div className="flex space-x-4">
                <FaStoreAlt size={24} className="text-gray-400" />
                <h2 className="text-gray-400 ml-2 text-sm">Outlet</h2>
              </div>
              <div className="text-sm text-gray-400">({outlets.length})</div>
            </Link>
          </button>
          <button className="bg-white border-b-2 border-b-white hover:border-b-[#005429] transition-colors">
            <Link className="flex justify-between items-center border-l border-l-gray-200 p-4" to="/admin/tax-and-service">
              <div className="flex space-x-4">
                <FaClipboardList size={24} className="text-gray-400" />
                <h2 className="text-gray-400 ml-2 text-sm">Pajak & Service</h2>
              </div>
            </Link>
          </button>
          <button className="bg-white border-b-2 border-b-white hover:border-b-[#005429] transition-colors">
            <Link className="flex justify-between items-center border-l border-l-gray-200 p-4" to="/admin/target-sales">
              <div className="flex space-x-4">
                <FaBullseye size={24} className="text-gray-400" />
                <h2 className="text-gray-400 ml-2 text-sm">Target Penjualan</h2>
              </div>
            </Link>
          </button>
          <div className="bg-white border-b-2 border-b-[#005429]">
            <div className="flex justify-between items-center border-l border-l-gray-200 p-4">
              <div className="flex space-x-4">
                <FaReceipt size={24} className="text-[#005429]" />
                <h2 className="text-[#005429] ml-2 text-sm">Desain Struk</h2>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-[15px] grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Column: Form Input */}
        <div className="lg:col-span-7 bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-[14px] font-semibold mb-2">PENGATURAN DESAIN STRUK</h4>
          <p className="text-[14px] text-gray-600 mb-4">
            Atur logo, informasi outlet, dan sosial media yang akan muncul di struk.
          </p>

          {/* Outlet Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Pilih Outlet</label>
            <select
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm disabled:opacity-70 disabled:bg-gray-100"
              disabled={applyToAll || loading.outlets}
            >
              {loading.outlets ? (
                <option>Memuat outlet...</option>
              ) : (
                outlets.map(outlet => (
                  <option key={outlet._id} value={outlet._id}>
                    {outlet.name}
                  </option>
                ))
              )}
            </select>
            <label className="flex items-center mt-2 text-sm">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="mr-2"
                disabled={loading.outlets}
              />
              Berlaku untuk semua outlet
            </label>
          </div>

          {/* Logo Upload */}
          <div className="mb-6">
            <h4 className="text-[14px] font-semibold mb-2 uppercase">Logo Struk</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
              <div className="md:col-span-1">
                {previewImage ? (
                  <div className="relative">
                    <img 
                      src={previewImage} 
                      alt="Logo" 
                      className="w-full h-auto rounded border border-gray-200" 
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImage(null);
                        setFormData(prev => ({ ...prev, logoUrl: "" }));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ) : (
                  <div 
                    className="bg-gray-100 w-full h-20 flex items-center justify-center rounded border border-dashed border-gray-300 cursor-pointer"
                    onClick={() => logoRef.current.click()}
                  >
                    {uploadProgress.logo > 0 ? (
                      <div className="text-center">
                        <div className="text-xs mb-1">Uploading: {uploadProgress.logo}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-[#005429] h-1.5 rounded-full" 
                            style={{ width: `${uploadProgress.logo}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : uploadError.logo ? (
                      <span className="text-red-500 text-xs">Upload failed</span>
                    ) : (
                      <span className="text-gray-500 text-xs">No Logo</span>
                    )}
                  </div>
                )}
              </div>
              <div className="md:col-span-3">
                <p className="text-xs text-gray-500 mb-2">Format: JPEG/PNG/GIF, Maksimal 1MB</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => logoRef.current.click()}
                    className="py-[7px] px-[15px] border rounded text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors"
                  >
                    <FaUpload size={12} />
                    {previewImage ? "Ganti Logo" : "Unggah Logo"}
                  </button>
                  <input
                    type="file"
                    ref={logoRef}
                    hidden
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Outlet Information */}
          <div className="mb-6">
            <h4 className="text-[14px] font-semibold mb-2 uppercase">Informasi Outlet</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm mb-1">Nama Outlet</label>
                <input
                  type="text"
                  name="outletName"
                  value={formData.outletName}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Nama outlet"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Telepon</label>
                <input
                  type="text"
                  name="outletPhone"
                  value={formData.outletPhone}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Nomor telepon"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Alamat</label>
              <textarea
                name="outletAddress"
                value={formData.outletAddress}
                onChange={handleChange}
                rows="3"
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Alamat lengkap outlet"
              />
            </div>
          </div>

          {/* Date & Time Display */}
          <div className="mb-6">
            <h4 className="text-[14px] font-semibold mb-2 uppercase">Item Pembelian</h4>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                name="showDate" 
                checked={formData.showDate} 
                onChange={handleChange} 
                id="showDate" 
                className="rounded text-[#005429] focus:ring-[#005429]"
              />
              <label htmlFor="showDate" className="text-sm">Tampilkan Tanggal</label>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <input 
                type="checkbox" 
                name="showTime" 
                checked={formData.showTime} 
                onChange={handleChange} 
                id="showTime" 
                className="rounded text-[#005429] focus:ring-[#005429]"
              />
              <label htmlFor="showTime" className="text-sm">Tampilkan Waktu</label>
            </div>
          </div>

          {/* Social Media */}
          <div className="mb-6">
            <h4 className="text-[14px] font-semibold mb-2 uppercase">Sosial Media</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img 
                  src="https://dashboard.pawoon.com/assets/images/ic-instagram.png" 
                  alt="Instagram" 
                  className="w-5 h-5" 
                />
                <div className="flex-1">
                  <input
                    type="text"
                    name="socialMedia.instagram"
                    value={formData.socialMedia.instagram}
                    onChange={handleChange}
                    placeholder="username"
                    className="w-full border rounded px-3 py-1 text-sm"
                  />
                </div>
                <label className="flex items-center text-sm gap-2">
                  <input
                    type="checkbox"
                    name="socialMedia.showInstagram"
                    checked={formData.socialMedia.showInstagram}
                    onChange={handleChange}
                    className="rounded text-[#005429] focus:ring-[#005429]"
                  />
                  Tampilkan
                </label>
              </div>
              <div className="flex items-center gap-3">
                <img 
                  src="https://dashboard.pawoon.com/assets/images/ic-tiktok.png" 
                  alt="TikTok" 
                  className="w-5 h-5" 
                />
                <div className="flex-1">
                  <input
                    type="text"
                    name="socialMedia.tiktok"
                    value={formData.socialMedia.tiktok}
                    onChange={handleChange}
                    placeholder="username"
                    className="w-full border rounded px-3 py-1 text-sm"
                  />
                </div>
                <label className="flex items-center text-sm gap-2">
                  <input
                    type="checkbox"
                    name="socialMedia.showTiktok"
                    checked={formData.socialMedia.showTiktok}
                    onChange={handleChange}
                    className="rounded text-[#005429] focus:ring-[#005429]"
                  />
                  Tampilkan
                </label>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mb-6">
            <h4 className="text-[14px] font-semibold mb-2 uppercase">Catatan Footer</h4>
            <textarea
              name="footerNote"
              value={formData.footerNote}
              onChange={handleChange}
              rows="3"
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Pesan yang akan ditampilkan di footer struk"
            />
          </div>

          {/* Note Image */}
          <div className="mb-6">
            <h4 className="text-[14px] font-semibold mb-2 uppercase">Gambar Catatan</h4>
            {noteImage ? (
              <div className="relative mb-2">
                <img 
                  src={noteImage} 
                  alt="Note" 
                  className="w-full max-h-32 object-contain border border-gray-200 rounded" 
                />
                <button
                  type="button"
                  onClick={() => {
                    setNoteImage(null);
                    setFormData(prev => ({ ...prev, noteImageUrl: "" }));
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            ) : (
              <div 
                className="bg-gray-100 w-full h-20 flex items-center justify-center rounded border border-dashed border-gray-300 cursor-pointer mb-2"
                onClick={() => noteRef.current.click()}
              >
                {uploadProgress.note > 0 ? (
                  <div className="text-center">
                    <div className="text-xs mb-1">Uploading: {uploadProgress.note}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-[#005429] h-1.5 rounded-full" 
                        style={{ width: `${uploadProgress.note}%` }}
                      ></div>
                    </div>
                  </div>
                ) : uploadError.note ? (
                  <span className="text-red-500 text-xs">Upload failed</span>
                ) : (
                  <span className="text-gray-500 text-xs">No Image</span>
                )}
              </div>
            )}
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => noteRef.current.click()}
                className="py-[7px] px-[15px] border rounded text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <FaUpload size={12} />
                {noteImage ? "Ganti Gambar" : "Unggah Gambar"}
              </button>
              <input
                type="file"
                ref={noteRef}
                hidden
                accept="image/*"
                onChange={handleNoteUpload}
              />
            </div>
          </div>

          {/* Custom Fields */}
          <div className="mb-6">
            <h4 className="text-[14px] font-semibold mb-2 uppercase">Field Kustom</h4>
            <div className="space-y-2 mb-3">
              {formData.customFields.map((field, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{field.label}:</span>
                  <span className="text-sm flex-1">{field.value}</span>
                  <button
                    type="button"
                    onClick={() => removeCustomField(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
              <div>
                <label className="block text-sm mb-1">Label</label>
                <input
                  type="text"
                  name="label"
                  value={customFieldInput.label}
                  onChange={handleCustomFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Label field"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Value</label>
                <input
                  type="text"
                  name="value"
                  value={customFieldInput.value}
                  onChange={handleCustomFieldChange}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Value field"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addCustomField}
              className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded hover:bg-green-800"
            >
              Tambah Field
            </button>
          </div>

          {/* Additional Options */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="showVoucherCode"
                checked={formData.showVoucherCode}
                onChange={handleChange}
                id="showVoucherCode"
                className="rounded text-[#005429] focus:ring-[#005429]"
              />
              <label htmlFor="showVoucherCode" className="text-sm">Tampilkan Kode Voucher di Struk</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="showPoweredBy"
                checked={formData.showPoweredBy}
                onChange={handleChange}
                id="showPoweredBy"
                className="rounded text-[#005429] focus:ring-[#005429]"
              />
              <label htmlFor="showPoweredBy" className="text-sm">Tampilkan Powered By</label>
            </div>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-5">
          <div className="bg-white p-4 rounded shadow-md sticky top-4">
            <h4 className="font-semibold text-sm mb-2">Preview Struk</h4>
            <div className="border border-gray-300 p-4 text-xs bg-white font-mono leading-tight">
              {/* Header */}
              <div className="text-center mb-3">
                {previewImage && (
                  <img 
                    src={previewImage} 
                    alt="Logo" 
                    className="h-12 mx-auto mb-2 object-contain" 
                  />
                )}
                <strong className="text-sm">{formData.outletName || "Nama Outlet"}</strong>
                <div className="text-xs">{formData.outletAddress || "Alamat Outlet"}</div>
                <div className="text-xs">{formData.outletPhone || "Telepon"}</div>
              </div>

              {/* Date & Time */}
              {(formData.showDate || formData.showTime) && (
                <div className="mb-2 text-xs">
                  {formData.showDate && <div>Tanggal: {new Date().toLocaleDateString('id-ID')}</div>}
                  {formData.showTime && <div>Waktu: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>}
                  <div>Kasir: Admin</div>
                </div>
              )}

              {/* Transaction Items */}
              <hr className="my-2 border-dashed border-gray-400" />
              <div className="space-y-1 text-left">
                <div className="flex justify-between">
                  <span>Es Teh Manis x2</span>
                  <span>8,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Martabak x1</span>
                  <span>20,000</span>
                </div>
              </div>
              <hr className="my-2 border-dashed border-gray-400" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>28,000</span>
              </div>

              {/* Custom Fields */}
              {formData.customFields.length > 0 && (
                <>
                  <hr className="my-2 border-dashed border-gray-400" />
                  <div className="space-y-1">
                    {formData.customFields.map((field, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{field.label}</span>
                        <span>{field.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Footer */}
              <div className="mt-3 text-center text-xs">
                {formData.footerNote.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>

              {/* Voucher Code */}
              {formData.showVoucherCode && (
                <div className="mt-2 text-center text-xs bg-gray-100 p-2 rounded">
                  <div>VOUCHER: ABC123XYZ</div>
                  <div>Tukarkan di kasir!</div>
                </div>
              )}

              {/* Social Media */}
              {(formData.socialMedia.showInstagram || formData.socialMedia.showTiktok) && (
                <div className="mt-2 text-center text-xs space-y-1">
                  {formData.socialMedia.showInstagram && formData.socialMedia.instagram && (
                    <div className="flex items-center justify-center gap-1">
                      <img 
                        src="https://dashboard.pawoon.com/assets/images/ic-instagram.png" 
                        alt="Instagram" 
                        className="w-3 h-3" 
                      />
                      @{formData.socialMedia.instagram}
                    </div>
                  )}
                  {formData.socialMedia.showTiktok && formData.socialMedia.tiktok && (
                    <div className="flex items-center justify-center gap-1">
                      <img 
                        src="https://dashboard.pawoon.com/assets/images/ic-tiktok.png" 
                        alt="TikTok" 
                        className="w-3 h-3" 
                      />
                      @{formData.socialMedia.tiktok}
                    </div>
                  )}
                </div>
              )}

              {/* Powered By */}
              {formData.showPoweredBy && (
                <div className="mt-3 text-center text-[10px] text-gray-500">
                  Powered by Baraja Coffee
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
        <div className="w-full h-[2px] bg-[#005429]"></div>
      </footer>
    </div>
  );
};

export default ReceiptDesign;