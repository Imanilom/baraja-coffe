import React, { useState, useEffect } from "react";

const SalesTransaction = () => {
    const [transactions, setTransactions] = useState([]);
    const [selectedTrx, setSelectedTrx] = useState(null);


    useEffect(() => {
        // Dummy data, bisa diganti fetch/axios dari API
        setTransactions([
            {
                "date": "2025-04-25T10:15:00",
                "cashier": "Dina Kusuma",
                "id_struk": "WPKGHM6PKKZJ7",
                "product": "Kopi Hitam, Roti Bakar",
                "type": "Dine In",
                "total": 35000
            },
            {
                "date": "2025-04-25T11:30:00",
                "cashier": "Rian Putra",
                "id_struk": "WPKGHM6PKK123",
                "product": "Teh Manis, Donat",
                "type": "Dine In",
                "total": 28000
            },
            {
                "date": "2025-04-25T12:45:00",
                "cashier": "Siti Rahma",
                "id_struk": "WPKGHM6PKK12W",
                "product": "Nasi Goreng, Es Jeruk",
                "type": "Dine In",
                "total": 50000
            }
        ]
        );
    }, []);

    const formatCurrency = (amount) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(amount);

    const formatDateTime = (datetime) => {
        const date = new Date(datetime);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Riwayat Transaksi Penjualan</h2>
            <div className="overflow-x-auto bg-white shadow-md rounded-lg">
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
                        {transactions.map((trx, index) => (
                            <tr key={trx.id_struk} className="border-t cursor-pointer hover:bg-gray-100 transition"
                                onClick={() => setSelectedTrx(trx)}>
                                <td className="px-4 py-2">{new Date(trx.date).toLocaleDateString("id-ID")}</td>
                                <td className="px-4 py-2">{trx.cashier}</td>
                                <td className="px-4 py-2">{trx.id_struk}</td>
                                <td className="px-4 py-2">{trx.product}</td>
                                <td className="px-4 py-2">{trx.type}</td>
                                <td className="px-4 py-2">{formatCurrency(trx.total)}</td>
                            </tr>
                        ))}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-4 py-6 text-center text-gray-400">
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
                            <div className="p-4 bg-gray-300">
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
                                <div className="p-6 text-sm text-gray-700 space-y-2 bg-white">
                                    <p><strong>ID Struk:</strong> {selectedTrx.id_struk}</p>
                                    <p><strong>Waktu:</strong> {formatDateTime(selectedTrx.date)}</p>
                                    <p><strong>Outlet:</strong> {selectedTrx.outlet}</p>
                                    <p><strong>Kasir:</strong> {selectedTrx.cashier}</p>
                                    <p><strong>Pelanggan:</strong> {selectedTrx.customer}</p>
                                    <p className="text-center">{selectedTrx.type}</p>
                                    <hr className="my-4 border-t-2 border-dashed border-gray-400 w-full" />
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            {selectedTrx.product}
                                        </div>
                                        <div className="text-center">
                                            × {selectedTrx.qty}
                                        </div>
                                        <div className="text-right">
                                            {formatCurrency(selectedTrx.total)}
                                        </div>
                                    </div>
                                    <hr className="my-4 border-t-2 border-dashed border-gray-400 w-full" />
                                    <div className="">
                                        <div className="flex justify-between">
                                            <p>Subtotal</p>
                                            <p>{formatCurrency(selectedTrx.total)}</p>
                                        </div>
                                        <div className="flex justify-between">
                                            <p>PB1 (10%)</p>
                                            <p>{formatCurrency(10000)}</p>
                                        </div>
                                        <div className="flex justify-between">
                                            <strong>Total</strong>
                                            <p>{formatCurrency(selectedTrx.total)}</p>
                                        </div>
                                    </div>
                                    <hr className="my-4 border-t-2 border-dashed border-gray-400 w-full" />
                                    <div className="">
                                        <div className="flex justify-between">
                                            <p>Tunai</p>
                                            <p>{formatCurrency(selectedTrx.total)}</p>
                                        </div>
                                        <div className="flex justify-between">
                                            <p>Kembali</p>
                                            <p>{formatCurrency(selectedTrx.total)}</p>
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
    );
};

export default SalesTransaction;
