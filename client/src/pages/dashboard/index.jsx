import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Datepicker from 'react-tailwindcss-datepicker';
import {
    FaBell,
    FaUser,
    FaPoll,
    FaChartBar,
    FaShoppingCart,
    FaArrowRight,
    FaInfo,
    FaChevronDown,
    FaWallet,
} from "react-icons/fa";

import {
    AreaChart,
    Area,
    PieChart,
    Pie,
    Sector,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

const data = [
    { time: "08:00", sales: 200000 },
    { time: "09:00", sales: 450000 },
    { time: "10:00", sales: 300000 },
    { time: "11:00", sales: 500000 },
    { time: "12:00", sales: 420000 },
    { time: "13:00", sales: 600000 },
    { time: "14:00", sales: 480000 },
];


const COLORS = ["#4f46e5", "#22c55e", "#f59e0b"];

// Contoh data produk
const dataPie = [
    { name: "Produk A", value: 3200000 },
    { name: "Produk B", value: 1500000 },
    { name: "Produk C", value: 500000 },
];

const dataProduct = [
    {
        namaProduk: 'Produk A',
        kategori: 'Elektronik',
        terjual: 150,
        penjualanKotor: 3000000,
        diskon: 150000,
    },
    {
        namaProduk: 'Produk B',
        kategori: 'Fashion',
        terjual: 80,
        penjualanKotor: 1200000,
        diskon: 60000,
    },
    {
        namaProduk: 'Produk C',
        kategori: 'Makanan',
        terjual: 200,
        penjualanKotor: 4000000,
        diskon: 200000,
    },
];

const formatRupiah = (number) => {
    return 'Rp' + number.toLocaleString('id-ID');
};

const cardsData = [
    {
        title: "PENJUALAN",
        icon: <FaShoppingCart size={40} className="text-gray-500" />,
        percentage: "-99.80%",
        amount: "-Rp. 20.600.408",
        average: "33.000",
        value: "33.000",
    },
    {
        title: "TRANSAKSI",
        icon: <FaChartBar size={40} className="text-gray-500" />,
        percentage: "-99.80%",
        amount: "-Rp. 20.600.408",
        average: "33.000",
        value: "33.000",
    },
    {
        title: "LABA KOTOR",
        icon: <FaChartBar size={40} className="text-gray-500" />,
        percentage: "-99.80%",
        amount: "-Rp. 20.600.408",
        average: "33.000",
        value: "33.000",
    },
];

const CardItem = ({ title, icon, percentage, amount, average, value }) => (
    <div className="bg-white border py-[25px] px-[30px] cursor-pointer">
        <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-gray-500">{title}</span>
            {icon}
        </div>
        <p className="text-sm text-red-500 mt-2">
            {percentage} ({amount}) Dibanding Kemarin
        </p>
        <div className="flex justify-between mt-4 text-sm text-gray-600">
            <div>
                <p>Rata-rata</p>
                <p className="font-medium text-gray-500">{average}</p>
            </div>
            <div className="text-right text-[20px]">
                <p>{value}</p>
            </div>
        </div>
        <div className="justify-end flex items-center space-x-2 text-gray-500">
            <span className="">
                Selengkapnya
            </span>
            <FaArrowRight />
        </div>
    </div>
);

const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const {
        cx, cy, midAngle, innerRadius, outerRadius,
        startAngle, endAngle, fill, payload, percent, value,
    } = props;

    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            {/* Label di tengah */}
            <text x={cx} y={cy - 10} textAnchor="middle" fill="#333" fontSize={14} fontWeight="bold">
                {payload.name}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="#333" fontSize={12}>
                Rp{value.toLocaleString()}
            </text>

            {/* Bagian Pie dan garis pointer */}
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius}
                startAngle={startAngle} endAngle={endAngle} fill={fill} />
            <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle}
                innerRadius={outerRadius + 6} outerRadius={outerRadius + 10} fill={fill} />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />

            {/* Label di luar */}
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">
                Rp{value.toLocaleString()}
            </text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
                ({(percent * 100).toFixed(2)}%)
            </text>
        </g>
    );
};

