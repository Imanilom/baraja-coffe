import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function TotalOrder({ data }) {
    // Kelompokkan berdasarkan kategori
    const foodTotal = data
        ?.filter((item) => item.category === "makanan")
        .reduce((acc, cur) => acc + cur.value, 0) ?? 0;

    const drinkTotal = data
        ?.filter((item) => item.category === "minuman")
        .reduce((acc, cur) => acc + cur.value, 0) ?? 0;

    const total = foodTotal + drinkTotal;

    // Chart data
    const chartData = [
        { name: "Makanan", value: foodTotal },
        { name: "Minuman", value: drinkTotal },
        { name: "Empty", value: total > 0 ? 0 : 100 }, // abu-abu penuh kalau kosong
    ];

    const COLORS = Array.from({ length: 5 }, (_, i) => {
        const lightness = 20 + i * 10; // start lebih gelap (20%), tambah terang 10% tiap step
        return `hsl(161, 100%, ${lightness}%)`;
    });

    return (
        <div className="bg-white p-4 rounded-xl border-t-4 border-green-900 shadow w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700">Penjualan</h3>
            </div>

            {/* Chart */}
            <div className="relative h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"          // taruh di tengah
                            startAngle={90}   // mulai dari atas
                            endAngle={-270}   // putar penuh searah jarum jam
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {chartData.map((entry, i) => (
                                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Angka Tengah */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <p className="text-lg font-bold text-gray-800">Rp{total.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total Penjualan</p>
                </div>
            </div>

            {/* Footer Info */}
            <div className="flex justify-between mt-3 text-xs">
                <div className="flex flex-col items-center">
                    <span className="text-gray-700 font-medium">● Makanan</span>
                    <span className="text-green-600">
                        {foodTotal > 0 ? `${((foodTotal / total) * 100).toFixed(1)}%` : "0%"}
                    </span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-gray-700 font-medium">● Minuman</span>
                    <span className="text-green-600">
                        {drinkTotal > 0 ? `${((drinkTotal / total) * 100).toFixed(1)}%` : "0%"}
                    </span>
                </div>
            </div>
        </div>
    );
}
