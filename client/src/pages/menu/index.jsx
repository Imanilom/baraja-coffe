import React, { useEffect, useState, useRef, useMemo } from "react";
import Select from "react-select";
import { FaBox, FaTag, FaBell, FaUser, FaShoppingBag, FaLayerGroup, FaSquare, FaInfo, FaPencilAlt, FaThLarge, FaDollarSign, FaTrash, FaReceipt, FaTrashAlt, FaChevronRight, FaChevronLeft, FaEyeSlash, FaEye } from 'react-icons/fa';
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
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: '#d1d5db', // Tailwind border-gray-300
      minHeight: '34px',
      fontSize: '13px',
      color: '#6b7280', // text-gray-500
      boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none', // blue-500 on focus
      '&:hover': {
        borderColor: '#9ca3af', // Tailwind border-gray-400
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#6b7280', // text-gray-500
    }),
    input: (provided) => ({
      ...provided,
      color: '#6b7280', // text-gray-500 for typed text
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af', // text-gray-400
      fontSize: '13px',
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: '13px',
      color: '#374151', // gray-700
      backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white', // blue-50
      cursor: 'pointer',
    }),
  };

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
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalItems, setTotalItems] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // const [totalPages, setTotalPages] = useState(1);

  const dropdownRef = useRef(null);

  // const fetchMenuItems = async (limit, offset) => {
  //   const menuResponse = await axios.get('/api/menu/menu-items', {
  //     params: { limit, offset }
  //   });
  //   return {
  //     data: menuResponse.data.data,
  //     meta: menuResponse.data.meta
  //   };
  // };
  const fetchData = async () => {
    setLoading(true);
    try {
      // const { data, meta } = await fetchMenuItems(limit, offset);
      // setMenuItems(data);
      // setTotalItems(meta.totalItems);
      // setTotalPages(meta.totalPages);
      // setCurrentPage(meta.currentPage);
      const menuResponse = await axios.get('/api/menu/menu-items');
      setMenuItems(menuResponse.data.data);
      const outletsResponse = await axios.get('/api/outlet');
      setOutlets(outletsResponse.data.data);

      const categoryResponse = await axios.get('/api/menu/categories');
      setCategory(categoryResponse.data.data.filter((cat) => !cat.parentCategory));

      setStatus([
        { id: "ya", name: "Ya" },
        { id: "tidak", name: "Tidak" }
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
  }, [offset]);

  const outletOptions = [
    { value: '', label: 'Semua Outlet' },
    ...outlets.map(outlet => ({ value: outlet.name, label: outlet.name }))
  ];

  const categoryOptions = [
    { value: '', label: 'Semua Kategori' },
    ...category.map(category => ({ value: category.name, label: category.name }))
  ];

  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: true, label: 'Aktif' },
    { value: false, label: 'Tidak Aktif' },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    const matchOutlet =
      tempSelectedOutlet === '' ||
      item.availableAt.some(outlet => outlet.name === tempSelectedOutlet);
    const matchCategory = tempSelectedCategory === '' || item.category.name === tempSelectedCategory;
    const matchStatus = tempSelectedStatus === '' || item.isActive === tempSelectedStatus;

    const matchSearch =
      tempSearch === '' ||
      item.name?.toLowerCase().includes(tempSearch.toLowerCase()) ||
      item.sku?.toLowerCase().includes(tempSearch.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(tempSearch.toLowerCase());

    return matchOutlet && matchCategory && matchStatus && matchSearch;
  });



  // useEffect(() => {
  //   applyFilter(); // hanya untuk load awal
  // }, []);

  // const handlePrevious = () => {
  //   if (currentPage > 1) {
  //     setOffset((currentPage - 2) * limit);
  //   }
  // };

  // const handleNext = () => {
  //   if (currentPage < totalPages) {
  //     setOffset(currentPage * limit);
  //   }
  // };

  const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMenuItems.slice(indexOfFirstItem, indexOfLastItem);


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // useEffect(() => {
  //   applyFilter();
  // }, [tempSelectedOutlet, tempSelectedCategory, tempSelectedStatus, tempSearch]);

  // // Apply filter function
  // const applyFilter = () => {

  //   // Make sure products is an array before attempting to filter
  //   let filtered = ensureArray([...menuItems]);

  //   // Filter by search term (product name, category, or SKU)
  //   if (tempSearch) {
  //     filtered = filtered.filter(menu => {
  //       try {
  //         if (!menu) {
  //           return false;
  //         }

  //         const name = (menu.name || '').toLowerCase();
  //         const customer = (menu.user || '').toLowerCase();
  //         const receipt = (menu.id || '').toLowerCase();

  //         const searchTerm = tempSearch.toLowerCase();
  //         return name.includes(searchTerm) ||
  //           customer.includes(searchTerm) ||
  //           receipt.includes(searchTerm);
  //       } catch (err) {
  //         console.error("Error filtering by search:", err);
  //         return false;
  //       }
  //     });
  //   }

  //   // Filter by outlet
  //   if (tempSelectedOutlet) {
  //     filtered = filtered.filter(menu => {
  //       try {
  //         if (!menu?.availableAt?.length > 0) {
  //           return false;
  //         }

  //         const outletName = menu?.availableAt;
  //         const matches = outletName === tempSelectedOutlet;

  //         if (!matches) {
  //         }

  //         return matches;
  //       } catch (err) {
  //         console.error("Error filtering by outlet:", err);
  //         return false;
  //       }
  //     });
  //   }

  //   // Filter by category
  //   if (tempSelectedCategory) {
  //     filtered = filtered.filter(menu => {
  //       try {
  //         if (!menu?.category?.length > 0) {
  //           return false;
  //         }

  //         const categoryName = menu?.category[0];
  //         const matches = categoryName === tempSelectedCategory;

  //         if (!matches) {
  //         }

  //         return matches;
  //       } catch (err) {
  //         console.error("Error filtering by outlet:", err);
  //         return false;
  //       }
  //     });
  //   }

  //   setFilteredData(filtered);
  //   setCurrentPage(1); // Reset to first page after filter
  // };

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
    <div className="w-full">
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
          {/* <button
            onClick={() => console.log('Impor Menu')}
            className="bg-white text-[#005429] px-4 py-2 rounded border border-[#005429] hover:text-white hover:bg-[#005429] text-[13px]"
          >
            Impor Produk
          </button> */}
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

      <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-2 py-4">
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
              ({menuItems.length})
              {/* ({totalItems}) */}
            </div>
          </Link>
        </button>

        {/* <div
          className={`bg-white border-b-2 py-2 border-b-white hover:border-b-[#005429] focus:outline-none`}
        >
          <Link
            className="flex justify-between items-center border-l border-l-gray-200 p-4"
            to="/admin/modifier"
          >
            <div className="flex space-x-4 items-center">
              <FaLayerGroup size={24} className="text-gray-400" />
              <h2 className="text-gray-400 ml-2 text-sm">Opsi Tambahan</h2>

              <span className="relative group">
                <p className="border p-1 rounded-full">
                  <FaInfo size={8} className="text-gray-400 cursor-help" />
                </p>

                <div className="absolute z-10 left-1/2 -translate-x-1/2 mt-2 w-[280px] text-justify bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none">
                  Opsi Tambahan merupakan produk pelengkap yang dijual bersamaan dengan produk utama. (Contoh: Nasi Goreng memiliki opsi tambahan ekstra telur dan ekstra bakso)
                </div>
              </span>
            </div>

            <div className="text-sm text-gray-400">(18)</div>
          </Link>
        </div> */}

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
              ({category.length})
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
              <Select
                className="text-sm"
                options={outletOptions}
                value={outletOptions.find(option => option.value === tempSelectedOutlet) || outletOptions[0]}
                onChange={(selected) => setTempSelectedOutlet(selected.value)}
                styles={customStyles}
                isSearchable
              />
            </div>

            <div className="flex flex-col col-span-3">
              <label className="text-[13px] mb-1 text-gray-500">Kategori</label>
              <Select
                className="text-sm"
                options={categoryOptions}
                value={categoryOptions.find(option => option.value === tempSelectedCategory) || categoryOptions[0]}
                onChange={(selected) => setTempSelectedCategory(selected.value)}
                styles={customStyles}
                isSearchable
              />
            </div>

            <div className="flex flex-col col-span-3">
              <label className="text-[13px] mb-1 text-gray-500">Status Dijual</label>
              <Select
                className="text-sm"
                options={statusOptions}
                value={statusOptions.find(option => option.value === tempSelectedStatus) || statusOptions[0]}
                onChange={(selected) => setTempSelectedStatus(selected.value)}
                styles={customStyles}
                isSearchable
              />
            </div>

            <div className="flex flex-col col-span-3">
              <label className="text-[13px] mb-1 text-gray-500">Cari</label>
              <input
                type="text"
                placeholder="Produk / SKU / Barkode"
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
                className="text-[13px] border py-[8px] pr-[25px] pl-[12px] rounded"
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
                <tr className="text-[14px] h-20">
                  <th className="p-[15px] font-normal text-right w-10">
                    <input
                      type="checkbox"
                      className="w-[20px] h-[20px] accent-[#005429]"
                      checked={checkAll}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setCheckAll(isChecked);
                        setCheckedItems(isChecked ? currentItems.map(item => item.id) : []);
                      }}
                    />
                  </th>
                  <th className="p-[15px] font-normal text-left">Produk</th>
                  <th className="p-[15px] font-normal text-left">Kategori</th>
                  <th className="p-[15px] font-normal text-right">Harga</th>
                  <th className="p-[15px] font-normal w-20">
                    {checkedItems.length > 0 && (
                      <button
                        onClick={handleDeleteSelected}
                        className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 flex justify-center items-center space-x-2"
                      >
                        <p>{checkedItems.length}</p> <FaTrashAlt />
                      </button>
                    )}</th>
                </tr>
              </thead>
              {currentItems.length > 0 ? (
                <tbody>
                  {currentItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-100 text-[14px]">
                      <td className="p-[15px] text-right">
                        <input
                          type="checkbox"
                          className="w-[20px] h-[20px] accent-[#005429]"
                          checked={checkedItems.includes(item.id)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setCheckedItems(prev => {
                              const updated = isChecked
                                ? [...prev, item.id]
                                : prev.filter(id => id !== item.id);
                              setCheckAll(updated.length === currentItems.length);
                              return updated;
                            });
                          }}
                        />

                      </td>
                      <td className="p-[15px]">
                        <div className="flex items-center">
                          <img
                            src={item.imageUrl || "https://via.placeholder.com/100"}
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
                      <td className="p-[15px] text-right">{formatCurrency(item.originalPrice)}</td>
                      <td className="p-[15px]">
                        {/* Dropdown Menu */}
                        <div className="relative text-right">
                          <button
                            className="px-2 bg-white border border-gray-200 hover:bg-green-800 rounded-sm"
                            onClick={() => setOpenDropdown(openDropdown === item.id ? null : item.id)}
                          >
                            <span className="text-xl text-gray-200 hover:text-white">
                              •••
                            </span>
                          </button>
                          {openDropdown === item.id && (
                            <div className="absolute text-left text-gray-500 right-0 top-full mt-2 bg-white border rounded-md shadow-md w-[240px] z-10">
                              <ul className="w-full">
                                {/* <Link
                                  to={`/admin/manage-stock/${item.id}`}
                                  className="bg-transparent flex space-x-[18px] items-center px-[20px] py-[15px] text-sm cursor-pointer hover:bg-gray-100"
                                >
                                  <FaThLarge size={18} />
                                  <span>Kelola Stok</span>
                                </Link>
                                <Link
                                  to={`/admin/manage-price-and-selling-status/${item.id}`}
                                  className="bg-transparent flex space-x-[18px] items-center px-[20px] py-[15px] text-sm cursor-pointer hover:bg-gray-100"
                                >
                                  <FaDollarSign size={18} />
                                  <span>Kelola Harga & Status Jual</span>
                                </Link> */}
                                <Link
                                  to={`/admin/menu-receipt/${item.id}`}
                                  className="bg-transparent flex space-x-[18px] items-center px-[20px] py-[15px] text-sm cursor-pointer hover:bg-gray-100 border-b"
                                >
                                  <FaReceipt size={18} />
                                  <span>Kelola Resep</span>
                                </Link>
                                <Link
                                  to={`/admin/menu-update/${item.id}`}
                                  className="bg-transparent flex space-x-[18px] items-center px-[20px] py-[15px] text-sm cursor-pointer hover:bg-gray-100"
                                >
                                  <FaPencilAlt size={18} />
                                  <span>Edit</span>
                                </Link>
                                <button
                                  className="w-full flex space-x-[18px] items-center px-[20px] py-[15px] text-sm cursor-pointer hover:bg-gray-100"
                                  onClick={() => {
                                    setItemToDelete(item.id);
                                    setIsModalOpen(true);

                                  }}>
                                  <FaTrash size={18} />
                                  <span>Hapus</span>
                                </button>
                                <button
                                  className="w-full flex space-x-[18px] items-center px-[20px] py-[15px] text-sm cursor-pointer hover:bg-gray-100">
                                  {item.isActive === true ? <FaEyeSlash className="text-red-500" /> : <FaEye className="text-[#005429]" />}
                                  <span>{item.isActive === true ? "Matikan" : "Aktifkan"}</span>
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
          {/* <div className="flex justify-end items-center mt-6 gap-2 flex-wrap">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              <FaChevronLeft />
            </button>

            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              // tampilkan hanya 2 sebelum dan 2 setelah halaman sekarang
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => {
                      setOffset((page - 1) * limit);
                    }}
                    className={`px-3 py-1 rounded ${currentPage === page
                      ? "bg-[#005429] text-white"
                      : "bg-gray-100 text-gray-700"
                      }`}
                  >
                    {page}
                  </button>
                );
              }

              // Tambahkan "..." di tempat yang cocok
              if (
                (page === currentPage - 3 && page > 1) ||
                (page === currentPage + 3 && page < totalPages)
              ) {
                return (
                  <span key={page} className="px-2">
                    ...
                  </span>
                );
              }

              return null;
            })}

            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              <FaChevronRight />
            </button>
          </div> */}
          <div className="flex justify-end items-center mt-6 gap-2 flex-wrap">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >

              <FaChevronLeft />
            </button>

            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;

              // Show page numbers for first, last, current ±2
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded border ${currentPage === page
                      ? "bg-[#005429] text-white"
                      : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {page}
                  </button>
                );
              }

              // Show "..." when skipping
              if (
                (page === currentPage - 3 && page > 1) ||
                (page === currentPage + 3 && page < totalPages)
              ) {
                return (
                  <span key={page} className="px-2">
                    ...
                  </span>
                );
              }

              return null;
            })}

            <button
              onClick={() =>
                setCurrentPage(prev =>
                  prev < Math.ceil(menuItems.length / itemsPerPage) ? prev + 1 : prev
                )
              }
              disabled={currentPage >= Math.ceil(menuItems.length / itemsPerPage)}
              className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaChevronRight />
            </button>
          </div>


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

