import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
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

export default function EventDashboard() {
    const [data, setData] = useState({ events: [], sessions: [] });
    const [rangeDays, setRangeDays] = useState(30); // last N days
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Ganti URL ini dengan endpoint API milikmu
                const res = await axios.get("/api/event-analytics");
                setData(res.data);
            } catch (err) {
                console.error("Error fetching event data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter last N days
    const filteredEvents = useMemo(() => {
        const cutoff = subDays(new Date(), rangeDays - 1);
        return (data.events || []).filter((d) => parseISO(d.date) >= cutoff);
    }, [data, rangeDays]);

    // KPI aggregations
    const kpis = useMemo(() => {
        const registrations = filteredEvents.reduce((s, r) => s + (r.registrations || 0), 0);
        const checkins = filteredEvents.reduce((s, r) => s + (r.checkins || 0), 0);
        const revenue = filteredEvents.reduce((s, r) => s + (r.revenue || 0), 0);
        const conversion = registrations === 0 ? 0 : Math.round((checkins / registrations) * 100);
        return { registrations, checkins, revenue, conversion };
    }, [filteredEvents]);

    // Line chart data
    const lineData = useMemo(() => {
        const arr = [...filteredEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
        return arr.map((d) => ({ date: format(parseISO(d.date), "yyyy-MM-dd"), registrations: d.registrations || 0, checkins: d.checkins || 0 }));
    }, [filteredEvents]);

    // Bar chart: ticket type aggregation
    const ticketTypeData = useMemo(() => {
        const map = new Map();
        (filteredEvents || []).forEach((d) => {
            const t = d.ticketType || "General";
            map.set(t, (map.get(t) || 0) + (d.ticketCount || d.registrations || 0));
        });
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [filteredEvents]);

    // Pie: acquisition/source
    const sourceData = useMemo(() => {
        const map = new Map();
        (filteredEvents || []).forEach((d) => {
            const s = d.source || "unknown";
            map.set(s, (map.get(s) || 0) + (d.registrations || 0));
        });
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [filteredEvents]);

    // Top sessions
    const topSessions = useMemo(() => {
        const sessions = data.sessions || [];
        return [...sessions].sort((a, b) => b.attendees - a.attendees).slice(0, 6);
    }, [data]);

    function downloadCSV() {
        const rows = [];
        rows.push(["KPI", "Value"]);
        rows.push(["Registrations", kpis.registrations]);
        rows.push(["Check-ins", kpis.checkins]);
        rows.push(["Revenue", kpis.revenue]);
        rows.push(["Conversion (%)", kpis.conversion]);
        rows.push([]);
        rows.push(["Top Sessions"]);
        rows.push(["Session", "Attendees"]);
        topSessions.forEach((s) => rows.push([s.name, s.attendees]));

        const csv = rows.map((r) => r.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `event-summary-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    if (loading) {
        return <div className="p-6 text-center">Loading event data...</div>;
    }

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Event Analytics Dashboard</h2>
                <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-600 mr-2">Range:</div>
                    {[7, 14, 30, 90].map((d) => (
                        <button
                            key={d}
                            onClick={() => setRangeDays(d)}
                            className={`px-3 py-1 rounded-md text-sm border ${rangeDays === d ? "bg-indigo-600 text-white border-indigo-700" : "bg-white text-gray-700"}`}
                        >
                            {d}d
                        </button>
                    ))}
                    <button onClick={downloadCSV} className="ml-3 px-3 py-1 text-sm rounded bg-green-600 text-white">Export CSV</button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KpiCard title="Registrations" value={kpis.registrations} subtitle={`Last ${rangeDays} days`} />
                <KpiCard title="Check-ins" value={kpis.checkins} subtitle={`Last ${rangeDays} days`} />
                <KpiCard title="Revenue" value={formatCurrency(kpis.revenue)} subtitle={`Est. revenue`} />
                <KpiCard title="Conversion" value={`${kpis.conversion}%`} subtitle="Check-ins / Registrations" />
            </div>

            {/* Charts and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-2 bg-white p-4 rounded shadow-sm">
                    <h3 className="text-lg font-medium mb-3">Registrations Over Time</h3>
                    <div style={{ width: "100%", height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={lineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tickFormatter={(d) => format(parseISO(d), "MM-dd")} />
                                <YAxis />
                                <Tooltip labelFormatter={(l) => `Date: ${l}`} />
                                <Legend />
                                <Line type="monotone" dataKey="registrations" stroke="#4f46e5" strokeWidth={2} dot={{ r: 2 }} />
                                <Line type="monotone" dataKey="checkins" stroke="#06b6d4" strokeWidth={2} dot={{ r: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-4 rounded shadow-sm">
                    <h3 className="text-lg font-medium mb-3">Ticket Types</h3>
                    <div style={{ width: "100%", height: 240 }}>
                        <ResponsiveContainer>
                            <BarChart data={ticketTypeData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 40 }}>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="bg-white p-4 rounded shadow-sm col-span-2">
                    <h3 className="text-lg font-medium mb-3">Acquisition Source</h3>
                    <div className="flex gap-4 items-center">
                        <div style={{ width: 260, height: 220 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={sourceData} dataKey="value" nameKey="name" outerRadius={80} label={(entry) => `${entry.name} (${entry.value})`}>
                                        {sourceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                                            <span style={{ width: 12, height: 12, background: COLORS[i % COLORS.length], display: "inline-block", borderRadius: 3 }} />
                                            <span className="capitalize">{s.name}</span>
                                        </div>
                                        <div className="text-sm text-gray-600">{s.value}</div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded shadow-sm">
                    <h3 className="text-lg font-medium mb-3">Top Sessions</h3>
                    <div className="space-y-3">
                        {topSessions.map((s) => (
                            <div key={s.name} className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{s.name}</div>
                                    <div className="text-xs text-gray-500">{s.speaker || "-"}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold">{s.attendees}</div>
                                    <div className="text-xs text-gray-500">attendees</div>
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
        <div className="bg-white p-4 rounded shadow-sm flex flex-col justify-between">
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
