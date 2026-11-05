// import React, { useState } from "react";

// const UpdateStockForm = ({ product, onSave, onCancel }) => {
//     const [stock, setStock] = useState(product.availableStock || 0);

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         onSave({ ...product, availableStock: stock });
//     };

//     return (
//         <form
//             onSubmit={handleSubmit}
//             className="bg-white p-6 rounded-lg shadow-md space-y-4 w-full max-w-md"
//         >
//             <h2 className="text-lg font-semibold text-gray-700 mb-4">
//                 Update Stok Produk
//             </h2>

//             {/* Produk */}
//             <div>
//                 <label className="block text-sm font-medium text-gray-600">Produk</label>
//                 <input
//                     type="text"
//                     value={product.name}
//                     disabled
//                     className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700 cursor-not-allowed"
//                 />
//             </div>

//             {/* Kategori */}
//             <div>
//                 <label className="block text-sm font-medium text-gray-600">Kategori</label>
//                 <input
//                     type="text"
//                     value={product.category || "-"}
//                     disabled
//                     className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700 cursor-not-allowed"
//                 />
//             </div>

//             {/* Stok */}
//             <div>
//                 <label className="block text-sm font-medium text-gray-600">Stok</label>
//                 <input
//                     type="number"
//                     value={stock}
//                     min={0}
//                     onChange={(e) => setStock(Number(e.target.value))}
//                     className="w-full border rounded px-3 py-2"
//                 />
//             </div>

//             {/* Actions */}
//             <div className="flex justify-end gap-3 pt-4">
//                 <button
//                     type="button"
//                     onClick={onCancel}
//                     className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
//                 >
//                     Batal
//                 </button>
//                 <button
//                     type="submit"
//                     className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
//                 >
//                     Simpan
//                 </button>
//             </div>
//         </form>
//     );
// };

// export default UpdateStockForm;

import React, { useEffect, useState } from "react";
import axios from '@/lib/axios';

