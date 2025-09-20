import { Link } from "react-router-dom";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

const formatRupiah = (amount) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);

const CardItem = ({ title, icon, percentage, amount, isPositive, average, value, route }) => {
    return (
        <>
            {/* <Link className="w-full bg-white border py-[25px] px-[30px] cursor-pointer" to={route}>
                <div className="flex flex-col justify-between h-full">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-[14px] font-semibold text-gray-500">{title}</span>
                            {icon}
                        </div>

                        <p className={`text-sm mt-2 flex items-center space-x-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
                            {isPositive ? <FaArrowUp /> : <FaArrowDown />}
                            <span>
                                {percentage} (
                                {title === "Transaksi" ? amount : formatRupiah(amount)}
                                ) Dibanding Kemarin
                            </span>
                        </p>

                        <div className="flex justify-between mt-4 text-sm text-gray-600">
                            <div>
                                {title === "Penjualan" && (
                                    <>
                                        <p>Rata-rata</p>
                                        <p className="font-medium text-gray-500">{average}</p>
                                    </>
                                )}
                            </div>
                            <div className="text-right text-[20px]">
                                <p>{value}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 text-gray-500 mt-[13px] pt-[20px] border-t-[1px]">
                        <span>Selengkapnya</span>
                    </div>
                </div>
            </Link> */}
            <Link
                to={route}
                className="w-full bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer"
            >
                <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-2">
                        {/* Icon */}
                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 text-green-900">
                            {icon}
                        </div>

                        {/* Title */}
                        <span className="text-sm text-gray-500 font-medium">{title}</span>
                    </div>

                    {/* Value */}
                    <h2 className="text-2xl font-bold text-gray-900">{value}</h2>

                    {/* Percentage + Subtitle */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className={`flex items-center gap-1 font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
                            {isPositive ? <FaArrowUp /> : <FaArrowDown />}
                            {percentage} (
                            {title === "Transaksi" ? amount : formatRupiah(amount)}
                            ) Dibanding Kemarin
                        </span>
                    </div>
                </div>
            </Link>
        </>
    );
};

export default CardItem;
