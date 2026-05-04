import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import { Link, useSearchParams } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSync, FaFileExcel, FaSearch } from "react-icons/fa";
import { FaArrowTrendUp, FaArrowTrendDown, FaScaleBalanced } from "react-icons/fa6";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import dayjs from "dayjs";
import { useSelector, useDispatch } from "react-redux";
import useDebounce from "@/hooks/useDebounce";
import { setReportData } from "@/redux/report/reportSlice";
import Paginated from "@/components/paginated";
import Header from "@/components/Header";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Reconciliation = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useDispatch();
    const { outlets } = useSelector((state) => state.outlet);
    const { currentUser } = useSelector((state) => state.user);
    const { operational } = useSelector((state) => state.report);
    const cachedData = operational.reconciliation.data;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initial state from URL
    const [dateRange, setDateRange] = useState(() => {
        const start = searchParams.get('startDate');
        const end = searchParams.get('endDate');
        return {
            startDate: start ? dayjs(start).toDate() : dayjs().startOf('month').toDate(),
            endDate: end ? dayjs(end).toDate() : dayjs().toDate()
        };
    });
    const [selectedOutlet, setSelectedOutlet] = useState(searchParams.get('outletId') || "");
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || "");
    const debouncedSearch = useDebounce(searchTerm, 500);

    const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page'), 10) || 1);
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
            value: outlet._id,
            label: outlet.name,
        })),
    ], [outlets]);

    const updateURLParams = useCallback(() => {
        const params = new URLSearchParams();
        if (dateRange.startDate) params.set('startDate', dayjs(dateRange.startDate).format('YYYY-MM-DD'));
        if (dateRange.endDate) params.set('endDate', dayjs(dateRange.endDate).format('YYYY-MM-DD'));
        if (selectedOutlet) params.set('outletId', selectedOutlet);
        if (debouncedSearch) params.set('q', debouncedSearch);
        if (currentPage > 1) params.set('page', currentPage.toString());
        setSearchParams(params, { replace: true });
    }, [dateRange, selectedOutlet, debouncedSearch, currentPage, setSearchParams]);

    useEffect(() => {
        updateURLParams();
    }, [updateURLParams]);

    const fetchData = useCallback(async (force = false) => {
        if (!force && cachedData.length > 0) return;

        setLoading(true);
        try {
            const start = dayjs(dateRange.startDate).format('YYYY-MM-DD');
            const end = dayjs(dateRange.endDate).format('YYYY-MM-DD');

            const response = await axios.get('/api/marketlist/cashflow', {
                params: { start, end, outletId: selectedOutlet },
                headers: { Authorization: `Bearer ${currentUser.token}` }
            });

            const data = response.data.data || response.data || [];
            const result = Array.isArray(data) ? data : [];

            dispatch(setReportData({ category: 'operational', type: 'reconciliation', data: result }));
            setError(null);
        } catch (err) {
            console.error("Error fetching cashflow data:", err);
            setError("Gagal memuat data rekap kas.");
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedOutlet, currentUser.token, cachedData.length, dispatch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => {
        fetchData(true);
    };

    const filteredData = useMemo(() => {
        if (!debouncedSearch) return cachedData;
        const s = debouncedSearch.toLowerCase();
        return cachedData.filter(item => {
            const desc = (item.description || "").toLowerCase();
            const day = (item.day || "").toLowerCase();
            return desc.includes(s) || day.includes(s);
        });
    }, [cachedData, debouncedSearch]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);

    const totals = useMemo(() => {
        return filteredData.reduce((acc, curr) => {
            const cashIn = curr.cashIn || 0;
            const items = curr.relatedMarketList?.items || [];
            const expenses = curr.relatedMarketList?.additionalExpenses || [];
            const cashOutDetails = [
                ...items.map(i => i.amountCharged || 0),
                ...expenses.map(e => e.amount || 0)
            ];
            const cashOut = cashOutDetails.reduce((a, b) => a + b, 0);

            return {
                totalIn: acc.totalIn + cashIn,
                totalOut: acc.totalOut + cashOut
            };
        }, { totalIn: 0, totalOut: 0 });
    }, [filteredData]);

    const trendData = useMemo(() => {
        const groups = {};
        filteredData.forEach(item => {
            const date = dayjs(item.date).format('DD MMM');
            if (!groups[date]) groups[date] = { date, income: 0, expense: 0 };
            groups[date].income += (item.cashIn || 0);

            const items = item.relatedMarketList?.items || [];
            const expenses = item.relatedMarketList?.additionalExpenses || [];
            const cashOut = [
                ...items.map(i => i.amountCharged || 0),
                ...expenses.map(e => e.amount || 0)
            ].reduce((a, b) => a + b, 0);

            groups[date].expense += cashOut;
        });
        return Object.values(groups).sort((a, b) => dayjs(a.date, 'DD MMM').isAfter(dayjs(b.date, 'DD MMM')) ? 1 : -1);
    }, [filteredData]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const exportToExcel = () => {
        const exportData = [];
        filteredData.forEach(cf => {
            if (cf.cashIn > 0) {
                exportData.push({
                    "Waktu": `${cf.day}, ${dayjs(cf.date).format('DD-MM-YYYY HH:mm')}`,
                    "Uang Masuk": cf.cashIn,
                    "Uang Keluar": 0,
                    "Keterangan": cf.description,
                    "Status": "-"
                });
            }

            (cf.relatedMarketList?.items || []).forEach(itm => {
                exportData.push({
                    "Waktu": `${cf.day}, ${dayjs(cf.date).format('DD-MM-YYYY HH:mm')}`,
                    "Uang Masuk": 0,
                    "Uang Keluar": itm.amountCharged,
                    "Keterangan": `Belanja: ${itm.productName}`,
                    "Status": itm.payment?.status || "-"
                });
            });

            (cf.relatedMarketList?.additionalExpenses || []).forEach(exp => {
                exportData.push({
                    "Waktu": `${cf.day}, ${dayjs(cf.date).format('DD-MM-YYYY HH:mm')}`,
                    "Uang Masuk": 0,
                    "Uang Keluar": exp.amount,
                    "Keterangan": `Pengeluaran Lain: ${exp.name}`,
                    "Status": exp.payment?.status || "-"
                });
            });
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rekap Kas");
        XLSX.writeFile(wb, `Laporan_Rekap_Kas_${dayjs().format('YYYYMMDD')}.xlsx`);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <Header />

            {/* Breadcrumb & Actions */}
            <div className="px-6 py-4 flex justify-between items-center bg-white shadow-sm border-b">
                <div className="flex items-center text-sm text-gray-500 font-medium">
                    <FaClipboardList className="mr-2" />
                    <span>Laporan</span>
                    <FaChevronRight className="mx-2 text-[10px]" />
                    <Link to="/admin/operational-menu" className="hover:text-green-900 transition-colors">Laporan Operasional</Link>
                    <FaChevronRight className="mx-2 text-[10px]" />
                    <span className="text-green-900 font-semibold">Rekap Kas (Reconciliation)</span>
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
                        disabled={loading || filteredData.length === 0}
                        className="flex items-center gap-2 bg-green-900 text-white text-[13px] px-4 py-2 rounded shadow-sm hover:bg-green-800 transition-colors disabled:opacity-50"
                    >
                        <FaFileExcel />
                        Ekspor Excel
                    </button>
                </div>
            </div>

            <div className="p-6">
                {/* Filters */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Rentang Tanggal</label>
                            <Datepicker
                                value={dateRange}
                                onChange={(val) => {
                                    setDateRange(val);
                                    setCurrentPage(1);
                                }}
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
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Cari Keterangan</label>
                            <div className="relative">
                                <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full text-[13px] border border-gray-200 py-2 pl-10 pr-3 rounded focus:ring-2 focus:ring-green-900 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Summary Metrics */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-green-600">
                            <div className="p-3 bg-green-50 rounded-full mr-4">
                                <FaArrowTrendUp className="text-green-600 text-xl" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Total Uang Masuk</p>
                                <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.totalIn)}</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-red-600">
                            <div className="p-3 bg-red-50 rounded-full mr-4">
                                <FaArrowTrendDown className="text-red-600 text-xl" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Total Uang Keluar</p>
                                <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.totalOut)}</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center border-l-4 border-l-blue-600">
                            <div className="p-3 bg-blue-50 rounded-full mr-4">
                                <FaScaleBalanced className="text-blue-600 text-xl" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Saldo Bersih</p>
                                <p className={`text-xl font-bold ${totals.totalIn - totals.totalOut >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(totals.totalIn - totals.totalOut)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Chart Card */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 w-full">Tren Aliran Kas</h3>
                        <div className="h-[150px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip labelStyle={{ fontSize: '12px' }} itemStyle={{ fontSize: '13px' }} formatter={(val) => formatCurrency(val)} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                    <Line type="monotone" dataKey="income" name="Masuk" stroke="#005429" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="expense" name="Keluar" stroke="#EF4444" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-100 text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Waktu</th>
                                    <th className="px-6 py-4 text-right">Uang Masuk</th>
                                    <th className="px-6 py-4 text-right">Uang Keluar</th>
                                    <th className="px-6 py-4">Keterangan</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] divide-y divide-gray-50 text-gray-600">
                                {loading && cachedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-900"></div>
                                        </td>
                                    </tr>
                                ) : paginatedData.length > 0 ? (
                                    paginatedData.map((cf, index) => {
                                        const cashOuts = [
                                            ...(cf.relatedMarketList?.items || []).map(i => ({ name: `Belanja: ${i.productName}`, amount: i.amountCharged, status: i.payment?.status })),
                                            ...(cf.relatedMarketList?.additionalExpenses || []).map(e => ({ name: `Lain: ${e.name}`, amount: e.amount, status: e.payment?.status }))
                                        ];

                                        return (
                                            <React.Fragment key={index}>
                                                {cf.cashIn > 0 && (
                                                    <tr className="hover:bg-green-50/20 transition-colors font-medium bg-gray-50/30">
                                                        <td className="px-6 py-4">
                                                            <div className="text-gray-900">{cf.day}, {dayjs(cf.date).format('DD MMM YYYY')}</div>
                                                            <div className="text-[11px] text-gray-400">{dayjs(cf.date).format('HH:mm')}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-green-700 font-bold">{formatCurrency(cf.cashIn)}</td>
                                                        <td className="px-6 py-4 text-right text-gray-300">-</td>
                                                        <td className="px-6 py-4 font-semibold text-gray-900">{cf.description}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-700">Received</span>
                                                        </td>
                                                    </tr>
                                                )}
                                                {cashOuts.map((out, i) => (
                                                    <tr key={`${index}-out-${i}`} className="hover:bg-red-50/10 transition-colors">
                                                        <td className="px-6 py-3 text-gray-400 italic">
                                                            {dayjs(cf.date).format('DD MMM YYYY HH:mm')}
                                                        </td>
                                                        <td className="px-6 py-3 text-right text-gray-300">-</td>
                                                        <td className="px-6 py-3 text-right text-red-600 font-medium">{formatCurrency(out.amount)}</td>
                                                        <td className="px-6 py-3 text-gray-500 pl-10 text-[12px]">• {out.name}</td>
                                                        <td className="px-6 py-3 text-center">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${out.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                {out.status || 'Paid'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-gray-400 font-medium italic">Tidak ada data transaksi kas ditemukan</td>
                                    </tr>
                                )}
                            </tbody>
                            {filteredData.length > 0 && (
                                <tfoot className="bg-gray-50 font-bold border-t border-gray-100 text-[13px]">
                                    <tr>
                                        <td className="px-6 py-4 uppercase text-[11px]">Ringkasan Total</td>
                                        <td className="px-6 py-4 text-right text-green-700 font-extrabold">{formatCurrency(totals.totalIn)}</td>
                                        <td className="px-6 py-4 text-right text-red-700 font-extrabold">{formatCurrency(totals.totalOut)}</td>
                                        <td className="px-6 py-4 text-right" colSpan={2}>
                                            <span className={`inline-block px-4 py-1 rounded-full ${totals.totalIn - totals.totalOut >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                Saldo: {formatCurrency(totals.totalIn - totals.totalOut)}
                                            </span>
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
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

export default Reconciliation;