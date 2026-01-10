import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const formatRupiah = (amount) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);

export default function SalesChart({ data }) {
    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Grafik Penjualan</h3>
            </div>
            <div className="w-full mt-6 bg-white p-4 rounded-lg shadow">
                {/* Chart responsive */}
                <ResponsiveContainer width="100%" aspect={2}>
                    <AreaChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="time"
                            tick={{ fontSize: 12, fill: "#6b7280" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tickFormatter={(value) => formatRupiah(value)}
                            tick={{ fontSize: 12, fill: "#6b7280" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "white",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                fontSize: "12px",
                                color: "#374151",
                            }}
                            formatter={(value) => formatRupiah(value)}
                        />

                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#005429" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#005429" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>

                        <Area
                            type="monotone"
                            dataKey="subtotal"
                            stroke="#005429"
                            fill="url(#colorSales)"
                            strokeWidth={2}
                            dot={{ r: 3, strokeWidth: 1, fill: "#fff" }}
                            activeDot={{ r: 5, strokeWidth: 2, fill: "#005429" }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
