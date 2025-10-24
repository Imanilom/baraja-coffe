import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, ShoppingCart, DollarSign, Tag, Gift, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import axios from 'axios';

const CustomerSegmentDashboard = () => {
    const [selectedSegment, setSelectedSegment] = useState(null);
    const [segment, setSegment] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSegment();
    }, []);

    const fetchSegment = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get("/api/analytics/customer-segmentation");
            const data = response.data.data ? response.data.data : response.data;
            setSegment(Array.isArray(data) ? data : []);
        } catch (err) {
            setError('Failed to fetch segment data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    const formatDays = (days) => {
        if (days < 1) {
            return `${Math.round(days * 24)} jam yang lalu`;
        }
        return `${Math.round(days)} hari yang lalu`;
    };

    // Prepare data for line charts
    const prepareChartData = () => {
        if (!segment || segment.length === 0) return [];

        return segment.map((seg, index) => ({
            name: seg.segmentName ? seg.segmentName.substring(0, 8) + '...' : `Segment ${index + 1}`,
            revenue: seg.segmentMetrics.totalRevenue,
            customers: seg.count,
            avgOrder: seg.segmentMetrics.avgOrderValue,
            orders: seg.segmentMetrics.avgOrdersPerCustomer * seg.count,
            promoRate: seg.segmentMetrics.promoAdoptionRate * 100
        }));
    };

    const chartData = prepareChartData();

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="animate-spin mx-auto mb-4 text-indigo-600" size={48} />
                    <p className="text-gray-600">Loading segment data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <p className="text-red-700 mb-4">{error}</p>
                    <button
                        onClick={fetchSegment}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">Customer Segment Dashboard</h1>
                        <p className="text-gray-600">Analisis pelanggan berdasarkan segmentasi</p>
                    </div>
                    <button
                        onClick={fetchSegment}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                </div>

                {/* Analytics Charts */}
                {segment.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Revenue & Customer Chart */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue & Customer Analysis</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip
                                        formatter={(value, name) => {
                                            if (name === 'Revenue') return formatCurrency(value);
                                            return value;
                                        }}
                                    />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                                    <Line yAxisId="right" type="monotone" dataKey="customers" stroke="#3b82f6" strokeWidth={2} name="Customers" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Orders & Average Order Value Chart */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Orders & AOV Analysis</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip
                                        formatter={(value, name) => {
                                            if (name === 'Avg Order Value') return formatCurrency(value);
                                            return Math.round(value);
                                        }}
                                    />
                                    <Legend />
                                    <Area yAxisId="left" type="monotone" dataKey="orders" fill="#8b5cf6" stroke="#8b5cf6" name="Total Orders" />
                                    <Line yAxisId="right" type="monotone" dataKey="avgOrder" stroke="#f59e0b" strokeWidth={2} name="Avg Order Value" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Promo Adoption Rate Chart */}
                        <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Promo Adoption Rate by Segment</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                                    <Legend />
                                    <Line type="monotone" dataKey="promoRate" stroke="#f97316" strokeWidth={3} name="Promo Adoption (%)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Segment Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {segment.length === 0 ? (
                        <div className="col-span-2 bg-white rounded-xl shadow-lg p-12 text-center">
                            <p className="text-gray-500 text-lg">No segment data available</p>
                        </div>
                    ) : (
                        segment.map((seg, index) => (
                            <div
                                key={seg._id}
                                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-indigo-500"
                                onClick={() => setSelectedSegment(selectedSegment === seg._id ? null : seg._id)}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">
                                        {seg.segmentName || `Segment #${seg._id}`}
                                    </h2>
                                    <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full flex items-center gap-2">
                                        <Users size={18} />
                                        <span className="font-semibold">{seg.count} Pelanggan</span>
                                    </div>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-green-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <DollarSign size={16} className="text-green-600" />
                                            <span className="text-sm text-gray-600">Total Revenue</span>
                                        </div>
                                        <p className="text-lg font-bold text-green-700">
                                            {formatCurrency(seg.segmentMetrics.totalRevenue)}
                                        </p>
                                    </div>

                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <ShoppingCart size={16} className="text-blue-600" />
                                            <span className="text-sm text-gray-600">Avg Order Value</span>
                                        </div>
                                        <p className="text-lg font-bold text-blue-700">
                                            {formatCurrency(seg.segmentMetrics.avgOrderValue)}
                                        </p>
                                    </div>

                                    <div className="bg-purple-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TrendingUp size={16} className="text-purple-600" />
                                            <span className="text-sm text-gray-600">Avg Orders/Customer</span>
                                        </div>
                                        <p className="text-lg font-bold text-purple-700">
                                            {seg.segmentMetrics.avgOrdersPerCustomer}
                                        </p>
                                    </div>

                                    <div className="bg-orange-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Tag size={16} className="text-orange-600" />
                                            <span className="text-sm text-gray-600">Promo Adoption</span>
                                        </div>
                                        <p className="text-lg font-bold text-orange-700">
                                            {(seg.segmentMetrics.promoAdoptionRate * 100).toFixed(0)}%
                                        </p>
                                    </div>
                                </div>

                                {/* Customer Details - Expandable */}
                                {selectedSegment === seg._id && (
                                    <div className="mt-6 border-t pt-4 animate-fadeIn">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Detail Pelanggan</h3>
                                        <div className="space-y-4">
                                            {seg.customers.map((customer, idx) => (
                                                <div key={idx} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                                    <div className="flex items-start gap-4">
                                                        {customer.customerInfo.profilePicture && (
                                                            <img
                                                                src={customer.customerInfo.profilePicture}
                                                                alt={customer.customerInfo.username || 'User'}
                                                                className="w-16 h-16 rounded-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        )}
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h4 className="font-semibold text-gray-800">
                                                                    {customer.customerInfo.username || 'Anonymous User'}
                                                                </h4>
                                                                <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                                                    <Gift size={14} />
                                                                    <span>{customer.customerInfo.loyaltyPoints} pts</span>
                                                                </div>
                                                                {/* {customer.customerInfo.loyaltyPoints > 0 && (
                                                                    <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                                                        <Gift size={14} />
                                                                        <span>{customer.customerInfo.loyaltyPoints} pts</span>
                                                                    </div>
                                                                )} */}
                                                            </div>

                                                            {customer.customerInfo.email && (
                                                                <p className="text-sm text-gray-600 mb-1">{customer.customerInfo.email}</p>
                                                            )}
                                                            {customer.customerInfo.phone && (
                                                                <p className="text-sm text-gray-600 mb-3">{customer.customerInfo.phone}</p>
                                                            )}

                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Total Spent</p>
                                                                    <p className="font-semibold text-sm text-gray-800">
                                                                        {formatCurrency(customer.totalSpent)}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Total Orders</p>
                                                                    <p className="font-semibold text-sm text-gray-800">
                                                                        {customer.totalOrders}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Avg Order</p>
                                                                    <p className="font-semibold text-sm text-gray-800">
                                                                        {formatCurrency(customer.avgOrderValue)}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Last Order</p>
                                                                    <p className="font-semibold text-sm text-gray-800">
                                                                        {formatDays(customer.daysSinceLastOrder)}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2 mt-3">
                                                                <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                                                                    Promo: {customer.promoUsageRate}%
                                                                </div>
                                                                <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                                                                    Voucher: {customer.voucherUsageRate}%
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 text-center text-sm text-gray-500">
                                    {selectedSegment === seg._id ? 'Klik untuk menutup detail' : 'Klik untuk melihat detail pelanggan'}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Summary Stats */}
                {segment.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Summary Statistics</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Total Customers</p>
                                <p className="text-3xl font-bold text-blue-700">
                                    {segment.reduce((sum, seg) => sum + seg.count, 0)}
                                </p>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                                <p className="text-2xl font-bold text-green-700">
                                    {formatCurrency(segment.reduce((sum, seg) => sum + seg.segmentMetrics.totalRevenue, 0))}
                                </p>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                                <p className="text-3xl font-bold text-purple-700">
                                    {segment.reduce((sum, seg) => sum + (seg.segmentMetrics.avgOrdersPerCustomer * seg.count), 0)}
                                </p>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Avg Promo Adoption</p>
                                <p className="text-3xl font-bold text-orange-700">
                                    {((segment.reduce((sum, seg) => sum + seg.segmentMetrics.promoAdoptionRate, 0) / segment.length) * 100).toFixed(0)}%
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerSegmentDashboard;