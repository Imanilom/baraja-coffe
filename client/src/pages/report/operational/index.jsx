import React from 'react';
import { Link } from 'react-router-dom';
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaPoll, FaShoppingBag, FaStore, FaSignal, FaTag, FaClock, FaTabletAlt, FaAddressCard, FaWallet, FaRegCreditCard, FaThLarge, FaRegClock, FaFileInvoiceDollar, FaCoins, FaHandshake } from "react-icons/fa";
import UnderDevelopment from '../../../components/repair';

const OperationalMenu = () => {
    return (
        <div className="">
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <div className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <span>Laporan</span>
                    <FaChevronRight />
                    <span>Laporan Operational</span>
                </div>
            </div>
            <div className="w-full mx-auto my-2 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Rekap Kas */}
                    <Link
                        to="/admin/operational/reconciliation"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow border-green-900 border rounded"
                    >
                        <div className="flex items-center space-x-2">
                            <FaPoll size={24} />
                            <h2 className="font-semibold">Rekap Kas</h2>
                        </div>
                    </Link>

                    {/* Stok */}
                    <Link
                        to="/admin/operational/stock"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow border-green-900 border rounded"
                    >
                        <div className="flex items-center space-x-2">
                            <FaThLarge className='' size={24} />
                            <h2 className="font-semibold">Stok</h2>
                        </div>
                    </Link>

                    {/* Absensi */}
                    <Link
                        to="/admin/operational/user-attendances"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow border-green-900 border rounded"
                    >
                        <div className="flex items-center space-x-2">
                            <FaRegClock className='' size={24} />
                            <h2 className="font-semibold">Absensi</h2>
                        </div>
                    </Link>

                    {/* Hutang */}
                    <Link
                        to="/admin/operational/installment"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow border-green-900 border rounded"
                    >
                        <div className="flex items-center space-x-2">
                            <FaFileInvoiceDollar size={24} />
                            <h2 className="font-semibold">Hutang</h2>
                        </div>
                    </Link>

                    {/* Pengeluaran */}
                    <Link
                        to="/admin/operational/expenditure"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow border-green-900 border rounded"
                    >
                        <div className="flex items-center space-x-2">
                            <FaCoins className='' size={24} />
                            <h2 className="font-semibold">Pengeluaran</h2>
                        </div>
                    </Link>

                    {/* Komisi */}
                    <Link
                        to="/admin/operational/commission"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow border-green-900 border rounded"
                    >
                        <div className="flex items-center space-x-2">
                            <FaHandshake className='' size={24} />
                            <h2 className="font-semibold">komisi</h2>
                        </div>
                    </Link>

                    {/* Laporan Meja */}
                    {/* <Link
                        to="/admin/operational/table"
                        className="p-4 text-[#005429] bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] hover:text-white transition-shadow border-green-900 border rounded"
                    >
                        <div className="flex items-center space-x-2">
                            <FaTag className='' size={24} />
                            <h2 className="font-semibold">Laporan Meja</h2>
                        </div>
                    </Link> */}

                </div>
            </div>
        </div>
    );
    // return (
    //     <UnderDevelopment />
    // )
};

export default OperationalMenu;