import React, { useEffect, useState, useRef, useMemo } from "react";
import { FaBox, FaTag, FaBell, FaUser, FaShoppingBag, FaLayerGroup, FaSquare, FaInfo, FaPencilAlt, FaThLarge, FaDollarSign, FaTrash, FaChevronRight, FaInfoCircle } from 'react-icons/fa';
import axios from "axios";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

const ReceiptMenu = () => {
    const location = useLocation();
    const { id } = useParams(); // Get the menu item ID from the URL
    const navigate = useNavigate(); // Use the new hook
    const [menuItems, setMenuItems] = useState({
        name: "",
        price: "",
        description: "",
        category: [], // This should be an array
        imageURL: "",
        toppings: [],
        addons: [],
        rawMaterials: [],
        availableAt: "",
    });
    const [category, setCategory] = useState([]);
    const [status, setStatus] = useState([]);
    const [error, setError] = useState(null);
    const [productList, setProductList] = useState([]);


    const [outlets, setOutlets] = useState([]);

    const [loading, setLoading] = useState(true);
    const [menuName, setMenuName] = useState("");
    const [baseIngredients, setBaseIngredients] = useState([
        { productName: "", productSku: "", quantity: "", unit: "" }
    ]);
    const [toppingOptions, setToppingOptions] = useState([]);
    const [addonOptions, setAddonOptions] = useState([]);

    useEffect(() => {
        const fetchMenu = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/menu/menu-items/${id}`);
                const data = res.data.data;

                setMenuName(data.name || "");

                // Dummy base ingredients (isi manual)
                setBaseIngredients([
                    { productId: "", productName: "", productSku: "", quantity: "", unit: "" }
                ]);

                // Toppings dari backend
                const toppings = (data.toppings || []).map((t) => ({
                    toppingName: t.name,
                    ingredients: [{ productId: "", productName: "", productSku: "", quantity: "", unit: "" }]
                }));

                setToppingOptions(toppings);

                // Addons dari backend
                const addons = (data.addons || []).map((a) => ({
                    addonName: a.name,
                    optionLabel: a.options?.[0]?.label || "",
                    ingredients: [{ productId: "", productName: "", productSku: "", quantity: "", unit: "" }]
                }));
                setAddonOptions(addons);
            } catch (error) {
                console.error("Gagal mengambil data menu:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchMenu();
        }
    }, [id]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get("/api/marketlist/products");
                setProductList(res.data.data);
            } catch (error) {
                console.error("Gagal mengambil daftar bahan baku:", error);
            }
        };

        fetchProducts();
    }, []);



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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Optional: Filter hanya bahan yang valid (misalnya nama produk tidak kosong)
        const filteredBaseIngredients = baseIngredients.filter(
            (b) => b.productName && b.productSku
        );

        const filteredToppings = toppingOptions.map((t) => ({
            name: t.toppingName,
            ingredients: t.ingredients.filter(
                (i) => i.productName && i.productSku
            ),
        }));

        const filteredAddons = addonOptions.map((a) => ({
            name: a.addonName,
            optionLabel: a.optionLabel,
            ingredients: a.ingredients.filter(
                (i) => i.productName && i.productSku
            ),
        }));

        const payload = {
            menuItemId: id,
            baseIngredients: filteredBaseIngredients,
            toppings: filteredToppings,
            addons: filteredAddons,
        };

        console.log(payload);

        try {
            // Cek apakah resep sudah ada
            const checkRes = await axios.get(`/api/product/recipes/${id}`);

            const recipeId = checkRes?.data?._id;

            if (recipeId) {
                await axios.put(`/api/product/recipes/${recipeId}`, payload);
                alert("Resep berhasil diperbarui.");
            } else {
                await axios.post(`/api/product/recipes`, payload);
                alert("Resep berhasil dibuat.");
            }
        } catch (err) {
            if (err.response?.status === 404) {
                try {
                    await axios.post(`/api/product/recipes`, payload);
                    alert("Resep berhasil dibuat.");
                } catch (postErr) {
                    console.error("Gagal menyimpan resep:", postErr);
                    alert("Gagal membuat resep.");
                }
            } else {
                console.error("Gagal mengecek atau mengupdate resep:", err);
                alert("Terjadi kesalahan saat menyimpan.");
            }
        }
    };



    // Show loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
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
            </div>
        );
    }

    return (
        <div className="container">
            <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
                <FaBell className="text-2xl text-gray-400" />
                <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
                    <FaUser />
                </Link>
            </div>

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
                    <button
                        onClick={() => console.log('Simpan')}
                        className="bg-[#005429] text-white px-4 py-2 rounded border text-[13px]"
                    >
                        Simpan
                    </button>
                </div>
            </div>
            <div className="w-full pb-6 mb-[60px]">
                <div className="px-[15px] pb-[15px]">
                    <div className="my-[13px] p-[25px] shadow-lg">
                        <form onSubmit={handleSubmit} className="space-y-10 p-6 bg-gray-50 rounded">

                            {/* === BASE INGREDIENTS === */}
                            <div>
                                <h2 className="text-lg font-semibold mb-4">Bahan Menu</h2>
                                {baseIngredients.map((item, index) => (
                                    <div key={index} className="grid grid-cols-5 gap-4 mb-2 items-center">
                                        <select
                                            value={item.productName}
                                            onChange={(e) => {
                                                const selectedProduct = productList.find(p => p.name === e.target.value);
                                                const updated = [...baseIngredients];
                                                updated[index].productId = selectedProduct?._id || "";
                                                updated[index].productName = selectedProduct?.name || "";
                                                updated[index].productSku = selectedProduct?.sku || "";
                                                setBaseIngredients(updated);
                                            }}
                                            className="border rounded p-2 text-sm"
                                        >
                                            <option value="">Pilih Bahan Baku</option>
                                            {productList.map(product => (
                                                <option key={product.id} value={product.name}>
                                                    {product.name}
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
                                        />
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                handleChange(setBaseIngredients, baseIngredients, index, "quantity", e.target.value)
                                            }
                                            className="border rounded p-2 text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Satuan"
                                            value={item.unit}
                                            onChange={(e) =>
                                                handleChange(setBaseIngredients, baseIngredients, index, "unit", e.target.value)
                                            }
                                            className="border rounded p-2 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updated = baseIngredients.filter((_, i) => i !== index);
                                                setBaseIngredients(updated.length ? updated : [
                                                    { productName: "", productSku: "", quantity: "", unit: "" }
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
                                            { productName: "", productSku: "", quantity: "", unit: "" }
                                        ])
                                    }
                                    className="text-blue-600 text-sm mt-2"
                                >
                                    + Tambah Base Ingredient
                                </button>
                            </div>

                            {/* === TOPPING OPTIONS === */}
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
                                            />
                                        </div>

                                        {topping.ingredients.map((ing, iIdx) => (
                                            <div key={iIdx} className="grid grid-cols-5 gap-4 mb-2 items-center">
                                                <select
                                                    value={ing.productName}
                                                    onChange={(e) => {
                                                        const selectedProduct = productList.find(p => p.name === e.target.value);
                                                        const updated = [...toppingOptions];
                                                        updated[tIdx].ingredients[iIdx].productId = selectedProduct?._id || "";
                                                        updated[tIdx].ingredients[iIdx].productName = selectedProduct?.name || "";
                                                        updated[tIdx].ingredients[iIdx].productSku = selectedProduct?.sku || "";
                                                        setToppingOptions(updated);
                                                    }}
                                                    className="border rounded p-2 text-sm"
                                                >
                                                    <option value="">Pilih Bahan</option>
                                                    {productList.map(product => (
                                                        <option key={product.id} value={product.name}>
                                                            {product.name}
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
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Qty"
                                                    value={ing.quantity}
                                                    onChange={(e) =>
                                                        handleNestedChange(setToppingOptions, toppingOptions, tIdx, iIdx, "quantity", e.target.value)
                                                    }
                                                    className="border rounded p-2 text-sm"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Satuan"
                                                    value={ing.unit}
                                                    onChange={(e) =>
                                                        handleNestedChange(setToppingOptions, toppingOptions, tIdx, iIdx, "unit", e.target.value)
                                                    }
                                                    className="border rounded p-2 text-sm"
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
                                                updated[tIdx].ingredients.push({ productName: "", productSku: "", quantity: "", unit: "" });
                                                setToppingOptions(updated);
                                            }}
                                            className="text-blue-600 text-sm mt-2"
                                        >
                                            + Tambah Bahan
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* === ADDON OPTIONS === */}
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
                                            />
                                        </div>

                                        {addon.ingredients.map((ing, iIdx) => (
                                            <div key={iIdx} className="grid grid-cols-5 gap-4 mb-2 items-center">
                                                <select
                                                    value={ing.productName}
                                                    onChange={(e) => {
                                                        const selectedProduct = productList.find(p => p.name === e.target.value);
                                                        const updated = [...addonOptions];
                                                        updated[aIdx].ingredients[iIdx].productId = selectedProduct?._id || "";
                                                        updated[aIdx].ingredients[iIdx].productName = selectedProduct?.name || "";
                                                        updated[aIdx].ingredients[iIdx].productSku = selectedProduct?.sku || "";
                                                        setAddonOptions(updated);
                                                    }}
                                                    className="border rounded p-2 text-sm"
                                                >
                                                    <option value="">Pilih Bahan</option>
                                                    {productList.map(product => (
                                                        <option key={product.id} value={product.name}>
                                                            {product.name}
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
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Qty"
                                                    value={ing.quantity}
                                                    onChange={(e) =>
                                                        handleNestedChange(setAddonOptions, addonOptions, aIdx, iIdx, "quantity", e.target.value)
                                                    }
                                                    className="border rounded p-2 text-sm"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Satuan"
                                                    value={ing.unit}
                                                    onChange={(e) =>
                                                        handleNestedChange(setAddonOptions, addonOptions, aIdx, iIdx, "unit", e.target.value)
                                                    }
                                                    className="border rounded p-2 text-sm"
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
                                                updated[aIdx].ingredients.push({ productName: "", productSku: "", quantity: "", unit: "" });
                                                setAddonOptions(updated);
                                            }}
                                            className="text-blue-600 text-sm mt-2"
                                        >
                                            + Tambah Bahan
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* === SUBMIT BUTTON === */}
                            <div className="pt-6">
                                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">
                                    Simpan Semua
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]">
                </div>
            </div>
        </div>
    );
};

export default ReceiptMenu;  