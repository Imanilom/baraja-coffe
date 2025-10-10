import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
    FaChevronRight,
    FaPlus,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import Header from "../../admin/header";
import MessageAlert from "../../../components/messageAlert";
import UserTable from "./table";

const UserManagement = () => {
    const navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.user);
    const [alertMsg, setAlertMsg] = useState("");

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
                        className="bg-[#005429] text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
                    >
                        <FaPlus /> Tambah
                    </Link>
                </div>
            </div>

            {/* Table */}
            <UserTable currentUser={currentUser} customSelectStyles={customSelectStyles} />

        </div>
    );
};

export default UserManagement;
