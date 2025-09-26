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

import React, { useState } from "react";
import axios from "axios";

const UpdateStockForm = ({ product, onSave, onCancel, currentUser }) => {
    const [manualStock, setManualStock] = useState(product.availableStock || 0);
    const [adjustmentNote, setAdjustmentNote] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await axios.put(`/api/product/menu/${product._id}/update-stock`, {
                manualStock,
                adjustmentNote,
                adjustedBy: currentUser._id, // bisa ambil dari user login
            });

            if (res.data.success) {
                onSave({
                    ...product,
                    availableStock: manualStock,
                });
            } else {
                alert(res.data.message || "Gagal update stok");
            }
        } catch (error) {
            console.error("Update stok gagal:", error);
            alert("Terjadi kesalahan saat update stok");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-lg font-bold mb-2">Update Stok</h2>

            {/* Produk (disable) */}
            <div>
                <label className="block text-sm font-medium">Produk</label>
                <input
                    type="text"
                    value={product.name}
                    disabled
                    className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600"
                />
            </div>

            {/* Kategori (disable) */}
            <div>
                <label className="block text-sm font-medium">Kategori</label>
                <input
                    type="text"
                    value={product.category}
                    disabled
                    className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600"
                />
            </div>

            {/* Stok (editable) */}
            <div>
                <label className="block text-sm font-medium">Stok</label>
                <input
                    type="number"
                    value={product.manualStock}
                    onChange={(e) => setManualStock(Number(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                    min={0}
                    required
                />
            </div>

            {/* Catatan (opsional) */}
            <div>
                <label className="block text-sm font-medium">Catatan</label>
                <textarea
                    value={adjustmentNote}
                    onChange={(e) => setAdjustmentNote(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Opsional"
                />
            </div>

            {/* Tombol Aksi */}
            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                    disabled={loading}
                >
                    Batal
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                    disabled={loading}
                >
                    {loading ? "Menyimpan..." : "Simpan"}
                </button>
            </div>
        </form>
    );
};

export default UpdateStockForm;
