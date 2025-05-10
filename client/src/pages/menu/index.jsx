import React, { useEffect, useState } from "react";
import { FaBox, FaTag } from 'react-icons/fa';
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CategoryIndex from "./category";
import { FaTrash } from 'react-icons/fa';

const ConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-md text-center w-96"> {/* Set width to 96 (24rem) for medium size */}
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
  const navigate = useNavigate(); // Use the new hook
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setselected] = useState("menu");
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState(null); // Menyimpan status dropdown
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const itemsPerPage = 6; // Number of items per page

  // Get category and selected from URL query
  const queryParams = new URLSearchParams(location.search);
  const categoryFromUrl = queryParams.get('category');
  const selectedFromUrl = queryParams.get('selected');

  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl); // Set the selected category from URL
    }
    if (selectedFromUrl) {
      setselected(selectedFromUrl); // Set selected from URL
    }
    fetchMenuItems(categoryFromUrl || ""); // Fetch items based on selected category
    fetchCategories(); // Fetch categories from category table
  }, [categoryFromUrl, selectedFromUrl]);

  // Fetch menu items based on category
  const fetchMenuItems = async (category = "") => {
    try {
      let url = "/api/menu/menu-items";
      if (category) {
        url = `/api/menu/categories/filter?category=${category}`; // Adjust the endpoint based on your backend API
      }
      const response = await axios.get(url);
      setMenuItems(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  // Fetch categories from the category table
  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/menu/categories"); // Adjust this URL based on your backend API
      setCategories(["Semua Kategori", ...response.data.data?.map((category) => category.name || "")]); // Assuming each category has a `name` field
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    // Update the URL with the selected category using `navigate`
    navigate(`/admin/menu?category=${category === "Semua Kategori" ? "" : category}&selected=${selected}`);
  };

  const handleTabChange = (item) => {
    setselected(item);
    // Update the URL to reflect the selected tab
    navigate(`/admin/menu?category=${selectedCategory === "Semua Kategori" ? "" : selectedCategory}&selected=${item}`);
  };

  const handleDelete = async (itemId) => {
    try {
      await axios.delete(`/api/menu/menu-items/${itemId}`); // Adjust the endpoint based on your backend API
      setMenuItems(menuItems.filter(item => item._id !== itemId)); // Update the state to remove the deleted item
      setIsModalOpen(false); // Close the modal
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  // Filter menu items based on category and search query
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "Semua Kategori" ||
      item.category.some((cat) => cat.toLowerCase() === selectedCategory.toLowerCase());
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 my-4 gap-4 mb-4 border-b border-t py-4">
        <div
          className={`flex items-center bg-white border-b-2 border-white hover:border-b-blue-500 focus:outline-none p-4 cursor-pointer border-l-2 border-l-gray-200 ${selected === "menu" ? "border-blue-500" : ""}`}
          onClick={() => handleTabChange("menu")}
        >
          <FaBox size={24} />
          <h2 className="text-lg font-bold ml-2">Menu</h2>
        </div>

        <div
          className={`flex items-center bg-white border-b-2 border-b-white hover:border-b-blue-500 focus:outline-none p-4 cursor-pointer border-l-2 border-l-gray-200 ${selected === "category" ? "border-blue-500" : ""}`}
          onClick={() => handleTabChange("category")}
        >
          <FaTag size={24} />
          <h2 className="text-lg font-bold ml-2">Kategori</h2>
        </div>
      </div>

      <div className="w-full pb-6">

        {selected === "menu" && (
          <div>
            <div className="flex justify-between py-2 mb-6">
              <h1 className="text-3xl font-bold">Menu</h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => console.log('Impor Menu')}
                  className="bg-white text-blue-500 px-4 py-2 rounded border border-blue-500 hover:text-white hover:bg-blue-500"
                >
                  Impor Menu
                </button>

                <button
                  onClick={() => console.log('Ekspor Menu')}
                  className="bg-white text-blue-500 px-4 py-2 rounded border border-blue-500 hover:text-white hover:bg-blue-500"
                >
                  Ekspor Menu
                </button>

                <Link
                  to="/admin/menu-create"
                  className="bg-blue-500 text-white px-4 py-2 rounded inline-block"
                >
                  Tambah Menu
                </Link>
              </div>
            </div>

            <div className="flex space-x-4 mb-4">
              {/* Filter by Category */}
              <div className="flex-1">
                <label className="block mb-2 font-medium text-lg">Kategori:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                >

                  {/* Add "Semua Kategori" as an option */}
                  <option value="Semua Kategori">Semua Kategori</option>

                  {categories
                    .filter(category => category !== "Semua Kategori")
                    .sort((a, b) => a.localeCompare(b))
                    .map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                </select>
              </div>

              {/* Search by Menu */}
              <div className="flex-1">
                <label className="block mb-2 font-medium text-lg">Cari:</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari Menu..."
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
            </div>

            {/* Menu Table */}
            <div className="w-full mt-4 shadow-md rounded">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="py-2 px-4 bg-gray-200 text-gray-700 w-16"></th>
                    <th className="py-2 px-4 bg-gray-200 text-gray-700">Nama</th>
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
                          <img
                            src={item.imageURL || "https://via.placeholder.com/100"}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="ml-4">
                            <h3 className="text-sm font-bold">{item.name}</h3>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {item.category.join(", ")}
                      </td>
                      <td className="px-4 py-2">{item.price}</td>
                      <td className="px-4 py-2">
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
                            <div className="absolute text-left right-0 top-full mt-2 bg-white border rounded-md shadow-md w-40 z-10">
                              <ul className="py-2">
                                <li className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">
                                  <Link
                                    to={`/admin/menu/${item._id}`}
                                    className="block bg-transparent"
                                  >
                                    View
                                  </Link>
                                </li>
                                <li className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">
                                  <Link
                                    to={`/admin/menu-update/${item._id}`}
                                    className="block bg-transparent"
                                  >
                                    Edit
                                  </Link>
                                </li>
                                <li className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">
                                  <button onClick={() => {
                                    setItemToDelete(item._id);
                                    setIsModalOpen(true);
                                  }}>
                                    Delete
                                  </button>
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
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-4 py-2 mx-1 rounded ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {selected === "category" && (
          <div>
            <CategoryIndex />
          </div>
        )}
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
