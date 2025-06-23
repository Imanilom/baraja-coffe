import React, { useEffect, useState, useRef, useMemo } from "react";
import { FaBox, FaTag, FaBell, FaUser, FaShoppingBag, FaLayerGroup, FaSquare, FaInfo, FaPencilAlt, FaThLarge, FaDollarSign, FaTrash, FaChevronRight, FaInfoCircle } from 'react-icons/fa';
import axios from "axios";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

const PriceSellingStatusManagement = () => {
    const location = useLocation();
    const { id } = useParams(); // Get the menu item ID from the URL
    const navigate = useNavigate(); // Use the new hook
    const [menuItems, setMenuItems] = useState({
        name: "",
        price: "",
        description: "",
        category: [], // This should be an array
        imageURL: "",
        toppings: [],
        addons: [],
        rawMaterials: [],
        availableAt: "",
    });
    const [category, setCategory] = useState([]);
    const [status, setStatus] = useState([]);
    const [error, setError] = useState(null);

    const [outlets, setOutlets] = useState([]);

    const [loading, setLoading] = useState(true);

    const queryParams = new URLSearchParams(location.search);
    const ensureArray = (data) => Array.isArray(data) ? data : [];
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch products data
                const menuResponse = await axios.get(`/api/menu/menu-items/${id}`);

                // Ensure menuResponse.data is an array
                const menuData = menuResponse.data.data;

                setMenuItems(menuData);

                // Fetch outlets data
                const outletsResponse = await axios.get('/api/outlet');

                // Ensure outletsResponse.data is an array
                const outletsData = Array.isArray(outletsResponse.data) ?
                    outletsResponse.data :
                    (outletsResponse.data && Array.isArray(outletsResponse.data.data)) ?
                        outletsResponse.data.data : [];

                setOutlets(outletsData);

                const categoryResponse = await axios.get('/api/storage/category');

                const categoryData = Array.isArray(categoryResponse.data) ?
                    categoryResponse.data :
                    (categoryResponse.data && Array.isArray(categoryResponse.data.data)) ?
                        categoryResponse.data.data : [];

                setCategory(categoryData);

                const statusResponse = [
                    { _id: "ya", name: "Ya" },
                    { _id: "tidak", name: "Tidak" }
                ]

                setStatus(statusResponse);

                setError(null);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load data. Please try again later.");
                // Set empty arrays as fallback
                setMenuItems([]);
                setOutlets([]);
                setCategory([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
        <div className="container">
            <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
                <FaBell className="text-2xl text-gray-400" />
                <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
                    <FaUser />
                </Link>
            </div>

            <div className="px-3 py-2 flex justify-between items-center border-b bg-white">
                <div className="flex items-center space-x-2 text-gray-400">
                    <FaShoppingBag size={21} />
                    <Link to="/admin/menu">Produk</Link>
                    <FaChevronRight />
                    <p>{menuItems.name}</p>
                    <FaChevronRight />
                    <span>Kelola Harga & Status Jual</span>
                </div>
                <div className="flex space-x-2">
                    <Link to="/admin/menu"
                        className="bg-white text-[#005429] px-4 py-2 rounded border border-[#005429] hover:text-white hover:bg-[#005429] text-[13px]"
                    >
                        Batal
                    </Link>
                    <button
                        onClick={() => console.log('Simpan')}
                        className="bg-[#005429] text-white px-4 py-2 rounded border text-[13px]"
                    >
                        Simpan
                    </button>
                </div>
            </div>
            <div className="w-full pb-6 mb-[60px]">
                <div className="px-[15px] pb-[15px]">
                    <div className="my-[13px] p-[25px] shadow-lg">
                        <div className="flex justify-end items-center space-x-2">
                            <input type="checkbox" name="" id="" className="accent-[#005429] w-[20px] h-[20px]" />
                            <span className="text-gray-500">Samakan pengaturan stok untuk semua outlet</span>
                        </div>
                        <table className="w-full table-auto text-gray-500">
                            <thead className="border-b">
                                <tr className="text-[12px] items-end">
                                    <th className="p-[15px] w-1/4 align-bottom"></th>
                                    <th className="p-[15px] text-right uppercase align-bottom">SKU</th>
                                    <th className="p-[15px] text-right uppercase align-bottom">Harga Jual</th>
                                    <th className="p-[15px] text-right uppercase align-bottom">Jual Di Pos</th>
                                    <th className="p-[15px] text-right uppercase align-bottom">Jual Di Pawoon Order</th>
                                    <th className="p-[15px] text-right uppercase align-bottom">Jual Di Digi Pawoon</th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr>
                                    <td className="p-[15px] w-1/4">{menuItems.name}</td>
                                    <td className="p-[15px]">-</td>
                                    <td className="flex p-[15px] justify-end">
                                        <div>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                className="block w-[100px] text-[13px] border py-[6px] pl-[10px] rounded"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-[15px]">
                                        <div className="flex space-x-4 justify-end">
                                            <label className="font-medium text-gray-400 text-[14px] inline-flex items-center cursor-pointer space-x-2">
                                                <span>Ya</span>
                                                <input type="checkbox" value="" className="sr-only peer" />
                                                <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </td>
                                    <td className="p-[15px]">
                                        <div className="flex space-x-4 justify-end">
                                            <label className="font-medium text-gray-400 text-[14px] inline-flex items-center cursor-pointer space-x-2">
                                                <span>Ya</span>
                                                <input type="checkbox" value="" className="sr-only peer" />
                                                <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </td>
                                    <td className="p-[15px]">
                                        <div className="flex space-x-4 justify-end">
                                            <label className="font-medium text-gray-400 text-[14px] inline-flex items-center cursor-pointer space-x-2">
                                                <span>Ya</span>
                                                <input type="checkbox" value="" className="sr-only peer" />
                                                <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]">
                </div>
            </div>
        </div>
    );
};

export default PriceSellingStatusManagement;  