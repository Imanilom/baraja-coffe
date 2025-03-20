import React from 'react';
import { Link } from 'react-router-dom';

const ReportDashboard = () => {
    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Report Dashboard</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Menu Ringkasan */}
                    <Link
                        to="/"
                        className="p-6 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow"
                    >
                        <h2 className="text-xl font-semibold text-gray-700">Ringkasan</h2>
                        <p className="text-gray-500 mt-2">Ringkasan</p>
                    </Link>

                    {/* Transaksi Penjualan */}
                    <Link
                        to="/transaction-sales"
                        className="p-6 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow"
                    >
                        <h2 className="text-xl font-semibold text-gray-700">Data Transaksi Penjualan</h2>
                        <p className="text-gray-500 mt-2">Manage transaksi penjualan.</p>
                    </Link>

                    {/* Penjualan Produk */}
                    <Link
                        to="/production-sales"
                        className="p-6 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow"
                    >
                        <h2 className="text-xl font-semibold text-gray-700">Penjualan Produk</h2>
                        <p className="text-gray-500 mt-2">monitor penjualan produk</p>
                    </Link>

                    {/* Penjualan Per Outlet */}
                    <Link
                        to="/outlate-sales"
                        className="p-6 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow"
                    >
                        <h2 className="text-xl font-semibold text-gray-700">Penjualan Per Outlet</h2>
                        <p className="text-gray-500 mt-2">Monitor penjualan per outlet</p>
                    </Link>

                    {/* Penjualan Harian */}
                    <Link
                        to="/"
                        className="p-6 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow"
                    >
                        <h2 className="text-xl font-semibold text-gray-700">Penjualan Harian</h2>
                        <p className="text-gray-500 mt-2">Monitor penjualan harian.</p>
                    </Link>

                    {/* Penjualan Per Kategori */}
                    <Link
                        to="/category-sales"
                        className="p-6 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow"
                    >
                        <h2 className="text-xl font-semibold text-gray-700">Penjualan Per Kategori</h2>
                        <p className="text-gray-500 mt-2">Monitor penjualan per kategori.</p>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ReportDashboard;