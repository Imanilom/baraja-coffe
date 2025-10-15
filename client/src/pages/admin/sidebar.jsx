import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
      console.error("Error fetching menus:", error);
    } finally {
      setLoading(false);
    }
  };

  // Transform menu data dari API ke format yang dibutuhkan
  const transformMenuData = (apiMenus) => {
    // Group menus by section
    const sections = {};

    apiMenus.forEach(menu => {
      // Skip inactive menus
      if (!menu.isActive) return;

      // Extract section from path or use default
      const section = menu.section || 'Menu';

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

    // Convert sections object to array
    return Object.entries(sections).map(([section, items]) => ({
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

  if (loading) {
    return (
      <div className={`h-screen bg-green-900 text-white fixed top-0 left-0 flex items-center justify-center transition-all duration-300 z-40 shadow-lg ${isSidebarOpen ? "w-72" : "w-16"}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

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
          {menus.map((section, idx) => (
            <div key={idx} className="space-y-2">

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
                              {renderLucideIcon(item.icon)}
                              {isSidebarOpen && (
                                <div className="flex items-center gap-2">
                                  <span>{item.name}</span>
                                  {item.badge && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.badge.color === 'primary'
                                      ? 'bg-blue-500 text-white'
                                      : item.badge.color === 'danger'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-500 text-white'
                                      }`}>
                                      {item.badge.text}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            {isSidebarOpen && (
                              isSubMenuOpen
                                ? <LucideIcons.ChevronDown className="w-4 h-4" />
                                : <LucideIcons.ChevronLeft className="w-4 h-4" />
                            )}
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
                          <div className="flex items-center gap-2 justify-between">
                            <div className="flex items-center gap-2">
                              {renderLucideIcon(item.icon)}
                              {isSidebarOpen && <span>{item.name}</span>}
                            </div>
                            {isSidebarOpen && item.badge && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${item.badge.color === 'primary'
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
    </div>
  );
};

export default Sidebar;