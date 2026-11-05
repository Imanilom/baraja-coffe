import React, { useMemo, useState } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from "recharts";
import { format, subDays } from "date-fns";
import Header from "../admin/header";
import { Link } from "react-router-dom";
import { FaDownload, FaPlus } from "react-icons/fa";
import AnalyticsTabs from "./analyticsTabs";

/**
 * AnalyticsDashboard
 * - Line: omzet / total per day
 * - Bar: jumlah transaksi per product (top N)
 * - Pie: persentase sales by category
 *
 * Props: optional `data` to override mock data
 */

const COLORS = ["#16a34a", "#10b981", "#06b6d4", "#f97316", "#ef4444", "#6366f1"];

const makeMockDaily = (days = 14) => {
    const arr = [];
    for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const label = format(date, "dd-MMM");
        const orders = Math.floor(Math.random() * 80) + 10;
        const revenue = Math.round((Math.random() * 500 + 100) * orders);
        arr.push({ date: label, orders, revenue });
    }
    return arr;
};

const makeMockProducts = (count = 6) => {
    const products = [
        "Almond Croissant",
        "Cappuccino",
        "Blueberry Muffin",
        "Latte",
        "Chocolate Cake",
        "Iced Tea",
    ];
    return products.slice(0, count).map((name, i) => ({
        name,
        sold: Math.floor(Math.random() * 400) + 20,
        revenue: Math.floor(Math.random() * 10000) + 200,
        category: i % 2 === 0 ? "Makanan" : "Minuman",
    }));
};

const AnalyticsDashboard = ({ dailyData = null, productData = null }) => {
    // states for demo filters
    const [daysRange, setDaysRange] = useState(14);
    const [topN, setTopN] = useState(5);
    const [showOnlyManualStock, setShowOnlyManualStock] = useState(false); // example toggle

    const daily = useMemo(() => (dailyData ? dailyData : makeMockDaily(daysRange)), [dailyData, daysRange]);
    const productsFull = useMemo(() => (productData ? productData : makeMockProducts(8)), [productData]);

    // Top N products by sold
    const topProducts = useMemo(() => {
        return [...productsFull].sort((a, b) => b.sold - a.sold).slice(0, topN);
    }, [productsFull, topN]);

    // Pie data by category
    const pieData = useMemo(() => {
        const map = {};
        productsFull.forEach((p) => {
            map[p.category] = (map[p.category] || 0) + p.revenue;
        });
        return Object.keys(map).map((k) => ({ name: k, value: map[k] }));
    }, [productsFull]);

    // Derived metrics
    const totalRevenue = daily.reduce((s, d) => s + d.revenue, 0);
    const totalOrders = daily.reduce((s, d) => s + d.orders, 0);

    return (
        <div className="flex flex-col">

            <div className="flex justify-between items-center px-6 py-3 my-3">
                <h1 className="items-center text-xl text-green-900 font-semibold">
                    Analisis Resto
                    <p className="text-sm text-gray-500 mt-1">Overview</p>
                </h1>
            </div>

            <div className="px-6">
                <AnalyticsTabs />
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
