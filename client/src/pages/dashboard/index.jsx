import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Datepicker from 'react-tailwindcss-datepicker';
import {
    FaChartBar,
    FaShoppingCart,
    FaPlus,
} from "react-icons/fa";
import SalesChart from "./charts/saleschart";
import TopProductTable from "./table/topproducttable";
import CardItem from "./cardItem/carditem";
import FoodChart from "./charts/foodchart";
import DrinkChart from "./charts/drinkchart";
import { useSelector } from "react-redux";
import TotalOrder from "./charts/totalorder";
import { Link } from "react-router-dom";
import TransactionType from "./table/transactionType";

const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const getTodayRange = () => {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));
    return { startDate: start, endDate: end };
};

const formatDateForAPI = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const Dashboard = () => {
    const { currentUser } = useSelector((state) => state.user);

    // States
    const [dashboardData, setDashboardData] = useState(null);
    const [outlets, setOutlets] = useState([]);
    const [filters, setFilters] = useState({
        date: getTodayRange(),
        outlet: "",
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const superAdmin = currentUser.role === 'superadmin';
    const admin = currentUser.role === 'admin';

    // Fetch dashboard data - Single optimized call
    const fetchDashboardData = useCallback(async () => {
        if (!filters.date?.startDate || !filters.date?.endDate) return;

        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('startDate', formatDateForAPI(filters.date.startDate));
            params.append('endDate', formatDateForAPI(filters.date.endDate));

            if (filters.outlet) {
                params.append('outlet', filters.outlet);
            }

            const response = await axios.get(`/api/report/dashboard?${params.toString()}`);

            if (response.data.success) {
                setDashboardData(response.data.data);
                setError(null);
            }
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError("Failed to load dashboard data. Please try again.");
            setDashboardData(null);
        } finally {
            setLoading(false);
        }
    }, [filters.date, filters.outlet]);

    // Fetch outlets
    const fetchOutlets = useCallback(async () => {
        try {
            const response = await axios.get('/api/outlet');
            const outletsData = Array.isArray(response.data)
                ? response.data
                : (response.data?.data || []);
            setOutlets(outletsData);
        } catch (err) {
            console.error("Error fetching outlets:", err);
            setOutlets([]);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchOutlets();
    }, [fetchOutlets]);

    // Fetch dashboard data when filters change
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleDateRangeChange = (value) => {
        if (!value || !value.startDate || !value.endDate) return;

        const { startDate, endDate } = value;
        const adjustedStart = new Date(startDate);
        adjustedStart.setHours(0, 0, 0, 0);

        const adjustedEnd = new Date(endDate);
        adjustedEnd.setHours(23, 59, 59, 999);

        setFilters(prev => ({
            ...prev,
            date: {
                startDate: adjustedStart,
                endDate: adjustedEnd,
            },
        }));
    };

    // Prepare cards data
    const cardsData = dashboardData ? [
        {
            title: "Penjualan",
            icon: <FaShoppingCart size={21} />,
            percentage: dashboardData.summary.comparison.sales.percentage,
            amount: dashboardData.summary.comparison.sales.amount,
            isPositive: dashboardData.summary.comparison.sales.isPositive,
            average: dashboardData.summary.current.orders > 0
                ? formatRupiah(dashboardData.summary.current.avgOrderValue)
                : formatRupiah(0),
            value: formatRupiah(dashboardData.summary.current.sales),
            route: "/admin/transaction-sales",
        },
        {
            title: "Transaksi",
            icon: <FaChartBar size={21} />,
            percentage: dashboardData.summary.comparison.orders.percentage,
            amount: dashboardData.summary.comparison.orders.amount,
            isPositive: dashboardData.summary.comparison.orders.isPositive,
            average: Math.round(
                (dashboardData.summary.current.orders + dashboardData.summary.previous.orders) / 2
            ),
            value: dashboardData.summary.current.orders,
            route: "/admin/daily-sales",
        },
        {
            title: "Laba Kotor",
            icon: <FaChartBar size={21} />,
            percentage: dashboardData.summary.comparison.sales.percentage,
            amount: dashboardData.summary.comparison.sales.amount,
            isPositive: dashboardData.summary.comparison.sales.isPositive,
            average: formatRupiah(
                (dashboardData.summary.current.sales + dashboardData.summary.previous.sales) / 2
            ),
            value: formatRupiah(dashboardData.summary.current.sales),
            route: "/admin/daily-profit",
        },
    ] : [];

    // Loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    // No data state
    if (!dashboardData) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-gray-500">No data available</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <main className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
                {/* Left Section */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                            name="outlet"
                            value={filters.outlet}
                            onChange={handleFilterChange}
                            className="w-full text-sm md:text-base text-gray-600 border py-2 pr-8 pl-3 appearance-none focus:ring-2 focus:ring-[#005429] focus:outline-none rounded-lg shadow-sm"
                        >
                            <option value="">Semua Outlet</option>
                            {outlets.map((outlet) => (
                                <option key={outlet._id} value={outlet._id}>
                                    {outlet.name}
                                </option>
                            ))}
                        </select>

                        <Datepicker
                            showFooter
                            showShortcuts
                            value={filters.date}
                            onChange={handleDateRangeChange}
                            displayFormat="DD-MM-YYYY"
                            inputClassName="w-full text-sm md:text-base border py-2 pr-8 pl-3 rounded cursor-pointer focus:ring-2 focus:ring-[#005429] focus:outline-none rounded-lg shadow-sm"
                            popoverDirection="down"
                        />
                    </div>

                    {/* Welcome */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-lg font-semibold text-green-900">
                            Selamat Datang, <span className="capitalize">{currentUser.username}</span>
                        </h2>
                        <p className="text-sm text-gray-500">Baraja Coffee</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {cardsData.map((card, i) => (
                            <CardItem key={i} {...card} />
                        ))}
                    </div>

                    {/* Sales Chart */}
                    <SalesChart data={dashboardData.charts.hourly} />

                    {/* Top Products Table */}
                    <TopProductTable data={dashboardData.products.top10} />
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* New Menu Button */}
                    {(superAdmin || admin) && (
                        <div className="bg-white px-4 py-2 rounded-lg shadow-sm flex justify-between items-center">
                            <h3 className="font-semibold">Menu</h3>
                            <Link
                                to="/admin/menu-create"
                                className="flex items-center gap-1 px-3 py-1 bg-green-900 text-white text-sm rounded"
                            >
                                <FaPlus /> Buat
                            </Link>
                        </div>
                    )}

                    {/* Charts */}
                    <TotalOrder data={dashboardData.charts.salesByCategory} />
                    <FoodChart data={dashboardData.products.food} />
                    <DrinkChart data={dashboardData.products.drinks} />
                    <TransactionType data={dashboardData.charts.orderTypes} />
                </div>
            </main>
        </div>
    );
};

export default Dashboard;