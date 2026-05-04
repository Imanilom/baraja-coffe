import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import { Link, useSearchParams } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSearch, FaFileExcel, FaSync } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import Paginated from "../../../../components/paginated";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import useDebounce from "@/hooks/useDebounce";

const ProfitByProductManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { outlets } = useSelector((state) => state.outlet);

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initial state from URL
    const [dateRange, setDateRange] = useState(() => {
        const start = searchParams.get('startDate');
        const end = searchParams.get('endDate');
        return {
            startDate: start ? dayjs(start).toDate() : dayjs().toDate(),
            endDate: end ? dayjs(end).toDate() : dayjs().toDate()
        };
    });
    const [selectedOutlet, setSelectedOutlet] = useState(searchParams.get('outlet') || "");
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page')) || 1);

    const ITEMS_PER_PAGE = 50;

    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: '#d1d5db',
            minHeight: '34px',
            fontSize: '13px',
            color: '#6b7280',
            boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none',
            '&:hover': {
                borderColor: '#9ca3af',
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#6b7280',
        }),
        input: (provided) => ({
            ...provided,
            color: '#6b7280',
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9ca3af',
            fontSize: '13px',
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '13px',
            color: '#374151',
            backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white',
            cursor: 'pointer',
        }),
    };

    const outletOptions = useMemo(() => [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((outlet) => ({
            value: outlet.name,
            label: outlet.name,
        })),
    ], [outlets]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const updateURLParams = useCallback(() => {
        const params = new URLSearchParams();
        if (dateRange.startDate) params.set('startDate', dayjs(dateRange.startDate).format('YYYY-MM-DD'));
        if (dateRange.endDate) params.set('endDate', dayjs(dateRange.endDate).format('YYYY-MM-DD'));
        if (selectedOutlet) params.set('outlet', selectedOutlet);
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (currentPage > 1) params.set('page', currentPage.toString());
        setSearchParams(params, { replace: true });
    }, [dateRange, selectedOutlet, debouncedSearch, currentPage, setSearchParams]);

    useEffect(() => {
        updateURLParams();
    }, [updateURLParams]);

    // Fetch data with parameters
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Ideally should pass dates to API, but for now matching existing behavior
            // if /api/orders supports it. 
            const params = {
                startDate: dayjs(dateRange.startDate).format('YYYY-MM-DD'),
                endDate: dayjs(dateRange.endDate).format('YYYY-MM-DD'),
                mode: 'all'
            };

            const response = await axios.get('/api/report/orders', { params });
            const orderData = Array.isArray(response.data) ?
                response.data :
                (response.data?.data && Array.isArray(response.data.data)) ?
                    response.data.data : [];

            // Filter completed only as per original logic
            setOrders(orderData.filter(item => item.status === "Completed"));
            setError(null);
        } catch (err) {
            console.error("Error fetching orders:", err);
            setError("Gagal memuat data pesanan. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => {
        fetchData();
    };

    // Derived filtered data (items)
    const filteredItems = useMemo(() => {
        let result = [];

        // 1. Filter orders by outlet first (since outlet is at order level in this component's logic)
        let filteredOrders = orders;
        if (selectedOutlet) {
            filteredOrders = orders.filter(order => {
                const outletName =
                    order.cashier?.outlet?.[0]?.outletId?.name ||
                    order.cashier?.outlet?.[0]?.name ||
                    order.outlet?.name ||
                    order.outletName || "";
                return outletName === selectedOutlet;
            });
        }

        // 2. Flatten items and apply search
        filteredOrders.forEach(order => {
            if (!order.items || !Array.isArray(order.items)) return;

            order.items.forEach(item => {
                const menuItem = item?.menuItem;
                if (!menuItem) return;

                let matchesSearch = true;
                if (debouncedSearch) {
                    const name = (menuItem.name || '').toLowerCase();
                    const category = (menuItem.category?.name || '').toLowerCase();
                    const s = debouncedSearch.toLowerCase();
                    matchesSearch = name.includes(s) || category.includes(s);
                }

                if (matchesSearch) {
                    result.push({
                        _id: `${order._id}_${menuItem._id}_${result.length}`,
                        orderId: order._id,
                        orderNumber: order.orderNumber,
                        menuItem: menuItem,
                        quantity: item.quantity || 1
                    });
                }
            });
        });

        return result;
    }, [orders, selectedOutlet, debouncedSearch]);

    const totals = useMemo(() => {
        let totalPenjualanKotor = 0;
        let totalDiskon = 0;
        let totalPembelian = 0;
        let totalLabaProduk = 0;

        filteredItems.forEach(item => {
            const menuItem = item.menuItem || {};
            const price = menuItem.price || 0;
            const diskon = menuItem.diskon || 0;
            const pembelian = menuItem.pembelian || 0;
            const quantity = item.quantity || 1;

            totalPenjualanKotor += price * quantity;
            totalDiskon += diskon * quantity;
            totalPembelian += pembelian * quantity;
            totalLabaProduk += (price - pembelian) * quantity;
        });

        const totalLabaPersen = totalPenjualanKotor > 0
            ? ((totalLabaProduk / totalPenjualanKotor) * 100).toFixed(2)
            : 0;

        return {
            totalPenjualanKotor,
            totalDiskon,
            totalPembelian,
            totalLabaProduk,
            totalLabaPersen
        };
    }, [filteredItems]);

    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredItems.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredItems, currentPage]);

    const exportToExcel = () => {
        const outletName = selectedOutlet || 'Semua Outlet';
        const rangeStr = `${dayjs(dateRange.startDate).format('DD-MM-YYYY')} s/d ${dayjs(dateRange.endDate).format('DD-MM-YYYY')}`;

        const headerData = [
            ['Laporan Laba Produk'],
            [],
            ['Outlet', outletName],
            ['Tanggal', rangeStr],
            [],
            ['Produk', 'Kategori', 'Penjualan Kotor', 'Diskon Produk', 'Pembelian', 'Laba Produk', '% Laba Produk']
        ];

        const dataRows = filteredItems.map(item => {
            const menuItem = item.menuItem || {};
            const price = menuItem.price || 0;
            const diskon = menuItem.diskon || 0;
            const pembelian = menuItem.pembelian || 0;
            const quantity = item.quantity || 1;

            const penjualanKotor = price * quantity;
            const diskonTotal = diskon * quantity;
            const pembelianTotal = pembelian * quantity;
            const labaProduk = (price - pembelian) * quantity;
            const labaPersen = price > 0 ? (labaProduk / penjualanKotor) : 0;

            return [
                menuItem.name || "-",
                menuItem.category?.name || "-",
                penjualanKotor,
                diskonTotal,
                pembelianTotal,
                labaProduk,
                labaPersen
            ];
        });

        const grandTotal = [
            'Grand Total',
            '',
            totals.totalPenjualanKotor,
            totals.totalDiskon,
            totals.totalPembelian,
            totals.totalLabaProduk,
            totals.totalPenjualanKotor > 0 ? (totals.totalLabaProduk / totals.totalPenjualanKotor) : 0
        ];

        const allData = [...headerData, ...dataRows, grandTotal];
        const ws = XLSX.utils.aoa_to_sheet(allData);

        // Styling and formatting
        ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laba Produk");
        const filename = `Laporan_Laba_Produk_${outletName.replace(/\s+/g, '_')}_${dayjs().format('YYYYMMDD')}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header */}
            <div className="flex justify-end px-6 items-center py-4 space-x-4 border-b bg-white">
                <FaBell className="text-gray-400 cursor-pointer" />
                <span className="text-sm font-medium">Hi Baraja</span>
                <Link to="/admin/menu" className="text-gray-400">
                    <FaUser size={24} />
                </Link>
            </div>

            {/* Breadcrumb & Actions */}
            <div className="px-6 py-4 flex justify-between items-center bg-white shadow-sm">
                <div className="flex items-center text-sm text-gray-500 font-medium">
                    <FaClipboardList className="mr-2" />
                    <span>Laporan</span>
                    <FaChevronRight className="mx-2 text-[10px]" />
                    <Link to="/admin/profit-menu" className="hover:text-green-900 transition-colors">Laporan Laba & Rugi</Link>
                    <FaChevronRight className="mx-2 text-[10px]" />
                    <span className="text-green-900 font-semibold">Laba Produk</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-[13px] px-4 py-2 rounded shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <FaSync className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    <button
                        onClick={exportToExcel}
                        disabled={loading || filteredItems.length === 0}
                        className="flex items-center gap-2 bg-green-900 text-white text-[13px] px-4 py-2 rounded shadow-sm hover:bg-green-800 transition-colors disabled:opacity-50"
                    >
                        <FaFileExcel />
                        Ekspor Excel
                    </button>
                </div>
            </div>

            <div className="px-6 mt-6">
                {/* Filters */}
                <div className="bg-white p-5 rounded-lg shadow-sm mb-6 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Rentang Tanggal</label>
                            <Datepicker
                                value={dateRange}
                                onChange={setDateRange}
                                showShortcuts={true}
                                showFooter={true}
                                displayFormat="DD-MM-YYYY"
                                inputClassName="w-full text-[13px] border border-gray-200 py-2 px-3 rounded focus:ring-2 focus:ring-green-900 outline-none transition-all"
                                popoverDirection="down"
                                separator="sampai"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Outlet</label>
                            <Select
                                options={outletOptions}
                                value={outletOptions.find(opt => opt.value === selectedOutlet) || outletOptions[0]}
                                onChange={(selected) => {
                                    setSelectedOutlet(selected.value);
                                    setCurrentPage(1);
                                }}
                                styles={customSelectStyles}
                                isSearchable
                                placeholder="Pilih Outlet"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Cari Produk</label>
                            <div className="relative">
                                <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari Produk / Kategori"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full text-[13px] border border-gray-200 py-2 pl-10 pr-4 rounded focus:ring-2 focus:ring-green-900 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-100 text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden animate-fadeIn mb-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Produk</th>
                                    <th className="px-6 py-4">Kategori</th>
                                    <th className="px-6 py-4 text-right">Penjualan Kotor</th>
                                    <th className="px-6 py-4 text-right">Diskon Produk</th>
                                    <th className="px-6 py-4 text-right">Pembelian</th>
                                    <th className="px-6 py-4 text-right">Laba Produk</th>
                                    <th className="px-6 py-4 text-right">% Laba Produk</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] divide-y divide-gray-50 text-gray-600">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-900"></div>
                                        </td>
                                    </tr>
                                ) : paginatedItems.length > 0 ? (
                                    paginatedItems.map((item, index) => {
                                        const menuItem = item.menuItem || {};
                                        const price = menuItem.price || 0;
                                        const diskon = menuItem.diskon || 0;
                                        const pembelian = menuItem.pembelian || 0;
                                        const laba = price - pembelian;
                                        const labaPersen = price > 0 ? ((laba / price) * 100).toFixed(2) : 0;

                                        return (
                                            <tr key={item._id} className="hover:bg-green-50/30 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900">{menuItem.name || "-"}</td>
                                                <td className="px-6 py-4 italic text-gray-500">{menuItem.category?.name || "-"}</td>
                                                <td className="px-6 py-4 text-right font-mono">{formatCurrency(price)}</td>
                                                <td className="px-6 py-4 text-right text-red-500 font-mono">{formatCurrency(diskon)}</td>
                                                <td className="px-6 py-4 text-right font-mono">{formatCurrency(pembelian)}</td>
                                                <td className="px-6 py-4 text-right font-bold text-green-700 font-mono">{formatCurrency(laba)}</td>
                                                <td className="px-6 py-4 text-right font-bold text-blue-600 font-mono">{labaPersen}%</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center text-gray-400 font-medium italic">Tidak ada data ditemukan</td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t border-gray-100 font-bold text-[13px] text-gray-900">
                                <tr>
                                    <td className="px-6 py-4" colSpan={2}>GRAND TOTAL</td>
                                    <td className="px-6 py-4 text-right font-mono">{formatCurrency(totals.totalPenjualanKotor)}</td>
                                    <td className="px-6 py-4 text-right text-red-600 font-mono">{formatCurrency(totals.totalDiskon)}</td>
                                    <td className="px-6 py-4 text-right font-mono">{formatCurrency(totals.totalPembelian)}</td>
                                    <td className="px-6 py-4 text-right text-green-800 font-mono">{formatCurrency(totals.totalLabaProduk)}</td>
                                    <td className="px-6 py-4 text-right font-mono text-blue-800">{totals.totalLabaPersen}%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <Paginated
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                />
            </div>
        </div>
    );
};

export default ProfitByProductManagement;