// import React from "react";
// import Select from "react-select";
// import { FaTrash } from "react-icons/fa";

// const BundlingForm = ({ products, formData, setFormData }) => {
//     const customSelectStyles = {
//         control: (provided, state) => ({
//             ...provided,
//             borderColor: '#d1d5db',
//             minHeight: '34px',
//             fontSize: '13px',
//             color: '#6b7280',
//             boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none',
//             '&:hover': { borderColor: '#9ca3af' },
//         }),
//         singleValue: (provided) => ({ ...provided, color: '#6b7280' }),
//         input: (provided) => ({ ...provided, color: '#6b7280' }),
//         placeholder: (provided) => ({ ...provided, color: '#9ca3af', fontSize: '13px' }),
//         option: (provided, state) => ({
//             ...provided,
//             fontSize: '13px',
//             color: '#374151',
//             backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white',
//             cursor: 'pointer',
//         }),
//     };

//     // Toggle potongan
//     const handleDiscountTypeChange = (type) => {
//         setFormData((prev) => ({
//             ...prev,
//             discountType: type,
//             conditions: {
//                 ...prev.conditions,
//                 bundleProducts: prev.conditions.bundleProducts.map((bp) => ({
//                     ...bp,
//                     discountType: type,
//                 })),
//             },
//         }));
//     };

//     return (
//         <div className="space-y-5">
//             {/* Produk Bundling */}
//             <fieldset className="space-y-3">
//                 <legend className="block text-sm font-medium text-gray-700">
//                     Produk Bundling
//                 </legend>

//                 {(formData.conditions.bundleProducts || []).map((b, idx) => {
//                     const selectedProduct = products.find((p) => p.id === b.product);
//                     const hargaNormal = selectedProduct
//                         ? selectedProduct.originalPrice * (b.quantity || 0)
//                         : 0;

//                     return (
//                         <div
//                             key={idx}
//                             className="grid grid-cols-3 gap-3 items-center text-sm"
//                         >
//                             {/* Pilih Produk */}
//                             <Select
//                                 value={
//                                     products
//                                         .map((p) => ({ value: p.id, label: p.name }))
//                                         .find((opt) => opt.value === b.product) || null
//                                 }
//                                 onChange={(selected) => {
//                                     const newBundles = [...formData.conditions.bundleProducts];
//                                     newBundles[idx].product = selected.value;
//                                     setFormData((prev) => ({
//                                         ...prev,
//                                         conditions: { ...prev.conditions, bundleProducts: newBundles },
//                                     }));
//                                 }}
//                                 options={products.map((p) => ({
//                                     value: p.id,
//                                     label: p.name,
//                                 }))}
//                                 styles={customSelectStyles}
//                             />

//                             {/* Harga Normal */}
//                             <input
//                                 type="text"
//                                 value={
//                                     selectedProduct
//                                         ? `Rp ${selectedProduct.originalPrice.toLocaleString("id-ID")}`
//                                         : "Rp 0"
//                                 }
//                                 disabled
//                                 className="px-2 py-2 border rounded-md bg-gray-100 text-gray-600 text-right"
//                             />

//                             {/* Qty */}
//                             <div className="flex items-center gap-2">
//                                 <span>Sebanyak *</span>
//                                 <input
//                                     type="number"
//                                     value={b.quantity || 1}
//                                     onChange={(e) => {
//                                         const newBundles = [...formData.conditions.bundleProducts];
//                                         newBundles[idx].quantity = Number(e.target.value);
//                                         setFormData((prev) => ({
//                                             ...prev,
//                                             conditions: {
//                                                 ...prev.conditions,
//                                                 bundleProducts: newBundles,
//                                             },
//                                         }));
//                                     }}
//                                     className="px-2 py-2 border rounded-md w-20 text-right border-gray-300"
//                                 />
//                                 {/* Tombol hapus */}
//                                 <button
//                                     type="button"
//                                     onClick={() => {
//                                         const newBundles = formData.conditions.bundleProducts.filter(
//                                             (_, i) => i !== idx
//                                         );
//                                         setFormData((prev) => ({
//                                             ...prev,
//                                             conditions: { ...prev.conditions, bundleProducts: newBundles },
//                                         }));
//                                     }}
//                                     className="text-red-500"
//                                 >
//                                     <FaTrash />
//                                 </button>
//                             </div>

//                         </div>
//                     );
//                 })}

//                 {/* Tambah Produk */}
//                 <button
//                     type="button"
//                     onClick={() => {
//                         const newBundles = [
//                             ...(formData.conditions.bundleProducts || []),
//                             {
//                                 product: "",
//                                 quantity: 1,
//                                 discountType: formData.discountType || "fixed",
//                                 discountValue: 0,
//                             },
//                         ];
//                         setFormData((prev) => ({
//                             ...prev,
//                             conditions: { ...prev.conditions, bundleProducts: newBundles },
//                         }));
//                     }}
//                     className="text-sm text-[#005429] mt-2"
//                 >
//                     + Tambah Produk
//                 </button>
//             </fieldset>

