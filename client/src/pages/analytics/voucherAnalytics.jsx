import React, { useMemo, useState, useEffect } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from "recharts";

const COLORS = ["#4f46e5", "#06b6d4", "#ef4444", "#f59e0b", "#10b981", "#7c3aed"];

export default function VoucherAnalytics({ apiEndpoint = "/api/analytics/voucher-usage" }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rangeDays, setRangeDays] = useState(30);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(apiEndpoint);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();

            if (result.success) {
                setData(result);
            } else {
                throw new Error('API returned unsuccessful response');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching voucher analytics:', err);
        } finally {
            setLoading(false);
        }
    }

    const filteredData = useMemo(() => {
        if (!data?.data) return [];
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - rangeDays + 1);

        return data.data.filter((item) => {
            if (!item.createdAt) return true;
            const itemDate = new Date(item.createdAt);
            return itemDate >= cutoff;
        });
    }, [data, rangeDays]);

    const kpis = useMemo(() => {
        const summary = data?.insights?.summary;
        if (!summary) {
            return {
                totalRedemptions: 0,
                totalRevenue: 0,
                redemptionRate: 0,
                activeVouchers: 0,
            };
        }
        return {
            totalRedemptions: summary.totalRedemptions || 0,
            totalRevenue: summary.totalRevenueGenerated || 0,
            redemptionRate: Math.round(summary.averageRedemptionRate || 0),
            activeVouchers: summary.activeVouchers || 0,
        };
    }, [data]);

    const lineChartData = useMemo(() => {
        if (!filteredData.length) return [];

        const dateMap = new Map();
        filteredData.forEach((item) => {
            const date = new Date(item.createdAt || Date.now());
            const dateStr = date.toISOString().split('T')[0];

            const existing = dateMap.get(dateStr) || { date: dateStr, redemptions: 0, revenue: 0 };
            dateMap.set(dateStr, {
                date: dateStr,
                redemptions: existing.redemptions + (item.redemptionCount || 0),
                revenue: existing.revenue + (item.totalRevenue || 0),
            });
        });

        return Array.from(dateMap.values()).sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );
    }, [filteredData]);

    const statusBarData = useMemo(() => {
        const breakdown = data?.insights?.performanceBreakdown?.byStatus;
        if (!breakdown) return [];

        return Object.entries(breakdown)
            .filter(([_, value]) => value > 0)
            .map(([key, value]) => ({
                name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                value,
            }))
            .sort((a, b) => b.value - a.value);
    }, [data]);

    const utilizationPieData = useMemo(() => {
        const breakdown = data?.insights?.performanceBreakdown?.byUtilization;
        if (!breakdown) return [];

        return Object.entries(breakdown)
            .filter(([_, value]) => value > 0)
            .map(([key, value]) => ({
                name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                value,
            }));
    }, [data]);

    const topVouchersList = useMemo(() => {
        if (!filteredData.length) return [];

        return [...filteredData]
            .sort((a, b) => (b.redemptionCount || 0) - (a.redemptionCount || 0))
            .slice(0, 6);
    }, [filteredData]);

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}/${day}`;
    }

    function downloadCSV() {
        const rows = [];
        rows.push(["Voucher Analytics Summary"]);
        rows.push([]);
        rows.push(["KPI", "Value"]);
        rows.push(["Total Redemptions", kpis.totalRedemptions]);
        rows.push(["Total Revenue", kpis.totalRevenue]);
        rows.push(["Redemption Rate (%)", kpis.redemptionRate]);
        rows.push(["Active Vouchers", kpis.activeVouchers]);
        rows.push([]);
        rows.push(["Top Vouchers"]);
        rows.push(["Code", "Redemptions", "Revenue", "Status"]);

        topVouchersList.forEach((voucher) => {
            rows.push([
                voucher.code || "N/A",
                voucher.redemptionCount || 0,
                voucher.totalRevenue || 0,
                voucher.performanceStatus || "N/A",
            ]);
        });

        const csv = rows
            .map((row) =>
                row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")
            )
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const today = new Date().toISOString().split('T')[0];
        link.download = `voucher-analytics-${today}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading voucher analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto mt-12">
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
                    <div className="text-red-600 text-lg font-semibold mb-2">
                        ⚠️ Error Loading Data
                    </div>
                    <p className="text-red-600 text-sm mb-4">{error}</p>
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className=" mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Voucher Analytics</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Monitor and analyze voucher performance and usage
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {[7, 14, 30, 90].map((days) => (
                            <button
                                key={days}
                                onClick={() => setRangeDays(days)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${rangeDays === days
                                    ? "bg-indigo-600 text-white shadow-md"
                                    : "bg-white text-gray-700 hover:bg-gray-100"
                                    }`}
                            >
                                {days}d
                            </button>
                        ))}
                        <button
                            onClick={downloadCSV}
                            className="ml-2 px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium shadow-md"
                        >
                            📊 Export CSV
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {data?.insights?.alerts && data.insights.alerts.length > 0 && (
                    <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                        <div className="flex items-start">
                            <span className="text-2xl mr-3">⚠️</span>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-yellow-800 mb-2">Alerts</h3>
                                <ul className="text-sm text-yellow-700 space-y-1">
                                    {data.insights.alerts.slice(0, 3).map((alert, i) => (
                                        <li key={i}>• {alert}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <KpiCard
                        title="Total Redemptions"
                        value={kpis.totalRedemptions.toLocaleString()}
                        subtitle={`Last ${rangeDays} days`}
                        icon="🎟️"
                    />
                    <KpiCard
                        title="Revenue"
                        value={formatCurrency(kpis.totalRevenue)}
                        subtitle="Total revenue generated"
                        icon="💰"
                    />
                    <KpiCard
                        title="Redemption Rate"
                        value={`${kpis.redemptionRate}%`}
                        subtitle="Average redemption rate"
                        icon="📊"
                    />
                    <KpiCard
                        title="Active Vouchers"
                        value={kpis.activeVouchers.toLocaleString()}
                        subtitle="Currently active"
                        icon="✅"
                    />
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="col-span-2 bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">
                            Voucher Redemptions Over Time
                        </h3>
                        {lineChartData.length > 0 ? (
                            <div style={{ width: "100%", height: 300 }}>
                                <ResponsiveContainer>
                                    <LineChart data={lineChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={formatDate}
                                            style={{ fontSize: 12 }}
                                        />
                                        <YAxis style={{ fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#fff",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "8px",
                                            }}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="redemptions"
                                            stroke="#4f46e5"
                                            strokeWidth={3}
                                            name="Redemptions"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyState message="No redemption data available for this period" />
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Performance Status</h3>
                        {statusBarData.length > 0 ? (
                            <div style={{ width: "100%", height: 260 }}>
                                <ResponsiveContainer>
                                    <BarChart data={statusBarData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis type="number" style={{ fontSize: 12 }} />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={120}
                                            style={{ fontSize: 11 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#fff",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "8px",
                                            }}
                                        />
                                        <Bar dataKey="value" fill="#7c3aed" radius={[0, 8, 8, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyState message="No status data available" />
                        )}
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm col-span-2">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">
                            Utilization Breakdown
                        </h3>
                        {utilizationPieData.length > 0 ? (
                            <div className="flex gap-6 items-center">
                                <div style={{ width: 280, height: 240 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={utilizationPieData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={90}
                                                label
                                            >
                                                {utilizationPieData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={COLORS[index % COLORS.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold mb-3 text-gray-900">Details</h4>
                                    <ul className="space-y-2">
                                        {utilizationPieData.map((item, idx) => (
                                            <li
                                                key={item.name}
                                                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        style={{
                                                            width: 16,
                                                            height: 16,
                                                            backgroundColor: COLORS[idx % COLORS.length],
                                                            borderRadius: 4,
                                                            display: "inline-block",
                                                        }}
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {item.name}
                                                    </span>
                                                </div>
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {item.value} vouchers
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <EmptyState message="No utilization data available" />
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Top Vouchers</h3>

                        {data?.insights?.recommendations && data.insights.recommendations.length > 0 && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="text-sm font-semibold text-blue-900 mb-2">
                                    💡 Recommendations
                                </div>
                                <ul className="text-xs text-blue-800 space-y-1">
                                    {data.insights.recommendations.slice(0, 2).map((rec, i) => (
                                        <li key={i} className="leading-relaxed">• {rec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {topVouchersList.length > 0 ? (
                            <div className="space-y-3">
                                {topVouchersList.map((voucher, idx) => (
                                    <div
                                        key={voucher._id || voucher.code || idx}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="font-semibold text-gray-900 text-sm">
                                                {voucher.code || "N/A"}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {voucher.performanceStatus || "Not rated"}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-indigo-600 text-lg">
                                                {voucher.redemptionCount || 0}
                                            </div>
                                            <div className="text-xs text-gray-500">redeemed</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="No voucher data available" small />
                        )}
                    </div>
                </div>

                {/* Summary Stats */}
                {data?.insights?.summary && (
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            label="Total Vouchers"
                            value={data.insights.summary.totalVouchers || 0}
                            color="blue"
                        />
                        <StatCard
                            label="Expired"
                            value={data.insights.summary.expiredVouchers || 0}
                            color="red"
                        />
                        <StatCard
                            label="High Performing"
                            value={data.insights.summary.highPerformingVouchers || 0}
                            color="green"
                        />
                        <StatCard
                            label="Unused"
                            value={data.insights.summary.unusedVouchers || 0}
                            color="gray"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function KpiCard({ title, value, subtitle, icon }) {
    return (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {title}
                </div>
                <span className="text-2xl">{icon}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
            <div className="text-xs text-gray-500">{subtitle}</div>
        </div>
    );
}

function StatCard({ label, value, color }) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        red: "bg-red-50 text-red-700 border-red-200",
        green: "bg-green-50 text-green-700 border-green-200",
        gray: "bg-gray-50 text-gray-700 border-gray-200",
    };

    return (
        <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
            <div className="text-xs font-medium uppercase tracking-wide mb-1">{label}</div>
            <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        </div>
    );
}

function EmptyState({ message, small }) {
    return (
        <div className={`flex items-center justify-center ${small ? "py-8" : "h-64"} text-gray-400`}>
            <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-sm">{message}</p>
            </div>
        </div>
    );
}

function formatCurrency(value) {
    if (typeof value !== "number") return value;
    return value.toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    });
}