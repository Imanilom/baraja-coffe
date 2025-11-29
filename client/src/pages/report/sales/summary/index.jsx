import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import Select from "react-select";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaDownload } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import SalesReportSkeleton from "./skeleton";
import { useSelector } from "react-redux";

const Summary = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { currentUser } = useSelector((state) => state.user);
    const navigate = useNavigate();

    // Fungsi helper untuk format tanggal lokal tanpa timezone offset
    const formatDateLocal = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const customStyles = {
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

    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState(null);

    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [dateRange, setDateRange] = useState(null);
    const [summaryData, setSummaryData] = useState({
        totalSales: 0,
        totalTransactions: 0,
        avgOrderValue: 0,
        totalTax: 0,
        totalServiceFee: 0,
        totalDiscount: 0,
        totalItems: 0
    });
    const [paymentBreakdown, setPaymentBreakdown] = useState([]);
    const [orderTypeBreakdown, setOrderTypeBreakdown] = useState([]);

    const dropdownRef = useRef(null);

    // Initialize from URL params or set default to today
    useEffect(() => {
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const outletParam = searchParams.get('outletId');

        if (startDateParam && endDateParam) {
            setDateRange({
                startDate: new Date(startDateParam),
                endDate: new Date(endDateParam),
            });
        } else {
            const today = new Date();
            setDateRange({
                startDate: today,
                endDate: today,
            });
        }

        if (outletParam) {
            setSelectedOutlet(outletParam);
        }
    }, []);

    // Update URL when filters change
    const updateURLParams = (newDateRange, newOutlet) => {
        const params = new URLSearchParams();

        if (newDateRange?.startDate && newDateRange?.endDate) {
            const startDate = formatDateLocal(newDateRange.startDate);
            const endDate = formatDateLocal(newDateRange.endDate);
            params.set('startDate', startDate);
            params.set('endDate', endDate);
        }

        if (newOutlet) {
            params.set('outletId', newOutlet);
        }

        setSearchParams(params);
    };

    // Fetch outlets data
    const fetchOutlets = async () => {
        try {
            const outletsResponse = await axios.get('/api/outlet');
            const outletsData = Array.isArray(outletsResponse.data) ?
                outletsResponse.data :
                (outletsResponse.data && Array.isArray(outletsResponse.data.data)) ?
                    outletsResponse.data.data : [];
            setOutlets(outletsData);
        } catch (err) {
            console.error("Error fetching outlets:", err);
            setOutlets([]);
        }
    };

    // Fetch sales summary from API
    const fetchSalesSummary = async () => {
        setLoading(true);
        try {
            const params = {};

            // Add date range
            if (dateRange?.startDate) {
                params.startDate = formatDateLocal(dateRange.startDate);
            }
            if (dateRange?.endDate) {
                params.endDate = formatDateLocal(dateRange.endDate);
            }

            // Add outlet filter
            if (selectedOutlet) {
                params.outletId = selectedOutlet;
            }

            const response = await axios.get('/api/report/sales/summary', { params });

            if (response.data.success) {
                const { summary, paymentMethodBreakdown, orderTypeBreakdown } = response.data.data;

                setSummaryData({
                    totalSales: summary.totalSales - summary.totalTax || 0,
                    totalTransactions: summary.totalTransactions || 0,
                    avgOrderValue: summary.avgOrderValue || 0,
                    totalTax: summary.totalTax || 0,
                    totalServiceFee: summary.totalServiceFee || 0,
                    totalDiscount: summary.totalDiscount || 0,
                    totalItems: summary.totalItems || 0
                });

                setPaymentBreakdown(paymentMethodBreakdown || []);
                setOrderTypeBreakdown(orderTypeBreakdown || []);
            }

            setError(null);
        } catch (err) {
            console.error("Error fetching sales summary:", err);
            setError("Failed to load sales summary. Please try again later.");
            // Reset data on error
            setSummaryData({
                totalSales: 0,
                totalTransactions: 0,
                avgOrderValue: 0,
                totalTax: 0,
                totalServiceFee: 0,
                totalDiscount: 0,
                totalItems: 0
            });
            setPaymentBreakdown([]);
            setOrderTypeBreakdown([]);
        } finally {
            setLoading(false);
        }
    };

    // Load outlets on mount
    useEffect(() => {
        fetchOutlets();
    }, []);

    // Fetch sales summary when filters change
    useEffect(() => {
        if (dateRange?.startDate && dateRange?.endDate) {
            fetchSalesSummary();
        }
    }, [dateRange, selectedOutlet]);

    const options = [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((o) => ({ value: o._id, label: o.name })),
    ];

    // Handle date range change
    const handleDateRangeChange = (newValue) => {
        setDateRange(newValue);
        updateURLParams(newValue, selectedOutlet);
    };

    // Handle outlet change
    const handleOutletChange = (selected) => {
        const newOutlet = selected.value;
        setSelectedOutlet(newOutlet);
        updateURLParams(dateRange, newOutlet);
    };

    // Calculate display values (Penjualan Kotor, Bersih, etc.)
    const calculatedValues = useMemo(() => {
        // Penjualan Kotor = Total Sales + Total Discount (karena discount sudah dikurangi)
        const penjualanKotor = summaryData.totalSales + summaryData.totalDiscount;

        // Penjualan Bersih = Total Sales (sudah setelah discount)
        const penjualanBersih = summaryData.totalSales;

        // Total Penjualan = Penjualan Bersih + Service Fee + Tax
        const totalPenjualan = penjualanBersih + summaryData.totalServiceFee + summaryData.totalTax;

        return {
            penjualanKotor,
            diskonTotal: summaryData.totalDiscount,
            penjualanBersih,
            serviceCharge: summaryData.totalServiceFee,
            pajak: summaryData.totalTax,
            totalPenjualan
        };
    }, [summaryData]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Export current data to Excel
    const exportToExcel = async () => {
        setIsExporting(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const outletName = selectedOutlet
                ? outlets.find(o => o._id === selectedOutlet)?.name || 'Semua Outlet'
                : 'Semua Outlet';

            const dateRangeText = dateRange && dateRange.startDate && dateRange.endDate
                ? `${new Date(dateRange.startDate).toLocaleDateString('id-ID')} - ${new Date(dateRange.endDate).toLocaleDateString('id-ID')}`
                : 'Semua Tanggal';

            const exportData = [
                { col1: 'Laporan Ringkasan Penjualan', col2: '' },
                { col1: '', col2: '' },
                { col1: 'Outlet', col2: outletName },
                { col1: 'Tanggal', col2: dateRangeText },
                { col1: '', col2: '' },
                { col1: '', col2: 'Total Nominal (Rp)' },
                { col1: 'Penjualan Kotor', col2: calculatedValues.penjualanKotor },
                { col1: 'Total Diskon', col2: calculatedValues.diskonTotal },
                { col1: 'Penjualan Bersih', col2: calculatedValues.penjualanBersih },
                { col1: 'Service Charge', col2: calculatedValues.serviceCharge },
                { col1: 'Pajak', col2: calculatedValues.pajak },
                { col1: 'Total Penjualan', col2: calculatedValues.totalPenjualan },
                { col1: '', col2: '' },
                { col1: 'Total Transaksi', col2: summaryData.totalTransactions },
                { col1: 'Total Item Terjual', col2: summaryData.totalItems },
                { col1: 'Rata-rata Nilai Transaksi', col2: summaryData.avgOrderValue },
            ];

            const ws = XLSX.utils.json_to_sheet(exportData, {
                header: ['col1', 'col2'],
                skipHeader: true
            });

            ws['!cols'] = [
                { wch: 25 },
                { wch: 20 }
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Laporan Ringkasan");

            const startDate = new Date(dateRange.startDate).toLocaleDateString('id-ID').replace(/\//g, '-');
            const endDate = new Date(dateRange.endDate).toLocaleDateString('id-ID').replace(/\//g, '-');
            const filename = `Laporan_Ringkasan_${outletName}_${startDate}_${endDate}.xlsx`;

            XLSX.writeFile(wb, filename);
        } catch (error) {
            console.error("Error exporting to Excel:", error);
            alert("Gagal mengekspor data. Silakan coba lagi.");
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) {
        return <SalesReportSkeleton />;
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p>{error}</p>
                    <button
                        onClick={fetchSalesSummary}
                        className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-[30px]">
            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <span>Laporan</span>
                    <FaChevronRight />
                    <Link to="/admin/sales-menu">Laporan Penjualan</Link>
                    <FaChevronRight />
                    <span>Ringkasan</span>
                </h1>
                <button
                    onClick={exportToExcel}
                    disabled={isExporting}
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
                        <Select
                            options={options}
                            value={
                                selectedOutlet
                                    ? options.find((opt) => opt.value === selectedOutlet)
                                    : options[0]
                            }
                            onChange={handleOutletChange}
                            placeholder="Pilih outlet..."
                            className="text-[13px]"
                            classNamePrefix="react-select"
                            styles={customStyles}
                            isSearchable
                        />
                    </div>
                </div>

                {/* Summary Stats Cards */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-white p-4 rounded shadow-md">
                        <p className="text-gray-500 text-sm">Total Transaksi</p>
                        <p className="text-2xl font-bold text-green-900">{summaryData.totalTransactions}</p>
                    </div>
                    <div className="bg-white p-4 rounded shadow-md">
                        <p className="text-gray-500 text-sm">Total Item Terjual</p>
                        <p className="text-2xl font-bold text-green-900">{summaryData.totalItems}</p>
                    </div>
                    <div className="bg-white p-4 rounded shadow-md">
                        <p className="text-gray-500 text-sm">Rata-rata Nilai Transaksi</p>
                        <p className="text-2xl font-bold text-green-900">{formatCurrency(summaryData.avgOrderValue)}</p>
                    </div>
                </div>

                {/* Main Summary Table */}
                <div className="overflow-x-auto rounded shadow-md shadow-slate-200 bg-white mb-4">
                    <table className="min-w-full table-auto">
                        <tbody className="text-sm text-gray-400">
                            <tr>
                                <td className="font-medium text-gray-500 p-[15px]">Penjualan Kotor</td>
                                <td className="text-right p-[15px]">{formatCurrency(calculatedValues.penjualanKotor)}</td>
                            </tr>
                            <tr>
                                <td className="font-medium text-gray-500 p-[15px]">Total Diskon</td>
                                <td className="text-right p-[15px]">{formatCurrency(calculatedValues.diskonTotal)}</td>
                            </tr>
                            <tr>
                                <td className="font-medium text-gray-500 p-[15px]">Penjualan Bersih</td>
                                <td className="text-right p-[15px]">{formatCurrency(calculatedValues.penjualanBersih)}</td>
                            </tr>
                            <tr>
                                <td className="font-medium text-gray-500 p-[15px]">Service Charge</td>
                                <td className="text-right p-[15px]">{formatCurrency(calculatedValues.serviceCharge)}</td>
                            </tr>
                            <tr>
                                <td className="font-medium text-gray-500 p-[15px]">Pajak</td>
                                <td className="text-right p-[15px]">{formatCurrency(calculatedValues.pajak)}</td>
                            </tr>
                        </tbody>
                        <tfoot className="font-semibold text-sm border-t">
                            <tr>
                                <td className="p-[15px]">Total Penjualan</td>
                                <td className="p-[15px] text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(calculatedValues.totalPenjualan)}
                                    </p>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Payment Method Breakdown */}
                {paymentBreakdown.length > 0 && (
                    <div className="overflow-x-auto rounded shadow-md shadow-slate-200 bg-white mb-4">
                        <h3 className="font-semibold text-gray-700 p-4 border-b">Rincian Metode Pembayaran</h3>
                        <table className="min-w-full table-auto">
                            <thead className="bg-gray-50">
                                <tr className="text-sm text-gray-600">
                                    <th className="p-[15px] text-left">Metode Pembayaran</th>
                                    <th className="p-[15px] text-right">Jumlah Transaksi</th>
                                    <th className="p-[15px] text-right">Total Nominal</th>
                                    <th className="p-[15px] text-right">Persentase</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-400">
                                {paymentBreakdown.map((item, index) => (
                                    <tr key={index} className="border-t">
                                        <td className="font-medium text-gray-500 p-[15px]">{item.method}</td>
                                        <td className="text-right p-[15px]">{item.count}</td>
                                        <td className="text-right p-[15px]">{formatCurrency(item.amount)}</td>
                                        <td className="text-right p-[15px]">{item.percentage}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Order Type Breakdown */}
                {orderTypeBreakdown.length > 0 && (
                    <div className="overflow-x-auto rounded shadow-md shadow-slate-200 bg-white">
                        <h3 className="font-semibold text-gray-700 p-4 border-b">Rincian Tipe Pesanan</h3>
                        <table className="min-w-full table-auto">
                            <thead className="bg-gray-50">
                                <tr className="text-sm text-gray-600">
                                    <th className="p-[15px] text-left">Tipe Pesanan</th>
                                    <th className="p-[15px] text-right">Jumlah Transaksi</th>
                                    <th className="p-[15px] text-right">Total Nominal</th>
                                    <th className="p-[15px] text-right">Persentase</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-400">
                                {orderTypeBreakdown.map((item, index) => (
                                    <tr key={index} className="border-t">
                                        <td className="font-medium text-gray-500 p-[15px]">{item.type}</td>
                                        <td className="text-right p-[15px]">{item.count}</td>
                                        <td className="text-right p-[15px]">{formatCurrency(item.total)}</td>
                                        <td className="text-right p-[15px]">{item.percentage}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Summary;