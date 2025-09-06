import React, { useEffect, useState } from "react";
import { FaBell, FaUser, FaShoppingBag, FaChevronRight, FaTrash, FaTrashAlt } from 'react-icons/fa';
import axios from "axios";
import Select from 'react-select';
import { Link, useNavigate, useParams } from "react-router-dom";
import Header from "../../admin/header";

const ReceiptMenu = () => {
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: '#d1d5db', // Tailwind border-gray-300
            minHeight: '34px',
            fontSize: '13px',
            color: '#6b7280', // text-gray-500
            boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none', // blue-500 on focus
            '&:hover': {
                borderColor: '#9ca3af', // Tailwind border-gray-400
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#6b7280', // text-gray-500
        }),
        input: (provided) => ({
            ...provided,
            color: '#6b7280', // text-gray-500 for typed text
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9ca3af', // text-gray-400
            fontSize: '13px',
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '13px',
            color: '#374151', // gray-700
            backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white', // blue-50
            cursor: 'pointer',
        }),
    };
    const { id } = useParams();
    const navigate = useNavigate();
    const [menuName, setMenuName] = useState("");
    const [productList, setProductList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [menuItemStatus, setMenuItemStatus] = useState({
        isComplete: false,
        missingFields: []
    });
    const [baseIngredients, setBaseIngredients] = useState([
        { productId: "", productName: "", productSku: "", quantity: "", unit: "" }
    ]);
    const [toppingOptions, setToppingOptions] = useState([]);
    const [addonOptions, setAddonOptions] = useState([]);
    const [existingRecipeId, setExistingRecipeId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const menuRes = await axios.get(`/api/menu/menu-items/${id}`);
                const menuData = menuRes.data.data;
                setMenuName(menuData.name || "");
                checkMenuItemCompleteness(menuData);
                initializeRecipeForm(menuData);
                const productsRes = await axios.get("/api/marketlist/products");
                setProductList(productsRes.data.data);
                const recipeRes = await axios.get(`/api/product/recipes`);
                const allRecipes = recipeRes.data?.data || [];

                // Cari resep yang memiliki menuItemId._id === id
                const existingRecipe = allRecipes.find(r => r.menuItemId?._id === id);
                if (existingRecipe) {
                    setExistingRecipeId(existingRecipe._id);

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
                }

            } catch (error) {
                console.error("Failed to fetch data:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);

    const checkMenuItemCompleteness = (menuData) => {
        const missingFields = [];
        if (!menuData.category) missingFields.push('category');

        setMenuItemStatus({
            isComplete: missingFields.length === 0,
            missingFields
        });
    };

    const [mainIngredients, setMainIngredients] = useState([
        { productId: "", productName: "", productSku: "", quantity: "", unit: "", isDefault: true }
    ]);

    const [subIngredients, setSubIngredients] = useState([
        { productId: "", productName: "", productSku: "", quantity: "", unit: "", isDefault: false }
    ]);

    const initializeRecipeForm = (menuData) => {

        const toppings = (menuData.toppings || []).map((t) => ({
            toppingName: t.name,
            ingredients: [{ productId: "", productName: "", productSku: "", quantity: "", unit: "" }]
        }));
        setToppingOptions(toppings);

        const addons = (menuData.addons || []).map((a) => ({
            addonName: a.name,
            optionLabel: a.options?.[0]?.label || "",
            ingredients: [{ productId: "", productName: "", productSku: "", quantity: "", unit: "" }]
        }));

        setAddonOptions(addons);
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
        const combinedIngredients = [...mainIngredients, ...subIngredients];

        if (combinedIngredients.length === 0) {
            alert('Harus ada minimal 1 bahan utama atau tambahan');
            return false;
        }

        // const invalid = combinedIngredients.some(ing =>
        //     !ing.productId || !ing.quantity || !ing.unit
        // );

        // if (invalid) {
        //     alert('Semua bahan harus lengkap (produk, quantity, dan unit)');
        //     return false;
        // }

        if (!menuItemStatus.isComplete) {
            alert(`Menu belum lengkap: ${menuItemStatus.missingFields.join(', ')}`);
            return false;
        }

        return true;
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const combinedIngredients = [...mainIngredients, ...subIngredients];

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
                })),
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
        };

        try {
            let response;
            if (existingRecipeId) {
                response = await axios.put(`/api/product/recipes/${existingRecipeId}`, payload);
            } else {
                response = await axios.post(`/api/product/recipes`, payload);
            }

            if (response.data.success) {
                alert("Resep berhasil dibuat.");
                navigate("/admin/menu");
            } else {
                alert(`Gagal membuat resep: ${response.data.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error("Error details:", err);
            alert(`Gagal membuat resep: ${err.response?.data?.message || err.message}`);
        }
    };


    if (loading) {
        return <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
        </div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen">
            <div className="text-red-500 text-center">
                <p className="text-xl font-semibold mb-2">Error</p>
                <p>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                >
                    Refresh
                </button>
            </div>
        </div>;
    }

    return (
        <div className="w-full">
            {/* Header */}
            <Header />

            {/* Breadcrumb */}
            <div className="px-3 py-4 flex items-center border-b bg-white">
                <div className="flex items-center space-x-2 text-gray-400">
                    <FaShoppingBag size={21} />
                    <Link to="/admin/menu">Produk</Link>
                    <FaChevronRight />
                    <p>{menuName}</p>
                    <FaChevronRight />
                    <span>Kelola Resep</span>
                </div>
            </div>

            {/* Main Form */}
            <div className="w-full pb-6 mb-[60px]">
                <div className="px-[15px] pb-[15px]">
                    {!menuItemStatus.isComplete && (
                        <div className="my-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
                            <p className="font-bold">Perhatian!</p>
                            <p>Menu item belum lengkap. Harap lengkapi field berikut: {menuItemStatus.missingFields.join(', ')} sebelum membuat resep.</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="my-[13px] shadow-lg space-y-10 p-6 bg-gray-50 rounded">

                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-4">Main Ingredients</h2>
                            {mainIngredients.map((item, index) => (
                                <div key={index} className="grid grid-cols-5 gap-4 mb-2 items-center">
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
                                        }}
                                        styles={customSelectStyles}
                                        placeholder="Pilih Bahan Baku"
                                        isClearable
                                        required
                                    />

                                    <input
                                        type="text"
                                        placeholder="SKU"
                                        value={item.productSku}
                                        onChange={(e) =>
                                            handleChange(setMainIngredients, mainIngredients, index, "productSku", e.target.value)
                                        }
                                        className="border rounded p-2 text-sm"
                                        disabled
                                    />

                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        value={item.quantity}
                                        onChange={(e) =>
                                            handleChange(setMainIngredients, mainIngredients, index, "quantity", e.target.value)
                                        }
                                        className="border rounded p-2 text-sm"
                                        min="0"
                                        step="0.01"
                                        required
                                    />

                                    <input
                                        type="text"
                                        placeholder="Satuan"
                                        value={item.unit}
                                        onChange={(e) =>
                                            handleChange(setMainIngredients, mainIngredients, index, "unit", e.target.value)
                                        }
                                        className="border rounded p-2 text-sm lowercase"
                                        disabled
                                    />

                                    {/* ❌ tidak ada tombol hapus */}
                                </div>
                            ))}
                            {/* ❌ tidak ada tombol tambah */}
                        </div>

                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-4">Sub Ingredients</h2>
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
                                    />

                                    <input
                                        type="text"
                                        placeholder="SKU"
                                        value={item.productSku}
                                        onChange={(e) =>
                                            handleChange(setSubIngredients, subIngredients, index, "productSku", e.target.value)
                                        }
                                        className="border rounded p-2 text-sm"
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
                                        step="0.01"
                                    />

                                    <input
                                        type="text"
                                        placeholder="Satuan"
                                        value={item.unit}
                                        onChange={(e) =>
                                            handleChange(setSubIngredients, subIngredients, index, "unit", e.target.value)
                                        }
                                        className="border rounded p-2 text-sm lowercase"
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
                                        className="text-red-500 text-sm"
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
                                className="text-blue-600 text-sm mt-2"
                            >
                                + Tambah Sub Ingredient
                            </button>
                        </div>

                        {/* Toppings */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Bahan Topping</h2>
                            {toppingOptions.map((topping, tIdx) => (
                                <div key={tIdx} className="mb-6 border border-gray-200 p-4 rounded">
                                    <div className="flex items-center gap-4 mb-3">
                                        <input
                                            type="text"
                                            placeholder="Nama Topping"
                                            value={topping.toppingName}
                                            onChange={(e) => {
                                                const updated = [...toppingOptions];
                                                updated[tIdx].toppingName = e.target.value;
                                                setToppingOptions(updated);
                                            }}
                                            className="border p-2 rounded text-sm w-full"
                                            required
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
                                                isClearable
                                                required
                                            />

                                            <input
                                                type="text"
                                                placeholder="SKU"
                                                value={ing.productSku}
                                                onChange={(e) =>
                                                    handleNestedChange(setToppingOptions, toppingOptions, tIdx, iIdx, "productSku", e.target.value)
                                                }
                                                className="border rounded p-2 text-sm"
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
                                                step="0.01"
                                                required
                                            />
                                            <input
                                                type="text"
                                                placeholder="Satuan"
                                                value={ing.unit}
                                                onChange={(e) =>
                                                    handleNestedChange(setToppingOptions, toppingOptions, tIdx, iIdx, "unit", e.target.value)
                                                }
                                                className="border rounded p-2 text-sm lowercase"
                                                disabled
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = [...toppingOptions];
                                                    updated[tIdx].ingredients = updated[tIdx].ingredients.filter((_, i) => i !== iIdx);
                                                    setToppingOptions(updated);
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
                                        className="text-blue-600 text-sm mt-2"
                                    >
                                        + Tambah Bahan
                                    </button>
                                </div>
                            ))}
                        </div>

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
                                                step="0.01"
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

            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]"></div>
            </div>
        </div>
    );
};

export default ReceiptMenu;