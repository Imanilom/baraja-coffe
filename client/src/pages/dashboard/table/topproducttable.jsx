import { Link } from "react-router-dom";
import { FaInfo, FaChevronDown, FaArrowRight, FaShoppingCart } from "react-icons/fa";

const formatRupiah = (amount) => {
    const num = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(num);
};

export default function TopProductTable({ data }) {
    // Ambil hanya 5 data teratas
    const topFiveData = data && data.length > 0 ? data.slice(0, 5) : [];

    return (
        <div className="w-full">
            <div className="overflow-x-auto">
                <table className="min-w-full text-[13px]">
                    <thead className="text-gray-400 border-b border-gray-100/50">
                        <tr>
                            <th className="py-2.5 px-5 font-black text-left uppercase tracking-widest text-[9px]">Produk</th>
                            <th className="py-2.5 px-5 font-black text-left uppercase tracking-widest text-[9px]">Kategori</th>
                            <th className="py-2.5 px-5 font-black text-right uppercase tracking-widest text-[9px]">Terjual</th>
                            <th className="py-2.5 px-5 font-black text-right uppercase tracking-widest text-[9px]">Total (Nett)</th>
                        </tr>
                    </thead>
                    {topFiveData.length > 0 ? (
                        <tbody className="divide-y divide-gray-50/50">
                            {topFiveData.map((item, i) => (
                                <tr key={i} className="hover:bg-white/40 transition-colors group">
                                    <td className="py-2.5 px-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-700 group-hover:text-[#005429] transition-colors">{item.productName || item.product_name || item.name}</span>
                                            <span className="text-[9px] text-gray-400 font-medium uppercase tracking-tight">PKR-{i + 100}</span>
                                        </div>
                                    </td>
                                    <td className="py-2.5 px-5">
                                        <span className="inline-block px-2 py-0.5 bg-green-50 text-[#005429] text-[9px] font-black rounded text-[9px] uppercase tracking-tight">
                                            {item.category || "General"}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-5 text-right font-bold text-gray-600">
                                        {item.quantity || item.total_qty || item.qty || 0}
                                    </td>
                                    <td className="py-2.5 px-5 text-right">
                                        <span className="font-bold text-[#005429]">
                                            {formatRupiah(item.total || item.total_revenue || item.revenue || item.subtotal || 0)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    ) : (
                        <tbody>
                            <tr className="text-center h-64">
                                <td colSpan={4}>
                                    <div className="flex flex-col items-center justify-center space-y-2 opacity-30">
                                        <FaShoppingCart size={40} className="text-gray-400" />
                                        <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Belum Ada Penjualan</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    )}
                </table>
            </div>

            <div className="p-4 bg-gray-50/30 border-t border-gray-100/50 flex justify-center">
                <Link to="/admin/product-sales" className="flex items-center gap-2 text-[10px] font-black text-[#005429] uppercase tracking-widest hover:gap-4 transition-all group">
                    Lihat Laporan Lengkap <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
