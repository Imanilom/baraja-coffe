import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="bg-gray-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out">
      <div className="text-white flex items-center space-x-2 px-4">
        <span className="text-2xl font-extrabold">Restoran Dashboard</span>
      </div>
      <nav>
        <Link to="/dashboard" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
          Dashboard
        </Link>
        <Link to="/menu-management" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
          Manajemen Menu
        </Link>
        <Link to="/order-management" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
          Manajemen Pesanan
        </Link>
        <Link to="/outlet-management" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
          Manajemen Outlet
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;