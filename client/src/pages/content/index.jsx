import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaPlus, FaEdit, FaTrash, FaImage, FaEye, FaTimes } from "react-icons/fa";
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
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Upcoming</span>;
    } else if (now > end) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-600">Expired</span>;
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Active</span>;
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
    <div className="flex flex-col">
      <MessageAlert message={alertMsg} type="success" />

      {/* Header */}
      <div className="flex justify-between items-center px-6 py-3 my-3">
        <h1 className="text-xl text-green-900 font-semibold">
          Content Management
        </h1>
        <Link
          to="/admin/content-create"
          className="bg-[#005429] text-white px-4 py-2 rounded flex items-center gap-2 text-sm hover:bg-[#003d1f] transition-colors"
        >
          <FaPlus /> Tambah Content
        </Link>
      </div>

      {/* Filter */}
      <div className="px-6 mb-4">
        <div className="flex gap-2">
          {["all", "banner", "event", "promo"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 text-sm rounded transition-colors ${filterType === type
                ? "bg-[#005429] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              {type === "all" ? "Semua" : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <main className="flex-1 px-6">
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full text-sm text-gray-900">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Type</th>
                <th className="px-6 py-3 text-left font-semibold">Deskripsi</th>
                <th className="px-6 py-3 text-left font-semibold">Gambar</th>
                <th className="px-6 py-3 text-left font-semibold">Periode</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContents.length > 0 ? (
                filteredContents.map((content) => (
                  <tr
                    key={content._id}
                    className="hover:bg-gray-50 transition-colors border-b"
                  >
                    <td className="px-6 py-3">
                      <span className="px-2 py-1 text-xs rounded-md bg-purple-50 text-purple-700">
                        {content.type}
                      </span>
                    </td>
                    <td className="px-6 py-3 max-w-xs truncate">
                      {content.description}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handlePreview(content.imageUrls)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        <FaImage />
                        <span>{content.imageUrls?.length || 0} gambar</span>
                      </button>
                    </td>
                    <td className="px-6 py-3 text-xs">
                      <div>{new Date(content.startDate).toLocaleDateString("id-ID")}</div>
                      <div className="text-gray-500">s/d</div>
                      <div>{new Date(content.endDate).toLocaleDateString("id-ID")}</div>
                    </td>
                    <td className="px-6 py-3">
                      {getStatusBadge(content.startDate, content.endDate)}
                    </td>
                    <td className="px-6 py-3 text-right flex justify-end gap-3">
                      <Link
                        to={`/admin/content-update/${content._id}`}
                        className="text-gray-500 hover:text-green-900"
                      >
                        <FaEdit />
                      </Link>
                      <button
                        onClick={() => {
                          setDeleteId(content._id);
                          setShowConfirm(true);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8 text-gray-500 text-sm"
                  >
                    Tidak ada data content
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal Konfirmasi Delete */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">Konfirmasi Hapus</h2>
            <p className="text-sm text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus content ini? Aksi ini tidak
              bisa dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview Gambar */}
      {showPreview && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Preview Gambar</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {previewImages.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-64 object-cover rounded border"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentIndex;