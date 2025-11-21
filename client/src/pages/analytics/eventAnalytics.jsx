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

/*
EventDashboard.jsx
- Single-file React component for an event analytics dashboard
- Styling uses Tailwind CSS (assumes Tailwind is installed in your project)
- Charts use Recharts (install with `npm i recharts`)
- date-fns used for date formatting (install with `npm i date-fns`)

Features included:
- KPI cards (Registrations, Check-ins, Revenue, Conversion)
- Date range quick buttons and custom range state (you can hook this to a date picker)
- Line chart for registrations over time
- Bar chart for ticket sales per ticket type
- Pie chart for attendee acquisition/source
- Top sessions table
- Export CSV button for the currently visible summary
- Responsive layout

How to use:
- Import and render <EventDashboard data={yourEventData} />
- Data format (example provided in `sampleData` inside the component):
  data = {
    events: [
      { date: '2025-09-01', registrations: 12, checkins: 3, revenue: 120000, source: 'organic', ticketType: 'General' },
      ...
    ],
    sessions: [ { name: 'Opening Keynote', attendees: 120 }, ... ]
  }
- Or remove the sampleData and fetch from your API
*/

const COLORS = ["#4f46e5", "#06b6d4", "#ef4444", "#f59e0b", "#10b981", "#7c3aed"];

export default function EventAnalytics({ data: externalData = null }) {
    // If externalData is null, use generated sample data to demo
    const [data, setData] = useState(externalData || generateSampleData());
    const [rangeDays, setRangeDays] = useState(30); // last N days
    const [groupBy, setGroupBy] = useState("day"); // day | week | month (used for aggregation)

    useEffect(() => {
        if (externalData) setData(externalData);
    }, [externalData]);

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

    // Line chart data (registrations over time)
    const lineData = useMemo(() => {
        // make sure dates are sorted ascending
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
        // Basic CSV of KPIs and top sessions
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

    return (
        <div className="relative">
            <div className="flex items-center justify-end mb-4">
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
                        {topSessions.map((s, idx) => (
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

function generateSampleData() {
    // generate 45 days of sample event data
    const days = 45;
    const today = new Date();
    const events = [];
    const sources = ["organic", "ads", "partner", "email", "referral"];
    const ticketTypes = ["General", "VIP", "Student", "Workshop"];
    for (let i = days - 1; i >= 0; i--) {
        const d = subDays(today, i);
        const iso = d.toISOString().slice(0, 10);
        const registrations = Math.max(0, Math.round(20 + Math.sin(i / 3) * 10 + Math.random() * 10));
        const checkins = Math.round(registrations * (0.2 + Math.random() * 0.7));
        const revenue = registrations * (50000 + Math.round(Math.random() * 200000));
        events.push({ date: iso, registrations, checkins, revenue, source: sources[i % sources.length], ticketType: ticketTypes[i % ticketTypes.length], ticketCount: registrations });
    }

    const sessions = [
        { name: "Opening Keynote", speaker: "Host A", attendees: 340 },
        { name: "Workshop: React Best Practices", speaker: "Speaker B", attendees: 180 },
        { name: "Panel: Startup Growth", speaker: "Speaker C", attendees: 220 },
        { name: "Closing", speaker: "Host D", attendees: 150 },
        { name: "Breakout: Design", speaker: "Speaker E", attendees: 90 },
    ];

    return { events, sessions };
}
