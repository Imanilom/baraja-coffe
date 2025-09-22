import React from 'react';
import { Link } from 'react-router-dom';
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaBook, FaShoppingBag, FaStore, FaFileInvoiceDollar, FaSignal, FaTag, FaClock, FaTabletAlt, FaAddressCard, FaWallet, FaRegCreditCard } from "react-icons/fa";

const SalesMenu = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            <div className="">
                <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
                    <FaBell size={23} className="text-gray-400" />
                    <span className="text-[14px]">Hi Baraja</span>
                    <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
                        <FaUser size={30} />
                    </Link>
                </div>
                <div className="px-3 py-2 flex justify-between items-center border-b">
                    <div className="flex items-center space-x-2">
                        <FaClipboardList className="text-gray-400 inline-block" />
                        <p className="text-gray-400 inline-block">Laporan</p>
                        <FaChevronRight className="text-gray-400 inline-block" />
                        <Link
                            to="/admin/sales-menu"
                            className="text-[#005429] inline-block"
                        >
                            Laporan Penjualan
                        </Link>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto my-2 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Menu Ringkasan */}
                    <Link
                        to="/admin/summary"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaBook size={24} />
                            <h2 className="font-semibold">Ringkasan</h2>
                        </div>
                    </Link>

                    {/* Transaksi Penjualan */}
                    <Link
                        to="/admin/transaction-sales"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaFileInvoiceDollar className='' size={24} />
                            <h2 className="font-semibold">Data Transaksi Penjualan</h2>
                        </div>
                    </Link>

                    {/* Penjualan Produk */}
                    <Link
                        to="/admin/product-sales"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaShoppingBag className='' size={24} />
                            <h2 className="font-semibold">Penjualan Produk</h2>
                        </div>
                    </Link>

                    {/* Penjualan Per Outlet */}
                    <Link
                        to="/admin/outlet-sales"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaStore size={24} />
                            <h2 className="font-semibold">Penjualan Per Outlet</h2>
                        </div>
                    </Link>

                    {/* Penjualan Harian */}
                    <Link
                        to="/admin/daily-sales"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaSignal className='' size={24} />
                            <h2 className="font-semibold">Penjualan Harian</h2>
                        </div>
                    </Link>

                    {/* Penjualan Per Kategori */}
                    <Link
                        to="/admin/hourly-sales"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaClock className='' size={24} />
                            <h2 className="font-semibold">Penjualan Per Jam</h2>
                        </div>
                    </Link>

                    {/* Penjualan Per Kategori */}
                    <Link
                        to="/admin/category-sales"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaTag className='' size={24} />
                            <h2 className="font-semibold">Penjualan Per Kategori</h2>
                        </div>
                    </Link>

                    {/* Penjualan Per Kategori */}
                    <Link
                        to="/admin/device-sales"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaTabletAlt className='' size={24} />
                            <h2 className="font-semibold">Penjualan Per Perangkat</h2>
                        </div>
                    </Link>

                    {/* Penjualan Per Kategori */}
                    <Link
                        to="/admin/customer-sales"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaAddressCard className='' size={24} />
                            <h2 className="font-semibold">Penjualan Per Pelanggan</h2>
                        </div>
                    </Link>

                    {/* Penjualan Per Kategori */}
                    <Link
                        to="/admin/payment-method-sales"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaWallet className='' size={24} />
                            <h2 className="font-semibold">Metode Pembayaran</h2>
                        </div>
                    </Link>

                    {/* Penjualan Per Kategori */}
                    {/* <Link
                        to="/admin/digital-payment"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaRegCreditCard className='' size={24} />
                            <h2 className="font-semibold">Metode Pembayaran Digital</h2>
                        </div>
                    </Link> */}

                    {/* Penjualan Per Kategori */}
                    <Link
                        to="/admin/type-sales"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaTag className='' size={24} />
                            <h2 className="font-semibold">Tipe Penjualan</h2>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SalesMenu;