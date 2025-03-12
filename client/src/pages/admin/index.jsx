import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Menu Management */}
          <Link
            to="/menu"
            className="p-6 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-700">Menu Management</h2>
            <p className="text-gray-500 mt-2">Create, update, and manage menu items.</p>
          </Link>

          {/* Voucher Management */}
          <Link
            to="/voucher"
            className="p-6 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-700">Voucher Management</h2>
            <p className="text-gray-500 mt-2">Manage discounts and promotional vouchers.</p>
          </Link>

          {/* Storage Management */}
          <Link
            to="/storage"
            className="p-6 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-700">Storage Management</h2>
            <p className="text-gray-500 mt-2">Track and manage inventory storage.</p>
          </Link>

          {/* Promotion Management */}
          <Link
            to="/promotion"
            className="p-6 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-700">Promotion Management</h2>
            <p className="text-gray-500 mt-2">Create and manage promotional campaigns.</p>
          </Link>

          {/* Outlet Management */}
          <Link
            to="/toko"
            className="p-6 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-700">Outlet Management</h2>
            <p className="text-gray-500 mt-2">Manage outlets and their information.</p>
          </Link>

          {/* Financial Management */}
          <Link
            to="/finance"
            className="p-6 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-700">Financial Management</h2>
            <p className="text-gray-500 mt-2">Monitor and manage financial records.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
