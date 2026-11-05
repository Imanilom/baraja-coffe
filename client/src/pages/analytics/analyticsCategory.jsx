import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Package, TrendingUp, DollarSign, ShoppingCart, Users, AlertCircle, Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import Datepicker from 'react-tailwindcss-datepicker';

export default function CategoryAnalyticsDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: dayjs().toDate(),
        endDate: dayjs().toDate()
    });
    const [selectedMetric, setSelectedMetric] = useState('revenue');

    useEffect(() => {
        fetchData();
    }, []);

    const handleDateRangeChange = (newValue) => {
        setDateRange(newValue);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('startDate', dayjs(dateRange.startDate).format('YYYY-MM-DD'));
            params.append('endDate', dayjs(dateRange.endDate).format('YYYY-MM-DD'));
            params.append('groupBy', 'mainCategory');

            const response = await fetch(`/api/analytics/main-categories?${params}`);
            const result = await response.json();

            if (result.success) {
                setData(result);
            } else {
                setError('Failed to fetch data');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDateFilter = () => {
        fetchData();
    };

    const getCategoryChartData = () => {
        if (!data?.data) return [];
        return data.data.map(cat => ({
            name: cat.categoryName.charAt(0).toUpperCase() + cat.categoryName.slice(1),
            revenue: cat.totalRevenue,
            cost: cat.totalCost,
            profit: cat.grossProfit,
            quantity: cat.totalQuantity,
            orders: cat.totalOrders,
            customers: cat.uniqueCustomers
        }));
    };

    const getProfitMarginData = () => {
        if (!data?.data) return [];
        return data.data.map(cat => ({
            category: cat.categoryName.charAt(0).toUpperCase() + cat.categoryName.slice(1),
            margin: cat.profitMargin,
            profit: cat.grossProfit
        }));
    };

    const getPerformanceRadarData = () => {
        if (!data?.data) return [];

        const maxValues = {
            revenue: Math.max(...data.data.map(c => c.totalRevenue || 0)),
            quantity: Math.max(...data.data.map(c => c.totalQuantity)),
            orders: Math.max(...data.data.map(c => c.totalOrders)),
            customers: Math.max(...data.data.map(c => c.uniqueCustomers))
        };

        return data.data.map(cat => ({
            category: cat.categoryName.charAt(0).toUpperCase() + cat.categoryName.slice(1),
            Revenue: maxValues.revenue > 0 ? (cat.totalRevenue / maxValues.revenue) * 100 : 0,
            Quantity: (cat.totalQuantity / maxValues.quantity) * 100,
            Orders: (cat.totalOrders / maxValues.orders) * 100,
            Customers: (cat.uniqueCustomers / maxValues.customers) * 100
        }));
    };

    const getDistributionData = () => {
        if (!data?.data) return [];
        const metric = selectedMetric;

        return data.data.map(cat => ({
            name: cat.categoryName.charAt(0).toUpperCase() + cat.categoryName.slice(1),
            value: metric === 'revenue' ? cat.totalRevenue :
                metric === 'quantity' ? cat.totalQuantity :
                    metric === 'orders' ? cat.totalOrders :
                        cat.uniqueCustomers
        }));
    };

    const getTopPerformers = () => {
        if (!data?.insights?.topPerformers) return { revenue: [], quantity: [], profit: [] };

        return {
            revenue: data.insights.topPerformers.byRevenue ? data.insights.topPerformers.byRevenue.slice(0, 3) : [],
            quantity: data.insights.topPerformers.byQuantity ? data.insights.topPerformers.byQuantity.slice(0, 3) : [],
            profit: data.insights.topPerformers.byProfit ? data.insights.topPerformers.byProfit.slice(0, 3) : []
        };
    };

    const getCategoryStatusColor = (profit) => {
        if (profit > 0) return 'text-green-600';
        if (profit < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getCategoryBadgeColor = (profit) => {
        if (profit > 0) return 'bg-green-100 text-green-700 border-green-300';
        if (profit < 0) return 'bg-red-100 text-red-700 border-red-300';
        return 'bg-gray-100 text-gray-700 border-gray-300';
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading category analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <p className="text-red-600 text-lg">Error: {error}</p>
                    <button
                        onClick={fetchData}
                        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const categoryData = getCategoryChartData();
    const topPerformers = getTopPerformers();

    return (
        <div className="min-h-screen bg-gray-50 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Analisis Kategori Produk</h1>
                    <p className="text-gray-600 mt-2">Dashboard analisis performa kategori produk secara mendetail</p>
                </div>

                {/* Date Filter */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex items-center gap-4 flex-wrap">
                        <Calendar className="text-blue-600" size={24} />
                        <div className="flex flex-col md:flex-row md:items-center gap-3 flex-1">
                            <label className="text-sm font-semibold text-gray-700">Periode:</label>
                            <div className="flex-1 max-w-md">
                                <Datepicker
                                    showFooter
                                    showShortcuts
                                    value={dateRange}
                                    onChange={handleDateRangeChange}
                                    displayFormat="DD-MM-YYYY"
                                    inputClassName="w-full text-[13px] border py-[8px] pr-[25px] pl-[12px] rounded-lg cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    popoverDirection="down"
                                />
                            </div>
                        </div>
                        <button
                            onClick={fetchData}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                        >
                            Apply Filter
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <Package size={32} />
                            <span className="text-sm opacity-90">Total Kategori</span>
                        </div>
                        <p className="text-4xl font-bold">{data?.insights?.summary?.totalCategories || 0}</p>
                        <p className="text-sm mt-2 opacity-90">Categories</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign size={32} />
                            <span className="text-sm opacity-90">Total Revenue</span>
                        </div>
                        <p className="text-3xl font-bold">
                            Rp {(data?.insights?.summary?.totalRevenue || 0).toLocaleString()}
                        </p>
                        <p className="text-sm mt-2 opacity-90">All categories</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <ShoppingCart size={32} />
                            <span className="text-sm opacity-90">Total Quantity</span>
                        </div>
                        <p className="text-4xl font-bold">{data?.insights?.summary?.totalQuantity || 0}</p>
                        <p className="text-sm mt-2 opacity-90">Items sold</p>
                    </div>

                    <div className={`bg-gradient-to-br rounded-xl shadow-lg p-6 text-white ${(data?.insights?.summary?.totalProfit || 0) >= 0
                        ? 'from-emerald-500 to-emerald-600'
                        : 'from-red-500 to-red-600'
                        }`}>
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp size={32} />
                            <span className="text-sm opacity-90">Total Profit</span>
                        </div>
                        <p className="text-3xl font-bold">
                            Rp {(data?.insights?.summary?.totalProfit || 0).toLocaleString()}
                        </p>
                        <p className="text-sm mt-2 opacity-90">Gross profit</p>
                    </div>
                </div>

                {/* Main Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Revenue vs Cost vs Profit */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                            <DollarSign className="text-blue-600" size={24} />
                            Revenue, Cost & Profit per Kategori
                        </h2>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px'
                                    }}
                                    formatter={(value) => `Rp ${value.toLocaleString()}`}
                                />
                                <Legend />
                                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="cost" fill="#ef4444" name="Cost" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="profit" fill="#10b981" name="Profit" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Quantity & Orders */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                            <ShoppingCart className="text-purple-600" size={24} />
                            Quantity & Orders per Kategori
                        </h2>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="quantity" fill="#8b5cf6" name="Quantity" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="orders" fill="#f59e0b" name="Orders" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution & Performance */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Distribution Pie Chart */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                                <Package className="text-blue-600" size={24} />
                                Distribusi Kategori
                            </h2>
                            <select
                                value={selectedMetric}
                                onChange={(e) => setSelectedMetric(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="revenue">Revenue</option>
                                <option value="quantity">Quantity</option>
                                <option value="orders">Orders</option>
                                <option value="customers">Customers</option>
                            </select>
                        </div>
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={getDistributionData()}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                    outerRadius={110}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {getDistributionData().map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) =>
                                        selectedMetric === 'revenue' ? `Rp ${value.toLocaleString()}` : value.toLocaleString()
                                    }
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Performance Radar */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                            <TrendingUp className="text-green-600" size={24} />
                            Performance Comparison
                        </h2>
                        <ResponsiveContainer width="100%" height={320}>
                            <RadarChart data={getPerformanceRadarData()}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="category" style={{ fontSize: '12px' }} />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} style={{ fontSize: '10px' }} />
                                <Radar name="Revenue" dataKey="Revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                <Radar name="Quantity" dataKey="Quantity" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                                <Radar name="Orders" dataKey="Orders" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                                <Radar name="Customers" dataKey="Customers" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                                <Legend />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Detailed Category Table */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                        <Package className="text-blue-600" size={24} />
                        Detail Analisis per Kategori
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200 bg-gray-50">
                                    <th className="text-left py-4 px-4 text-gray-700 text-xs font-bold uppercase">Kategori</th>
                                    <th className="text-right py-4 px-4 text-gray-700 text-xs font-bold uppercase">Quantity</th>
                                    <th className="text-right py-4 px-4 text-gray-700 text-xs font-bold uppercase">Orders</th>
                                    <th className="text-right py-4 px-4 text-gray-700 text-xs font-bold uppercase">Customers</th>
                                    <th className="text-right py-4 px-4 text-gray-700 text-xs font-bold uppercase">Revenue</th>
                                    <th className="text-right py-4 px-4 text-gray-700 text-xs font-bold uppercase">Cost</th>
                                    <th className="text-right py-4 px-4 text-gray-700 text-xs font-bold uppercase">Profit</th>
                                    <th className="text-right py-4 px-4 text-gray-700 text-xs font-bold uppercase">Margin</th>
                                    <th className="text-right py-4 px-4 text-gray-700 text-xs font-bold uppercase">Avg/Order</th>
                                    <th className="text-center py-4 px-4 text-gray-700 text-xs font-bold uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.data?.map((category, index) => (
                                    <tr
                                        key={category._id}
                                        className="border-b border-gray-100 hover:bg-blue-50 transition"
                                    >
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                                    <span className="text-white font-bold text-lg">
                                                        {category.categoryName.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-800 capitalize">
                                                        {category.categoryName}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {category.avgQuantityPerOrder.toFixed(2)} qty/order
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="font-bold text-purple-600 text-lg">
                                                {category.totalQuantity}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="font-semibold text-gray-800">
                                                {category.totalOrders}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="font-semibold text-gray-800">
                                                {category.uniqueCustomers}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="font-bold text-blue-600">
                                                Rp {category.totalRevenue.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right text-red-600 font-semibold">
                                            Rp {category.totalCost.toLocaleString()}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className={`font-bold ${getCategoryStatusColor(category.grossProfit)}`}>
                                                Rp {category.grossProfit.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className={`font-semibold ${getCategoryStatusColor(category.profitMargin)}`}>
                                                {category.profitMargin.toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right text-gray-700">
                                            Rp {category.revenuePerOrder.toLocaleString()}
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase border ${getCategoryBadgeColor(category.grossProfit)}`}>
                                                {category.grossProfit > 0 ? 'Profit' : category.grossProfit < 0 ? 'Loss' : 'Break Even'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Performers Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Top by Revenue */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <DollarSign className="text-blue-600" size={20} />
                            Top Revenue
                        </h3>
                        <div className="space-y-3">
                            {topPerformers.revenue.map((cat, idx) => (
                                <div key={cat._id} className="bg-white rounded-lg p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-gray-800 capitalize">{cat.categoryName}</span>
                                        <span className="text-2xl font-bold text-blue-600">#{idx + 1}</span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Revenue: <span className="font-bold text-blue-600">Rp {cat.totalRevenue.toLocaleString()}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {cat.totalQuantity} items • {cat.totalOrders} orders
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top by Quantity */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <ShoppingCart className="text-purple-600" size={20} />
                            Top Quantity
                        </h3>
                        <div className="space-y-3">
                            {topPerformers.quantity.map((cat, idx) => (
                                <div key={cat._id} className="bg-white rounded-lg p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-gray-800 capitalize">{cat.categoryName}</span>
                                        <span className="text-2xl font-bold text-purple-600">#{idx + 1}</span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Quantity: <span className="font-bold text-purple-600">{cat.totalQuantity} items</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {cat.totalOrders} orders • {cat.avgQuantityPerOrder.toFixed(1)} avg/order
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top by Profit */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <TrendingUp className="text-green-600" size={20} />
                            Top Profit
                        </h3>
                        <div className="space-y-3">
                            {topPerformers.profit.map((cat, idx) => (
                                <div key={cat._id} className="bg-white rounded-lg p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-gray-800 capitalize">{cat.categoryName}</span>
                                        <span className={`text-2xl font-bold ${getCategoryStatusColor(cat.grossProfit)}`}>
                                            #{idx + 1}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Profit: <span className={`font-bold ${getCategoryStatusColor(cat.grossProfit)}`}>
                                            Rp {cat.grossProfit.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Margin: {cat.profitMargin.toFixed(2)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}