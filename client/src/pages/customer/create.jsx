import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaBell, FaChevronRight, FaIdBadge, FaIdCard, FaReceipt, FaUser, FaUserFriends } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CreateCustomer = () => {
    const cities = [
        "Jakarta",
        "Bandung",
        "Surabaya",
        "Medan",
        "Semarang",
        "Palembang",
        "Makassar",
        "Yogyakarta",
        "Denpasar",
        "Balikpapan",
        // Tambahkan semua kota lainnya di sini
    ];
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        phone: "",
        email: ""
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const newSupplier = { ...formData };

            const response = await axios.post('/api/marketlist/supplier', newSupplier); // Kirim sebagai array
            navigate("/admin/supplier");
        } catch (err) {
            console.error('Error adding category:', err);
        }
    };

    return (
        <div className="">
            {/* Header */}
            <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
                <FaBell size={23} className="text-gray-400" />
                <span className="text-[14px]">Hi Baraja</span>
                <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
                    <FaUser size={30} />
                </Link>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="px-3 py-3 flex justify-between items-center border-b">
                    <div className="flex items-center space-x-2">
                        <FaUserFriends className="text-gray-400 inline-block" />
                        <span
                            className="text-gray-400 inline-block"
                        >
                            Pelanggan
                        </span>
                        <FaChevronRight className="text-gray-400 inline-block" />
                        <span
                            className="text-gray-400 inline-block"
                        >
                            Tambah Pelanggan
                        </span>
                    </div>
                </div>
                <div className="grid px-3 grid-cols-1 w-full md:w-1/2 gap-4 pb-[120px]">

                    {/* Name */}
                    <div className="flex items-center">
                        <h3 className="w-[240px] block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 text-[14px]">
                            Nama Pelanggan
                        </h3>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full py-2 px-3 border rounded-lg"
                        />
                    </div>
                    <div className="flex items-center">
                        <h3 className="w-[240px] block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 text-[14px]">
                            Telepon
                        </h3>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full py-2 px-3 border rounded-lg"
                        />
                    </div>
                    <div className="flex items-center">
                        <h3 className="w-[240px] block text-[#999999] text-[14px]">Member ID</h3>
                        <input
                            type="text"
                            name="member"
                            value={formData.member}
                            onChange={handleInputChange}
                            className="w-full py-2 px-3 border rounded-lg"
                        />
                    </div>
                    <div className="flex items-center">
                        <h3 className="w-[240px] block text-[#999999] text-[14px]">Email</h3>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full py-2 px-3 border rounded-lg"
                        />
                    </div>
                    <div className="flex items-center">
                        <h3 className="w-[240px] block text-[#999999] text-[14px]">Tanggal Lahir</h3>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            className="w-full py-2 px-3 border rounded-lg"
                        />
                    </div>
                    <div className="flex items-center">
                        <h3 className="w-[240px] block text-[#999999] text-[14px]">Alamat</h3>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="w-full py-2 px-3 border rounded-lg"
                        />
                    </div>
                    <div className="flex items-center">
                        <h3 className="w-[240px] block text-[#999999] text-[14px]">Kota</h3>
                        <select
                            className="w-full py-2 px-3 border rounded-lg text-[#999999]"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                        >
                            <option value="">-- Pilih Kota --</option>
                            {cities.map((city, index) => (
                                <option key={index} value={city}>
                                    {city}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center">
                        <h3 className="w-[240px] block text-[#999999] text-[14px]">Kode Pos</h3>
                        <input
                            type="text"
                            name="kode"
                            value={formData.kode}
                            onChange={handleInputChange}
                            className="w-full py-2 px-3 border rounded-lg"
                        />
                    </div>
                    <div className="flex items-center">
                        <h3 className="w-[240px] block text-[#999999] text-[14px]">Catatan</h3>
                        <textarea name="address" id="" placeholder="Ketik Catatan.."
                            onChange={handleInputChange}
                            className="w-full py-2 px-3 border rounded-lg text-[14px]" value={formData.address}>
                        </textarea>
                    </div>
                    <div className="flex items-center">
                        <h3 className="w-[240px] block text-[#999999] text-[14px]">Jenis Kelamin</h3>
                        <select
                            className="w-full py-2 px-3 border rounded-lg text-[#999999]"
                            name="city"
                            value={formData.sex}
                            onChange={handleInputChange}
                        >
                            <option value="man">Pria</option>
                            <option value="girl">Wanita</option>
                        </select>
                    </div>
                </div>

                <div className="fixed bottom-0 left-64 right-0 flex justify-between border-t px-3 py-3 items-center bg-white z-50">
                    <div className="">
                        <h3 className="block text-[#999999] text-[14px]">Kolom bertanda <b className="text-red-600">*</b> wajib diisi</h3>
                    </div>
                    <div className="flex space-x-2">
                        <Link
                            to="/admin/customer"
                            className="border border-[#005429] text-[#005429] hover:bg-[#005429] hover:text-white text-sm px-3 py-1.5 rounded cursor-pointer"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            className="bg-[#005429] text-white text-sm px-3 py-1.5 rounded"
                        >
                            Simpan
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateCustomer;