// import { useState } from "react";
// import { Link, useLocation } from "react-router-dom";
// import {
//   FaPoll,
//   FaClipboardList,
//   FaShoppingBag,
//   FaBoxes,
//   FaReceipt,
//   FaUserCircle,
//   FaChevronDown,
//   FaChevronLeft,
//   FaCut,
//   FaStoreAlt,
//   FaUserFriends,
//   FaIdBadge,
//   FaTabletAlt,
//   FaHandshake,
//   FaTh,
//   FaDollarSign,
//   FaChevronRight,
//   FaTicketAlt,
// } from "react-icons/fa";

// const useActiveRoute = () => {
//   const location = useLocation();
//   return location.pathname;
// };

// const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
//   const [openMenus, setOpenMenus] = useState({});
//   const activeRoute = useActiveRoute();
//   const menuItems = [
//     {
//       section: "",
//       items: [
//         { name: "Dashboard", path: "/admin/dashboard", icon: <FaPoll /> },
//         {
//           name: "Laporan",
//           icon: <FaClipboardList />,
//           subMenu: [
//             { name: "Laporan Penjualan", path: "/admin/sales-menu" },
//             { name: "Laporan Operasional", path: "/admin/operational-menu" },
//             { name: "Laporan Laba & Rugi", path: "/admin/profit-menu" },
//           ]
//         },
//       ]
//     },
//     {
//       section: "Produk",
//       items: [
//         { name: "Produk", path: "/admin/menu", icon: <FaShoppingBag /> },
//         {
//           name: "Inventori", icon: <FaBoxes />,
//           subMenu: [
//             // { name: "Kartu Stok", path: "/admin/inventory/stockcard" },
//             // { name: "Stok Tersedia", path: "/admin/inventory/current-stock" },
//             { name: "Stok Masuk", path: "/admin/inventory/in" },
//             { name: "Stok Keluar", path: "/admin/inventory/out" },
//             { name: "Stock Opname", path: "/admin/inventory/so" },
//             // { name: "Transfer Stok", path: "/admin/inventory/transfer" },
//             // { name: "Stok Opname", path: "/admin/inventory/stockopname" },
//             // { name: "Produk List", path: "/admin/inventory/production-list" },
//             // { name: "Produk Stok", path: "/admin/inventory/production-stock" },
//           ]
//         },
//         {
//           name: "Pembelian", icon: <FaReceipt />,
//           subMenu: [
//             { name: "Supplier", path: "/admin/purchase/supplier" },
//             { name: "Purchase Order", path: "/admin/purchase/purchase-order" },
//             { name: "Daftar Belanja", path: "/admin/purchase/shopping-list" },
//             { name: "Daftar Pengeluaran", path: "/admin/purchase/expenditure-list" },
//           ]
//         },
//       ],
//     },
//     {
//       section: "Bisnis",
//       items: [
//         { name: "Outlet", path: "/admin/outlet", icon: <FaStoreAlt /> },
//         { name: "Event", path: "/admin/event", icon: <FaTicketAlt /> },
//         { name: "Karyawan", path: "/admin/employee", icon: <FaIdBadge /> },
//         { name: "Pelanggan", path: "/admin/customer", icon: <FaUserFriends /> },
//         {
//           name: "Pengaturan Meja", icon: <FaUserCircle />,
//           subMenu: [
//             { name: "Atur Meja", path: "/admin/table-management" },
//             { name: "Denah Meja", path: "/admin/table-plan" }
//           ]
//         },
//         { name: "Perangkat", path: "/admin/billing/device", icon: <FaTabletAlt /> },
//         { name: "Promo", path: "/admin/promotion", icon: <FaCut /> },
//         { name: "Komisi", path: "/admin/commission", icon: <FaHandshake /> },
//       ],
//     },
//     {
//       section: "Pengaturan",
//       items: [
//         // { name: "User Management", path: "/admin/user", icon: <FaUsers /> },
//         { name: "Akun", path: "/profile", icon: <FaUserCircle /> },
//         { name: "Aplikasi", path: "/profile", icon: <FaTh /> },
//         { name: "Billing", path: "/profile", icon: <FaDollarSign /> },
//         { name: "Setting Access", path: "/admin/access-settings", icon: <FaDollarSign /> },
//       ],
//     },
//   ];

