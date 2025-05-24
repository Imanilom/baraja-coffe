import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { FaBox, FaTag, FaBell, FaUser, FaShoppingBag, FaLayerGroup, FaSquare, FaInfo } from 'react-icons/fa';

const AddOns = () => {
    const [tempSearch, setTempSearch] = useState("");
    const [filteredAddOns, setFilteredAddOns] = useState([]);
    const [currentPage, setCurrentPage] = useState(1); // Halaman saat ini
    // Apply filter function

    const fetchCategories = async (type) => {
        setLoading(true);
        try {
            let url = '/api/'; // URL default untuk mendapatkan semua kategori
            if (type && type !== 'all') {
                url += `/${type}`; // Tambahkan parameter type jika ada
            }

            const response = await axios.get(url);
            setFilteredAddOns(response.data.data || []);
        } catch (err) {
            setError('Failed to fetch categories');
            console.error('Error fetching categories:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = () => {

        // Make sure products is an array before attempting to filter
        let filtered = ensureArray([...categories]);

        if (tempSearch) {

            filtered = filtered.filter(categories => {
                try {
                    const category = (categories.name || '').toLowerCase();
                    const searchTerm = tempSearch.toLowerCase();
                    return category.includes(searchTerm);
                } catch (err) {
                    console.error("Error filtering by search:", err);
                    return false;
                }
            });
        }


        setFilteredAddOns(filtered);
        setCurrentPage(1); // Reset to first page after filter
    };
    return (
        <div className="container mx-auto">
            <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
                <FaBell className="text-2xl text-gray-400" />
                <Link
                    to="/admin/menu"
                    className="text-gray-400 inline-block text-2xl"
                >
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

                    <Link
                        to="/admin/menu-create"
                        className="bg-blue-500 text-white px-4 py-2 rounded inline-block text-[13px]"
                    >
                        Tambah Produk
                    </Link>
                </div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-4 py-4">
                <button
                    className={`bg-white border-b-2 py-2 border-b-white hover:border-b-[#005429] focus:outline-none`}
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
                    className={`bg-white border-b-2 py-2 border-b-[#005429] focus:outline-none`}
                >
                    <Link className="flex justify-between items-center border-l border-l-gray-200 p-4"
                        to="/admin/add-ons">
                        <div className="flex space-x-4">
                            <FaLayerGroup size={24} className="text-gray-400" />
                            <h2 className="text-gray-400 ml-2 text-sm">Opsi Tambahan</h2>
                            <span className="p-1">
                                <p className="border p-1 rounded-full">
                                    <FaInfo size={8} className="text-gray-400" />
                                </p>
                            </span>
                        </div>
                        <div className="text-sm text-gray-400">
                            (18)
                        </div>
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

                <div
                    className={`bg-white border-b-2 py-2 border-b-white hover:border-b-[#005429] focus:outline-none`}
                >
                    <div className="flex justify-between items-center border-l border-l-gray-200 p-4">
                        <div className="flex space-x-4">
                            <FaSquare size={24} className="text-gray-400" />
                            <h2 className="text-gray-400 ml-2 text-sm">GrabFood</h2>
                        </div>
                        <div className="text-sm text-gray-400">
                            (18)
                        </div>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto px-[15px] pb-[15px]">
                <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-12 gap-[10px] items-end rounded bg-gray-50 shadow-md">
                    <div className="flex flex-col col-span-10">
                        <label className="text-[13px] mb-1 text-gray-500">Cari</label>
                        <input
                            type="text"
                            placeholder="Kategori"
                            value={tempSearch}
                            onChange={(e) => setTempSearch(e.target.value)}
                            className="text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded"
                        />
                    </div>

                    <div className="flex justify-end space-x-2 items-end col-span-2">
                        <button onClick={applyFilter} className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Terapkan</button>
                        <button onClick={resetFilter} className="text-gray-400 border text-[13px] px-[15px] py-[7px] rounded">Reset</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddOns;