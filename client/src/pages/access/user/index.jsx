import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaChevronRight, FaPlus } from "react-icons/fa";
import { useSelector } from "react-redux";
import MessageAlert from "../../../components/messageAlert";
import UserTable from "./table";

const UserManagement = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [alertMsg, setAlertMsg] = useState("");
    const [activeTab, setActiveTab] = useState("staff");

    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: "#d1d5db",
            minHeight: "34px",
            fontSize: "13px",
            color: "#6b7280",
            boxShadow: state.isFocused ? "0 0 0 1px #005429" : "none",
            "&:hover": {
                borderColor: "#9ca3af",
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: "#6b7280",
        }),
        input: (provided) => ({
            ...provided,
            color: "#6b7280",
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "#9ca3af",
            fontSize: "13px",
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: "13px",
            color: "#374151",
            backgroundColor: state.isFocused ? "rgba(0, 84, 41, 0.1)" : "white",
            cursor: "pointer",
        }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    };

    const tabs = [
        {
            id: "staff",
            label: "Staff & Admin",
            roles: "all",
            exclude: ["cashier", "cashier junior", "cashier senior", "customer"] // exclude cashier & customer
        },
        {
            id: "cashier",
            label: "Cashier",
            roles: ["cashier", "cashier junior", "cashier senior"]
        },
        {
            id: "customer",
            label: "Customer",
            roles: ["customer"]
        },
    ];

    return (
        <div className="flex flex-col">
            <MessageAlert message={alertMsg} type="success" />

            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <Link to="/admin/access-settings">Akses</Link>
                    <FaChevronRight
                        size={18}
                        className="text-green-900 inline-block"
                    />
                    User
                </h1>
                <div className="flex items-center gap-3">
                    <Link
                        to="/admin/access-settings/user-create"
                        className="bg-[#005429] text-white px-4 py-2 rounded flex items-center gap-2 text-sm hover:bg-[#003d1f] transition-colors"
                    >
                        <FaPlus /> Tambah
                    </Link>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="px-6 mb-4">
                <div className="border-b border-gray-200">
                    <div className="flex gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                        ? "border-green-900 text-green-900"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table berdasarkan tab aktif */}
            <UserTable
                currentUser={currentUser}
                customSelectStyles={customSelectStyles}
                roleGroup={activeTab}
                allowedRoles={tabs.find(t => t.id === activeTab)?.roles || []}
                excludeRoles={tabs.find(t => t.id === activeTab)?.exclude || []}
            />
        </div>
    );
};

export default UserManagement;