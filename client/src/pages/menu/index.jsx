import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaList, FaLayerGroup } from 'react-icons/fa';
import Menu from './menu';
import CategoryIndex from './category/index';

const MenuCategoryTabs = () => {
  const [activeTab, setActiveTab] = useState('menu');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 pt-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('menu')}
              className={`pb-3 px-1 relative flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'menu'
                ? 'text-[#005429] border-b-2 border-[#005429]'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <FaList size={16} />
              Menu
            </button>
            <button
              onClick={() => setActiveTab('category')}
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