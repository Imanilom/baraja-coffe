import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get("/api/menu/menu-items");
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
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this menu item?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`/api/menu/menu-items/${id}`);
      fetchMenuItems();
    } catch (error) {
      console.error("Error deleting menu item:", error);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const filteredItems = menuItems.filter(
    (item) =>
      selectedCategory === "all" || item.category === selectedCategory
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Menu Items</h1>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-8">
        <div className="flex items-center space-x-2">
          <label className="font-medium">Filter by Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to="/menu-create"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-200"
          >
            Add Menu Item
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {currentItems.map((item) => (
          <div
            key={item._id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <img
              src={item.imageURL || "https://placehold.co/600x400/png"}
              alt={item.name}
              className="h-48 w-full object-cover rounded-t-lg"
            />
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-2">{item.name}</h2>
              <p className="text-gray-600 mb-4">{item.description}</p>
              <div className="flex items-center mb-4">
                <span className="text-gray-500">Price:</span>
                <div className="ml-2">
                  {item.promotionTitle ? (
                    <>
                      <span className="line-through text-gray-400 mr-2">
                        {item.price}
                      </span>
                      <span className="text-green-500 font-bold">
                        {item.discountedPrice}
                      </span>
                    </>
                  ) : (
                    <span className="font-medium text-gray-800">
                      {item.price}
                    </span>
                  )}
                </div>
              </div>
              {item.promotionTitle && (
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm mb-4">
                  Promotion: {item.promotionTitle} ({item.discount}%)
                </div>
              )}
              <div className="flex items-center mb-4">
                <span className="text-gray-500">Category:</span>
                <span className="bg-gray-100 px-2 py-1 rounded text-sm ml-2">
                  {item.category}
                </span>
              </div>
              <div className="flex justify-between mt-4">
                <Link
                  to={`/update/${item._id}`}
                  className="bg-yellow-400 text-white px-4 py-2 rounded-lg hover:bg-yellow-500 transition duration-200"
                >
                  Edit
                </Link>
                <button
                  onClick={() => deleteMenuItem(item._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-4 py-2 mx-1 rounded-full ${
              currentPage === i + 1
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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