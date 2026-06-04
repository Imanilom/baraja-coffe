import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from '@/lib/axios';
import * as LucideIcons from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';

// Helper function untuk render icon dari lucide-react
const renderLucideIcon = (iconName) => {
  if (!iconName) return <LucideIcons.Box className="w-5 h-5" />;

  const IconComponent = LucideIcons[iconName];
  if (!IconComponent) {
    console.warn(`Icon "${iconName}" not found in lucide-react`);
    return <LucideIcons.Box className="w-5 h-5" />;
  }

  return <IconComponent className="w-5 h-5" />;
};

const Sidebar = ({ isSidebarOpen }) => {
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenus, setOpenMenus] = useState({});
  const activeRoute = location.pathname;

  // Fetch menus from API
  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/sidebar/menus", {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });

      // Transform data dari API ke struktur yang dibutuhkan
      const transformedMenus = transformMenuData(res.data.data);
      setMenus(transformedMenus);
    } catch (error) {
      console.error("Error fetching menus:", error.message || error);
    } finally {
      setLoading(false);
    }
  };

  // Manual helpers for grouping if API doesn't provide sections
  const getSection = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('dashboard') || lower.includes('home')) return 'Overview';
    if (lower.includes('laporan') || lower.includes('analitik') || lower.includes('statistik')) return 'Laporan';
    if (lower.includes('inventory') || lower.includes('stok') || lower.includes('suplier') || lower.includes('belanja') || lower.includes('opname')) return 'Inventory';
    if (lower.includes('menu') || lower.includes('produk') || lower.includes('kategori')) return 'Manajemen Menu';
    if (lower.includes('pos') || lower.includes('kasir') || lower.includes('order') || lower.includes('meja') || lower.includes('dapur')) return 'Operasional';
    if (lower.includes('karyawan') || lower.includes('absensi') || lower.includes('gaji')) return 'HR & Staff';
    if (lower.includes('setting') || lower.includes('pengaturan') || lower.includes('user') || lower.includes('promo') || lower.includes('voucher') || lower.includes('event')) return 'Sistem & Promo';
    return 'Lainnya';
  };

  // Transform menu data dari API ke format yang dibutuhkan
  const transformMenuData = (apiMenus) => {
    // Group menus by section
    const sections = {};

    apiMenus.forEach(menu => {
      // Skip inactive menus
      if (!menu.isActive) return;

      // Extract section from path or use default
      // Use API section if available and not generic, otherwise use manual mapping
      let section = menu.section;
      if (!section || section === 'Menu' || section === 'Main') {
        section = getSection(menu.name);
      }

      if (!sections[section]) {
        sections[section] = [];
      }

      // Build menu item
      const menuItem = {
        name: menu.name,
        path: menu.path,
        icon: menu.icon, // Simpan nama icon saja
        badge: menu.badge?.text ? {
          text: menu.badge.text,
          color: menu.badge.color
        } : null
      };

      // Add submenu if has children
      if (menu.children && menu.children.length > 0) {
        menuItem.subMenu = menu.children
          .filter(child => child.isActive)
          .map(child => ({
            name: child.name,
            path: child.path
          }));
      }

      sections[section].push(menuItem);
    });

    // Define section order (User requested: Overview -> Laporan -> Menu -> Inventory)
    const sectionOrder = ['Overview', 'Laporan', 'Manajemen Menu', 'Inventory', 'Operasional', 'HR & Staff', 'Sistem & Promo', 'Lainnya'];

    // Convert sections object to array
    return Object.entries(sections)
      .sort(([a], [b]) => {
        return sectionOrder.indexOf(a) - sectionOrder.indexOf(b);
      })
      .map(([section, items]) => ({
        section,
        items: items.sort((a, b) => {
          const aOrder = apiMenus.find(m => m.name === a.name)?.order || 0;
          const bOrder = apiMenus.find(m => m.name === b.name)?.order || 0;
          return aOrder - bOrder;
        })
      }));
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  // Toggle submenu
  const toggleMenu = (menuName) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  // Helper function untuk cek apakah route exact match
  const isExactMatch = (path) => {
    return activeRoute === path;
  };

  // Helper function untuk cek apakah ada submenu yang active
  const hasActiveSubmenu = (subMenuItems) => {
    return subMenuItems?.some((sub) => activeRoute === sub.path);
  };

  if (loading) {
    return (
      <aside className={`h-screen fixed top-0 left-0 z-50 transition-all duration-300 glass-sidebar flex items-center justify-center
        ${isSidebarOpen ? "w-56 translate-x-0" : "w-56 -translate-x-full lg:translate-x-0 lg:w-0"}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </aside>
    );
  }

  return (
    <aside
      className={`h-screen fixed top-0 left-0 z-50 flex flex-col transition-all duration-300 glass-sidebar
        ${isSidebarOpen ? "w-56 translate-x-0" : "w-56 -translate-x-full lg:translate-x-0 lg:w-0"}
      `}
    >
      {/* Decorative gradient blob for that premium glass feel */}
      <div className="absolute top-0 left-0 w-full h-32 bg-primary/5 blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="relative px-4 pt-6 pb-5 shrink-0 flex justify-center border-b border-slate-200/60 mx-4 mb-4">
        <img
          src="/images/baraja.png"
          alt="Baraja Coffee"
          className="h-12 w-auto object-contain drop-shadow-sm transition-transform duration-300 hover:scale-105"
        />
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar relative z-10">
        <ul className="space-y-4">
          {menus.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {/* Section Title */}
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pb-2 pt-2">{section.section}</h3>

              {/* Items */}
              <ul className="space-y-0.5">
                {section.items.map((item, index) => {
                  const hasActiveSubRoute = hasActiveSubmenu(item.subMenu);
                  const isSubMenuOpen = openMenus[item.name] ?? hasActiveSubRoute;

                  const isActive = item.subMenu
                    ? hasActiveSubRoute
                    : isExactMatch(item.path);

                  return (
                    <li key={index}>
                      {item.subMenu ? (
                        <>
                          {/* Parent with submenu */}
                          <button
                            type="button"
                            onClick={() => toggleMenu(item.name)}
                            className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-[13px] font-medium transition-all duration-200 group
                            ${isActive
                                ? "bg-[#005429]/5 text-[#005429] font-bold shadow-sm border border-[#005429]/10"
                                : "text-slate-600 hover:bg-slate-100/80 hover:text-[#005429] hover:translate-x-1 border border-transparent"
                              }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`${isActive ? "text-[#005429]" : "text-slate-400 group-hover:text-[#005429]"}`}>
                                {renderLucideIcon(item.icon)}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs tracking-wide font-medium">{item.name}</span>
                                {item.badge && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full shadow-sm ${item.badge.color === 'primary'
                                    ? 'bg-blue-500 text-white'
                                    : item.badge.color === 'danger'
                                      ? 'bg-red-500 text-white'
                                      : 'bg-gray-500 text-white'
                                    }`}>
                                    {item.badge.text}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isSubMenuOpen
                              ? <LucideIcons.ChevronDown className={`w-4 h-4 ${isActive ? 'text-[#005429]/80' : 'text-slate-400'}`} />
                              : <LucideIcons.ChevronLeft className={`w-4 h-4 ${isActive ? 'text-[#005429]/80' : 'text-slate-400'}`} />
                            }
                          </button>

                          {/* Submenu */}
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSubMenuOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                            <ul className="ml-5 pl-3 border-l-2 border-slate-100 space-y-1 mt-1">
                              {item.subMenu.map((subItem, subIndex) => {
                                const isSubActive = isExactMatch(subItem.path);
                                return (
                                  <li key={subIndex}>
                                    <Link
                                      to={subItem.path}
                                      className={`block py-1.5 px-3 rounded-lg text-xs transition-all duration-200 font-medium
                                      ${isSubActive
                                          ? "bg-[#005429]/5 text-[#005429] font-bold shadow-sm"
                                          : "text-slate-500 hover:bg-slate-50 hover:text-[#005429]"
                                        }`}
                                    >
                                      {subItem.name}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </>
                      ) : (
                        // Normal menu
                        <Link
                          to={item.path}
                          className={`block py-2 px-3 rounded-xl transition-all duration-200 font-medium group text-[13px]
                          ${isActive
                              ? "bg-[#005429]/5 text-[#005429] font-bold shadow-sm border border-[#005429]/10"
                              : "text-slate-600 hover:bg-slate-100/80 hover:text-[#005429] hover:translate-x-1 border border-transparent"
                            }`}
                        >
                          <div className="flex items-center gap-2 justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className={`${isActive ? "text-[#005429]" : "text-slate-400 group-hover:text-[#005429]"}`}>
                                {renderLucideIcon(item.icon)}
                              </span>
                              <span className="text-xs tracking-wide font-medium">{item.name}</span>
                            </div>
                            {item.badge && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full shadow-sm ${item.badge.color === 'primary'
                                ? 'bg-blue-500 text-white'
                                : item.badge.color === 'danger'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-500 text-white'
                                }`}>
                                {item.badge.text}
                              </span>
                            )}
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
    </aside>
  );
};

export default Sidebar;
