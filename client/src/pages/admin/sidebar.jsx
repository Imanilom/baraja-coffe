import React from "react";
import { Link, useLocation } from "react-router-dom";

// Custom hook to get the current active path
const useActiveRoute = () => {
  const location = useLocation();
  return location.pathname;
};

const Sidebar = () => {
  // Define menu items dynamically
  const menuItems = [
    { name: "Menu Management", path: "/admin/menu" },
    { name: "Voucher Management", path: "/admin/voucher" },
    { name: "Storage Management", path: "/admin/storage" },
    { name: "Promotion Management", path: "/admin/promotion" },
    { name: "Outlet Management", path: "/admin/toko" },
    { name: "User Management", path: "/admin/user" },
    { name: "Profile", path: "/profile" },
  ];

  const activeRoute = useActiveRoute();

  return (
    <div
      className="w-64 h-screen bg-gray-800 text-white fixed top-0 left-0 p-5 overflow-y-auto"
      aria-label="Admin Dashboard Sidebar"
    >
      <h2 className="text-xl font-bold mb-6">Admin Dashboard</h2>
      <ul className="space-y-2">
        {menuItems.map((item, index) => (
          <li key={index}>
            <Link
              to={item.path}
              className={`block py-2 px-4 rounded hover:bg-gray-700 ${
                activeRoute.startsWith(item.path) ? "bg-gray-700" : ""
              }`}
              aria-current={activeRoute.startsWith(item.path) ? "page" : undefined}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;