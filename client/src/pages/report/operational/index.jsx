import React from 'react';
import { Link } from 'react-router-dom';
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaPoll, FaShoppingBag, FaStore, FaSignal, FaTag, FaClock, FaTabletAlt, FaAddressCard, FaWallet, FaRegCreditCard, FaThLarge, FaRegClock, FaFileInvoiceDollar, FaCoins, FaHandshake } from "react-icons/fa";

const OperationalMenu = () => {
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
                            to="/admin/operational-menu"
                            className="text-[#005429] inline-block"
                        >
                            Laporan Operational
                        </Link>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto my-2 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Rekap Kas */}
                    <Link
                        to="/admin/reconciliation"
                        className="p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] text-gray-700 hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaPoll size={24} />
                            <h2 className="font-semibold">Rekap Kas</h2>
                        </div>
                    </Link>

                    {/* Stok */}
                    <Link
                        to="/admin/stock"
                        className="p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] text-gray-700 hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaThLarge className='' size={24} />
                            <h2 className="font-semibold">Stok</h2>
                        </div>
                    </Link>

                    {/* Absensi */}
                    <Link
                        to="/admin/user-attendances"
                        className="p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] text-gray-700 hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaRegClock className='' size={24} />
                            <h2 className="font-semibold">Absensi</h2>
                        </div>
                    </Link>

                    {/* Cicilan */}
                    <Link
                        to="/admin/installment"
                        className="p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] text-gray-700 hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaFileInvoiceDollar size={24} />
                            <h2 className="font-semibold">Cicilan</h2>
                        </div>
                    </Link>

                    {/* Pengeluaran */}
                    <Link
                        to="/admin/expenditure"
                        className="p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] text-gray-700 hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaCoins className='' size={24} />
                            <h2 className="font-semibold">Pengeluaran</h2>
                        </div>
                    </Link>

                    {/* Komisi */}
                    <Link
                        to="/admin/commission"
                        className="p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] text-gray-700 hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaHandshake className='' size={24} />
                            <h2 className="font-semibold">komisi</h2>
                        </div>
                    </Link>

                    {/* Laporan Meja */}
                    <Link
                        to="/admin/table"
                        className="p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] text-gray-700 hover:text-white transition-shadow"
                    >
                        <div className="flex items-center space-x-2">
                            <FaTag className='' size={24} />
                            <h2 className="font-semibold">Laporan Meja</h2>
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

export default OperationalMenu;