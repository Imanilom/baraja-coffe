import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import { FaChevronRight, FaBoxes } from "react-icons/fa";
import Header from "../../admin/header";

const UpdateProduction = () => {
    const { id } = useParams(); // ambil id dari url
    const navigate = useNavigate();

    const [supplier, setSupplier] = useState([]);
    const [form, setForm] = useState({
        minimumrequest: "",
        limitperrequest: "",
        sku: "",
        name: "",
        category: "",
        unit: "",
        supplier: null,
        price: "",
    });

    const categoryOptions = [
        { value: "food", label: "Makanan" },
        { value: "beverages", label: "Minuman" },
        { value: "packaging", label: "Packaging" },
        { value: "instan", label: "Instan" },
        { value: "perlengkapan", label: "Perlengkapan" },
    ];

    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: '#d1d5db',
            minHeight: '34px',
            fontSize: '13px',
            color: '#6b7280',
            boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none',
            '&:hover': { borderColor: '#9ca3af' },
        }),
        singleValue: (provided) => ({ ...provided, color: '#6b7280' }),
        input: (provided) => ({ ...provided, color: '#6b7280' }),
        placeholder: (provided) => ({ ...provided, color: '#9ca3af', fontSize: '13px' }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '13px',
            color: '#374151',
            backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white',
            cursor: 'pointer',
        }),
    };

    // Fetch supplier list
    const fetchSupplier = async () => {
        try {
            const supplierResponse = await axios.get('/api/marketlist/supplier');
            const supplierData = supplierResponse.data.data || supplierResponse.data;
            setSupplier(supplierData.map((sup) => ({
                value: sup._id,
                label: sup.name,
            })));
        } catch (err) {
            console.error("Error fetching suppliers:", err);
            setSupplier([]);
        }
    };

    // Fetch product by id untuk prefill
    const fetchProduct = async () => {
        try {
            const res = await axios.get(`/api/marketlist/product/${id}`);
            const product = res.data.data || res.data;

            setForm({
                minimumrequest: product.minimumrequest || "",
                limitperrequest: product.limitperrequest || "",
                sku: product.sku || "",
                name: product.name || "",
                category: product.category || "",
                unit: product.unit || "",
                supplier: product.suppliers?.[0]
                    ? { value: product.suppliers[0].supplierId, label: product.suppliers[0].supplierName }
                    : null,
                price: product.suppliers?.[0]?.price || "",
            });
        } catch (err) {
            console.error("Error fetching product:", err);
            alert("Gagal mengambil data produk");
        }
    };

    useEffect(() => {
        fetchSupplier();
        fetchProduct();
    }, [id]);

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
                    supplierId: form.supplier?.value,
                    price: Number(form.price),
                },
            ],
        };

        try {
            await axios.patch(`/api/marketlist/product/${id}`, payload);
            navigate("/admin/inventory/production-list", { state: { success: "Data berhasil diupdate" } });
        } catch (error) {
            if (error.response) {
                console.error("Error dari server:", error.response.data);
                alert(`Gagal update: ${error.response.data.message || "Terjadi kesalahan"}`);
            } else if (error.request) {
                console.error("Tidak ada respons:", error.request);
                alert("Tidak dapat terhubung ke server");
            } else {
                console.error("Error:", error.message);
                alert("Terjadi error: " + error.message);
            }
        }
    };


    return (
        <div>
            <Header />

            <div className="px-3 py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b bg-white space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2 text-sm">
                    <FaBoxes size={18} className="text-gray-500" />
                    <p className="text-gray-500">Inventori</p>
                    <FaChevronRight className="text-gray-500" />
                    <p className="text-gray-500">Produk</p>
                    <FaChevronRight className="text-gray-500" />
                    <p className="text-[#005429]">Update Produk</p>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                            <Select
                                name="category"
                                options={categoryOptions}
                                value={categoryOptions.find((opt) => opt.value === form.category) || null}
                                onChange={(selectedOption) =>
                                    setForm((prev) => ({ ...prev, category: selectedOption?.value || "" }))
                                }
                                className="text-sm"
                                placeholder="Pilih kategori..."
                                styles={customSelectStyles}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Request</label>
                            <input
                                type="number"
                                name="minimumrequest"
                                value={form.minimumrequest}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#005429] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Limit per Request</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Harga</label>
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
                            Update Produk
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateProduction;
