import { Link } from "react-router-dom";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

const formatRupiah = (amount) => {
    const num = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(num);
};

const CardItem = ({ title, icon, percentage, amount, isPositive, value, route }) => {
    return (
        <Link
            to={route}
            className="group relative w-full bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-200/80 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
        >
            {/* Background Decorative Icon */}
            <div className="absolute -bottom-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none">
                <div className="transform scale-[4] rotate-12 text-[#005429]">{icon}</div>
            </div>

            <div className="relative z-10 flex flex-col h-full space-y-5">
                <div className="flex items-start justify-between">
                    {/* Icon Section */}
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-[#005429] shadow-sm group-hover:bg-[#005429] group-hover:text-white transition-all duration-300">
                        {icon}
                    </div>

                    {/* Percentage Pill */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight shadow-sm border ${isPositive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}>
                        {isPositive ? <FaArrowUp size={9} /> : <FaArrowDown size={9} />}
                        {percentage}%
                    </div>
                </div>

                <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1 block">{title}</span>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-[#005429] transition-colors leading-none font-['Outfit',sans-serif]">
                        {value}
                    </h2>
                </div>

                {/* Subtitle with context */}
                <div className="pt-4 mt-auto border-t border-slate-100/80 flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Perbandingan Hari Ini</span>
                    <span className={`text-xs font-bold flex items-center gap-1.5 ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white shadow-sm border border-slate-100">
                           {isPositive ? "+" : "-"}
                        </span>
                        {title === "Transaksi" ? amount : formatRupiah(amount)}
                        <span className="text-slate-400 font-medium text-[10px] uppercase tracking-wider ml-auto">vs Kemarin</span>
                    </span>
                </div>
            </div>

            {/* Subtle Shine Effect on Hover */}
            <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 -translate-x-[150%] group-hover:translate-x-[250%] transition-transform duration-1000 ease-in-out pointer-events-none"></div>
        </Link>
    );
};

export default CardItem;
