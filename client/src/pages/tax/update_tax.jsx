import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTimes, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";

const UpdateTax = ({ isOpen, onClose, taxId }) => {
    const id = taxId;

    const [formData, setFormData] = useState({
        type: "tax",
        name: "",
        percentage: "",
        appliesToOutlets: [],
    });
    const [outlets, setOutlets] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingOutlets, setIsLoadingOutlets] = useState(false);
    const [isLoadingTax, setIsLoadingTax] = useState(false);

    // Fetch outlets
    useEffect(() => {
        if (!isOpen) return;

        const fetchOutlets = async () => {
            setIsLoadingOutlets(true);
            try {
                const response = await axios.get("/api/outlet");
                setOutlets(response.data.data || []);
            } catch (error) {
                console.error("Error fetching outlets:", error);
                toast.error("Gagal memuat daftar outlet");
                setOutlets([]);
            } finally {
                setIsLoadingOutlets(false);
            }
        };
        fetchOutlets();
    }, [isOpen]);

    // Fetch tax detail by ID
    useEffect(() => {
        if (!isOpen || !id) return;

        const fetchTax = async () => {
            setIsLoadingTax(true);
            try {
                const response = await axios.get(`/api/tax-service/${id}`);
                const tax = response.data?.data || response.data;

                setFormData({
                    type: tax.type || "tax",
                    name: tax.name || "",
                    percentage: tax.percentage !== undefined ? String(tax.percentage) : "",
                    appliesToOutlets: tax.appliesToOutlets?.map(o => o._id || o) || [],
                });
            } catch (error) {
                console.error("Error fetching Tax:", error);
                toast.error("Gagal memuat data pajak");
            } finally {
                setIsLoadingTax(false);
            }
        };
        fetchTax();
    }, [id, isOpen]);

    // Reset form ketika modal ditutup
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                type: "tax",
                name: "",
                percentage: "",
                appliesToOutlets: [],
            });
        }
    }, [isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleOutletChange = (e) => {
        const outletId = e.target.value;
        const isChecked = e.target.checked;

        setFormData((prev) => ({
            ...prev,
            appliesToOutlets: isChecked
                ? [...prev.appliesToOutlets, outletId]
                : prev.appliesToOutlets.filter((oid) => oid !== outletId),
        }));
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            toast.error("Nama pajak harus diisi");
            return false;
        }

        const percentage = parseFloat(formData.percentage);
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
            toast.error("Persentase pajak harus antara 0 - 100");
            return false;
        }

        if (formData.appliesToOutlets.length === 0) {
            toast.error("Harus memilih minimal satu outlet");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            await axios.put(`/api/tax-service/${id}`, {
                ...formData,
                percentage: parseFloat(formData.percentage),
            });

            toast.success("Pajak berhasil diperbarui");

            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            console.error("Error updating Tax:", error);
            const errorMessage =
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Gagal memperbarui pajak";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay Background */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={handleClose}
            />

            {/* Side Drawer - Slide from Right */}
            <div className={`fixed right-0 top-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Modal Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b bg-white">
                    <h2 className="text-xl font-semibold text-green-900">
                        Edit Pajak
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                        disabled={isSubmitting}
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {isLoadingTax ? (
                        <div className="flex items-center justify-center py-8">
                            <FaSpinner className="animate-spin text-green-600 mr-2" size={20} />
                            <span className="text-gray-600">Memuat data pajak...</span>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Nama Pajak <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                                    required
                                    placeholder="Masukkan nama pajak"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Persentase Pajak <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        name="percentage"
                                        value={formData.percentage}
                                        onChange={handleInputChange}
                                        className="w-24 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                        disabled={isSubmitting}
                                    />
                                    <span className="ml-2">%</span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Berlaku untuk Outlet <span className="text-red-500">*</span>
                                </label>

                                {isLoadingOutlets ? (
                                    <p className="text-gray-500">Memuat daftar outlet...</p>
                                ) : (
                                    <div className="border rounded-md p-3 space-y-2">
                                        {outlets.map(outlet => (
                                            <div key={outlet._id} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`outlet-${outlet._id}`}
                                                    value={outlet._id}
                                                    checked={formData.appliesToOutlets.includes(outlet._id)}
                                                    onChange={handleOutletChange}
                                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                    disabled={isSubmitting}
                                                />
                                                <label htmlFor={`outlet-${outlet._id}`} className="ml-2 text-sm text-gray-700">
                                                    {outlet.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Modal Footer - Fixed at Bottom */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition"
                        disabled={isSubmitting}
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition disabled:opacity-50"
                        disabled={isSubmitting || isLoadingOutlets || isLoadingTax}
                    >
                        {isSubmitting ? 'Menyimpan...' : 'Perbarui'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default UpdateTax;