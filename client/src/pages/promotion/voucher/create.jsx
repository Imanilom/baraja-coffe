import React, { useState } from "react";
import axios from "axios";

const CreateVoucher = ({ onClose, fetchVouchers }) => {
    const [formData, setFormData] = useState({
        code: "",
        description: "",
        discountAmount: "",
        minimumOrder: "",
        startDate: "",
        endDate: "",
        isActive: true,
        maxClaims: "",
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded shadow-md w-full max-w-lg"
            >
                <h2 className="text-xl font-bold mb-4">Create Voucher</h2>

                <div className="mb-4">
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

                <div className="mb-4">
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

                <div className="mb-4">
                    <label className="block text-gray-700">Minimum Order</label>
                    <input
                        type="number"
                        name="minimumOrder"
                        value={formData.minimumOrder}
                        onChange={handleInputChange}
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700">Start Date</label>
                    <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700">End Date</label>
                    <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div className="mb-4">
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

                <div className="flex justify-end space-x-4">
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
            </form>
        </div>
    );
};

export default CreateVoucher;
