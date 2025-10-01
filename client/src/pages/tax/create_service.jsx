import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";

const CreateService = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        type: "service",
        name: "",
        description: "",
        percentage: "",
        fixedFee: "",
        appliesToOutlets: [],
        appliesToMenuItems: [],
        appliesToCustomerTypes: [],
    });
    const [outlets, setOutlets] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [customerTypes, setCustomerTypes] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Fetch available outlets, menu items, and customer types when modal opens
    useEffect(() => {
        if (isOpen) {
            const fetchOutlets = async () => {
                setIsLoadingData(true);
                try {
                    const response = await axios.get("/api/outlet");
                    setOutlets(response.data.data);
                } catch (error) {
                    console.error("Error fetching outlets:", error);
                    toast.error("Gagal memuat daftar outlet");
                } finally {
                    setIsLoadingData(false);
                }
            };
            fetchOutlets();
        }
    }, [isOpen]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                type: "service",
                name: "",
                description: "",
                percentage: "",
                fixedFee: "",
                appliesToOutlets: [],
                appliesToMenuItems: [],
                appliesToCustomerTypes: [],
            });
        }
    }, [isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckboxChange = (e, field) => {
        const value = e.target.value;
        const isChecked = e.target.checked;

        setFormData(prev => {
            if (isChecked) {
                return {
                    ...prev,
                    [field]: [...prev[field], value]
                };
            } else {
                return {
                    ...prev,
                    [field]: prev[field].filter(id => id !== value)
                };
            }
        });
    };

    const handleOutletChange = (e) => {
        const outletId = e.target.value;
        const isChecked = e.target.checked;

        setFormData(prev => {
            if (isChecked) {
                return {
                    ...prev,
                    appliesToOutlets: [...prev.appliesToOutlets, outletId]
                };
            } else {
                return {
                    ...prev,
                    appliesToOutlets: prev.appliesToOutlets.filter(id => id !== outletId)
                };
            }
        });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.appliesToOutlets.length === 0) {
            toast.error("Harus memilih minimal satu outlet");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await axios.post("/api/tax-service", {
                ...formData,
                percentage: formData.percentage ? parseFloat(formData.percentage) : undefined,
                fixedFee: formData.fixedFee ? parseFloat(formData.fixedFee) : undefined,
            });

            toast.success("Servis berhasil dibuat");

            // Call onSuccess callback if provided
            if (onSuccess) {
                onSuccess(response.data);
            }

            // Close modal after success
            setTimeout(() => {
                onClose();
            }, 1000);

        } catch (error) {
            console.error("Error creating Service:", error);
            const errorMessage = error.response?.data?.error ||
                error.response?.data?.message ||
                "Gagal membuat servis";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay Background */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Side Drawer - Slide from Right */}
            <div className={`fixed right-0 top-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Modal Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b bg-white">
                    <h2 className="text-xl font-semibold text-green-900">
                        Tambah Servis
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                        disabled={isSubmitting}
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Nama Servis <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                            required
                            placeholder="Masukkan nama servis"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Persentase Servis <span className="text-red-500">*</span>
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
                            />
                            <span className="ml-2">%</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Berlaku untuk Outlet <span className="text-red-500">*</span>
                        </label>

                        {isLoadingData ? (
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
                                        />
                                        <label htmlFor={`outlet-${outlet._id}`} className="ml-2 text-sm text-gray-700">
                                            {outlet.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer - Fixed at Bottom */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition"
                        disabled={isSubmitting}
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition disabled:opacity-50"
                        disabled={isSubmitting || isLoadingData}
                    >
                        {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default CreateService;