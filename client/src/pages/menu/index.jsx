// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import CreateMenu from "./create";
// import { Link } from "react-router-dom";

// const Menu = () => {
//   const [menuItems, setMenuItems] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState("all");
//   const [selectedItems, setSelectedItems] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [editingMenu, setEditingMenu] = useState(null);
//   const [openDropdown, setOpenDropdown] = useState(null); // Menyimpan status dropdown
//   const itemsPerPage = 6; // Number of items per page

//   const fetchMenuItems = async () => {
//     try {
//       const response = await axios.get("/api/menu/menu-items");
//       setMenuItems(response.data?.data || []);

//       const uniqueCategories = [
//         "all",
//         ...new Set(response.data?.data.map((item) => item.category)),
//       ];
//       setCategories(uniqueCategories);
//     } catch (error) {
//       console.error("Error fetching menu items:", error);
//     }
//   };

//   const deleteMenuItem = async (id) => {
//     const confirmDelete = window.confirm(
//       "Are you sure you want to delete this menu item?"
//     );
//     if (!confirmDelete) return;

//     try {
//       await axios.delete(`/api/menu-items/${id}`);
//       fetchMenuItems();
//     } catch (error) {
//       console.error("Error deleting menu item:", error);
//     }
//   };

//   const handleCheckboxChange = (e, item) => {
//     const checked = e.target.checked;
//     setSelectedItems((prevSelectedItems) => {
//       if (checked) {
//         return [...prevSelectedItems, item];
//       } else {
//         return prevSelectedItems.filter((i) => i !== item);
//       }
//     });
//   };

//   const toggleDropdown = (_id) => {
//     if (openDropdown === _id) {
//       setOpenDropdown(null); // Jika dropdown sudah terbuka, tutup
//     } else {
//       setOpenDropdown(_id); // Buka dropdown yang sesuai
//     }
//   };

//   useEffect(() => {
//     fetchMenuItems();
//   }, []);

//   const filteredItems =
//     selectedCategory === "all"
//       ? menuItems
//       : menuItems.filter((item) => item.category === selectedCategory);

//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

//   const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-4">Menu Items</h1>

//       {/* Filter by category */}
//       <div className="mb-4">
//         <label className="mr-2 font-medium">Filter by Category:</label>
//         <select
//           value={selectedCategory}
//           onChange={(e) => setSelectedCategory(e.target.value)}
//           className="border rounded px-2 py-1"
//         >
//           {categories.map((category) => (
//             <option key={category} value={category}>
//               {category}
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* Button to create a new item */}
//       <button
//         onClick={() => setEditingMenu("create")}
//         className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
//       >
//         Add Menu Item
//       </button>

//       {editingMenu === "create" && (
//         <CreateMenu
//           fetchMenuItems={fetchMenuItems}
//           onCancel={() => setEditingMenu(null)}
//         />
//       )}

//       {/* Grid to display items */}
//       {/* <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//         {currentItems.map((item) => (
//           <div
//             key={item._id}
//             className="border rounded-lg shadow-md p-4 bg-white"
//           >
//             <img
//               src={item.imageURL || "https://placehold.co/600x400"}
//               alt={item.name}
//               className="h-40 w-full object-cover rounded-md mb-4"
//             />
//             <h2 className="text-lg font-bold">{item.name}</h2>
//             <p className="text-gray-600">{item.description}</p>
//             <p className="text-gray-800 font-medium mt-2">
//               Price:{" "}IDR {""}
//               {item.promotionTitle ? (
//                 <>
//                   <span className="line-through text-gray-500">
//                     {item.price}
//                   </span>{" "}
//                   <span className="text-green-500">{item.discountedPrice}</span>
//                 </>
//               ) : (
//                 item.price
//               )}
//             </p>
//             {item.promotionTitle && (
//               <p className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm mt-2">
//                 Promotion: {item.promotionTitle} ({item.discount}% off)
//               </p>
//             )}
//             <p className="text-gray-500 text-sm">Category: {item.category}</p>
//             <div className="flex justify-between mt-4">
//               <Link
//                 to={`/menu-update/${item._id}`}
//                 className="bg-yellow-500 text-white px-4 py-2 rounded"
//               >
//                 Edit
//               </Link>
//               <button
//                 onClick={() => deleteMenuItem(item._id)}
//                 className="bg-red-500 text-white px-4 py-2 rounded"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         ))}
//       </div> */}

