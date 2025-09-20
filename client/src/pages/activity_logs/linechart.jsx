// import React, { useEffect, useState } from "react";
// import {
//     LineChart,
//     Line,
//     XAxis,
//     YAxis,
//     CartesianGrid,
//     Tooltip,
//     ResponsiveContainer,
// } from "recharts";

// const ActivityLineChart = () => {
//     const [logs, setLogs] = useState([]);

//     const fetchLogs = async () => {
//         try {
//             const res = await fetch("/api/logs");
//             const data = await res.json();
//             if (data.success) {
//                 setLogs(data.data || []);
//             }
//         } catch (error) {
//             console.error("Error fetching logs:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchLogs();
//     }, []);

//     // Data chart login
//     const loginData = logs
//         .filter((item) => item.action === "LOGIN")
//         .map((item) => ({
//             time: new Date(item.createdAt).toLocaleTimeString("id-ID", {
//                 hour: "2-digit",
//                 minute: "2-digit",
//             }),
//             count: 1,
//         }));

//     // Data chart logout
//     const logoutData = logs
//         .filter((item) => item.action === "LOGOUT")
//         .map((item) => ({
//             time: new Date(item.createdAt).toLocaleTimeString("id-ID", {
//                 hour: "2-digit",
//                 minute: "2-digit",
//             }),
//             count: 1,
//         }));

//     return (
//         <div className="p-6">

//             {/* Chart Login */}
//             <h2 className="text-lg font-bold mb-4">Login Activity</h2>
//             <div className="w-full h-64 mb-10">
//                 <ResponsiveContainer>
//                     <LineChart data={loginData}>
//                         <CartesianGrid strokeDasharray="3 3" />
//                         <XAxis dataKey="time" />
//                         <YAxis allowDecimals={false} />
//                         <Tooltip />
//                         <Line type="monotone" dataKey="count" stroke="#4CAF50" />
//                     </LineChart>
//                 </ResponsiveContainer>
//             </div>

//             {/* Chart Logout */}
//             <h2 className="text-lg font-bold mb-4">Logout Activity</h2>
//             <div className="w-full h-64">
//                 <ResponsiveContainer>
//                     <LineChart data={logoutData}>
//                         <CartesianGrid strokeDasharray="3 3" />
//                         <XAxis dataKey="time" />
//                         <YAxis allowDecimals={false} />
//                         <Tooltip />
//                         <Line type="monotone" dataKey="count" stroke="#F44336" />
//                     </LineChart>
//                 </ResponsiveContainer>
//             </div>
//         </div>
//     );
// };

// export default ActivityLineChart;

import React, { useEffect, useState } from "react";
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

const ActivityLineChart = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            let page = 1;
            let allLogs = [];
            let hasMore = true;

            while (hasMore) {
                const res = await fetch(`/api/logs?page=${page}&limit=10`);
                const data = await res.json();

                if (data.success) {
                    allLogs = [...allLogs, ...data.data];
                    page++;
                    hasMore = page <= data.pagination.totalPages;
                } else {
                    hasMore = false;
                }
            }

            setLogs(allLogs);
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchLogs();
    }, []);

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

    // Gabungkan semua jam dengan data supaya tetap ada walau kosong
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
