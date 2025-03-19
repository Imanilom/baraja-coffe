
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const OpsiMenu = () => {
    const [opsiItems, setOpsiItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);
    const [openDropdown, setOpenDropdown] = useState(null); // Menyimpan status dropdown
    const [currentPage, setCurrentPage] = useState(1);
    const opsiPerPage = 6; // Number of items per page

    const fetchOpsiItems = async () => {
        try {
            const response = await axios.get("/api/menu/toppings");
            setOpsiItems(response.data?.data || []);
        } catch (error) {
            console.error("Error fetching menu items:", error);
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

    const toggleDropdown = (_id) => {
        if (openDropdown === _id) {
            setOpenDropdown(null); // Jika dropdown sudah terbuka, tutup
        } else {
            setOpenDropdown(_id); // Buka dropdown yang sesuai
        }
    };

    useEffect(() => {
        fetchOpsiItems();
    }, []);


    // Filter menu items berdasarkan kategori dan pencarian produk
    const filteredOpsi = opsiItems.filter((opsi) => {
        const matchesSearch =
            opsi.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const indexOfLastOpsi = currentPage * opsiPerPage;
    const indexOfFirstOpsi = indexOfLastOpsi - opsiPerPage;
    const currentOptions = filteredOpsi.slice(indexOfFirstOpsi, indexOfLastOpsi);

    const totalPages = Math.ceil(filteredOpsi.length / opsiPerPage);

    return (
        <div>
            <div className="flex space-x-4 mb-4">
                {/* Search by Product */}
                <div className="flex-1">
                    <label className="block mb-2 font-medium">Cari:</label>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari Topping..."
                        className="border rounded px-2 py-1 w-full"
                    />
                </div>
            </div>

            {/* Tabel Produk */}
            <div className="w-full mt-4">
                <table className="w-full table-auto">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="px-4 py-2 w-16"></th>
                            <th className="px-4 py-2">Topping Tambahan</th>
                            <th className="px-4 py-2">Harga</th>
                            <th className="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentOptions.map((item) => (
                            <tr key={item._id} className="hover:bg-gray-100">
                                <td className="px-4 py-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.includes(item)}
                                        onChange={(e) => handleCheckboxChange(e, item)}
                                    />
                                </td>
                                <td className="px-4 py-2">{item.name}</td>
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
                                                        <Link to={`/menu-update/${item._id}`}>
                                                            Edit
                                                        </Link>
                                                    </li>
                                                    <li className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">
                                                        Delete
                                                    </li>
                                                    <li className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">
                                                        View
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
    )
}

export default OpsiMenu;
