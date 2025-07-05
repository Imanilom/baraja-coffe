import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";
import { FaChevronRight, FaReceipt } from "react-icons/fa";

const UpdateSupplier = () => {
    const { id } = useParams(); // Ambil ID dari URL
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        phone: "",
        email: ""
    });

    // Ambil data supplier saat komponen dimuat
    useEffect(() => {
        if (id) {
            axios.get(`/api/marketlist/supplier/${id}`)
                .then((res) => {
                    setFormData(res.data.data);
                })
                .catch((err) => {
                    console.error("Error fetching supplier:", err);
                });
        }
    }, [id]);

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
            await axios.put(`/api/marketlist/supplier/${id}`, formData); // Update data supplier
            navigate("/admin/supplier");
        } catch (err) {
            console.error("Error updating supplier:", err);
        }
    };

    return (
        <div className="">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="px-3 py-3 flex justify-between items-center border-b">
                    <div className="flex items-center space-x-2">
                        <FaReceipt className="text-gray-400 inline-block" />
                        <span className="text-gray-400 inline-block">Pembelian</span>
                        <FaChevronRight className="text-gray-400 inline-block" />
                        <span className="text-gray-400 inline-block">Supplier</span>
                        <FaChevronRight className="text-gray-400 inline-block" />
                        <span className="text-gray-400 inline-block">Edit Supplier</span>
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

                    {/* Phone */}
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

                    {/* Email */}
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

                    {/* Address */}
                    <div className="flex items-center">
                        <h3 className="w-[140px] block text-[#999999] text-[14px]">Alamat</h3>
                        <textarea
                            name="address"
                            placeholder="Ketik Alamat.."
                            value={formData.address}
                            onChange={handleInputChange}
                            className="w-full py-2 px-3 border rounded-lg text-[14px]"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="fixed bottom-0 left-64 right-0 flex justify-between border-t px-3 py-3 items-center bg-white z-50">
                    <div>
                        <h3 className="block text-[#999999] text-[14px]">
                            Kolom bertanda <b className="text-red-600">*</b> wajib diisi
                        </h3>
                    </div>
                    <div className="flex space-x-2">
                        <Link
                            to="/admin/purchase/supplier"
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

export default UpdateSupplier;
