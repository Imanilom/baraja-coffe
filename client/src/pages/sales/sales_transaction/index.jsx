import React, { useEffect, useState } from 'react';
import { getOrders } from '../../../utils/api';

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID'); // Format tanggal berdasarkan locale ID (Indonesia)
};

const TransactionSalesManagement = () => {
    const [orders, setOrders] = useState([]);

    // Mengambil data transaksi dari API
    useEffect(() => {
        // Fungsi untuk mengambil data dari API
        const fetchOrder = async () => {
            try {
                const response = await getOrders();  // Ganti dengan URL API Anda
                setOrders(response);
                console.log(response);
                if (!response.ok) {
                    throw new Error('Gagal mengambil data');
                } // Menyimpan data ke dalam state
            } catch (err) {
                setError(err.message);  // Menyimpan pesan error jika ada
            }
        };

        fetchOrder();  // Panggil fungsi untuk mengambil data
    }, []); // Menjalankan hanya sekali saat komponen pertama kali dimuat

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Data Penjualan</h1>
                <div className="container max-w-7xl min-h-screen bg-white">
                    <table className="min-w-full table-auto mt-8">
                        <thead>
                            <tr>

                                <th className="px-4 py-2 text-left font-semibold text-gray-600">Waktu</th>
                                <th className="px-4 py-2 text-left font-semibold text-gray-600">Kasir</th>
                                <th className="px-4 py-2 text-left font-semibold text-gray-600">ID Struk</th>
                                <th className="px-4 py-2 text-left font-semibold text-gray-600">Produk</th>
                                <th className="px-4 py-2 text-left font-semibold text-gray-600">Tipe Penjualan</th>
                                <th className="px-4 py-2 text-left font-semibold text-gray-600">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2">{formatDate(order.createdAt)}</td>
                                    <td className="px-4 py-2">{order.user}</td>
                                    <td className="px-4 py-2">{order.status}</td>
                                    <td className="px-4 py-2">{order.orderType}</td>
                                    <td className="px-4 py-2">{order.orderType}</td>
                                    <td className="px-4 py-2">Rp {order.totalPrice}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TransactionSalesManagement;