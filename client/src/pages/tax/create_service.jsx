import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaClipboardList, FaBell, FaUser } from "react-icons/fa";

const CreateService = () => {
    const [formData, setFormData] = useState({
        type: "service",
        name: "",
        description: "",
        percentage: "",
        fixedFee: "",
        appliesToOutlets: [],
        appliesToMenuItems: [],
        appliesToCustomerTypes: [],
    });

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleCreateService = async () => {
        try {
            const response = await axios.post("/api/tax-service", formData);
        } catch (error) {
            console.error("Error creating Tax:", error);
        }
    };

    return (
        <div className="">

            {/* Breadcrumb */}
            <div className="px-3 py-2 flex justify-between items-center border-b">
                <div className="flex items-center space-x-2">
                    <FaClipboardList size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Tambah Servis</p>
                </div>
            </div>

            <div className="p-3">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleCreateService();
                    }}
                    className="mt-4 w-1/2"
                >
                    <div className="w-full flex items-center space-x-2 mb-2.5">
                        <h3 className="w-[140px] text-[14px] block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 mb-2.5">Nama Servis</h3>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="flex-1 px-4 py-2 border rounded-md w-1/2 focus:outline-none focus:border-[#005429] focus:ring-1 focus:ring-[#005429]"
                            required
                        />
                    </div>

                    <div className="w-full flex items-center space-x-2">
                        <h3 className="w-[140px] text-[14px] block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 mb-2.5">Jumlah</h3>
                        <input
                            type="number"
                            name="percentage"
                            value={formData.percentage}
                            onChange={handleInputChange}
                            className="px-4 py-2 border rounded-md w-3/12 focus:outline-none focus:border-[#005429] focus:ring-1 focus:ring-[#005429]"
                            required
                        />
                        <p>%</p>
                    </div>

                    <div className="fixed bottom-0 left-64 right-0 flex justify-between items-center border-t px-3 z-50 bg-white">
                        <div className="">
                            <h3 className="block text-[#999999] text-[14px]">Kolom bertanda <b className="text-red-600">*</b> wajib diisi</h3>
                        </div>
                        <div className="flex space-x-2 py-2">
                            <Link
                                to="/admin/tax-and-service"
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
        </div>
    );
};

export default CreateService;