//   const toggleMenu = (menuName) => {
//     setOpenMenus((prev) => ({
//       ...prev,
//       [menuName]: !prev[menuName],
//     }));
//   };

//   return (
//     <>
//       <div className={`${isSidebarOpen ? "bg-black absolute w-full h-screen opacity-50 z-30 lg:hidden" : "w-0 overflow-hidden"}`}>

//       </div>
//       <div className={`h-screen bg-gray-800 text-white fixed top-0 left-0 flex flex-col transition-all duration-300 z-40
//     ${isSidebarOpen ? "w-64" : "w-0 overflow-hidden"}`}>
//         <style>
//           {`
//         .custom-scrollbar {
//           scrollbar-gutter: stable;
//         }

//         .custom-scrollbar::-webkit-scrollbar {
//           width: 8px;
//         }

//         .custom-scrollbar::-webkit-scrollbar-track {
//           background: transparent;
//         }

//         .custom-scrollbar::-webkit-scrollbar-thumb {
//           background-color: white;
//           border-radius: 10px;
//         }

//         .custom-scrollbar::-webkit-scrollbar-button {
//           display: none;
//         }
//       `}
//         </style>

//         {/* Sticky Header */}
//         <div className="px-4 pt-4 pb-2 shrink-0">
//           <div className="text-center mb-4">
//             <img
//               src="/images/baraja white.png"
//               alt="Logo"
//               className="mx-auto max-w-xs w-full"
//             />
//           </div>
//         </div>

//         <hr className="mx-6" />

//         {/* Scrollable Menu */}
//         <div className="relative flex-1">
//           <div className="absolute inset-0 overflow-y-hidden hover:overflow-y-auto custom-scrollbar">
//             <ul className="transition-all duration-300 ease-in-out">
//               {menuItems.map((section, idx) => (
//                 <div key={idx} className="mb-4">
//                   <h3 className="px-4 text-sm text-gray-400 uppercase tracking-wider font-semibold mb-2">
//                     {section.section}
//                   </h3>
//                   <ul>
//                     {section.items.map((item, index) => {
//                       const hasActiveSubRoute = item.subMenu?.some((sub) =>
//                         activeRoute.startsWith(sub.path)
//                       );
//                       const isSubMenuOpen =
//                         openMenus[item.name] !== undefined
//                           ? openMenus[item.name]
//                           : hasActiveSubRoute;

//                       const isActive = activeRoute.startsWith(item.path);

//                       return (
//                         <li key={index}>
//                           {item.subMenu ? (
//                             <>
//                               <button
//                                 type="button"
//                                 onClick={() => toggleMenu(item.name)}
//                                 className={`group relative w-full flex items-center justify-between py-3 px-4 overflow-hidden font-semibold transition-all ${isSubMenuOpen ? "bg-gray-700 text-white" : "text-gray-300"
//                                   }`}
//                               >
//                                 <div className="flex items-center gap-2 relative z-10 group-hover:text-white transition-all">
//                                   {item.icon}
//                                   <span>{item.name}</span>
//                                 </div>
//                                 <div className="relative z-10">
//                                   {isSubMenuOpen ? (
//                                     <FaChevronDown className="transition-transform" />
//                                   ) : (
//                                     <FaChevronLeft className="transition-transform" />
//                                   )}
//                                 </div>
//                                 <span className="absolute left-0 top-0 h-full w-0 bg-gray-700 group-hover:w-full transition-all duration-300 ease-out z-0" />
//                               </button>

