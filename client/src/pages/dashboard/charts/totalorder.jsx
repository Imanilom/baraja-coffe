import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function TotalOrder({ data }) {
    // Kelompokkan berdasarkan kategori
    const foodTotal = data
        ?.filter((item) => item.category === "makanan" || item.name === "makanan")
        .reduce((acc, cur) => acc + (cur.value || cur.total_sales || cur.subtotal || 0), 0) ?? 0;

    const drinkTotal = data
        ?.filter((item) => item.category === "minuman" || item.name === "minuman")
        .reduce((acc, cur) => acc + (cur.value || cur.total_sales || cur.subtotal || 0), 0) ?? 0;

    const total = foodTotal + drinkTotal;

    // Chart data
    const chartData = [
        { name: "Makanan", value: foodTotal },
        { name: "Minuman", value: drinkTotal }
    ].filter(item => item.value > 0);

    if (chartData.length === 0) chartData.push({ name: "No Data", value: 1 });

    const COLORS = ["#005429", "#34d399"];

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-black text-gray-800 tracking-tighter">Kategori</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Proporsi Menu Terlaris</p>
                </div>
            </div>

            {/* Chart */}
            <div className="relative h-56 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((entry, i) => (
                                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} cornerRadius={10} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Angka Tengah */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-xl font-black text-gray-800 tracking-tighter">
                        Rp {Math.round(total / 1000)}k
                    </p>
                </div>
            </div>

            {/* Legend - Sleek Design */}
            <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-white/40 p-3 rounded-2xl border border-white/60">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-[#005429] rounded-full"></div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Makanan</span>
                    </div>
                    <p className="text-sm font-black text-gray-700">
                        {total > 0 ? `${((foodTotal / total) * 100).toFixed(1)}%` : "0%"}
                    </p>
                </div>
                <div className="bg-white/40 p-3 rounded-2xl border border-white/60">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-[#34d399] rounded-full"></div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Minuman</span>
                    </div>
                    <p className="text-sm font-black text-gray-700">
                        {total > 0 ? `${((drinkTotal / total) * 100).toFixed(1)}%` : "0%"}
                    </p>
                </div>
            </div>
        </div>
    );
}
