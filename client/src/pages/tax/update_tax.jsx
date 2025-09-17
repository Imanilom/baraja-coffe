import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaBell, FaClipboardList, FaUser } from "react-icons/fa";
import { toast } from "react-toastify";

const UpdateTax = () => {
    const { id } = useParams(); // Ambil taxId dari URL
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
    const navigate = useNavigate();

    // Fetch outlets
    useEffect(() => {
        const fetchOutlets = async () => {
            setIsLoadingOutlets(true);
            try {
                const response = await axios.get("/api/outlet");
                setOutlets(response.data.data);
            } catch (error) {
                console.error("Error fetching outlets:", error);
                toast.error("Gagal memuat daftar outlet");
            } finally {
                setIsLoadingOutlets(false);
            }
        };
        fetchOutlets();
    }, []);

    // Fetch tax detail by ID
    useEffect(() => {
        const fetchTax = async () => {
            setIsLoadingTax(true);
            try {
                const response = await axios.get(`/api/tax-service/${id}`);

                const tax = response.data?.data || response.data; // fallback

                setFormData({
                    type: tax.type || "tax",
                    name: tax.name || "",
                    percentage: tax.percentage !== undefined ? String(tax.percentage) : "",
                    appliesToOutlets: tax.appliesToOutlets?.map(o => o._id) || [],
                });
            } catch (error) {
                console.error("Error fetching Tax:", error);
                toast.error("Gagal memuat data pajak");
            } finally {
                setIsLoadingTax(false);
            }
        };
        if (id) fetchTax();
    }, [id]);


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

        setFormData((prev) => {
            if (isChecked) {
                return {
                    ...prev,
                    appliesToOutlets: [...prev.appliesToOutlets, outletId],
                };
            } else {
                return {
                    ...prev,
                    appliesToOutlets: prev.appliesToOutlets.filter(
                        (id) => id !== outletId
                    ),
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
            await axios.put(`/api/tax-service/${id}`, {
                ...formData,
                percentage: parseFloat(formData.percentage),
            });

            toast.success("Pajak berhasil diperbarui");

            setTimeout(() => {
                navigate("/admin/tax-and-service");
            }, 1500);
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
                <FaBell size={23} className="text-gray-400" />
                <span className="text-[14px]">Hi Baraja</span>
                <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
                    <FaUser size={30} />
                </Link>
            </div>

            {/* Breadcrumb */}
            <div className="px-3 py-2 flex justify-between items-center border-b bg-white">
                <div className="flex items-center space-x-2">
                    <FaClipboardList size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Edit Pajak</p>
                </div>
            </div>

            <div className="p-3 max-w-4xl mx-auto">
                <form
                    onSubmit={handleSubmit}
                    className="mt-4 bg-white p-6 rounded-lg shadow"
                >
                    {isLoadingTax ? (
                        <p>Memuat data pajak...</p>
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
                                    />
                                    <span className="ml-2">%</span>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Berlaku untuk Outlet <span className="text-red-500">*</span>
                                </label>

                                {isLoadingOutlets ? (
                                    <p>Memuat daftar outlet...</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {outlets.map((outlet) => (
                                            <div
                                                key={outlet._id}
                                                className="flex items-center"
                                            >
                                                <input
                                                    type="checkbox"
                                                    id={`outlet-${outlet._id}`}
                                                    value={outlet._id}
                                                    checked={formData.appliesToOutlets.includes(
                                                        outlet._id
                                                    )}
                                                    onChange={handleOutletChange}
                                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                />
                                                <label
                                                    htmlFor={`outlet-${outlet._id}`}
                                                    className="ml-2 text-sm text-gray-700"
                                                >
                                                    {outlet.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                                <Link
                                    to="/admin/tax-and-service"
                                    className="px-4 py-2 border border-green-700 text-green-700 rounded hover:bg-green-50 transition"
                                >
                                    Batal
                                </Link>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition disabled:opacity-50"
                                    disabled={isSubmitting || isLoadingOutlets}
                                >
                                    {isSubmitting ? "Menyimpan..." : "Perbarui"}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
};

export default UpdateTax;
