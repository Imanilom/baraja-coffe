import React, { useEffect, useState, useRef } from "react";
import Select from "react-select";
import { FaBox, FaTag, FaBell, FaUser, FaShoppingBag, FaPencilAlt, FaTrash, FaReceipt, FaTrashAlt, FaChevronRight, FaChevronLeft, FaEyeSlash, FaEye, FaPlus, FaDownload } from 'react-icons/fa';
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Header from "../admin/header";
import ConfirmationModalActive from "./confirmationModalAction";
import MessageAlertMenu from "../../components/messageAlert";
import CategoryTabs from "./filters/categorytabs";

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
      borderColor: '#d1d5db',
      minHeight: '34px',
      fontSize: '13px',
      color: '#6b7280',
      boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none',
      '&:hover': {
        borderColor: '#9ca3af',
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#6b7280',
    }),
    input: (provided) => ({
      ...provided,
      color: '#6b7280',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
      fontSize: '13px',
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: '13px',
      color: '#374151',
      backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white',
      cursor: 'pointer',
    }),
  };

  const location = useLocation();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [category, setCategory] = useState([]);
  const [status, setStatus] = useState([]);
  const [newStatus, setNewStatus] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [outlets, setOutlets] = useState([]);
  const [error, setError] = useState(null);
  const [checkedItems, setCheckedItems] = useState([]);
  const [checkAll, setCheckAll] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [loading, setLoading] = useState(true);

  // State sementara (input filter)
  const [tempSelectedOutlet, setTempSelectedOutlet] = useState("");
  const [tempSelectedStatus, setTempSelectedStatus] = useState("");
  const [tempSearch, setTempSearch] = useState("");

  // State final (filter aktif)
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
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
      setOutlets([]);
      setCategory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedOutlet, selectedCategory, selectedStatus, searchQuery]);

  const outletOptions = [
    { value: '', label: 'Outlet' },
    ...outlets.map(outlet => ({ value: outlet.name, label: outlet.name }))
  ];

  const categoryOptions = [
    { value: '', label: 'Semua Kategori' },
    ...category.map(category => ({ value: category.name, label: category.name }))
  ];

  const statusOptions = [
    { value: '', label: 'Status' },
    { value: true, label: 'Aktif' },
    { value: false, label: 'Tidak Aktif' },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    const matchOutlet =
      selectedOutlet === '' ||
      item.availableAt.some(outlet => outlet.name === selectedOutlet);
    const matchCategory = selectedCategory === '' || item.category.name === selectedCategory;
    const matchStatus = selectedStatus === '' || item.isActive === selectedStatus;

    const matchSearch =
      searchQuery === '' ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchOutlet && matchCategory && matchStatus && matchSearch;
  });

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

  const handleUpdate = async (itemId, newStatus) => {
    setLoading(true); // ⬅️ mulai loading
    try {
      setTimeout(async () => {
        try {
          await axios.put(`/api/menu/menu-items/activated/${itemId}`, { isActive: newStatus });
          navigate("/admin/menu", {
            state: { success: `Menu berhasil ${newStatus ? "diaktifkan" : "dinonaktifkan"}` },
          });
          fetchData();
        } catch (error) {
          console.error("Error updating menu:", error);
        } finally {
          setLoading(false); // ⬅️ stop loading setelah selesai
        }
      }, 2000);
    } catch (error) {
      console.error("Gagal update status:", error);
      alert("Terjadi kesalahan saat update status");
    }
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
      setCheckedItems([]);
      setCheckAll(false);
      fetchData();
    } catch (error) {
      console.error("Gagal menghapus:", error);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
      </div>
    );
  }

  // Error State
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
      {/* Header */}
      <Header />
      {/* Filter Section */}
      {/* <div className="px-3 py-2 flex flex-wrap justify-between items-center border-b bg-white">
        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
          <FaShoppingBag size={20} className="text-gray-400 inline-block" />
          <p className="text-gray-400 inline-block">Produk</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
      </div> */}

      <div className="flex justify-between items-center px-6 py-3 my-3 bg-white">
        <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
          Menu
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => console.log('Ekspor Produk')}
            className="flex items-center gap-2 bg-white text-[#005429] px-4 py-2 rounded border border-[#005429] hover:text-white hover:bg-[#005429] text-[13px]"
          >
            <FaDownload /> Ekspor
          </button>

          <Link
            to="/admin/menu-create"
            className="bg-[#005429] text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
          >
            <FaPlus /> Tambah
          </Link>
        </div>
      </div>

      <MessageAlertMenu />

      {/* <div className="px-[15px] pb-[15px]">
        <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-[10px] items-end rounded bg-slate-50 shadow-slate-200 shadow-md">

          <div className="flex flex-col col-span-1">
            <label className="text-[13px] mb-1 text-gray-500">Outlet</label>
            <Select
              options={outletOptions}
              value={outletOptions.find(option => option.value === tempSelectedOutlet) || outletOptions[0]}
              onChange={(selected) => setTempSelectedOutlet(selected.value)}
              styles={customStyles}
              isSearchable
            />
          </div>

          <div className="flex flex-col col-span-1">
            <label className="text-[13px] mb-1 text-gray-500">Status Dijual</label>
            <Select
              options={statusOptions}
              value={statusOptions.find(option => option.value === tempSelectedStatus) || statusOptions[0]}
              onChange={(selected) => setTempSelectedStatus(selected.value)}
              styles={customStyles}
              isSearchable
            />
          </div>

          <div className="flex flex-col col-span-1">
            <label className="text-[13px] mb-1 text-gray-500">Cari</label>
            <input
              type="text"
              placeholder="Produk / SKU / Barkode"
              value={tempSearch}
              onChange={(e) => setTempSearch(e.target.value)}
              className="text-[13px] border py-[8.2px] pr-[25px] pl-[12px] rounded"
            />
          </div>
        </div>
      </div> */}

      <div className="px-[15px]">
        <CategoryTabs
          categoryOptions={categoryOptions}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        <div className="flex items-center justify-between gap-3 py-3">
          {/* Search */}
          <div className="flex items-center flex-1 max-w-sm border rounded-lg px-3 py-2 bg-white shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-400 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z"
              />
            </svg>
            <input
              type="text"
              placeholder="Cari ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-sm border-none focus:ring-0 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">

            <Select
              options={outletOptions}
              value={outletOptions.find(option => option.value === selectedOutlet) || outletOptions[0]}
              onChange={(selected) => setSelectedOutlet(selected.value)}
              styles={customStyles}
              isSearchable
            />

            <Select
              options={statusOptions}
              value={statusOptions.find(option => option.value === selectedStatus) || statusOptions[0]}
              onChange={(selected) => setSelectedStatus(selected.value)}
              styles={customStyles}
              isSearchable
            />
          </div>
        </div>
      </div>

      {/* Menu Table */}
      <div className="w-full">
        <div className="overflow-auto border rounded-lg mx-[15px]">
          <table className="w-full table-auto text-gray-500">
            <thead>
              <tr className="text-sm border-b">
                <th className="p-3 font-normal text-center w-10">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-[#005429]"
                    checked={checkAll}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setCheckAll(isChecked);
                      setCheckedItems(isChecked ? currentItems.map(item => item.id) : []);
                    }}
                  />
                </th>
                <th className="py-[15px] font-normal text-left">Produk</th>
                <th className="py-[15px] font-normal text-left">Kategori</th>
                <th className="py-[15px] font-normal text-left">Status</th>
                <th className="py-[15px] font-normal text-right">Harga</th>
                <th className="py-[15px] font-normal w-20">
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
              <tbody className="divide-y divide-gray-200 text-sm">
                {currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    {/* Checkbox */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-[#005429] rounded cursor-pointer"
                        checked={checkedItems.includes(item.id)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setCheckedItems((prev) => {
                            const updated = isChecked
                              ? [...prev, item.id]
                              : prev.filter((id) => id !== item.id);
                            setCheckAll(updated.length === currentItems.length);
                            return updated;
                          });
                        }}
                      />
                    </td>

                    {/* Image + Name */}
                    <td className="py-2 w-2/6">
                      <div className="flex items-center">
                        <img
                          src={item.imageUrl || "https://via.placeholder.com/100"}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="ml-3">
                          <p className="font-medium text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-500">ID: {item.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-2 text-gray-700 w-1/6">
                      {Array.isArray(item.category)
                        ? item.category.map((category) => category.name).join(", ")
                        : item.category?.name || "-"}
                    </td>

                    <td className="py-2 text-gray-700 w-1/6">
                      {/* Toggle Aktif / Tidak Aktif */}
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <span
                          className={`text-xs font-medium ${item.isActive ? "text-green-900" : "text-gray-500"
                            }`}
                        >
                          {item.isActive ? "Aktif" : "Tidak Aktif"}
                        </span>
                        <div className="relative inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={item.isActive}
                            // onChange={() => handleUpdate(item.id, item.isActive)}
                            onChange={() => {
                              setSelectedMenu(item);
                              setNewStatus(!item.isActive);
                              setIsConfirmOpen(true);
                            }}
                            className="sr-only peer"
                          />
                          {/* Background toggle */}
                          <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-900 transition-colors"></div>
                          {/* Lingkaran slider */}
                          <div className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
                        </div>
                      </label>
                    </td>

                    {/* Price */}
                    <td className="py-2 text-right font-medium text-gray-900 w-1/6">
                      {formatCurrency(item.originalPrice)}
                    </td>

                    {/* Actions */}
                    <td className="py-2 w-1/6">
                      <div className="flex items-center justify-end space-x-3">
                        {/* Resep */}
                        <Link
                          to={`/admin/menu-receipt/${item.id}`}
                          className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
                          title="Kelola Resep"
                        >
                          <FaReceipt size={16} />
                        </Link>

                        {/* Edit */}
                        <Link
                          to={`/admin/menu-update/${item.id}`}
                          className="p-2 rounded-md hover:bg-gray-100 text-green-900"
                          title="Edit"
                        >
                          <FaPencilAlt size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-500">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              </tbody>
            )}

          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-end mx-3 items-center mt-6 gap-2 flex-wrap">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-2 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="px-2 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaChevronRight />
        </button>
      </div>


      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => handleDelete(itemToDelete)}
      />

      <ConfirmationModalActive
        isOpen={isConfirmOpen}
        menu={selectedMenu}
        newStatus={newStatus}
        onClose={() => {
          setIsConfirmOpen(false);
          setSelectedMenu(null);
          setNewStatus(null);
        }}
        onConfirm={async () => {
          await handleUpdate(selectedMenu.id, newStatus);
          setIsConfirmOpen(false);
          setSelectedMenu(null);
          setNewStatus(null);
        }}
      />
    </div>
  );
};

export default Menu;
