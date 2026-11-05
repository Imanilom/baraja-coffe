import { Link } from "react-router-dom";
import { FaCheckSquare } from "react-icons/fa";

const formatRupiah = (amount) => {
    const num = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(num);
};

export default function TransactionType({ data }) {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-black text-gray-800 tracking-tighter">Tipe Transaksi</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Metode Pengambilan Pesanan</p>
                </div>
            </div>

            <div className="w-full">
                {data && data.length > 0 ? (
                    <div className="overflow-hidden">
                        <table className="min-w-full text-sm">
                            <thead className="text-gray-400 border-b border-gray-100/50">
                                <tr>
                                    <th className="py-3 px-1 font-black text-left uppercase tracking-widest text-[9px]">Tipe</th>
                                    <th className="py-3 px-1 font-black text-center uppercase tracking-widest text-[9px]">Qty</th>
                                    <th className="py-3 px-1 font-black text-right uppercase tracking-widest text-[9px]">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50/50">
                                {data.map((item, i) => (
                                    <tr key={i} className="hover:bg-white/40 transition-colors">
                                        <td className="py-4 px-1">
                                            <span className="font-bold text-gray-700 capitalize">{item.orderType || item.name || item.type}</span>
                                        </td>
                                        <td className="py-4 px-1 text-center font-black text-gray-500">
                                            {item.totalTransaction || item.count || item.qty || 0}
                                        </td>
                                        <td className="py-4 px-1 text-right font-black text-[#005429]">
                                            {formatRupiah(item.subtotal || item.total || item.value || 0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col justify-center items-center h-48 space-y-3 bg-white/20 rounded-2xl border border-dashed border-gray-200">
                        <FaCheckSquare size={32} className="text-gray-300" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Belum Ada Transaksi</span>
                    </div>
                )}
            </div>
        </div>
    );
}
