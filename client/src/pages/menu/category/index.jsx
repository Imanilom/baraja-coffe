import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from 'axios';
import { FaBox, FaTag, FaBell, FaUser, FaShoppingBag, FaLayerGroup, FaSquare, FaInfo, FaSearch, FaPencilAlt, FaTrash, FaChevronRight, FaPlus } from 'react-icons/fa';
import Paginated from '../../../components/paginated';

const CategoryIndex = () => {
  const location = useLocation();
  const message = location.state?.successMessage;
  const [showModal, setShowModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState(null);
  const ensureArray = (data) => Array.isArray(data) ? data : [];
  const [tempSearch, setTempSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [menuItems, setMenuItems] = useState([]);
  const [totalItems, setTotalItems] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [limit] = useState(250);
  const [offset, setOffset] = useState(0);

  const fetchData = async (type) => {
    setLoading(true);
    try {
      const categoryResponse = await axios.get('/api/storage/categories');
      const categoryData = categoryResponse.data;
      setCategories(categoryData.mainCategories);
      setFilteredCategories(categoryData.mainCategories);

      const menuResponse = await axios.get('/api/menu/menu-items');
      setMenuItems(menuResponse.data.data);
    } catch (err) {
      setError('Failed to fetch categories');
      setMenuItems([]);
      setCategories([]);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const counts = {};
    menuItems.forEach((menu) => {
      if (Array.isArray(menu.category)) {
        menu.category.forEach((cat) => {
          const name = typeof cat === 'string' ? cat : cat?.name;
          const key = (name || '').toLowerCase().trim();
          if (key) {
            counts[key] = (counts[key] || 0) + 1;
          }
        });
      } else {
        const name =
          typeof menu.category === 'string'
            ? menu.category
            : menu.category?.name;
        const key = (name || '').toLowerCase().trim();
        if (key) {
          counts[key] = (counts[key] || 0) + 1;
        }
      }
    });
    setCategoryCounts(counts);
  }, [menuItems]);

  useEffect(() => {
    fetchData();
  }, []);

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
    const filtered = categories.filter((category) =>
      (category.name || '').toLowerCase().includes(tempSearch.toLowerCase())
    );
    setFilteredCategories(filtered);
    setCurrentPage(1);
  }, [tempSearch, categories]);

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`/api/storage/categories/${selectedCategoryId}`);
      setCategories((prev) => prev.filter((c) => c._id !== selectedCategoryId));
      setFilteredCategories((prev) => prev.filter((c) => c._id !== selectedCategoryId));
    } catch (err) {
      alert('Failed to delete category');
      console.error('Error deleting category:', err);
    } finally {
      setShowModal(false);
      setSelectedCategoryId(null);
      fetchData();
    }
  };

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredCategories?.slice(startIndex, endIndex) || [];
  }, [filteredCategories, currentPage]);

  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#005429] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

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

  const ConfirmModal = ({ isOpen, onClose, onConfirm, title = 'Konfirmasi', message = 'Apakah Anda yakin?' }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
          <div className="flex items-start mb-5">
            <div className="flex-shrink-0 bg-red-100 text-red-600 rounded-full p-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">

      {/* Main Content */}
      <div className="mx-auto px-6 py-6">
        {/* Stats Card */}
        <div className="bg-gradient-to-br from-[#005429] to-[#003d1f] rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100 mb-1">Total Kategori</p>
              <h2 className="text-4xl font-bold">{filteredCategories.length}</h2>
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
                    const key = category.name.toLowerCase().trim();
                    const count = categoryCounts[key] || 0;

                    return (
                      <tr key={category._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDateTime(category.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-[#005429] bg-opacity-10 rounded-lg flex items-center justify-center">
                              <FaTag className="text-[#005429]" size={16} />
                            </div>
                            <span className="ml-3 text-sm font-medium text-gray-900">{category.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {count} produk
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Link
                              to={`/admin/category-update/${category._id}`}
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