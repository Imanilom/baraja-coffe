import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { app } from "../../firebase";  // Import your Firebase app initialization
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser } from "react-icons/fa";

const CreateTax = () => {
    const [formData, setFormData] = useState({
        name: "tax",
        description: "",
        percentage: "",
        fixedFee: "",
        appliesToOutlets: "",
        appliesToMenuItems: "",
        appliesToCustomerTypes: "",
        isActive: ""
    });

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleCreateTax = async () => {
        try {
            const response = await axios.post("/api/tax-service", formData);
            alert(response.data.message);
            fetchOutlets();
        } catch (error) {
            alert("Error creating Tax.");
        }
    };

    return (
        <div className="overflow-y-scroll h-screen">
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
                    <FaClipboardList size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Tambah Pajak</p>
                </div>
            </div>

            <div className="mt-6 p-3">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleCreateTax();
                    }}
                    className="mt-4"
                >
                    <div className="w-full">
                        <strong className="text-[14px] block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 mb-2.5">Nama Pajak</strong>
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="px-4 py-2 border rounded-md w-1/2 focus:outline-none focus:border-[#005429] focus:ring-1 focus:ring-[#005429]"
                            required
                        />
                    </div>

                    <div className="w-full">
                        <strong className="text-[14px] block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 mb-2.5">Jumlah</strong>
                        <input
                            type="text"
                            name="percentage"
                            value={formData.percentage}
                            onChange={handleInputChange}
                            className="px-4 py-2 border rounded-md w-1/12 focus:outline-none focus:border-[#005429] focus:ring-1 focus:ring-[#005429]"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="mt-4 bg-[#005429] text-white px-6 py-2 rounded-md"
                    >
                        Simpan
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateTax;
