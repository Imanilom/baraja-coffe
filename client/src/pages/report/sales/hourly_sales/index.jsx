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
import SalesHourlySkeleton from "./skeleton";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const HourlySales = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // ✅ PERBAIKAN: Gunakan number, bukan array
    const [grandTotalItems, setGrandTotalItems] = useState(0);
    const [grandTotalPenjualan, setGrandTotalPenjualan] = useState(0);

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

    const [isExporting, setIsExporting] = useState(false);
    const [products, setProducts] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
            setDateRange({ startDate: startDateParam, endDate: endDateParam });
        } else {
            const today = dayjs().format('YYYY-MM-DD');
            setDateRange({ startDate: today, endDate: today });
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

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = {};

                if (dateRange?.startDate && dateRange?.endDate) {
                    params.startDate = dayjs(dateRange.startDate).format('YYYY-MM-DD');
                    params.endDate = dayjs(dateRange.endDate).format('YYYY-MM-DD');
                }

                if (selectedOutlet) params.outlet = selectedOutlet;

                const [salesResponse, outletsResponse] = await Promise.all([
                    axios.get('/api/report/hourly-profit/range', { params }),
                    axios.get('/api/outlet')
                ]);

                if (!salesResponse.data?.success || !outletsResponse.data?.success) {
                    throw new Error('Invalid response');
                }

                const hourlySalesData = salesResponse.data.data || [];
                const outletsData = outletsResponse.data.data || [];

                setProducts(hourlySalesData);
                setOutlets(outletsData);

                // ✅ Set grand totals dari metadata
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

        if (dateRange) fetchData();
    }, [dateRange, selectedOutlet]);

    // Handlers
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

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return products.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [products, currentPage]);

    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Export to Excel
    const exportToExcel = async () => {
        if (products.length === 0) {
            alert("Tidak ada data untuk diekspor");
            return;
        }

        setIsExporting(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const outletName = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet'
                : 'Semua Outlet';

            const startDate = dayjs(dateRange.startDate).format('DD-MM-YYYY');
            const endDate = dayjs(dateRange.endDate).format('DD-MM-YYYY');
            const dateRangeText = `${startDate} - ${endDate}`;

            // ✅ Gunakan grandTotalPenjualan, bukan grandTotalSales
            const rataRataTotal = grandTotalItems > 0
                ? Math.round(grandTotalPenjualan / grandTotalItems)
                : 0;

            const exportData = [
                { col1: 'Laporan Penjualan Per Jam', col2: '', col3: '', col4: '' },
                { col1: '', col2: '', col3: '', col4: '' },
                { col1: 'Outlet', col2: outletName, col3: '', col4: '' },
                { col1: 'Tanggal', col2: dateRangeText, col3: '', col4: '' },
                { col1: '', col2: '', col3: '', col4: '' },
                { col1: 'Waktu', col2: 'Jumlah Transaksi', col3: 'Penjualan', col4: 'Rata-Rata' }
            ];

            products.forEach(group => {
                const avgPerTransaction = group.count > 0
                    ? Math.round(group.grandTotalSum / group.count)
                    : 0;

                exportData.push({
                    col1: group.hour,
                    col2: group.count,
                    col3: group.grandTotalSum,
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

            ws['!cols'] = [
                { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }
            ];

            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Penjualan Per Jam");

            const fileName = `Laporan_Penjualan_Per_Jam_${outletName.replace(/\s+/g, '_')}_${startDate.replace(/\//g, '-')}_${endDate.replace(/\//g, '-')}.xlsx`;

            XLSX.writeFile(wb, fileName);
        } catch (error) {
            console.error("Error exporting to Excel:", error);
            alert("Gagal mengekspor data. Silakan coba lagi.");
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) return <SalesHourlySkeleton />;

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
        <div className="">
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <p>Laporan</p>
                    <FaChevronRight />
                    <Link to="/admin/sales-menu">Laporan Penjualan</Link>
                    <FaChevronRight />
                    <span>Penjualan Per Jam</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={isExporting || products.length === 0}
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

            <div className="px-6 pb-6">
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

                    <div className="flex flex-col col-span-5">
                        <Select
                            options={options}
                            value={options.find((opt) => opt.value === selectedOutlet) || options[0]}
                            onChange={handleOutletChange}
                            placeholder="Pilih outlet..."
                            className="text-[13px]"
                            classNamePrefix="react-select"
                            styles={customStyles}
                            isSearchable
                        />
                    </div>
                </div>

                <div className="overflow-x-auto rounded shadow-md bg-white shadow-slate-200">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal">Waktu</th>
                                <th className="px-4 py-3 font-normal text-right">Jumlah Transaksi</th>
                                <th className="px-4 py-3 font-normal text-right">Penjualan</th>
                                <th className="px-4 py-3 font-normal text-right">Rata-Rata</th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {paginatedData.map((group, index) => {
                                    const avgPerTransaction = group.count > 0
                                        ? Math.round(group.grandTotalSum / group.count)
                                        : 0;

                                    return (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">{group.hour}</td>
                                            <td className="px-4 py-3 text-right">{group.count}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(group.grandTotalSum)}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(avgPerTransaction)}</td>
                                        </tr>
                                    );
                                })}
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
                                        {grandTotalItems.toLocaleString()}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(grandTotalPenjualan)}
                                    </p>
                                </td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {grandTotalItems > 0
                                            ? formatCurrency(Math.round(grandTotalPenjualan / grandTotalItems))
                                            : formatCurrency(0)
                                        }
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

export default HourlySales;