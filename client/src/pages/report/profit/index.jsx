import React from 'react';
import { Link } from 'react-router-dom';
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaPoll, FaThLarge, FaRegClock, FaFileInvoiceDollar, FaPercent, FaCut, FaGift } from "react-icons/fa";

const ProfitMenu = () => {
    return (
        <div className="">
            <div className="">
                <div className="flex justify-between items-center px-6 py-3 my-3">
                    <div className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                        <span>Laporan</span>
                        <FaChevronRight />
                        <span>
                            Laporan Laba Rugi
                        </span>
                    </div>
                </div>
            </div>
            <div className="w-full mx-auto my-2 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Penerimaan Pajak */}
                    <Link
                        to="/admin/tax-revenue"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow border-green-900 border rounded"
                    >
                        <div className="flex items-center space-x-2">
                            <FaPercent size={24} />
                            <h2 className="font-semibold">Pajak</h2>
                        </div>
                    </Link>

                    {/* Promo */}
                    <Link
                        to="/admin/discount"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow border-green-900 border rounded"
                    >
                        <div className="flex items-center space-x-2">
                            <FaCut className='' size={24} />
                            <h2 className="font-semibold">Promo</h2>
                        </div>
                    </Link>

                    {/* Laba Harian */}
                    <Link
                        to="/admin/daily-profit"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow border-green-900 border rounded"
                    >
                        <div className="flex items-center space-x-2">
                            <FaPoll className='' size={24} />
                            <h2 className="font-semibold">Laba Harian</h2>
                        </div>
                    </Link>

                    {/* Laba Produk */}
                    <Link
                        to="/admin/profit-by-product"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow border-green-900 border rounded"
                    >
                        <div className="flex items-center space-x-2">
                            <FaGift size={24} />
                            <h2 className="font-semibold">Laba Produk</h2>
                        </div>
                    </Link>

                </div>
            </div>
        </div>
    );
};

export default ProfitMenu;