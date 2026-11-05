import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

const ActivityLineChart = ({ logs = [], loading = false }) => {
    // === Buat semua jam dari 00:00 sampai 23:00 ===
    const hours = Array.from({ length: 24 }, (_, i) =>
        `${String(i).padStart(2, "0")}:00`
    );

    // Hitung login/logout per jam
    const hourlyData = logs.reduce((acc, item) => {
        const date = new Date(item.createdAt);
        const hour = `${String(date.getHours()).padStart(2, "0")}:00`;

        const existing = acc.find((d) => d.time === hour);
        if (existing) {
            if (item.action === "LOGIN") {
                existing.login += 1;
            } else if (item.action === "LOGOUT") {
                existing.logout += 1;
            }
        } else {
            acc.push({
                time: hour,
                login: item.action === "LOGIN" ? 1 : 0,
                logout: item.action === "LOGOUT" ? 1 : 0,
            });
        }
        return acc;
    }, []);

    // Gabungkan semua jam supaya tetap muncul meskipun kosong
    const combinedData = hours.map((h) => {
        const found = hourlyData.find((d) => d.time === h);
        return found || { time: h, login: 0, logout: 0 };
    });

    return (
        <div className="p-6">
            <div className="w-full h-80">
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <ResponsiveContainer>
                        <LineChart data={combinedData}>
                            <defs>
                                <linearGradient id="colorLogin" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorLogout" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F44336" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#F44336" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" interval={1} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />

                            <Line
                                type="monotone"
                                dataKey="login"
                                stroke="#4CAF50"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                                fill="url(#colorLogin)"
                            />
                            <Line
                                type="monotone"
                                dataKey="logout"
                                stroke="#F44336"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                                fill="url(#colorLogout)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default ActivityLineChart;