//                               {isSubMenuOpen && (
//                                 <ul className="bg-gray-900">
//                                   {Array.isArray(item.subMenu) &&
//                                     item.subMenu.map((subItem, subIndex) => {
//                                       const isSubActive = activeRoute.startsWith(subItem.path);
//                                       return (
//                                         <li key={subIndex}>
//                                           <Link
//                                             to={subItem.path}
//                                             className={`group relative block py-2 px-4 overflow-hidden transition-all ${isSubActive ? "bg-gray-700 text-white" : "text-gray-300"
//                                               }`}
//                                           >
//                                             <div className="flex items-center gap-2 relative z-10 group-hover:text-white">
//                                               <span className="w-[20px] inline-block" />
//                                               <span>{subItem.name}</span>
//                                             </div>
//                                             <span className="absolute left-0 top-0 h-full w-0 bg-gray-700 group-hover:w-full transition-all duration-300 ease-out z-0" />
//                                           </Link>
//                                         </li>
//                                       );
//                                     })}
//                                 </ul>
//                               )}
//                             </>
//                           ) : (
//                             <Link
//                               to={item.path}
//                               className={`group relative block py-3 px-4 overflow-hidden transition-all ${isActive ? "bg-gray-700 text-white" : "text-gray-300"
//                                 }`}
//                             >
//                               <div className="flex items-center gap-2 relative z-10 group-hover:text-white">
//                                 {item.icon}
//                                 <span>{item.name}</span>
//                               </div>
//                               <span className="absolute left-0 top-0 h-full w-0 bg-gray-700 group-hover:w-full transition-all duration-300 ease-out z-0" />
//                             </Link>
//                           )}
//                         </li>
//                       );
//                     })}
//                   </ul>
//                 </div>
//               ))}
//             </ul>
//           </div>
//         </div>
//       </div >
//     </>
//   );
// };

// export default Sidebar;

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
  FaStoreAlt,
  FaUserFriends,
  FaIdBadge,
  FaTabletAlt,
  FaHandshake,
  FaCut,
  FaTicketAlt,
  FaDollarSign,
} from "react-icons/fa";
import { useSelector } from "react-redux";

const useActiveRoute = () => {
  const location = useLocation();
  return location.pathname;
};

