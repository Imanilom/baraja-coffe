import React, { useEffect, useState, useMemo } from "react";
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
    FaArrowDown,
    FaArrowUp,
    FaCheckSquare
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
import DashboardModal from "./modal";

const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const getTodayRange = () => {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0)); // jam 00:00:00
    const end = new Date(today.setHours(23, 59, 59, 999)); // jam 23:59:59
    return { startDate: start, endDate: end };
};


const Dashboard = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [active2Index, set2ActiveIndex] = useState(0);
    const [productSales, setProductSales] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const handleSave = (selectedWidgets) => {
        console.log("Widgets terpilih:", selectedWidgets);
        setIsModalOpen(false);
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [isCreating, setIsCreating] = useState(false);
    const itemsPerPage = 5;

    const [filters, setFilters] = useState({
        date: getTodayRange(),
        outlet: "",
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // fetch productSales data
                const productsResponse = await axios.get('/api/orders');

                // ensure productSales in array
                const productsData = Array.isArray(productsResponse.data) ?
                    productsResponse.data :
                    (productsResponse.data && Array.isArray(productsResponse.data.data)) ?
                        productsResponse.data.data : [];

                setProductSales(productsData);
                setFilteredData(productsData); // Initialize filtered data with all products

                // Fetch outlets data
                const outletsResponse = await axios.get('/api/outlet');

                // Ensure outletsResponse.data is an array
                const outletsData = Array.isArray(outletsResponse.data) ?
                    outletsResponse.data :
                    (outletsResponse.data && Array.isArray(outletsResponse.data.data)) ?
                        outletsResponse.data.data : [];

                setOutlets(outletsData);
                setError(null);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load data. Please try again later.");
                // Set empty arrays as fallback
                setProductSales([]);
                setOutlets([]);
                setFilteredData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handlePieEnter = (_, index) => {
        setActiveIndex(index);
    };

    const handle2PieEnter = (_, index) => {
        set2ActiveIndex(index);
    };

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({ ...filters, [name]: value });
    };

    const handleDateRangeChange = (value) => {
        if (!value || !value.startDate || !value.endDate) return;

        const { startDate, endDate } = value;

        // Atur startDate ke jam 00:00:00
        const adjustedStart = new Date(startDate);
        adjustedStart.setHours(0, 0, 0, 0);

        // Atur endDate ke jam 23:59:59
        const adjustedEnd = new Date(endDate);
        adjustedEnd.setHours(23, 59, 59, 999);

        setFilters((prev) => ({
            ...prev,
            date: {
                startDate: adjustedStart,
                endDate: adjustedEnd,
            },
        }));
    };

    // Apply filters
    useEffect(() => {
        let filtered = productSales;

        // Filter by date
        if (filters.date.startDate && filters.date.endDate) {
            const start = new Date(filters.date.startDate);
            const end = new Date(filters.date.endDate);

            filtered = filtered.filter((product) => {
                const transactionDate = new Date(product.createdAt); // atau sesuaikan field-nya
                return transactionDate >= start && transactionDate <= end;
            });
        }

        if (filters.outlet) {
            filtered = filtered.filter((product) => product.outlet?._id === filters.outlet);
        }

        setFilteredData(filtered);
    }, [filters, productSales]);

    const groupProducts = (data) => {
        const grouped = {};
        data.forEach(product => {
            const item = product?.items?.[0];
            if (!item) return;

            const productName = item.menuItem?.name || "Unknown";
            const category = item.menuItem?.category || "Uncategorized";
            const sku = item.menuItem?.sku || "-";
            const quantity = Number(item?.quantity) || 0;
            const subtotal = Number(item?.subtotal) || 0;
            const discount = Number(item?.discount) || 0;

            if (!grouped[productName]) {
                grouped[productName] = {
                    productName,
                    category,
                    sku,
                    quantity: 0,
                    discount: 0,
                    subtotal: 0,
                    total: 0,
                };
            }

            grouped[productName].quantity += quantity;
            grouped[productName].discount += discount;
            grouped[productName].subtotal += subtotal;
            grouped[productName].total += subtotal + discount;
        });

        return Object.values(grouped);
    };

    // Hitung range sebelumnya (banding)
    const previousRange = useMemo(() => {
        if (!filters.date?.startDate || !filters.date?.endDate) return null;

        const { startDate, endDate } = filters.date;
        const diffTime = endDate.getTime() - startDate.getTime();
        const prevEnd = new Date(startDate.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - diffTime);
        prevStart.setHours(0, 0, 0, 0);
        prevEnd.setHours(23, 59, 59, 999);

        return { startDate: prevStart, endDate: prevEnd };
    }, [filters.date]);

    // Filter data untuk range sebelumnya
    const filteredPreviousRange = useMemo(() => {
        if (!previousRange) return [];

        return productSales.filter((p) => {
            const date = new Date(p.createdAt);
            return date >= previousRange.startDate && date <= previousRange.endDate;
        });
    }, [productSales, previousRange]);

    // Grouped data untuk current range
    const groupedCurrent = useMemo(() => groupProducts(filteredData), [filteredData]);

    // Grouped data untuk previous range
    const groupedPrevious = useMemo(() => groupProducts(filteredPreviousRange), [filteredPreviousRange]);

    // Hitung grand total untuk current range
    const grandTotalCurrent = useMemo(() => {
        return groupedCurrent.reduce(
            (acc, item) => {
                acc.quantity += item.quantity;
                acc.subtotal += item.subtotal;
                acc.total += item.total;
                return acc;
            },
            { quantity: 0, subtotal: 0, total: 0 }
        );
    }, [groupedCurrent]);

    // Hitung grand total untuk previous range
    const grandTotalPrevious = useMemo(() => {
        return groupedPrevious.reduce(
            (acc, item) => {
                acc.quantity += item.quantity;
                acc.subtotal += item.subtotal;
                acc.total += item.total;
                return acc;
            },
            { quantity: 0, subtotal: 0, total: 0 }
        );
    }, [groupedPrevious]);

    // Data untuk card hari ini (current range)
    const todayData = {
        penjualan: grandTotalCurrent.total,
        transaksi: grandTotalCurrent.quantity,
        labaKotor: grandTotalCurrent.subtotal,
    };

    // Data untuk card kemarin (previous range)
    const yesterdayData = {
        penjualan: grandTotalPrevious.total,
        transaksi: grandTotalPrevious.quantity,
        labaKotor: grandTotalPrevious.subtotal,
    };

    // Hitung perbandingan untuk tiap kategori
    const penjualanComp = calculateComparison(todayData.penjualan, yesterdayData.penjualan);
    const transaksiComp = calculateComparison(todayData.transaksi, yesterdayData.transaksi);
    const labaKotorComp = calculateComparison(todayData.labaKotor, yesterdayData.labaKotor);

    const cardsData = [
        {
            title: "PENJUALAN",
            icon: <FaShoppingCart size={40} className="text-gray-500" />,
            percentage: penjualanComp.percentage,
            amount: penjualanComp.amount,
            isPositive: penjualanComp.isPositive,
            average: formatRupiah((todayData.penjualan + yesterdayData.penjualan) / 2),
            value: formatRupiah(todayData.penjualan),
            route: "/admin/transaction-sales",
        },
        {
            title: "TRANSAKSI",
            icon: <FaChartBar size={40} className="text-gray-500" />,
            percentage: transaksiComp.percentage,
            amount: transaksiComp.amount,
            isPositive: transaksiComp.isPositive,
            average: Math.round((todayData.transaksi + yesterdayData.transaksi) / 2),
            value: todayData.transaksi,
            route: "/admin/daily-sales",
        },
        {
            title: "LABA KOTOR",
            icon: <FaChartBar size={40} className="text-gray-500" />,
            percentage: labaKotorComp.percentage,
            amount: labaKotorComp.amount,
            isPositive: labaKotorComp.isPositive,
            average: formatRupiah((todayData.labaKotor + yesterdayData.labaKotor) / 2),
            value: formatRupiah(todayData.labaKotor),
            route: "/admin/daily-profit",
        },
    ];

    // Hitung persentase perubahan dan beda nilai
    function calculateComparison(today, yesterday) {
        const diff = today - yesterday;
        const isPositive = diff >= 0;

        let percentage = "0.00%";
        if (yesterday === 0) {
            percentage = today === 0 ? "0.00%" : "100.00%";
        } else {
            percentage = `${((Math.abs(diff) / yesterday) * 100).toFixed(2)}%`;
        }

        return {
            percentage: isPositive ? `+${percentage}` : `-${percentage}`,
            amount: Math.abs(diff),
            isPositive,
        };
    }

    const CardItem = ({ title, icon, percentage, amount, average, value, route, isPositive }) => (
        <Link className="w-full bg-white border py-[25px] px-[30px] cursor-pointer" to={route}>
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
                            {title === "TRANSAKSI" ? amount : formatRupiah(amount)}
                            ) Dibanding Kemarin
                        </span>
                    </p>

                    <div className="flex justify-between mt-4 text-sm text-gray-600">
                        <div>
                            {title === "PENJUALAN" && (
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
                    <FaArrowRight />
                </div>
            </div>
        </Link>
    );

    const dataSales = groupedCurrent.map((item) => ({
        name: item.productName,
        value: item.subtotal, // ganti '120000' dengan nilai aktual, misalnya 'item.total'
    }));

    const category = Object.values(
        groupedCurrent.reduce((acc, item) => {
            const { category, quantity } = item;

            if (!acc[category]) {
                acc[category] = {
                    name: category,
                    value: 0,
                };
            }

            acc[category].value += quantity; // jumlahkan total per kategori
            return acc;
        }, {})
    );

    const dataCategory = category.map((item) => ({
        name: item.name,
        value: item.value, // ganti '120000' dengan nilai aktual, misalnya 'item.total'
    }));

    const renderActiveShape = (props) => {
        const {
            cx, cy, innerRadius, outerRadius,
            startAngle, endAngle, fill, payload, value,
        } = props;

        const RADIAN = Math.PI / 180;

        const arcRadius = innerRadius - 5;
        const start = {
            x: cx + arcRadius * Math.cos(-startAngle * RADIAN),
            y: cy + arcRadius * Math.sin(-startAngle * RADIAN),
        };
        const end = {
            x: cx + arcRadius * Math.cos(-endAngle * RADIAN),
            y: cy + arcRadius * Math.sin(-endAngle * RADIAN),
        };

        const arcPath = `
        M ${start.x} ${start.y}
        A ${arcRadius} ${arcRadius} 0 ${endAngle - startAngle > 180 ? 1 : 0} 0 ${end.x} ${end.y}
    `;

        return (
            <g>
                {/* Label */}
                <text x={cx} y={cy - 10} textAnchor="middle" fill="#333" fontSize={14} fontWeight="bold">
                    {payload.name}
                </text>
                <text x={cx} y={cy + 10} textAnchor="middle" fill="#333" fontSize={12}>
                    Rp{value.toLocaleString()}
                </text>

                {/* Sektor aktif dengan scale */}
                <g>
                    <Sector
                        cx={cx}
                        cy={cy}
                        innerRadius={innerRadius}
                        outerRadius={outerRadius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        fill={fill}
                    />
                </g>

                {/* Garis melingkar */}
                <path
                    d={arcPath}
                    stroke="#333"
                    strokeWidth={2}
                    fill="none"
                />
            </g>
        );
    };

    const render2ActiveShape = (props) => {
        const {
            cx, cy, innerRadius, outerRadius,
            startAngle, endAngle, fill, payload, value,
        } = props;

        const RADIAN = Math.PI / 180;

        const arcRadius = innerRadius - 5;
        const start = {
            x: cx + arcRadius * Math.cos(-startAngle * RADIAN),
            y: cy + arcRadius * Math.sin(-startAngle * RADIAN),
        };
        const end = {
            x: cx + arcRadius * Math.cos(-endAngle * RADIAN),
            y: cy + arcRadius * Math.sin(-endAngle * RADIAN),
        };

        const arcPath = `
        M ${start.x} ${start.y}
        A ${arcRadius} ${arcRadius} 0 ${endAngle - startAngle > 180 ? 1 : 0} 0 ${end.x} ${end.y}
    `;

        return (
            <g>
                {/* Label */}
                <text x={cx} y={cy - 10} textAnchor="middle" fill="#333" fontSize={14} fontWeight="bold">
                    {payload.name}
                </text>
                <text x={cx} y={cy + 10} textAnchor="middle" fill="#333" fontSize={12}>
                    {value.toLocaleString()}
                </text>

                {/* Sektor aktif dengan scale */}
                <g>
                    <Sector
                        cx={cx}
                        cy={cy}
                        innerRadius={innerRadius}
                        outerRadius={outerRadius}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        fill={fill}
                    />
                </g>

                {/* Garis melingkar */}
                <path
                    d={arcPath}
                    stroke="#333"
                    strokeWidth={2}
                    fill="none"
                />
            </g>
        );
    };


    const groupedByHour = useMemo(() => {
        const grouped = {};

        // 1. Generate semua jam
        const allHours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
        allHours.forEach(hour => {
            grouped[hour] = {
                time: hour,
                subtotal: 0,
            };
        });

        // 2. Group berdasarkan jam dari createdAt
        filteredData.forEach(product => {
            const item = product?.items?.[0];
            if (!item) return;

            const subtotal = Number(item?.subtotal) || 0;

            const date = new Date(product.createdAt);
            const hour = date.getHours().toString().padStart(2, '0');
            const time = `${hour}:00`;

            if (grouped[time]) {
                grouped[time].subtotal += subtotal;
            }
        });

        // 3. Kembalikan array terurut
        return Object.values(grouped);
    }, [filteredData]);

    const groupedPaymnet = useMemo(() => {
        const grouped = {};

        filteredData.forEach(product => {
            const item = product?.items?.[0];
            if (!item) return;

            const paymentMethod = product?.paymentMethod || '';
            const subtotal = Number(item?.subtotal) || 0;

            const key = `${paymentMethod}`; // unique key per produk

            if (!grouped[key]) {
                grouped[key] = {
                    paymentMethod,
                    subtotal: 0
                };
            }

            grouped[key].subtotal += subtotal;

        });

        return Object.values(grouped);
    }, [filteredData]);

    // Show loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

    // // Show error state
    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

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
                {/* <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                >
                    Atur Dashboard
                </button> */}
            </div>
            <DashboardModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSave}
            />
            <div className="px-[15px] pb-[15px] mb-[60px]">
                {/* Filters */}
                <div className="">
                    <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-2 gap-[10px] items-end rounded bg-slate-50 shadow-slate-200 shadow-md">
                        <div className="relative">
                            <label className="text-[13px] mb-1 text-gray-500">Outlet :</label>
                            <select
                                name="outlet"
                                value={filters.outlet}
                                onChange={handleFilterChange}
                                className="w-full text-[13px] text-gray-500 border py-[6px] pr-[25px] pl-[12px] rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]"
                            >
                                <option value="">Semua Outlet</option>
                                {outlets.map((outlet) => (
                                    <option key={outlet._id} value={outlet._id}>
                                        {outlet.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="relative">
                            <label className="text-[13px] mb-1 text-gray-500">Tanggal :</label>
                            <Datepicker
                                showFooter
                                showShortcuts
                                value={filters.date}
                                onChange={handleDateRangeChange}
                                displayFormat="DD-MM-YYYY"
                                inputClassName="w-full text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded cursor-pointer"
                                popoverDirection="down"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white">
                    <div className="flex justify-evenly mt-6 space-x-10 w-full">
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
                            <AreaChart data={groupedByHour} margin={{ top: 10, right: 20, left: 20, bottom: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis tickFormatter={(value) => formatRupiah(value)}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip formatter={(value) => `Rp${value.toLocaleString('id-ID')}`} />
                                <Area type="monotone" dataKey="subtotal" stroke="#005429" fill="#005400" strokeWidth={2} />
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
                        {dataSales && dataSales.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        activeIndex={activeIndex}
                                        activeShape={renderActiveShape}
                                        data={dataSales}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#005429"
                                        dataKey="value"
                                        onMouseEnter={handlePieEnter}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex justify-center items-center space-x-2 h-full">
                                <FaCheckSquare size={20} className="text-[#005429]" />
                                <span className="text-gray-500">Tidak ada data</span>
                            </div>
                        )}
                    </div>
                    <div className="w-full h-96 max-w-3xl mx-auto">
                        <div className="flex space-x-2 items-center">
                            <span className="text-[14px] font-semibold text-gray-500">PENJUALAN KATEGORI TERTINGGI</span>
                            <span className="p-1 rounded-full border text-gray-500"><FaInfo size={10} /></span>
                        </div>
                        {dataCategory && dataCategory.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        activeIndex={active2Index}
                                        activeShape={render2ActiveShape}
                                        data={dataCategory}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#005429"
                                        dataKey="value"
                                        onMouseEnter={handle2PieEnter}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex justify-center items-center h-full space-x-2">
                                <FaCheckSquare size={20} className="text-[#005429]" />
                                <span className="text-gray-500">Tidak ada data</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4">
                    <Link to="/admin/product-sales">
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
                                {groupedCurrent.length > 0 ? (

                                    <tbody>
                                        {groupedCurrent.map((item, i) => {
                                            return (
                                                <tr key={i} className="hover:bg-gray-50 text-gray-500">
                                                    <td className="p-[15px]">{item.productName}</td>
                                                    <td className="p-[15px]">{Array.isArray(item.category) ? item.category.join(', ') : 'N/A'}</td>
                                                    <td className="p-[15px] text-right">{item.quantity}</td>
                                                    <td className="p-[15px] text-right">{formatRupiah(item.subtotal)}</td>
                                                    <td className="p-[15px] text-right">{formatRupiah(item.discount)}</td>
                                                    <td className="p-[15px] text-right font-semibold">{formatRupiah(item.total)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                ) : (
                                    <tbody>
                                        <tr className="py-6 text-center w-full h-96 text-gray-500">
                                            <td colSpan={6}>TIDAK ADA PENJUALAN HARI INI</td>
                                        </tr>
                                    </tbody>
                                )}
                            </table>
                            <div className="flex justify-end items-center space-x-2 border-t mt-[20px] pt-[20px] text-gray-500">
                                <span>Selengkapnya</span>
                                <FaArrowRight />
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="grid grid-cols-2 mt-4">
                    <Link className="h-[400px] bg-white border py-[25px] px-[30px] flex flex-col justify-between cursor-pointer" to="/admin/payment-method-sales">
                        <div className="flex items-center justify-between">
                            <div className="flex space-x-2 items-center">
                                <h2 className="text-[14px] font-semibold text-gray-500">METODE PEMBAYARAN</h2>
                                <span className="p-1 rounded-full border text-gray-500"><FaInfo size={10} /></span>
                            </div>
                            <FaWallet size={40} className="text-gray-500" />
                        </div>
                        <div className="mt-4 text-sm text-gray-600 h-full">
                            {groupedPaymnet.length > 0 ? (
                                <div className="">
                                    {groupedPaymnet.map((item, i) => {
                                        return (
                                            <div className="flex justify-between" key={i}>
                                                <span className="p-[15px]">{item.paymentMethod}</span>
                                                <span className="p-[15px]">{formatRupiah(item.subtotal)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex justify-center items-center h-full space-x-2">
                                    <FaCheckSquare size={20} className="text-[#005429]" />
                                    <span className="text-gray-500">Tidak ada data</span>
                                </div>
                            )}
                        </div>
                        <div className="justify-end flex items-center space-x-2 text-gray-500">
                            <span className="">
                                Selengkapnya
                            </span>
                            <FaArrowRight />
                        </div>
                    </Link>
                </div>
            </div>

            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]">
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
