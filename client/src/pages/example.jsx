import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


const SalesTransaction = () => {
    const [transactions, setTransactions] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [filters, setFilters] = useState({
        outlet: "",
        tanggal: "",
        status: "",
        search: "",
    });
    const [range, setRange] = useState([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: 'selection'
        }
    ]);
    const [showCalendar, setShowCalendar] = useState(false);

    // Calculate the total subtotal first
    const totalSubtotal = selectedTrx && selectedTrx.items ? selectedTrx.items.reduce((acc, item) => acc + item.subtotal, 0) : 0;

    // Calculate PB1 as 10% of the total subtotal
    const pb1 = 10000;

    // Calculate the final total
    const finalTotal = totalSubtotal + pb1;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [transactionsResponse, outletsResponse] = await Promise.all([
                    axios.get("/api/orders"),
                    axios.get("/api/outlet"),
                ]);

                // Set Transactions
                if (transactionsResponse.data && transactionsResponse.data.data) {
                    setTransactions(transactionsResponse.data.data);
                } else {
                    console.error('Data transaksi tidak ditemukan atau format salah.');
                }

                // Set Outlets
                if (outletsResponse.data) {
                    setOutlets(outletsResponse.data);
                } else {
                    console.error('Data outlet tidak ditemukan atau format salah.');
                }

            } catch (error) {
                console.error('Gagal fetch data:', error);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDateTime = (datetime) => {
        const date = new Date(datetime);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const formatDate = (date) => {
        // Mengubah tanggal menjadi waktu lokal terlebih dahulu
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return localDate.toISOString().slice(0, 10);  // Format YYYY-MM-DD
    };

    const setQuickRange = (start, end) => {
        // Mendapatkan zona waktu offset untuk lokal
        const timezoneOffset = new Date().getTimezoneOffset() * 60000;

        // Set startDate ke jam 00:00 pada tanggal tersebut (zona waktu lokal)
        const startDate = new Date(start.getTime() - timezoneOffset).setHours(0, 0, 0, 0);

        // Set endDate ke jam 23:59:59.999 pada tanggal tersebut (zona waktu lokal)
        const endDate = new Date(end.getTime() - timezoneOffset).setHours(23, 59, 59, 999);

        console.log("startDate:", new Date(startDate).toISOString());  // Harusnya di 00:00:00 lokal
        console.log("endDate:", new Date(endDate).toISOString());

        // Update state dengan startDate dan endDate yang sudah dimanipulasi
        setRange([{
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            key: 'selection',
        }]);
    };

    const handleSubmit = () => {
        // Save the selected range for processing
        const startDate = range[0].startDate;
        const endDate = range[0].endDate;

        // Format the date range for filtering
        setFilters({
            ...filters,
            tanggal: {
                start: formatDate(startDate),
                end: formatDate(endDate)
            }
        });

        setShowCalendar(false); // Close the calendar after submit
    };

    const filteredTransactions = transactions.filter((trx) => {
        const matchOutlet = filters.outlet ? trx.cashier?.outlet?.[0]?.outletId?.name === filters.outlet : true;
        const matchStatus = filters.status ? trx.status === filters.status : true;
        const matchSearch = filters.search ? (
            trx.cashier?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
            trx._id?.toLowerCase().includes(filters.search.toLowerCase()) ||
            trx.items?.some(item => item.menuItem?.name?.toLowerCase().includes(filters.search.toLowerCase()))
        ) : true;

        return matchOutlet && matchStatus && matchSearch;
    });

    const handleChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value,
        });
    };

    const exportToExcel = () => {
        const dataToExport = transactions.map(trx => ({
            "Waktu": formatDateTime(trx.createdAt),
            "Kasir": trx.cashier?.name || "-",
            "ID Struk": trx._id,
            "Produk": trx.items?.map(item => item.menuItem?.name).join(', '),
            "Tipe Penjualan": trx.orderType,
            "Total (Rp)": trx.totalPrice
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);

        // Set auto width untuk tiap kolom
        const columnWidths = Object.keys(dataToExport[0]).map(key => ({
            wch: Math.max(key.length + 2, 20)  // minimal lebar 20 kolom
        }));
        worksheet['!cols'] = columnWidths;

        // Buat workbook dan simpan
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Transaksi");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(dataBlob, "Riwayat_Transaksi_Penjualan.xlsx");
    };


    return (
        <div className="">
            <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
                <FaBell className="text-2xl text-gray-400" />
                <Link
                    to="/admin/menu"
                    className="text-gray-400 inline-block text-2xl"
                >
                    <FaUser />
                </Link>

            </div>
            <div className="px-3 py-2 flex justify-between items-center border-b">
                <div className="flex items-center space-x-2">
                    <FaClipboardList className="text-gray-400 inline-block" />
                    <p className="text-gray-400 inline-block">Laporan</p>
                    <FaChevronRight className="text-gray-400 inline-block" />
                    <Link
                        to="/admin/report"
                        className="text-gray-400 inline-block"
                    >
                        Laporan Penjualan
                    </Link>
                    <FaChevronRight className="text-gray-400 inline-block" />
                    <Link
                        to="/admin/transaction-sales"
                        className="text-green-600 inline-block"
                    >
                        Data Transaksi Penjulan
                    </Link>
                </div>

                <button
                    onClick={exportToExcel}
                    className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition"
                >
                    Ekspor
                </button>
            </div>
            <div className="grid grid-cols-4 bg-slate-50 gap-4 px-6 py-3 shadow-slate-200 shadow-sm mb-2">
                {/* Dropdown Outlet */}
                <div className="flex flex-col">
                    <label htmlFor="outlet" className="text-sm font-medium mb-1">Outlet</label>
                    <select
                        id="outlet"
                        name="outlet"
                        value={filters.outlet}
                        onChange={handleChange}
                        className="border rounded-lg p-2"
                    >
                        <option value="">Semua Outlet</option>
                        {outlets.map((outlet) => (
                            <option key={outlet._id} value={outlet.name}>
                                {outlet.name}
                            </option>
                        ))}
                    </select>
                </div>


                {/* Dropdown Status */}
                <div className="flex flex-col">
                    <label htmlFor="status" className="text-sm font-medium mb-1">Status</label>
                    <select
                        id="status"
                        name="status"
                        value={filters.status}
                        onChange={handleChange}
                        className="border rounded-lg p-2"
                    >
                        <option value="">Semua Status</option>
                        {[...new Set(transactions.map((trx) => trx.status).filter(Boolean))]
                            .sort()
                            .map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))
                        }
                    </select>
                </div>

                {/* Input Search */}
                <div className="flex flex-col">
                    <label htmlFor="search" className="text-sm font-medium mb-1">Cari</label>
                    <input
                        type="text"
                        id="search"
                        name="search"
                        value={filters.search}
                        onChange={handleChange}
                        className="border rounded-lg p-2"
                        placeholder="Cari sesuatu..."
                    />
                </div>
            </div>
            <div className="bg-slate-50 p-3">
                <div className="overflow-x-auto bg-white shadow-md">
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-700">
                                <th className="px-4 py-3">Waktu</th>
                                <th className="px-4 py-3">Kasir</th>
                                <th className="px-4 py-3">ID Struk</th>
                                <th className="px-4 py-3">Produk</th>
                                <th className="px-4 py-3">Tipe Penjualan</th>
                                <th className="px-4 py-3">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-600">
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((trx) => (
                                    <tr key={trx._id} className="border-t cursor-pointer hover:bg-gray-100 transition"
                                        onClick={() => setSelectedTrx(trx)}>
                                        <td className="px-4 py-2">{formatDateTime(trx.createdAt)}</td>
                                        <td className="px-4 py-2">{trx.cashier?.name}</td>
                                        <td className="px-4 py-2">{trx._id}</td>
                                        <td className="px-4 py-2">
                                            {trx.items?.map(item => item.menuItem?.name).join(', ')}
                                        </td>
                                        <td className="px-4 py-2">{trx.orderType}</td>
                                        <td className="px-4 py-2">{formatCurrency(
                                            trx.items?.reduce((total, item) => total + item.subtotal + 10000, 0) || 0
                                        )}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-4 py-6 text-center text-gray-400">
                                        Tidak ada transaksi.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {selectedTrx && (
                        <div className="fixed inset-0 z-50 flex justify-end">
                            {/* Backdrop */}
                            <div
                                className="absolute inset-0 bg-black bg-opacity-40"
                                onClick={() => setSelectedTrx(null)}
                            ></div>

                            {/* Modal panel */}
                            <div className={`relative w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out translate-x-0`}>
                                <div className="p-3 border-b font-semibold text-lg text-gray-700 flex justify-between items-center">
                                    DATA TRANSAKSI PENJUALAN
                                    <button onClick={() => setSelectedTrx(null)} className="text-gray-400 hover:text-red-500 text-2xl leading-none">
                                        &times;
                                    </button>
                                </div>
                                <div className="p-4 bg-gray-300 min-h-screen">
                                    <div className="w-full overflow-hidden">
                                        <div className="flex">
                                            {Array.from({ length: 50 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="w-4 h-4 rotate-45 bg-white origin-bottom-left"
                                                    style={{ marginRight: '4px' }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-lg text-gray-700 bg-white font-medium">Baraja Coffee Indonesia</h3>
                                    </div>
                                    <div className="p-6 text-sm text-gray-700 space-y-2 bg-white">
                                        <p>ID Struk: {selectedTrx._id}</p>
                                        <p>Waktu: {formatDateTime(selectedTrx.createdAt)}</p>
                                        <p>
                                            Outlet:
                                            {selectedTrx.cashier?.outlet?.[0]?.outletId?.name || 'No Outlet'}
                                        </p>

                                        <p>Kasir: {selectedTrx.cashier?.name}</p>
                                        <p>Pelanggan: {selectedTrx.customer}</p>
                                        <p className="text-center text-lg font-medium">{selectedTrx.orderType}</p>
                                        <hr className="my-4 border-t-2 border-dashed border-gray-400 w-full" />
                                        <div className="grid grid-cols-3 text-sm">
                                            {selectedTrx.items?.map((item, index) => (
                                                <React.Fragment key={index}>
                                                    <div>{item.menuItem?.name || '-'}</div>
                                                    <div className="text-center">× {item.quantity}</div>
                                                    <div className="text-right">{formatCurrency(item.subtotal)}</div>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        <hr className="my-4 border-t-2 border-dashed border-gray-400 w-full" />
                                        <div className="">
                                            <div className="flex justify-between">
                                                <p>Total Subtotal</p>
                                                <p>{formatCurrency(totalSubtotal)}</p>
                                            </div>
                                            <div className="flex justify-between">
                                                <p>PB1 (10%)</p>
                                                <p>{formatCurrency(pb1)}</p>
                                            </div>
                                            <div className="flex justify-between">
                                                <strong>Total</strong>
                                                <p>{formatCurrency(finalTotal)}</p>
                                            </div>
                                        </div>
                                        <hr className="my-4 border-t-2 border-dashed border-gray-400 w-full" />
                                        <div className="">
                                            <div className="flex justify-between">
                                                <p>Tunai</p>
                                                <p>{formatCurrency(finalTotal)}</p>
                                            </div>
                                            <div className="flex justify-between">
                                                <p>Kembali</p>
                                                <p>{formatCurrency(0)}</p>
                                            </div>
                                        </div>
                                        <hr className="my-4 border-t-2 border-dashed border-gray-400 w-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SalesTransaction;
