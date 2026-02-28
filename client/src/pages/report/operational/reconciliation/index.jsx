import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaClipboardList, FaChevronRight, FaBell, FaUser } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Header from "../../../admin/header";
import dayjs from "dayjs";
import Paginated from "../../../../components/paginated";

const Reconciliation = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [cashflow, setCashflow] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [value, setValue] = useState({
        startDate: dayjs(),
        endDate: dayjs()
    });
    const [filteredData, setFilteredData] = useState([]);

    // Safety function to ensure we're always working with arrays
    const ensureArray = (data) => Array.isArray(data) ? data : [];
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const dropdownRef = useRef(null);

    // Fetch cashflow and outlets data
    const fetchCashflow = async () => {
        setLoading(true);
        try {
            // Fetch cashflow data
            const cashflowResponse = await axios.get("/api/marketlist/cashflow", {
                headers: {
                    Authorization: `Bearer ${currentUser.token}`,
                },
            });
            const cashflowData = cashflowResponse.data.data ? cashflowResponse.data.data : cashflowResponse.data;

            setCashflow(cashflowData || []);
            setFilteredData(cashflowData || []);

            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load data. Please try again later.");
            // Set empty arrays as fallback
            setCashflow([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCashflow();
    }, []);

    const formatDateTime = (datetime) => {
        const date = new Date(datetime);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    // Handle click outside dropdown to close
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowInput(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const totalCashIn = filteredData.reduce((sum, item) => sum + (item.cashIn || 0), 0);
    const totalCashOut = filteredData.reduce((sum, item) => {
        const items = item.relatedMarketList?.items || [];
        const expenses = item.relatedMarketList?.additionalExpenses || [];
        const itemsTotal = items.reduce((s, itm) => s + (itm.amountCharged || 0), 0);
        const expensesTotal = expenses.reduce((s, exp) => s + (exp.amount || 0), 0);
        return sum + itemsTotal + expensesTotal;
    }, 0);

    const paginatedData = useMemo(() => {

        // Ensure filteredData is an array before calling slice
        if (!Array.isArray(filteredData)) {
            console.error('filteredData is not an array:', filteredData);
            return [];
        }

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const result = filteredData.slice(startIndex, endIndex);
        return result;
    }, [currentPage, filteredData]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    // Apply filter function
    const applyFilter = async () => {
        console.log("=== APPLY FILTER STARTED ===");
        console.log("Current value:", value);

        try {
            if (value && value.startDate && value.endDate) {
                // Format tanggal untuk backend
                const start = new Date(value.startDate).toISOString().split("T")[0];
                const end = new Date(value.endDate).toISOString().split("T")[0];

                console.log("Filter dates:", { start, end });
                console.log("API URL:", `/api/marketlist/cashflow?start=${start}&end=${end}`);

                // Kirim request ke endpoint API dengan query parameter
                const res = await axios.get(`/api/marketlist/cashflow`, {
                    params: {
                        start,
                        end
                    },
                    headers: {
                        Authorization: `Bearer ${currentUser.token}`,
                    },
                });

                console.log("API Response status:", res.status);
                console.log("Response data:", res.data);

                // Konsisten dengan fetchCashflow - handle res.data.data atau res.data
                const cashflowData = res.data.data ? res.data.data : res.data;
                console.log("Processed cashflowData length:", cashflowData?.length);
                console.log("Data before filter:", cashflow.length);
                console.log("Data after filter:", cashflowData?.length);

                // Tampilkan beberapa sample data untuk debugging
                if (cashflowData && cashflowData.length > 0) {
                    console.log("First item:", {
                        date: cashflowData[0]?.date,
                        day: cashflowData[0]?.day,
                        cashIn: cashflowData[0]?.cashIn
                    });
                    console.log("Last item:", {
                        date: cashflowData[cashflowData.length - 1]?.date,
                        day: cashflowData[cashflowData.length - 1]?.day,
                        cashIn: cashflowData[cashflowData.length - 1]?.cashIn
                    });
                }

                setFilteredData(cashflowData || []);
                setCurrentPage(1);
                console.log("✅ Filter applied successfully");
            } else {
                console.log("⚠️ No date range selected, fetching all data");

                // fallback kalau tidak ada filter
                const res = await axios.get(`/api/marketlist/cashflow`, {
                    headers: {
                        Authorization: `Bearer ${currentUser.token}`,
                    },
                });

                const cashflowData = res.data.data ? res.data.data : res.data;
                console.log("Fetched all data, length:", cashflowData?.length);

                setFilteredData(cashflowData || []);
                setCurrentPage(1);
                console.log("✅ All data fetched successfully");
            }
        } catch (err) {
            console.error("❌ Error fetching filtered data:", err);
            console.error("Error details:", {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            setFilteredData([]);
        }

        console.log("=== APPLY FILTER ENDED ===\n");
    };

    // Export current data to Excel
    const exportToExcel = () => {
        // Prepare data for export
        const dataToExport = filteredData.flatMap(cf => {
            const rows = [];

            // Add CashIn row if exists
            if (cf.cashIn > 0) {
                rows.push({
                    "Waktu": `${cf.day}, ${formatDateTime(cf.date)}`,
                    "Uang Masuk": cf.cashIn,
                    "Uang Keluar": 0,
                    "Keterangan": cf.description,
                    "Status": "-"
                });
            }

            // Add CashOut rows
            const items = cf.relatedMarketList?.items?.map((itm) => ({
                "Waktu": `${cf.day}, ${formatDateTime(cf.date)}`,
                "Uang Masuk": 0,
                "Uang Keluar": itm.amountCharged,
                "Keterangan": `Belanja: ${itm.productName}`,
                "Status": itm.payment?.status || "-"
            })) || [];

            const expenses = cf.relatedMarketList?.additionalExpenses?.map((exp) => ({
                "Waktu": `${cf.day}, ${formatDateTime(cf.date)}`,
                "Uang Masuk": 0,
                "Uang Keluar": exp.amount,
                "Keterangan": `Pengeluaran Lain: ${exp.name}`,
                "Status": exp.payment?.status || "-"
            })) || [];

            return [...rows, ...items, ...expenses];
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rekap Kas");
        XLSX.writeFile(wb, "Rekap_Kas.xlsx");
    };

    // Show loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

    // Show error state
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
            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <div className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <p>Laporan</p>
                    <FaChevronRight />
                    <Link to="/admin/operational-menu">
                        Laporan Operasional
                    </Link>
                    <FaChevronRight />
                    <span>
                        Rekap Kas
                    </span>
                </div>
                <button
                    onClick={exportToExcel}
                    className="bg-[#005429] text-white text-sm px-4 py-2 rounded w-full sm:w-auto"
                >
                    Ekspor
                </button>
            </div>

            {/* Filters */}
            <div className="px-6">
                <div className="flex flex-wrap gap-4 md:justify-between items-center py-3">

                    {/* Tanggal */}
                    <div className="flex flex-col col-span-2 w-2/5">
                        <div className="relative text-gray-500">
                            <Datepicker
                                showFooter
                                showShortcuts
                                value={value}
                                onChange={setValue}
                                displayFormat="DD-MM-YYYY"
                                inputClassName="w-full text-[13px] border py-[8px] pr-[25px] pl-[12px] rounded cursor-pointer"
                                popoverDirection="down"
                            />
                        </div>
                    </div>

                    {/* Spacer */}
                    <div className="hidden lg:block col-span-5"></div>

                    {/* Buttons */}
                    <div className="flex lg:justify-end space-x-2 items-end col-span-1">
                        <button
                            type="button"
                            onClick={applyFilter}
                            className="w-full sm:w-auto bg-[#005429] border text-white text-[13px] px-[15px] py-[8px] rounded"
                        >
                            Terapkan
                        </button>
                        <button
                            onClick={() => {
                                setValue({
                                    startDate: dayjs(),
                                    endDate: dayjs()
                                });
                                fetchCashflow();
                            }}
                            className="w-full sm:w-auto text-[#005429] hover:text-white hover:bg-[#005429] border border-[#005429] text-[13px] px-[15px] py-[8px] rounded"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded shadow-md bg-white shadow-slate-200 overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead className="text-sm text-gray-400">
                            <tr>
                                <th className="px-4 py-3 text-left font-normal">Waktu</th>
                                <th className="px-4 py-3 text-right font-normal">Uang Masuk</th>
                                <th className="px-4 py-3 text-right font-normal">Uang Keluar</th>
                                <th className="px-4 py-3 text-left font-normal">Keterangan</th>
                                <th className="px-4 py-3 text-left font-normal">Status</th>
                            </tr>
                        </thead>
                        {filteredData.length > 0 ? (
                            <tbody className="text-sm">
                                {filteredData.map((cf) => {
                                    const items =
                                        cf.relatedMarketList?.items?.map((itm) => ({
                                            name: itm.productName,
                                            amount: itm.amountCharged,
                                            status: itm.payment?.status,
                                            method: itm.payment?.method,
                                            type: "Belanja",
                                        })) || [];

                                    const expenses =
                                        cf.relatedMarketList?.additionalExpenses?.map((exp) => ({
                                            name: exp.name,
                                            amount: exp.amount,
                                            status: exp.payment?.status,
                                            method: exp.payment?.method,
                                            type: "Pengeluaran Lain",
                                        })) || [];

                                    const allCashOuts = [...items, ...expenses];

                                    return (
                                        <React.Fragment key={cf._id}>
                                            {/* Baris CashIn hanya muncul kalau > 0 */}
                                            {cf.cashIn > 0 && (
                                                <tr className="hover:bg-gray-50 text-gray-600 font-medium bg-gray-100">
                                                    <td className="px-4 py-3">
                                                        {cf.day}, {formatDateTime(cf.date)}
                                                    </td>
                                                    <td className="px-4 text-right py-3">{formatCurrency(cf.cashIn)}</td>
                                                    <td className="px-4 text-right py-3">-</td>
                                                    <td className="px-4 py-3">{cf.description}</td>
                                                    <td className="px-4 py-3">-</td>
                                                </tr>
                                            )}

                                            {/* Baris CashOut */}
                                            {allCashOuts.map((out, i) => (
                                                <tr
                                                    key={`${cf._id}-${out.name}-${i}`}
                                                    className="hover:bg-gray-50 text-gray-600"
                                                >
                                                    <td className="px-4 py-3">
                                                        {cf.day}, {formatDateTime(cf.date)}
                                                    </td>
                                                    <td className="px-4 text-right py-3">-</td>
                                                    <td className="px-4 text-right py-3">
                                                        {formatCurrency(out.amount)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {out.type}: {out.name}
                                                    </td>
                                                    <td className="px-4 py-3">{out.status || "-"}</td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-gray-500">
                                        DATA TIDAK DITEMUKAN
                                    </td>
                                </tr>
                            </tbody>
                        )}

                        <tfoot className="border-t font-semibold text-sm bg-gray-50">
                            <tr>
                                <td className="px-4 py-3">
                                    Total
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(totalCashIn)}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className="bg-gray-100 inline-block px-2 py-[2px] rounded-full">
                                        {formatCurrency(totalCashOut)}
                                    </span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
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