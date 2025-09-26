import { useEffect, useState } from "react";
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
  FaStoreAlt,
  FaUserFriends,
  FaIdBadge,
  FaTabletAlt,
  FaHandshake,
  FaCut,
  FaTicketAlt,
  FaDollarSign,
  FaSignOutAlt,
  FaMoon,
  FaClock,
  FaPhotoVideo,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";

import { signOut } from '../../redux/user/userSlice';
import axios from "axios";

const useActiveRoute = () => {
  const location = useLocation();
  return location.pathname;
};

const Sidebar = ({ isSidebarOpen }) => {
  const dispatch = useDispatch();
  const [warehouse, setWarehouses] = useState([]);
  const [loading, setLoading] = useState([]);
  const { currentUser } = useSelector((state) => state.user);
  const [openMenus, setOpenMenus] = useState({});
  const activeRoute = useActiveRoute();

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/warehouses", {
        params: {
          limit: 10,
        }
      });

      setWarehouses(res.data.data);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  // ===============================
  // 🔑 Role yang aktif (ambil dari localStorage / API / hardcode dulu)
  // ===============================

  const myWarehouses = warehouse.filter((wh) =>
    wh.admin && (typeof wh.admin === "object"
      ? wh.admin._id === currentUser._id
      : wh.admin === currentUser._id)
  );

  const currentRole =
    myWarehouses[0]?.admin?._id === currentUser._id
      ? currentUser.role
      : null || currentUser.role === "admin" ? currentUser.role
        : null || currentUser.role === "superadmin" ? currentUser.role
          : null || currentUser.role === "akuntan" ? currentUser.role
            : null;


  // ===============================
  // 🔑 Role -> Menu Mapping
  // ===============================
  const roleMenus = {
    superadmin: ["Dashboard", "Laporan", "Laporan Penjualan", "Menu", "Inventori", "Pembelian", "Outlet", "Event", "Karyawan", "Pelanggan", "Pengaturan Meja", "Perangkat", "Promo", "Komisi", "Akun", "Setting Access", "Laporan Penjualan", "Laporan Operasional", "Laporan Laba & Rugi",
      "Stok Masuk",
      "Stok Keluar",
      "Stock Gudang",
      "Supplier",
      "Purchase Order",
      "Daftar Belanja",
      "Daftar Pengeluaran",
      "Atur Meja", "Denah Meja", "Logs", "Limit Permintaan", "Pajak & Layanan", "Analisis Resto", "Konten", "QR"],
    admin: ["Dashboard", "Laporan", "Laporan Penjualan", "Menu", "Inventori", "Pembelian", "Outlet", "Event", "Karyawan", "Pelanggan", "Pengaturan Meja", "Perangkat", "Promo", "Komisi", "Akun", "Setting Access", "Laporan Penjualan", "Laporan Operasional", "Laporan Laba & Rugi",
      "Stok Masuk",
      "Stok Keluar",
      "Stock Gudang",
      "Supplier",
      "Purchase Order",
      "Daftar Belanja",
      "Daftar Pengeluaran",
      "Atur Meja", "Denah Meja", "Logs", "Limit Permintaan", "Pajak & Layanan", "Analisis Resto", "Konten", "QR"],
    marketing: ["Dashboard", "Event", "Pelanggan", "Promo"],
    operasional: ["Dashboard", "Laporan Operasional", "Outlet", "Pengaturan Meja", "Atur Meja", "Denah Meja", "Perangkat"],
    akuntan: ["Dashboard", "Laporan Penjualan", "Laporan Laba & Rugi", "Komisi"],
    hrd: ["Dashboard", "Karyawan", "Akun", "Setting Access"],
    qc: ["Dashboard", "Menu", "Event"],
    inventory: ["Dashboard", "Inventori", "Stok Masuk", "Stok Keluar", "Stock Gudang", "Pembelian", "Supplier", "Purchase Order", "Daftar Belanja", "Daftar Pengeluaran", "Limit Permintaan"],
  };

  // ===============================
  // 📂 Semua menu
  // ===============================
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
          ],
        },
        { name: "Analisis Resto", path: "/admin/restaurant-analytics", icon: <FaPoll /> },
      ],
    },
    {
      section: "Produk",
      items: [
        { name: "Menu", path: "/admin/menu", icon: <FaShoppingBag /> },
        {
          name: "Inventori",
          icon: <FaBoxes />,
          subMenu: [
            { name: "Stok Masuk", path: "/admin/inventory/in" },
            { name: "Stok Keluar", path: "/admin/inventory/out" },
            { name: "Stock Gudang", path: "/admin/inventory/so" },
            { name: "Limit Permintaan", path: "/admin/inventory/production-list" },
          ],
        },
        // {
        //   name: "Pembelian",
        //   icon: <FaReceipt />,
        //   subMenu: [
        //     { name: "Supplier", path: "/admin/purchase/supplier" },
        //     { name: "Purchase Order", path: "/admin/purchase/purchase-order" },
        //     { name: "Daftar Belanja", path: "/admin/purchase/shopping-list" },
        //     { name: "Daftar Pengeluaran", path: "/admin/purchase/expenditure-list" },
        //   ],
        // },
      ],
    },
    {
      section: "Bisnis",
      items: [
        { name: "Outlet", path: "/admin/outlet", icon: <FaStoreAlt /> },
        { name: "Pajak & Layanan", path: "/admin/tax-and-service", icon: <FaClipboardList /> },
        { name: "Event", path: "/admin/event", icon: <FaTicketAlt /> },
        { name: "Konten", path: "/admin/content", icon: <FaPhotoVideo /> },
        { name: "Karyawan", path: "/admin/employee", icon: <FaIdBadge /> },
        { name: "Pelanggan", path: "/admin/customer", icon: <FaUserFriends /> },
        {
          name: "Pengaturan Meja",
          icon: <FaUserCircle />,
          subMenu: [
            { name: "Atur Meja", path: "/admin/table-management" },
            { name: "Denah Meja", path: "/admin/table-plan" },
            { name: "QR", path: "/admin/generate-qr" },
          ],
        },
        { name: "Perangkat", path: "/admin/billing/device", icon: <FaTabletAlt /> },
        { name: "Promo", path: "/admin/promotion", icon: <FaCut /> },
        // { name: "Komisi", path: "/admin/commission", icon: <FaHandshake /> },
      ],
    },
    {
      section: "Pengaturan",
      items: [
        { name: "Akun", path: "/profile", icon: <FaUserCircle /> },
        { name: "Setting Access", path: "/admin/access-settings", icon: <FaUserCircle /> },
        { name: "Logs", path: "/admin/logs", icon: <FaClock /> },
      ],
    },
  ];

  // ===============================
  // 🔍 Filter menu sesuai role
  // ===============================
  const allowedMenus = roleMenus[currentRole] || [];
  const filteredMenuItems = menuItems
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.subMenu) {
          const subAllowed = item.subMenu.filter((sub) => allowedMenus.includes(sub.name));
          if (subAllowed.length > 0 || allowedMenus.includes(item.name)) {
            item.subMenu = subAllowed;
            return true;
          }
        }
        return allowedMenus.includes(item.name);
      }),
    }))
    .filter((section) => section.items.length > 0);

  const toggleMenu = (menuName) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout');
      dispatch(signOut());
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      className={`h-screen bg-green-900 text-white fixed top-0 left-0 flex flex-col transition-all duration-300 z-40 shadow-lg ${isSidebarOpen ? "w-72" : "w-16"}`}
    >
      {/* Logo */}
      <div className="px-4 pt-6 pb-4 shrink-0 flex justify-center">
        <img
          src="/images/baraja white.png"
          alt="Logo"
          className={`${isSidebarOpen ? "w-full" : "w-8"} object-contain`}
        />
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        <ul className="space-y-8">
          {filteredMenuItems.map((section, idx) => (
            <div key={idx} className="space-y-2">
              {/* Section title */}
              <h3 className="px-2 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                {isSidebarOpen ? section.section : section.section[0]}
              </h3>

              {/* Items */}
              <ul className="space-y-1">
                {section.items.map((item, index) => {
                  const hasActiveSubRoute = item.subMenu?.some((sub) =>
                    activeRoute.startsWith(sub.path)
                  );
                  const isSubMenuOpen = openMenus[item.name] ?? hasActiveSubRoute;
                  const isActive = activeRoute.startsWith(item.path);

                  return (
                    <li key={index}>
                      {item.subMenu ? (
                        <>
                          {/* Parent with submenu */}
                          <button
                            type="button"
                            onClick={() => toggleMenu(item.name)}
                            className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg font-medium transition
                            ${isSubMenuOpen
                                ? "bg-green-100 text-green-900 font-semibold"
                                : "text-white hover:bg-green-50 hover:text-green-900"
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              {item.icon}
                              {isSidebarOpen && <span>{item.name}</span>}
                            </div>
                            {isSidebarOpen &&
                              (isSubMenuOpen ? <FaChevronDown /> : <FaChevronLeft />)}
                          </button>

                          {/* Submenu */}
                          {isSubMenuOpen && isSidebarOpen && (
                            <ul className="ml-3 border-l border-gray-200 space-y-1">
                              {item.subMenu.map((subItem, subIndex) => {
                                const isSubActive = activeRoute.startsWith(
                                  subItem.path
                                );
                                return (
                                  <li key={subIndex}>
                                    <Link
                                      to={subItem.path}
                                      className={`block py-2 px-5 rounded-lg text-sm transition
                                      ${isSubActive
                                          ? "bg-green-100 text-green-900 font-semibold"
                                          : "text-white hover:bg-green-50 hover:text-green-900"
                                        }`}
                                    >
                                      {subItem.name}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </>
                      ) : (
                        // Normal menu
                        <Link
                          to={item.path}
                          className={`block py-2.5 px-3 rounded-lg transition font-medium
                          ${isActive
                              ? "bg-green-100 text-green-900 font-semibold"
                              : "text-white hover:bg-green-50 hover:text-green-900"
                            }`}
                        >
                          <div className="flex items-center gap-2 justify-start">
                            {item.icon}
                            {isSidebarOpen && <span>{item.name}</span>}
                          </div>
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

      {/* Footer User Info */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-3 mb-3 justify-start">
          <img
            src="https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"
            alt="User Avatar"
            className="w-10 h-10 rounded-full border border-gray-300"
          />
          {isSidebarOpen && (
            <div className="text-sm">
              <p className="font-semibold text-white">{currentUser.username}</p>
              <p className="text-gray-400 text-xs capitalize">
                {currentUser.role}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full py-2 px-3 rounded-lg text-white hover:bg-green-50 hover:text-green-900 transition justify-center md:justify-start"
        >
          <FaSignOutAlt className="text-white" />
          {isSidebarOpen && <span className="font-medium">Log out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

