import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaChevronRight, FaShoppingBag, FaBell, FaUser, FaImage, FaCamera, FaInfoCircle, FaGift, FaPizzaSlice, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CreateSupplier = () => {
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
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="px-3 py-3 flex justify-between items-center border-b">
                    <div className="flex items-center space-x-2">
                        <FaShoppingBag className="text-gray-400 inline-block" />
                        <Link
                            to="/admin/supplier"
                            className="text-gray-400 inline-block"
                        >
                            Supplier
                        </Link>
                        <FaChevronRight className="text-gray-400 inline-block" />
                        <sapn
                            className="text-gray-400 inline-block"
                        >
                            Tambah Supplier
                        </sapn>
                    </div>
                </div>
                <div className="grid px-3 grid-cols-1 w-full md:w-1/2 gap-4">

                    {/* Name */}
                    <div className="flex items-center">
                        <h3 className="w-[140px] block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 text-[14px]">
                            Name
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
                        <h3 className="w-[140px] block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 text-[14px]">
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
                        <h3 className="w-[140px] block text-[#999999] text-[14px]">Email</h3>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full py-2 px-3 border rounded-lg"
                        />
                    </div>
                    <div className="flex items-center">
                        <h3 className="w-[140px] block text-[#999999] text-[14px]">Alamat</h3>
                        <textarea name="address" id="" placeholder="Ketik Catatan.."
                            onChange={handleInputChange}
                            className="w-full py-2 px-3 border rounded-lg text-[14px]" value={formData.address}>

                        </textarea>
                    </div>
                </div>

                <div className="fixed bottom-0 left-64 right-0 flex justify-between border-t px-3 py-3 items-center bg-white z-50">
                    <div className="">
                        <h3 className="block text-[#999999] text-[14px]">Kolom bertanda <b className="text-red-600">*</b> wajib diisi</h3>
                    </div>
                    <div className="flex space-x-2">
                        <Link
                            to="/admin/supplier"
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

export default CreateSupplier;