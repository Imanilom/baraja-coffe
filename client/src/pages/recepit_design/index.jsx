import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { FaClipboardList, FaBell, FaUser, FaTag, FaStoreAlt, FaBullseye, FaReceipt, FaSearch, FaPencilAlt, FaTrash, FaPlusCircle } from "react-icons/fa";

const ReceiptDesign = () => {
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
                    <FaReceipt size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Desain Struk</p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => navigate()} className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Simpan</button>
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
                                (18)
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
                                (18)
                            </div>
                        </Link>
                    </div>

                    <div
                        className={`bg-white border-b-2 py-2 border-b-white hover:border-b-[#005429] focus:outline-none`}
                    >
                        <Link className="flex justify-between items-center border-l border-l-gray-200 p-4"
                            to="/admin/target-sales">
                            <div className="flex space-x-4">
                                <FaBullseye size={24} className="text-gray-400" />
                                <h2 className="text-gray-400 ml-2 text-sm">Target Penjualan</h2>
                            </div>
                            <div className="text-sm text-gray-400">
                                (18)
                            </div>
                        </Link>
                    </div>

                    <div
                        className={`bg-white border-b-2 py-2 border-b-[#005429] focus:outline-none`}
                    >
                        <Link className="flex justify-between items-center border-l border-l-gray-200 p-4">
                            <div className="flex space-x-4">
                                <FaReceipt size={24} className="text-gray-400" />
                                <h2 className="text-gray-400 ml-2 text-sm">Desain Struk</h2>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
            <form action="">
                <div className="px-[15px] grid grid-cols-12">
                    <div className="px-[15px] text-[14px] col-span-7 shadow-lg">
                        <div className="mb-[15px]">
                            <h4 className="text-[14px] mt-[30px] mb-[10px]">PENGATURAN DESAIN STRUK</h4>
                            <label className="mr-[8px] mb-[5px] text-[14px]">Anda dapat mengatur logo dan akun social media setiap outlet untuk ditampilkan pada cetakan struk</label>
                            <div className="relative pb-[10px] mb-[15px]">
                                <select
                                    name="outlet"
                                    value=""
                                    className="w-full text-[13px] text-gray-500 border py-[6px] pr-[25px] pl-[12px] rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]"
                                >
                                    {outlets.map((outlet) => (
                                        <option key={outlet._id} value={outlet._id}>
                                            {outlet.name}
                                        </option>
                                    ))}
                                </select>

                                <input type="checkbox" /><span>Berlaku untuk semua Outlet</span>
                            </div>
                        </div>
                        <div className="mb-[15px]">
                            <div className="grid grid-cols-12 ">
                                <h4 className="mt-[30px] mb-[10px] text-[14px] col-span-12 uppercase">Logo Struk</h4>
                                <div className="col-span-4">
                                    <img src="https://www.mldspot.com/storage/generated/June2021/Serba-serbi%20Coffee%20Art%20Latte%20untuk%20Para%20Pecinta%20Kopi.jpg" alt="" />
                                </div>
                                <div className="col-span-8 mt-[15px] px-[15px]">
                                    <div className="text-[13px]">
                                        <span>Maksimal 1 Mb</span>
                                    </div>
                                    <span className="py-[7px] px-[15px] border">Hapus Logo</span>
                                </div>
                            </div>
                        </div>
                        <div className="mb-[15px]">
                            <h4 className="text-[14px] mt-[30px] mb-[10px] uppercase">Item Pembelian</h4>
                            <input type="checkbox" checked /><span>Berlaku untuk semua Outlet</span>
                        </div>
                        <div className="mb-[15px] grid grid-rows-1 gap-4">
                            <h4 className="text-[14px] mt-[30px] mb-[10px] uppercase">Sosial media</h4>
                            <div className="flex space-x-4 items-center">
                                <img src="" alt="" className="w-[40px] h-[40px]" />
                                <div className="relative w-full">
                                    <input
                                        type="text"
                                        value=""
                                        className="text-[13px] border py-[6px] pl-[30px] pr-[12px] rounded w-full"
                                    />

                                    {/* Checkbox dan label ditempatkan dalam satu baris */}
                                    <div className="absolute right-3 top-2 flex items-center space-x-1">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-gray-400"
                                        />
                                        <span className="text-sm text-gray-700">Tambahkan</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-4 items-center">
                                <img src="" alt="" className="w-[40px] h-[40px]" />
                                <div className="relative w-full">
                                    <input
                                        type="text"
                                        value=""
                                        className="text-[13px] border py-[6px] pl-[30px] pr-[12px] rounded w-full"
                                    />

                                    {/* Checkbox dan label ditempatkan dalam satu baris */}
                                    <div className="absolute right-3 top-2 flex items-center space-x-1">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-gray-400"
                                        />
                                        <span className="text-sm text-gray-700">Tambahkan</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-4 items-center">
                                <img src="" alt="" className="w-[40px] h-[40px]" />
                                <div className="relative w-full">
                                    <input
                                        type="text"
                                        value=""
                                        className="text-[13px] border py-[6px] pl-[30px] pr-[12px] rounded w-full"
                                    />

                                    {/* Checkbox dan label ditempatkan dalam satu baris */}
                                    <div className="absolute right-3 top-2 flex items-center space-x-1">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-gray-400"
                                        />
                                        <span className="text-sm text-gray-700">Tambahkan</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-4 items-center">
                                <img src="" alt="" className="w-[40px] h-[40px]" />
                                <div className="relative w-full">
                                    <input
                                        type="text"
                                        value=""
                                        className="text-[13px] border py-[6px] pl-[30px] pr-[12px] rounded w-full"
                                    />

                                    {/* Checkbox dan label ditempatkan dalam satu baris */}
                                    <div className="absolute right-3 top-2 flex items-center space-x-1">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-gray-400"
                                        />
                                        <span className="text-sm text-gray-700">Tambahkan</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mb-[15px]">
                            <h4 className="text-[14px] mt-[30px] mb-[10px] uppercase">catatan</h4>
                            <textarea name="" id="" className="w-full h-[100px] border rounded-lg px-[10px] py-[7px] text-[14px]"></textarea>
                        </div>
                        <div className="mb-[15px]">
                            <div className="grid grid-cols-12 ">
                                <h4 className="mt-[30px] mb-[10px] text-[14px] col-span-12 uppercase">gambar catatan</h4>
                                <div className="col-span-4">
                                    <img src="https://www.mldspot.com/storage/generated/June2021/Serba-serbi%20Coffee%20Art%20Latte%20untuk%20Para%20Pecinta%20Kopi.jpg" alt="" />
                                </div>
                                <div className="col-span-8 mt-[15px] px-[15px]">
                                    <div className="text-[13px]">
                                        <span>Maksimal 1 Mb</span>
                                    </div>
                                    <span className="py-[7px] px-[15px] border">Unggah Gambar</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <input type="checkbox" checked disabled />
                                <span className="text-[14px]">Tampilkan Kode Voucher di Struk</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <input type="checkbox" />
                                <span className="text-[14px]">Tampilkan "Powered by Pawoon POS" di struk</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-[15px] col-span-5 bg-[#005429]">

                    </div>
                </div>
            </form>

            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]">
                </div>
            </div>
        </div>
    );
};

export default ReceiptDesign;
