import React, { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import { FaPercent } from "react-icons/fa";
import Datepicker from "react-tailwindcss-datepicker";

const UpdateVoucher = ({ isOpen, onClose, fetchVouchers, voucherData }) => {
    const [loading, setLoading] = useState(false); // ⬅️ state baru
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        description: "",
        discountAmount: "",
        date: {
            startDate: "",
            endDate: "",
        },
        maxClaims: "",
        printOnReceipt: true,
    });

    const [outlets, setOutlets] = useState([]);
    const [amountType, setAmountType] = useState("rupiah"); // default

    // Fetch outlets
    useEffect(() => {
        const fetchOutlets = async () => {
            try {
                const outletResponse = await axios.get("/api/outlet");
                const outletData = outletResponse.data.data
                    ? outletResponse.data.data
                    : outletResponse.data;
                setOutlets(outletData);
            } catch {
                setOutlets([]);
            }
        };
        fetchOutlets();
    }, []);

    // Prefill data dari voucherData
    useEffect(() => {
        if (voucherData) {
            setFormData({
                name: voucherData.name || "",
                code: voucherData.code || "",
                description: voucherData.description || "",
                discountAmount: voucherData.discountAmount || "",
                date: {
                    startDate: voucherData.validFrom || "",
                    endDate: voucherData.validTo || "",
                },
                maxClaims: voucherData.quota || "",
                printOnReceipt: voucherData.printOnReceipt ?? true,
            });

            setAmountType(
                voucherData.discountType === "percentage" ? "percentage" : "rupiah"
            );
        }
    }, [voucherData]);

    const handlePrintOnReceipt = (value) => {
        setFormData((prev) => ({
            ...prev,
            printOnReceipt: value,
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleDateRangeChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            date: value,
        }));
    };

    const handleSubmit = async (e) => {
        setLoading(true); // ⬅️ mulai loading
        e.preventDefault();
        let applicableOutlets = [];
        applicableOutlets = outlets.map((o) => o._id);

        try {
            const payload = {
                name: formData.name,
                code: formData.code,
                description: formData.description,
                discountAmount: formData.discountAmount,
                discountType: amountType === "rupiah" ? "fixed" : "percentage",
                validFrom: formData.date?.startDate,
                validTo: formData.date?.endDate,
                quota: formData.maxClaims,
                applicableOutlets,
                customerType: "all",
                printOnReceipt: formData.printOnReceipt,
            };

            setTimeout(async () => {
                try {
                    await axios.put(`/api/promotion/vouchers/${voucherData._id}`, payload);
                    fetchVouchers();
                    onClose();
                } catch (error) {
                    console.error("Error updating voucher:", error);
                } finally {
                    setLoading(false); // ⬅️ stop loading setelah selesai
                }
            }, 5000);
        } catch (error) {
            console.error("Error updating voucher:", error);
        }
    };

    return (
        <div className={`fixed inset-0 z-50 flex ${!isOpen ? "hidden" : ""}`}>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-40" onClick={onClose} />

            {/* Modal Content */}
            <div className="relative ml-auto h-full w-full max-w-3xl bg-white z-50 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Update Voucher</h2>
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
                            <label className="block text-sm font-medium text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 uppercase">
                                Kode Voucher
                            </label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                maxLength={25}
                                className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#005429] uppercase"
                                onChange={(e) =>
                                    handleInputChange({
                                        target: { name: "code", value: e.target.value.toUpperCase() },
                                    })
                                }
                                required
                            />
                        </div>

                        {/* Nama Voucher */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1">
                                Nama Voucher
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                maxLength={50}
                                className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#005429]"
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        {/* Deskripsi */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#999999]">
                                Deskripsi Voucher
                            </label>
                            <textarea
                                name="description"
                                rows={3}
                                value={formData.description}
                                maxLength={250}
                                className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#005429]"
                                onChange={handleInputChange}
                            />
                        </div>

                        {/* Jenis Voucher */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#999999]">
                                Besar Voucher
                            </label>
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
                                    value={formData.discountAmount}
                                    maxLength={15}
                                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#005429]"
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        {/* Masa Berlaku */}
                        <div className="mb-4 z-[70]">
                            <label className="block text-sm font-medium text-[#999999]">
                                Masa Berlaku
                            </label>
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
                            <label className="block text-sm font-medium text-[#999999]">
                                Kuota Voucher
                            </label>
                            <input
                                type="number"
                                name="maxClaims"
                                value={formData.maxClaims}
                                className="mt-2 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#005429]"
                                onChange={handleInputChange}
                            />
                        </div>

                        {/* Cetak di Receipt
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#999999]">
                                Cetak di Receipt
                            </label>
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
                        </div> */}

                        {/* Aksi Button */}
                        <div className="fixed bottom-5 right-5 flex justify-end space-x-3 mt-6">
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
                                {loading ? (
                                    <svg
                                        className="animate-spin h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 000 16v-4l-3.5 3.5L12 24v-4a8 8 0 01-8-8z"
                                        />
                                    </svg>
                                ) : (
                                    "Update"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UpdateVoucher;