const Sidebar = ({ isSidebarOpen }) => {
  const { currentUser } = useSelector((state) => state.user);
  const [openMenus, setOpenMenus] = useState({});
  const activeRoute = useActiveRoute();

  // ===============================
  // 🔑 Role yang aktif (ambil dari localStorage / API / hardcode dulu)
  // ===============================
  // const currentRole = "akuntan"; // ganti sesuai role aktif (superadmin, marketing, operasional, akuntan, hrd, qc, inventory)
  const currentRole = currentUser.role; // ganti sesuai role aktif (superadmin, marketing, operasional, akuntan, hrd, qc, inventory)

  // ===============================
  // 🔑 Role -> Menu Mapping
  // ===============================
  const roleMenus = {
    superadmin: ["Dashboard", "Laporan", "Laporan Penjualan", "Produk", "Inventori", "Pembelian", "Outlet", "Event", "Karyawan", "Pelanggan", "Pengaturan Meja", "Perangkat", "Promo", "Komisi", "Akun", "Setting Access", "Laporan Penjualan", "Laporan Operasional", "Laporan Laba & Rugi",
      "Stok Masuk",
      "Stok Keluar",
      "Stock Opname",
      "Supplier",
      "Purchase Order",
      "Daftar Belanja",
      "Daftar Pengeluaran",
      "Atur Meja", "Denah Meja"],
    marketing: ["Dashboard", "Event", "Pelanggan", "Promo"],
    operational: ["Dashboard", "Laporan Operasional", "Outlet", "Pengaturan Meja", "Atur Meja", "Denah Meja", "Perangkat"],
    akuntan: ["Dashboard", "Laporan Penjualan", "Laporan Laba & Rugi", "Komisi"],
    hrd: ["Dashboard", "Karyawan", "Akun", "Setting Access"],
    qc: ["Dashboard", "Produk", "Event"],
    inventory: ["Dashboard", "Inventori", "Stok Masuk", "Stok Keluar", "Stock Opname", "Pembelian", "Supplier", "Purchase Order", "Daftar Belanja", "Daftar Pengeluaran"],
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
      ],
    },
    {
      section: "Produk",
      items: [
        { name: "Produk", path: "/admin/menu", icon: <FaShoppingBag /> },
        {
          name: "Inventori",
          icon: <FaBoxes />,
          subMenu: [
            { name: "Stok Masuk", path: "/admin/inventory/in" },
            { name: "Stok Keluar", path: "/admin/inventory/out" },
            { name: "Stock Opname", path: "/admin/inventory/so" },
          ],
        },
        {
          name: "Pembelian",
          icon: <FaReceipt />,
          subMenu: [
            { name: "Supplier", path: "/admin/purchase/supplier" },
            { name: "Purchase Order", path: "/admin/purchase/purchase-order" },
            { name: "Daftar Belanja", path: "/admin/purchase/shopping-list" },
            { name: "Daftar Pengeluaran", path: "/admin/purchase/expenditure-list" },
          ],
        },
      ],
    },
    {
      section: "Bisnis",
      items: [
        { name: "Outlet", path: "/admin/outlet", icon: <FaStoreAlt /> },
        { name: "Event", path: "/admin/event", icon: <FaTicketAlt /> },
        { name: "Karyawan", path: "/admin/employee", icon: <FaIdBadge /> },
        { name: "Pelanggan", path: "/admin/customer", icon: <FaUserFriends /> },
        {
          name: "Pengaturan Meja",
          icon: <FaUserCircle />,
          subMenu: [
            { name: "Atur Meja", path: "/admin/table-management" },
            { name: "Denah Meja", path: "/admin/table-plan" },
          ],
        },
        { name: "Perangkat", path: "/admin/billing/device", icon: <FaTabletAlt /> },
        { name: "Promo", path: "/admin/promotion", icon: <FaCut /> },
        { name: "Komisi", path: "/admin/commission", icon: <FaHandshake /> },
      ],
    },
    {
      section: "Pengaturan",
      items: [
        { name: "Akun", path: "/profile", icon: <FaUserCircle /> },
        { name: "Setting Access", path: "/admin/access-settings", icon: <FaDollarSign /> },
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

  return (
    <div
      className={`h-screen bg-gray-800 text-white fixed top-0 left-0 flex flex-col transition-all duration-300 z-40
      ${isSidebarOpen ? "w-64" : "w-0 overflow-hidden"}`}
    >
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="text-center mb-4">
          <img src="/images/baraja white.png" alt="Logo" className="mx-auto max-w-xs w-full" />
        </div>
      </div>
      <hr className="mx-6" />

      <div className="relative flex-1">
        <div className="absolute inset-0 overflow-y-hidden hover:overflow-y-auto custom-scrollbar">
          <ul className="transition-all duration-300 ease-in-out">
            {filteredMenuItems.map((section, idx) => (
              <div key={idx} className="mb-4">
                <h3 className="px-4 text-sm text-gray-400 uppercase tracking-wider font-semibold mb-2">
                  {section.section}
                </h3>
                <ul>
                  {section.items.map((item, index) => {
                    const hasActiveSubRoute = item.subMenu?.some((sub) => activeRoute.startsWith(sub.path));
                    const isSubMenuOpen = openMenus[item.name] ?? hasActiveSubRoute;
                    const isActive = activeRoute.startsWith(item.path);

                    return (
                      <li key={index}>
                        {item.subMenu ? (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleMenu(item.name)}
                              className={`group relative w-full flex items-center justify-between py-3 px-4 font-semibold transition-all ${isSubMenuOpen ? "bg-gray-700 text-white" : "text-gray-300"}`}
                            >
                              <div className="flex items-center gap-2">
                                {item.icon}
                                <span>{item.name}</span>
                              </div>
                              {isSubMenuOpen ? <FaChevronDown /> : <FaChevronLeft />}
                            </button>

                            {isSubMenuOpen && (
                              <ul className="bg-gray-900">
                                {item.subMenu.map((subItem, subIndex) => {
                                  const isSubActive = activeRoute.startsWith(subItem.path);
                                  return (
                                    <li key={subIndex}>
                                      <Link
                                        to={subItem.path}
                                        className={`block py-2 px-4 ${isSubActive ? "bg-gray-700 text-white" : "text-gray-300"}`}
                                      >
                                        <span className="ml-6">{subItem.name}</span>
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
                            className={`block py-3 px-4 ${isActive ? "bg-gray-700 text-white" : "text-gray-300"}`}
                          >
                            <div className="flex items-center gap-2">{item.icon}<span>{item.name}</span></div>
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
    </div>
  );
};

export default Sidebar;

