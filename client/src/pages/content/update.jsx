import React, { useState, useRef, useEffect } from "react";
import { getDownloadURL, getStorage, ref, uploadBytesResumable, deleteObject } from "firebase/storage";
import { app } from "../../firebase";
import axios from "axios";
import { FaChevronRight, FaImage, FaTimes, FaUpload, FaTrash } from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import MessageAlert from "../../components/messageAlert";
import { useSelector } from "react-redux";

const UpdateContent = () => {
  const { currentUser } = useSelector((state) => state.user);
  const { id } = useParams(); // untuk edit mode
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [formData, setFormData] = useState({
    type: "banner",
    imageUrls: [],
    description: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  const [images, setImages] = useState([]);
  const [imagePercent, setImagePercent] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [alertMsg, setAlertMsg] = useState("");
  const [previewImages, setPreviewImages] = useState([]);

  const isEditMode = !!id;

  // Fetch content untuk edit
  useEffect(() => {
    if (isEditMode) {
      fetchContent();
    }
  }, [id]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/content/${id}`);
      const content = res.data;
      setFormData({
        type: content.type,
        imageUrls: content.imageUrls || [],
        description: content.description,
        startDate: content.startDate?.split("T")[0] || "",
        endDate: content.endDate?.split("T")[0] || "",
        isActive: content.isActive ?? true,
      });
      setPreviewImages(content.imageUrls || []);
    } catch (error) {
      console.error("Failed to fetch content:", error);
      setAlertMsg("Gagal memuat data content");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Validasi jumlah gambar (max 5)
    if (files.length + formData.imageUrls.length > 5) {
      alert("Maksimal 5 gambar!");
      return;
    }

    // Preview gambar sebelum upload
    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages([...previewImages, ...previews]);
    setImages(files);
    setImagePercent(new Array(files.length).fill(0));
  };

  const handleFileUpload = async () => {
    if (images.length === 0) {
      alert("Pilih gambar terlebih dahulu!");
      return;
    }

    setUploading(true);
    const storage = getStorage(app);
    const uploadPromises = [];

    images.forEach((image, index) => {
      const fileName = `content/${new Date().getTime()}_${image.name}`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, image);

      const promise = new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setImagePercent((prev) => {
              const newPercent = [...prev];
              newPercent[index] = Math.round(progress);
              return newPercent;
            });
          },
          (error) => reject(error),
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });

      uploadPromises.push(promise);
    });

    try {
      const urls = await Promise.all(uploadPromises);
      setFormData((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ...urls],
      }));
      setImages([]);
      setImagePercent([]);
      setAlertMsg("Gambar berhasil diupload!");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload gagal!");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const newImageUrls = formData.imageUrls.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    setFormData({ ...formData, imageUrls: newImageUrls });
    setPreviewImages(newPreviews);
  };

  const validateForm = () => {
    let errors = {};
    if (!formData.type) errors.type = "Type wajib dipilih.";
    if (!formData.description) errors.description = "Deskripsi wajib diisi.";
    if (!formData.startDate) errors.startDate = "Tanggal mulai wajib diisi.";
    if (!formData.endDate) errors.endDate = "Tanggal selesai wajib diisi.";
    if (formData.imageUrls.length === 0) errors.images = "Minimal 1 gambar wajib diupload.";

    // Validasi tanggal
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        errors.endDate = "Tanggal selesai harus lebih besar dari tanggal mulai.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      ...formData,
      createdBy: currentUser._id,
    };

    try {
      if (isEditMode) {
        await axios.put(`/api/content/${id}`, payload);
        setAlertMsg("Content berhasil diupdate!");
      } else {
        await axios.post("/api/content", payload);
        setAlertMsg("Content berhasil dibuat!");
      }

      setTimeout(() => {
        navigate("/admin/content");
      }, 1500);
    } catch (error) {
      console.error("Failed to save content:", error);
      alert(error.response?.data?.message || "Gagal menyimpan content");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-gray-700">
      <MessageAlert message={alertMsg} type="success" />

      <form
        className="max-w-5xl mx-auto mt-6 mb-12 bg-white shadow rounded-lg overflow-hidden"
        onSubmit={handleSubmit}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center text-sm text-gray-500 space-x-2">
            <FaImage />
            <span>Content</span>
            <FaChevronRight />
            <span className="text-[#005429] font-medium">
              {isEditMode ? "Edit Content" : "Tambah Content"}
            </span>
          </div>
          <div className="flex space-x-2">
            <Link
              to="/admin/content"
              className="px-4 py-2 text-sm border border-[#005429] text-[#005429] rounded hover:bg-[#005429] hover:text-white transition"
            >
              Batal
            </Link>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-[#005429] text-white rounded hover:opacity-90"
            >
              {isEditMode ? "Update" : "Simpan"}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Type & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 text-sm focus:ring-1 outline-none focus:ring-[#005429]"
              >
                <option value="banner">Banner</option>
                <option value="event">Event</option>
                <option value="promo">Promo</option>
              </select>
              {formErrors.type && (
                <p className="text-xs text-red-500 mt-1">{formErrors.type}</p>
              )}
            </div>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 accent-[#005429]"
                />
                <span className="ml-2 text-sm text-gray-700">Aktifkan Content</span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Masukkan deskripsi content..."
              className="w-full border rounded px-3 py-2 text-sm focus:ring-1 outline-none focus:ring-[#005429]"
            />
            {formErrors.description && (
              <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 text-sm focus:ring-1 outline-none focus:ring-[#005429]"
              />
              {formErrors.startDate && (
                <p className="text-xs text-red-500 mt-1">{formErrors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Selesai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 text-sm focus:ring-1 outline-none focus:ring-[#005429]"
              />
              {formErrors.endDate && (
                <p className="text-xs text-red-500 mt-1">{formErrors.endDate}</p>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Gambar <span className="text-red-500">*</span>
              <span className="text-xs font-normal text-gray-500 ml-2">
                (Maksimal 5 gambar)
              </span>
            </label>

            {/* Preview uploaded images */}
            {formData.imageUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                {formData.imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              type="file"
              multiple
              accept="image/*"
              ref={fileRef}
              onChange={handleImageChange}
              className="hidden"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current.click()}
                className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center gap-2"
                disabled={formData.imageUrls.length >= 5}
              >
                <FaImage /> Pilih Gambar
              </button>

              {images.length > 0 && (
                <button
                  type="button"
                  onClick={handleFileUpload}
                  disabled={uploading}
                  className="px-4 py-2 bg-[#005429] text-white rounded text-sm hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
                >
                  <FaUpload />
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              )}
            </div>

            {/* Upload progress */}
            {images.length > 0 && (
              <div className="mt-4 space-y-2">
                {images.map((image, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{image.name}</span>
                      <span>{imagePercent[index] || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#005429] h-2 rounded-full transition-all"
                        style={{ width: `${imagePercent[index] || 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formErrors.images && (
              <p className="text-xs text-red-500 mt-1">{formErrors.images}</p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default UpdateContent;