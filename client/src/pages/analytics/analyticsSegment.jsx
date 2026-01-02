import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Users, Award, TrendingUp, ShoppingCart, DollarSign, Filter } from 'lucide-react';

export default function CustomerDetailedAnalytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState('all');
    const [viewMode, setViewMode] = useState('customer'); // 'customer' or 'level'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/analytics/customer-segmentation');
            const result = await response.json();

            if (result.success) {
                setData(result.data);
            } else {
                setError('Failed to fetch data');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getAllCustomers = () => {
        if (!data) return [];

        const allCustomers = [];
        data.segments.forEach(segment => {
            if (segment.customers && segment.customers.length > 0) {
                segment.customers.forEach(customer => {
                    if (customer.customerInfo && customer.customerInfo.email) {
                        allCustomers.push({
                            userId: customer.customerInfo.userId || 'Unknown',
                            username: customer.customerInfo.username || 'Unknown User',
                            email: customer.customerInfo.email || '-',
                            loyaltyPoints: customer.customerInfo.loyaltyPoints || 0,
                            loyaltyLevel: segment.name || '-',
                            totalSpent: customer.totalSpent || 0,
                            totalOrders: customer.totalOrders || 0,
                            avgOrderValue: customer.avgOrderValue || 0,
                            profilePicture: customer.customerInfo.profilePicture,
                            firstOrderDate: customer.firstOrderDate,
                            lastOrderDate: customer.lastOrderDate,
                            daysSinceLastOrder: customer.daysSinceLastOrder || 0
                        });
                    }
                });
            }
        });

        return allCustomers;
    };

    const getFilteredCustomers = () => {
        const customers = getAllCustomers();
        if (selectedLevel === 'all') return customers;
        return customers.filter(c => c.loyaltyLevel.toLowerCase() === selectedLevel.toLowerCase());
    };

    const getLevelAnalysis = () => {
        if (!data) return [];

        return data.insights.map(insight => ({
            level: insight.name,
            customerCount: insight.insights?.customerCount || 0,
            totalRevenue: insight.insights?.totalRevenue || 0,
            avgOrderValue: insight.insights?.avgOrderValue || 0,
            avgOrders: insight.insights?.avgOrders || 0,
            customerValue: insight.insights?.customerValue || 0
        })).filter(item => item.customerCount > 0);
    };

    const getCustomerFrequencyData = () => {
        const customers = getFilteredCustomers();
        return customers.map(c => ({
            name: c.username.length > 12 ? c.username.substring(0, 12) + '...' : c.username,
            fullName: c.username,
            orders: c.totalOrders,
            spending: c.totalSpent
        })).sort((a, b) => b.orders - a.orders);
    };

    const getCustomerSpendingData = () => {
        const customers = getFilteredCustomers();
        return customers.map(c => ({
            name: c.username.length > 12 ? c.username.substring(0, 12) + '...' : c.username,
            fullName: c.username,
            spending: c.totalSpent,
            orders: c.totalOrders
        })).sort((a, b) => b.spending - a.spending);
    };

    const getLevelDistributionData = () => {
        const levelAnalysis = getLevelAnalysis();
        return levelAnalysis.map(item => ({
            name: item.level.charAt(0).toUpperCase() + item.level.slice(1),
            value: item.customerCount
        }));
    };

    const getLevelRevenueData = () => {
        const levelAnalysis = getLevelAnalysis();
        return levelAnalysis.map(item => ({
            level: item.level.charAt(0).toUpperCase() + item.level.slice(1),
            revenue: item.totalRevenue,
            avgOrder: item.avgOrderValue,
            customers: item.customerCount
        }));
    };

    const getLoyaltyBadgeColor = (level) => {
        const levelLower = level.toLowerCase();
        switch (levelLower) {
            case 'bronze':
                return 'bg-amber-100 text-amber-700 border border-amber-300';
            case 'silver':
                return 'bg-gray-200 text-gray-700 border border-gray-400';
            case 'gold':
                return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
            case 'platinum':
                return 'bg-slate-200 text-slate-700 border border-slate-400';
            case 'black':
                return 'bg-gray-800 text-white border border-gray-900';
            case 'blackchroma':
                return 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0';
            default:
                return 'bg-gray-100 text-gray-500 border border-gray-300';
        }
    };

    const COLORS = ['#f59e0b', '#6b7280', '#eab308', '#64748b', '#1f2937', '#7c3aed'];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading analytics...</p>
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
                        className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const filteredCustomers = getFilteredCustomers();
    const levelAnalysis = getLevelAnalysis();

    return (
        <div className="min-h-screen bg-gray-50 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Analisis Pelanggan Detail</h1>
                    <p className="text-gray-600 mt-2">Analisis mendalam per pelanggan dan level loyalitas</p>
                </div>

                {/* View Mode Toggle */}
                <div className="mb-6 flex gap-4">
                    <button
                        onClick={() => setViewMode('customer')}
                        className={`px-6 py-3 rounded-lg font-semibold transition ${viewMode === 'customer'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <Users className="inline mr-2" size={20} />
                        Analisis Per Pelanggan
                    </button>
                    <button
                        onClick={() => setViewMode('level')}
                        className={`px-6 py-3 rounded-lg font-semibold transition ${viewMode === 'level'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <Award className="inline mr-2" size={20} />
                        Analisis Per Level
                    </button>
                </div>

                {viewMode === 'customer' ? (
                    <>
                        {/* Filter Level */}
                        <div className="mb-6 bg-white rounded-xl shadow-md p-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <Filter className="text-indigo-600" size={24} />
                                <span className="font-semibold text-gray-700">Filter Level:</span>
                                <button
                                    onClick={() => setSelectedLevel('all')}
                                    className={`px-4 py-2 rounded-lg transition ${selectedLevel === 'all'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Semua ({getAllCustomers().length})
                                </button>
                                {['bronze', 'silver', 'gold', 'platinum', 'black', 'blackChroma'].map(level => {
                                    const count = getAllCustomers().filter(c => c.loyaltyLevel.toLowerCase() === level.toLowerCase()).length;
                                    if (count === 0) return null;
                                    return (
                                        <button
                                            key={level}
                                            onClick={() => setSelectedLevel(level)}
                                            className={`px-4 py-2 rounded-lg transition capitalize ${selectedLevel === level
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {level} ({count})
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Customer Analysis Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Frequency Chart */}
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                                    <ShoppingCart className="text-indigo-600" size={24} />
                                    Frekuensi Order per Pelanggan
                                </h2>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={getCustomerFrequencyData()}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="name"
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                            style={{ fontSize: '11px' }}
                                        />
                                        <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px'
                                            }}
                                            formatter={(value, name, props) => {
                                                if (name === 'orders') return [`${value} orders`, props.payload.fullName];
                                                return [value, name];
                                            }}
                                        />
                                        <Bar dataKey="orders" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Spending Chart */}
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                                    <DollarSign className="text-green-600" size={24} />
                                    Total Spending per Pelanggan
                                </h2>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={getCustomerSpendingData()}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="name"
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                            style={{ fontSize: '11px' }}
                                        />
                                        <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px'
                                            }}
                                            formatter={(value, name, props) => {
                                                if (name === 'spending') return [`Rp ${value.toLocaleString()}`, props.payload.fullName];
                                                return [value, name];
                                            }}
                                        />
                                        <Bar dataKey="spending" fill="#10b981" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Customer Detail Table */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <Users className="text-indigo-600" size={24} />
                                Detail Pelanggan
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200 bg-gray-50">
                                            <th className="text-left py-4 px-4 text-gray-700 text-xs font-bold uppercase">Pelanggan</th>
                                            <th className="text-center py-4 px-4 text-gray-700 text-xs font-bold uppercase">Level</th>
                                            <th className="text-right py-4 px-4 text-gray-700 text-xs font-bold uppercase">Total Order</th>
                                            <th className="text-right py-4 px-4 text-gray-700 text-xs font-bold uppercase">Total Spending</th>
                                            <th className="text-right py-4 px-4 text-gray-700 text-xs font-bold uppercase">Avg Order</th>
                                            <th className="text-right py-4 px-4 text-gray-700 text-xs font-bold uppercase">Loyalty Points</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCustomers.map((customer, index) => (
                                            <tr
                                                key={customer.userId}
                                                className="border-b border-gray-100 hover:bg-indigo-50 transition"
                                            >
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        {customer.profilePicture ? (
                                                            <img
                                                                src={customer.profilePicture}
                                                                alt={customer.username}
                                                                className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextSibling.style.display = 'flex';
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center ${customer.profilePicture ? 'hidden' : 'flex'}`}>
                                                            <span className="text-white font-bold">
                                                                {customer.username.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-800">{customer.username}</div>
                                                            <div className="text-xs text-gray-500">{customer.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${getLoyaltyBadgeColor(customer.loyaltyLevel)}`}>
                                                        {customer.loyaltyLevel}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <span className="font-bold text-indigo-600 text-lg">
                                                        {customer.totalOrders}
                                                    </span>
                                                    <span className="text-gray-500 text-xs ml-1">orders</span>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <span className="font-bold text-green-600">
                                                        Rp {customer.totalSpent.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-right text-gray-700">
                                                    Rp {Math.round(customer.avgOrderValue).toLocaleString()}
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <span className="font-bold text-purple-600">
                                                        {customer.loyaltyPoints.toLocaleString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Level Analysis */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Level Distribution Pie Chart */}
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                                    <Award className="text-indigo-600" size={24} />
                                    Distribusi Pelanggan per Level
                                </h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={getLevelDistributionData()}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {getLevelDistributionData().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Level Revenue Chart */}
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                                    <DollarSign className="text-green-600" size={24} />
                                    Revenue per Level
                                </h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={getLevelRevenueData()}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="level" stroke="#6b7280" style={{ fontSize: '11px' }} />
                                        <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px'
                                            }}
                                            formatter={(value) => `Rp ${value.toLocaleString()}`}
                                        />
                                        <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Level Detail Table */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <Award className="text-indigo-600" size={24} />
                                Analisis Detail per Level
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200 bg-gray-50">
                                            <th className="text-left py-4 px-4 text-gray-700 text-xs font-bold uppercase">Level</th>
                                            <th className="text-center py-4 px-4 text-gray-700 text-xs font-bold uppercase">Jumlah Pelanggan</th>
                                            <th className="text-right py-4 px-4 text-gray-700 text-xs font-bold uppercase">Total Revenue</th>
                                            <th className="text-right py-4 px-4 text-gray-700 text-xs font-bold uppercase">Avg Order Value</th>
                                            <th className="text-right py-4 px-4 text-gray-700 text-xs font-bold uppercase">Avg Orders</th>
                                            <th className="text-right py-4 px-4 text-gray-700 text-xs font-bold uppercase">Customer Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {levelAnalysis.map((level, index) => (
                                            <tr
                                                key={level.level}
                                                className="border-b border-gray-100 hover:bg-indigo-50 transition"
                                            >
                                                <td className="py-4 px-4">
                                                    <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase ${getLoyaltyBadgeColor(level.level)}`}>
                                                        {level.level}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className="font-bold text-indigo-600 text-lg">
                                                        {level.customerCount}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <span className="font-bold text-green-600">
                                                        Rp {level.totalRevenue.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-right text-gray-700">
                                                    Rp {Math.round(level.avgOrderValue).toLocaleString()}
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <span className="font-semibold text-gray-800">
                                                        {level.avgOrders.toFixed(1)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <span className="font-bold text-purple-600">
                                                        Rp {level.customerValue.toLocaleString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                                <h3 className="text-lg font-semibold mb-2">Total Pelanggan</h3>
                                <p className="text-4xl font-bold">{getAllCustomers().length}</p>
                                <p className="text-sm mt-2 opacity-90">Across all levels</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                                <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
                                <p className="text-4xl font-bold">
                                    Rp {levelAnalysis.reduce((sum, l) => sum + l.totalRevenue, 0).toLocaleString()}
                                </p>
                                <p className="text-sm mt-2 opacity-90">From all customers</p>
                            </div>
                            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
                                <h3 className="text-lg font-semibold mb-2">Avg Customer Value</h3>
                                <p className="text-4xl font-bold">
                                    Rp {Math.round(data?.clvAnalysis?.averageCLV || 0).toLocaleString()}
                                </p>
                                <p className="text-sm mt-2 opacity-90">Lifetime value</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}