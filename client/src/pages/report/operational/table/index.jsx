import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import { Link, useSearchParams } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaSync, FaFileExcel, FaChair, FaHistory, FaClock, FaUsers } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import dayjs from "dayjs";
import { useSelector, useDispatch } from "react-redux";
import { setReportData } from "@/redux/report/reportSlice";
import Paginated from "@/components/Paginated";
import Header from "@/components/Header";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TableManagement = () => {
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const { outlets } = useSelector((state) => state.outlet);
    const cachedData = useSelector((state) => state.report.operational.table.data);

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
    const [selectedOutlet, setSelectedOutlet] = useState(searchParams.get('outletId') || "");
    const [selectedArea, setSelectedArea] = useState(searchParams.get('area') || "");
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
            value: outlet._id,
            label: outlet.name,
        })),
    ], [outlets]);

    // Placeholder areas
    const areaOptions = [
        { value: "", label: "Semua Area" },
        { value: "Indoor", label: "Indoor" },
        { value: "Outdoor", label: "Outdoor" },
        { value: "Lantai 2", label: "Lantai 2" },
    ];

    const updateURLParams = useCallback(() => {
        const params = new URLSearchParams();
        if (dateRange.startDate) params.set('startDate', dayjs(dateRange.startDate).format('YYYY-MM-DD'));
        if (dateRange.endDate) params.set('endDate', dayjs(dateRange.endDate).format('YYYY-MM-DD'));
        if (selectedOutlet) params.set('outletId', selectedOutlet);
        if (selectedArea) params.set('area', selectedArea);
        if (currentPage > 1) params.set('page', currentPage.toString());
        setSearchParams(params, { replace: true });
    }, [dateRange, selectedOutlet, selectedArea, currentPage, setSearchParams]);

    useEffect(() => {
        updateURLParams();
    }, [updateURLParams]);

    const fetchData = useCallback(async (force = false) => {
        if (!force && cachedData.length > 0) return;
        setLoading(true);
        try {
            // Simulating API call as per original code
            await new Promise(resolve => setTimeout(resolve, 500));
            const result = []; // Simulation placeholder
            dispatch(setReportData({ category: 'operational', type: 'table', data: result }));
            setError(null);
        } catch (err) {
            console.error("Error fetching table report data:", err);
            setError("Gagal memuat data laporan meja.");
        } finally {
            setLoading(false);
        }
    }, [cachedData.length, dispatch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => {
        fetchData(true);
    };

    const filteredData = useMemo(() => {
        let result = cachedData;
        if (selectedArea) {
            result = result.filter(item => item.area === selectedArea);
        }
        return result;
    }, [cachedData, selectedArea]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);

    // Area-wise occupancy chart data
    const areaChartData = useMemo(() => {
        const map = {};
        cachedData.forEach(item => {
            map[item.area] = (map[item.area] || 0) + 1;
        });
        return Object.keys(map).map(name => ({ name, count: map[name] }));
    }, [cachedData]);

    const exportToExcel = () => {
        const exportData = filteredData.map(item => ({
            "Waktu": dayjs(item.time).format('DD-MM-YYYY HH:mm'),
            "Area": item.area,
            "Meja": item.tableNo,
            "Pelanggan": item.customers,
            "Durasi": item.duration,
            "Status": "Selesai"
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Meja");
        XLSX.writeFile(wb, `Laporan_Meja_${dayjs().format('YYYYMMDD')}.xlsx`);
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
                    <span className="text-green-900 font-semibold">Laporan Meja</span>
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
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Area</label>
                            <Select
                                options={areaOptions}
                                value={areaOptions.find(opt => opt.value === selectedArea) || areaOptions[0]}
                                onChange={(selected) => {
                                    setSelectedArea(selected.value);
                                    setCurrentPage(1);
                                }}
                                styles={customSelectStyles}
                                placeholder="Pilih Area"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Summary Metrics */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-blue-600">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Kapasitas Berlebih</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-gray-900">0</span>
                                <span className="text-[11px] text-gray-400 font-medium">Meja</span>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-red-600">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Melebihi Batas Waktu</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-gray-900">0</span>
                                <span className="text-[11px] text-gray-400 font-medium">Meja</span>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-amber-500">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rata-rata Durasi</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-gray-900">0</span>
                                <span className="text-[11px] text-gray-400 font-medium">Menit</span>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-green-600">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rata-rata Pelanggan</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-gray-900">0</span>
                                <span className="text-[11px] text-gray-400 font-medium">Orang</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart Card */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 w-full text-center">Okupansi per Area</h3>
                        <div className="h-[150px] w-full">
                            {areaChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={areaChartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip labelStyle={{ fontSize: '12px' }} itemStyle={{ fontSize: '12px' }} />
                                        <Bar dataKey="count" fill="#005429" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-[11px] text-gray-400 italic font-medium">
                                    Belum ada data grafik
                                </div>
                            )}
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
                                    <th className="px-6 py-4">Area / No. Meja</th>
                                    <th className="px-6 py-4 text-center">Pelanggan</th>
                                    <th className="px-6 py-4 text-center">Durasi</th>
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
                                    paginatedData.map((item, index) => (
                                        <tr key={index} className="hover:bg-green-50/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{dayjs(item.time).format('DD MMM YYYY')}</div>
                                                <div className="text-[11px] text-gray-400">{dayjs(item.time).format('HH:mm')}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 uppercase tracking-tight">{item.area}</div>
                                                <div className="text-[11px] text-gray-400 font-bold">MEJA: {item.tableNo}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-gray-900">{item.customers}</td>
                                            <td className="px-6 py-4 text-center italic">{item.duration}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-green-100 text-green-700 border-green-200">
                                                    Selesai
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-gray-400 font-medium italic uppercase tracking-widest text-[11px]">Data belum tersedia atau tidak ditemukan</td>
                                    </tr>
                                )}
                            </tbody>
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

export default TableManagement;
