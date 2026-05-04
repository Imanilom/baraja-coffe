import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from '@/lib/axios';
import { Link, useSearchParams } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSync, FaFileExcel, FaSearch, FaClock, FaCheckCircle, FaTimesCircle, FaWalking } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import dayjs from "dayjs";
import { useSelector, useDispatch } from "react-redux";
import useDebounce from "@/hooks/useDebounce";
import { setReportData } from "@/redux/report/reportSlice";
import Paginated from "@/components/paginated";

const UserAttendancesManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useDispatch();
    const { outlets } = useSelector((state) => state.outlet);
    const { operational } = useSelector((state) => state.report);
    const cachedData = operational.userAttendances.data;

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
            const params = {
                startDate: dayjs(dateRange.startDate).format('YYYY-MM-DD'),
                endDate: dayjs(dateRange.endDate).format('YYYY-MM-DD'),
            };
            if (selectedOutlet) params.outletId = selectedOutlet;

            const response = await axios.get('/api/hr/attendance/summary', { params });
            const data = Array.isArray(response.data) ? response.data : [];

            dispatch(setReportData({ category: 'operational', type: 'userAttendances', data }));
            setError(null);
        } catch (err) {
            console.error("Error fetching attendance data:", err);
            setError("Gagal memuat data absensi.");
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedOutlet, cachedData.length, dispatch]);

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
            const username = (item.user?.username || "").toLowerCase();
            const position = (item.employee?.position || "").toLowerCase();
            const dept = (item.employee?.department || "").toLowerCase();
            return username.includes(s) || position.includes(s) || dept.includes(s);
        });
    }, [cachedData, debouncedSearch]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);

    const metrics = useMemo(() => {
        const totalPresent = filteredData.reduce((sum, item) => sum + (item.totalPresent || 0), 0);
        const totalLate = filteredData.reduce((sum, item) => sum + (item.totalLate || 0), 0);
        const totalAbsent = filteredData.reduce((sum, item) => sum + (item.totalAbsent || 0), 0);
        return { totalPresent, totalLate, totalAbsent };
    }, [filteredData]);

    const exportToExcel = () => {
        const exportData = filteredData.map(item => ({
            "Karyawan": item.user?.username || "-",
            "Posisi": item.employee?.position || "-",
            "Departemen": item.employee?.department || "-",
            "Hadir": item.totalPresent || 0,
            "Terlambat": item.totalLate || 0,
            "Alpa": item.totalAbsent || 0,
            "Total Jam": (item.totalWorkHours || 0).toFixed(2)
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Absensi");
        XLSX.writeFile(wb, `Laporan_Absensi_${dayjs().format('YYYYMMDD')}.xlsx`);
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
                    <Link to="/admin/operational-menu" className="hover:text-green-900 transition-colors">Laporan Operasional</Link>
                    <FaChevronRight className="mx-2 text-[10px]" />
                    <span className="text-green-900 font-semibold">Absensi</span>
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
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase mb-1">Cari Karyawan</label>
                            <div className="relative">
                                <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Nama / Posisi / Dept"
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

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
                        <div className="p-3 bg-green-50 rounded-full mr-4">
                            <FaCheckCircle className="text-green-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Total Hadir</p>
                            <p className="text-xl font-bold text-gray-900">{metrics.totalPresent}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
                        <div className="p-3 bg-amber-50 rounded-full mr-4">
                            <FaClock className="text-amber-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Total Terlambat</p>
                            <p className="text-xl font-bold text-gray-900">{metrics.totalLate}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
                        <div className="p-3 bg-red-50 rounded-full mr-4">
                            <FaTimesCircle className="text-red-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Total Alpa</p>
                            <p className="text-xl font-bold text-gray-900">{metrics.totalAbsent}</p>
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
                                    <th className="px-6 py-4">Karyawan</th>
                                    <th className="px-6 py-4 text-center">Hadir</th>
                                    <th className="px-6 py-4 text-center">Terlambat</th>
                                    <th className="px-6 py-4 text-center">Alpa</th>
                                    <th className="px-6 py-4 text-right">Total Jam Kerja</th>
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
                                                <div className="font-semibold text-gray-900">{item.user?.username || "-"}</div>
                                                <div className="text-[11px] text-gray-400 capitalize">{item.employee?.position || "Staff"} - {item.employee?.department || "N/A"}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="font-bold text-green-700 bg-green-50 px-2 py-1 rounded">{item.totalPresent || 0}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded">{item.totalLate || 0}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="font-bold text-red-700 bg-red-50 px-2 py-1 rounded">{item.totalAbsent || 0}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <FaWalking className="text-gray-300" />
                                                    <span className="font-mono font-bold text-gray-900">{(item.totalWorkHours || 0).toFixed(1)}</span>
                                                    <span className="text-[11px] text-gray-400 uppercase">Jam</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-gray-400 font-medium italic">Tidak ada data absensi ditemukan</td>
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

export default UserAttendancesManagement;
