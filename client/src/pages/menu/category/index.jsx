import React, { useEffect, useState, useMemo } from 'react';
import { Link } from "react-router-dom";
import axios from 'axios';
import { FaBox, FaTag, FaBell, FaUser, FaShoppingBag, FaLayerGroup, FaSquare, FaInfo } from 'react-icons/fa';

const CategoryIndex = () => {
  const ensureArray = (data) => Array.isArray(data) ? data : [];
  const [tempSearch, setTempSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [menuItems, setMenuItems] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState('all'); // State untuk menyimpan tipe yang dipilih
  const [currentPage, setCurrentPage] = useState(1); // Halaman saat ini
  const ITEMS_PER_PAGE = 50;

  // Fungsi untuk mengambil daftar kategori dari API
  useEffect(() => {
    const fetchData = async (type) => {
      setLoading(true);
      try {
        // let url = '/api/storage/category'; // URL default untuk mendapatkan semua kategori
        // if (type && type !== 'all') {
        //   url += `/${type}`; // Tambahkan parameter type jika ada
        // }

        // const response = await axios.get(url);
        // setCategories(response.data.data || []);
        // setFilteredCategories(response.data.data || []);

        const categoryResponse = await axios.get('/api/storage/category');

        const categoryData = Array.isArray(categoryResponse.data) ?
          categoryResponse.data :
          (categoryResponse.data && Array.isArray(categoryResponse.data.data)) ?
            categoryResponse.data.data : [];

        setCategories(categoryData);
        setFilteredCategories(categoryData);

        const menuResponse = await axios.get('/api/menu/menu-items');

        // Ensure menuResponse.data is an array
        const menuData = Array.isArray(menuResponse.data) ?
          menuResponse.data :
          (menuResponse.data && Array.isArray(menuResponse.data.data)) ?
            menuResponse.data.data : [];

        setMenuItems(menuData);

        // Hitung jumlah menu per kategori sekali saja di sini
        const counts = {};
        menuData.forEach((menu) => {
          if (Array.isArray(menu.category)) {
            // Jika array of object (pakai .name) atau string langsung
            menu.category.forEach((cat) => {
              const name =
                typeof cat === 'string' ? cat : cat?.name;
              const key = (name || '').toLowerCase().trim();
              if (key) {
                counts[key] = (counts[key] || 0) + 1;
              }
            });
          } else {
            // Jika kategori single string atau object
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

      } catch (err) {
        setError('Failed to fetch categories');
        setMenuItems([]);
        setCategories([]);
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      await axios.delete(`/category/${categoryId}`);
      setCategories((prev) => prev.filter((c) => c._id !== categoryId));
      setFilteredCategories((prev) => prev.filter((c) => c._id !== categoryId));
    } catch (err) {
      alert('Failed to delete category');
      console.error('Error deleting category:', err);
    }
  };

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredCategories.slice(startIndex, endIndex);
  }, [filteredCategories, currentPage]);

  // Calculate total pages based on filtered data
  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);

  // Apply filter function
  const applyFilter = () => {

    // Make sure products is an array before attempting to filter
    let filtered = ensureArray([...categories]);

    if (tempSearch) {

      filtered = filtered.filter(categories => {
        try {
          const category = (categories.name || '').toLowerCase();
          const searchTerm = tempSearch.toLowerCase();
          return category.includes(searchTerm);
        } catch (err) {
          console.error("Error filtering by search:", err);
          return false;
        }
      });
    }


    setFilteredCategories(filtered);
    setCurrentPage(1); // Reset to first page after filter
  };

  // Reset filters
  const resetFilter = () => {
    setTempSearch("");
    setFilteredCategories(ensureArray(categories));
    setCurrentPage(1);
  };

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

  return (
    <div className="">
      <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
        <FaBell className="text-2xl text-gray-400" />
        <Link
          to="/admin/menu"
          className="text-gray-400 inline-block text-2xl"
        >
          <FaUser />
        </Link>

      </div>
      <div className="px-3 py-2 flex justify-between items-center border-b bg-white">
        <div className="flex items-center space-x-2">
          <FaShoppingBag size={22} className="text-gray-400 inline-block" />
          <p className="text-gray-400 inline-block">Kategori</p>
        </div>
        <div className="flex space-x-2">
          <Link
            to="/admin/category-create"
            className="bg-[#005429] text-white px-4 py-2 rounded inline-block text-[13px]"
          >
            Tambah Kategori
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-4 py-4">
        <button
          className={`bg-white border-b-2 py-2 border-b-white hover:border-b-[#005429] focus:outline-none`}
        >
          <Link className="flex justify-between items-center border-l border-l-gray-200 p-4"
            to="/admin/menu">
            <div className="flex space-x-4">
              <FaBox size={24} className="text-gray-400" />
              <h2 className="text-gray-400 ml-2 text-sm">Produk</h2>
            </div>
            <div className="text-sm text-gray-400">
              (18)
            </div>
          </Link>
        </button>

        <div
          className={`bg-white border-b-2 py-2 border-b-white hover:border-b-[#005429] focus:outline-none`}
        >
          <Link className="flex justify-between items-center border-l border-l-gray-200 p-4"
            to="/admin/add-ons">
            <div className="flex space-x-4">
              <FaLayerGroup size={24} className="text-gray-400" />
              <h2 className="text-gray-400 ml-2 text-sm">Opsi Tambahan</h2>
              <span className="p-1">
                <p className="border p-1 rounded-full">
                  <FaInfo size={8} className="text-gray-400" />
                </p>
              </span>
            </div>
            <div className="text-sm text-gray-400">
              (18)
            </div>
          </Link>
        </div>

        <div
          className={`bg-white border-b-2 py-2 border-b-[#005429] focus:outline-none`}
        >
          <Link className="flex justify-between items-center border-l border-l-gray-200 p-4"
            to="/admin/categories">
            <div className="flex space-x-4">
              <FaTag size={24} className="text-gray-400" />
              <h2 className="text-gray-400 ml-2 text-sm">Kategori</h2>
            </div>
            <div className="text-sm text-gray-400">
              (18)
            </div>
          </Link>
        </div>

        <div
          className={`bg-white border-b-2 py-2 border-b-white hover:border-b-[#005429] focus:outline-none`}
        >
          <div className="flex justify-between items-center border-l border-l-gray-200 p-4">
            <div className="flex space-x-4">
              <FaSquare size={24} className="text-gray-400" />
              <h2 className="text-gray-400 ml-2 text-sm">GrabFood</h2>
            </div>
            <div className="text-sm text-gray-400">
              (18)
            </div>
          </div>
        </div>
      </div >

      <div className="overflow-x-auto px-[15px] pb-[15px]">

        <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-12 gap-[10px] items-end rounded bg-gray-50 shadow-md">
          <div className="flex flex-col col-span-10">
            <label className="text-[13px] mb-1 text-gray-500">Cari</label>
            <input
              type="text"
              placeholder="Kategori"
              value={tempSearch}
              onChange={(e) => setTempSearch(e.target.value)}
              className="text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded"
            />
          </div>

          <div className="flex justify-end space-x-2 items-end col-span-2">
            <button onClick={applyFilter} className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Terapkan</button>
            <button onClick={resetFilter} className="text-gray-400 border text-[13px] px-[15px] py-[7px] rounded">Reset</button>
          </div>
        </div>
        <div className="overflow-x-auto rounded shadow-md shadow-slate-200">
          <table className="min-w-full table-auto">
            <thead className="text-gray-400">
              <tr className="text-left text-[13px]">
                <th className="px-6 py-4 font-normal">
                  Nama Kategori
                </th>
                <th className="px-6 py-4 font-normal">
                  Jumlah Produk
                </th>
                <th className="px-6 py-4 font-normal text-right">
                  Actions
                </th>
              </tr>
            </thead>
            {paginatedData.length > 0 ? (
              <tbody className="text-sm text-gray-400">
                {paginatedData.map((category) => {
                  const key = category.name.toLowerCase().trim();
                  const count = categoryCounts[key] || 0;
                  try {
                    return (
                      <React.Fragment key={category._id}>
                        <tr className="text-sm">
                          <td className="px-6 py-4 whitespace-nowrap">{category.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleDeleteCategory(category._id)}
                              className="text-red-500 hover:text-red-700 mr-2"
                            >
                              Delete
                            </button>
                            <a
                              href={`/category/${category._id}/menu`}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              View Menu
                            </a>
                          </td>
                        </tr>
                      </React.Fragment>
                    )

                  } catch (error) {

                  }

                })}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan="3" className="text-center py-4 text-gray-500">
                    No categories found.
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>

        {/* Pagination */}
        {paginatedData.length > 0 && (
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-600">
              Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredCategories.length)} dari {filteredCategories.length} data
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div >
  );
};

export default CategoryIndex;
