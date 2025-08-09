import React, { useState } from "react";
import axios from "axios";
import { FaPercent, FaTrashAlt } from "react-icons/fa";
import Datepicker from "react-tailwindcss-datepicker";

const CreateVoucher = ({ onClose, fetchVouchers }) => {
    const [formData, setFormData] = useState({
        code: "",
        description: "",
        discountAmount: "",
        minimumOrder: "",
        date: {
            startDate: "",
            endDate: "",
        },
        isActive: true,
        maxClaims: "",
        printOnReceipt: true, // ⬅️ default value
    });
    const [outletMode, setOutletMode] = useState("semua"); // 'semua' atau 'per'
    const [outletQuotas, setOutletQuotas] = useState([{ outlet: "", quota: "" }]);

    const [amountType, setAmountType] = useState("rupiah"); // or 'percentage'

    const handleOutletQuotaChange = (index, field, value) => {
        const updated = [...outletQuotas];
        updated[index][field] = value;
        setOutletQuotas(updated);
    };

    const handleAddOutletQuota = () => {
        setOutletQuotas([...outletQuotas, { outlet: "", quota: "" }]);
    };

    const handlePrintOnReceipt = (value) => {
        setFormData((prev) => ({
            ...prev,
            printOnReceipt: value,
        }));
    };

    const handleRemoveOutletQuota = (index) => {
        const updated = [...outletQuotas];
        updated.splice(index, 1);
        setOutletQuotas(updated);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleDateRangeChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            date: value, // { startDate, endDate }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("/api/vouchers", formData);
            fetchVouchers();
            onClose();
        } catch (error) {
            console.error("Error creating voucher:", error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-40" onClick={onClose} />

            {/* Modal Content */}
            <div className="relative ml-auto h-full w-full max-w-3xl bg-white z-50 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Tambah Voucher</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-xl"
                    >
                        &times;
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="p-6 flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        {/* Kode Voucher */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1">Kode Voucher</label>
                            <input
                                type="text"
                                name="code"
                                placeholder="Contoh: KODEVOUCHER01"
                                maxLength={25}
                                className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#005429]"
                                onChange={handleInputChange}
                                required
                            />
                            <div className="flex items-center mt-2 space-x-2">
                                <input
                                    type="checkbox"
                                    name="auto_generated_code"
                                    className="accent-[#005429] w-4 h-4"
                                />
                                <label className="text-sm text-gray-600">Gunakan Kode Unik Sistema</label>
                            </div>
                        </div>

                        {/* Nama Voucher */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1">Nama Voucher</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Contoh: Voucher Belanja 10ribu"
                                maxLength={50}
                                className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#005429]"
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        {/* Deskripsi */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1">Deskripsi Voucher</label>
                            <textarea
                                name="description"
                                rows={3}
                                maxLength={250}
                                className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#005429]"
                                placeholder="Contoh: Berlaku untuk semua pembelian di atas 50rb"
                                onChange={handleInputChange}
                            />
                        </div>

                        {/* Jenis Voucher */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1">Besar Voucher</label>
                            <div className="flex space-x-2 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setAmountType("rupiah")}
                                    className={`px-3 py-1 text-sm rounded ${amountType === "rupiah"
                                        ? "bg-[#005429] text-white"
                                        : "border border-[#005429] text-[#005429]"
                                        }`}
                                >
                                    Dalam Nilai (Rp)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAmountType("percentage")}
                                    className={`px-3 py-1 text-sm rounded ${amountType === "percentage"
                                        ? "bg-[#005429] text-white"
                                        : "border border-[#005429] text-[#005429]"
                                        }`}
                                >
                                    Dalam Persen (%)
                                </button>
                            </div>
                            <div className="mt-2 flex items-center">
                                <span className="mr-2 text-[#005429] font-semibold w-[50px]">
                                    {amountType === "percentage" ? <FaPercent /> : "Rp"}
                                </span>
                                <input
                                    type="text"
                                    name="discountAmount"
                                    placeholder="Hanya angka"
                                    maxLength={15}
                                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#005429]"
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        {/* Masa Berlaku */}
                        <div className="mb-4 z-[70]">
                            <label className="block text-sm font-medium text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1">Masa Berlaku</label>
                            <Datepicker
                                showFooter
                                showShortcuts
                                value={formData.date}
                                onChange={handleDateRangeChange}
                                displayFormat="DD-MM-YYYY"
                                inputClassName="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#005429] cursor-pointer"
                                popoverPosition="fixed"
                                containerClassName="relative z-[80]"
                                popoverClassName="max-w-[10px] text-xs"
                            />
                        </div>

                        {/* Kuota */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1">Kuota Voucher</label>

                            <div className="flex space-x-2 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setOutletMode("semua")}
                                    className={`px-3 py-1 text-sm rounded ${outletMode === "semua"
                                        ? "bg-[#005429] text-white"
                                        : "border border-[#005429] text-[#005429]"
                                        }`}
                                >
                                    Semua Outlet
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOutletMode("per")}
                                    className={`px-3 py-1 text-sm rounded ${outletMode === "per"
                                        ? "bg-[#005429] text-white"
                                        : "border border-[#005429] text-[#005429]"
                                        }`}
                                >
                                    Per Outlet
                                </button>
                            </div>

                            {/* Jika Semua Outlet */}
                            {outletMode === "semua" && (
                                <input
                                    type="number"
                                    name="maxClaims"
                                    placeholder="Hanya angka"
                                    className="mt-2 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#005429]"
                                    onChange={handleInputChange}
                                />
                            )}

                            {/* Jika Per Outlet */}
                            {outletMode === "per" && (
                                <div className="mt-4 space-y-3">
                                    {outletQuotas.map((item, index) => (
                                        <div key={index} className="flex space-x-2 items-center">
                                            <select
                                                value={item.outlet}
                                                onChange={(e) => handleOutletQuotaChange(index, "outlet", e.target.value)}
                                                className="w-1/2 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005429]"
                                            >
                                                <option value="">Pilih Outlet</option>
                                                <option value="Outlet A">Outlet A</option>
                                                <option value="Outlet B">Outlet B</option>
                                                <option value="Outlet C">Outlet C</option>
                                            </select>

                                            <input
                                                type="number"
                                                value={item.quota}
                                                placeholder="Kuota"
                                                onChange={(e) => handleOutletQuotaChange(index, "quota", e.target.value)}
                                                className="w-1/3 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005429]"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveOutletQuota(index)}
                                                className="text-red-500 text-xl"
                                                title="Hapus"
                                            >
                                                <FaTrashAlt />
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={handleAddOutletQuota}
                                        className="mt-2 px-3 py-1 border border-[#005429] text-[#005429] rounded text-sm"
                                    >
                                        + Tambah Outlet Lain
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Cetak di Receipt */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1">Cetak di Receipt</label>
                            <div className="flex space-x-2 mt-2">
                                <button
                                    type="button"
                                    onClick={() => handlePrintOnReceipt(true)}
                                    className={`px-3 py-1 text-sm rounded ${formData.printOnReceipt
                                        ? "bg-[#005429] text-white"
                                        : "border border-[#005429] text-[#005429]"
                                        }`}
                                >
                                    Iya
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePrintOnReceipt(false)}
                                    className={`px-3 py-1 text-sm rounded ${!formData.printOnReceipt
                                        ? "bg-[#005429] text-white"
                                        : "border border-[#005429] text-[#005429]"
                                        }`}
                                >
                                    Tidak
                                </button>
                            </div>
                        </div>


                        {/* Aksi Button */}
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-[#005429] text-[#005429] rounded"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-[#005429] text-white rounded"
                            >
                                Simpan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateVoucher;

{/* <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Create Voucher</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-xl"
                        >
                            &times;
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-700">Code</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700">Discount Amount</label>
                            <input
                                type="number"
                                name="discountAmount"
                                value={formData.discountAmount}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700">Minimum Order</label>
                            <input
                                type="number"
                                name="minimumOrder"
                                value={formData.minimumOrder}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700">Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700">End Date</label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700">Max Claims</label>
                            <input
                                type="number"
                                name="maxClaims"
                                value={formData.maxClaims}
                                onChange={handleInputChange}
                                className="w-full border rounded px-3 py-2"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 text-white px-4 py-2 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                        >
                            Save
                        </button>
                    </div>
                </form> */}

{/* <div className="flex space-x-2 mt-2">
                            <input
                                type="date"
                                name="start_date"
                                className="w-1/2 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#005429]"
                            />
                            <input
                                type="date"
                                name="end_date"
                                className="w-1/2 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#005429]"
                            />
                        </div> */}
