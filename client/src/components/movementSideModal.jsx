import React from "react";

const MovementSideModal = ({ movement, onClose, formatDateTime, capitalizeWords }) => {
    if (!movement) return null;

    return (
        <>
            {/* overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-40 z-40"
                onClick={onClose}
            ></div>

            {/* sidebar modal */}
            <div className="fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-50 transition-transform transform animate-slideIn flex flex-col border-l border-gray-200">
                {/* header */}
                <div className="flex justify-between items-center px-6 py-4 border-b bg-white">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Detail Stok
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* content */}
                <div className="p-6 space-y-5 overflow-y-auto text-sm flex-1 cursor-default">
                    <div className="flex justify-between">
                        <span className="text-gray-500">ID</span>
                        <span className="text-gray-900 font-medium">{movement._id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Tanggal</span>
                        <span className="text-gray-900 font-medium">
                            {formatDateTime(movement.date)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Produk</span>
                        <span className="text-gray-900 font-medium">
                            {capitalizeWords(movement.product)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Unit</span>
                        <span className="text-gray-900 lowercase">{movement.unit}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Quantity</span>
                        <span className="text-gray-900 font-medium">
                            {movement.quantity}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Dibuat</span>
                        <span className="text-gray-900 font-medium">
                            {movement.createdBy}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Tipe</span>
                        <span className="text-gray-900 font-medium">
                            {movement.type === "in" ? "Stok Masuk" : movement.type === "out" ? "Stok Keluar" : "Stok Tranfer"}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 mb-1">Catatan</span>
                        <span className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md border border-gray-100">
                            {movement.notes || "-"}
                        </span>
                    </div>
                    {console.log(movement.notes)}
                </div>

                {/* footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </>
    );
};

export default MovementSideModal;
