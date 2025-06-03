import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaPoll,
  FaClipboardList,
  FaShoppingBag,
  FaBoxes,
  FaReceipt,
  FaUserCircle,
  FaChevronDown,
  FaChevronLeft,
  FaCut,
  FaStoreAlt,
  FaUserFriends,
  FaIdBadge,
  FaTabletAlt,
  FaHandshake,
  FaTh,
  FaDollarSign,
} from "react-icons/fa";

const useActiveRoute = () => {
  const location = useLocation();
  return location.pathname;
};

const Sidebar = () => {
  const [openMenus, setOpenMenus] = useState({});
  const activeRoute = useActiveRoute();

  const menuItems = [
    {
      section: "",
      items: [
        { name: "Dashboard", path: "/admin/dashboard", icon: <FaPoll /> },
        {
          name: "Laporan",
          icon: <FaClipboardList />,
          subMenu: [
            { name: "Laporan Penjualan", path: "/admin/report" },
            { name: "Laporan Operasional", path: "/admin/report/stock" },
            { name: "Laporan Laba & Rugi", path: "/admin/report/finance" },
          ]
        },
      ]
    },
    {
      section: "Produk",
      items: [
        { name: "Produk", path: "/admin/menu", icon: <FaShoppingBag /> },
        {
          name: "Inventori", icon: <FaBoxes />,
          subMenu: [
            { name: "Kartu Stok", path: "/admin/storage" },
            { name: "Stok Masuk", path: "/admin/storage" },
            { name: "Stok Keluar", path: "/admin/storage" },
            { name: "Transfer Stok", path: "/admin/storage" },
            { name: "Stok Opname", path: "/admin/storage" },
            { name: "Produksi Stok", path: "/admin/storage" },
          ]
        },
        {
          name: "Pembelian", icon: <FaReceipt />,
          subMenu: [
            { name: "Supplier", path: "/admin/storage" },
            { name: "Purchase Order", path: "/admin/storage" },
            { name: "Daftar Belanja", path: "/admin/storage" },
            { name: "Daftar Pengeluaran", path: "/admin/storage" },
          ]
        },
      ],
    },
    {
      section: "Bisnis",
      items: [
        { name: "Outlet", path: "/admin/outlet", icon: <FaStoreAlt /> },
        { name: "Karyawan", path: "/profile", icon: <FaIdBadge /> },
        { name: "Pelanggan", path: "/profile", icon: <FaUserFriends /> },
        {
          name: "Pengaturan Meja", icon: <FaUserCircle />,
          subMenu: [
            { name: "Atur Meja", path: "/admin/storage" },
            { name: "Denah Meja", path: "/admin/storage" }
          ]
        },
        { name: "Perangkat", path: "/profile", icon: <FaTabletAlt /> },
        { name: "Promo", path: "/admin/voucher", icon: <FaCut /> },
        { name: "Komisi", path: "/profile", icon: <FaHandshake /> },
      ],
    },
    {
      section: "Pengaturan",
      items: [
        // { name: "User Management", path: "/admin/user", icon: <FaUsers /> },
        { name: "Akun", path: "/profile", icon: <FaUserCircle /> },
        { name: "Aplikasi", path: "/profile", icon: <FaTh /> },
        { name: "Billing", path: "/profile", icon: <FaDollarSign /> },
      ],
    },
  ];

  const toggleMenu = (menuName) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  return (
    <div className="w-64 h-screen bg-gray-800 text-white fixed top-0 left-0 overflow-y-auto">
      <h2 className="text-xl font-bold mb-6 px-4 pt-4">Admin Dashboard</h2>
      <ul className="transition-all duration-300 ease-in-out">
        {menuItems.map((section, idx) => (
          <div key={idx} className="mb-4">
            <h3 className="px-4 text-sm text-gray-400 uppercase tracking-wider font-semibold mb-2">
              {section.section}
            </h3>
            <ul className="">
              {section.items.map((item, index) => {
                const hasActiveSubRoute = item.subMenu?.some((sub) =>
                  activeRoute.startsWith(sub.path)
                );
                const isSubMenuOpen =
                  openMenus[item.name] !== undefined
                    ? openMenus[item.name]
                    : hasActiveSubRoute;

                const isActive = activeRoute.startsWith(item.path);

                return (
                  <li key={index}>
                    {item.subMenu ? (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleMenu(item.name)}
                          className={`group relative w-full flex items-center justify-between py-3 px-4 overflow-hidden font-semibold transition-all ${isSubMenuOpen ? "bg-gray-700 text-white" : "text-gray-300"
                            }`}
                        >
                          <div className="flex items-center gap-2 relative z-10 group-hover:text-white transition-all">
                            {item.icon}
                            <span>{item.name}</span>
                          </div>
                          <div className="relative z-10">
                            {isSubMenuOpen ? (
                              <FaChevronDown className="transition-transform" />
                            ) : (
                              <FaChevronLeft className="transition-transform" />
                            )}
                          </div>
                          <span className="absolute left-0 top-0 h-full w-0 bg-gray-700 group-hover:w-full transition-all duration-300 ease-out z-0" />
                        </button>

                        {isSubMenuOpen && (
                          <ul className="bg-gray-900">
                            {Array.isArray(item.subMenu) &&
                              item.subMenu.map((subItem, subIndex) => {
                                const isSubActive = activeRoute.startsWith(subItem.path);
                                return (
                                  <li key={subIndex}>
                                    <Link
                                      to={subItem.path}
                                      className={`group relative block py-2 px-4 overflow-hidden transition-all ${isSubActive ? "bg-gray-700 text-white" : "text-gray-300"
                                        }`}
                                    >
                                      <div className="flex items-center gap-2 relative z-10 group-hover:text-white">
                                        <span className="w-[20px] inline-block" />
                                        <span>{subItem.name}</span>
                                      </div>
                                      <span className="absolute left-0 top-0 h-full w-0 bg-gray-700 group-hover:w-full transition-all duration-300 ease-out z-0" />
                                    </Link>
                                  </li>
                                );
                              })}
                          </ul>
                        )}
                      </>
                    ) : (
                      <Link
                        to={item.path}
                        className={`group relative block py-3 px-4 overflow-hidden transition-all ${isActive ? "bg-gray-700 text-white" : "text-gray-300"
                          }`}
                      >
                        <div className="flex items-center gap-2 relative z-10 group-hover:text-white">
                          {item.icon}
                          <span>{item.name}</span>
                        </div>
                        <span className="absolute left-0 top-0 h-full w-0 bg-gray-700 group-hover:w-full transition-all duration-300 ease-out z-0" />
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </ul>

    </div>
  );
};

export default Sidebar;
