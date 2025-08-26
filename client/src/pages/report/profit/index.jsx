import React from 'react';
import { Link } from 'react-router-dom';
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaPoll, FaThLarge, FaRegClock, FaFileInvoiceDollar, FaPercent, FaCut, FaGift } from "react-icons/fa";

const ProfitMenu = () => {
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
                            to="/admin/profit-menu"
                            className="text-[#005429] inline-block"
                        >
                            Laporan Laba Rugi
                        </Link>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto my-2 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Penerimaan Pajak */}
                    <Link
                        to="/admin/tax-revenue"
                        className="p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] text-gray-700 hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaPercent size={24} />
                            <h2 className="font-semibold">Penerimaan Pajak</h2>
                        </div>
                    </Link>

                    {/* Promo */}
                    <Link
                        to="/admin/discount"
                        className="p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] text-gray-700 hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaCut className='' size={24} />
                            <h2 className="font-semibold">Promo</h2>
                        </div>
                    </Link>

                    {/* Laba Harian */}
                    <Link
                        to="/admin/daily-profit"
                        className="p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] text-gray-700 hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaPoll className='' size={24} />
                            <h2 className="font-semibold">Laba Harian</h2>
                        </div>
                    </Link>

                    {/* Laba Produk */}
                    <Link
                        to="/admin/profit-by-product"
                        className="p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] text-gray-700 hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaGift size={24} />
                            <h2 className="font-semibold">Laba Produk</h2>
                        </div>
                    </Link>

                </div>
            </div>

            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]">
                </div>
            </div>
        </div>
    );
};

export default ProfitMenu;