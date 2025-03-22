import React, { useEffect, useState } from "react";
import { FaBox, FaLayerGroup, FaTag } from 'react-icons/fa';
import axios from "axios";
import CreateTopping from "./opsi/create";
import UpdateMenu from "./update";
import DeleteMenus from "./delete";
import CategoryMenu from "./category";
import { Link } from "react-router-dom";

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState("menu");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingMenu, setEditingMenu] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null); // Menyimpan status dropdown
  const itemsPerPage = 6; // Number of items per page

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get("/api/menu/menu-items");


      setMenuItems(response.data?.data || []);

      // Menambahkan kategori unik
      const uniqueCategories = [
        "Semua Kategori",
        ...new Set(response.data?.data.flatMap((item) => item.category)),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  // Fungsi untuk menangani klik pada item grid
  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  const toggleDropdown = (_id) => {
    if (openDropdown === _id) {
      setOpenDropdown(null); // Jika dropdown sudah terbuka, tutup
    } else {
      setOpenDropdown(_id); // Buka dropdown yang sesuai
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Filter menu items berdasarkan kategori dan pencarian menu
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
        {/* Grid Item 1: menu */}
        <div
          className={`flex items-center bg-white border-b-2 border-white hover:border-b-blue-500 focus:outline-none p-4 cursor-pointer border-l-2 border-l-gray-200 ${selectedItem === "menu" ? "border-blue-500" : ""
            }`}
          onClick={() => handleItemClick("menu")}
        >
          <FaBox size={24} />
          <h2 className="text-lg font-bold ml-2">Menu</h2>
        </div>

        {/* Grid Item 3: Category */}
        <div
          className={`flex items-center bg-white border-b-2 border-b-white hover:border-b-blue-500 focus:outline-none p-4 cursor-pointer border-l-2 border-l-gray-200 ${selectedItem === "kategori" ? "border-blue-500" : ""
            }`}
          onClick={() => handleItemClick("category")}
        >
          <FaTag size={24} />
          <h2 className="text-lg font-bold ml-2">Kategori</h2>
        </div>
      </div>
      <div className="w-full pb-6">
        {selectedItem === "menu" && (
          <div>
            <div className="flex justify-between py-2 mb-6">
              <h1 className="text-3xl font-bold">Menu</h1>
              <div className="flex space-x-4">
                {/* Export menu Button */}
                <button
                  onClick={() => console.log('Impor Menu')}
                  className="bg-white text-blue-500 px-4 py-2 rounded border border-blue-500 hover:text-white hover:bg-blue-500"
                >
                  Impor Menu
                </button>

                {/* Import menu Button */}
                <button
                  onClick={() => console.log('Ekspor Menu')}
                  className="bg-white text-blue-500 px-4 py-2 rounded border border-blue-500 hover:text-white hover:bg-blue-500"
                >
                  Ekspor Menu
                </button>

                {/* Button to create a new item */}
                <Link
                  to="/admin/menu-create" // Specify the route you want to navigate to
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
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                >
                  {/* Menampilkan "Semua Kategori" di atas */}
                  <option value="Semua Kategori">Semua Kategori</option>

                  {/* Mengurutkan kategori lainnya secara alfabet dan menampilkan */}
                  {categories
                    .filter(category => category !== "Semua Kategori") // Menghilangkan "Semua Kategori" dari daftar kategori
                    .sort((a, b) => a.localeCompare(b)) // Mengurutkan kategori secara alfabet
                    .map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                </select>
              </div>

              {/* Filter by Outlet */}
              <div className="flex-1">
                <label className="block mb-2 font-medium text-lg">Outlet:</label>
                <select
                  className="border rounded px-2 py-1 w-full"
                >
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

            {/* Tabel menu */}
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
                        {item.category.map((category, index) => {
                          // Memeriksa apakah kategori adalah 'recommended' atau 'breakfast'
                          const isRecommended = category.toLowerCase() === "recommended";
                          const isBreakfast = category.toLowerCase() === "breakfast";

                          // Tentukan kelas dan gaya berdasarkan kategori
                          let categoryClass = "";
                          let style = {};

                          if (isRecommended) {
                            categoryClass = "bg-green-500 text-white px-2 py-1 rounded"; // Warna hijau untuk recommended
                            style.fontWeight = "bold";
                          } else if (isBreakfast) {
                            categoryClass = "bg-amber-800 text-white px-2 py-1 rounded"; // Warna coklat untuk breakfast
                          }

                          return (
                            <span
                              key={index}
                              className={`inline-block mr-2 ${categoryClass}`} // Kelas untuk kategori tertentu
                              style={style}
                            >
                              {category}
                            </span>
                          );
                        })}
                      </td>
                      <td className="px-4 py-2">{item.price}</td>
                      <td className="px-4 py-2">
                        {/* Dropdown */}
                        <div className="relative text-right">
                          <button
                            className="px-2 bg-white border border-gray-200 hover:border-none hover:bg-green-800 rounded-sm"
                            onClick={() => toggleDropdown(item._id)}
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
                                    to={`/admin/menu-update/${item._id}`} // Navigate to the edit page for the specific item
                                    className="block bg-transparent"
                                  >
                                    Edit
                                  </Link>

                                  {editingMenu && (
                                    <UpdateMenu
                                      menu={editingMenu}
                                      fetchMenuItems={fetchMenuItems}
                                      onCancel={() => setEditingMenu(null)}
                                    />
                                  )}
                                </li>
                                <li className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">
                                  <DeleteMenus
                                    id={item._id}
                                    fetchMenus={fetchMenuItems}
                                  />
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
                  className={`px-4 py-2 mx-1 rounded ${currentPage === i + 1
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
        {selectedItem === "category" && (
          <div>
            {/* Options */}
            <CategoryMenu />
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;