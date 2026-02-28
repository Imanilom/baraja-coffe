import { Link } from "react-router-dom";
import { FaInfo, FaWallet, FaArrowRight, FaCheckSquare } from "react-icons/fa";

const formatRupiah = (amount) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);

export default function PaymentMethod({ data }) {
    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex space-x-2 items-center">
                    <h2 className="font-semibold">Pembayaran</h2>
                </div>
                <Link to="/admin/payment-method-sales" className="text-sm text-green-700">Selengkapnya</Link>
            </div>
            <div
                className="h-72 bg-white shadow border-t-4 border-green-900 py-2 px-1 flex flex-col justify-between cursor-pointer rounded-lg"
            >

                <div className=" text-sm text-gray-900">
                    {data && data.length > 0 ? (
                        <div className="overflow-x-auto rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {data.map((item, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-2">{item.paymentMethod}</td>
                                            <td className="px-4 py-2 text-right font-medium">
                                                {formatRupiah(item.subtotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-72 space-x-2">
                            <FaCheckSquare size={20} className="text-green-900" />
                            <span>Tidak ada data</span>
                        </div>
                    )}
                </div>

            </div>
        </>
    );
}
