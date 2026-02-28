
import React, { useEffect, useState } from "react";
import { FaChevronRight } from 'react-icons/fa';
import axios from "axios";
import Select from 'react-select';
import { Link, useNavigate, useParams } from "react-router-dom";

const ReceiptMenu = () => {
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: '#d1d5db',
            minHeight: '34px',
            fontSize: '13px',
            color: '#6b7280',
            boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none',
            '&:hover': {
                borderColor: '#9ca3af',
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#6b7280',
        }),
        input: (provided) => ({
            ...provided,
            color: '#6b7280',
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9ca3af',
            fontSize: '13px',
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '13px',
            color: '#374151',
            backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white',
            cursor: 'pointer',
        }),
    };

    const { id } = useParams();
    const navigate = useNavigate();

    // States
    const [menuName, setMenuName] = useState("");
    const [productList, setProductList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [errors, setErrors] = useState({});
    const [menuItemStatus, setMenuItemStatus] = useState({
        isComplete: false,
        missingFields: []
    });
    const [existingRecipeId, setExistingRecipeId] = useState(null);

    const [mainIngredients, setMainIngredients] = useState([
        { productId: "", productName: "", productSku: "", quantity: "", unit: "", isDefault: true }
    ]);
    const [subIngredients, setSubIngredients] = useState([
        { productId: "", productName: "", productSku: "", quantity: "", unit: "", isDefault: false }
    ]);
    const [toppingOptions, setToppingOptions] = useState([]);
    const [addonOptions, setAddonOptions] = useState([]);

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setError("Menu ID tidak ditemukan");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Fetch semua data secara parallel
                const [menuRes, productsRes, recipesRes] = await Promise.all([
                    axios.get(`/api/menu/menu-items/${id}`),
                    axios.get("/api/marketlist/products"),
                    axios.get(`/api/product/recipes`)
                ]);

                // Process menu data
                const menuData = menuRes.data.data;
                setMenuName(menuData.name || "");
                checkMenuItemCompleteness(menuData);

                // Process products
                setProductList(productsRes.data.data || []);

                // Process existing recipe
                const allRecipes = recipesRes.data?.data || [];
                const existingRecipe = allRecipes.find(r => r.menuItemId?._id === id);

                if (existingRecipe) {
                    setExistingRecipeId(existingRecipe._id);

                    // Split ingredients berdasarkan isDefault
                    const main = (existingRecipe.baseIngredients || []).filter(ing => ing.isDefault);
                    const sub = (existingRecipe.baseIngredients || []).filter(ing => !ing.isDefault);

                    setMainIngredients(main.length ? main : [
                        { productId: "", productName: "", productSku: "", quantity: "", unit: "", isDefault: true }
                    ]);

                    setSubIngredients(sub.length ? sub : [
                        { productId: "", productName: "", productSku: "", quantity: "", unit: "", isDefault: false }
                    ]);

                    setToppingOptions(existingRecipe.toppingOptions || []);
                    setAddonOptions(existingRecipe.addonOptions || []);
                } else {
                    // Initialize form untuk menu baru
                    initializeRecipeForm(menuData);
                }

            } catch (error) {
                console.error("Failed to fetch data:", error);
                setError(error.response?.data?.message || error.message || "Gagal memuat data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const checkMenuItemCompleteness = (menuData) => {
        const missingFields = [];
        if (!menuData.category) missingFields.push('category');

        setMenuItemStatus({
            isComplete: missingFields.length === 0,
            missingFields
        });
    };

    const initializeRecipeForm = (menuData) => {
        // Initialize toppings
        const toppings = (menuData.toppings || []).map((t) => ({
            toppingName: t.name,
            ingredients: [{ productId: "", productName: "", productSku: "", quantity: "", unit: "" }]
        }));
        if (toppings.length > 0) {
            setToppingOptions(toppings);
        }

        // Initialize addons
        const addons = (menuData.addons || []).map((a) => ({
            addonName: a.name,
            optionLabel: a.options?.[0]?.label || "",
            ingredients: [{ productId: "", productName: "", productSku: "", quantity: "", unit: "" }]
        }));
        if (addons.length > 0) {
            setAddonOptions(addons);
        }
    };

    const productOptions = productList.map(product => ({
        value: product.name,
        label: `${product.name} (${product.sku})`,
        _id: product._id,
        sku: product.sku,
        unit: product.unit
    }));

    const handleChange = (setter, data, index, field, value) => {
        const updated = [...data];
        updated[index][field] = value;
        setter(updated);
    };

    const handleNestedChange = (setter, data, outerIdx, innerIdx, field, value) => {
        const updated = [...data];
        updated[outerIdx].ingredients[innerIdx][field] = value;
        setter(updated);
    };

    const validateForm = () => {
        const newErrors = {};

        // Validasi main ingredients
        mainIngredients.forEach((item, idx) => {
            if (!item.productName) {
                newErrors[`main_${idx}_productName`] = "Pilih bahan baku";
            }
            if (!item.quantity || Number(item.quantity) <= 0) {
                newErrors[`main_${idx}_quantity`] = "Masukkan jumlah yang valid";
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent validation saat form kosong
        if (!validateForm()) {
            return;
        }

        // Prevent double submit
        if (isSubmitting) {
            console.log("Already submitting, please wait...");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Re-check apakah recipe sudah ada (untuk handle race condition)
            const checkRecipe = await axios.get(`/api/product/recipes`);
            const allRecipes = checkRecipe.data?.data || [];
            const existingRecipe = allRecipes.find(r => r.menuItemId?._id === id);

            // Combine ingredients
            const combinedIngredients = [...mainIngredients, ...subIngredients];

            // Build payload
            const payload = {
                menuItemId: id,
                baseIngredients: combinedIngredients
                    .filter(item => item.productId && item.quantity && item.unit)
                    .map(item => ({
                        productId: item.productId,
                        productName: item.productName,
                        productSku: item.productSku,
                        quantity: Number(item.quantity),
                        unit: item.unit,
                        isDefault: item.isDefault || false
                    })),
                toppingOptions: toppingOptions
                    .filter(topping => topping.toppingName && topping.ingredients.length > 0)
                    .map(topping => ({
                        toppingName: topping.toppingName,
                        ingredients: topping.ingredients
                            .filter(ing => ing.productId && ing.quantity && ing.unit)
                            .map(ing => ({
                                productId: ing.productId,
                                productName: ing.productName,
                                productSku: ing.productSku,
                                quantity: Number(ing.quantity),
                                unit: ing.unit
                            }))
                    }))
                    .filter(topping => topping.ingredients.length > 0),
                addonOptions: addonOptions
                    .filter(addon => addon.addonName && addon.ingredients.length > 0)
                    .map(addon => ({
                        addonName: addon.addonName,
                        optionLabel: addon.optionLabel,
                        ingredients: addon.ingredients
                            .filter(ing => ing.productId && ing.quantity && ing.unit)
                            .map(ing => ({
                                productId: ing.productId,
                                productName: ing.productName,
                                productSku: ing.productSku,
                                quantity: Number(ing.quantity),
                                unit: ing.unit
                            }))
                    }))
                    .filter(addon => addon.ingredients.length > 0)
            };

            // Validate payload
            if (payload.baseIngredients.length === 0) {
                setError("Minimal harus ada 1 bahan utama yang lengkap");
                setIsSubmitting(false);
                return;
            }

            let response;

            if (existingRecipe) {
                // UPDATE existing recipe
                console.log("Updating existing recipe:", existingRecipe._id);
                response = await axios.put(`/api/product/recipes/${existingRecipe._id}`, payload);
            } else {
                // CREATE new recipe
                console.log("Creating new recipe for menu:", id);
                response = await axios.post(`/api/product/recipes`, payload);
            }

            if (response.data.success) {
                // Success - navigate dengan success message
                navigate("/admin/menu", {
                    state: {
                        success: existingRecipe
                            ? "Resep berhasil diperbarui"
                            : "Resep berhasil dibuat"
                    },
                    replace: true // Prevent back button issues
                });
            } else {
                setError(response.data.message || 'Gagal menyimpan resep');
                setIsSubmitting(false);
            }

        } catch (err) {
            console.error("Error submitting recipe:", err);
            const errorMessage = err.response?.data?.message || err.message || 'Gagal menyimpan resep';
            setError(errorMessage);
            setIsSubmitting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat data...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !isSubmitting) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-center max-w-md">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p className="mb-4">{error}</p>
                    <div className="space-x-2">
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded hover:bg-[#004520]"
                        >
                            Refresh
                        </button>
                        <Link
                            to="/admin/menu"
                            className="inline-block bg-gray-500 text-white text-[13px] px-[15px] py-[7px] rounded hover:bg-gray-600"
                        >
                            Kembali
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <div className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <Link to="/admin/menu" className="hover:underline">Produk</Link>
                    <FaChevronRight />
                    <p>{menuName}</p>
                    <FaChevronRight />
                    <span>Resep</span>
                </div>
            </div>

            {/* Main Form */}
            <div className="w-full px-6">
                {/* Error Alert */}
                {error && (
                    <div className="my-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                        <p className="font-bold">Error!</p>
                        <p>{error}</p>
                    </div>
                )}

                {/* Warning untuk menu incomplete */}
                {!menuItemStatus.isComplete && (
                    <div className="my-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
                        <p className="font-bold">Perhatian!</p>
                        <p>Menu item belum lengkap. Harap lengkapi field berikut: {menuItemStatus.missingFields.join(', ')} sebelum membuat resep.</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="my-[13px] shadow-lg space-y-10 p-6 bg-gray-50 rounded">
                    {/* Bahan Wajib */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-4">Bahan Wajib</h2>
                        {mainIngredients.map((item, index) => (
                            <div key={index} className="grid grid-cols-5 gap-4 mb-3 items-start">
                                {/* Select Bahan */}
                                <div>
                                    <Select
                                        className="text-sm"
                                        classNamePrefix="react-select"
                                        options={productOptions}
                                        value={productOptions.find(opt => opt.value === item.productName) || null}
                                        onChange={(selected) => {
                                            const updated = [...mainIngredients];
                                            updated[index] = {
                                                ...updated[index],
                                                productId: selected?._id || "",
                                                productName: selected?.value || "",
                                                productSku: selected?.sku || "",
                                                unit: selected?.unit || "",
                                            };
                                            setMainIngredients(updated);
                                            // Clear error saat diisi
                                            if (selected) {
                                                const newErrors = { ...errors };
                                                delete newErrors[`main_${index}_productName`];
                                                setErrors(newErrors);
                                            }
                                        }}
                                        styles={customSelectStyles}
                                        placeholder="Pilih Bahan Baku"
                                        isClearable
                                        isDisabled={isSubmitting}
                                    />
                                    {errors[`main_${index}_productName`] && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {errors[`main_${index}_productName`]}
                                        </p>
                                    )}
                                </div>

                                {/* SKU */}
                                <input
                                    type="text"
                                    placeholder="SKU"
                                    value={item.productSku}
                                    className="border rounded p-2 text-sm bg-gray-100"
                                    disabled
                                />

                                {/* Qty */}
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        value={item.quantity}
                                        onChange={(e) => {
                                            handleChange(setMainIngredients, mainIngredients, index, "quantity", e.target.value);
                                            // Clear error saat diisi
                                            if (e.target.value) {
                                                const newErrors = { ...errors };
                                                delete newErrors[`main_${index}_quantity`];
                                                setErrors(newErrors);
                                            }
                                        }}
                                        className="border w-full rounded p-2 text-sm"
                                        min="0"
                                        step="0.001"
                                        disabled={isSubmitting}
                                    />
                                    {errors[`main_${index}_quantity`] && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {errors[`main_${index}_quantity`]}
                                        </p>
                                    )}
                                </div>

                                {/* Unit */}
                                <input
                                    type="text"
                                    placeholder="Satuan"
                                    value={item.unit}
                                    className="border rounded p-2 text-sm lowercase bg-gray-100"
                                    disabled
                                />

                                {/* Hapus Button - hanya jika lebih dari 1 row */}
                                <div>
                                    {mainIngredients.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updated = mainIngredients.filter((_, i) => i !== index);
                                                setMainIngredients(updated);
                                            }}
                                            className="text-red-500 text-sm hover:text-red-700"
                                            disabled={isSubmitting}
                                        >
                                            Hapus
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() =>
                                setMainIngredients([
                                    ...mainIngredients,
                                    { productId: "", productName: "", productSku: "", quantity: "", unit: "", isDefault: true }
                                ])
                            }
                            className="text-blue-600 text-sm mt-2 hover:text-blue-800"
                            disabled={isSubmitting}
                        >
                            + Tambah Bahan Wajib
                        </button>
                    </div>

                    {/* Bahan Tambahan */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-4">Bahan Tambahan (Opsional)</h2>
                        {subIngredients.map((item, index) => (
                            <div key={index} className="grid grid-cols-5 gap-4 mb-2 items-center">
                                <Select
                                    className="text-sm"
                                    classNamePrefix="react-select"
                                    options={productOptions}
                                    value={productOptions.find(opt => opt.value === item.productName) || null}
                                    onChange={(selected) => {
                                        const updated = [...subIngredients];
                                        updated[index] = {
                                            ...updated[index],
                                            productId: selected?._id || "",
                                            productName: selected?.value || "",
                                            productSku: selected?.sku || "",
                                            unit: selected?.unit || "",
                                        };
                                        setSubIngredients(updated);
                                    }}
                                    placeholder="Pilih Bahan Baku"
                                    styles={customSelectStyles}
                                    isClearable
                                    isDisabled={isSubmitting}
                                />

                                <input
                                    type="text"
                                    placeholder="SKU"
                                    value={item.productSku}
                                    className="border rounded p-2 text-sm bg-gray-100"
                                    disabled
                                />

                                <input
                                    type="number"
                                    placeholder="Qty"
                                    value={item.quantity}
                                    onChange={(e) =>
                                        handleChange(setSubIngredients, subIngredients, index, "quantity", e.target.value)
                                    }
                                    className="border rounded p-2 text-sm"
                                    min="0"
                                    step="0.001"
                                    disabled={isSubmitting}
                                />

                                <input
                                    type="text"
                                    placeholder="Satuan"
                                    value={item.unit}
                                    className="border rounded p-2 text-sm lowercase bg-gray-100"
                                    disabled
                                />

                                <button
                                    type="button"
                                    onClick={() => {
                                        const updated = subIngredients.filter((_, i) => i !== index);
                                        setSubIngredients(updated.length ? updated : [
                                            { productId: "", productName: "", productSku: "", quantity: "", unit: "", isDefault: false }
                                        ]);
                                    }}
                                    className="text-red-500 text-sm hover:text-red-700"
                                    disabled={isSubmitting}
                                >
                                    Hapus
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() =>
                                setSubIngredients([
                                    ...subIngredients,
                                    { productId: "", productName: "", productSku: "", quantity: "", unit: "", isDefault: false }
                                ])
                            }
                            className="text-blue-600 text-sm mt-2 hover:text-blue-800"
                            disabled={isSubmitting}
                        >
                            + Tambah Bahan Tambahan
                        </button>
                    </div>

                    {/* Toppings */}
                    {toppingOptions.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Bahan Topping</h2>
                            {toppingOptions.map((topping, tIdx) => (
                                <div key={tIdx} className="mb-6 border border-gray-200 p-4 rounded">
                                    <div className="flex items-center gap-4 mb-3">
                                        <input
                                            type="text"
                                            placeholder="Nama Topping"
                                            value={topping.toppingName}
                                            className="border p-2 rounded text-sm w-full bg-gray-100"
                                            disabled
                                        />
                                    </div>

                                    {topping.ingredients.map((ing, iIdx) => (
                                        <div key={iIdx} className="grid grid-cols-5 gap-4 mb-2 items-center">
                                            <Select
                                                className="text-sm"
                                                classNamePrefix="react-select"
                                                options={productOptions}
                                                value={productOptions.find(opt => opt.value === ing.productName) || null}
                                                onChange={(select) => {
                                                    const updated = [...toppingOptions];
                                                    updated[tIdx].ingredients[iIdx] = {
                                                        ...updated[tIdx].ingredients[iIdx],
                                                        productId: select?._id || "",
                                                        productName: select?.value || "",
                                                        productSku: select?.sku || "",
                                                        unit: select?.unit || ""
                                                    };
                                                    setToppingOptions(updated);
                                                }}
                                                placeholder="Pilih Bahan"
                                                styles={customSelectStyles}
                                                isClearable
                                                isDisabled={isSubmitting}
                                            />

                                            <input
                                                type="text"
                                                placeholder="SKU"
                                                value={ing.productSku}
                                                className="border rounded p-2 text-sm bg-gray-100"
                                                disabled
                                            />
                                            <input
                                                type="number"
                                                placeholder="Qty"
                                                value={ing.quantity}
                                                onChange={(e) =>
                                                    handleNestedChange(setToppingOptions, toppingOptions, tIdx, iIdx, "quantity", e.target.value)
                                                }
                                                className="border rounded p-2 text-sm"
                                                min="0"
                                                step="0.001"
                                                disabled={isSubmitting}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Satuan"
                                                value={ing.unit}
                                                className="border rounded p-2 text-sm lowercase bg-gray-100"
                                                disabled
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = [...toppingOptions];
                                                    updated[tIdx].ingredients = updated[tIdx].ingredients.filter((_, i) => i !== iIdx);
                                                    setToppingOptions(updated);
                                                }}
                                                className="text-red-500 text-sm hover:text-red-700"
                                                disabled={isSubmitting}
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = [...toppingOptions];
                                            updated[tIdx].ingredients.push({
                                                productId: "",
                                                productName: "",
                                                productSku: "",
                                                quantity: "",
                                                unit: ""
                                            });
                                            setToppingOptions(updated);
                                        }}
                                        className="text-blue-600 text-sm mt-2 hover:text-blue-800"
                                        disabled={isSubmitting}
                                    >
                                        + Tambah Bahan
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Addons */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Bahan Addon</h2>
                        {addonOptions.map((addon, aIdx) => (
                            <div key={aIdx} className="mb-6 border border-gray-200 p-4 rounded">
                                <div className="grid grid-cols-2 gap-4 mb-3 items-center">
                                    <input
                                        type="text"
                                        placeholder="Nama Addon"
                                        value={addon.addonName}
                                        onChange={(e) => {
                                            const updated = [...addonOptions];
                                            updated[aIdx].addonName = e.target.value;
                                            setAddonOptions(updated);
                                        }}
                                        className="border w-full p-2 rounded text-sm"
                                        required
                                        disabled
                                    />
                                    <input
                                        type="text"
                                        placeholder="Label Opsi"
                                        value={addon.optionLabel}
                                        onChange={(e) => {
                                            const updated = [...addonOptions];
                                            updated[aIdx].optionLabel = e.target.value;
                                            setAddonOptions(updated);
                                        }}
                                        className="border p-2 rounded text-sm"
                                        required
                                        disabled
                                    />

                                </div>

                                {addon.ingredients.map((ing, iIdx) => (
                                    <div key={iIdx} className="grid grid-cols-5 gap-4 mb-2 items-center">
                                        <Select
                                            className="text-sm"
                                            classNamePrefix="react-select"
                                            options={productOptions}
                                            value={productOptions.find(opt => opt.value === ing.productName) || null}
                                            onChange={(select) => {
                                                const updated = [...addonOptions];
                                                updated[aIdx].ingredients[iIdx] = {
                                                    ...updated[aIdx].ingredients[iIdx],
                                                    productId: select?._id || "",
                                                    productName: select?.value || "",
                                                    productSku: select?.sku || "",
                                                    unit: select?.unit || "",
                                                };
                                                setAddonOptions(updated);
                                            }}
                                            placeholder="Pilih Bahan"
                                            isClearable
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="SKU"
                                            value={ing.productSku}
                                            onChange={(e) =>
                                                handleNestedChange(setAddonOptions, addonOptions, aIdx, iIdx, "productSku", e.target.value)
                                            }
                                            className="border rounded p-2 text-sm"
                                            disabled
                                        />
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            value={ing.quantity}
                                            onChange={(e) =>
                                                handleNestedChange(setAddonOptions, addonOptions, aIdx, iIdx, "quantity", e.target.value)
                                            }
                                            className="border rounded p-2 text-sm"
                                            min="0"
                                            step="0.001"
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Satuan"
                                            value={ing.unit}
                                            onChange={(e) =>
                                                handleNestedChange(setAddonOptions, addonOptions, aIdx, iIdx, "unit", e.target.value)
                                            }
                                            className="border rounded p-2 text-sm lowercase"
                                            disabled
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updated = [...addonOptions];
                                                updated[aIdx].ingredients = updated[aIdx].ingredients.filter((_, i) => i !== iIdx);
                                                setAddonOptions(updated);
                                            }}
                                            className="text-red-500 text-sm"
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => {
                                        const updated = [...addonOptions];
                                        updated[aIdx].ingredients.push({
                                            productId: "",
                                            productName: "",
                                            productSku: "",
                                            quantity: "",
                                            unit: ""
                                        });
                                        setAddonOptions(updated);
                                    }}
                                    className="text-blue-600 text-sm mt-2"
                                >
                                    + Tambah Bahan
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-2">
                        <Link to="/admin/menu"
                            className="bg-white text-[#005429] px-4 py-2 rounded border border-[#005429] hover:text-white hover:bg-[#005429] text-[13px]"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            className="bg-[#005429] text-white px-6 py-2 rounded"
                        >
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReceiptMenu;