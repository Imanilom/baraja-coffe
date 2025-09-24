import React, { useState } from "react";

const UpdateStockForm = ({ product, onSave, onCancel }) => {
    const [stock, setStock] = useState(product.availableStock || 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...product, availableStock: stock });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg shadow-md space-y-4 w-full max-w-md"
        >
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Update Stok Produk
            </h2>

            {/* Produk */}
            <div>
                <label className="block text-sm font-medium text-gray-600">Produk</label>
                <input
                    type="text"
                    value={product.name}
                    disabled
                    className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700 cursor-not-allowed"
                />
            </div>

            {/* Kategori */}
            <div>
                <label className="block text-sm font-medium text-gray-600">Kategori</label>
                <input
                    type="text"
                    value={product.category || "-"}
                    disabled
                    className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700 cursor-not-allowed"
                />
            </div>

            {/* Stok */}
            <div>
                <label className="block text-sm font-medium text-gray-600">Stok</label>
                <input
                    type="number"
                    value={stock}
                    min={0}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    Simpan
                </button>
            </div>
        </form>
    );
};

export default UpdateStockForm;
