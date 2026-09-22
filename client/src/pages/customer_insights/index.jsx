import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import {
    FaUsers,
    FaShoppingCart,
    FaMoneyBillWave,
    FaChartLine,
    FaSearch,
    FaWhatsapp,
    FaPhone,
    FaClock,
    FaStar,
    FaTag,
    FaTimes,
    FaChevronRight,
    FaChevronLeft,
    FaSort,
    FaSortUp,
    FaSortDown,
    FaTrash,
    FaArrowLeft,
    FaUtensils,
    FaCoffee,
    FaMoon,
    FaSun,
    FaHeart,
    FaFire,
} from "react-icons/fa";

// Color palette
const COLORS = [
    "#059669", "#10b981", "#06b6d4", "#3b82f6", "#6366f1",
    "#8b5cf6", "#ec4899", "#f97316", "#eab308", "#ef4444"
];

const TAG_COLORS = {
    "Pelanggan Setia": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Pelanggan Reguler": "bg-blue-100 text-blue-800 border-blue-200",
    "Pelanggan Baru": "bg-sky-100 text-sky-800 border-sky-200",
    "Night Owl": "bg-indigo-100 text-indigo-800 border-indigo-200",
    "Early Bird": "bg-amber-100 text-amber-800 border-amber-200",
    "Coffee Lover": "bg-orange-100 text-orange-800 border-orange-200",
    "Food Enthusiast": "bg-rose-100 text-rose-800 border-rose-200",
    "Big Spender": "bg-purple-100 text-purple-800 border-purple-200",
};

const TAG_ICONS = {
    "Pelanggan Setia": FaHeart,
    "Pelanggan Reguler": FaUsers,
    "Pelanggan Baru": FaStar,
    "Night Owl": FaMoon,
    "Early Bird": FaSun,
    "Coffee Lover": FaCoffee,
    "Food Enthusiast": FaUtensils,
    "Big Spender": FaMoneyBillWave,
};

const formatCurrency = (val) => {
    if (!val && val !== 0) return "Rp 0";
    return `Rp ${Math.round(val).toLocaleString("id-ID")}`;
};

const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatPhone = (phone) => {
    if (!phone) return "-";
    if (phone.startsWith("62")) {
        return `+${phone.slice(0, 2)} ${phone.slice(2, 5)}-${phone.slice(5, 9)}-${phone.slice(9)}`;
    }
    return phone;
};

// ==================== SUMMARY CARD ====================
const SummaryCard = ({ icon: Icon, label, value, subtext, color = "emerald" }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-2xl font-bold text-gray-800 group-hover:text-${color}-600 transition-colors`}>{value}</p>
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
            <div className={`w-11 h-11 rounded-xl bg-${color}-50 flex items-center justify-center group-hover:bg-${color}-100 transition-colors`}>
                <Icon className={`text-${color}-500 text-lg`} />
            </div>
        </div>
    </div>
);

// ==================== TAG BADGE ====================
const TagBadge = ({ tag, onClick, isActive = false, size = "sm" }) => {
    const colorClass = TAG_COLORS[tag] || "bg-gray-100 text-gray-700 border-gray-200";
    const TagIcon = TAG_ICONS[tag] || FaTag;
    const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1 ${sizeClass} rounded-full border font-medium transition-all duration-200 ${colorClass} ${isActive ? "ring-2 ring-offset-1 ring-emerald-400" : "hover:opacity-80"}`}
        >
            <TagIcon className="text-[10px]" />
            {tag}
        </button>
    );
};

