import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Award, TrendingUp } from 'lucide-react';
import { FaChevronRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function PointManagement() {
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

  const getAllCustomersWithLoyalty = () => {
    if (!data) return [];

    const allCustomers = [];
    data.forEach(segment => {
      segment.customers.forEach(customer => {
        if (customer.customerInfo && customer.customerInfo.email) {
          allCustomers.push({
            userId: customer.customerInfo.userId || 'Unknown',
            username: customer.customerInfo.username || 'Unknown User',
            email: customer.customerInfo.email || '-',
            loyaltyPoints: customer.customerInfo.loyaltyPoints || 0,
            loyaltyLevel: customer.customerInfo.loyaltyLevel || '-',
            totalSpent: customer.totalSpent || 0,
            totalOrders: customer.totalOrders || 0,
            profilePicture: customer.customerInfo.profilePicture
          });
        }
      });
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="pb-[50px] px-6">

      {/* Breadcrumb */}
      <div className="flex justify-between items-center py-3 my-3">
        <div className="flex gap-2 items-center text-xl text-green-900 font-semibold">
          <Link to="/admin/promotion">Promosi</Link>
          <FaChevronRight />
          <span>Poin</span>
        </div>
      </div>
      <div className="">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Customers</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalCustomers}</p>
              </div>
              <Users className="text-indigo-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Points</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalPoints.toLocaleString()}</p>
              </div>
              <Award className="text-purple-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Avg Points</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.avgPoints.toLocaleString()}</p>
              </div>
              <TrendingUp className="text-green-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Top Points</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.maxPoints.toLocaleString()}</p>
              </div>
              <Award className="text-orange-600" size={40} />
            </div>
          </div>
        </div>

        {/* Top 5 Chart & All Customers List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* All Customers List - Left Side (2/3 width) */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Users className="text-indigo-600" size={28} />
              Poin Pelanggan
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 text-gray-700 text-xs font-semibold">Rank</th>
                    <th className="text-left py-4 px-4 text-gray-700 text-xs font-semibold">Customer</th>
                    <th className="text-left py-4 px-4 text-gray-700 text-xs font-semibold">Email</th>
                    <th className="text-right py-4 px-4 text-gray-700 text-xs font-semibold">Loyalty Points</th>
                    <th className="text-right py-4 px-4 text-gray-700 text-xs font-semibold">Total Spent</th>
                    <th className="text-right py-4 px-4 text-gray-700 text-xs font-semibold">Total Orders</th>
                    <th className="text-center py-4 px-4 text-gray-700 text-xs font-semibold">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {allCustomers.map((customer, index) => (
                    <tr
                      key={customer.userId}
                      className={`border-b text-xs border-gray-100 hover:bg-gray-50 transition ${index < 5 ? 'bg-indigo-50' : ''}`}
                    >
                      <td className="py-4 px-4">
                        <span className={`font-bold ${index < 5 ? 'text-indigo-600 text-lg' : 'text-gray-600'}`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {customer.profilePicture ? (
                            <img
                              src={customer.profilePicture ? customer.profilePicture : "https://img.barajacoffee.com/uploads/placeholder.webp"}
                              alt={customer.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center">
                              <span className="text-indigo-700 font-semibold">
                                {customer.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="font-medium text-gray-800">{customer.username}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{customer.email}</td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-indigo-600 text-lg">
                          {customer.loyaltyPoints.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-gray-700">
                        Rp {customer.totalSpent.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-700">
                        {customer.totalOrders}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${customer.loyaltyLevel && customer.loyaltyLevel !== '-'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                          }`}>
                          {customer.loyaltyLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top 5 Chart - Right Side (1/3 width) */}
          <div className="">

            <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                Top 5 Pelanggan
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={top5Data} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value, name, props) => [
                      `${value.toLocaleString()} points`,
                      props.payload.fullName
                    ]}
                  />
                  <Bar
                    dataKey="points"
                    fill="#4f46e5"
                    radius={[0, 8, 8, 0]}
                    name="Loyalty Points"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}