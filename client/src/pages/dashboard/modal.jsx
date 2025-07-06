import React, { useState } from "react";

const DashboardModal = ({ isOpen, onClose, onSubmit }) => {
    const [selectedOptions, setSelectedOptions] = useState({
        customer: false,
        "stock-reminder": false,
        "payment-method": true,
        "sales-type": false,
    });

    const handleCheckboxChange = (e) => {
        const { id, checked } = e.target;
        setSelectedOptions((prev) => ({
            ...prev,
            [id]: checked,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const selected = Object.entries(selectedOptions)
            .filter(([_, value]) => value)
            .map(([key]) => key);
        onSubmit(selected);
    };

    if (!isOpen) return null;

    const options = [
        {
            id: "customer",
            label: "Pelanggan",
            tooltip: "Memberikan informasi pelanggan baru dan total pelanggan",
        },
        {
            id: "stock-reminder",
            label: "Pengingat Stok",
            tooltip: "Memberikan informasi stok yang akan habis. Mohon menyalakan Stok Alert pada produk terlebih dahulu.",
        },
        {
            id: "payment-method",
            label: "Metode Pembayaran",
            tooltip: "Memberikan informasi total penjualan pada setiap metode pembayaran yang terdaftar",
        },
        {
            id: "sales-type",
            label: "Tipe Penjualan",
            tooltip: "Memberikan informasi total transaksi pada setiap tipe penjualan",
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-30">
            <div className="w-1/2 h-full bg-white shadow-lg flex flex-col animate-slideInRight">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-semibold uppercase">Atur Dashboard</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        <p className="text-sm text-gray-600 pl-[12px]">
                            Pilih jenis laporan yang ingin ditampilkan di halaman dashboard
                        </p>

                        {options.map(({ id, label, tooltip }) => (
                            <div key={id} className="pl-[25px] flex items-center">
                                {/* Checkbox & Label */}
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={id}
                                        checked={selectedOptions[id]}
                                        onChange={handleCheckboxChange}
                                        className="mt-1 accent-[#005429]"
                                    />
                                    <span className="text-gray-800">{label}</span>
                                </label>

                                {/* Tooltip - Trigger only on "i" */}
                                <div className="relative ml-2">
                                    <div className="group cursor-pointer text-xs font-semibold w-5 h-5 rounded-full border flex items-center justify-center text-gray-600 hover:bg-gray-100">
                                        i
                                        {/* Tooltip box */}
                                        <div className="absolute z-10 hidden group-hover:block w-[250px] bg-[#005429] text-white text-xs p-3 rounded shadow-lg left-1/2 transform -translate-x-1/2 top-7">
                                            {tooltip}
                                            <div className="absolute top-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 rotate-45 bg-[#005429]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Fixed Footer */}
                    <div className="border-t p-4 bg-white sticky bottom-0 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-[#005429] hover:text-white"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm text-white bg-[#005429] rounded"
                        >
                            Simpan
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default DashboardModal;
