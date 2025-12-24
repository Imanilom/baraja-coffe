import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { Link, useSearchParams } from "react-router-dom";
import { FaChevronRight, FaDownload } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Select from "react-select";
import Paginated from "../../../../components/paginated";
import DailySalesSkeleton from "./skeleton";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const DailySales = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [products, setProducts] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [grandTotalItems, setGrandTotalItems] = useState([]);
    const [grandTotalPenjualan, setGrandTotalPenjualan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [dateRange, setDateRange] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const ITEMS_PER_PAGE = 50;

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
                endDate: today,
            });
        }

        if (outletParam) setSelectedOutlet(outletParam);
        if (pageParam) setCurrentPage(parseInt(pageParam, 10));
    }, [searchParams]);

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

    // Fetch data dengan filter langsung di backend
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = {
                    // Tidak perlu mode lagi, ini dedicated endpoint
                };

                // Kirim filter ke backend
                if (dateRange?.startDate && dateRange?.endDate) {
                    params.startDate = dayjs(dateRange.startDate).format('YYYY-MM-DD');
                    params.endDate = dayjs(dateRange.endDate).format('YYYY-MM-DD');
                }

                if (selectedOutlet) {
                    params.outlet = selectedOutlet;
                }

                const [salesResponse, outletsResponse] = await Promise.all([
                    axios.get('/api/report/daily-profit/range', { params }), // ✅ Endpoint baru!
                    axios.get('/api/outlet')
                ]);

                if (!salesResponse.data?.success || !outletsResponse.data?.success) {
                    throw new Error('Invalid response');
                }

                // Data sudah di-group dan di-sort oleh backend!
                const dailySalesData = salesResponse.data.data || [];
                const outletsData = outletsResponse.data.data || [];

                // Langsung set, tidak perlu grouping lagi!
                setProducts(dailySalesData);
                setOutlets(outletsData);

                // Set grand totals dari metadata
                setGrandTotalItems(salesResponse.data.metadata?.grandTotalItems || 0);
                setGrandTotalPenjualan(salesResponse.data.metadata?.grandTotalPenjualan || 0);

                setError(null);

            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.response?.data?.message || err.message || "Failed to load data");
                setProducts([]);
                setOutlets([]);
            } finally {
                setLoading(false);
            }
        };

        if (dateRange) {
            fetchData();
        }
    }, [dateRange, selectedOutlet]);

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

    const options = useMemo(() => [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((o) => ({ value: o._id, label: o.name })),
    ], [outlets]);

    // Group data by date - Optimized dengan Map
    const groupedArray = useMemo(() => {
        const grouped = new Map();

        products.forEach(product => {
            const date = dayjs(product.createdAt).format('DD-MM-YYYY');
            const penjualan = Number(product.grandTotal) || 0;

            if (!grouped.has(date)) {
                grouped.set(date, {
                    count: 0,
                    penjualanTotal: 0,
                    timestamp: product.createdAt
                });
            }

            const data = grouped.get(date);
            data.count++;
            data.penjualanTotal += penjualan;
        });

        // Convert to array and sort
        return Array.from(grouped.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [products]);

    // Paginate data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return products.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [products, currentPage]);

    const totalPages = Math.ceil(groupedArray.length / ITEMS_PER_PAGE);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Export to Excel
    const exportToExcel = () => {
        if (groupedArray.length === 0) {
            alert("Tidak ada data untuk diekspor");
            return;
        }

        setIsExporting(true);

        try {
            const outletName = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet'
                : 'Semua Outlet';

            const startDate = dayjs(dateRange.startDate).format('DD-MM-YYYY');
            const endDate = dayjs(dateRange.endDate).format('DD-MM-YYYY');
            const rataRataTotal = grandTotalItems > 0 ? Math.round(grandTotalPenjualan / grandTotalItems) : 0;

            const exportData = [
                { col1: 'Laporan Penjualan Harian', col2: '', col3: '', col4: '' },
                { col1: '', col2: '', col3: '', col4: '' },
                { col1: 'Outlet', col2: outletName, col3: '', col4: '' },
                { col1: 'Tanggal', col2: `${startDate} - ${endDate}`, col3: '', col4: '' },
                { col1: '', col2: '', col3: '', col4: '' },
                { col1: 'Tanggal', col2: 'Jumlah Transaksi', col3: 'Penjualan', col4: 'Rata-Rata' }
            ];

            groupedArray.forEach(group => {
                const avgPerTransaction = group.count > 0 ? Math.round(group.penjualanTotal / group.count) : 0;
                exportData.push({
                    col1: group.date,
                    col2: group.count,
                    col3: group.penjualanTotal,
                    col4: avgPerTransaction
                });
            });

            exportData.push({
                col1: 'Grand Total',
                col2: grandTotalItems,
                col3: grandTotalPenjualan,
                col4: rataRataTotal
            });

            const ws = XLSX.utils.json_to_sheet(exportData, {
                header: ['col1', 'col2', 'col3', 'col4'],
                skipHeader: true
            });

            ws['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }];
            ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Penjualan Harian");

            const fileName = `Laporan_Penjualan_Harian_${outletName.replace(/\s+/g, '_')}_${startDate.replace(/\//g, '-')}_${endDate.replace(/\//g, '-')}.xlsx`;
            XLSX.writeFile(wb, fileName);

        } catch (error) {
            console.error("Error exporting:", error);
            alert("Gagal mengekspor data");
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) return <DailySalesSkeleton />;

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
        <div>
            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <div className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <span>Laporan</span>
                    <FaChevronRight />
                    <Link to="/admin/sales-menu">Laporan Penjualan</Link>
                    <FaChevronRight />
                    <span>Penjualan Harian</span>
                </div>
                <button
                    onClick={exportToExcel}
                    disabled={isExporting || groupedArray.length === 0}
                    className="bg-green-900 text-white text-[13px] px-[15px] py-[7px] rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isExporting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            Mengekspor...
                        </>
                    ) : (
                        <>
                            <FaDownload /> Ekspor Excel
                        </>
                    )}
                </button>
            </div>

            {/* Filters */}
            <div className="px-6">
                <div className="flex justify-between py-3 gap-2">
                    <div className="w-2/5">
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

                    <div className="flex-1">
                        <Select
                            options={options}
                            value={options.find((opt) => opt.value === selectedOutlet) || options[0]}
                            onChange={handleOutletChange}
                            placeholder="Pilih outlet..."
                            className="text-[13px]"
                            isSearchable
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-md bg-white shadow-slate-200">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal">Tanggal</th>
                                <th className="px-4 py-3 font-normal text-right">Jumlah Transaksi</th>
                                <th className="px-4 py-3 font-normal text-right">Penjualan</th>
                                <th className="px-4 py-3 font-normal text-right">Rata-Rata</th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {paginatedData.map((group, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">{group.date}</td>
                                        <td className="px-4 py-3 text-right">{group.count.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(group.penjualanTotal)}</td>
                                        <td className="px-4 py-3 text-right">
                                            {formatCurrency(group.count > 0 ? group.penjualanTotal / group.count : 0)}
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
                                <td className="px-2 py-2 text-right">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {grandTotalItems.toLocaleString('id-ID')}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(grandTotalPenjualan)}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(grandTotalItems > 0 ? grandTotalPenjualan / grandTotalItems : 0)}
                                    </p>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <Paginated
                    currentPage={currentPage}
                    setCurrentPage={handlePageChange}
                    totalPages={totalPages}
                />
            </div>
        </div>
    );
};

export default DailySales;