import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaDownload } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import dayjs from "dayjs";
import Paginated from "../../../../components/paginated";
import SalesOutletSkeleton from "./skeleton";
import { exportOutletSalesExcel } from '../../../../utils/exportOutletSalesExcel';

const OutletSales = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: '#d1d5db',
            minHeight: '34px',
            fontSize: '13px',
            color: '#6b7280',
            boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none',
            '&:hover': { borderColor: '#9ca3af' },
        }),
        singleValue: (provided) => ({ ...provided, color: '#6b7280' }),
        input: (provided) => ({ ...provided, color: '#6b7280' }),
        placeholder: (provided) => ({ ...provided, color: '#9ca3af', fontSize: '13px' }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '13px',
            color: '#374151',
            backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white',
            cursor: 'pointer',
        }),
    };

    const [outlets, setOutlets] = useState([]);
    const [salesData, setSalesData] = useState([]);
    const [allSalesData, setAllSalesData] = useState([]); // Untuk export
    const [grandTotals, setGrandTotals] = useState({
        totalOutlets: 0,
        totalTransactions: 0,
        totalSales: 0,
        averagePerTransaction: 0
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        itemsPerPage: 50,
        totalItems: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [dateRange, setDateRange] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Initialize from URL params
    useEffect(() => {
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const outletParam = searchParams.get('outletId');
        const pageParam = searchParams.get('page');

        if (startDateParam && endDateParam) {
            setDateRange({
                startDate: startDateParam,
                endDate: endDateParam,
            });
        } else {
            const today = dayjs().format('YYYY-MM-DD');
            setDateRange({
                startDate: today,
                endDate: today
            });
        }

        if (outletParam) setSelectedOutlet(outletParam);
        if (pageParam) setCurrentPage(parseInt(pageParam, 10));
    }, [searchParams]);

    // Fetch outlets (hanya sekali)
    useEffect(() => {
        const fetchOutlets = async () => {
            try {
                const response = await axios.get('/api/outlet');
                const outletsData = Array.isArray(response.data)
                    ? response.data
                    : Array.isArray(response.data?.data)
                        ? response.data.data
                        : [];
                setOutlets(outletsData);
            } catch (err) {
                console.error("Error fetching outlets:", err);
            }
        };
        fetchOutlets();
    }, []);

    // Fetch sales data dengan agregasi
    const fetchSalesData = useCallback(async () => {
        if (!dateRange?.startDate || !dateRange?.endDate) return;

        setLoading(true);
        try {
            const params = {
                startDate: dayjs(dateRange.startDate).format('YYYY-MM-DD'),
                endDate: dayjs(dateRange.endDate).format('YYYY-MM-DD'),
                page: currentPage,
                limit: 50
            };

            if (selectedOutlet) {
                params.outletId = selectedOutlet;
            }

            const response = await axios.get('/api/report/sales-report/transaction-outlet', { params });

            if (response.data.success) {
                setSalesData(response.data.data.items);
                setAllSalesData(response.data.data.allData); // Simpan semua data untuk export
                setGrandTotals(response.data.data.grandTotal);
                setPagination(response.data.data.pagination);
            }
            setError(null);
        } catch (err) {
            console.error("Error fetching sales data:", err);
            setError("Gagal memuat data penjualan. Silakan coba lagi.");
            setSalesData([]);
            setAllSalesData([]);
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedOutlet, currentPage]);

    // Fetch data ketika filter berubah
    useEffect(() => {
        fetchSalesData();
    }, [fetchSalesData]);

    // Update URL params
    const updateURLParams = useCallback((newDateRange, newOutlet, newPage) => {
        const params = new URLSearchParams();

        if (newDateRange?.startDate && newDateRange?.endDate) {
            params.set('startDate', dayjs(newDateRange.startDate).format('YYYY-MM-DD'));
            params.set('endDate', dayjs(newDateRange.endDate).format('YYYY-MM-DD'));
        }

        if (newOutlet) params.set('outletId', newOutlet);
        if (newPage && newPage > 1) params.set('page', newPage.toString());

        setSearchParams(params);
    }, [setSearchParams]);

    // Handler functions
    const handleDateRangeChange = (newValue) => {
        setDateRange(newValue);
        setCurrentPage(1);
        updateURLParams(newValue, selectedOutlet, 1);
    };

    const handleOutletChange = (selected) => {
        const newOutlet = selected?.value || "";
        setSelectedOutlet(newOutlet);
        setCurrentPage(1);
        updateURLParams(dateRange, newOutlet, 1);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        updateURLParams(dateRange, selectedOutlet, newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const options = useMemo(() => [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((o) => ({ value: o._id, label: o.name })),
    ], [outlets]);

    // Export to Excel - menggunakan allSalesData yang sudah ada
    const exportToExcel = async () => {
        if (allSalesData.length === 0) {
            alert('Tidak ada data untuk di-export');
            return;
        }

        const outletName = selectedOutlet
            ? outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet'
            : 'Semua Outlet';

        const startDate = dayjs(dateRange.startDate).format('DD-MM-YYYY');
        const endDate = dayjs(dateRange.endDate).format('DD-MM-YYYY');
        const periodText = `${dayjs(dateRange.startDate).format('DD MMMM YYYY')} - ${dayjs(dateRange.endDate).format('DD MMMM YYYY')}`;

        await exportOutletSalesExcel({
            data: allSalesData,
            grandTotals,
            fileName: `Laporan_Penjualan_Per_Outlet_${startDate}_${endDate}.xlsx`,
            headerInfo: [
                ['Periode', periodText],
                ['Outlet', outletName],
                ['Tanggal Export', dayjs().format('DD MMMM YYYY HH:mm')]
            ]
        });
    };

    if (loading) {
        return <SalesOutletSkeleton />;
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p>{error}</p>
                    <button
                        onClick={fetchSalesData}
                        className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="">
            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <span>Laporan</span>
                    <FaChevronRight />
                    <Link to="/admin/sales-menu">Laporan Penjualan</Link>
                    <FaChevronRight />
                    <span>Penjualan Per Outlet</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={allSalesData.length === 0}
                    className="flex gap-2 items-center bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FaDownload /> Ekspor Excel
                </button>
            </div>

            {/* Filters */}
            <div className="px-6">
                <div className="flex justify-between py-3 gap-2">
                    <div className="flex flex-col col-span-5 w-2/5">
                        <div className="relative text-gray-500">
                            <Datepicker
                                showFooter
                                showShortcuts
                                value={dateRange}
                                onChange={handleDateRangeChange}
                                displayFormat="DD-MM-YYYY"
                                inputClassName="w-full text-[13px] border py-2 pr-[25px] pl-[12px] rounded cursor-pointer"
                                popoverDirection="down"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col col-span-5 w-1/5">
                        <div className="relative text-[13px]">
                            <Select
                                options={options}
                                value={options.find((opt) => opt.value === selectedOutlet) || options[0]}
                                onChange={handleOutletChange}
                                placeholder="Cari outlet..."
                                isSearchable
                                className="text-[13px]"
                                classNamePrefix="react-select"
                                styles={customStyles}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-md bg-white shadow-slate-200">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal">Outlet</th>
                                <th className="px-4 py-3 font-normal text-right">Jumlah Transaksi</th>
                                <th className="px-4 py-3 font-normal text-right">Penjualan</th>
                                <th className="px-4 py-3 font-normal text-right">Rata-Rata</th>
                            </tr>
                        </thead>
                        {salesData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {salesData.map((group, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">{group.outletName}</td>
                                        <td className="px-4 py-3 text-right">{group.count.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(group.subtotalTotal)}</td>
                                        <td className="px-4 py-3 text-right">
                                            {formatCurrency(Math.round(group.averagePerTransaction))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr className="py-6 text-center w-full h-96">
                                    <td colSpan={4}>Tidak ada data ditemukan</td>
                                </tr>
                            </tbody>
                        )}

                        <tfoot className="border-t font-semibold text-sm">
                            <tr>
                                <td className="px-4 py-2">Grand Total</td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {grandTotals.totalTransactions.toLocaleString()}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(grandTotals.totalSales)}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(Math.round(grandTotals.averagePerTransaction))}
                                    </p>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Pagination Controls */}
                <Paginated
                    currentPage={currentPage}
                    setCurrentPage={handlePageChange}
                    totalPages={pagination.totalPages}
                />
            </div>
        </div>
    );
};

export default OutletSales;