import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { useSelector } from 'react-redux';
import dayjs from "dayjs";
import { Link } from 'react-router-dom';
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaPoll, FaShoppingBag, FaStore, FaSignal, FaTag, FaClock, FaTabletAlt, FaAddressCard, FaWallet, FaRegCreditCard, FaThLarge, FaRegClock, FaFileInvoiceDollar, FaCoins, FaHandshake } from "react-icons/fa";
import UnderDevelopment from '../../../components/repair';

const OperationalMenu = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [summary, setSummary] = useState({
        cashInToday: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalDebt: 0
    });
    const [loading, setLoading] = useState(true);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const today = dayjs().format("YYYY-MM-DD");

                // Parallel API Calls
                const [cashflowRes, stockRes, debtRes] = await Promise.all([
                    // 1. Cashflow (Today)
                    axios.get('/api/marketlist/cashflow', {
                        params: { start: today, end: today },
                        headers: { Authorization: `Bearer ${currentUser.token}` }
                    }),
                    // 2. Stock (All)
                    axios.get('/api/product/stock/all', {
                        headers: { Authorization: `Bearer ${currentUser.token}` }
                    }),
                    // 3. Debt (All)
                    axios.get('/api/marketlist/debts', {
                        headers: { Authorization: `Bearer ${currentUser.token}` }
                    })
                ]);

                // --- Process Cashflow ---
                const cashflowData = cashflowRes.data.data || [];
                // Sum cashIn only
                const totalCashIn = cashflowData.reduce((acc, curr) => acc + (curr.cashIn || 0), 0);

                // --- Process Stock ---
                const stockData = stockRes.data.data || [];
                let lowStock = 0;
                let outOfStock = 0;

                stockData.forEach(item => {
                    const current = item.currentStock || 0;
                    const min = item.minStock || 0;
                    if (current === 0) {
                        outOfStock++;
                    } else if (current <= min) {
                        lowStock++;
                    }
                });

                // --- Process Debt ---
                const debtData = debtRes.data.data || [];
                // Sum remaining debt (amount - paidAmount)
                const totalUnpaid = debtData.reduce((acc, curr) => {
                    return acc + ((curr.amount || 0) - (curr.paidAmount || 0));
                }, 0);

                setSummary({
                    cashInToday: totalCashIn,
                    lowStockCount: lowStock,
                    outOfStockCount: outOfStock,
                    totalDebt: totalUnpaid
                });

            } catch (error) {
                console.error("Error fetching operational summary:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser.token]);

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
                        className="group p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] transition-all border-green-900 border rounded flex flex-col justify-between min-h-[120px]"
                    >
                        <div className="flex items-center space-x-2 text-[#005429] group-hover:text-white mb-2">
                            <FaPoll size={24} />
                            <h2 className="font-semibold text-lg">Rekap Kas</h2>
                        </div>
                        <div className="mt-auto">
                            <p className="text-xs text-gray-500 group-hover:text-green-100 uppercase tracking-wider">Uang Masuk Hari Ini</p>
                            {loading ? (
                                <div className="h-6 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                            ) : (
                                <p className="text-2xl font-bold text-[#005429] group-hover:text-white">
                                    {formatCurrency(summary.cashInToday)}
                                </p>
                            )}
                        </div>
                    </Link>

                    {/* Stok */}
                    <Link
                        to="/admin/operational/stock"
                        className="group p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] transition-all border-green-900 border rounded flex flex-col justify-between min-h-[120px]"
                    >
                        <div className="flex items-center space-x-2 text-[#005429] group-hover:text-white mb-2">
                            <FaThLarge size={24} />
                            <h2 className="font-semibold text-lg">Stok</h2>
                        </div>
                        <div className="mt-auto">
                            <p className="text-xs text-gray-500 group-hover:text-green-100 uppercase tracking-wider">Status Alert</p>
                            {loading ? (
                                <div className="h-6 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                            ) : (
                                <div className="flex items-center gap-2 mt-1">
                                    {summary.outOfStockCount > 0 && (
                                        <span className="bg-red-100 text-red-600 group-hover:bg-red-500 group-hover:text-white text-xs font-bold px-2 py-1 rounded">
                                            {summary.outOfStockCount} Habis
                                        </span>
                                    )}
                                    {summary.lowStockCount > 0 && (
                                        <span className="bg-orange-100 text-orange-600 group-hover:bg-orange-500 group-hover:text-white text-xs font-bold px-2 py-1 rounded">
                                            {summary.lowStockCount} Menipis
                                        </span>
                                    )}
                                    {summary.outOfStockCount === 0 && summary.lowStockCount === 0 && (
                                        <span className="text-[#005429] group-hover:text-white font-semibold">Aman</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </Link>

                    {/* Hutang */}
                    <Link
                        to="/admin/operational/installment"
                        className="group p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] transition-all border-green-900 border rounded flex flex-col justify-between min-h-[120px]"
                    >
                        <div className="flex items-center space-x-2 text-[#005429] group-hover:text-white mb-2">
                            <FaFileInvoiceDollar size={24} />
                            <h2 className="font-semibold text-lg">Hutang</h2>
                        </div>
                        <div className="mt-auto">
                            <p className="text-xs text-gray-500 group-hover:text-green-100 uppercase tracking-wider">Total Belum Lunas</p>
                            {loading ? (
                                <div className="h-6 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                            ) : (
                                <p className="text-2xl font-bold text-[#005429] group-hover:text-white">
                                    {formatCurrency(summary.totalDebt)}
                                </p>
                            )}
                        </div>
                    </Link>

                    {/* Absensi (Static) */}
                    <Link
                        to="/admin/operational/user-attendances"
                        className="group p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] transition-all border-green-900 border rounded flex flex-col justify-between min-h-[120px] opacity-75 hover:opacity-100"
                    >
                        <div className="flex items-center space-x-2 text-[#005429] group-hover:text-white mb-2">
                            <FaRegClock size={24} />
                            <h2 className="font-semibold text-lg">Absensi</h2>
                        </div>
                        <div className="mt-auto">
                            <p className="text-xs text-gray-500 group-hover:text-green-100 uppercase tracking-wider">Laporan Kehadiran</p>
                            <p className="text-sm font-medium text-[#005429] group-hover:text-white mt-1">Lihat Detail →</p>
                        </div>
                    </Link>

                    {/* Pengeluaran (Static) */}
                    <Link
                        to="/admin/operational/expenditure"
                        className="group p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] transition-all border-green-900 border rounded flex flex-col justify-between min-h-[120px] opacity-75 hover:opacity-100"
                    >
                        <div className="flex items-center space-x-2 text-[#005429] group-hover:text-white mb-2">
                            <FaCoins size={24} />
                            <h2 className="font-semibold text-lg">Pengeluaran</h2>
                        </div>
                        <div className="mt-auto">
                            <p className="text-xs text-gray-500 group-hover:text-green-100 uppercase tracking-wider">Laporan Pengeluaran</p>
                            <p className="text-sm font-medium text-[#005429] group-hover:text-white mt-1">Lihat Detail →</p>
                        </div>
                    </Link>

                    {/* Komisi (Static) */}
                    <Link
                        to="/admin/operational/commission"
                        className="group p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] transition-all border-green-900 border rounded flex flex-col justify-between min-h-[120px] opacity-75 hover:opacity-100"
                    >
                        <div className="flex items-center space-x-2 text-[#005429] group-hover:text-white mb-2">
                            <FaHandshake size={24} />
                            <h2 className="font-semibold text-lg">Komisi</h2>
                        </div>
                        <div className="mt-auto">
                            <p className="text-xs text-gray-500 group-hover:text-green-100 uppercase tracking-wider">Laporan Komisi</p>
                            <p className="text-sm font-medium text-[#005429] group-hover:text-white mt-1">Lihat Detail →</p>
                        </div>
                    </Link>

                </div>
            </div>
        </div>
    );
};

export default OperationalMenu;