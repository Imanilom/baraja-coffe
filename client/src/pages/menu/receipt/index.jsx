import React, { useEffect, useState } from "react";
import { FaBell, FaUser, FaShoppingBag, FaChevronRight } from 'react-icons/fa';
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";

const ReceiptMenu = () => {
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
                    console.log(existingRecipe);

                    // Jika ingin menampilkan resep yang sudah ada di form:
                    setBaseIngredients(existingRecipe.baseIngredients || []);
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

    const initializeRecipeForm = (menuData) => {
        setBaseIngredients([
            { productId: "", productName: "", productSku: "", quantity: "", unit: "" }
        ]);

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
        if (baseIngredients.length === 0) {
            alert('Harus ada minimal 1 bahan utama');
            return false;
        }

        const invalidBase = baseIngredients.some(ing =>
            !ing.productId || !ing.quantity || !ing.unit
        );

        if (invalidBase) {
            alert('Semua bahan utama harus lengkap (produk, quantity, dan unit)');
            return false;
        }

        if (!menuItemStatus.isComplete) {
            alert(`Menu belum lengkap: ${menuItemStatus.missingFields.join(', ')}`);
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Submit button clicked");

        if (!validateForm()) {
            return;
        }

        // Prepare the payload with proper structure
        const payload = {
            menuItemId: id,
            baseIngredients: baseIngredients
                .filter(item => item.productId && item.quantity && item.unit)
                .map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    productSku: item.productSku,
                    quantity: Number(item.quantity),
                    unit: item.unit
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

        console.log("Payload to be sent:", JSON.stringify(payload, null, 2));

        try {
            const response = await axios.post(`/api/product/recipes`, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log("Full response:", response);
            console.log("Response data:", response.data);

            if (response.data.success) {
                alert("Resep berhasil dibuat.");
                navigate("/admin/menu");
            } else {
                alert(`Gagal membuat resep: ${response.data.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error("Error details:", err);
            console.error("Error response:", err.response);
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
            <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
                <FaBell className="text-2xl text-gray-400" />
                <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
                    <FaUser />
                </Link>
            </div>

            {/* Breadcrumb */}
            <div className="px-3 py-2 flex justify-between items-center border-b bg-white">
                <div className="flex items-center space-x-2 text-gray-400">
                    <FaShoppingBag size={21} />
                    <Link to="/admin/menu">Produk</Link>
                    <FaChevronRight />
                    <p>{menuName}</p>
                    <FaChevronRight />
                    <span>Kelola Resep</span>
                </div>
                <div className="flex space-x-2">
                    <Link to="/admin/menu"
                        className="bg-white text-[#005429] px-4 py-2 rounded border border-[#005429] hover:text-white hover:bg-[#005429] text-[13px]"
                    >
                        Batal
                    </Link>
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
                        {/* Base Ingredients */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Bahan Menu</h2>
                            {baseIngredients.map((item, index) => (
                                <div key={index} className="grid grid-cols-5 gap-4 mb-2 items-center">
                                    <select
                                        value={item.productName}
                                        onChange={(e) => {
                                            const selectedProduct = productList.find(p => p.name === e.target.value);
                                            const updated = [...baseIngredients];
                                            updated[index] = {
                                                ...updated[index],
                                                productId: selectedProduct?._id || "",
                                                productName: selectedProduct?.name || "",
                                                productSku: selectedProduct?.sku || ""
                                            };
                                            setBaseIngredients(updated);
                                        }}
                                        className="border rounded p-2 text-sm"
                                        required
                                    >
                                        <option value="">Pilih Bahan Baku</option>
                                        {productList.map(product => (
                                            <option key={product._id} value={product.name}>
                                                {product.name} ({product.sku})
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        type="text"
                                        placeholder="SKU"
                                        value={item.productSku}
                                        onChange={(e) =>
                                            handleChange(setBaseIngredients, baseIngredients, index, "productSku", e.target.value)
                                        }
                                        className="border rounded p-2 text-sm"
                                        required
                                    />
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        value={item.quantity}
                                        onChange={(e) =>
                                            handleChange(setBaseIngredients, baseIngredients, index, "quantity", e.target.value)
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
                                            handleChange(setBaseIngredients, baseIngredients, index, "unit", e.target.value)
                                        }
                                        className="border rounded p-2 text-sm"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = baseIngredients.filter((_, i) => i !== index);
                                            setBaseIngredients(updated.length ? updated : [
                                                { productId: "", productName: "", productSku: "", quantity: "", unit: "" }
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
                                    setBaseIngredients([
                                        ...baseIngredients,
                                        { productId: "", productName: "", productSku: "", quantity: "", unit: "" }
                                    ])
                                }
                                className="text-blue-600 text-sm mt-2"
                            >
                                + Tambah Base Ingredient
                            </button>
                        </div>

                        {/* Toppings */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Bahan Topping</h2>
                            {console.log(toppingOptions)}
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
                                            <select
                                                value={ing.productName}
                                                onChange={(e) => {
                                                    const selectedProduct = productList.find(p => p.name === e.target.value);
                                                    const updated = [...toppingOptions];
                                                    updated[tIdx].ingredients[iIdx] = {
                                                        ...updated[tIdx].ingredients[iIdx],
                                                        productId: selectedProduct?._id || "",
                                                        productName: selectedProduct?.name || "",
                                                        productSku: selectedProduct?.sku || ""
                                                    };
                                                    setToppingOptions(updated);
                                                }}
                                                className="border rounded p-2 text-sm"
                                                required
                                            >
                                                <option value="">Pilih Bahan</option>
                                                {productList.map(product => (
                                                    <option key={product._id} value={product.name}>
                                                        {product.name} ({product.sku})
                                                    </option>
                                                ))}
                                            </select>

                                            <input
                                                type="text"
                                                placeholder="SKU"
                                                value={ing.productSku}
                                                onChange={(e) =>
                                                    handleNestedChange(setToppingOptions, toppingOptions, tIdx, iIdx, "productSku", e.target.value)
                                                }
                                                className="border rounded p-2 text-sm"
                                                required
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
                                                className="border rounded p-2 text-sm"
                                                required
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
                            <button
                                type="button"
                                onClick={() => {
                                    setToppingOptions([
                                        ...toppingOptions,
                                        {
                                            toppingName: "",
                                            ingredients: [{ productId: "", productName: "", productSku: "", quantity: "", unit: "" }]
                                        }
                                    ]);
                                }}
                                className="text-blue-600 text-sm mt-2"
                            >
                                + Tambah Topping
                            </button>
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
                                            className="border p-2 rounded text-sm"
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
                                            <select
                                                value={ing.productName}
                                                onChange={(e) => {
                                                    const selectedProduct = productList.find(p => p.name === e.target.value);
                                                    const updated = [...addonOptions];
                                                    updated[aIdx].ingredients[iIdx] = {
                                                        ...updated[aIdx].ingredients[iIdx],
                                                        productId: selectedProduct?._id || "",
                                                        productName: selectedProduct?.name || "",
                                                        productSku: selectedProduct?.sku || ""
                                                    };
                                                    setAddonOptions(updated);
                                                }}
                                                className="border rounded p-2 text-sm"
                                                required
                                            >
                                                <option value="">Pilih Bahan</option>
                                                {productList.map(product => (
                                                    <option key={product._id} value={product.name}>
                                                        {product.name} ({product.sku})
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="SKU"
                                                value={ing.productSku}
                                                onChange={(e) =>
                                                    handleNestedChange(setAddonOptions, addonOptions, aIdx, iIdx, "productSku", e.target.value)
                                                }
                                                className="border rounded p-2 text-sm"
                                                required
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
                                                className="border rounded p-2 text-sm"
                                                required
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
                            <button
                                type="button"
                                onClick={() => {
                                    setAddonOptions([
                                        ...addonOptions,
                                        {
                                            addonName: "",
                                            optionLabel: "",
                                            ingredients: [{ productId: "", productName: "", productSku: "", quantity: "", unit: "" }]
                                        }
                                    ]);
                                }}
                                className="text-blue-600 text-sm mt-2"
                            >
                                + Tambah Addon
                            </button>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                className="bg-[#005429] text-white px-6 py-2 rounded"
                            >
                                Simpan Semua
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