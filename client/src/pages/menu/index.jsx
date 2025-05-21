import React, { useEffect, useState } from "react";
import { FaBox, FaTag, FaBell, FaUser, FaShoppingBag, FaLayerGroup, FaSquare, FaInfo, FaTrash } from 'react-icons/fa';
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CategoryIndex from "./category";

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
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState("menu");
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const itemsPerPage = 6;

  const queryParams = new URLSearchParams(location.search);
  const categoryFromUrl = queryParams.get('category');
  const selectedFromUrl = queryParams.get('selected');

  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
    if (selectedFromUrl) {
      setSelected(selectedFromUrl);
    }
    fetchMenuItems(categoryFromUrl || "");
    fetchCategories();
  }, [categoryFromUrl, selectedFromUrl]);

  const fetchMenuItems = async (category = "") => {
    try {
      const url = category ? `/api/menu/categories/filter?category=${category}` : "/api/menu/menu-items";
      const response = await axios.get(url);
      setMenuItems(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/menu/categories");
      setCategories(["Semua Kategori", ...response.data.data?.map((category) => category.name || "")]);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    navigate(`/admin/menu?category=${category === "Semua Kategori" ? "" : category}&selected=${selected}`);
  };

  const handleTabChange = (item) => {
    setSelected(item);
    navigate(`/admin/menu?category=${selectedCategory === "Semua Kategori" ? "" : selectedCategory}&selected=${item}`);
  };

  const handleDelete = async (itemId) => {
    try {
      await axios.delete(`/api/menu/menu-items/${itemId}`);
      setMenuItems(menuItems.filter(item => item._id !== itemId));
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === "Semua Kategori" || item.category.some((cat) => cat.toLowerCase() === selectedCategory.toLowerCase());
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <div className="container mx-auto p-4">
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
            className="bg-white text-blue-500 px-4 py-2 rounded border border-blue-500 hover:text-white hover:bg-blue-500 text-[13px]"
          >
            Impor Produk
          </button>
          <button
            onClick={() => console.log('Ekspor Produk')}
            className="bg-white text-blue-500 px-4 py-2 rounded border border-blue-500 hover:text-white hover:bg-blue-500 text-[13px]"
          >
            Ekspor Produk
          </button>
          <Link to="/admin/menu-create" className="bg-blue-500 text-white px-4 py-2 rounded inline-block text-[13px]">
            Tambah Produk
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-4 py-4">
        {["menu", "options", "category", "grabfood"].map((item) => (
          <button
            key={item}
            className={`bg-white border-b-2 py-2 border-b-white hover:border-b-blue-500 focus:outline-none ${selected === item ? "border-blue-500" : ""}`}
            onClick={() => handleTabChange(item)}
          >
            <div className="flex justify-between items-center border-l border-l-gray-200 p-4">
              <div className="flex space-x-4">
                {item === "menu" && <FaBox size={24} className="text-gray-400" />}
                {item === "options" && <FaLayerGroup size={24} className="text-gray-400" />}
                {item === "category" && <FaTag size={24} className="text-gray-400" />}
                {item === "grabfood" && <FaSquare size={24} className="text-gray-400" />}
                <h2 className="text-gray-400 ml-2 text-sm">{item.charAt(0).toUpperCase() + item.slice(1)}</h2>
              </div>
              <div className="text-sm text-gray-400">(18)</div>
            </div>
          </button>
        ))}
      </div>

      {selected === "menu" && (
        <div className="p-4 bg-slate-50">
          <div className="flex space-x-4 p-4 shadow-md bg-white">
            <div className="flex-1">
              <label className="block mb-2 text-[13px] text-gray-400">Lokasi</label>
              <select value={selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)} className="border rounded px-2 py-1 w-full text-sm text-slate-700">
                <option value="Semua Kategori">Semua Outlet</option>
                {categories.filter(category => category !== "Semua Kategori").sort((a, b) => a.localeCompare(b)).map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block mb-2 text-[13px] text-gray-400">Kategori:</label>
              <select value={selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)} className="border rounded px-2 py-1 w-full text-sm text-slate-700">
                <option value="Semua Kategori">Semua Kategori</option>
                {categories.filter(category => category !== "Semua Kategori").sort((a, b) => a.localeCompare(b)).map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block mb-2 text-[13px] text-gray-400">Status Dijual:</label>
              <select value={selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)} className="border rounded px-2 py-1 w-full text-sm text-slate-700">
                <option value="Semua Kategori">Semua Status</option>
                {categories.filter(category => category !== "Semua Kategori").sort((a, b) => a.localeCompare(b)).map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block mb-2 text-[13px] text-gray-400">Cari:</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Produk / SKU / Barcode"
                className="border rounded px-2 py-1 w-full text-sm text-slate-700"
              />
            </div>
          </div>

          {/* Menu Table */}
          <div className="w-full mt-4 shadow-md">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-200">
                  <th className="py-2 px-4 bg-gray-200 text-gray-700 w-16"></th>
                  <th className="py-2 px-4 bg-gray-200 text-gray-700">Produk</th>
                  <th className="py-2 px-4 bg-gray-200 text-gray-700">Kategori</th>
                  <th className="py-2 px-4 bg-gray-200 text-gray-700">Harga</th>
                  <th className="py-2 px-4 bg-gray-200 text-gray-700"></th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-100">
                    <td className="px-4 py-2"></td>
                    <td className="px-4 py-2">
                      <div className="flex items-center">
                        <img src={item.imageURL || "https://via.placeholder.com/100"} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                        <div className="ml-4">
                          <h3 className="text-sm font-bold">{item.name}</h3>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">{item.category.join(", ")}</td>
                    <td className="px-4 py-2">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseFloat(item.price))}
                    </td>
                    <td className="px-4 py-2">
                      {/* Dropdown Menu */}
                      <div className="relative text-right">
                        <button className="px-2 bg-white border border-gray-200 hover:border-none hover:bg-green-800 rounded-sm" onClick={() => setOpenDropdown(openDropdown === item._id ? null : item._id)}>
                          <span className="text-xl text-gray-200 hover:text-white">•••</span>
                        </button>
                        {openDropdown === item._id && (
                          <div className="absolute text-left right-0 top-full mt-2 bg-white border rounded-md shadow-md w-40 z-10">
                            <ul className="py-2">
                              <li className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">
                                <Link to={`/admin/menu/${item._id}`} className="block bg-transparent">View</Link>
                              </li>
                              <li className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">
                                <Link to={`/admin/menu-update/${item._id}`} className="block bg-transparent">Edit</Link>
                              </li>
                              <li className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">
                                <button onClick={() => {
                                  setItemToDelete(item._id);
                                  setIsModalOpen(true);
                                }}>Delete</button>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

       {/* Pagination */}
          <div className="flex justify-center mt-4">
            {(() => {
              const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
              const pageLimit = 5;
              let startPage = Math.max(1, currentPage - Math.floor(pageLimit / 2));
              let endPage = startPage + pageLimit - 1;

              if (endPage > totalPages) {
                endPage = totalPages;
                startPage = Math.max(1, endPage - pageLimit + 1);
              }

              return Array.from({ length: endPage - startPage + 1 }, (_, i) => (
                <button
                  key={startPage + i}
                  onClick={() => setCurrentPage(startPage + i)}
                  className={`px-4 py-2 mx-1 rounded ${currentPage === startPage + i ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
                >
                  {startPage + i}
                </button>
              ));
            })()}
          </div>
        </div>
      )}

      {selected === "category" && (
        <div>
          <CategoryIndex />
        </div>
      )}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => handleDelete(itemToDelete)}
      />
    </div>
  );
};

export default Menu;  