const UpdateStockForm = ({ product, onSave, onCancel, currentUser, fetchStockCard }) => {
    const [manualStock, setManualStock] = useState("");
    const [adjustmentNote, setAdjustmentNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
    const [loadingWarehouses, setLoadingWarehouses] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Fetch daftar warehouse untuk memastikan warehouseId selalu valid saat dikirim ke backend
    useEffect(() => {
        let isMounted = true;
        const fetchWarehouses = async () => {
            setLoadingWarehouses(true);
            try {
                const res = await axios.get('/api/warehouses?limit=100&isActive=true');
                const list = res.data?.data || [];
                if (isMounted) {
                    setWarehouses(list);

                    // Tentukan warehouse awal:
                    // 1. Cek dari product.warehouseStocks jika tersedia
                    const initialWh = product?.warehouseStocks?.find(ws => ws.warehouseId)?.warehouseId;
                    if (initialWh) {
                        const whId = typeof initialWh === 'object' ? initialWh._id : initialWh;
                        setSelectedWarehouseId(whId);
                    } else if (list.length > 0) {
                        // 2. Default ke warehouse pertama yang tersedia
                        setSelectedWarehouseId(list[0]._id);
                    }
                }
            } catch (err) {
                console.error("Gagal memuat daftar warehouse:", err);
            } finally {
                if (isMounted) setLoadingWarehouses(false);
            }
        };

        fetchWarehouses();
        return () => { isMounted = false; };
    }, [product]);

    useEffect(() => {
        if (product) {
            setManualStock(product.manualStock !== null && product.manualStock !== undefined ? product.manualStock : "");
            setErrorMessage("");
        }
    }, [product]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage("");

        try {
            // Ambil ID menu yang valid (bisa dari menuItemId atau _id)
            const rawId = product.menuItemId || product._id;
            const productId = typeof rawId === 'object' && rawId?._id ? rawId._id : rawId;

            if (!productId) {
                throw new Error("ID Menu tidak ditemukan");
            }

            // Tentukan warehouseId yang akan digunakan
            const targetWh = selectedWarehouseId || 
                (product.warehouseStocks?.[0]?.warehouseId 
                    ? (typeof product.warehouseStocks[0].warehouseId === 'object' 
                        ? product.warehouseStocks[0].warehouseId._id 
                        : product.warehouseStocks[0].warehouseId) 
                    : undefined);

            // Konversi manualStock ke Number, atau null jika dikosongkan (reset ke sistem)
            const stockValue = manualStock === "" ? null : Number(manualStock);

            const payload = {
                manualStock: stockValue,
                adjustmentNote: adjustmentNote || "Penyesuaian stok manual dari Backoffice",
                adjustedBy: currentUser?.name || currentUser?.username || currentUser?._id || "Admin",
            };

            if (targetWh) {
                payload.warehouseId = targetWh;
            }

            const res = await axios.put(`/api/product/menu/${productId}/adjust-stock`, payload);

            if (res.data?.success) {
                onSave({
                    ...product,
                    manualStock: stockValue,
                    effectiveStock: stockValue !== null ? stockValue : (res.data?.data?.effectiveStock ?? product.calculatedStock ?? 0)
                });

                if (fetchStockCard) {
                    await fetchStockCard();
                }
                onCancel();
            } else {
                setErrorMessage(res.data?.message || "Gagal update stok");
            }
        } catch (error) {
            console.error("Update stok gagal:", error);
            const msg = error.response?.data?.message || error.message || "Terjadi kesalahan saat update stok";
            setErrorMessage(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Update Stok Produk</h2>

            {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
                    {errorMessage}
                </div>
            )}

            {/* Produk (disable) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Produk</label>
                <input
                    type="text"
                    value={product?.name || "-"}
                    disabled
                    className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600 text-sm cursor-not-allowed"
                />
            </div>

            {/* Kategori (disable) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <input
                    type="text"
                    value={product?.category || "-"}
                    disabled
                    className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600 text-sm cursor-not-allowed"
                />
            </div>

            {/* Pilihan Warehouse */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gudang / Warehouse <span className="text-red-500">*</span>
                </label>
                {loadingWarehouses ? (
                    <div className="text-xs text-gray-400 py-1">Memuat daftar gudang...</div>
                ) : (
                    <select
                        value={selectedWarehouseId}
                        onChange={(e) => setSelectedWarehouseId(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-green-900"
                        required
                    >
                        {warehouses.length === 0 ? (
                            <option value="">Tidak ada gudang tersedia</option>
                        ) : (
                            warehouses.map((wh) => (
                                <option key={wh._id} value={wh._id}>
                                    {wh.name} {wh.code ? `(${wh.code})` : ''}
                                </option>
                            ))
                        )}
                    </select>
                )}
            </div>

            {/* Stok (editable) */}
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Stok Manual</label>
                    <button
                        type="button"
                        onClick={() => setManualStock("")}
                        className="text-xs text-green-800 hover:underline"
                        title="Kosongkan untuk mereset stok ke perhitungan sistem bahan baku"
                    >
                        Reset ke Hitungan Resep
                    </button>
                </div>
                <input
                    type="number"
                    value={manualStock}
                    onChange={(e) => setManualStock(e.target.value)}
                    placeholder="Kosongkan untuk otomatis dari resep"
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-900"
                    min={0}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                    Isi angka untuk menimpa stok, atau kosongkan untuk menggunakan kalkulasi stok otomatis resep.
                </p>
            </div>

            {/* Catatan (opsional) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Penyesuaian</label>
                <textarea
                    value={adjustmentNote}
                    onChange={(e) => setAdjustmentNote(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-900"
                    placeholder="Contoh: Stok opname harian / penyesuaian fisik"
                    rows={2}
                />
            </div>

            {/* Tombol Aksi */}
            <div className="flex justify-end gap-2 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                    disabled={loading}
                >
                    Batal
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm rounded bg-[#005429] text-white hover:bg-green-800 transition-colors disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? "Menyimpan..." : "Simpan Stok"}
                </button>
            </div>
        </form>
    );
};

export default UpdateStockForm;
