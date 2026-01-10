import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from 'axios';
import { FaBox, FaTag, FaBell, FaUser, FaShoppingBag, FaLayerGroup, FaSquare, FaInfo, FaSearch, FaPencilAlt, FaTrash, FaChevronRight, FaPlus } from 'react-icons/fa';
import Paginated from '../../../components/paginated';
import MessageAlert from '../../../components/messageAlert';
import ConfirmModal from "../../../components/modal/confirmmodal";
import CategorySkeleton from "./component/skeleton/skeleton";

const CategoryIndex = () => {
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState(null);
  const [tempSearch, setTempSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // State untuk alert message
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success");
  const [alertKey, setAlertKey] = useState(0);

  // ✅ FIX: Sesuaikan dengan backend response baru
  const fetchData = async (type) => {
    setLoading(true);
    try {
      // Backend response: { success: true, data: categories }
      const categoryResponse = await axios.get('/api/menu/categories');

      // ✅ Ambil data langsung dari response.data.data (array categories)
      const categoriesData = categoryResponse.data.data || [];

      setCategories(categoriesData);
      setFilteredCategories(categoriesData);

    } catch (err) {
      setError('Failed to fetch categories');
      setCategories([]);
      setFilteredCategories([]); // ✅ PENTING: Set ini juga!
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Check for success/error message from location state
  useEffect(() => {
    if (location.state?.success) {
      setAlertMessage(location.state.success);
      setAlertType("success");
      setAlertKey(prev => prev + 1);
    } else if (location.state?.error) {
      setAlertMessage(location.state.error);
      setAlertType("error");
      setAlertKey(prev => prev + 1);
    }
  }, [location.state]);

  const formatDateTime = (datetime) => {
    const date = new Date(datetime);
    const pad = (n) => n.toString().padStart(2, "0");
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const openDeleteModal = (categoryId, categoryName) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(categoryName);
    setShowModal(true);
  };

  useEffect(() => {
    if (!Array.isArray(categories)) {
      setFilteredCategories([]);
      return;
    }

    const filtered = categories.filter((category) =>
      (category?.name || '').toLowerCase().includes(tempSearch.toLowerCase())
    );

    setFilteredCategories(filtered);
    setCurrentPage(1);
  }, [tempSearch, categories]);

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`/api/menu/categories/${selectedCategoryId}`);

      // Update state
      setCategories((prev) => prev.filter((c) => c._id !== selectedCategoryId));
      setFilteredCategories((prev) => prev.filter((c) => c._id !== selectedCategoryId));

      // Show success message
      setAlertMessage(`Kategori "${selectedCategoryName}" berhasil dihapus`);
      setAlertType("success");
      setAlertKey(prev => prev + 1);

      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Error deleting category:', err);

      // Show error message
      setAlertMessage('Gagal menghapus kategori. Silakan coba lagi.');
      setAlertType("error");
      setAlertKey(prev => prev + 1);
    } finally {
      setShowModal(false);
      setSelectedCategoryId(null);
      setSelectedCategoryName(null);
    }
  };

  // ✅ FIX: Tambahkan guard untuk undefined
  const paginatedData = useMemo(() => {
    if (!filteredCategories || !Array.isArray(filteredCategories)) {
      return [];
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredCategories.slice(startIndex, endIndex);
  }, [filteredCategories, currentPage]);

  // ✅ FIX: Guard untuk totalPages
  const totalPages = Math.ceil((filteredCategories?.length || 0) / ITEMS_PER_PAGE);

  if (loading) return <CategorySkeleton />

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Terjadi Kesalahan</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#005429] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#003d1f] transition-colors"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Alert Message */}
      <MessageAlert
        key={alertKey}
        type={alertType}
        message={alertMessage}
      />

      {/* Main Content */}
      <div className="mx-auto px-6 py-6">
        {/* Stats Card */}
        <div className="bg-gradient-to-br from-[#005429] to-[#003d1f] rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100 mb-1">Total Kategori</p>
              <h2 className="text-4xl font-bold">{filteredCategories?.length || 0}</h2>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-4">
              <FaLayerGroup size={32} />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex justify-between">
          <div className="relative w-1/2">
            <FaSearch className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kategori..."
              value={tempSearch}
              onChange={(e) => setTempSearch(e.target.value)}
              className="w-full text-sm border border-gray-300 py-3 pl-11 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005429] focus:border-transparent transition-all"
            />
          </div>

          {/* Action Button */}
          <Link
            to="/admin/category-create"
            state={{ returnTab: 'category' }}
            className="bg-[#005429] text-white px-5 py-2.5 rounded-lg inline-flex items-center gap-2 font-medium hover:bg-[#003d1f] transition-colors shadow-sm"
          >
            <FaPlus size={14} />
            <span>Tambah Kategori</span>
          </Link>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Waktu Submit
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Nama Kategori
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Jumlah Produk
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedData.length > 0 ? (
                  paginatedData.map((category) => {
                    // ✅ Guard untuk category undefined
                    if (!category || !category.name) return null;

                    const key = category.name.toLowerCase().trim();

                    return (
                      <tr key={category._id || Math.random()} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDateTime(category.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-[#005429] bg-opacity-10 rounded-lg flex items-center justify-center">
                              <FaTag className="text-[#005429]" size={16} />
                            </div>
                            <span className="ml-3 text-sm font-medium text-gray-900">{category._id} - {category.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {category.productCount} produk
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Link
                              to={`/admin/category-update/${category._id}`}
                              state={{ returnTab: 'category' }}
                              className="p-2.5 bg-[#005429] text-white rounded-lg hover:bg-[#003d1f] transition-colors"
                              title="Edit"
                            >
                              <FaPencilAlt size={14} />
                            </Link>
                            <button
                              onClick={() => openDeleteModal(category._id, category.name)}
                              className="p-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              title="Hapus"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="bg-gray-100 rounded-full p-6 mb-4">
                          <FaSearch className="text-gray-400" size={32} />
                        </div>
                        <p className="text-gray-500 font-medium">Tidak ada kategori ditemukan</p>
                        <p className="text-gray-400 text-sm mt-1">Coba ubah kata kunci pencarian Anda</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Paginated
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Kategori"
        message={`Apakah Anda yakin ingin menghapus kategori "${selectedCategoryName}"? Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  );
};

export default CategoryIndex;