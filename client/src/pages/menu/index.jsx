import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { FaList, FaLayerGroup } from 'react-icons/fa';
import Menu from './product/menu';
import CategoryIndex from './category/index';

const MenuCategoryTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get active tab from URL query parameter, default to 'menu'
  const getActiveTabFromQuery = () => {
    const tabParam = searchParams.get('menu');
    return tabParam === 'category' ? 'category' : 'menu';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromQuery());

  // Sync tab with URL query parameter changes
  useEffect(() => {
    const newTab = getActiveTabFromQuery();
    setActiveTab(newTab);
  }, [searchParams]);

  // Handle navigation from location.state (untuk redirect dari create/update)
  useEffect(() => {
    // Jika ada returnTab di location.state, gunakan itu
    if (location.state?.returnTab) {
      const returnTab = location.state.returnTab;
      setSearchParams({ menu: returnTab }, { replace: true });

      // Clear state setelah digunakan
      window.history.replaceState({}, document.title);
    }
    // Jika tidak ada query parameter sama sekali (first load)
    else if (!searchParams.has('menu')) {
      setSearchParams({ menu: 'menu' }, { replace: true });
    }
  }, [location.state]);

  // Handle tab change and update URL query parameter
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ menu: tab });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 pt-4">
          <div className="flex gap-8">
            <button
              onClick={() => handleTabChange('menu')}
              className={`pb-3 px-1 relative flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'menu'
                  ? 'text-[#005429] border-b-2 border-[#005429]'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <FaList size={16} />
              Menu
            </button>
            <button
              onClick={() => handleTabChange('category')}
              className={`pb-3 px-1 relative flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'category'
                  ? 'text-[#005429] border-b-2 border-[#005429]'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <FaLayerGroup size={16} />
              Kategori
            </button>
          </div>
        </div>
      </div>

      {/* Content Area - Switch based on active tab */}
      <div className="transition-all duration-300">
        {activeTab === 'menu' ? <Menu /> : <CategoryIndex />}
      </div>
    </div>
  );
};

export default MenuCategoryTabs;