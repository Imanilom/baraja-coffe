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

export default function PromoAnalytics({ apiEndpoint = "/api/analytics/promo-usage" }) {
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
            console.error('Error fetching promo analytics:', err);
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
                totalOrders: 0,
                totalRevenue: 0,
                effectiveness: 0,
                activePromos: 0,
            };
        }
        return {
            totalOrders: summary.totalPromoOrders || 0,
            totalRevenue: summary.totalPromoRevenue || 0,
            effectiveness: Math.round(summary.averageEffectiveness || 0),
            activePromos: summary.totalPromosAnalyzed || 0,
        };
    }, [data]);

    const lineChartData = useMemo(() => {
        if (!filteredData.length) return [];

        const dateMap = new Map();
        filteredData.forEach((item) => {
            const date = new Date(item.createdAt || Date.now());
            const dateStr = date.toISOString().split('T')[0];

            const existing = dateMap.get(dateStr) || { date: dateStr, usage: 0, revenue: 0 };
            dateMap.set(dateStr, {
                date: dateStr,
                usage: existing.usage + (item.usageCount || 0),
                revenue: existing.revenue + (item.totalRevenue || 0),
            });
        });

        return Array.from(dateMap.values()).sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );
    }, [filteredData]);

    const typeBarData = useMemo(() => {
        if (!filteredData.length) return [];

        const typeMap = new Map();
        filteredData.forEach((item) => {
            const type = item.type || item.promoType || "Other";
            typeMap.set(type, (typeMap.get(type) || 0) + (item.usageCount || 0));
        });

        return Array.from(typeMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredData]);

    const performancePieData = useMemo(() => {
        const breakdown = data?.insights?.performanceBreakdown;
        if (!breakdown) return [];

        return Object.entries(breakdown)
            .filter(([_, value]) => value > 0)
            .map(([key, value]) => ({
                name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                value,
            }));
    }, [data]);

    const topPromosList = useMemo(() => {
        if (!filteredData.length) return [];

        return [...filteredData]
            .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
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
        rows.push(["Promo Analytics Summary"]);
        rows.push([]);
        rows.push(["KPI", "Value"]);
        rows.push(["Total Orders", kpis.totalOrders]);
        rows.push(["Total Revenue", kpis.totalRevenue]);
        rows.push(["Effectiveness (%)", kpis.effectiveness]);
        rows.push(["Active Promos", kpis.activePromos]);
        rows.push([]);
        rows.push(["Top Promos"]);
        rows.push(["Code", "Usage Count", "Revenue", "Rating"]);

        topPromosList.forEach((promo) => {
            rows.push([
                promo.code || promo.name || "N/A",
                promo.usageCount || 0,
                promo.totalRevenue || 0,
                promo.performanceRating || "N/A",
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
        link.download = `promo-analytics-${today}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading analytics data...</p>
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
            <div className="mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Promo Analytics</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Track and analyze your promotional campaigns
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

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <KpiCard
                        title="Total Orders"
                        value={kpis.totalOrders.toLocaleString()}
                        subtitle={`Last ${rangeDays} days`}
                        icon="🛒"
                    />
                    <KpiCard
                        title="Revenue"
                        value={formatCurrency(kpis.totalRevenue)}
                        subtitle="Total promo revenue"
                        icon="💰"
                    />
                    <KpiCard
                        title="Effectiveness"
                        value={`${kpis.effectiveness}%`}
                        subtitle="Average effectiveness"
                        icon="📈"
                    />
                    <KpiCard
                        title="Active Promos"
                        value={kpis.activePromos.toLocaleString()}
                        subtitle="Currently tracked"
                        icon="🎫"
                    />
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="col-span-2 bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">
                            Promo Performance Over Time
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
                                            dataKey="usage"
                                            stroke="#4f46e5"
                                            strokeWidth={3}
                                            name="Usage Count"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyState message="No performance data available for this period" />
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Promo Types</h3>
                        {typeBarData.length > 0 ? (
                            <div style={{ width: "100%", height: 260 }}>
                                <ResponsiveContainer>
                                    <BarChart data={typeBarData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis type="number" style={{ fontSize: 12 }} />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={100}
                                            style={{ fontSize: 12 }}
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
                            <EmptyState message="No promo type data available" />
                        )}
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm col-span-2">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">
                            Performance Breakdown
                        </h3>
                        {performancePieData.length > 0 ? (
                            <div className="flex gap-6 items-center">
                                <div style={{ width: 280, height: 240 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={performancePieData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={90}
                                                label
                                            >
                                                {performancePieData.map((entry, index) => (
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
                                        {performancePieData.map((item, idx) => (
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
                                                    {item.value} promos
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <EmptyState message="No performance breakdown available" />
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Top Promos</h3>

                        {data?.insights?.recommendations && data.insights.recommendations.length > 0 && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="text-sm font-semibold text-blue-900 mb-2">
                                    💡 Insights
                                </div>
                                <ul className="text-xs text-blue-800 space-y-1">
                                    {data.insights.recommendations.slice(0, 2).map((rec, i) => (
                                        <li key={i} className="leading-relaxed">• {rec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {topPromosList.length > 0 ? (
                            <div className="space-y-3">
                                {topPromosList.map((promo, idx) => (
                                    <div
                                        key={promo._id || promo.code || idx}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="font-semibold text-gray-900 text-sm">
                                                {promo.code || promo.name || "N/A"}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {promo.performanceRating || "Not rated"}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-indigo-600 text-lg">
                                                {promo.usageCount || 0}
                                            </div>
                                            <div className="text-xs text-gray-500">used</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="No promo data available" small />
                        )}
                    </div>
                </div>
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