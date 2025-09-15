import { FaCheckSquare } from "react-icons/fa";

export default function FoodChart({ data }) {
    // Hitung total untuk persen
    const total = data.reduce((acc, cur) => acc + cur.value, 0);

    return (

        <div className="">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <h3 className="font-semibold">Penjualan Makanan Teratas</h3>
            </div>

            <div className="bg-white p-4 rounded-lg shadow w-full">

                {/* Data */}
                {data && data.length > 0 ? (
                    <div className="space-y-4">
                        {data.map((item, i) => {
                            const percent = ((item.value / total) * 100).toFixed(1);
                            return (
                                <div key={i}>
                                    {/* Label */}
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-700">
                                            {item.name} - {item.value.toLocaleString()}
                                        </span>
                                        <span className="text-gray-500">{percent}%</span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-200 h-2 rounded">
                                        <div
                                            className="h-2 rounded bg-green-900"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex justify-center items-center h-[150px] space-x-2">
                        <FaCheckSquare size={20} className="text-green-900" />
                        <span className="text-gray-500">Tidak ada data</span>
                    </div>
                )}
            </div>
        </div>
    );
}
