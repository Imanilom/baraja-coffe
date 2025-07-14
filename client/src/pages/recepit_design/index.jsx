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
    const [formData, setFormData] = useState({
        catatan: "Password_Wifi : ramadhandibaraja Yuk,jadi saksi pelestarian budaya di Amphitheater!Cek jadwalnya di IG & TikTok kami!",
        facebook: "barajacoffee",
        twitter: "",
        instagram: "barajacoffee",
        tiktok: "barajacoffee.id",
        addFacebook: false,
        addTwitter: false,
        addInstagram: true,
        addTiktok: false,
    });

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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
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
                        className={`bg-white border-b-2 py-2 border-b-white hover:border-b-[#005429] focus:outline-none`}
                    >
                        <Link className="flex justify-between items-center border-l border-l-gray-200 p-4"
                            to="/admin/target-sales">
                            <div className="flex space-x-4">
                                <FaBullseye size={24} className="text-gray-400" />
                                <h2 className="text-gray-400 ml-2 text-sm">Target Penjualan</h2>
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
                                <FaReceipt size={24} className="text-gray-400" />
                                <h2 className="text-gray-400 ml-2 text-sm">Desain Struk</h2>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
            <form action="">
                <div className="px-[15px] grid grid-cols-12">
                    <div className="px-[15px] text-[14px] col-span-7 shadow-lg text-[#999999]">
                        <div className="">
                            <h4 className="text-[14px] mt-[30px] mb-[10px] font-semibold">PENGATURAN DESAIN STRUK</h4>
                            <label className="mr-[8px] mb-[5px] text-[14px]">Anda dapat mengatur logo dan akun social media setiap outlet untuk ditampilkan pada cetakan struk</label>
                            <div className="relative pb-[10px]">
                                <select
                                    name="outlet"
                                    value=""
                                    className="w-full text-[13px] text-gray-500 border mt-[10px] mb-[10px] py-[6px] pr-[25px] pl-[12px] rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]"
                                >
                                    {outlets.map((outlet) => (
                                        <option key={outlet._id} value={outlet._id}>
                                            {outlet.name}
                                        </option>
                                    ))}
                                </select>

                                <input type="checkbox" /><span> Berlaku untuk semua Outlet</span>
                            </div>
                        </div>
                        <div className="my-[30px]">
                            <div className="grid grid-cols-12">
                                <h4 className=" mb-[10px] text-[14px] col-span-12 uppercase font-semibold">Logo Struk</h4>
                                <div className="col-span-4">
                                    <img src="https://www.mldspot.com/storage/generated/June2021/Serba-serbi%20Coffee%20Art%20Latte%20untuk%20Para%20Pecinta%20Kopi.jpg" alt="" />
                                </div>
                                <div className="col-span-8 mt-[15px] px-[15px]">
                                    <div className="text-[13px] mb-[10px]">
                                        <span>Maksimal 1 Mb</span>
                                    </div>
                                    <span className="py-[7px] px-[15px] border">Hapus Logo</span>
                                </div>
                            </div>
                        </div>
                        <div className="">
                            <h4 className="text-[14px] mb-[10px] uppercase font-semibold">Item Pembelian</h4>
                            <input type="checkbox" checked /><span>Berlaku untuk semua Outlet</span>
                        </div>
                        <div className="grid grid-rows-1 gap-4">
                            <h4 className="text-[14px] mt-[30px] mb-[10px] uppercase font-semibold">Sosial media</h4>
                            <div className="flex space-x-4 items-center">
                                <img
                                    src="https://dashboard.pawoon.com/assets/images/ic-facebook.png"
                                    alt="Facebook"

                                />
                                <div className="relative w-full">
                                    <input
                                        type="text"
                                        name="facebook"
                                        value={formData.facebook}
                                        onChange={handleChange}
                                        className="text-[13px] border py-[6px] pl-[12px] pr-[12px] rounded w-full"
                                    />

                                    <div className="absolute right-3 top-2 flex items-center space-x-1">
                                        <input
                                            type="checkbox"
                                            name="addFacebook"
                                            checked={formData.addFacebook}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-gray-400"
                                        />
                                        <span className="text-sm">Tambahkan</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-4 items-center">
                                <img src="https://dashboard.pawoon.com/assets/images/ic-twitter.png" alt="" />
                                <div className="relative w-full">
                                    <input
                                        type="text"
                                        name="twitter"
                                        value={formData.twitter}
                                        onChange={handleChange}
                                        className="text-[13px] border py-[6px] pl-[12px] pr-[12px] rounded w-full"
                                    />

                                    <div className="absolute right-3 top-2 flex items-center space-x-1">
                                        <input
                                            type="checkbox"
                                            name="addTwitter"
                                            checked={formData.addTwitter}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-gray-400"
                                        />
                                        <span className="text-sm">Tambahkan</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-4 items-center">
                                <img src="https://dashboard.pawoon.com/assets/images/ic-instagram.png" alt="" />
                                <div className="relative w-full">
                                    <input
                                        type="text"
                                        name="instagram"
                                        value={formData.instagram}
                                        onChange={handleChange}
                                        className="text-[13px] border py-[6px] pl-[12px] pr-[12px] rounded w-full"
                                    />

                                    <div className="absolute right-3 top-2 flex items-center space-x-1">
                                        <input
                                            type="checkbox"
                                            name="addInstagram"
                                            checked={formData.addInstagram}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-gray-400"
                                        />
                                        <span className="text-sm">Tambahkan</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-4 items-center">
                                <img src="https://dashboard.pawoon.com/assets/images/ic-tiktok.png" alt="" />
                                <div className="relative w-full">
                                    <input
                                        type="text"
                                        name="tiktok"
                                        value={formData.tiktok}
                                        onChange={handleChange}
                                        className="text-[13px] border py-[6px] pl-[12px] pr-[12px] rounded w-full"
                                    />

                                    <div className="absolute right-3 top-2 flex items-center space-x-1">
                                        <input
                                            type="checkbox"
                                            name="addTiktok"
                                            checked={formData.addTiktok}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-gray-400"
                                        />
                                        <span className="text-sm">Tambahkan</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mb-[15px]">
                            <h4 className="text-[14px] mt-[30px] mb-[10px] uppercase font-semibold">catatan</h4>
                            <textarea name="catatan" id="" className="w-full h-[100px] border rounded-lg px-[10px] py-[7px] text-[14px]" value={formData.catatan} onChange={handleChange}></textarea>
                        </div>
                        <div className="mb-[15px]">
                            <div className="grid grid-cols-12 ">
                                <h4 className="mt-[30px] mb-[10px] text-[14px] col-span-12 uppercase font-semibold">gambar catatan</h4>
                                <div className="col-span-4">
                                    <img src="https://www.mldspot.com/storage/generated/June2021/Serba-serbi%20Coffee%20Art%20Latte%20untuk%20Para%20Pecinta%20Kopi.jpg" alt="" />
                                </div>
                                <div className="col-span-8 mt-[15px] px-[15px]">
                                    <div className="text-[13px] mb-[10px]">
                                        <span>Maksimal 1 Mb</span>
                                    </div>
                                    <span className="py-[7px] px-[15px] border">Unggah Gambar</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 my-[10px]">
                                <input type="checkbox" checked disabled />
                                <span className="text-[14px]">Tampilkan Kode Voucher di Struk</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <input type="checkbox" />
                                <span className="text-[14px]">Tampilkan "Powered by Pawoon POS" di struk</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-[15px] col-span-5">
                        <div className="w-full bg-gray-100 p-4 rounded shadow-md text-[#999999]">
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Tampilan</label>
                                <select className="w-full border rounded px-3 py-2 text-sm">
                                    <option value="1">Printer Epson / Star</option>
                                    <option value="2">Bluetooth / mPOP</option>
                                </select>
                            </div>

                            <div className="bg-white p-4 rounded shadow">
                                <div className="text-center mb-4">
                                    <img
                                        src="https://s3.ap-southeast-1.amazonaws.com/new.newpawoon/receipt_images/IMG_479013_1750394198_200.png"
                                        alt="Logo"
                                        className="mx-auto max-w-xs"
                                    />
                                </div>

                                <div className="text-center text-sm mb-4">
                                    <p className="font-bold">Warung Pawoon Demo</p>
                                    <p>AXA Tower Lt.7, Jl. Prof. DR. Satrio Kav. 18 Kuningan, Jakarta Selatan 12940</p>
                                    <p>1500-360</p>
                                </div>

                                <div className="text-sm space-y-1 mb-4">
                                    <p>Kode Struk: <span className="font-medium">9873982342341</span></p>
                                    <p>No. Meja: <span className="font-medium">3</span></p>
                                    <p>Tanggal: <span className="font-medium">2017-07-23 08:45:34</span></p>
                                    <p>Kasir: <span className="font-medium">Ibrahim Abdullah</span></p>
                                    <p>Pelanggan: <span className="font-medium">Bilal Fahreda</span></p>
                                </div>

                                <hr className="border-dashed border-t border-gray-300 my-3" />

                                <div className="text-sm space-y-2 mb-4">
                                    <div className="flex justify-between">
                                        <span className="w-2/4">Es Teh Manis</span>
                                        <span className="w-1/4 text-right">x2</span>
                                        <span className="w-1/4 text-right">8,000</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="w-2/4">Martabak Original</span>
                                        <span className="w-1/4 text-right">x1</span>
                                        <span className="w-1/4 text-right">20,000</span>
                                    </div>
                                    <div className="ml-4 text-xs text-gray-500">+ Harga (15,000)</div>
                                    <div className="ml-4 text-xs text-gray-500">+ Extra Coklat x1 (2,000)</div>
                                    <div className="ml-4 text-xs text-gray-500">+ Extra Keju x1 (3,000)</div>
                                    <div className="flex justify-between">
                                        <span className="w-2/4">Martabak Telur Spesial</span>
                                        <span className="w-1/4 text-right">x1</span>
                                        <span className="w-1/4 text-right">33,000</span>
                                    </div>
                                </div>

                                <hr className="border-dashed border-t border-gray-300 my-3" />

                                <div className="text-sm space-y-1 mb-4">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>61,000</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>PPN (10%)</span>
                                        <span>6,100</span>
                                    </div>
                                    <div className="flex justify-between font-bold">
                                        <span>Total</span>
                                        <span>67,100</span>
                                    </div>
                                </div>

                                <hr className="border-dashed border-t border-gray-300 my-3" />

                                <div className="text-sm space-y-1 mb-4">
                                    <div className="flex justify-between">
                                        <span>Tunai</span>
                                        <span>100,000</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Kembali</span>
                                        <span>32,900</span>
                                    </div>
                                </div>

                                <div className="text-center text-sm mb-4">
                                    Password_Wifi: <strong>ramadhandibaraja</strong><br />
                                    Yuk, jadi saksi pelestarian budaya di Amphitheater!<br />
                                    Cek jadwalnya di IG & TikTok kami!
                                </div>

                                <hr className="border-dashed border-t border-gray-300 my-3" />

                                <div className="text-center text-sm p-2 rounded mb-4">
                                    <p>VOUCHER: JDIWFHPAWOONM</p>
                                    <p>EXTRA PAWOON</p>
                                    <p>
                                        Ayo tukarkan voucher ini ke kasir kamu ya.
                                        <br />
                                        caranya gampang,anda tinggal belanja minimal Rp 100.000 lalu tunjukan struk ini ke kasir ya!!!!
                                    </p>
                                </div>

                                <div className="text-center flex flex-col items-center text-sm space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <img src="https://dashboard.pawoon.com/assets/images/ic-black-instagram.png" alt="Instagram" className="w-4 h-4" />
                                        <span>@barajacoffee</span>
                                    </div>
                                </div>
                            </div>
                        </div>
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
