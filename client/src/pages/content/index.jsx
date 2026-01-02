import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaPlus, FaEdit, FaTrash, FaImage, FaEye, FaTimes, FaCalendarAlt, FaFilter } from "react-icons/fa";
import { useSelector } from "react-redux";
import MessageAlert from "../../components/messageAlert";

const ContentIndex = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [alertMsg, setAlertMsg] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/content");
      setContents(response.data);
    } catch (error) {
      console.error("Failed to fetch contents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/content/${deleteId}`);
      setContents((prev) => prev.filter((c) => c._id !== deleteId));
      setAlertMsg("Content berhasil dihapus!");
    } catch (error) {
      console.error("Failed to delete content:", error);
      alert("Gagal menghapus content");
    } finally {
      setShowConfirm(false);
      setDeleteId(null);
    }
  };

  const handlePreview = (images) => {
    setPreviewImages(images);
    setShowPreview(true);
  };

  const filteredContents = contents.filter((content) => {
    if (filterType === "all") return true;
    return content.type === filterType;
  });

  const getStatusBadge = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return (
        <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
          Upcoming
        </span>
      );
    } else if (now > end) {
      return (
        <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">
          Expired
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-200">
          Active
        </span>
      );
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      banner: "bg-purple-50 text-purple-700 border-purple-200",
      event: "bg-blue-50 text-blue-700 border-blue-200",
      promo: "bg-orange-50 text-orange-700 border-orange-200"
    };
    return colors[type] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-[#005429] border-b-[#005429] border-l-transparent border-r-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MessageAlert message={alertMsg} type="success" />

      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <FaImage className="text-[#005429]" />
                Content Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola banner, event, dan promo untuk aplikasi
              </p>
            </div>
            <Link
              to="/admin/content-create"
              className="bg-[#005429] hover:bg-[#003d1f] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-sm hover:shadow-md"
            >
              <FaPlus /> Tambah Content
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Content</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{contents.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FaImage className="text-[#005429] text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Banner</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {contents.filter(c => c.type === 'banner').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FaImage className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Event</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {contents.filter(c => c.type === 'event').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FaCalendarAlt className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Promo</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {contents.filter(c => c.type === 'promo').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <FaImage className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-3">
            <FaFilter className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <div className="flex gap-2">
              {["all", "banner", "event", "promo"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filterType === type
                      ? "bg-[#005429] text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {type === "all" ? "Semua" : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Deskripsi
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Gambar
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Periode
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContents.length > 0 ? (
                  filteredContents.map((content) => (
                    <tr
                      key={content._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 inline-flex text-xs font-semibold rounded-full border ${getTypeColor(content.type)}`}>
                          {content.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900 line-clamp-2">
                            {content.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handlePreview(content.imageUrls)}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <FaImage />
                          <span>{content.imageUrls?.length || 0} gambar</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-2 text-gray-900">
                            <FaCalendarAlt className="text-gray-400" />
                            {new Date(content.startDate).toLocaleDateString("id-ID")}
                          </div>
                          <div className="text-gray-500 pl-5">s/d</div>
                          <div className="flex items-center gap-2 text-gray-900">
                            <FaCalendarAlt className="text-gray-400" />
                            {new Date(content.endDate).toLocaleDateString("id-ID")}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(content.startDate, content.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/content-update/${content._id}`}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <FaEdit size={14} />
                            <span>Ubah</span>
                          </Link>
                          <button
                            onClick={() => {
                              setDeleteId(content._id);
                              setShowConfirm(true);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <FaTrash size={14} />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <FaImage className="text-gray-400 text-3xl" />
                        </div>
                        <p className="text-gray-500 font-medium mb-1">
                          Tidak ada data content
                        </p>
                        <p className="text-sm text-gray-400">
                          Klik tombol 'Tambah Content' untuk membuat content baru
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi Delete */}
      {showConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={() => setShowConfirm(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaTrash className="text-red-600 text-lg" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Konfirmasi Hapus</h2>
              </div>
              <p className="text-sm text-gray-600 mb-6 ml-15">
                Apakah Anda yakin ingin menghapus content ini? Aksi ini tidak
                bisa dibatalkan.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Preview Gambar */}
      {showPreview && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-75 z-40 transition-opacity"
            onClick={() => setShowPreview(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-5 border-b bg-white">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaImage className="text-[#005429]" />
                  Preview Gambar ({previewImages.length})
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes size={24} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {previewImages.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-64 object-cover rounded-lg border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow"
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-xs font-medium">
                        {index + 1} / {previewImages.length}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContentIndex;