import React, { useEffect } from "react";
import Select from "react-select";
import { FaTrash } from "react-icons/fa";

const BundlingForm = ({ products, formData, setFormData }) => {
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: "#d1d5db",
            minHeight: "34px",
            fontSize: "13px",
            color: "#6b7280",
            boxShadow: state.isFocused ? "0 0 0 1px #005429" : "none",
            "&:hover": { borderColor: "#9ca3af" },
        }),
        singleValue: (provided) => ({ ...provided, color: "#6b7280" }),
        input: (provided) => ({ ...provided, color: "#6b7280" }),
        placeholder: (provided) => ({
            ...provided,
            color: "#9ca3af",
            fontSize: "13px",
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: "13px",
            color: "#374151",
            backgroundColor: state.isFocused ? "rgba(0, 84, 41, 0.1)" : "white",
            cursor: "pointer",
        }),
    };

    // Hitung total harga normal
    const calculateTotalNormal = () => {
        return (formData.conditions.bundleProducts || []).reduce((acc, b) => {
            const product = products.find((p) => p.id === b.product);
            return acc + (product ? product.originalPrice * (b.quantity || 0) : 0);
        }, 0);
    };

    // Update bundlePrice dan discount
    useEffect(() => {
        const totalNormal = calculateTotalNormal();

        // Jika bundlePrice sudah ada dari data (mode edit), hitung discount
        if (formData.bundlePrice && formData.bundlePrice > 0 && !formData._isUserInputting) {
            const calculatedDiscount = Math.max(0, totalNormal - formData.bundlePrice);
            setFormData((prev) => ({
                ...prev,
                discount: calculatedDiscount,
            }));
        }
        // Jika user input discount (mode create atau edit discount), hitung bundlePrice
        else {
            const totalDiscount = formData.discount || 0;
            const finalPrice = Math.max(0, totalNormal - totalDiscount);
            setFormData((prev) => ({
                ...prev,
                bundlePrice: finalPrice,
            }));
        }
    }, [formData.conditions.bundleProducts]);

    // Handle perubahan discount dari user
    const handleDiscountChange = (value) => {
        const maxDiscount = calculateTotalNormal();
        const finalDiscount = Math.min(value, maxDiscount);
        const finalPrice = Math.max(0, calculateTotalNormal() - finalDiscount);

        setFormData((prev) => ({
            ...prev,
            discount: finalDiscount,
            bundlePrice: finalPrice,
            _isUserInputting: true,
        }));
    };

    return (
        <div className="space-y-5">
            {/* Produk Bundling */}
            <fieldset className="space-y-3">
                <legend className="block text-sm font-medium text-gray-700">
                    Produk Bundling
                </legend>

                {(formData.conditions.bundleProducts || []).map((b, idx) => {
                    const selectedProduct = products.find((p) => p.id === b.product);

                    return (
                        <div
                            key={idx}
                            className="grid grid-cols-3 gap-3 items-center text-sm"
                        >
                            {/* Pilih Produk */}
                            <Select
                                value={
                                    products
                                        .map((p) => ({ value: p.id, label: p.name }))
                                        .find((opt) => opt.value === b.product) || null
                                }
                                onChange={(selected) => {
                                    const newBundles = [
                                        ...formData.conditions.bundleProducts,
                                    ];
                                    newBundles[idx].product = selected.value;
                                    setFormData((prev) => ({
                                        ...prev,
                                        conditions: {
                                            ...prev.conditions,
                                            bundleProducts: newBundles,
                                        },
                                    }));
                                }}
                                options={products.map((p) => ({
                                    value: p.id,
                                    label: p.name,
                                }))}
                                styles={customSelectStyles}
                                placeholder="Pilih produk"
                            />

                            {/* Harga Normal per Item */}
                            <input
                                type="text"
                                value={
                                    selectedProduct
                                        ? `Rp ${selectedProduct.originalPrice.toLocaleString(
                                            "id-ID"
                                        )}`
                                        : "Rp 0"
                                }
                                disabled
                                className="px-2 py-2 border rounded-md bg-gray-100 text-gray-600 text-right text-sm"
                            />

                            {/* Qty + Hapus */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm">Sebanyak</span>
                                <input
                                    type="number"
                                    min="1"
                                    value={b.quantity || 1}
                                    onChange={(e) => {
                                        const newBundles = [
                                            ...formData.conditions.bundleProducts,
                                        ];
                                        newBundles[idx].quantity = Math.max(1, Number(e.target.value));
                                        setFormData((prev) => ({
                                            ...prev,
                                            conditions: {
                                                ...prev.conditions,
                                                bundleProducts: newBundles,
                                            },
                                        }));
                                    }}
                                    className="px-2 py-2 border rounded-md w-20 text-right border-gray-300 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newBundles =
                                            formData.conditions.bundleProducts.filter(
                                                (_, i) => i !== idx
                                            );
                                        setFormData((prev) => ({
                                            ...prev,
                                            conditions: {
                                                ...prev.conditions,
                                                bundleProducts: newBundles,
                                            },
                                        }));
                                    }}
                                    className="text-red-500 hover:text-red-700 ml-2"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Tambah Produk */}
                <button
                    type="button"
                    onClick={() => {
                        const newBundles = [
                            ...(formData.conditions.bundleProducts || []),
                            {
                                product: "",
                                quantity: 1,
                            },
                        ];
                        setFormData((prev) => ({
                            ...prev,
                            conditions: {
                                ...prev.conditions,
                                bundleProducts: newBundles,
                            },
                        }));
                    }}
                    className="text-sm text-[#005429] hover:text-[#007038] font-medium mt-2"
                >
                    + Tambah Produk
                </button>
            </fieldset>

            {/* Total Harga */}
            <div className="border-t pt-4">
                {/* Input Potongan Total */}
                <div className="bg-gray-50 rounded-lg space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                        Potongan Harga Bundling (Rp) *
                    </label>
                    <input
                        type="number"
                        min="0"
                        max={calculateTotalNormal()}
                        value={formData.discount || ""}
                        onChange={(e) => handleDiscountChange(Number(e.target.value))}
                        placeholder="Masukkan potongan dalam rupiah"
                        className="w-full px-3 py-2 text-sm border rounded-md border-gray-300 focus:ring-2 focus:ring-[#005429] focus:border-[#005429]"
                    />
                    <p className="text-xs text-gray-500">
                        Potongan maksimal: Rp {calculateTotalNormal().toLocaleString("id-ID")}
                    </p>
                </div>

                {/* Harga Setelah Diskon */}
                <div className="flex justify-between items-center my-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-sm font-semibold text-gray-700">Harga Bundling Final:</span>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-[#005429]">
                            Rp {(formData.bundlePrice || 0).toLocaleString("id-ID")}
                        </div>
                        {formData.discount > 0 && calculateTotalNormal() > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                                Hemat Rp {(formData.discount || 0).toLocaleString("id-ID")} (
                                {((formData.discount / calculateTotalNormal()) * 100).toFixed(1)}%)
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BundlingForm;