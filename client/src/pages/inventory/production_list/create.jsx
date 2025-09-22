import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Select from "react-select";
import { FaChevronRight, FaShoppingBag, FaBell, FaUser, FaImage, FaCamera, FaInfoCircle, FaGift, FaPizzaSlice, FaChevronDown, FaBoxes, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Header from "../../admin/header";

const CreateProduction = () => {
    const navigate = useNavigate();
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
    const [supplier, setSupplier] = useState("");
    const [form, setForm] = useState({
        minimumrequest: "",
        limitperrequest: "",
        sku: "",
        name: "",
        category: "",
        unit: "",
        supplier: null, // untuk select supplier
        price: "",
    });

    const categoryOptions = [
        { value: "food", label: "Makanan" },
        { value: "beverages", label: "Minuman" },
        { value: "packaging", label: "Packaging" },
        { value: "instan", label: "Instan" },
        { value: "perlengkapan", label: "Perlengkapan" },
    ];

    const fetchMenu = async () => {
        try {
            const menuResponse = await axios.get('/api/marketlist/supplier');
            const menuData = menuResponse.data.data ? menuResponse.data.data : menuResponse.data;

            setSupplier(menuData.map((menu) => ({
                value: menu._id,
                label: menu.name,
            })));
        } catch (err) {
            console.error("Error fetching outlets:", err);
            setOutlets([]);
        }
    };

    const fetchSupplier = async () => {
        try {
            const supplierResponse = await axios.get('/api/marketlist/supplier');
            const supplierData = supplierResponse.data.data ? supplierResponse.data.data : supplierResponse.data;

            setSupplier(supplierData.map((sup) => ({
                value: sup._id,
                label: sup.name, // tampilkan nama supplier
            })));
        } catch (err) {
            console.error("Error fetching outlets:", err);
            setOutlets([]);
        }
    };

    useEffect(() => {
        fetchSupplier();
        fetchMenu();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSupplierChange = (selectedOption) => {
        setForm({ ...form, supplier: selectedOption });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            minimumrequest: Number(form.minimumrequest),
            limitperrequest: Number(form.limitperrequest),
            sku: form.sku,
            name: form.name,
            category: form.category,
            unit: form.unit,
            suppliers: [
                {
                    supplierId: form.supplier?.value, // hanya kirim ID
                    price: Number(form.price),
                },
            ],
        };

        try {
            const response = await axios.post("/api/marketlist/product", payload);
            console.log("Produk berhasil disimpan:", response.data);

            // Redirect kalau sukses
            navigate("/admin/inventory/production-list");
        } catch (error) {
            if (error.response) {
                // Server balas dengan status error
                console.error("Error dari server:", error.response.data);
                alert(`Gagal menyimpan: ${error.response.data.message || "Terjadi kesalahan"}`);
            } else if (error.request) {
                // Tidak ada respons dari server
                console.error("Tidak ada respons:", error.request);
                alert("Tidak dapat terhubung ke server");
            } else {
                // Error lain (misalnya kesalahan di kode)
                console.error("Error:", error.message);
                alert("Terjadi error: " + error.message);
            }
        }
    };


    return (
        <div className="">
            <Header />

            <div className="px-3 py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b bg-white space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2 text-sm">
                    <FaBoxes size={18} className="text-gray-500" />
                    <p className="text-gray-500">Inventori</p>
                    <FaChevronRight className="text-gray-500" />
                    <p className="text-gray-500">Produk</p>
                    <FaChevronRight className="text-gray-500" />
                    <p className="text-[#005429]">Tambah Produk</p>
                </div>
                <div className="flex w-full sm:w-auto">
                    <div
                        className="w-full sm:w-auto bg-white text-white px-4 py-2 rounded border border-white text-[13px] cursor-default"
                    >
                        Ekspor
                    </div>
                </div>
            </div>
            <div className="px-6 py-8 max-w-4xl mx-auto">
                <form
                    onSubmit={handleSubmit}
                    className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 space-y-6"
                >

                    {/* SKU + Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                SKU
                            </label>
                            <input
                                type="text"
                                name="sku"
                                value={form.sku}
                                onChange={handleChange}
                                placeholder="Masukkan SKU produk"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#005429] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Produk
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Masukkan nama produk"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#005429] focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Category + Unit */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kategori
                            </label>
                            <Select
                                name="category"
                                options={categoryOptions}
                                value={
                                    categoryOptions.find((opt) => opt.value === form.category) || null
                                }
                                onChange={(selectedOption) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        category: selectedOption?.value || "",
                                    }))
                                }
                                className="text-sm"
                                placeholder="Pilih kategori..."
                                styles={customSelectStyles}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Satuan
                            </label>
                            <input
                                type="text"
                                name="unit"
                                value={form.unit}
                                onChange={handleChange}
                                placeholder="Contoh: Pcs, Box, Kg"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#005429] focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Minimum + Limit */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Minimum Request
                            </label>
                            <input
                                type="number"
                                name="minimumrequest"
                                value={form.minimumrequest}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#005429] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Limit per Request
                            </label>
                            <input
                                type="number"
                                name="limitperrequest"
                                value={form.limitperrequest}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#005429] focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Supplier */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Supplier
                        </label>
                        <Select
                            options={supplier}
                            value={form.supplier}
                            onChange={handleSupplierChange}
                            placeholder="Pilih Supplier"
                            styles={customSelectStyles}
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Harga
                        </label>
                        <input
                            type="number"
                            name="price"
                            value={form.price}
                            onChange={handleChange}
                            placeholder="Masukkan harga produk"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#005429] focus:outline-none"
                        />
                    </div>

                    {/* Button */}
                    <div className="flex justify-end space-x-2">
                        <Link
                            to="/admin/inventory/production-list"
                            className="bg-white text-[#005429] border border-[#005429] px-6 py-2 rounded-md text-sm font-medium shadow-sm transition"
                        >
                            Kembali
                        </Link>
                        <button
                            type="submit"
                            className="bg-[#005429] text-white border border-[#005429] px-6 py-2 rounded-md text-sm font-medium shadow-sm transition"
                        >
                            Simpan Produk
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProduction;