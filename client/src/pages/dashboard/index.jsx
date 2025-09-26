import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Datepicker from 'react-tailwindcss-datepicker';
import {
    FaChartBar,
    FaShoppingCart,
    FaPlus,
} from "react-icons/fa";
import SalesChart from "./charts/saleschart";
import TopProductTable from "./table/topproducttable";
import CardItem from "./cardItem/carditem";
import FoodChart from "./charts/foodchart";
import DrinkChart from "./charts/drinkchart";
import { useSelector } from "react-redux";
import TotalOrder from "./charts/totalorder";
import { Link } from "react-router-dom";
import TransactionType from "./table/transactionType";

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
    const { currentUser } = useSelector((state) => state.user);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productSales, setProductSales] = useState([]);
    const [categories, setCategory] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const handleSave = (selectedWidgets) => {
        setIsModalOpen(false);
    };

    const [filters, setFilters] = useState({
        date: getTodayRange(),
        outlet: "",
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const superAdmin = currentUser.role === 'superadmin';
    const qc = currentUser.role === 'qc';
    const hrd = currentUser.role === 'hrd';
    const admin = currentUser.role === 'admin';
    const inventory = currentUser.role === 'inventory';


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

                const completedData = productsData.filter(item => item.status === "Completed");

                setProductSales(completedData);
                setFilteredData(completedData); // Initialize filtered data with all products

                // Fetch outlets data
                const outletsResponse = await axios.get('/api/outlet');

                // Ensure outletsResponse.data is an array
                const outletsData = Array.isArray(outletsResponse.data) ?
                    outletsResponse.data :
                    (outletsResponse.data && Array.isArray(outletsResponse.data.data)) ?
                        outletsResponse.data.data : [];

                setOutlets(outletsData);

                const categoryResponse = await axios.get('/api/menu/categories');
                const categoryData = categoryResponse.data.data ? categoryResponse.data.data : categoryResponse.data;

                setCategory(categoryData);
                setError(null);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load data. Please try again later.");
                // Set empty arrays as fallback
                setProductSales([]);
                setOutlets([]);
                setCategory([]);
                setFilteredData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
    }, [filters, productSales, categories]);

    const groupProducts = (data) => {
        const grouped = {};
        data.forEach(product => {
            const item = product?.items?.[0];
            if (!item) return;

            const productName = item.menuItem?.name || "Unknown";
            const mainCategory = item.menuItem?.mainCategory || "Unknown";
            const categoryObj = categories.find(cat => cat._id === item.menuItem?.category);
            const category = categoryObj ? categoryObj.name : "Uncategorized";
            const sku = item.menuItem?.sku || "-";
            const quantity = Number(item?.quantity) || 0;
            const subtotal = Number(item?.subtotal) || 0;
            const discount = Number(item?.discount) || 0;

            if (!grouped[productName]) {
                grouped[productName] = {
                    productName,
                    mainCategory,
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

        const g = Object.values(grouped);
        return g;
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
            title: "Penjualan",
            icon: <FaShoppingCart size={21} />,
            percentage: penjualanComp.percentage,
            amount: penjualanComp.amount,
            isPositive: penjualanComp.isPositive,
            average: formatRupiah(todayData.penjualan / todayData.transaksi),
            value: formatRupiah(todayData.penjualan),
            route: "/admin/transaction-sales",
        },
        {
            title: "Transaksi",
            icon: <FaChartBar size={21} />,
            percentage: transaksiComp.percentage,
            amount: transaksiComp.amount,
            isPositive: transaksiComp.isPositive,
            average: Math.round((todayData.transaksi + yesterdayData.transaksi) / 2),
            value: todayData.transaksi,
            route: "/admin/daily-sales",
        },
        {
            title: "Laba Kotor",
            icon: <FaChartBar size={21} />,
            percentage: labaKotorComp.percentage,
            amount: labaKotorComp.amount,
            isPositive: labaKotorComp.isPositive,
            average: formatRupiah((todayData.labaKotor + yesterdayData.labaKotor) / 2),
            value: formatRupiah(todayData.labaKotor),
            route: "/admin/daily-profit",
        },
    ];

    // Filter hanya makanan
    const foodData = useMemo(() => {
        return groupedCurrent.filter((item) => item.mainCategory === "makanan");
    }, [groupedCurrent]);

    // Filter hanya minuman
    const drinkData = useMemo(() => {
        return groupedCurrent.filter((item) => item.mainCategory === "minuman");
    }, [groupedCurrent]);

    // Mapping ke data sales makanan (ambil 5 tertinggi)
    const foodSales = useMemo(() => {
        return foodData
            .sort((a, b) => b.subtotal - a.subtotal) // urut dari terbesar ke kecil
            .slice(0, 5) // ambil top 5
            .map((item) => ({
                name: item.productName,
                value: item.subtotal,
            }));
    }, [foodData]);

    // Mapping ke data sales minuman (ambil 5 tertinggi)
    const drinkSales = useMemo(() => {
        return drinkData
            .sort((a, b) => b.subtotal - a.subtotal)
            .slice(0, 5)
            .map((item) => ({
                name: item.productName,
                value: item.subtotal,
            }));
    }, [drinkData]);

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

    const dataSales = groupedCurrent.map((item) => ({
        name: item.productName,
        category: item.mainCategory,
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

    const groupedType = useMemo(() => {
        const grouped = {};

        filteredData.forEach(product => {
            const item = product?.items?.[0];
            if (!item) return;

            const orderType = product?.orderType || '';
            const subtotal = Number(item?.subtotal) || 0;

            const key = `${orderType}`; // unique key per produk

            if (!grouped[key]) {
                grouped[key] = {
                    orderType,
                    subtotal: 0,
                    totalTransaction: 0, // tambahin field counter
                };
            }

            grouped[key].subtotal += subtotal;
            grouped[key].totalTransaction += 1; // increment tiap transaksi
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
        <div className="min-h-screen">
            {/* Main */}
            <main className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
                {/* Left Section */}
                <div className="lg:col-span-3 space-y-6">

                    {/* Filters */}
                    <div className="">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="relative">
                                <select
                                    name="outlet"
                                    value={filters.outlet}
                                    onChange={handleFilterChange}
                                    className="w-full text-sm md:text-base text-gray-600 border py-2 pr-8 pl-3 appearance-none focus:ring-2 focus:ring-[#005429] focus:outline-none rounded-lg shadow-sm"
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
                                <Datepicker
                                    showFooter
                                    showShortcuts
                                    value={filters.date}
                                    onChange={handleDateRangeChange}
                                    displayFormat="DD-MM-YYYY"
                                    inputClassName="w-full text-sm md:text-base border py-2 pr-8 pl-3 rounded cursor-pointer focus:ring-2 focus:ring-[#005429] focus:outline-none rounded-lg shadow-sm"
                                    popoverDirection="down"
                                />
                            </div>
                        </div>
                    </div>
                    {/* Welcome */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-lg font-semibold text-green-900">Selamat Datang, <span className="capitalize">{currentUser.username}</span></h2>
                        <p className="text-sm text-gray-500">Baraja Coffee</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {cardsData.map((card, i) => (
                            <CardItem key={i} {...card} />
                        ))}
                    </div>

                    {/* Chart */}
                    <SalesChart data={groupedByHour} />

                    {/* Recent Orders */}
                    <TopProductTable data={groupedCurrent} />
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* New Menu Button */}
                    {superAdmin || admin ?
                        <div className="bg-white px-4 py-2 rounded-lg shadow-sm flex justify-between items-center">
                            <h3 className="font-semibold">Menu</h3>
                            <Link to="/admin/menu-create" className="flex items-center gap-1 px-3 py-1 bg-green-900 text-white text-sm rounded">
                                <FaPlus /> Buat
                            </Link>
                        </div> : ""
                    }

                    {/* Today Performance */}
                    {/* <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h3 className="font-semibold mb-2">Today Performance</h3>
                        <p className="text-lg font-bold">$360</p>
                        <p className="text-sm text-gray-500">Today Revenue</p>
                    </div> */}

                    {/* Live Orders */}
                    {/* <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h3 className="font-semibold mb-3">Live Orders</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>Paistudio purchased 1x Choco Chuco Coffee</li>
                            <li>Today at 12:30</li>
                        </ul>
                    </div> */}

                    {/* Top Selling Items */}
                    <TotalOrder data={dataSales} />
                    <FoodChart data={foodSales} />
                    <DrinkChart data={drinkSales} />
                    {/* <PaymentMethod data={groupedPaymnet} /> */}
                    <TransactionType data={groupedType} />
                </div>
            </main>
        </div>

    );
};

export default Dashboard;
