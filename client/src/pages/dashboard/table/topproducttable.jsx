import { Link } from "react-router-dom";
import { FaInfo, FaChevronDown, FaArrowRight } from "react-icons/fa";

const formatRupiah = (amount) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);

export default function TopProductTable({ data }) {
    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Penjualan Produk</h3>

                <Link to="/admin/product-sales" className="text-sm text-green-700">
                    <span>Selengkapnya</span>
                </Link>

            </div>
            <div className="w-full mt-6">
                <table className="bg-white min-w-full text-[14px] shadow rounded-lg">
                    <thead className="text-gray-500 border-b">
                        <tr>
                            <th className="py-2 px-[15px] font-semibold text-left">Nama Produk</th>
                            <th className="py-2 px-[15px] font-semibold text-left">Kategori</th>
                            <th className="py-2 px-[15px] font-semibold text-right">Terjual</th>
                            <th className="py-2 px-[15px] font-semibold text-right">Penjualan Kotor</th>
                            <th className="py-2 px-[15px] font-semibold text-right">Diskon Produk</th>
                            <th className="py-2 px-[15px] font-semibold text-right">Total</th>
                        </tr>
                    </thead>
                    {data && data.length > 0 ? (
                        <tbody>
                            {data.map((item, i) => (
                                <tr key={i} className="hover:bg-gray-50 text-gray-500">
                                    <td className="p-[15px]">{item.productName}</td>
                                    <td className="p-[15px]">{item.category || "N/A"}</td>
                                    <td className="p-[15px] text-right">{item.quantity}</td>
                                    <td className="p-[15px] text-right">{formatRupiah(item.subtotal)}</td>
                                    <td className="p-[15px] text-right">{formatRupiah(item.discount)}</td>
                                    <td className="p-[15px] text-right font-semibold">{formatRupiah(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    ) : (
                        <tbody>
                            <tr className="py-6 text-center w-full h-96 text-gray-500">
                                <td colSpan={6}>TIDAK ADA PENJUALAN HARI INI</td>
                            </tr>
                        </tbody>
                    )}
                </table>
            </div>
        </div>
    );
}
