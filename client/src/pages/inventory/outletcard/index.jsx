import React, { useEffect, useState, useRef, useMemo } from "react";
import { FaBox, FaTag, FaBell, FaUser, FaShoppingBag, FaLayerGroup, FaSquare, FaInfo, FaPencilAlt, FaThLarge, FaDollarSign, FaTrash, FaSearch, FaChevronRight, FaInfoCircle, FaBoxes } from 'react-icons/fa';
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Datepicker from "react-tailwindcss-datepicker";

const OutletCardManagement = () => {
    const location = useLocation();
    const [showInput, setShowInput] = useState(false);
    const [showInputCategory, setShowInputCategory] = useState(false);
    const navigate = useNavigate(); // Use the new hook
    const [outletCard, setOutletCard] = useState([]);
    const [menu, setMenu] = useState([]);
    const [status, setStatus] = useState([]);
    const [tempSelectedCategory, setTempSelectedCategory] = useState("");
    const [tempSelectedStatus, setTempSelectedStatus] = useState("");
    const [tempSearch, setTempSearch] = useState("");
    const [error, setError] = useState(null);
    const [checkedItems, setCheckedItems] = useState([]);
    const [checkAll, setCheckAll] = useState(false);

    const [tempSelectedMenu, setTempSelectedMenu] = useState("");
    const [outlets, setOutlets] = useState([]);
    const [search, setSearch] = useState("");
    const [searchCategory, setSearchCategory] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);

    const queryParams = new URLSearchParams(location.search);
    const ensureArray = (data) => Array.isArray(data) ? data : [];
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const dropdownRef = useRef(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const outletCardResponse = [];

            // const menuData = Array.isArray(menuResponse.data)
            //     ? menuResponse.data
            //     : (menuResponse.data && Array.isArray(menuResponse.data.data))
            //         ? menuResponse.data.data
            //         : [];
            const outlateCardData = (outletCardResponse.data || [])

            setOutletCard(outlateCardData);
            setFilteredData(outlateCardData);

            const outletsResponse = await axios.get('/api/outlet');
            const outletsData = Array.isArray(outletsResponse.data)
                ? outletsResponse.data
                : (outletsResponse.data && Array.isArray(outletsResponse.data.data))
                    ? outletsResponse.data.data
                    : [];

            setOutlets(outletsData);

            const menuResponse = await axios.get('/api/menu/menu-items');
            const menuData = Array.isArray(menuResponse.data)
                ? menuResponse.data
                : (menuResponse.data && Array.isArray(menuResponse.data.data))
                    ? menuResponse.data.data
                    : [];

            setMenu(menuData);

            setStatus([
                { _id: "ya", name: "Ya" },
                { _id: "tidak", name: "Tidak" }
            ]);

            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load data. Please try again later.");
            setOutletCard([]);
            setFilteredData([]);
            setOutlets([]);
            setMenu([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(); // hanya untuk load awal
    }, []);


    // Get unique outlet names for the dropdown
    const uniqueMenu = useMemo(() => {
        return menu.map(item => item.name);
    }, [menu]);

    const paginatedData = useMemo(() => {

        // Ensure filteredData is an array before calling slice
        if (!Array.isArray(filteredData)) {
            console.error('filteredData is not an array:', filteredData);
            return [];
        }

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const result = filteredData.slice(startIndex, endIndex);
        return result;
    }, [currentPage, filteredData]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    // Filter outlets based on search input
    const filteredMenu = useMemo(() => {
        return uniqueMenu.filter(outlet =>
            outlet.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, uniqueMenu]);


    // Apply filter function
    const applyFilter = () => {

        // Make sure products is an array before attempting to filter
        let filtered = ensureArray([...outletCard]);

        // Filter by search term (product name, category, or SKU)
        if (tempSearch) {
            filtered = filtered.filter(menu => {
                try {
                    if (!menu) {
                        return false;
                    }

                    const name = (menu.name || '').toLowerCase();
                    const customer = (menu.user || '').toLowerCase();
                    const receipt = (menu._id || '').toLowerCase();

                    const searchTerm = tempSearch.toLowerCase();
                    return name.includes(searchTerm) ||
                        customer.includes(searchTerm) ||
                        receipt.includes(searchTerm);
                } catch (err) {
                    console.error("Error filtering by search:", err);
                    return false;
                }
            });
        }

        // Filter by outlet
        if (tempSelectedMenu) {
            filtered = filtered.filter(menu => {
                try {
                    if (!menu?.availableAt?.length > 0) {
                        return false;
                    }

                    const outletName = menu?.availableAt;
                    const matches = outletName === tempSelectedMenu;

                    if (!matches) {
                    }

                    return matches;
                } catch (err) {
                    console.error("Error filtering by outlet:", err);
                    return false;
                }
            });
        }

        // Filter by category
        if (tempSelectedCategory) {
            filtered = filtered.filter(menu => {
                try {
                    if (!menu?.category?.length > 0) {
                        return false;
                    }

                    const categoryName = menu?.category[0];
                    const matches = categoryName === tempSelectedCategory;

                    if (!matches) {
                    }

                    return matches;
                } catch (err) {
                    console.error("Error filtering by outlet:", err);
                    return false;
                }
            });
        }

        setFilteredData(filtered);
        setCurrentPage(1); // Reset to first page after filter
    };

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
                <div className="flex items-center space-x-2">
                    <FaBoxes size={22} className="text-gray-400 inline-block" />
                    <p className="text-gray-400 inline-block">Inventori</p>
                    <FaChevronRight size={22} className="text-gray-400 inline-block" />
                    <p className="text-gray-400 inline-block">Kartu Stok</p>
                    <FaInfoCircle size={17} className="text-gray-400 inline-block" />
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => console.log('Ekspor')}
                        className="bg-white text-[#005429] px-4 py-2 rounded border border-[#005429] hover:text-white hover:bg-[#005429] text-[13px]"
                    >
                        Ekspor
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 py-4 px-3">
                <button
                    className={`bg-white border-b-2 py-2 border-b-white hover:border-b-[#005429] focus:outline-none`}
                >
                    <Link className="flex justify-between items-center p-4"
                        to={"/admin/inventory/stockcard"}>
                        <div className="flex space-x-4">
                            <h2 className="text-gray-400 ml-2 text-sm">Kartu Produk</h2>
                        </div>
                    </Link>
                </button>

                <div
                    className={`bg-white border-b-2 py-2 border-b-[#005429] focus:outline-none`}
                >
                    <Link className="flex justify-between items-center border-l border-l-gray-200 p-4">
                        <div className="flex space-x-4">
                            <strong className="text-gray-400 ml-2 text-sm">Kartu Outlet</strong>
                        </div>
                    </Link>
                </div>
            </div>

            <div className="w-full pb-6 mb-[60px]">
                <div className="px-[15px] pb-[15px]">
                    <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-8 gap-[10px] items-end rounded bg-slate-50 shadow-slate-200 shadow-md">
                        <div className="flex flex-col col-span-2">
                            <label className="text-[13px] mb-1 text-gray-500">Produk</label>
                            <div className="relative">
                                {!showInput ? (
                                    <button className="w-full text-[13px] text-gray-500 border py-[6px] pr-[25px] pl-[12px] rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]" onClick={() => setShowInput(true)}>
                                        {tempSelectedMenu || "Semua Produk"}
                                    </button>
                                ) : (
                                    <input
                                        type="text"
                                        className="w-full text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded text-left"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        autoFocus
                                        placeholder=""
                                    />
                                )}
                                {showInput && (
                                    <ul className="absolute z-10 bg-white border mt-1 w-full rounded shadow-slate-200 shadow-md max-h-48 overflow-auto" ref={dropdownRef}>
                                        <li
                                            onClick={() => {
                                                setTempSelectedMenu(""); // Kosong berarti semua
                                                setShowInput(false);
                                            }}
                                            className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                                        >
                                            Semua Produk
                                        </li>
                                        {filteredMenu.length > 0 ? (
                                            filteredMenu.map((product, idx) => (
                                                <li
                                                    key={idx}
                                                    onClick={() => {
                                                        setTempSelectedMenu(product);
                                                        setShowInput(false);
                                                    }}
                                                    className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                                                >
                                                    {product}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="px-4 py-2 text-gray-500">Tidak ditemukan</li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col col-span-2">
                            <label className="text-[13px] mb-1 text-gray-500">Tanggal</label>
                            <div className="relative text-gray-500 after:content-['▼'] after:absolute after:right-3 after:top-1/2 after:-translate-y-1/2 after:text-[10px] after:pointer-events-none">
                                <Datepicker
                                    showFooter
                                    showShortcuts
                                    // value={value}
                                    // onChange={setValue}
                                    displayFormat="DD-MM-YYYY"
                                    inputClassName="w-full text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded cursor-pointer"
                                    popoverDirection="down"
                                />

                                {/* Overlay untuk menyembunyikan ikon kalender */}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-white cursor-pointer"></div>
                            </div>
                        </div>

                        <div className="flex flex-col col-span-2">
                            <label className="text-[13px] mb-1 text-gray-500">Cari</label>
                            <div className="relative">
                                <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari Outlet"
                                    value={tempSearch}
                                    onChange={(e) => setTempSearch(e.target.value)}
                                    className="text-[13px] border py-[6px] pl-[30px] pr-[25px] rounded w-full"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2 items-end col-span-2">
                            <button onClick={applyFilter} className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Terapkan</button>
                            <button className="text-gray-400 border text-[13px] px-[15px] py-[7px] rounded">Reset</button>
                        </div>
                    </div>

                    <div className="w-full mt-4 py-[20px] shadow-md">
                        <div className="flex justify-between px-[15px]">
                            <div className="">
                                <strong className="text-[14px] text-gray-400">Tampilkan Data</strong>
                            </div>
                            <div className="space-x-7">
                                <label className="text-gray-400 text-[14px] inline-flex items-center cursor-pointer space-x-2">
                                    <span>Produk Dijual</span>
                                    <input type="checkbox" value="" className="sr-only peer" />
                                    <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                                <label className="text-gray-400 text-[14px] inline-flex items-center cursor-pointer space-x-2">
                                    <span>Produk Tidak Dijual</span>
                                    <input type="checkbox" value="" className="sr-only peer" />
                                    <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                                <label className="text-gray-400 text-[14px] inline-flex items-center cursor-pointer space-x-2">
                                    <span>Stok Kosong</span>
                                    <input type="checkbox" value="" className="sr-only peer" />
                                    <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="w-full mt-4 shadow-md">
                        <table className="w-full min-w-[800px] table-auto text-gray-500">
                            <thead>
                                <tr className="text-[14px]">
                                    <th className="p-[15px] font-normal text-left">Outlet</th>
                                    <th className="p-[15px] font-normal text-right">Stok Awal</th>
                                    <th className="p-[15px] font-normal text-right">Stok Masuk</th>
                                    <th className="p-[15px] font-normal text-right">Stok Keluar</th>
                                    <th className="p-[15px] font-normal text-right">Penjualan</th>
                                    <th className="p-[15px] font-normal text-right">Transfer</th>
                                    <th className="p-[15px] font-normal text-right">Penyesuaian</th>
                                    <th className="p-[15px] font-normal text-right">Stok Akhir</th>
                                    <th className="p-[15px] font-normal text-right">Satuan</th>
                                    <th className="p-[15px] font-normal text-right">Nilai Produk</th>
                                </tr>
                            </thead>
                            {paginatedData.length > 0 ? (
                                <tbody>
                                    {paginatedData.map((item) => (
                                        <tr key={item._id} className="hover:bg-gray-100 text-[14px]">
                                            <td className="p-[15px]">-</td>
                                            <td className="p-[15px] text-right">-</td>
                                            <td className="p-[15px] text-right">-</td>
                                            <td className="p-[15px] text-right">-</td>
                                            <td className="p-[15px] text-right">-</td>
                                            <td className="p-[15px] text-right">-</td>
                                            <td className="p-[15px] text-right">-</td>
                                            <td className="p-[15px] text-right">-</td>
                                            <td className="p-[15px] text-right">-</td>
                                            <td className="p-[15px] text-right">-</td>
                                        </tr>
                                    ))}
                                </tbody>
                            ) : (
                                <tbody>
                                    <tr className="py-6 text-center w-full h-96">
                                        <td colSpan={10}>
                                            <div className="flex justify-center items-center">
                                                <div className="text-gray-400">
                                                    <div className="flex justify-center">
                                                        <FaSearch size={100} />
                                                    </div>
                                                    <p className="uppercase">Data Tidak ditemukan</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            )}
                        </table>
                    </div>

                    {/* Pagination */}
                    {paginatedData.length > 0 && (
                        <div className="flex justify-between items-center mt-4">
                            <span className="text-sm text-gray-600">
                                Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} dari {filteredData.length} data
                            </span>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Sebelumnya
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Berikutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]">
                </div>
            </div>
        </div>
    );
};

export default OutletCardManagement;  