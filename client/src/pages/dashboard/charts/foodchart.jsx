import { FaCheckSquare } from "react-icons/fa";

export default function FoodChart({ data }) {
    // Hitung total untuk persen
    const total = data.reduce((acc, cur) => acc + (cur.value || cur.total_qty || cur.quantity || 0), 0);

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <div>
                    <h3 className="text-xl font-black text-gray-800 tracking-tighter">Top Makanan</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Terjual Paling Banyak</p>
                </div>
            </div>

            <div className="w-full space-y-6">
                {/* Data */}
                {data && data.length > 0 ? (
                    <div className="space-y-5">
                        {data.map((item, i) => {
                            const val = item.value || item.total_qty || item.quantity || 0;
                            const percent = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                            return (
                                <div key={i} className="group">
                                    {/* Label */}
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-[#005429] uppercase tracking-widest opacity-70 mb-0.5">#{i + 1}</span>
                                            <span className="text-sm font-bold text-gray-700 truncate max-w-[150px]">
                                                {item.name}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-black text-gray-800">{(item.value || item.total_qty || item.quantity || 0).toLocaleString()}</span>
                                            <span className="text-[10px] text-gray-400 font-medium ml-1">({percent}%)</span>
                                        </div>
                                    </div>

                                    {/* Progress Bar - Glassy Design */}
                                    <div className="w-full bg-gray-100/50 h-2.5 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#005429] to-[#34d399] transition-all duration-1000 ease-out shadow-lg group-hover:brightness-110"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col justify-center items-center h-48 space-y-3 bg-white/20 rounded-2xl border border-dashed border-gray-200">
                        <FaCheckSquare size={32} className="text-gray-300" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Belum Ada Data</span>
                    </div>
                )}
            </div>
        </div>
    );
}
