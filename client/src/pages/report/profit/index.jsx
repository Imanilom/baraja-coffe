import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import dayjs from "dayjs";
import { Link } from 'react-router-dom';
import { FaChevronRight, FaPoll, FaPercent, FaCut, FaGift } from "react-icons/fa";

const ProfitMenu = () => {
    const [summary, setSummary] = useState({
        totalTax: 0,
        totalDiscount: 0,
        totalNetProfit: 0,
        profitMargin: 0
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

    const formatPercentage = (value) => {
        return `${(value || 0).toFixed(1)}%`;
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const today = dayjs().format("YYYY-MM-DD");

                // Fetch Daily Profit Report for Today
                const response = await axios.get('/api/report/daily-profit', {
                    params: {
                        startDate: today,
                        endDate: today
                    }
                });

                if (response.data.success && response.data.data && Array.isArray(response.data.data.orders)) {
                    const orders = response.data.data.orders;

                    // Calculate Summary
                    let revenue = 0;
                    let tax = 0;
                    let discount = 0;
                    let netProfit = 0;

                    orders.forEach(order => {
                        revenue += order.revenue || 0;
                        tax += order.tax || 0;
                        discount += order.discounts || 0;
                        netProfit += order.netProfit || 0;
                    });

                    // Avoid division by zero
                    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

                    setSummary({
                        totalTax: tax,
                        totalDiscount: discount,
                        totalNetProfit: netProfit,
                        profitMargin: margin
                    });
                }
            } catch (error) {
                console.error("Error fetching profit summary:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
                        className="group p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] transition-all border-green-900 border rounded flex flex-col justify-between min-h-[120px]"
                    >
                        <div className="flex items-center space-x-2 text-[#005429] group-hover:text-white mb-2">
                            <FaPercent size={24} />
                            <h2 className="font-semibold text-lg">Pajak</h2>
                        </div>
                        <div className="mt-auto">
                            <p className="text-xs text-gray-500 group-hover:text-green-100 uppercase tracking-wider">Estimasi Pajak Hari Ini</p>
                            {loading ? (
                                <div className="h-6 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                            ) : (
                                <p className="text-2xl font-bold text-[#005429] group-hover:text-white">
                                    {formatCurrency(summary.totalTax)}
                                </p>
                            )}
                        </div>
                    </Link>

                    {/* Promo */}
                    <Link
                        to="/admin/discount"
                        className="group p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] transition-all border-green-900 border rounded flex flex-col justify-between min-h-[120px]"
                    >
                        <div className="flex items-center space-x-2 text-[#005429] group-hover:text-white mb-2">
                            <FaCut size={24} />
                            <h2 className="font-semibold text-lg">Promo</h2>
                        </div>
                        <div className="mt-auto">
                            <p className="text-xs text-gray-500 group-hover:text-green-100 uppercase tracking-wider">Total Diskon Hari Ini</p>
                            {loading ? (
                                <div className="h-6 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                            ) : (
                                <p className="text-2xl font-bold text-[#005429] group-hover:text-white">
                                    {formatCurrency(summary.totalDiscount)}
                                </p>
                            )}
                        </div>
                    </Link>

                    {/* Laba Harian */}
                    <Link
                        to="/admin/daily-profit"
                        className="group p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] transition-all border-green-900 border rounded flex flex-col justify-between min-h-[120px]"
                    >
                        <div className="flex items-center space-x-2 text-[#005429] group-hover:text-white mb-2">
                            <FaPoll size={24} />
                            <h2 className="font-semibold text-lg">Laba Harian</h2>
                        </div>
                        <div className="mt-auto">
                            <p className="text-xs text-gray-500 group-hover:text-green-100 uppercase tracking-wider">Laba Bersih Hari Ini</p>
                            {loading ? (
                                <div className="h-6 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                            ) : (
                                <p className="text-2xl font-bold text-[#005429] group-hover:text-white">
                                    {formatCurrency(summary.totalNetProfit)}
                                </p>
                            )}
                        </div>
                    </Link>

                    {/* Laba Produk */}
                    <Link
                        to="/admin/profit-by-product"
                        className="group p-4 bg-white shadow-sm hover:shadow-2xl hover:bg-[#005429] transition-all border-green-900 border rounded flex flex-col justify-between min-h-[120px]"
                    >
                        <div className="flex items-center space-x-2 text-[#005429] group-hover:text-white mb-2">
                            <FaGift size={24} />
                            <h2 className="font-semibold text-lg">Laba Produk</h2>
                        </div>
                        <div className="mt-auto">
                            <p className="text-xs text-gray-500 group-hover:text-green-100 uppercase tracking-wider">Margin Laba Hari Ini</p>
                            {loading ? (
                                <div className="h-6 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <p className="text-2xl font-bold text-[#005429] group-hover:text-white">
                                        {formatPercentage(summary.profitMargin)}
                                    </p>
                                    <span className="text-xs text-[#005429] group-hover:text-green-100 opacity-80">(Avg)</span>
                                </div>
                            )}
                        </div>
                    </Link>

                </div>
            </div>
        </div>
    );
};

export default ProfitMenu;