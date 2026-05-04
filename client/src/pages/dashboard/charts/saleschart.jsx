import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const formatRupiah = (amount) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-4 rounded-2xl shadow-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-lg font-black text-[#005429]">
                    {formatRupiah(payload[0].value || payload[0].payload.sales || payload[0].payload.total_sales || 0)}
                </p>
                <div className="mt-2 pt-2 border-t border-gray-100/20">
                    <span className="text-[10px] font-bold text-emerald-600 block">Total Penjualan Kotor</span>
                </div>
            </div>
        );
    }
    return null;
};

export default function SalesChart({ data }) {
    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 mb-8">
                <div>
                    <h3 className="font-black text-xl lg:text-2xl text-slate-800 tracking-tight font-['Outfit',sans-serif]">Tren Penjualan Per Jam</h3>
                    <p className="text-xs text-slate-500 font-medium tracking-tight mt-1">Pergerakan transaksi tunai & non-tunai hari ini</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#005429]/5 border border-[#005429]/10 rounded-full">
                        <div className="w-2.5 h-2.5 bg-[#005429] rounded-full"></div>
                        <span className="text-[10px] font-bold text-[#005429] uppercase tracking-widest">Subtotal</span>
                    </div>
                </div>
            </div>

            <div className="w-full h-[350px]">
                {data && data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                        >
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#005429" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#005429" stopOpacity={0.01} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.3} />

                            <XAxis
                                dataKey={(item) => item.hour || item.time || item.jam || item.label || item.date || ''}
                                tick={{ fontSize: 11, fill: "#1e293b", fontWeight: 900 }}
                                axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                                tickLine={{ stroke: '#e2e8f0' }}
                                dy={10}
                                height={60}
                                interval="preserveStartEnd"
                                tickFormatter={(value) => {
                                    if (typeof value === 'number') return `${String(value).padStart(2, '0')}:00`;
                                    if (typeof value === 'string' && value.length > 10) return value.substring(11, 16); // Extract HH:mm from ISO
                                    if (typeof value === 'object' && value !== null) return ''; // Prevent rendering objects
                                    return value;
                                }}
                            />

                            <YAxis
                                tickFormatter={(value) => `Rp ${value / 1000}k`}
                                tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 700 }}
                                axisLine={false}
                                tickLine={false}
                                dx={-10}
                            />

                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#005429', strokeWidth: 1, strokeDasharray: '5 5' }} />

                            <Area
                                type="monotone"
                                dataKey={(item) => item.sales || item.total_sales || item.subtotal || item.total || 0}
                                stroke="#005429"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorSales)"
                                animationDuration={2000}
                                dot={false}
                                activeDot={{
                                    r: 6,
                                    fill: "#005429",
                                    stroke: "#fff",
                                    strokeWidth: 3,
                                    shadowBlur: 10,
                                    shadowColor: "rgba(0,0,0,0.1)"
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 opacity-50">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <p className="text-sm font-black uppercase tracking-widest">Data Tidak Tersedia</p>
                    </div>
                )}
            </div>
        </div>
    );
}