//             {/* Pilihan Potongan */}
//             <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Potongan *
//                 </label>
//                 <div className="flex gap-2">
//                     <div
//                         className={`px-3 py-1.5 rounded-md text-sm bg-[#005429] text-white`}
//                     >
//                         Dalam Nilai (Rp)
//                     </div>
//                 </div>
//             </div>

//             {/* Input Potongan per produk */}
//             <div className="space-y-2">
//                 <p className="text-sm text-gray-600">
//                     Potongan harga berlaku untuk satu buah produk
//                 </p>
//                 {(formData.conditions.bundleProducts || []).map((b, idx) => {
//                     const product = products.find((p) => p.id === b.product);
//                     const hargaNormal = product
//                         ? product.originalPrice * (b.quantity || 0)
//                         : 0;

//                     let hargaSetelahDiskon = hargaNormal;
//                     if (formData.discountType === "percent") {
//                         hargaSetelahDiskon =
//                             hargaNormal - (b.discountValue / 100) * hargaNormal;
//                     } else {
//                         hargaSetelahDiskon = hargaNormal - (b.discountValue || 0);
//                     }

//                     return (
//                         <div
//                             key={`discount-${idx}`}
//                             className="grid grid-cols-3 gap-3 items-center text-sm"
//                         >
//                             {/* Input diskon */}
//                             <input
//                                 type="number"
//                                 value={b.discountValue || ""}
//                                 onChange={(e) => {
//                                     const newBundles = [...formData.conditions.bundleProducts];
//                                     newBundles[idx].discountValue = Number(e.target.value);
//                                     setFormData((prev) => ({
//                                         ...prev,
//                                         conditions: { ...prev.conditions, bundleProducts: newBundles },
//                                     }));
//                                 }}
//                                 className="px-2 py-2 border rounded-md border-gray-300"
//                             />

//                             <span>Harga setelah potongan</span>

//                             <input
//                                 type="text"
//                                 value={`Rp ${hargaSetelahDiskon.toLocaleString("id-ID")}`}
//                                 disabled
//                                 className="px-2 py-2 border rounded-md bg-gray-100 text-gray-600 text-right"
//                             />
//                         </div>
//                     );
//                 })}
//             </div>

//             {/* Total Harga */}
//             {(() => {
//                 const totalNormal = (formData.conditions.bundleProducts || []).reduce(
//                     (acc, b) => {
//                         const product = products.find((p) => p.id === b.product);
//                         return acc + (product ? product.originalPrice * (b.quantity || 0) : 0);
//                     },
//                     0
//                 );

//                 const totalPromo = (formData.conditions.bundleProducts || []).reduce(
//                     (acc, b) => {
//                         const product = products.find((p) => p.id === b.product);
//                         if (!product) return acc;

//                         const hargaNormal = product.originalPrice * (b.quantity || 0);
//                         let hargaSetelahDiskon = hargaNormal;

//                         if (formData.discountType === "percent") {
//                             hargaSetelahDiskon =
//                                 hargaNormal - (b.discountValue / 100) * hargaNormal;
//                         } else {
//                             hargaSetelahDiskon = hargaNormal - (b.discountValue || 0);
//                         }

//                         return acc + hargaSetelahDiskon;
//                     },
//                     0
//                 );

//                 return (
//                     <div className="grid grid-cols-3 gap-4 text-sm">
//                         <div>
//                             <input
//                                 type="text"
//                                 value={`Rp ${totalNormal.toLocaleString("id-ID")}`}
//                                 disabled
//                                 className="w-full px-2 py-2 border rounded-md bg-gray-100 text-gray-600 text-right"
//                             />
//                         </div>
//                         <div className=""></div>
//                         <div>
//                             <input
//                                 type="text"
//                                 value={formData.bundlePrice || `Rp ${totalPromo.toLocaleString("id-ID")}`}
//                                 disabled
//                                 className="w-full px-2 py-2 border rounded-md bg-gray-100 text-gray-600 text-right"
//                             />
//                         </div>
//                     </div>
//                 );
//             })()}
//         </div>
//     );
// };

