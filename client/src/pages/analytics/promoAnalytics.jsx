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
import { format, parseISO, subDays } from "date-fns";

const COLORS = ["#4f46e5", "#06b6d4", "#ef4444", "#f59e0b", "#10b981", "#7c3aed"];

export default function PromoAnalytics({ data: externalData = null }) {
    const [data, setData] = useState(externalData || generateSampleData());
    const [rangeDays, setRangeDays] = useState(30);

    useEffect(() => {
        if (externalData) setData(externalData);
    }, [externalData]);

    const filteredEvents = useMemo(() => {
        const cutoff = subDays(new Date(), rangeDays - 1);
        return (data.events || []).filter((d) => parseISO(d.date) >= cutoff);
    }, [data, rangeDays]);

    const kpis = useMemo(() => {
        const redeemed = filteredEvents.reduce((s, r) => s + (r.redeemed || 0), 0);
        const clicks = filteredEvents.reduce((s, r) => s + (r.clicks || 0), 0);
        const revenue = filteredEvents.reduce((s, r) => s + (r.revenue || 0), 0);
        const conversion = clicks === 0 ? 0 : Math.round((redeemed / clicks) * 100);
        return { redeemed, clicks, revenue, conversion };
    }, [filteredEvents]);

    const lineData = useMemo(() => {
        return [...filteredEvents]
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((d) => ({
                date: format(parseISO(d.date), "yyyy-MM-dd"),
                redeemed: d.redeemed || 0,
                clicks: d.clicks || 0,
            }));
    }, [filteredEvents]);

    const typeData = useMemo(() => {
        const map = new Map();
        (filteredEvents || []).forEach((d) => {
            const t = d.promoType || "General";
            map.set(t, (map.get(t) || 0) + (d.redeemed || 0));
        });
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [filteredEvents]);

    const sourceData = useMemo(() => {
        const map = new Map();
        (filteredEvents || []).forEach((d) => {
            const s = d.channel || "unknown";
            map.set(s, (map.get(s) || 0) + (d.clicks || 0));
        });
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [filteredEvents]);

    const topPromos = useMemo(() => {
        const promos = data.promos || [];
        return [...promos].sort((a, b) => b.redeemed - a.redeemed).slice(0, 6);
    }, [data]);

    function downloadCSV() {
        const rows = [];
        rows.push(["KPI", "Value"]);
        rows.push(["Redeemed", kpis.redeemed]);
        rows.push(["Revenue", kpis.revenue]);
        rows.push(["Conversion (%)", kpis.conversion]);
        rows.push([]);
        rows.push(["Top Promos"]);
        rows.push(["Promo", "Redeemed"]);
        topPromos.forEach((s) => rows.push([s.name, s.redeemed]));

        const csv = rows.map((r) => r.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `promo-summary-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="relative">
            <div className="flex items-center justify-end mb-4">
                <div className="flex items-center gap-2">
                    {[7, 14, 30, 90].map((d) => (
                        <button
                            key={d}
                            onClick={() => setRangeDays(d)}
                            className={`px-3 py-1 rounded-md text-sm border ${rangeDays === d ? "bg-indigo-600 text-white border-indigo-700" : "bg-white text-gray-700"
                                }`}
                        >
                            {d}d
                        </button>
                    ))}
                    <button onClick={downloadCSV} className="ml-3 px-3 py-1 text-sm rounded bg-green-600 text-white">
                        Export CSV
                    </button>
                </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KpiCard title="Use" value={kpis.redeemed} subtitle={`Last ${rangeDays} days`} />
                <KpiCard title="Revenue" value={formatCurrency(kpis.revenue)} subtitle="Estimated Revenue" />
                <KpiCard title="Conversion" value={`${kpis.conversion}%`} subtitle="Redeemed / Clicks" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-2 bg-white p-4 rounded shadow-sm">
                    <h3 className="text-lg font-medium mb-3">Promo Performance Over Time</h3>
                    <div style={{ width: "100%", height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={lineData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tickFormatter={(d) => format(parseISO(d), "MM-dd")} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="redeemed" stroke="#4f46e5" strokeWidth={2} />
                                {/* <Line type="monotone" dataKey="clicks" stroke="#06b6d4" strokeWidth={2} /> */}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-4 rounded shadow-sm">
                    <h3 className="text-lg font-medium mb-3">Promo Types</h3>
                    <div style={{ width: "100%", height: 240 }}>
                        <ResponsiveContainer>
                            <BarChart data={typeData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" />
                                <Tooltip />
                                <Bar dataKey="value" fill="#7c3aed" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Source + Top Promos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="bg-white p-4 rounded shadow-sm col-span-2">
                    <h3 className="text-lg font-medium mb-3">Acquisition Channels</h3>
                    <div className="flex gap-4 items-center">
                        <div style={{ width: 260, height: 220 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={sourceData} dataKey="value" nameKey="name" outerRadius={80}>
                                        {sourceData.map((entry, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium">Details</h4>
                            <ul className="mt-2 space-y-2">
                                {sourceData.map((s, i) => (
                                    <li key={s.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span
                                                style={{
                                                    width: 12,
                                                    height: 12,
                                                    background: COLORS[i % COLORS.length],
                                                    display: "inline-block",
                                                    borderRadius: 3,
                                                }}
                                            />
                                            <span>{s.name}</span>
                                        </div>
                                        <div className="text-sm text-gray-600">{s.value}</div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded shadow-sm">
                    <h3 className="text-lg font-medium mb-3">Top Promos</h3>
                    <div className="space-y-3">
                        {topPromos.map((p) => (
                            <div key={p.name} className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{p.name}</div>
                                    <div className="text-xs text-gray-500">{p.channel || "-"}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold">{p.redeemed}</div>
                                    <div className="text-xs text-gray-500">redeemed</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ title, value, subtitle }) {
    return (
        <div className="bg-white p-4 rounded shadow-sm">
            <div className="text-xs text-gray-500">{title}</div>
            <div className="text-2xl font-semibold mt-2">{value}</div>
            <div className="text-xs text-gray-400 mt-2">{subtitle}</div>
        </div>
    );
}

function formatCurrency(v) {
    if (typeof v !== "number") return v;
    return v.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
}

function generateSampleData() {
    const days = 45;
    const today = new Date();
    const events = [];
    const channels = ["email", "social", "ads", "referral"];
    const promoTypes = ["Discount", "Cashback", "Free Shipping", "Buy 1 Get 1"];
    for (let i = days - 1; i >= 0; i--) {
        const d = subDays(today, i);
        const iso = d.toISOString().slice(0, 10);
        const clicks = Math.round(50 + Math.random() * 100);
        const redeemed = Math.round(clicks * (0.2 + Math.random() * 0.5));
        const revenue = redeemed * (50000 + Math.round(Math.random() * 100000));
        events.push({ date: iso, clicks, redeemed, revenue, channel: channels[i % channels.length], promoType: promoTypes[i % promoTypes.length] });
    }
    const promos = [
        { name: "Diskon 50%", channel: "email", redeemed: 120 },
        { name: "Cashback 20%", channel: "social", redeemed: 80 },
        { name: "Gratis Ongkir", channel: "ads", redeemed: 95 },
        { name: "Buy 1 Get 1", channel: "referral", redeemed: 60 },
    ];
    return { events, promos };
}