const Dashboard = () => {
    const [activeIndex, setActiveIndex] = useState(0);

    const handlePieEnter = (_, index) => {
        setActiveIndex(index);
    };
    const [currentPage, setCurrentPage] = useState(1);
    const [isCreating, setIsCreating] = useState(false);
    const itemsPerPage = 50; // Jumlah voucher per halaman

    const [filters, setFilters] = useState({
        date: {
            startDate: null,
            endDate: null,
        },
        outlet: "",
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleDateRangeChange = (value) => {
        setFilters((prev) => ({
            ...prev,
            date: value, // { startDate, endDate }
        }));
    };

    // Show loading state
    // if (loading) {
    //     return (
    //         <div className="flex justify-center items-center h-screen">
    //             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
    //         </div>
    //     );
    // }

    // // Show error state
    // if (error) {
    //     return (
    //         <div className="flex justify-center items-center h-screen">
    //             <div className="text-red-500 text-center">
    //                 <p className="text-xl font-semibold mb-2">Error</p>
    //                 <p>{error}</p>
    //                 <button
    //                     onClick={() => window.location.reload()}
    //                     className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
    //                 >
    //                     Refresh
    //                 </button>
    //             </div>
    //         </div>
    //     );
    // }

    return (
        <div className="max-w-8xl mx-auto">
            {/* Header */}
            <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
                <FaBell size={23} className="text-gray-400" />
                <span className="text-[14px]">Hi Baraja</span>
                <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
                    <FaUser size={30} />
                </Link>
            </div>

            {/* Breadcrumb */}
            <div className="px-3 py-2 flex justify-between items-center border-b">
                <div className="flex items-center space-x-2">
                    <FaPoll size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Dashboard</p>
                </div>
                <Link
                    to="/admin/voucher-create"
                    className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                >
                    Tambah Voucher
                </Link>
            </div>
            <div className="px-[15px] pb-[15px] mb-[50px]">
                {/* Filters */}
                <div className="">
                    <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-2 gap-[10px] items-end rounded bg-slate-50 shadow-slate-200 shadow-md">
                        <div className="relative">
                            <label className="text-[13px] mb-1 text-gray-500">Outlet :</label>
                            <select
                                name="outlet"
                                // value={filters.outlet}
                                // onChange={handleFilterChange}
                                className="w-full text-[13px] text-gray-500 border py-[6px] pr-[25px] pl-[12px] rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]"
                            >
                                <option value="">All Outlets</option>
                                {/* {Array.from(new Set(promos.map((p) => p.outlet?._id))).map((outletId) => {
                                const outlet = promos.find((p) => p.outlet?._id === outletId)?.outlet;
                                return (
                                    <option key={outletId} value={outletId}>
                                        {outlet?.name || "Unknown"}
                                    </option>
                                );
                            })} */}
                                <option value="brj">Baraja Amphiteather</option>
                            </select>
                        </div>
                        <div className="relative">
                            <label className="text-[13px] mb-1 text-gray-500">Tanggal :</label>
                            <Datepicker
                                showFooter
                                showShortcuts
                                // value={filters.date}
                                // onChange={handleDateRangeChange}
                                displayFormat="DD-MM-YYYY"
                                inputClassName="w-full text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded cursor-pointer"
                                popoverDirection="down"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white">
                    <div className="flex justify-evenly mt-6 space-x-10">
                        {cardsData.map((card, index) => (
                            <CardItem key={index} {...card} />
                        ))}
                    </div>

                    <div className="py-[25px] px-[30px] w-full h-[535px] mt-6 border">
                        <div className="flex justify-between items-center py-[10px]">
                            <span className="text-[14px] font-semibold text-gray-500">GRAFIK PENJUALAN</span>
                            <FaChevronDown className="text-lg font-semibold text-gray-500" />
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value) => `Rp${value.toLocaleString()}`} />
                                <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="w-full h-96 max-w-3xl mx-auto">
                        <div className="flex space-x-2 items-center">
                            <span className="text-[14px] font-semibold text-gray-500">PENJUALAN PRODUK DENGAN NOMINAL TERTINGGI</span>
                            <span className="p-1 rounded-full border text-gray-500"><FaInfo size={10} /></span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    activeIndex={activeIndex}
                                    activeShape={renderActiveShape}
                                    data={dataPie}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    onMouseEnter={handlePieEnter}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-full h-96 max-w-3xl mx-auto">
                        <div className="flex space-x-2 items-center">
                            <span className="text-[14px] font-semibold text-gray-500">PENJUALAN KATEGORI TERTINGGI</span>
                            <span className="p-1 rounded-full border text-gray-500"><FaInfo size={10} /></span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    activeIndex={activeIndex}
                                    activeShape={renderActiveShape}
                                    data={dataPie}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    onMouseEnter={handlePieEnter}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="w-full py-[25px] px-[30px] border">
                        <div className="flex justify-between">
                            <div className="flex space-x-2 items-center">
                                <span className="text-[14px] font-semibold text-gray-500">PENJUALAN PRODUK TERTINGGI</span>
                                <span className="p-1 rounded-full border text-gray-500"><FaInfo size={10} /></span>
                            </div>
                            <FaChevronDown className="text-lg font-semibold text-gray-500" />
                        </div>
                        <table className="min-w-full text-[14px] shadow-slate-200 shadow-md">
                            <thead className="text-gray-500">
                                <tr>
                                    <th className="py-[21px] px-[15px] font-normal text-left">Nama Produk</th>
                                    <th className="py-[21px] px-[15px] font-normal text-left">Kategori</th>
                                    <th className="py-[21px] px-[15px] font-normal text-right">Terjual</th>
                                    <th className="py-[21px] px-[15px] font-normal text-right">Penjualan Kotor</th>
                                    <th className="py-[21px] px-[15px] font-normal text-right">Diskon Produk</th>
                                    <th className="py-[21px] px-[15px] font-normal text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataProduct.map((item, i) => {
                                    const total = item.penjualanKotor - item.diskon;
                                    return (
                                        <tr key={i} className="hover:bg-gray-50 text-gray-500">
                                            <td className="p-[15px]">{item.namaProduk}</td>
                                            <td className="p-[15px]">{item.kategori}</td>
                                            <td className="p-[15px] text-right">{item.terjual}</td>
                                            <td className="p-[15px] text-right">{formatRupiah(item.penjualanKotor)}</td>
                                            <td className="p-[15px] text-right">{formatRupiah(item.diskon)}</td>
                                            <td className="p-[15px] text-right font-semibold">{formatRupiah(total)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="flex justify-end items-center space-x-2 border-t mt-[20px] pt-[20px] text-gray-500">
                            <span>Selengkapnya</span>
                            <FaArrowRight />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 mt-4">
                    <div className="min-h-[400px] bg-white border py-[25px] px-[30px] flex flex-col justify-between cursor-pointer">
                        <div className="flex items-center justify-between">
                            <div className="flex space-x-2 items-center">
                                <h2 className="text-[14px] font-semibold text-gray-500">METODE PEMBAYARAN</h2>
                                <span className="p-1 rounded-full border text-gray-500"><FaInfo size={10} /></span>
                            </div>
                            <FaWallet size={40} className="text-gray-500" />
                        </div>
                        <div className="flex justify-between mt-4 text-sm text-gray-600">

                        </div>
                        <div className="justify-end flex items-center space-x-2 text-gray-500">
                            <span className="">
                                Selengkapnya
                            </span>
                            <FaArrowRight />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-green-500"></div>
            </div>
        </div>
    );
};

export default Dashboard;
