import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import SidebarMenuForm from "./form";
import Header from "../../admin/header";
import { useSelector } from "react-redux";

const UpdateSidebarMenu = () => {
    const { currentUser } = useSelector((state) => state.user);
    const { id } = useParams();
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
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();


    const fetchAllMenus = async () => {
        try {
            const res = await axios.get(`/api/sidebar/admin/menus`, {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            const allMenus = res.data.data || [];
            // hanya ambil menu utama (parentId === null)
            const parentMenus = allMenus.filter((m) => m.parentId === null);
            setMenus(parentMenus);
        } catch (err) {
            console.error("Error fetching menus:", err);
        }
    };

    useEffect(() => {
        fetchAllMenus();
    }, []);

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const res = await axios.get(`/api/sidebar/admin/menus`, {
                    headers: { Authorization: `Bearer ${currentUser.token}` },
                });
                const menuRes = res.data.data;
                const menu = menuRes.find((item) => item._id === id);
                setFormData({
                    name: menu.name,
                    icon: menu.icon,
                    path: menu.path,
                    order: menu.order,
                    requiredPermissions: menu.requiredPermissions || [],
                    isActive: menu.isActive,          // default aktif
                    isSubmenu: menu.isSubmenu,        // default bukan submenu
                    parentId: menu.parentId,          // default tanpa parent
                    badge: {
                        text: "",
                        color: "primary",    // default warna badge
                    },
                });
            } catch (err) {
                console.error("Error fetching menu:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMenu();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.put(`/api/sidebar/admin/menus/${id}`, formData, {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            navigate("/admin/access-settings/bar-menu");
        } catch (err) {
            console.error("Error updating menu:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <p className="p-6">Loading...</p>;

    return (
        <>
            <div className="p-6">
                <h1 className="text-lg font-bold mb-4">Update Sidebar Menu</h1>
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

export default UpdateSidebarMenu;
