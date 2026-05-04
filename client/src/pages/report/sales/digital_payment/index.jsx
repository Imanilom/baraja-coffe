import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import { Link, useSearchParams } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSearch } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import { useSelector } from "react-redux";
import useDebounce from "@/hooks/useDebounce";
import dayjs from "dayjs";

const DigitalPayment = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { outlets } = useSelector((state) => state.outlet);

    const [products, setProducts] = useState([]);
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showInput, setShowInput] = useState(false);
    const [outletSearch, setOutletSearch] = useState("");

    // Filters state initialized from URL
    const [tempSelectedOutlet, setTempSelectedOutlet] = useState(searchParams.get('outlet') || "");
    const [dateRange, setDateRange] = useState(() => {
        const start = searchParams.get('startDate');
        const end = searchParams.get('endDate');
        return start && end ? { startDate: start, endDate: end } : null;
    });
    const [search, setSearch] = useState(searchParams.get('search') || "");
    const debouncedSearch = useDebounce(search, 500);

    const [payMethod, setPayMethod] = useState(() => {
        const methods = searchParams.get('methods')?.split(',') || [];
        return {
            linkAja: methods.includes('linkAja'),
            qris: methods.includes('qris'),
            dana: methods.includes('dana'),
            mandiriQris: methods.includes('mandiriQris'),
            briQris: methods.includes('briQris'),
        };
    });

    const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page'), 10) || 1);
    const ITEMS_PER_PAGE = 50;
    const dropdownRef = useRef(null);

    // PB1 value - keeping as constant for now as per original code
    const pb1 = 10000;

    // Update URL params
    const updateURLParams = useCallback(() => {
        const params = new URLSearchParams();
        if (tempSelectedOutlet) params.set('outlet', tempSelectedOutlet);
        if (dateRange?.startDate && dateRange?.endDate) {
            params.set('startDate', dayjs(dateRange.startDate).format('YYYY-MM-DD'));
            params.set('endDate', dayjs(dateRange.endDate).format('YYYY-MM-DD'));
        }
        if (search) params.set('search', search);

        const activeMethods = Object.entries(payMethod)
            .filter(([_, active]) => active)
            .map(([name]) => name);
        if (activeMethods.length > 0) params.set('methods', activeMethods.join(','));

        if (currentPage > 1) params.set('page', currentPage.toString());

        setSearchParams(params);
    }, [tempSelectedOutlet, dateRange, search, payMethod, currentPage, setSearchParams]);

    useEffect(() => {
        updateURLParams();
    }, [updateURLParams]);

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                mode: 'all'
            };
            if (dateRange?.startDate && dateRange?.endDate) {
                params.startDate = dayjs(dateRange.startDate).format('YYYY-MM-DD');
                params.endDate = dayjs(dateRange.endDate).format('YYYY-MM-DD');
            }
            if (tempSelectedOutlet) {
                params.outlet = tempSelectedOutlet;
            }

            const response = await axios.get('/api/report/orders', { params });
            const data = response.data?.data || response.data || [];
            setProducts(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load data. Please try again later.");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle click outside dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowInput(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filtered data logic (Client-side as per current implementation, but optimized)
    const filteredData = useMemo(() => {
        let result = [...products];

        // Filter by search
        if (debouncedSearch) {
            const term = debouncedSearch.toLowerCase();
            result = result.filter(p => p._id?.toLowerCase().includes(term));
        }

        // Filter by outlet
        if (tempSelectedOutlet) {
            result = result.filter(p => p.cashier?.outlet?.[0]?.outletId?.name === tempSelectedOutlet);
        }

        // Filter by date
        if (dateRange?.startDate && dateRange?.endDate) {
            const start = dayjs(dateRange.startDate).startOf('day');
            const end = dayjs(dateRange.endDate).endOf('day');
            result = result.filter(p => {
                const date = dayjs(p.createdAt);
                return date.isAfter(start) && date.isBefore(end);
            });
        }

        // Filter by pay method
        const activeMethods = [];
        if (payMethod.qris) activeMethods.push('QRIS');
        if (payMethod.dana) activeMethods.push('DANA');
        if (payMethod.linkAja) activeMethods.push('Link Aja');
        if (payMethod.mandiriQris) activeMethods.push('Mandiri QRIS');
        if (payMethod.briQris) activeMethods.push('BRI QRIS');

        if (activeMethods.length > 0) {
            result = result.filter(p => activeMethods.includes(p.paymentMethod));
        }

        return result;
    }, [products, debouncedSearch, tempSelectedOutlet, dateRange, payMethod]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [currentPage, filteredData]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    const grandTotalFinal = useMemo(() => {
        return filteredData.reduce((sum, p) => {
            const itemSubtotal = p.items?.reduce((s, i) => s + (Number(i.subtotal) || 0), 0) || 0;
            return sum + itemSubtotal + pb1;
        }, 0);
    }, [filteredData, pb1]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDateTime = (datetime) => {
        return dayjs(datetime).format('DD-MM-YYYY HH:mm:ss');
    };

    const exportToExcel = () => {
        if (filteredData.length === 0) return;

        const dataToExport = filteredData.map(p => {
            const subtotal = p.items?.reduce((s, i) => s + (Number(i.subtotal) || 0), 0) || 0;
            return {
                "Waktu": formatDateTime(p.createdAt),
                "Outlet": p.cashier?.outlet?.[0]?.outletId?.name || "-",
                "ID Struk": p._id,
                "Kasir": p.cashier?.username || "-",
                "Metode": p.paymentMethod || "-",
                "Total (Rp)": subtotal + pb1,
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Digital Payment");
        XLSX.writeFile(wb, "Laporan_Digital_Payment.xlsx");
    };

    if (loading && products.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

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

            {/* Breadcrumb & Export */}
            <div className="px-6 py-4 flex justify-between items-center bg-white shadow-sm">
                <div className="flex items-center text-sm text-gray-500 font-medium">
                    <FaClipboardList className="mr-2" />
                    <span>Laporan</span>
                    <FaChevronRight className="mx-2 text-[10px]" />
                    <Link to="/admin/sales-menu" className="hover:text-green-900 transition-colors">Laporan Penjualan</Link>
                    <FaChevronRight className="mx-2 text-[10px]" />
                    <span className="text-green-900">Metode Pembayaran Digital</span>
                </div>
                <button
                    onClick={exportToExcel}
                    className="bg-green-900 text-white text-[13px] px-4 py-2 rounded shadow-sm hover:bg-green-800 transition-colors"
                >
                    Ekspor Excel
                </button>
            </div>

            <div className="px-6 mt-6">
                {/* Filter Card */}
                <div className="bg-white p-5 rounded-lg shadow-sm mb-6 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Outlet</label>
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    className="w-full text-[13px] border border-gray-200 py-2 px-3 rounded text-left flex justify-between items-center focus:ring-2 focus:ring-green-900 outline-none"
                                    onClick={() => setShowInput(!showInput)}
                                >
                                    {tempSelectedOutlet || "Semua Outlet"}
                                    <span className="text-[10px]">▼</span>
                                </button>
                                {showInput && (
                                    <div className="absolute z-20 bg-white border border-gray-200 mt-1 w-full rounded shadow-xl max-h-60 overflow-hidden flex flex-col">
                                        <div className="p-2 border-b">
                                            <input
                                                type="text"
                                                className="w-full text-[13px] border border-gray-100 p-2 rounded outline-none focus:border-green-900"
                                                placeholder="Cari outlet..."
                                                value={outletSearch}
                                                onChange={(e) => setOutletSearch(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <ul className="overflow-y-auto">
                                            <li
                                                className="px-4 py-2 text-[13px] hover:bg-green-50 cursor-pointer border-b border-gray-50"
                                                onClick={() => { setTempSelectedOutlet(""); setShowInput(false); }}
                                            >
                                                Semua Outlet
                                            </li>
                                            {outlets.filter(o => o.name.toLowerCase().includes(outletSearch.toLowerCase())).map((o) => (
                                                <li
                                                    key={o._id}
                                                    onClick={() => { setTempSelectedOutlet(o.name); setShowInput(false); }}
                                                    className="px-4 py-2 text-[13px] hover:bg-green-50 cursor-pointer border-b border-gray-50"
                                                >
                                                    {o.name}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Periode</label>
                            <Datepicker
                                showFooter
                                showShortcuts
                                value={dateRange}
                                onChange={setDateRange}
                                displayFormat="DD-MM-YYYY"
                                inputClassName="w-full text-[13px] border border-gray-200 py-2 px-3 rounded focus:ring-2 focus:ring-green-900 outline-none"
                                popoverDirection="down"
                            />
                        </div>

                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Cari ID Struk</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Masukkan ID..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full text-[13px] border border-gray-200 py-2 pl-9 pr-3 rounded focus:ring-2 focus:ring-green-900 outline-none"
                                />
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[12px]" />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => { setSearch(""); setTempSelectedOutlet(""); setDateRange(null); setCurrentPage(1); }}
                                className="flex-1 text-gray-500 border border-gray-200 text-[13px] py-2 rounded hover:bg-gray-50 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 mt-6 pt-5 border-t border-gray-100">
                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Tampilkan Metode:</span>
                        {[
                            { id: 'linkAja', label: 'Link Aja' },
                            { id: 'qris', label: 'QRIS' },
                            { id: 'dana', label: 'DANA' },
                            { id: 'mandiriQris', label: 'Mandiri QRIS' },
                            { id: 'briQris', label: 'BRI QRIS' }
                        ].map(method => (
                            <label key={method.id} className="flex items-center cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={payMethod[method.id]}
                                        onChange={() => setPayMethod(prev => ({ ...prev, [method.id]: !prev[method.id] }))}
                                    />
                                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-green-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                                </div>
                                <span className="ml-2 text-[13px] font-medium text-gray-600 group-hover:text-green-900 transition-colors uppercase">{method.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                    <th className="px-6 py-4">Waktu</th>
                                    <th className="px-6 py-4">Nama Outlet</th>
                                    <th className="px-6 py-4">ID Struk</th>
                                    <th className="px-6 py-4">Kasir</th>
                                    <th className="px-6 py-4">Metode</th>
                                    <th className="px-6 py-4 text-right">Total Transaksi</th>
                                    <th className="px-6 py-4 text-right">MDR</th>
                                    <th className="px-6 py-4 text-right">Diterima</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] divide-y divide-gray-50">
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((p) => {
                                        const subtotal = p.items?.reduce((s, i) => s + (Number(i.subtotal) || 0), 0) || 0;
                                        const total = subtotal + pb1;
                                        return (
                                            <tr
                                                key={p._id}
                                                className="hover:bg-green-50/50 cursor-pointer transition-colors"
                                                onClick={() => setSelectedTrx(p)}
                                            >
                                                <td className="px-6 py-4 text-gray-600">{formatDateTime(p.createdAt)}</td>
                                                <td className="px-6 py-4 text-gray-700 font-medium">{p.cashier?.outlet?.[0]?.outletId?.name || '-'}</td>
                                                <td className="px-6 py-4 font-mono text-gray-400 text-[11px]">{p._id}</td>
                                                <td className="px-6 py-4">{p.cashier?.username || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">
                                                        {p.paymentMethod || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(total)}</td>
                                                <td className="px-6 py-4 text-right text-gray-400">{formatCurrency(total)}</td>
                                                <td className="px-6 py-4 text-right text-green-700 font-medium">{formatCurrency(total)}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="py-20 text-center text-gray-400 font-medium bg-white">
                                            Tidak ada data transaksi ditemukan
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t-2 border-gray-100 font-bold">
                                <tr>
                                    <td className="px-6 py-4 text-gray-500 uppercase text-[11px]" colSpan="4">Ringkasan Total</td>
                                    <td className="px-6 py-4 text-right text-gray-400" colSpan="2">Grand Total:</td>
                                    <td className="px-6 py-4 text-right text-green-900 text-lg" colSpan="2">
                                        {formatCurrency(grandTotalFinal)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className="mt-6 flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <span className="text-[12px] text-gray-500">
                            Halaman <span className="font-bold text-gray-900">{currentPage}</span> dari <span className="font-bold text-gray-900">{totalPages}</span>
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); window.scrollTo(0, 0); }}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border border-gray-200 rounded text-[13px] disabled:opacity-50 hover:bg-gray-50 transition-colors"
                            >
                                Sebelumnya
                            </button>
                            <button
                                onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); window.scrollTo(0, 0); }}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-green-900 text-white rounded text-[13px] disabled:opacity-50 hover:bg-green-800 transition-colors"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Detail */}
            {selectedTrx && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setSelectedTrx(null)}></div>
                    <div className="relative w-full max-w-md bg-white shadow-2xl animate-slide-in-right h-full overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                            <h2 className="font-bold text-gray-800 uppercase tracking-tight">Detail Transaksi</h2>
                            <button onClick={() => setSelectedTrx(null)} className="text-gray-400 hover:text-red-500 text-3xl font-light transition-colors">
                                &times;
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="text-center border-b border-dashed pb-6">
                                <h3 className="text-xl font-bold text-green-900">Baraja Coffee Indonesia</h3>
                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">{selectedTrx.cashier?.outlet?.[0]?.outletId?.name || '-'}</p>
                            </div>

                            <div className="space-y-3 text-[13px]">
                                <div className="flex justify-between"><span className="text-gray-400">ID Struk</span><span className="font-mono text-[11px]">{selectedTrx._id}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Waktu</span><span>{formatDateTime(selectedTrx.createdAt)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Kasir</span><span>{selectedTrx.cashier?.username}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Tipe Order</span><span className="font-bold text-green-900">{selectedTrx.orderType}</span></div>
                            </div>

                            <div className="border-y border-dashed py-6 my-6">
                                <table className="w-full text-[13px]">
                                    <tbody>
                                        {selectedTrx.items?.map((item, idx) => (
                                            <tr key={idx} className="align-top">
                                                <td className="py-2 pr-4 font-medium text-gray-700">
                                                    {item.menuItem?.name || '-'}
                                                    <div className="text-[11px] text-gray-400 font-normal">Qty: {item.quantity}</div>
                                                </td>
                                                <td className="py-2 text-right font-semibold">{formatCurrency(item.subtotal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-3 text-[13px]">
                                <div className="flex justify-between"><span className="text-gray-400 font-medium uppercase text-[11px] tracking-wider">Subtotal</span><span className="font-semibold">{formatCurrency(selectedTrx.items?.reduce((s, i) => s + (Number(i.subtotal) || 0), 0) || 0)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400 font-medium uppercase text-[11px] tracking-wider">PB1 (Hardcoded)</span><span className="font-semibold">{formatCurrency(pb1)}</span></div>
                                <div className="flex justify-between items-center pt-3 border-t"><span className="text-lg font-bold text-gray-900 uppercase">Total</span><span className="text-xl font-black text-green-900">{formatCurrency((selectedTrx.items?.reduce((s, i) => s + (Number(i.subtotal) || 0), 0) || 0) + pb1)}</span></div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg mt-10 border border-gray-100 flex justify-between items-center">
                                <span className="text-[11px] font-bold text-gray-400 uppercase">Metode Bayar</span>
                                <span className="px-3 py-1 bg-green-600 text-white text-[10px] font-black rounded uppercase">{selectedTrx.paymentMethod}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DigitalPayment;
