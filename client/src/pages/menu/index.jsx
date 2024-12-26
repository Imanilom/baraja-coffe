import React, { useEffect, useState } from "react";
import axios from "axios";
import CreateMenu from "./create";
import { Link } from "react-router-dom";

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingMenu, setEditingMenu] = useState(null);
  const itemsPerPage = 6; // Jumlah item per halaman

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get("/api/menu-items");
      setMenuItems(response.data?.data || []);
      const uniqueCategories = [
        "all",
        ...new Set(response.data?.data.map((item) => item.category)),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  const deleteMenuItem = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this menu item?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`/api/menu-items/${id}`);
      fetchMenuItems();
    } catch (error) {
      console.error("Error deleting menu item:", error);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const filteredItems =
    selectedCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Menu Items</h1>

      {/* Filter berdasarkan kategori */}
      <div className="mb-4">
        <label className="mr-2 font-medium">Filter by Category:</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border rounded px-2 py-1"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Tombol untuk membuat item baru */}
      <button
        onClick={() => setEditingMenu("create")}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Add Menu Item
      </button>

      {editingMenu === "create" && (
        <CreateMenu
          fetchMenuItems={fetchMenuItems}
          onCancel={() => setEditingMenu(null)}
        />
      )}

      {/* Grid untuk menampilkan kartu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {currentItems.map((item) => (
          <div
            key={item._id}
            className="border rounded-lg shadow-md p-4 bg-white"
          >
            <img
              src={item.imageURL || "https://placehold.co/600x400"}
              alt={item.name}
              className="h-40 w-full object-cover rounded-md mb-4"
            />
            <h2 className="text-lg font-bold">{item.name}</h2>
            <p className="text-gray-600">{item.description}</p>
            <p className="text-gray-800 font-medium mt-2">Price: ${item.price}</p>
            <p className="text-gray-500 text-sm">Category: {item.category}</p>
            <p className="text-gray-500 text-sm">Stock: {item.stock}</p>
            <div className="flex justify-between mt-4">
              <Link
                to={`/menu-update/${item._id}`}
                className="bg-yellow-500 text-white px-4 py-2 rounded"
              >
                Edit
              </Link>
              <button
                onClick={() => deleteMenuItem(item._id)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-4 py-2 mx-1 rounded ${
              currentPage === i + 1
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Menu;