// ==================== DETAIL PANEL ====================
const DetailPanel = ({ profile, onClose }) => {
    if (!profile) return null;

    // Format hourly data for chart
    const hourlyData = useMemo(() => {
        const hours = profile.interactionHours || {};
        return Array.from({ length: 24 }, (_, i) => ({
            hour: `${String(i).padStart(2, "0")}:00`,
            count: hours[String(i)] || 0,
        }));
    }, [profile]);

    // Format daily data for chart
    const dailyData = useMemo(() => {
        const days = profile.interactionDays || {};
        const dayOrder = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
        return dayOrder.map(day => ({
            day,
            count: days[day] || 0,
        }));
    }, [profile]);

    // Top 5 favorite items for pie
    const favoritePieData = useMemo(() => {
        return (profile.favoriteItems || []).slice(0, 6).map(fi => ({
            name: fi.menuItemName,
            value: fi.orderCount,
        }));
    }, [profile]);

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="relative ml-auto w-full max-w-2xl bg-white shadow-2xl overflow-y-auto animate-slide-in-right">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 p-6 z-10">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition"
                    >
                        <FaTimes />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
                            {(profile.name || "P")[0].toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{profile.name || "Pelanggan"}</h2>
                            <p className="text-emerald-100 text-sm flex items-center gap-1.5">
                                <FaWhatsapp /> {formatPhone(profile.phone)}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {(profile.tags || []).map((tag, i) => (
                            <TagBadge key={i} tag={tag} size="sm" />
                        ))}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-400">Total Pesan</p>
                            <p className="text-lg font-bold text-gray-800">{profile.totalInteractions || 0}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-400">Total Order</p>
                            <p className="text-lg font-bold text-emerald-600">{profile.totalOrders || 0}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-400">Total Belanja</p>
                            <p className="text-lg font-bold text-gray-800">{formatCurrency(profile.totalSpent)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-400">Rata-rata</p>
                            <p className="text-lg font-bold text-blue-600">{formatCurrency(profile.averageOrderValue)}</p>
                        </div>
                    </div>

                    {/* Hourly Distribution */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <FaClock className="text-emerald-500" /> Distribusi Jam Interaksi
                        </h3>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={hourlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} />
                                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                                        formatter={(v) => [v, "Interaksi"]}
                                    />
                                    <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Daily Distribution */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <FaChartLine className="text-blue-500" /> Distribusi Hari Interaksi
                        </h3>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <ResponsiveContainer width="100%" height={160}>
                                <BarChart data={dailyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                                        formatter={(v) => [v, "Interaksi"]}
                                    />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Favorite Items */}
                    {(profile.favoriteItems || []).length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <FaStar className="text-amber-500" /> Menu Favorit
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    {(profile.favoriteItems || []).slice(0, 8).map((fi, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2.5">
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${i < 3 ? "bg-emerald-500" : "bg-gray-400"}`}>
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{fi.menuItemName}</p>
                                                <p className="text-xs text-gray-400">{fi.orderCount}x dipesan</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {favoritePieData.length > 0 && (
                                    <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height={200}>
                                            <PieChart>
                                                <Pie
                                                    data={favoritePieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={40}
                                                    outerRadius={70}
                                                    dataKey="value"
                                                    paddingAngle={3}
                                                >
                                                    {favoritePieData.map((_, idx) => (
                                                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                                                    formatter={(v, name) => [`${v}x`, name]}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Order History */}
                    {(profile.orderHistory || []).length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <FaShoppingCart className="text-emerald-500" /> Riwayat Pesanan Terakhir
                            </h3>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                                {(profile.orderHistory || []).slice().reverse().slice(0, 15).map((oh, i) => (
                                    <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-mono font-bold text-emerald-600">#{oh.orderId}</span>
                                            <span className="text-xs text-gray-400">{formatDate(oh.orderedAt)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-gray-600">
                                                {(oh.items || []).map(it => `${it.name} (${it.quantity}x)`).join(", ")}
                                            </div>
                                            <span className="text-sm font-semibold text-gray-800 ml-2 shrink-0">{formatCurrency(oh.totalAmount)}</span>
                                        </div>
                                        <div className="mt-1">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${oh.orderType === "Take Away" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                                                {oh.orderType}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
                        <p><span className="font-medium">Pertama interaksi:</span> {formatDate(profile.firstSeenAt)}</p>
                        <p><span className="font-medium">Terakhir interaksi:</span> {formatDate(profile.lastInteractionAt)}</p>
                        {profile.lastOrderAt && <p><span className="font-medium">Terakhir pesan:</span> {formatDate(profile.lastOrderAt)}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==================== MAIN COMPONENT ====================
const CustomerInsights = () => {
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [availableTags, setAvailableTags] = useState([]);
    const [summary, setSummary] = useState(null);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Filters
    const [search, setSearch] = useState("");
    const [activeTag, setActiveTag] = useState("");
    const [sortBy, setSortBy] = useState("lastInteractionAt");
    const [sortOrder, setSortOrder] = useState("desc");

    // Fetch summary stats
    const fetchSummary = async () => {
        try {
            const res = await axios.get("/api/customer-profiles/stats/summary");
            if (res.data.success) setSummary(res.data.data);
        } catch (err) {
            console.error("Error fetching summary:", err);
        }
    };

    // Fetch customer list
    const fetchCustomers = async (page = 1) => {
        setLoading(true);
        try {
            const res = await axios.get("/api/customer-profiles", {
                params: { page, limit: 20, search, tag: activeTag, sortBy, sortOrder },
            });
            if (res.data.success) {
                setCustomers(res.data.data);
                setPagination(res.data.pagination);
                setAvailableTags(res.data.availableTags || []);
            }
        } catch (err) {
            console.error("Error fetching customers:", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch detail profile
    const fetchDetail = async (id) => {
        setDetailLoading(true);
        try {
            const res = await axios.get(`/api/customer-profiles/${id}`);
            if (res.data.success) setSelectedProfile(res.data.data);
        } catch (err) {
            console.error("Error fetching detail:", err);
        } finally {
            setDetailLoading(false);
        }
    };

    // Delete profile
    const handleDelete = async (id, name) => {
        if (!window.confirm(`Hapus profil ${name}? Data tidak dapat dikembalikan.`)) return;
        try {
            await axios.delete(`/api/customer-profiles/${id}`);
            fetchCustomers(pagination.page);
            fetchSummary();
        } catch (err) {
            console.error("Error deleting:", err);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    useEffect(() => {
        fetchCustomers(1);
    }, [search, activeTag, sortBy, sortOrder]);

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === "desc" ? "asc" : "desc");
        } else {
            setSortBy(field);
            setSortOrder("desc");
        }
    };

    const SortIcon = ({ field }) => {
        if (sortBy !== field) return <FaSort className="text-gray-300 text-[10px]" />;
        return sortOrder === "desc"
            ? <FaSortDown className="text-emerald-500 text-[10px]" />
            : <FaSortUp className="text-emerald-500 text-[10px]" />;
    };

    // Hourly distribution chart from summary
    const globalHourlyData = useMemo(() => {
        if (!summary?.hourlyDistribution) return [];
        return Array.from({ length: 24 }, (_, i) => ({
            hour: `${String(i).padStart(2, "0")}:00`,
            count: summary.hourlyDistribution[String(i)] || 0,
        }));
    }, [summary]);

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* CSS for slide animation */}
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in-right {
                    animation: slideInRight 0.3s ease-out;
                }
            `}</style>

            <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaWhatsapp className="text-emerald-500" />
                        Customer Insights
                        <span className="text-sm font-normal text-gray-400 ml-1">— Data Pelanggan Chatbot</span>
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Analisis kebiasaan dan preferensi pelanggan WhatsApp Bot</p>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                        <SummaryCard
                            icon={FaUsers}
                            label="Total Pelanggan"
                            value={summary.summary?.totalCustomers || 0}
                            subtext="Pelanggan unik"
                            color="emerald"
                        />
                        <SummaryCard
                            icon={FaShoppingCart}
                            label="Total Pesanan"
                            value={summary.summary?.totalOrders || 0}
                            subtext="Via WA Bot"
                            color="blue"
                        />
                        <SummaryCard
                            icon={FaMoneyBillWave}
                            label="Total Revenue"
                            value={formatCurrency(summary.summary?.totalRevenue)}
                            subtext="Dari chatbot"
                            color="amber"
                        />
                        <SummaryCard
                            icon={FaChartLine}
                            label="Rata-rata Order"
                            value={formatCurrency(summary.summary?.avgOrderValue)}
                            subtext="Per transaksi"
                            color="purple"
                        />
                    </div>
                )}

                {/* Charts Row */}
                {summary && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                        {/* Global Hourly Distribution */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <FaClock className="text-emerald-500" /> Peak Hours — Jam Tersibuk
                            </h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={globalHourlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                    <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} />
                                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                                        formatter={(v) => [v, "Total Interaksi"]}
                                    />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                        {globalHourlyData.map((entry, idx) => (
                                            <Cell key={idx} fill={entry.count > 0 ? "#059669" : "#e5e7eb"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Top Menu Items */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <FaFire className="text-orange-500" /> Menu Terpopuler (Via Chatbot)
                            </h3>
                            {(summary.topMenuItems || []).length > 0 ? (
                                <div className="space-y-2">
                                    {summary.topMenuItems.slice(0, 8).map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white ${i < 3 ? "bg-emerald-500" : "bg-gray-300"}`}>
                                                {i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                                                    <span className="text-xs text-gray-400">{item.totalOrdered}x</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                                                    <div
                                                        className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
                                                        style={{ width: `${Math.min(100, (item.totalOrdered / (summary.topMenuItems[0]?.totalOrdered || 1)) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 text-center py-8">Belum ada data pesanan</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
                            <input
                                type="text"
                                placeholder="Cari nama atau nomor telepon..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                            />
                            {search && (
                                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                                    <FaTimes className="text-xs" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tag filters */}
                    {availableTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            <button
                                onClick={() => setActiveTag("")}
                                className={`text-xs px-3 py-1 rounded-full border font-medium transition ${!activeTag ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-500 border-gray-200 hover:border-emerald-300"}`}
                            >
                                Semua
                            </button>
                            {availableTags.map(tag => (
                                <TagBadge
                                    key={tag}
                                    tag={tag}
                                    isActive={activeTag === tag}
                                    onClick={() => setActiveTag(prev => prev === tag ? "" : tag)}
                                    size="sm"
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Customer Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Pelanggan</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("totalInteractions")}>
                                        <span className="flex items-center gap-1">Interaksi <SortIcon field="totalInteractions" /></span>
                                    </th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("totalOrders")}>
                                        <span className="flex items-center gap-1">Order <SortIcon field="totalOrders" /></span>
                                    </th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("totalSpent")}>
                                        <span className="flex items-center gap-1">Total Belanja <SortIcon field="totalSpent" /></span>
                                    </th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Tags</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("lastInteractionAt")}>
                                        <span className="flex items-center gap-1">Terakhir Aktif <SortIcon field="lastInteractionAt" /></span>
                                    </th>
                                    <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-16">
                                            <div className="inline-flex items-center gap-2 text-gray-400">
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                Memuat data...
                                            </div>
                                        </td>
                                    </tr>
                                ) : customers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-16">
                                            <div className="text-gray-300 text-4xl mb-2">📭</div>
                                            <p className="text-sm text-gray-400">Belum ada data pelanggan chatbot</p>
                                            <p className="text-xs text-gray-300 mt-1">Data akan terisi otomatis saat pelanggan mengirim pesan via WA Bot</p>
                                        </td>
                                    </tr>
                                ) : (
                                    customers.map((c) => (
                                        <tr
                                            key={c._id}
                                            className="border-b border-gray-50 hover:bg-emerald-50/30 cursor-pointer transition-colors"
                                            onClick={() => fetchDetail(c._id)}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                        {(c.name || "P")[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">{c.name || "Pelanggan"}</p>
                                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                                            <FaPhone className="text-[8px]" /> {formatPhone(c.phone)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{c.totalInteractions || 0}</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{c.totalOrders || 0}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-700">{formatCurrency(c.totalSpent)}</td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <div className="flex flex-wrap gap-1">
                                                    {(c.tags || []).slice(0, 3).map((tag, i) => (
                                                        <TagBadge key={i} tag={tag} size="sm" />
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-400">{formatDate(c.lastInteractionAt)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(c._id, c.name); }}
                                                    className="text-gray-300 hover:text-red-500 transition p-1.5 rounded-lg hover:bg-red-50"
                                                    title="Hapus profil"
                                                >
                                                    <FaTrash className="text-xs" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                            <p className="text-xs text-gray-400">
                                Menampilkan {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total}
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => fetchCustomers(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                >
                                    <FaChevronLeft className="text-xs text-gray-500" />
                                </button>
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    const pageNum = pagination.page <= 3
                                        ? i + 1
                                        : pagination.page + i - 2;
                                    if (pageNum < 1 || pageNum > pagination.totalPages) return null;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => fetchCustomers(pageNum)}
                                            className={`w-8 h-8 rounded-lg text-xs font-medium transition ${pagination.page === pageNum ? "bg-emerald-500 text-white" : "hover:bg-gray-100 text-gray-600"}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => fetchCustomers(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                >
                                    <FaChevronRight className="text-xs text-gray-500" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Top Customers */}
                {summary?.topCustomers?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mt-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <FaStar className="text-amber-500" /> Pelanggan Paling Aktif
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            {summary.topCustomers.map((tc, i) => (
                                <div key={i} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => {
                                        // Find and fetch detail
                                        const customer = customers.find(c => c.phone === tc.phone);
                                        if (customer) fetchDetail(customer._id);
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${i === 0 ? "bg-amber-500" : i === 1 ? "bg-gray-400" : "bg-orange-300"}`}>
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{tc.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 space-y-0.5">
                                        <p>{tc.totalOrders} pesanan</p>
                                        <p className="font-medium text-emerald-600">{formatCurrency(tc.totalSpent)}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {(tc.tags || []).slice(0, 2).map((tag, j) => (
                                            <TagBadge key={j} tag={tag} size="sm" />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Panel */}
            {selectedProfile && (
                <DetailPanel
                    profile={selectedProfile}
                    onClose={() => setSelectedProfile(null)}
                />
            )}

            {/* Detail loading overlay */}
            {detailLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 shadow-xl flex items-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-emerald-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        <span className="text-sm text-gray-600">Memuat detail pelanggan...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerInsights;
