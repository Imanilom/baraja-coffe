import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Award, TrendingUp } from 'lucide-react';

export default function CustomerSegmentDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/analytics/customer-segmentation');
            const result = await response.json();

            if (result.success) {
                setData(result.data.segments);
            } else {
                setError('Failed to fetch data');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getAllCustomersWithLoyalty = () => {
        if (!data) return [];

        const allCustomers = [];
        data.forEach(segment => {
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
                            profilePicture: customer.customerInfo.profilePicture
                        });
                    }
                });
            }
        });

        return allCustomers.sort((a, b) => b.loyaltyPoints - a.loyaltyPoints);
    };

    const getTop5Customers = () => {
        const allCustomers = getAllCustomersWithLoyalty();
        return allCustomers.slice(0, 5).map(customer => ({
            name: customer.username.length > 15 ? customer.username.substring(0, 15) + '...' : customer.username,
            points: customer.loyaltyPoints,
            fullName: customer.username
        }));
    };

    const calculateStats = () => {
        const allCustomers = getAllCustomersWithLoyalty();
        const totalPoints = allCustomers.reduce((sum, c) => sum + c.loyaltyPoints, 0);
        const avgPoints = allCustomers.length > 0 ? totalPoints / allCustomers.length : 0;
        const maxPoints = allCustomers.length > 0 ? allCustomers[0].loyaltyPoints : 0;

        return {
            totalCustomers: allCustomers.length,
            totalPoints,
            avgPoints: Math.round(avgPoints),
            maxPoints
        };
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

    const top5Data = getTop5Customers();
    const allCustomers = getAllCustomersWithLoyalty();
    const stats = calculateStats();

    return (
        <div className="min-h-screen bg-gray-50 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Customer Analytics Dashboard</h1>
                    <p className="text-gray-600 mt-2">Monitor customer loyalty and engagement metrics</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-600 hover:shadow-lg transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Customers</p>
                                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalCustomers}</p>
                            </div>
                            <Users className="text-indigo-600" size={48} />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-600 hover:shadow-lg transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Points</p>
                                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalPoints.toLocaleString()}</p>
                            </div>
                            <Award className="text-purple-600" size={48} />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600 hover:shadow-lg transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Avg Points</p>
                                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.avgPoints.toLocaleString()}</p>
                            </div>
                            <TrendingUp className="text-green-600" size={48} />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-600 hover:shadow-lg transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Top Points</p>
                                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.maxPoints.toLocaleString()}</p>
                            </div>
                            <Award className="text-orange-600" size={48} />
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Customer List */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <Users className="text-indigo-600" size={28} />
                            Poin Pelanggan
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                                        <th className="text-left py-4 px-4 text-gray-700 text-xs font-bold uppercase">Rank</th>
                                        <th className="text-left py-4 px-4 text-gray-700 text-xs font-bold uppercase">Customer</th>
                                        <th className="text-left py-4 px-4 text-gray-700 text-xs font-bold uppercase">Email</th>
                                        <th className="text-right py-4 px-4 text-gray-700 text-xs font-bold uppercase">Points</th>
                                        <th className="text-right py-4 px-4 text-gray-700 text-xs font-bold uppercase">Spent</th>
                                        <th className="text-right py-4 px-4 text-gray-700 text-xs font-bold uppercase">Orders</th>
                                        <th className="text-center py-4 px-4 text-gray-700 text-xs font-bold uppercase">Level</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allCustomers.map((customer, index) => (
                                        <tr
                                            key={customer.userId}
                                            className={`border-b border-gray-100 hover:bg-indigo-50 transition ${index < 5 ? 'bg-gradient-to-r from-indigo-50 to-purple-50' : ''
                                                }`}
                                        >
                                            <td className="py-4 px-4">
                                                <span className={`font-bold ${index === 0 ? 'text-yellow-600 text-xl' :
                                                    index === 1 ? 'text-gray-500 text-lg' :
                                                        index === 2 ? 'text-amber-700 text-lg' :
                                                            index < 5 ? 'text-indigo-600 text-base' : 'text-gray-600 text-sm'
                                                    }`}>
                                                    #{index + 1}
                                                </span>
                                            </td>
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
                                                        <span className="text-white font-bold text-lg">
                                                            {customer.username.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span className="font-semibold text-gray-800">{customer.username}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-gray-600 text-sm">{customer.email}</td>
                                            <td className="py-4 px-4 text-right">
                                                <span className="font-bold text-indigo-600 text-base">
                                                    {customer.loyaltyPoints.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right text-gray-700 text-sm">
                                                Rp {customer.totalSpent.toLocaleString()}
                                            </td>
                                            <td className="py-4 px-4 text-right text-gray-700 font-semibold">
                                                {customer.totalOrders}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${getLoyaltyBadgeColor(customer.loyaltyLevel)}`}>
                                                    {customer.loyaltyLevel}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Top 5 Chart */}
                    <div className="lg:col-span-1 bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <Award className="text-indigo-600" size={28} />
                            Top 5 Pelanggan
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={top5Data} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    type="number"
                                    stroke="#6b7280"
                                    style={{ fontSize: '11px' }}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    stroke="#6b7280"
                                    style={{ fontSize: '11px' }}
                                    width={100}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                    formatter={(value, name, props) => [
                                        `${value.toLocaleString()} points`,
                                        props.payload.fullName
                                    ]}
                                />
                                <Bar
                                    dataKey="points"
                                    fill="url(#colorGradient)"
                                    radius={[0, 8, 8, 0]}
                                    name="Loyalty Points"
                                />
                                <defs>
                                    <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#4f46e5" />
                                        <stop offset="100%" stopColor="#7c3aed" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}