import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from '@/lib/axios';
import { FaBox, FaTag, FaBell, FaUser, FaShoppingBag, FaLayerGroup, FaSquare, FaInfo, FaSearch, FaPencilAlt, FaTrash, FaChevronRight, FaPlus } from 'react-icons/fa';
import Paginated from '../../../components/Paginated';
import MessageAlert from '../../../components/MessageAlert';
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
    <div className="w-full">
      {/* Alert Message */}
      <MessageAlert
        key={alertKey}
        type={alertType}
        message={alertMessage}
      />

      {/* Main Content */}
      <div className="mx-auto">
        {/* Stats Card */}
        <div className="bg-gradient-to-br from-[#005429] to-[#003d1f] rounded-2xl shadow-xl p-6 mb-8 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100 mb-2 font-medium tracking-wide uppercase">Total Kategori</p>
              <h2 className="text-4xl font-bold">{filteredCategories?.length || 0}</h2>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-inner border border-white/10">
              <FaLayerGroup size={32} />
            </div>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-1/2 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaSearch className="w-4 h-4 text-gray-400 group-focus-within:text-[#005429] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Cari kategori..."
              value={tempSearch}
              onChange={(e) => setTempSearch(e.target.value)}
              className="w-full text-sm bg-white/40 backdrop-blur-md border border-white/50 py-3 pl-11 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005429]/50 focus:border-[#005429] transition-all shadow-sm placeholder-gray-500 text-gray-800"
            />
          </div>

          <Link
            to="/admin/category-create"
            state={{ returnTab: 'category' }}
            className="bg-[#005429] hover:bg-[#004220] text-white px-6 py-3 rounded-xl inline-flex items-center gap-2 font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <FaPlus size={14} />
            <span>Tambah Kategori</span>
          </Link>
        </div>

        {/* Table Card */}
        <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#005429]/5 border-b border-[#005429]/10">
                <tr>
                  <th className="px-6 py-5 text-left text-xs font-bold text-[#005429] uppercase tracking-wider">
                    Waktu Submit
                  </th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-[#005429] uppercase tracking-wider">
                    Nama Kategori
                  </th>
                  <th className="px-6 py-5 text-right text-xs font-bold text-[#005429] uppercase tracking-wider">
                    Jumlah Produk
                  </th>
                  <th className="px-6 py-5 text-right text-xs font-bold text-[#005429] uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.length > 0 ? (
                  paginatedData.map((category) => {
                    // ✅ Guard untuk category undefined
                    if (!category || !category.name) return null;

                    return (
                      <tr key={category._id || Math.random()} className="hover:bg-white/60 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                          {formatDateTime(category.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-white/80 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300">
                              <FaTag className="text-[#005429]" size={16} />
                            </div>
                            <div className="ml-4">
                              <span className="text-sm font-bold text-gray-800">{category.name}</span>
                              <p className="text-[10px] text-gray-400 font-mono tracking-wide mt-0.5">ID: {category._id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            {category.productCount} produk
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Link
                              to={`/admin/category-update/${category._id}`}
                              state={{ returnTab: 'category' }}
                              className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:border-[#005429] hover:text-[#005429] transition-all shadow-sm"
                              title="Edit"
                            >
                              <FaPencilAlt size={14} />
                            </Link>
                            <button
                              onClick={() => openDeleteModal(category._id, category.name)}
                              className="p-2.5 bg-white border border-gray-200 text-red-500 rounded-lg hover:border-red-500 hover:text-red-600 transition-all shadow-sm"
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
                    <td colSpan="4" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="bg-gray-50/50 p-6 rounded-full mb-4 ring-1 ring-gray-100">
                          <FaSearch className="text-gray-300" size={32} />
                        </div>
                        <p className="text-gray-600 font-semibold text-lg">Tidak ada kategori ditemukan</p>
                        <p className="text-gray-400 text-sm mt-1">Coba ubah kata kunci pencarian Anda</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 bg-white/30">
              <Paginated
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
              />
            </div>
          )}
        </div>

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
