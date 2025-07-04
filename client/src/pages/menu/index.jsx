import React, { useEffect, useState, useRef, useMemo } from "react";
import { FaBox, FaTag, FaBell, FaUser, FaShoppingBag, FaLayerGroup, FaSquare, FaInfo, FaPencilAlt, FaThLarge, FaDollarSign, FaTrash } from 'react-icons/fa';
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";

const ConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-md text-center w-96">
        <FaTrash className="text-red-500 mx-auto mb-4" size={72} />
        <h2 className="text-lg font-bold">Konfirmasi Penghapusan</h2>
        <p>Apakah Anda yakin ingin menghapus item ini?</p>
        <div className="flex justify-center mt-4">
          <button onClick={onClose} className="mr-2 px-4 py-2 bg-gray-300 rounded">Batal</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded">Hapus</button>
        </div>
      </div>
    </div>
  );
};

const Menu = () => {
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const menuResponse = await axios.get('/api/menu/menu-items');

      const menuData = Array.isArray(menuResponse.data)
        ? menuResponse.data
        : (menuResponse.data && Array.isArray(menuResponse.data.data))
          ? menuResponse.data.data
          : [];

      setMenuItems(menuData);
      setFilteredData(menuData);

      const outletsResponse = await axios.get('/api/outlet');
      const outletsData = Array.isArray(outletsResponse.data)
        ? outletsResponse.data
        : (outletsResponse.data && Array.isArray(outletsResponse.data.data))
          ? outletsResponse.data.data
          : [];

      setOutlets(outletsData);

      const categoryResponse = await axios.get('/api/storage/category');
      const categoryData = Array.isArray(categoryResponse.data)
        ? categoryResponse.data
        : (categoryResponse.data && Array.isArray(categoryResponse.data.data))
          ? categoryResponse.data.data
          : [];

      setCategory(categoryData);

      setStatus([
        { _id: "ya", name: "Ya" },
        { _id: "tidak", name: "Tidak" }
      ]);

      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again later.");
      setMenuItems([]);
      setFilteredData([]);
      setOutlets([]);
      setCategory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    applyFilter(); // hanya untuk load awal
  }, []);

  useEffect(() => {

  }, [tempSearch, tempSelectedOutlet, tempSelectedCategory, tempSelectedStatus])


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

  const handleDelete = async (itemId) => {
    try {
      await axios.delete(`/api/menu/menu-items/${itemId}`);
      fetchData();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data terpilih?")) return;

    try {
      await axios.delete("/api/menu/menu-items", {
        data: { id: checkedItems }
      });
      // Refresh data setelah hapus
      setCheckedItems([]);
      setCheckAll(false);
      fetchData(); // Pastikan ini memuat ulang data
    } catch (error) {
      console.error("Gagal menghapus:", error);
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
        <div className="flex items-center space-x-2">
          <FaShoppingBag size={22} className="text-gray-400 inline-block" />
          <p className="text-gray-400 inline-block">Produk</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => console.log('Impor Menu')}
            className="bg-white text-[#005429] px-4 py-2 rounded border border-[#005429] hover:text-white hover:bg-[#005429] text-[13px]"
          >
            Impor Produk
          </button>
          <button
            onClick={() => console.log('Ekspor Produk')}
            className="bg-white text-[#005429] px-4 py-2 rounded border border-[#005429] hover:text-white hover:bg-[#005429] text-[13px]"
          >
            Ekspor Produk
          </button>

          <Link
            to="/admin/menu-create"
            className="bg-[#005429] text-white px-4 py-2 rounded inline-block text-[13px]"
          >
            Tambah Produk
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-3 py-4">
        <button
          className={`bg-white border-b-2 py-2 border-b-[#005429] focus:outline-none`}
          onClick={() => handleTabChange("menu")}
        >
          <Link className="flex justify-between items-center border-l border-l-gray-200 p-4">
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

        {/* <div
          className={`bg-white border-b-2 py-2 border-b-white hover:border-b-[#005429] focus:outline-none`}
        >
          <div className="flex justify-between items-center border-l border-l-gray-200 p-4">
            <div className="flex space-x-4">
              <FaSquare size={24} className="text-gray-400" />
              <h2 className="text-gray-400 ml-2 text-sm">Grab</h2>
            </div>
            <div className="text-sm text-gray-400">
              (18)
            </div>
          </div>
        </div> */}
      </div>

      <div className="w-full pb-6 mb-[60px]">
        <div className="px-[15px] pb-[15px]">
          <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-12 gap-[10px] items-end rounded bg-slate-50 shadow-slate-200 shadow-md">
            <div className="flex flex-col col-span-3">
              <label className="text-[13px] mb-1 text-gray-500">Outlet</label>
              <div className="relative">
                {!showInput ? (
                  <button className="w-full text-[13px] text-gray-500 border py-[6px] pr-[25px] pl-[12px] rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]" onClick={() => setShowInput(true)}>
                    {tempSelectedOutlet || "Semua Outlet"}
                  </button>
                ) : (
                  <input
                    type="text"
                    className="w-full text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded text-left"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                    placeholder=""
                  />
                )}
                {showInput && (
                  <ul className="absolute z-10 bg-white border mt-1 w-full rounded shadow-slate-200 shadow-md max-h-48 overflow-auto" ref={dropdownRef}>
                    {filteredOutlets.length > 0 ? (
                      filteredOutlets.map((outlet, idx) => (
                        <li
                          key={idx}
                          onClick={() => {
                            setTempSelectedOutlet(outlet);
                            setShowInput(false);
                          }}
                          className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                        >
                          {outlet}
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-2 text-gray-500">Tidak ditemukan</li>
                    )}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex flex-col col-span-3">
              <label className="text-[13px] mb-1 text-gray-500">Kategori</label>
              <div className="relative">
                {!showInputCategory ? (
                  <button className="w-full text-[13px] text-gray-500 border py-[6px] pr-[25px] pl-[12px] rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]" onClick={() => setShowInputCategory(true)}>
                    {tempSelectedCategory || "Semua Kategori"}
                  </button>
                ) : (
                  <input
                    type="text"
                    className="w-full text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded text-left"
                    value={search}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    autoFocus
                    placeholder=""
                  />
                )}
                {showInputCategory && (
                  <ul className="absolute z-10 bg-white border mt-1 w-full rounded shadow-slate-200 shadow-md max-h-48 overflow-auto" ref={dropdownRef}>
                    {filteredCategory.length > 0 ? (
                      filteredCategory.map((category, idx) => (
                        <li
                          key={idx}
                          onClick={() => {
                            setTempSelectedCategory(category);
                            setShowInputCategory(false);
                          }}
                          className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                        >
                          {category}
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-2 text-gray-500">Tidak ditemukan</li>
                    )}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex flex-col col-span-3">
              <label className="text-[13px] mb-1 text-gray-500">Status Dijual</label>
              <div className="relative">
                {!showInputStatus ? (
                  <button className="w-full text-[13px] text-gray-500 border py-[6px] pr-[25px] pl-[12px] rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]" onClick={() => setShowInputStatus(true)}>
                    {tempSelectedCategory || "Semua Status"}
                  </button>
                ) : (
                  <input
                    type="text"
                    className="w-full text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded text-left"
                    value={search}
                    onChange={(e) => setSearchStatus(e.target.value)}
                    autoFocus
                    placeholder=""
                  />
                )}
                {showInputStatus && (
                  <ul className="absolute z-10 bg-white border mt-1 w-full rounded shadow-slate-200 shadow-md max-h-48 overflow-auto" ref={dropdownRef}>
                    {filteredStatus.length > 0 ? (
                      filteredStatus.map((status, idx) => (
                        <li
                          key={idx}
                          onClick={() => {
                            setTempSelectedStatus(status);
                            setShowInputStatus(false);
                          }}
                          className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                        >
                          {status}
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-2 text-gray-500">Tidak ditemukan</li>
                    )}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex flex-col col-span-3">
              <label className="text-[13px] mb-1 text-gray-500">Cari</label>
              <input
                type="text"
                placeholder="Produk / SKU / Barkode"
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
                className="text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded"
              />
            </div>

            {/* <div className="flex justify-end space-x-2 items-end col-span-2">
              <button onClick={applyFilter} className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Terapkan</button>
              <button onClick={resetFilter} className="text-gray-400 border text-[13px] px-[15px] py-[7px] rounded">Reset</button>
            </div> */}
          </div>

          {/* Menu Table */}
          <div className="w-full mt-4 shadow-md">
            <table className="w-full table-auto text-gray-500">
              <thead>
                <tr className="text-[14px]">
                  <th className="p-[15px] font-normal text-right">
                    <input
                      type="checkbox"
                      className="w-[20px] h-[20px] accent-[#005429]"
                      checked={checkAll}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setCheckAll(isChecked);
                        setCheckedItems(isChecked ? paginatedData.map(item => item._id) : []);
                      }}
                    />
                  </th>
                  <th className="p-[15px] font-normal text-left">Produk</th>
                  <th className="p-[15px] font-normal text-left">Kategori</th>
                  <th className="p-[15px] font-normal text-right">Harga</th>
                  <th className="p-[15px] font-normal">
                    {checkedItems.length > 0 && (
                      <button
                        onClick={handleDeleteSelected}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                      >
                        Hapus Terpilih ({checkedItems.length})
                      </button>
                    )}</th>
                </tr>
              </thead>
              {paginatedData.length > 0 ? (
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-100 text-[14px]">
                      <td className="p-[15px] text-right">
                        <input
                          type="checkbox"
                          className="w-[20px] h-[20px] accent-[#005429]"
                          checked={checkedItems.includes(item._id)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setCheckedItems(prev => {
                              const updated = isChecked
                                ? [...prev, item._id]
                                : prev.filter(id => id !== item._id);
                              setCheckAll(updated.length === paginatedData.length);
                              return updated;
                            });
                          }}
                        />

                      </td>
                      <td className="p-[15px]">
                        <div className="flex items-center">
                          <img
                            src={item.imageURL || "https://via.placeholder.com/100"}
                            alt={item.name}
                            className="w-[35px] h-[35px] object-cover rounded-lg"
                          />
                          <div className="ml-4">
                            <h3>{item.name}</h3>
                          </div>
                        </div>
                      </td>
                      <td className="p-[15px]">
                        {Array.isArray(item.category)
                          ? item.category.map((category) => category.name).join(", ")
                          : item.category?.name || "-"}
                      </td>
                      <td className="p-[15px] text-right">{formatCurrency(item.price)}</td>
                      <td className="p-[15px]">
                        {/* Dropdown Menu */}
                        <div className="relative text-right">
                          <button
                            className="px-2 bg-white border border-gray-200 hover:border-none hover:bg-green-800 rounded-sm"
                            onClick={() => setOpenDropdown(openDropdown === item._id ? null : item._id)}
                          >
                            <span className="text-xl text-gray-200 hover:text-white">
                              •••
                            </span>
                          </button>
                          {openDropdown === item._id && (
                            <div className="absolute text-left text-gray-500 right-0 top-full mt-2 bg-white border rounded-md shadow-md w-[240px] z-10">
                              <ul className="w-full">
                                <li>
                                  <Link
                                    to={`/admin/manage-stock/${item._id}`}
                                    className="bg-transparent flex space-x-[18px] items-center px-[20px] py-[15px] text-sm cursor-pointer hover:bg-gray-100"
                                  >
                                    <FaThLarge size={18} />
                                    <span>Kelola Stok</span>
                                  </Link>
                                </li>
                                <li>
                                  <Link
                                    to={`/admin/manage-price-and-selling-status/${item._id}`}
                                    className="bg-transparent flex space-x-[18px] items-center px-[20px] py-[15px] text-sm cursor-pointer hover:bg-gray-100 border-b"
                                  >
                                    <FaDollarSign size={18} />
                                    <span>Kelola Harga & Status Jual</span>
                                  </Link>
                                </li>
                                <Link
                                  to={`/admin/menu-update/${item._id}`}
                                  className="bg-transparent flex space-x-[18px] items-center px-[20px] py-[15px] text-sm cursor-pointer hover:bg-gray-100"
                                >
                                  <FaPencilAlt size={18} />
                                  <span>Edit</span>
                                </Link>
                                <button
                                  className="w-full flex space-x-[18px] items-center px-[20px] py-[15px] text-sm cursor-pointer hover:bg-gray-100"
                                  onClick={() => {
                                    setItemToDelete(item._id);
                                    setIsModalOpen(true);

                                  }}>
                                  <FaTrash size={18} />
                                  <span>Delete</span>
                                </button>
                              </ul>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  <tr className="py-6 text-center w-full h-96">
                    <td colSpan={7}>Tidak ada data ditemukan</td>
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
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => handleDelete(itemToDelete)}
      />
    </div>
  );
};

export default Menu;  