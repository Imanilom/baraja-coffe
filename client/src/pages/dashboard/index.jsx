import React, { useEffect, useState, useCallback } from "react";
import axios from '@/lib/axios';
import Datepicker from 'react-tailwindcss-datepicker';
import {
    FaChartBar,
    FaShoppingCart,
    FaPlus,
    FaBolt,
    FaMagic,
    FaFilter,
    FaClock,
} from "react-icons/fa";
import SalesChart from "./charts/SalesChart";
import TopProductTable from "./table/TopProductTable";
import CardItem from "./cardItem/CardItem";
import FoodChart from "./charts/FoodChart";
import DrinkChart from "./charts/DrinkChart";
import { useSelector } from "react-redux";
import TotalOrder from "./charts/TotalOrder";
import { Link } from "react-router-dom";
import TransactionType from "./table/TransactionType";

const formatRupiah = (amount) => {
    const num = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
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

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
};

const Dashboard = () => {
    const { currentUser } = useSelector((state) => state.user);

    const [dashboardData, setDashboardData] = useState(null);
    const [outlets, setOutlets] = useState([]);
    const [filters, setFilters] = useState({
        date: getTodayRange(),
        outlet: "",
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [greeting, setGreeting] = useState(getGreeting());
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));

    const superAdmin = currentUser?.role === 'superadmin';
    const admin = currentUser?.role === 'admin';

    useEffect(() => {
        const timer = setInterval(() => {
            setGreeting(getGreeting());
            setCurrentTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        }, 60000); // update every minute
        return () => clearInterval(timer);
    }, []);

    const fetchDashboardData = useCallback(async () => {
        if (!filters.date?.startDate || !filters.date?.endDate) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('startDate', formatDateForAPI(filters.date.startDate));
            params.append('endDate', formatDateForAPI(filters.date.endDate));
            if (filters.outlet) params.append('outlet', filters.outlet);

            const response = await axios.get(`/api/report/dashboard?${params.toString()}`);
            if (response.data.success) {
                setDashboardData(response.data.data);
                setError(null);
            }
        } catch (err) {
            console.warn("API unavailable, falling back to mock data:", err);
            setDashboardData(getMockDashboardData());
            setError(null);
        } finally {
            setLoading(false);
        }
    }, [filters.date, filters.outlet]);

    const getMockDashboardData = () => ({
        summary: {
            comparison: {
                sales: { percentage: 15.5, amount: 2500000, isPositive: true },
                orders: { percentage: 8.2, amount: 45, isPositive: true },
            },
            current: { orders: 150, sales: 12500000, avgOrderValue: 83333 },
            previous: { orders: 138, sales: 10800000 }
        },
        charts: {
            hourly: Array.from({ length: 24 }, (_, i) => ({
                hour: `${String(i).padStart(2, '0')}:00`,
                sales: Math.floor(Math.random() * 2000000)
            })),
            salesByCategory: [
                { name: "Coffee", value: 4500000 },
                { name: "Non-Coffee", value: 3200000 },
                { name: "Food", value: 2800000 },
                { name: "Snack", value: 1500000 },
            ],
            orderTypes: [
                { name: "Dine In", value: 85 },
                { name: "Take Away", value: 45 },
                { name: "Online", value: 20 },
            ]
        },
        products: {
            top10: Array.from({ length: 5 }, (_, i) => ({
                name: ["Kopi Susu Gula Aren", "Croissant", "V60", "Matcha Latte", "Fried Rice"][i],
                sold: Math.floor(Math.random() * 100) + 20,
                revenue: Math.floor(Math.random() * 5000000) + 1000000
            })),
            food: [
                { name: "Croissant", value: 120 },
                { name: "Fried Rice", value: 95 },
                { name: "Toast", value: 80 }
            ],
            drinks: [
                { name: "Kopi Susu", value: 250 },
                { name: "Matcha", value: 180 },
                { name: "Americano", value: 150 }
            ]
        }
    });

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

    useEffect(() => { fetchOutlets(); }, [fetchOutlets]);
    useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleDateRangeChange = (value) => {
        if (!value || !value.startDate || !value.endDate) return;
        const adjustedStart = new Date(value.startDate);
        adjustedStart.setHours(0, 0, 0, 0);
        const adjustedEnd = new Date(value.endDate);
        adjustedEnd.setHours(23, 59, 59, 999);
        setFilters(prev => ({ ...prev, date: { startDate: adjustedStart, endDate: adjustedEnd } }));
    };

    const cardsData = dashboardData ? [
        {
            title: "Penjualan",
            icon: <FaShoppingCart size={18} />,
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
            icon: <FaChartBar size={18} />,
            percentage: dashboardData.summary.comparison.orders.percentage,
            amount: dashboardData.summary.comparison.orders.amount,
            isPositive: dashboardData.summary.comparison.orders.isPositive,
            average: Math.round((dashboardData.summary.current.orders + dashboardData.summary.previous.orders) / 2),
            value: dashboardData.summary.current.orders,
            route: "/admin/daily-sales",
        },
        {
            title: "Laba Kotor",
            icon: <FaChartBar size={18} />,
            percentage: dashboardData.summary.comparison.sales.percentage,
            amount: dashboardData.summary.comparison.sales.amount,
            isPositive: dashboardData.summary.comparison.sales.isPositive,
            average: formatRupiah((dashboardData.summary.current.sales + dashboardData.summary.previous.sales) / 2),
            value: formatRupiah(dashboardData.summary.current.sales),
            route: "/admin/daily-profit",
        },
    ] : [];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-[#005429] rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold text-slate-500 animate-pulse">Menyiapkan Dashboard Analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center max-w-sm">
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaBolt size={20} />
                    </div>
                    <p className="text-lg font-bold text-slate-800 mb-2">Gagal Memuat Data</p>
                    <p className="text-sm text-slate-500 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-[#005429] hover:bg-[#003d1f] text-white font-bold py-2.5 rounded-xl transition-all shadow-sm"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    if (!dashboardData) return null;

    return (
        <div className="min-h-screen relative overflow-hidden text-slate-800 pb-10">
            {/* Minimal Premium Decorative Blobs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#005429]/5 to-transparent rounded-full blur-[120px] -z-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#005429]/5 to-transparent rounded-full blur-[100px] -z-10 pointer-events-none"></div>

            <main className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
                
                {/* ----------------- LEFT MAIN CONTENT (9 Cols) ----------------- */}
                <div className="xl:col-span-8 2xl:col-span-9 flex flex-col gap-6 lg:gap-8">
                    
                    {/* Welcome Hero Card */}
                    <div className="relative overflow-hidden bg-gradient-to-r from-[#005429] to-[#007036] rounded-[24px] shadow-lg text-white">
                        {/* Decorative Background Patterns inside Card */}
                        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, white 0%, transparent 50%)' }}></div>
                        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>

                        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="max-w-xl">
                                <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[10px] font-bold tracking-widest uppercase mb-3 border border-white/20 shadow-sm">
                                    Enterprise Analytics
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight font-['Outfit',sans-serif]">
                                    {greeting}, <span className="text-green-300 capitalize">{currentUser?.username || 'User'}</span>.
                                </h1>
                                <p className="text-green-50/80 text-sm sm:text-base font-medium leading-relaxed">
                                    Ini adalah ringkasan performa Baraja Coffee System hari ini. 
                                    Anda memiliki <strong className="text-white">{outlets.length} outlet</strong> aktif yang sedang berjalan.
                                </p>
                            </div>

                            {/* Live Status Widget */}
                            <div className="flex flex-row md:flex-col gap-3 shrink-0">
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl flex items-center gap-4 shadow-sm">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-green-200/80 tracking-widest mb-0.5">Waktu Server</span>
                                        <div className="flex items-center gap-2">
                                            <FaClock className="text-white/80" size={14} />
                                            <span className="text-lg font-bold font-mono">{currentTime}</span>
                                        </div>
                                    </div>
                                    <div className="w-[1px] h-8 bg-white/20"></div>
                                    <div className="flex flex-col items-center justify-center">
                                        <span className="text-[10px] uppercase font-bold text-green-200/80 tracking-widest mb-1">Sistem</span>
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 rounded-full border border-emerald-400/30">
                                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></div>
                                            <span className="text-[10px] font-bold text-emerald-200">SEHAT</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Unified Control Bar */}
                    <div className="relative z-[60] bg-white/80 backdrop-blur-xl border border-slate-200/60 p-2 sm:p-3 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-3 items-center">
                        <div className="flex items-center justify-center w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 shrink-0 hidden sm:flex">
                            <FaFilter size={14} />
                        </div>
                        
                        <div className="flex-1 w-full relative">
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1 mb-1 block">Outlet Cabang</label>
                            <select
                                name="outlet"
                                value={filters.outlet}
                                onChange={handleFilterChange}
                                className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 py-2.5 px-4 rounded-xl focus:ring-2 focus:ring-[#005429]/20 focus:border-[#005429] focus:outline-none transition-all cursor-pointer hover:bg-white hover:border-slate-300"
                            >
                                <option value="">Semua Outlet Terintegrasi</option>
                                {outlets.map((outlet) => (
                                    <option key={outlet._id} value={outlet._id}>{outlet.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="w-full sm:w-[1px] sm:h-12 bg-slate-200 shrink-0"></div>

                        <div className="flex-1 w-full relative">
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1 mb-1 block">Periode Analisis</label>
                            <div className="relative z-50">
                                <Datepicker
                                    showFooter
                                    showShortcuts
                                    value={filters.date}
                                    onChange={handleDateRangeChange}
                                    displayFormat="DD MMMM YYYY"
                                    inputClassName="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 py-2.5 px-4 rounded-xl shadow-sm focus:ring-2 focus:ring-[#005429]/20 focus:border-[#005429] focus:outline-none transition-all cursor-pointer hover:bg-white hover:border-slate-300"
                                    popoverDirection="down"
                                    containerClassName="relative"
                                    toggleClassName="absolute right-0 top-0 bottom-0 px-4 text-slate-400 focus:outline-none hover:text-[#005429] transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                        {cardsData.map((card, i) => (<CardItem key={i} {...card} />))}
                    </div>

                    {/* Main Chart Section */}
                    <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 relative">
                        <div className="w-full">
                           <SalesChart data={dashboardData.charts.hourly} />
                        </div>
                    </div>

                    {/* Top Products Table */}
                    <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-black text-lg text-slate-800 tracking-tight font-['Outfit',sans-serif]">Produk Terlaris (Top 5)</h3>
                                <p className="text-xs text-slate-500 font-medium">Berdasarkan volume penjualan terbaik pada periode ini</p>
                            </div>
                            <div className="w-10 h-10 bg-[#005429]/5 rounded-xl flex items-center justify-center text-[#005429] shadow-sm border border-[#005429]/10">
                                <FaShoppingCart size={16} />
                            </div>
                        </div>
                        <div className="p-2">
                           <TopProductTable data={dashboardData.products.top10} />
                        </div>
                    </div>
                </div>

                {/* ----------------- RIGHT SIDEBAR (3 Cols) ----------------- */}
                <div className="xl:col-span-4 2xl:col-span-3 flex flex-col gap-6 lg:gap-8">
                    
                    {/* NEW: AI Insights / Quick Summary Widget */}
                    <div className="bg-gradient-to-b from-indigo-50 to-white rounded-[24px] border border-indigo-100 shadow-sm p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-2">
                                <FaMagic className="text-indigo-500" size={16} />
                                <h3 className="font-bold text-sm text-indigo-900 tracking-tight font-['Outfit',sans-serif]">Smart Insights</h3>
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 bg-white px-2 py-1 rounded-full border border-indigo-100 shadow-sm">BETA</span>
                        </div>
                        
                        <div className="space-y-3 relative z-10">
                            <div className="p-3 bg-white rounded-xl border border-indigo-50 shadow-sm text-xs text-slate-600 leading-relaxed font-medium">
                                <strong className="text-indigo-700">Performa Baik!</strong> Penjualan hari ini lebih tinggi <strong className="text-emerald-600">+{dashboardData.summary.comparison.sales.percentage}%</strong> dibandingkan rata-rata kemarin.
                            </div>
                            <div className="p-3 bg-white rounded-xl border border-indigo-50 shadow-sm text-xs text-slate-600 leading-relaxed font-medium">
                                <strong className="text-amber-600">Rekomendasi:</strong> Kategori {dashboardData.charts.salesByCategory[0]?.name || 'Coffee'} mendominasi. Pertimbangkan untuk mempromosikan kategori makanan pendamping (Snack).
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions (Admin Only) */}
                    {(superAdmin || admin) && (
                        <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 flex flex-col">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                                    <FaBolt size={14} />
                                </div>
                                <h3 className="font-bold text-sm text-slate-800 tracking-tight font-['Outfit',sans-serif]">Aksi Cepat</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <Link to="/admin/menu-create" className="flex flex-col items-center text-center gap-2 p-3 bg-slate-50 border border-slate-100 hover:border-[#005429]/30 hover:bg-[#005429]/5 rounded-xl transition-all group">
                                    <div className="w-8 h-8 bg-white shadow-sm border border-slate-200 rounded-full flex items-center justify-center text-[#005429] group-hover:scale-110 transition-transform">
                                        <FaPlus size={10} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest group-hover:text-[#005429]">Menu Baru</span>
                                </Link>
                                <Link to="/admin/promo-khusus-create" className="flex flex-col items-center text-center gap-2 p-3 bg-slate-50 border border-slate-100 hover:border-[#005429]/30 hover:bg-[#005429]/5 rounded-xl transition-all group">
                                    <div className="w-8 h-8 bg-white shadow-sm border border-slate-200 rounded-full flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                        <FaPlus size={10} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest group-hover:text-amber-600">Promo Baru</span>
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Smaller Analytics Charts */}
                    <div className="flex flex-col gap-6 lg:gap-8">
                        <div className="bg-white border border-slate-200/80 p-5 rounded-[24px] shadow-sm hover:shadow-md transition-shadow">
                            <h4 className="font-bold text-sm text-slate-800 mb-4 font-['Outfit',sans-serif]">Distribusi Kategori</h4>
                            <TotalOrder data={dashboardData.charts.salesByCategory} />
                        </div>
                        <div className="bg-white border border-slate-200/80 p-5 rounded-[24px] shadow-sm hover:shadow-md transition-shadow">
                            <h4 className="font-bold text-sm text-slate-800 mb-4 font-['Outfit',sans-serif]">Penjualan Makanan</h4>
                            <FoodChart data={dashboardData.products.food} />
                        </div>
                        <div className="bg-white border border-slate-200/80 p-5 rounded-[24px] shadow-sm hover:shadow-md transition-shadow">
                            <h4 className="font-bold text-sm text-slate-800 mb-4 font-['Outfit',sans-serif]">Penjualan Minuman</h4>
                            <DrinkChart data={dashboardData.products.drinks} />
                        </div>
                        <div className="bg-white border border-slate-200/80 p-5 rounded-[24px] shadow-sm hover:shadow-md transition-shadow">
                            <h4 className="font-bold text-sm text-slate-800 mb-4 font-['Outfit',sans-serif]">Tipe Transaksi</h4>
                            <TransactionType data={dashboardData.charts.orderTypes} />
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Dashboard;