import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaClipboardList, FaChevronRight, FaBell, FaUser } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import Header from "../../../admin/header";
import dayjs from "dayjs";

const Reconciliation = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [cashflow, setCashflow] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showInput, setShowInput] = useState(false);
    const [search, setSearch] = useState("");
    const [tempSelectedOutlet, setTempSelectedOutlet] = useState("");
    const [value, setValue] = useState({
        startDate: dayjs(),
        endDate: dayjs()
    });
    const [tempSearch, setTempSearch] = useState("");
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

    const totalCashIn = filteredData.reduce((sum, item) => sum + item.cashIn, 0);
    const totalCashOut = filteredData.reduce((sum, item) => sum + item.cashOut, 0);


    // Apply filter function
    const applyFilter = async () => {
        try {
            if (value && value.startDate && value.endDate) {
                const start = new Date(value.startDate).toISOString().split("T")[0]; // YYYY-MM-DD
                const end = new Date(value.endDate).toISOString().split("T")[0]; // YYYY-MM-DD

                // Kirim request ke endpoint API dengan query parameter
                const res = await axios.get(`/api/marketlist/cashflow`, {
                    params: { start, end },
                    headers: {
                        Authorization: `Bearer ${currentUser.token}`,
                    },
                });

                // Respon dari API langsung dipakai untuk data
                setFilteredData(res.data);
                setCurrentPage(1); // reset ke halaman pertama
            } else {
                // fallback kalau tidak ada filter
                const res = await axios.get(`/api/marketlist/cashflow`, {
                    headers: {
                        Authorization: `Bearer ${currentUser.token}`,
                    },
                });

                setFilteredData(res.data);
                setCurrentPage(1);
            }
        } catch (err) {
            console.error("Error fetching filtered data:", err);
        }
    };

    // Reset filters
    const resetFilter = () => {
        setTempSearch("");
        setTempSelectedOutlet("");
        setValue(null);
        setSearch("");
        setFilteredData(ensureArray(cashflow));
        setCurrentPage(1);
    };

    // Export current data to Excel
    const exportToExcel = () => {
        // Prepare data for export
        const dataToExport = filteredData.map(product => {
            const item = product.items?.[0] || {};
            const menuItem = item.menuItem || {};
            const addonsPrice = item.addons?.reduce((sum, addon) => sum + (addon?.price || 0), 0) || 0;

            return {
                "Produk": menuItem.name || 'N/A',
                "Kategori": menuItem.category?.join(', ') || 'N/A',
                "SKU": menuItem._id || 'N/A',
                "Terjual": item.quantity || 0,
                "Penjualan Kotor": item.subtotal || 0,
                "Diskon Produk": addonsPrice || 0,
                "Total": (item.subtotal || 0) + addonsPrice,
                "Outlet": product.cashier?.outlet?.[0]?.outletId?.name || 'N/A',
                "Tanggal": new Date(product.createdAt).toLocaleDateString('id-ID')
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Penjualan Produk");
        XLSX.writeFile(wb, "Penjualan_Produk.xlsx");
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
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <Header />

            {/* Breadcrumb */}
            <div className="px-3 py-2 flex flex-col sm:flex-row sm:justify-between sm:items-center border-b gap-2">
                <div className="flex items-center flex-wrap gap-1 text-sm">
                    <FaClipboardList size={18} className="text-gray-500" />
                    <p className="text-gray-500">Laporan</p>
                    <FaChevronRight className="text-gray-400" />
                    <Link to="/admin/operational-menu" className="text-gray-500">
                        Laporan Operasional
                    </Link>
                    <FaChevronRight className="text-gray-400" />
                    <Link to="/Reconciliationummary" className="text-[#005429]">
                        Rekap Kas
                    </Link>
                </div>
                <button
                    className="bg-[#005429] text-white text-sm px-4 py-2 rounded w-full sm:w-auto"
                >
                    Ekspor
                </button>
            </div>

            {/* Filters */}
            <div className="px-3 pb-4 mb-[60px]">
                <div className="my-3 py-3 px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-3 items-end rounded bg-slate-50 shadow-md shadow-slate-200">

                    {/* Tanggal */}
                    <div className="flex flex-col col-span-2">
                        <label className="text-[13px] mb-1 text-gray-500">Tanggal</label>
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
                        <button className="w-full sm:w-auto text-[#005429] hover:text-white hover:bg-[#005429] border border-[#005429] text-[13px] px-[15px] py-[8px] rounded">
                            Reset
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded shadow-md shadow-slate-200 overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead className="text-sm text-gray-400 bg-gray-50">
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
                                        <>
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
                                        </>
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
            </div>

            {/* Bottom bar */}
            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]"></div>
            </div>
        </div>
    );
};

export default Reconciliation;