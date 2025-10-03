import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from 'axios';
import { FaBox, FaTag, FaBell, FaUser, FaShoppingBag, FaLayerGroup, FaSquare, FaInfo, FaSearch, FaPencilAlt, FaTrash, FaChevronRight } from 'react-icons/fa';
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
  const [selectedType, setSelectedType] = useState('all'); // State untuk menyimpan tipe yang dipilih
  const [currentPage, setCurrentPage] = useState(1); // Halaman saat ini
  const ITEMS_PER_PAGE = 50;
  const [limit] = useState(250);
  const [offset, setOffset] = useState(0);

  // const fetchMenuItems = async (limit, offset) => {
  //   const menuResponse = await axios.get('/api/menu/menu-items', {
  //     params: { limit, offset }
  //   });
  //   return {
  //     data: menuResponse.data.data,
  //     meta: menuResponse.data.meta
  //   };
  // };
  // Fungsi untuk mengambil daftar kategori dari API
  const fetchData = async (type) => {
    setLoading(true);
    try {

      const categoryResponse = await axios.get('/api/storage/categories');

      const categoryData = categoryResponse.data;

      setCategories(categoryData.mainCategories);
      setFilteredCategories(categoryData.mainCategories);

      // const { data, meta } = await fetchMenuItems(limit, offset);
      // setMenuItems(data);
      // setTotalItems(meta.totalItems);

      const menuResponse = await axios.get('/api/menu/menu-items');
      setMenuItems(menuResponse.data.data);

      // Hitung jumlah menu per kategori sekali saja di sini
      // const counts = {};
      // menuItems.forEach((menu) => {
      //   if (Array.isArray(menu.category)) {
      //     // Jika array of object (pakai .name) atau string langsung
      //     menu.category.forEach((cat) => {
      //       const name =
      //         typeof cat === 'string' ? cat : cat?.name;
      //       const key = (name || '').toLowerCase().trim();
      //       if (key) {
      //         counts[key] = (counts[key] || 0) + 1;
      //       }
      //     });
      //   } else {
      //     // Jika kategori single string atau object
      //     const name =
      //       typeof menu.category === 'string'
      //         ? menu.category
      //         : menu.category?.name;
      //     const key = (name || '').toLowerCase().trim();
      //     if (key) {
      //       counts[key] = (counts[key] || 0) + 1;
      //     }
      //   }
      // });
      // setCategoryCounts(counts);

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

  // Search filtering
  useEffect(() => {
    const filtered = categories.filter((category) =>
      (category.name || '').toLowerCase().includes(tempSearch.toLowerCase())
    );
    setFilteredCategories(filtered);
    setCurrentPage(1); // reset page saat pencarian
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
      fetchData(); // ⬅️ Refresh data setelah hapus
    }
  };

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredCategories?.slice(startIndex, endIndex) || [];
  }, [filteredCategories, currentPage]);

  // Calculate total pages based on filtered data
  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-2">Error</p>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const ConfirmModal = ({ isOpen, onClose, onConfirm, title = 'Konfirmasi', message = 'Apakah Anda yakin?' }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 bg-blue-100 text-blue-600 rounded-full p-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                />
              </svg>
            </div>
            <h2 className="ml-3 text-lg font-semibold text-gray-800">{title}</h2>
          </div>

          <p className="text-sm text-gray-600 mb-6">{message}</p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-[60px]">
      {/* {message && (
        <div className="px-3 py-4">
          <p className="text-green-500 mb-4">{message}</p>
        </div>
      )} */}
      <div className="flex justify-between items-center px-6 py-3 my-3">
        <div className="flex gap-2 items-center text-xl text-green-900 font-semibold">
          <span>Menu</span>
          <FaChevronRight size={22} />
          <span>Kategori</span>
        </div>
        <div className="flex space-x-2">
          <Link
            to="/admin/category-create"
            className="bg-[#005429] text-white px-4 py-2 rounded inline-block text-[13px]"
          >
            Tambah Kategori
          </Link>
          <Link
            to="/admin/subcategory-create"
            className="bg-[#005429] text-white px-4 py-2 rounded inline-block text-[13px]"
          >
            Tambah Sub Kategori
          </Link>
        </div>
      </div>

      <div className="px-6">
        <div className="flex flex-wrap gap-4 md:justify-end items-center py-3">
          <div className="flex flex-col col-span-5 w-1/5">
            <div className="relative">
              <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Kategori"
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
                className="text-[13px] border py-2 pl-[30px] pr-[12px] rounded w-full"
              />
            </div>
          </div>
        </div>
        <div className="rounded shadow-md bg-white shadow-slate-200">
          <table className="min-w-full table-auto">
            <thead className="text-gray-400">
              <tr className="text-left text-[13px]">
                <th className="px-6 py-4 font-normal">
                  Waktu Submit
                </th>
                <th className="px-6 py-4 font-normal">
                  Nama Kategori
                </th>
                <th className="px-6 py-4 font-normal text-right">
                  Jumlah Produk
                </th>
                <th className="px-6 py-4 font-normal text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-400">
              {paginatedData.length > 0 ? (
                paginatedData.map((category) => {
                  const key = category.name.toLowerCase().trim();
                  const count = categoryCounts[key] || 0;

                  return (
                    <tr className="text-sm" key={category._id}>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDateTime(category.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{category.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">{count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {/* Dropdown Menu */}
                        {/* <div className="relative text-right">
                          <button
                            className="px-2 bg-white border border-gray-200 hover:border-[#005429] hover:bg-[#005429] rounded-sm"
                            onClick={() =>
                              setOpenDropdown(openDropdown === category._id ? null : category._id)
                            }
                          >
                            <span className="text-xl text-gray-200 hover:text-white">•••</span>
                          </button>
                          {openDropdown === category._id && (
                            <div className="absolute text-left right-0 top-full mt-2 bg-white border rounded-md shadow-md w-52 z-10">
                              <ul>
                                <Link
                                  className="px-4 py-4 text-sm cursor-pointer bg-transparent flex items-center space-x-4 text-[14px] hover:bg-gray-100"
                                  to={`/admin/category-update/${category._id}`}
                                >
                                  <FaPencilAlt size={18} />
                                  <span>Ubah</span>
                                </Link>
                                <button
                                  className="w-full px-4 py-4 text-sm cursor-pointer hover:bg-gray-100 text-red-600 flex items-center space-x-4 text-[14px]"
                                  onClick={() => openDeleteModal(category._id, category.name)}
                                >
                                  <FaTrash size={18} />
                                  <span>Hapus</span>
                                </button>
                              </ul>
                            </div>
                          )}
                        </div> */}
                        <div className="flex justify-end items-center">
                          <div className="flex gap-2">
                            <Link
                              className="p-3 text-sm bg-green-900 text-white rounded cursor-pointer flex items-center space-x-4 text-[14px]"
                              to={`/admin/category-update/${category._id}`}
                            >
                              <FaPencilAlt />
                            </Link>
                            <button
                              className="w-full p-3 text-sm cursor-pointer rounded hover:bg-gray-100 bg-red-600 text-white flex items-center space-x-4 text-[14px]"
                              onClick={() => openDeleteModal(category._id, category.name)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-4 text-gray-500">
                    Tidak ada kategori ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Paginated
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
        />
      </div>
      {/* Modal Konfirmasi */}
      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmDelete}
        message={`Apakah Anda yakin ingin menghapus "${selectedCategoryName}"?`}
      />
    </div >
  );
};

export default CategoryIndex;
