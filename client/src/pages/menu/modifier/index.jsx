import React, { useEffect, useState, useRef, useMemo } from "react";
import { FaBox, FaTag, FaBell, FaUser, FaShoppingBag, FaLayerGroup, FaSquare, FaInfo, FaPencilAlt, FaThLarge, FaDollarSign, FaTrash, FaSearch, FaChevronRight } from 'react-icons/fa';
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";


const ModifierManagement = () => {
  const location = useLocation();
  const [showInput, setShowInput] = useState(false);
  const [showInputStatus, setShowInputStatus] = useState(false);
  const [showInputCategory, setShowInputCategory] = useState(false);
  const navigate = useNavigate(); // Use the new hook
  const [menuItems, setMenuItems] = useState([]);
  const [category, setCategory] = useState([]);
  const [status, setStatus] = useState([]);
  const [tempSelectedCategory, setTempSelectedCategory] = useState("");
  const [tempSelectedStatus, setTempSelectedStatus] = useState("");
  const [tempSearch, setTempSearch] = useState("");
  const [error, setError] = useState(null);
  const [checkedItems, setCheckedItems] = useState([]);
  const [checkAll, setCheckAll] = useState(false);

  const [tempSelectedOutlet, setTempSelectedOutlet] = useState("");
  const [outlets, setOutlets] = useState([]);
  const [search, setSearch] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null); // Menyimpan status dropdown
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  const queryParams = new URLSearchParams(location.search);
  const ensureArray = (data) => Array.isArray(data) ? data : [];
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch products data
        const menuResponse = [];

        // Ensure menuResponse.data is an array
        const menuData = Array.isArray(menuResponse.data) ?
          menuResponse.data :
          (menuResponse.data && Array.isArray(menuResponse.data.data)) ?
            menuResponse.data.data : [];

        setMenuItems(menuData);
        setFilteredData(menuData); // Initialize filtered data with all products

        // Fetch outlets data
        const outletsResponse = await axios.get('/api/outlet');

        // Ensure outletsResponse.data is an array
        const outletsData = Array.isArray(outletsResponse.data) ?
          outletsResponse.data :
          (outletsResponse.data && Array.isArray(outletsResponse.data.data)) ?
            outletsResponse.data.data : [];

        setOutlets(outletsData);

        const categoryResponse = await axios.get('/api/storage/categories');

        const categoryData = Array.isArray(categoryResponse.data) ?
          categoryResponse.data :
          (categoryResponse.data && Array.isArray(categoryResponse.data.data)) ?
            categoryResponse.data.data : [];

        setCategory(categoryData);

        const statusResponse = [
          { _id: "ya", name: "Ya" },
          { _id: "tidak", name: "Tidak" }
        ]

        setStatus(statusResponse);

        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again later.");
        // Set empty arrays as fallback
        setMenuItems([]);
        setFilteredData([]);
        setOutlets([]);
        setCategory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get unique outlet names for the dropdown
  const uniqueOutlets = useMemo(() => {
    return outlets.map(item => item.name);
  }, [outlets]);

  // Get unique outlet names for the dropdown
  const uniqueCategory = useMemo(() => {
    return category.map(item => item.name);
  }, [category]);

  // Get unique Status names for the dropdown
  const uniqueStatus = useMemo(() => {
    return status.map(item => item.name);
  }, [status]);

  const paginatedData = useMemo(() => {

    // Ensure filteredData is an array before calling slice
    if (!Array.isArray(filteredData)) {
      console.error('filteredData is not an array:', filteredData);
      return [];
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const result = filteredData.slice(startIndex, endIndex);
    return result;
  }, [currentPage, filteredData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate total pages based on filtered data
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  // Filter outlets based on search input
  const filteredOutlets = useMemo(() => {
    return uniqueOutlets.filter(outlet =>
      outlet.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, uniqueOutlets]);

  // Filter outlets based on search input
  const filteredCategory = useMemo(() => {
    return uniqueCategory.filter(outlet =>
      outlet.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, uniqueCategory]);

  // Filter status based on search input
  const filteredStatus = useMemo(() => {
    return uniqueStatus.filter(status =>
      status.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, uniqueStatus]);


  // Apply filter function
  const applyFilter = () => {

    // Make sure products is an array before attempting to filter
    let filtered = ensureArray([...menuItems]);

    // Filter by search term (product name, category, or SKU)
    if (tempSearch) {
      filtered = filtered.filter(menu => {
        try {
          if (!menu) {
            return false;
          }

          const name = (menu.name || '').toLowerCase();
          const customer = (menu.user || '').toLowerCase();
          const receipt = (menu._id || '').toLowerCase();

          const searchTerm = tempSearch.toLowerCase();
          return name.includes(searchTerm) ||
            customer.includes(searchTerm) ||
            receipt.includes(searchTerm);
        } catch (err) {
          console.error("Error filtering by search:", err);
          return false;
        }
      });
    }

    // Filter by outlet
    if (tempSelectedOutlet) {
      filtered = filtered.filter(menu => {
        try {
          if (!menu?.availableAt?.length > 0) {
            return false;
          }

          const outletName = menu?.availableAt;
          const matches = outletName === tempSelectedOutlet;

          if (!matches) {
          }

          return matches;
        } catch (err) {
          console.error("Error filtering by outlet:", err);
          return false;
        }
      });
    }

    // Filter by category
    if (tempSelectedCategory) {
      filtered = filtered.filter(menu => {
        try {
          if (!menu?.category?.length > 0) {
            return false;
          }

          const categoryName = menu?.category[0];
          const matches = categoryName === tempSelectedCategory;

          if (!matches) {
          }

          return matches;
        } catch (err) {
          console.error("Error filtering by outlet:", err);
          return false;
        }
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page after filter
  };

  // useEffect(() => {
  //   applyFilter();
  // })

  // Reset filters
  // const resetFilter = () => {
  //   setTempSearch("");
  //   setTempSelectedOutlet("");
  //   setTempSelectedCategory("");
  //   setSearch("");
  //   setSearchCategory("");
  //   setFilteredData(ensureArray(menuItems));
  //   setCurrentPage(1);
  // };

  // const handleCategoryChange = (category) => {
  //   setSelectedCategory(category);
  //   navigate(`/admin/menu?category=${category === "Semua Kategori" ? "" : category}&selected=${selected}`);
  // };

  // const handleTabChange = (item) => {
  //   setSelected(item);
  //   navigate(`/admin/menu?category=${selectedCategory === "Semua Kategori" ? "" : selectedCategory}&selected=${item}`);
  // };

  const handleDelete = async (itemId) => {
    try {
      await axios.delete(`/api/menu/menu-items/${itemId}`);
      setMenuItems(menuItems.filter(item => item._id !== itemId));
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error deleting item:", error);
    }
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
    <div className="container">
      <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
        <FaBell className="text-2xl text-gray-400" />
        <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
          <FaUser />
        </Link>
      </div>

      <div className="px-3 py-2 flex justify-between items-center border-b bg-white">
        <div className="flex items-center space-x-2 text-gray-400">
          <FaShoppingBag size={22} />
          <p>Produk</p>
          <FaChevronRight size={22} />
          <p>Opsi Tambahan</p>
        </div>
        <div className="flex space-x-2">
          <Link
            to="/admin/modifier-create"
            className="text-[#005429] bg-white px-4 border border-[#005429] hover:text-white hover:bg-[#005429] py-2 rounded inline-block text-[13px]"
          >
            Tambah
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-3 py-4">
        <button
          className={`bg-white border-b-2 py-2 border-b-white hover:border-b-[#005429] focus:outline-none`}
          onClick={() => handleTabChange("menu")}
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
          className={`bg-white border-b-2 py-2 border-b-[#005429] focus:outline-none`}
        >
          <Link
            className="flex justify-between items-center border-l border-l-gray-200 p-4"
            to="/admin/modifier"
          >
            <div className="flex space-x-4 items-center">
              <FaLayerGroup size={24} className="text-gray-400" />
              <h2 className="text-gray-400 ml-2 text-sm">Opsi Tambahan</h2>

              {/* Hanya ikon info yang punya group hover */}
              <span className="relative group">
                <p className="border p-1 rounded-full">
                  <FaInfo size={8} className="text-gray-400 cursor-help" />
                </p>

                {/* Tooltip hanya muncul saat hover di ikon info */}
                <div className="absolute z-10 left-1/2 -translate-x-1/2 mt-2 w-[280px] text-justify bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none">
                  Opsi Tambahan merupakan produk pelengkap yang dijual bersamaan dengan produk utama. (Contoh: Nasi Goreng memiliki opsi tambahan ekstra telur dan ekstra bakso)
                </div>
              </span>
            </div>

            <div className="text-sm text-gray-400">(18)</div>
          </Link>

        </div>

        <div
          className={`bg-white border-b-2 py-2 border-b-white hover:border-b-[#005429] focus:outline-none`}
        >
          <Link className="flex justify-between items-center border-l border-l-gray-200 p-4"
            to={"/admin/categories"}>
            <div className="flex space-x-4">
              <FaTag size={24} className="text-gray-400" />
              <h2 className="text-gray-400 ml-2 text-sm">Kategori</h2>
            </div>
            <div className="text-sm text-gray-400">
              (18)
            </div>
          </Link>
        </div>
      </div>

      <div className="w-full pb-6 mb-[60px]">
        <div className="px-[15px] pb-[15px]">
          <div className="my-[13px] py-[10px] px-[15px] items-end rounded bg-slate-50 shadow-slate-200 shadow-md">
            <label className="text-[13px] mb-1 text-gray-500">Cari</label>
            <div className="relative">
              <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Opsi Tambahan / Pilihan"
                // value=""
                className="text-[13px] border py-[6px] pl-[30px] pr-[12px] rounded w-full"
              />
            </div>
          </div>

          {/* Menu Table */}
          <div className="w-full mt-4 shadow-md">
            <table className="w-full table-auto text-gray-500">
              <thead>
                <tr className="text-[14px]">
                  <th className="p-[15px] font-normal text-left">Opsi Tamabahan</th>
                  <th className="p-[15px] font-normal text-left">Pilihan</th>
                </tr>
              </thead>
              {paginatedData.length > 0 ? (
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-100 text-[14px]">
                      <td className="p-[15px] text-left">{item.opsi}</td>
                      <td className="p-[15px] text-left">{item.pilihan}</td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  <tr className="py-6 text-center w-full h-96">
                    <td colSpan={2}>
                      <div className="flex justify-center items-center min-h-[300px] text-gray-500">
                        <div className="grid grid-cols-3 gap-6 text-center">
                          <div className="col-span-3 flex flex-col items-center justify-center space-y-4 max-w-[700px]">
                            <FaLayerGroup size={60} className="text-gray-500" />
                            <p className="text-lg font-semibold">Belum Ada Opsi Tambahan</p>
                            <span className="text-sm text-justify">
                              Opsi Tambahan adalah produk pelengkap yang dapat Anda jual bersamaan dengan produk utama.
                            </span>
                          </div>
                        </div>
                      </div>
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
                Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} dari {filteredData.length} data
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
      </div>

      <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
        <div className="w-full h-[2px] bg-[#005429]">
        </div>
      </div>
    </div>
  );
};

export default ModifierManagement;  