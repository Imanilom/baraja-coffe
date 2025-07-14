import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { FaClipboardList, FaBell, FaUser, FaTag, FaStoreAlt, FaBullseye, FaReceipt, FaSearch, FaPencilAlt, FaTrash, FaPlusCircle } from "react-icons/fa";

const TargetSalesManagementPage = () => {
    const [openDropdown, setOpenDropdown] = useState(null);
    const [outlets, setOutlets] = useState([]);
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;
    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);


    useEffect(() => {
        fetchData();
        setLoading(true);
    }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get("/api/outlet");
            setOutlets(response.data || []);

            const data = [

            ]
            setData(data || []);
            setFilteredData(data || []);
        } catch (error) {
            console.error("Error fetching outlets:", error);
            setOutlets([]);
            setData([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOutlet = async (id) => {
        try {
            const response = await axios.delete(`/api/outlet/${id}`);
            alert(response.data.message);
            fetchData();
        } catch (error) {
            alert("Error deleting outlet.");
        }
    };

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

    return (
        <div className="overflow-y-auto pb-[100px]">
            {/* Header */}
            <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
                <FaBell size={23} className="text-gray-400" />
                <span className="text-[14px]">Hi Baraja</span>
                <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
                    <FaUser size={30} />
                </Link>
            </div>

            {/* Breadcrumb */}
            <div className="px-3 py-2 flex justify-between items-center border-b">
                <div className="flex items-center space-x-2">
                    <FaBullseye size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Target Penjualan</p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => navigate()} className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Atur Target Penjualan</button>
                </div>
            </div>

            <div className="px-[15px] mt-[15px]">
                <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-4">
                    <button
                        className={`bg-white border-b-2 py-2 border-b-white hover:border-b-[#005429] focus:outline-none`}
                        onClick={() => handleTabChange("menu")}
                    >
                        <Link className="flex justify-between items-center p-4"
                            to={"/admin/outlet"}>
                            <div className="flex space-x-4">
                                <FaStoreAlt size={24} className="text-gray-400" />
                                <h2 className="text-gray-400 ml-2 text-sm">Outlet</h2>
                            </div>
                            <div className="text-sm text-gray-400">
                                ({outlets.length})
                            </div>
                        </Link>
                    </button>

                    <div
                        className={`bg-white border-b-2 py-2 border-b-white hover:border-b-[#005429] focus:outline-none`}
                    >
                        <Link className="flex justify-between items-center border-l border-l-gray-200 p-4"
                            to="/admin/tax-and-service">
                            <div className="flex space-x-4">
                                <FaClipboardList size={24} className="text-gray-400" />
                                <h2 className="text-gray-400 ml-2 text-sm">Pajak & Service</h2>
                            </div>
                            <div className="text-sm text-gray-400">

                            </div>
                        </Link>
                    </div>

                    <div
                        className={`bg-white border-b-2 py-2 border-b-[#005429] focus:outline-none`}
                    >
                        <Link className="flex justify-between items-center border-l border-l-gray-200 p-4">
                            <div className="flex space-x-4">
                                <FaBullseye size={24} className="text-gray-400" />
                                <h2 className="text-gray-400 ml-2 text-sm">Target Penjualan</h2>
                            </div>
                            <div className="text-sm text-gray-400">

                            </div>
                        </Link>
                    </div>

                    <div
                        className={`bg-white border-b-2 py-2 border-b-white hover:border-b-[#005429] focus:outline-none`}
                    >
                        <Link className="flex justify-between items-center border-l border-l-gray-200 p-4"
                            to="/admin/receipt-design">
                            <div className="flex space-x-4">
                                <FaReceipt size={24} className="text-gray-400" />
                                <h2 className="text-gray-400 ml-2 text-sm">Desain Struk</h2>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
            <div className="px-[15px]">
                <div className="my-[13px] py-[10px] px-[15px] bg-slate-50 shadow-slate-200 shadow-md">
                    <div className="relative pb-[10px]">
                        <label className="block text-[13px] mb-1 text-gray-500 py-[7px]">Cari</label>
                        <div className="relative">
                            <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Outlet"
                                value=""
                                className="text-[13px] border py-[6px] pl-[30px] pr-[12px] rounded w-full"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4">
                <table className="min-w-full text-sm text-left text-gray-500 shadow-lg">
                    <thead className="text-[14px]">
                        <tr>
                            <th className="px-[15px] py-[21px] font-normal">Outlet</th>
                            <th className="px-[15px] py-[21px] font-normal">Target Penjualan</th>
                            <th className="px-[15px] py-[21px] font-normal"></th>
                        </tr>
                    </thead>
                    {paginatedData.length > 0 ? (
                        <tbody>
                            {paginatedData.map((data) => (
                                <tr key={data._id} className="bg-white text-[14px]">
                                    <td className="p-[15px]">{data.name}</td>
                                    <td className="p-[15px]">{data.target}</td>
                                    <td className="p-[15px]">

                                        {/* Dropdown Menu */}
                                        <div className="relative text-right">
                                            <button
                                                className="px-2 bg-white border border-gray-200 hover:border-[#005429] hover:bg-[#005429] rounded-sm"
                                                onClick={() => setOpenDropdown(openDropdown === data._id ? null : data._id)}
                                            >
                                                <span className="text-xl text-gray-200 hover:text-white">
                                                    •••
                                                </span>
                                            </button>
                                            {openDropdown === data._id && (
                                                <div className="absolute text-left right-0 top-full mt-2 bg-white border rounded-md shadow-md w-52 z-10">
                                                    <ul className="">
                                                        <li className="px-4 py-4 text-sm cursor-pointer hover:bg-gray-100">
                                                            <Link
                                                                to={`/admin/manage-to-outlet/${data._id}`}
                                                                className="bg-transparent flex items-center space-x-4 text-[14px]"
                                                            >
                                                                <FaPlusCircle size={18} />
                                                                <span>Tambahkan Ke Outlet</span>
                                                            </Link>
                                                        </li>
                                                        <li className="px-4 py-4 text-sm cursor-pointer hover:bg-gray-100">
                                                            <Link
                                                                to={`/admin/tax-update/${data._id}`}
                                                                className="bg-transparent flex items-center space-x-4 text-[14px]"
                                                            >
                                                                <FaPencilAlt size={18} />
                                                                <span>Ubah</span>
                                                            </Link>
                                                        </li>
                                                        <li className="px-4 py-4 text-sm cursor-pointer hover:bg-gray-100">
                                                            <button
                                                                onClick={() => handleDeleteOutlet(data._id)}
                                                                className="text-red-600 flex items-center space-x-4 text-[14px]"
                                                            >
                                                                <FaTrash size={18} />
                                                                <span>Hapus</span>
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

                    ) : (
                        <tbody>
                            <tr className="py-6 text-center w-full h-96 text-gray-500">
                                <td colSpan={4}>TIDAK ADA TARGET PENJUALAN</td>
                            </tr>
                        </tbody>
                    )}
                </table>
            </div>


            {/* Pagination */}
            {paginatedData.length > 0 && (
                <div className="flex justify-between items-center mt-4 px-[15px]">
                    <span className="text-sm text-gray-500">
                        Menampilkan <b>{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</b> – <b>{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}</b> dari <b>{filteredData.length}</b> data
                    </span>
                    {currentPage === 1 ? (
                        <div className="flex"></div>
                    ) : (
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
                    )}
                </div>
            )}


            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]">
                </div>
            </div>
        </div>
    );
};

export default TargetSalesManagementPage;
