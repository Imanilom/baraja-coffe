import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SidebarMenuForm from "./form";
import Header from "../../admin/header";
import { useSelector } from "react-redux";

const CreateSidebarMenu = () => {
    const [formData, setFormData] = useState({
        name: "",
        icon: "",
        path: "",
        order: 0,
        requiredPermissions: [],
        isActive: true,          // default aktif
        isSubmenu: false,        // default bukan submenu
        parentId: null,          // default tanpa parent
        badge: {
            text: "",
            color: "primary",    // default warna badge
        },
    });

    const [menus, setMenus] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const { currentUser } = useSelector((state) => state.user);
    const fetchMenus = async () => {
        try {
            const res = await axios.get("/api/sidebar/admin/menus");
            const allMenus = res.data.data || [];
            // hanya ambil menu utama (parentId === null)
            const parentMenus = allMenus.filter((m) => m.parentId === null);
            setMenus(parentMenus);
        } catch (err) {
            console.error("Error fetching menus:", err);
        }
    };

    useEffect(() => {
        fetchMenus();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post("/api/sidebar/admin/menus", formData);
            navigate("/admin/access-settings/bar-menu");
        } catch (err) {
            console.error("Error creating menu:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Header />
            <div className="p-6">
                <h1 className="text-lg font-bold mb-4">Tambah Sidebar Menu</h1>
                <SidebarMenuForm
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    parentOptions={menus} // dikirim ke form
                />
            </div>
        </>
    );
};

export default CreateSidebarMenu;
