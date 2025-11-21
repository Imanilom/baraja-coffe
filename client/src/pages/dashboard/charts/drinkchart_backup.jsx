import { useState } from "react";
import { PieChart, Pie, ResponsiveContainer, Cell } from "recharts";
import { FaCheckSquare, FaInfo } from "react-icons/fa";

// Generate 5 variasi dari hijau #005429
const COLORS = Array.from({ length: 5 }, (_, i) => {
    const lightness = 20 + i * 10; // start lebih gelap (20%), tambah terang 10% tiap step
    return `hsl(161, 100%, ${lightness}%)`;
});

export default function DrinkChart({ data }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const handleEnter = (_, index) => setActiveIndex(index);

    // Data aktif (untuk label di tengah)
    const activeItem = data && data.length > 0 ? data[activeIndex] : null;

    // Hitung total untuk persen
    const total = data.reduce((acc, cur) => acc + cur.value, 0);

    return (
        <div className="w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-4 bg-white rounded shadow-sm">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 relative">
                {/* Chart Section */}
                <div className="flex-1 relative w-full">
                    {/* Title */}
                    <div className="flex space-x-2 items-center mb-2">
                        <span className="text-sm md:text-base font-semibold text-gray-600">
                            PENJUALAN MINUMAN TERTINGGI
                        </span>
                        <span className="p-1 rounded-full border text-gray-400">
                            <FaInfo size={10} />
                        </span>
                    </div>

                    {/* Chart */}
                    {data && data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    activeIndex={activeIndex}
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                    onMouseEnter={handleEnter}
                                >
                                    {data.map((_, i) => (
                                        <Cell
                                            key={`cell-${i}`}
                                            fill={COLORS[i % COLORS.length]}
                                            stroke={i === activeIndex ? "#005429" : "none"}
                                            strokeWidth={i === activeIndex ? 2 : 0}
                                            strokeLinejoin="round"
                                            style={{ outline: "none" }}   // 🔥 hapus border kotak saat klik
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex justify-center items-center h-[300px] space-x-2">
                            <FaCheckSquare size={20} className="text-[#005429]" />
                            <span className="text-gray-500">Tidak ada data</span>
                        </div>
                    )}

                    {/* Label di tengah donut */}
                    {activeItem && (
                        <div className="absolute left-[50%] bottom-[-10%] transform -translate-x-1/2 -translate-y-1/2 text-center max-w-[200px]">
                            <p
                                className={`font-semibold text-gray-700 truncate ${activeItem.name.length > 20 ? "text-sm" : "text-base"
                                    }`}
                            >
                                {activeItem.name}
                            </p>
                            <p className="text-lg font-bold">
                                {((activeItem.value / total) * 100).toFixed(0)}% (
                                Rp{activeItem.value.toLocaleString()})
                            </p>
                        </div>
                    )}
                </div>

                {/* Legend Section */}
                {data && data.length > 0 && (
                    <div className="w-full lg:w-80 space-y-2 text-sm">
                        {data.map((item, i) => (
                            <div key={i} className="flex items-center space-x-2">
                                <div
                                    className="w-3 h-3 rounded-sm"
                                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                />
                                <span className="text-gray-700">
                                    {item.name} (Rp{item.value.toLocaleString()})
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

    );
}