// export default BundlingForm;

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

    // Hitung total promo
    const calculateTotalPromo = (bundleProducts, discountType) => {
        return (bundleProducts || []).reduce((acc, b) => {
            const product = products.find((p) => p.id === b.product);
            if (!product) return acc;

            const hargaNormal = product.originalPrice * (b.quantity || 0);
            let hargaSetelahDiskon = hargaNormal;

            if (discountType === "percent") {
                hargaSetelahDiskon =
                    hargaNormal - (b.discountValue / 100) * hargaNormal;
            } else {
                hargaSetelahDiskon = hargaNormal - (b.discountValue || 0);
            }

            return acc + hargaSetelahDiskon;
        }, 0);
    };

    // Update bundlePrice otomatis setiap kali bundleProducts/discountType berubah
    useEffect(() => {
        const totalPromo = calculateTotalPromo(
            formData.conditions.bundleProducts,
            formData.discountType
        );

        setFormData((prev) => ({
            ...prev,
            bundlePrice: totalPromo,
        }));
    }, [formData.conditions.bundleProducts, formData.discountType]);

    // Toggle potongan
    const handleDiscountTypeChange = (type) => {
        setFormData((prev) => ({
            ...prev,
            discountType: type,
            conditions: {
                ...prev.conditions,
                bundleProducts: prev.conditions.bundleProducts.map((bp) => ({
                    ...bp,
                    discountType: type,
                })),
            },
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
                            />

                            {/* Harga Normal */}
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
                                className="px-2 py-2 border rounded-md bg-gray-100 text-gray-600 text-right"
                            />

                            {/* Qty + hapus */}
                            <div className="flex items-center gap-2">
                                <span>Sebanyak *</span>
                                <input
                                    type="number"
                                    value={b.quantity || 1}
                                    onChange={(e) => {
                                        const newBundles = [
                                            ...formData.conditions.bundleProducts,
                                        ];
                                        newBundles[idx].quantity = Number(e.target.value);
                                        setFormData((prev) => ({
                                            ...prev,
                                            conditions: {
                                                ...prev.conditions,
                                                bundleProducts: newBundles,
                                            },
                                        }));
                                    }}
                                    className="px-2 py-2 border rounded-md w-20 text-right border-gray-300"
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
                                    className="text-red-500"
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
                                discountType: formData.discountType || "fixed",
                                discountValue: 0,
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
                    className="text-sm text-[#005429] mt-2"
                >
                    + Tambah Produk
                </button>
            </fieldset>

            {/* Pilihan Potongan */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Potongan *
                </label>
                <div className="flex gap-2">
                    <div
                        className={`px-3 py-1.5 rounded-md text-sm bg-[#005429] text-white`}
                    >
                        Dalam Nilai (Rp)
                    </div>
                </div>
            </div>

            {/* Input Potongan per produk */}
            <div className="space-y-2">
                <p className="text-sm text-gray-600">
                    Potongan harga berlaku untuk satu buah produk
                </p>
                {(formData.conditions.bundleProducts || []).map((b, idx) => {
                    const product = products.find((p) => p.id === b.product);
                    const hargaNormal = product
                        ? product.originalPrice * (b.quantity || 0)
                        : 0;

                    let hargaSetelahDiskon = hargaNormal;
                    if (formData.discountType === "percent") {
                        hargaSetelahDiskon =
                            hargaNormal - (b.discountValue / 100) * hargaNormal;
                    } else {
                        hargaSetelahDiskon = hargaNormal - (b.discountValue || 0);
                    }

                    return (
                        <div
                            key={`discount-${idx}`}
                            className="grid grid-cols-3 gap-3 items-center text-sm"
                        >
                            <input
                                type="number"
                                value={b.discountValue || ""}
                                onChange={(e) => {
                                    const newBundles = [
                                        ...formData.conditions.bundleProducts,
                                    ];
                                    newBundles[idx].discountValue = Number(e.target.value);
                                    setFormData((prev) => ({
                                        ...prev,
                                        conditions: {
                                            ...prev.conditions,
                                            bundleProducts: newBundles,
                                        },
                                    }));
                                }}
                                className="px-2 py-2 border rounded-md border-gray-300"
                            />

                            <span>Harga setelah potongan</span>

                            <input
                                type="text"
                                value={`Rp ${hargaSetelahDiskon.toLocaleString("id-ID")}`}
                                disabled
                                className="px-2 py-2 border rounded-md bg-gray-100 text-gray-600 text-right"
                            />
                        </div>
                    );
                })}
            </div>

            {/* Total Harga */}
            {(() => {
                const totalNormal = (
                    formData.conditions.bundleProducts || []
                ).reduce((acc, b) => {
                    const product = products.find((p) => p.id === b.product);
                    return (
                        acc + (product ? product.originalPrice * (b.quantity || 0) : 0)
                    );
                }, 0);

                return (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <input
                                type="text"
                                value={`Rp ${totalNormal.toLocaleString("id-ID")}`}
                                disabled
                                className="w-full px-2 py-2 border rounded-md bg-gray-100 text-gray-600 text-right"
                            />
                        </div>
                        <div></div>
                        <div>
                            <input
                                type="text"
                                value={`Rp ${(formData.bundlePrice || 0).toLocaleString(
                                    "id-ID"
                                )}`}
                                disabled
                                className="w-full px-2 py-2 border rounded-md bg-gray-100 text-gray-600 text-right"
                            />
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default BundlingForm;
