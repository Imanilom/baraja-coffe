import React from 'react';
import { Link } from 'react-router-dom';
import { 
    FaChevronRight, 
    FaBook, 
    FaShoppingBag, 
    FaStore, 
    FaFileInvoiceDollar, 
    FaSignal, 
    FaTag, 
    FaClock, 
    FaTabletAlt, 
    FaAddressCard, 
    FaWallet, 
    FaLayerGroup, 
    FaExchangeAlt 
} from "react-icons/fa";

const salesMenuItems = [
    { to: "/admin/summary", icon: FaBook, label: "Ringkasan" },
    { to: "/admin/transaction-sales", icon: FaFileInvoiceDollar, label: "Data Transaksi Penjualan" },
    { to: "/admin/product-sales", icon: FaShoppingBag, label: "Penjualan Produk" },
    { to: "/admin/outlet-sales", icon: FaStore, label: "Penjualan Per Outlet" },
    { to: "/admin/daily-sales", icon: FaSignal, label: "Penjualan Harian" },
    { to: "/admin/hourly-sales", icon: FaClock, label: "Penjualan Per Jam" },
    { to: "/admin/category-sales", icon: FaTag, label: "Penjualan Per Kategori" },
    { to: "/admin/device-sales", icon: FaTabletAlt, label: "Penjualan Per Perangkat" },
    { to: "/admin/customer-sales", icon: FaAddressCard, label: "Penjualan Per Pelanggan" },
    { to: "/admin/payment-method-sales", icon: FaWallet, label: "Metode Pembayaran" },
    { to: "/admin/type-sales", icon: FaLayerGroup, label: "Tipe Penjualan" },
    { to: "/admin/type-transaction", icon: FaExchangeAlt, label: "Status Transaksi" },
];

const SalesMenu = () => {
    return (
        <div className="min-h-screen bg-transparent p-6">
            {/* Header / Breadcrumb */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="flex gap-2 items-center text-2xl text-primary font-bold">
                    <span className="opacity-60 font-medium">Laporan</span>
                    <FaChevronRight className="text-primary/30 text-xs mt-1" />
                    <span>Laporan Penjualan</span>
                </h1>
            </div>

            <div className="w-full max-w-7xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {salesMenuItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={index}
                                to={item.to}
                                className="group relative flex flex-col p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-500 overflow-hidden"
                            >
                                {/* Decorative Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                
                                <div className="relative z-10 flex items-center space-x-4">
                                    <div className="p-4 rounded-xl bg-gray-50 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner group-hover:shadow-lg group-hover:shadow-primary/20">
                                        <Icon size={24} />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="font-semibold text-gray-800 group-hover:text-primary transition-colors text-lg">
                                            {item.label}
                                        </h2>
                                        <span className="text-xs text-gray-400 group-hover:text-primary/60 transition-colors">
                                            Lihat detail laporan
                                        </span>
                                    </div>
                                </div>

                                {/* Hover Indicator */}
                                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-500 text-primary">
                                    <FaChevronRight size={14} />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SalesMenu;
