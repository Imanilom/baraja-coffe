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
  FaChevronRight,
} from "react-icons/fa";

const useActiveRoute = () => {
  const location = useLocation();
  return location.pathname;
};

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
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
            { name: "Laporan Penjualan", path: "/admin/sales-menu" },
            { name: "Laporan Operasional", path: "/admin/operational-menu" },
            { name: "Laporan Laba & Rugi", path: "/admin/profit-menu" },
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
            { name: "Kartu Stok", path: "/admin/inventory/stockcard" },
            { name: "Stok Masuk", path: "/admin/inventory/in" },
            { name: "Stok Keluar", path: "/admin/inventory/out" },
            { name: "Transfer Stok", path: "/admin/inventory/transfer" },
            { name: "Stok Opname", path: "/admin/inventory/stockopname" },
            { name: "Produksi Stok", path: "/admin/inventory/production" },
          ]
        },
        {
          name: "Pembelian", icon: <FaReceipt />,
          subMenu: [
            { name: "Supplier", path: "/admin/purchase/supplier" },
            { name: "Purchase Order", path: "/admin/purchase/purchase-order" },
            { name: "Daftar Belanja", path: "/admin/purchase/shopping-list" },
            { name: "Daftar Pengeluaran", path: "/admin/purchase/expenditure-list" },
          ]
        },
      ],
    },
    {
      section: "Bisnis",
      items: [
        { name: "Outlet", path: "/admin/outlet", icon: <FaStoreAlt /> },
        { name: "Karyawan", path: "/admin/employee", icon: <FaIdBadge /> },
        { name: "Pelanggan", path: "/admin/customer", icon: <FaUserFriends /> },
        {
          name: "Pengaturan Meja", icon: <FaUserCircle />,
          subMenu: [
            { name: "Atur Meja", path: "/admin/table-management" },
            { name: "Denah Meja", path: "/admin/table-plan" }
          ]
        },
        { name: "Perangkat", path: "/admin/billing/device", icon: <FaTabletAlt /> },
        { name: "Promo", path: "/admin/promotion", icon: <FaCut /> },
        { name: "Komisi", path: "/admin/commission", icon: <FaHandshake /> },
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
    <>
      <div className={`h-screen bg-gray-800 text-white fixed top-0 left-0 flex flex-col transition-all duration-300 z-40
    ${isSidebarOpen ? "w-64" : "w-0 overflow-hidden"}`}>
        <style>
          {`
        .custom-scrollbar {
          scrollbar-gutter: stable;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: gray;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-button {
          display: none;
        }
      `}
        </style>

        {/* Sticky Header */}
        <div className="px-4 pt-4 pb-2 shrink-0">
          <div className="text-center mb-4">
            <img
              src="/images/baraja white.png"
              alt="Logo"
              className="mx-auto max-w-xs w-full"
            />
          </div>
        </div>

        <hr className="mx-6" />

        {/* Scrollable Menu */}
        <div className="relative flex-1">
          <div className="absolute inset-0 overflow-y-hidden hover:overflow-y-auto custom-scrollbar">
            <ul className="transition-all duration-300 ease-in-out">
              {menuItems.map((section, idx) => (
                <div key={idx} className="mb-4">
                  <h3 className="px-4 text-sm text-gray-400 uppercase tracking-wider font-semibold mb-2">
                    {section.section}
                  </h3>
                  <ul>
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
        </div>
      </div >
    </>
  );
};

export default Sidebar;
