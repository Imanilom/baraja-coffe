import React from "react";
import { Link } from "react-router-dom";
import {
    FaBook,
    FaFileInvoiceDollar,
    FaShoppingBag,
    FaStore,
    FaSignal,
    FaClock,
    FaTag,
    FaTabletAlt,
    FaAddressCard,
    FaWallet,
    FaRegCreditCard,
    FaUsers,
    FaHome,
    FaList,
} from "react-icons/fa";
import Header from "../admin/header";

const menuItems = [
    { to: "/admin/access-settings/role", label: "Role Manajemen", icon: <FaBook size={24} /> },
    { to: "/admin/access-settings/user", label: "User Manajemen", icon: <FaUsers size={24} /> },
    { to: "/admin/access-settings/departement", label: "Departemen Manajemen", icon: <FaHome size={24} /> },
    { to: "/admin/access-settings/bar-menu", label: "Bar Menu Manajemen", icon: <FaList size={24} /> },
];

const AccessMenu = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-800 mb-6">
                    Pengaturan Akses
                </h1>

                {/* Grid Menu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {menuItems.map((item, idx) => (
                        <Link
                            key={idx}
                            to={item.to}
                            className="flex items-center space-x-3 p-5 
                bg-white text-[#005429] shadow-md 
                hover:bg-[#005429] hover:text-white hover:scale-105 
                transition-all duration-300 ease-in-out"
                        >
                            {item.icon}
                            <h2 className="font-semibold text-base md:text-lg">
                                {item.label}
                            </h2>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default AccessMenu;