//       <div className="w-full">
//         <table className="w-full table-auto">
//           <thead>
//             <tr className="bg-gray-200">
//               <th className="px-4 py-2 w-16"></th>
//               <th className="px-4 py-2">Name</th>
//               <th className="px-4 py-2">Kategori</th>
//               <th className="px-4 py-2">Harga</th>
//               <th className="px-4 py-2"></th>
//             </tr>
//           </thead>
//           <tbody>
//             {currentItems.map((item) => (
//               <tr key={item._id} className="hover:bg-gray-100">
//                 <td className="px-4 py-2">
//                   <input
//                     type="checkbox"
//                     checked={selectedItems.includes(item)}
//                     onChange={(e) => handleCheckboxChange(e, item)}
//                   />
//                 </td>
//                 <td className="px-4 py-2">
//                   <div className="flex items-center">
//                     <img
//                       src={item.imageURL || "https://via.placeholder.com/100"}
//                       alt={item.name}
//                       className="w-16 h-16 object-cover rounded-lg"
//                     />
//                     <div className="ml-4">
//                       <h3 className="text-sm font-bold">{item.name}</h3>
//                     </div>
//                   </div>
//                 </td>
//                 <td className="px-4 py-2">{item.category}</td>
//                 <td className="px-4 py-2">{item.price}</td>
//                 <td className="px-4 py-2">
//                   {/* Dropdown */}
//                   <div className="relative text-right">
//                     <button className="px-2 bg-white border border-gray-200 hover:border-none hover:bg-green-800 rounded-sm"
//                       onClick={() => toggleDropdown(item._id)} // Klik untuk membuka/menutup dropdown
//                     >
//                       <span className="text-xl text-gray-200 hover:text-white">•••</span>
//                     </button>
//                     {openDropdown === item._id && (
//                       <div className="absolute text-left right-0 top-full mt-2 bg-white border rounded-md shadow-md w-40 z-10">
//                         <ul className="py-2">
//                           <li className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">
//                             Edit
//                           </li>
//                           <li className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">
//                             Delete
//                           </li>
//                           <li className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">
//                             View
//                           </li>
//                         </ul>
//                       </div>
//                     )}
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         {/* <div className="mt-4">
//         <h3 className="text-lg font-semibold">Selected Items:</h3>
//         <ul>
//           {selectedItems.map((item, index) => (
//             <li key={index}>
//               {item.name}: {item.description}
//             </li>
//           ))}
//         </ul>
//       </div> */}
//       </div>

//       {/* Pagination */}
//       <div className="flex justify-center mt-4">
//         {Array.from({ length: totalPages }, (_, i) => (
//           <button
//             key={i + 1}
//             onClick={() => setCurrentPage(i + 1)}
//             className={`px-4 py-2 mx-1 rounded ${currentPage === i + 1
//               ? "bg-blue-500 text-white"
//               : "bg-gray-200 text-gray-700"
//               }`}
//           >
//             {i + 1}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Menu;

import React, { useEffect, useState } from "react";
import { FaBox, FaLayerGroup, FaTag } from 'react-icons/fa';
import axios from "axios";
import CreateTopping from "./opsi/create";
import UpdateMenu from "./update";
import OpsiMenu from "./opsi";
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

      // console.log(response.data.data);

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

  const fetchToppingItems = async () => {
    try {
      const response = await axios.get("/api/menu/toppings");
      setMenuItems(response.data?.data || []);
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

  const handleCheckboxChange = (e, item) => {
    const checked = e.target.checked;
    setSelectedItems((prevSelectedItems) => {
      if (checked) {
        return [...prevSelectedItems, item];
      } else {
        return prevSelectedItems.filter((i) => i !== item);
      }
    });
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

  console.log(menuItems);

  // Filter menu items berdasarkan kategori dan pencarian menu
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "Semua Kategori" ||
      item.category.some((cat) => cat.toLowerCase() === selectedCategory.toLowerCase());
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  console.log(filteredItems);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between border-t border-b border-gray-200 py-2">
        <h1 className="text-2xl font-bold">Menu</h1>
        {selectedItem === "menu" && (
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
              to="/menu-create" // Specify the route you want to navigate to
              className="bg-blue-500 text-white px-4 py-2 rounded inline-block"
            >
              Tambah Menu
            </Link>

            {/* {editingMenu === "createMenu" && (
              <CreateMenu
                fetchMenuItems={fetchMenuItems}
                onCancel={() => setEditingMenu(null)}
              />
            )} */}
          </div>
        )}
        {selectedItem === "opsi" && (
          <div>
            {/* Button to create a new opsi */}
            <button
              onClick={() => setEditingMenu("createOpsi")}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Tambah Topping
            </button>

            {editingMenu === "createOpsi" && (
              <CreateTopping
                fetchMenuItems={fetchToppingItems}
                onCancel={() => setEditingMenu(null)}
              />
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 my-4 gap-4">
        {/* Grid Item 1: menu */}
        <div
          className={`flex items-center bg-white border-b-2 border-white hover:border-b-blue-500 focus:outline-none p-4 cursor-pointer border-l-2 border-l-gray-200 ${selectedItem === "menu" ? "border-blue-500" : ""
            }`}
          onClick={() => handleItemClick("menu")}
        >
          <FaBox size={24} />
          <h2 className="text-lg font-bold ml-2">Menu</h2>
        </div>

        {/* Grid Item 2: Opsi */}
        <div
          className={`flex items-center bg-white border-b-2 border-b-white hover:border-b-blue-500 focus:outline-none p-4 cursor-pointer border-l-2 border-l-gray-200 ${selectedItem === "opsi" ? "border-blue-500" : ""
            }`}
          onClick={() => handleItemClick("opsi")}
        >
          <FaLayerGroup size={24} />
          <h2 className="text-lg font-bold ml-2">Topping</h2>
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
            <div className="flex space-x-4 mb-4">
              {/* Filter by Category */}
              <div className="flex-1">
                <label className="block mb-2 font-medium">Kategori:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search by Menu */}
              <div className="flex-1">
                <label className="block mb-2 font-medium">Cari:</label>
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
            <div className="w-full mt-4">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2 w-16"></th>
                    <th className="px-4 py-2">Nama</th>
                    <th className="px-4 py-2">Kategori</th>
                    <th className="px-4 py-2">Harga</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item) => (

                    <tr key={item._id} className="hover:bg-gray-100">
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item)}
                          onChange={(e) => handleCheckboxChange(e, item)}
                        />
                      </td>
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
                                    to={`/menu-update/${item._id}`} // Navigate to the edit page for the specific item
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
        {selectedItem === "opsi" && (
          <div>
            {/* Options */}
            <OpsiMenu />
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