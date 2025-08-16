import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Select from "react-select";
import { Link } from "react-router-dom";
import Datepicker from 'react-tailwindcss-datepicker';
import { FaChevronRight, FaShoppingBag, FaBell, FaUser, FaImage, FaCamera, FaInfoCircle, FaGift, FaPizzaSlice, FaChevronDown, FaBoxes, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CreateStock = () => {
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
            backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white',
            cursor: 'pointer',
        }),
    };
    const navigate = useNavigate();
    const [errorRows, setErrorRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        tanggal: dayjs().format("YYYY-MM-DD"), // default hari ini dalam format ISO
        catatan: '',
    });
    const [outletList, setOutletList] = useState([]);
    const [menu, setMenu] = useState([]);
    const [product, setProduct] = useState([]);
    const [showInput, setShowInput] = useState(false);
    const [search, setSearch] = useState('');
    const [tempSelectedOutlet, setTempSelectedOutlet] = useState('');
    const dropdownRef = useRef();

    // ✅ Fetch outlet dari API
    const fetchOutlets = async () => {
        // setLoading(true);
        try {
            const response = await axios.get('/api/outlet');
            // Pastikan response sesuai format
            setOutletList(response.data.data || []);
        } catch (error) {
            console.error('Gagal fetch outlet:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMenuItems = async () => {
        try {
            const response = await axios.get('/api/menu/menu-items');
            setMenu(response.data || []);
        } catch (error) {
            console.error('Gagal fetch Menu:', error);
        }
    };

    const fetchProduct = async () => {
        try {
            const response = await axios.get('/api/marketlist/products');
            setProduct(response.data.data ? response.data.data : response.data);
        } catch (error) {
            console.error('Gagal fetch Product:', error);
        }
    }

    useEffect(() => {
        fetchOutlets();
        fetchMenuItems();
        fetchProduct();
    }, []);

    const productOptions = product.map(p => ({
        value: p._id,
        label: p.name,
        _id: p._id,
        sku: p.sku,
        unit: p.unit
    }));

    const handleChange = (setter, data, index, field, value) => {
        const updated = [...data];
        updated[index][field] = value;
        setter(updated);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowInput(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOutlets = outletList.filter((outlet) =>
        outlet.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleFormChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const [rows, setRows] = useState([
        { productId: "", productName: "", productSku: "", quantity: "", unit: "" }
    ]);

    const handleAddRow = () => {
        setRows([...rows, { productId: "", productName: "", productSku: "", quantity: "", unit: "" }]);
    };

    const handleRemoveRow = (index) => {
        setRows(rows.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const invalidIndexes = [];

        const payload = rows.map((row, index) => {
            const hasValidProduct = !!row.productName;
            const hasValidQuantity = parseFloat(row.quantity) > 0;

            if (!hasValidProduct || !hasValidQuantity) {
                invalidIndexes.push(index);
                return null;
            }

            return {
                productId: row.productName, // nilai ini adalah ID produk dari select
                movements: [
                    {
                        quantity: parseFloat(row.quantity),
                        type: "in",
                        notes: form.catatan || "",
                        date: form.tanggal,          // tambah ini
                    }
                ]
            };
        }).filter(item => item !== null);

        setErrorRows(invalidIndexes);

        if (payload.length === 0) {
            alert("Tidak ada data produk yang valid untuk dikirim.");
            return;
        }

        try {
            const res = await axios.post('/api/product/stock/movement', payload);
            console.log(res.data);
            alert("Stok berhasil disimpan.");
            navigate('/admin/inventory/in');
        } catch (error) {
            console.error("❌ Gagal simpan data stok:", error.response?.data || error);
            alert("Gagal menyimpan stok. Silakan coba lagi.");
        }
    };



    const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);

    // Show loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

    return (
        <div className="">
            {/* Header */}
            <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
                <FaBell size={23} className="text-gray-400" />
                <span className="text-[14px]">Hi Baraja</span>
                <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
                    <FaUser size={30} />
                </Link>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="px-3 py-3 flex justify-between items-center border-b">
                    <div className="flex items-center space-x-2">
                        <FaBoxes size={22} className="text-gray-400 inline-block" />
                        <span
                            className="text-gray-400 inline-block"
                        >
                            Inventori
                        </span>
                        <FaChevronRight size={22} className="text-gray-400 inline-block" />
                        <span
                            className="text-gray-400 inline-block"
                        >
                            Stok Masuk
                        </span>
                        <FaChevronRight size={22} className="text-gray-400 inline-block" />
                        <span
                            className="text-gray-400 inline-block"
                        >
                            Tambah Stok Masuk
                        </span>
                    </div>
                </div>
                {/* === FORM INPUT ATAS === */}
                <div className="grid px-3 grid-cols-1 w-full md:w-1/2 gap-4">
                    {/* === OUTLET CUSTOM === */}
                    {/* <div className="flex items-center">
                        <h3 className="w-[140px] block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 text-[14px]">
                            Outlet
                        </h3>
                        <div className="relative flex-1">
                            {!showInput ? (
                                <button
                                    type="button"
                                    className="w-full text-[13px] text-gray-500 border py-2 px-3 rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]"
                                    onClick={() => setShowInput(true)}
                                >
                                    {tempSelectedOutlet || 'Pilih Outlet'}
                                </button>
                            ) : (
                                <input
                                    type="text"
                                    className="w-full text-[13px] border py-2 px-3 rounded text-left"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                    placeholder="Cari outlet..."
                                />
                            )}
                            {showInput && (
                                <ul
                                    className="absolute z-10 bg-white border mt-1 w-full rounded shadow-md max-h-48 overflow-auto"
                                    ref={dropdownRef}
                                >
                                    {filteredOutlets.length > 0 ? (
                                        filteredOutlets.map((outlet, idx) => (
                                            <li
                                                key={idx}
                                                onClick={() => {
                                                    setTempSelectedOutlet(outlet.name);
                                                    setShowInput(false);
                                                    setSearch('');
                                                }}
                                                className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                                            >
                                                {outlet.name}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-2 text-gray-500">Tidak ditemukan</li>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div> */}

                    {/* === TANGGAL === */}
                    <div className="flex items-start gap-4">
                        <label className="w-[140px] text-sm text-[#666] mt-2 after:content-['*'] after:text-red-500 after:ml-1">
                            Tanggal
                        </label>
                        <div className="flex-1">
                            <Datepicker
                                useRange={false}
                                asSingle={true}
                                value={{
                                    startDate: form.tanggal,
                                    endDate: form.tanggal
                                }}
                                displayFormat={"DD-MM-YYYY"}
                                onChange={(value) => {
                                    const selectedDate = value?.startDate || "";
                                    setForm((prev) => ({
                                        ...prev,
                                        tanggal: selectedDate
                                    }));
                                }}
                                inputClassName="w-full text-sm border py-2 px-3 rounded"
                            />
                        </div>
                    </div>

                    {/* === CATATAN === */}
                    <div className="flex items-start gap-4">
                        <label className="w-[140px] text-sm text-[#666] mt-2">
                            Catatan
                        </label>
                        <textarea
                            name="catatan"
                            value={form.catatan}
                            onChange={handleFormChange}
                            className="flex-1 text-sm border py-2 px-3 rounded"
                            rows="2"
                        />
                    </div>
                </div>

                {/* === TABEL PRODUK === */}
                <div className="relative">
                    <div className="px-3 relative mb-10">
                        <table className="table-auto w-full border-gray-300" cellPadding={10}>
                            <thead className="border-b">
                                <tr className="">
                                    <th className="pb-3 text-[14px] text-[#999999] font-semibold w-3/12 text-left after:content-['*'] after:text-red-500 after:text-lg after:ml-1">Nama Produk</th>
                                    <th className="pb-3 text-[14px] text-[#999999] font-semibold w-2/12 text-left">SKU</th>
                                    <th className="pb-3 text-[14px] text-[#999999] font-semibold text-right w-2/12 after:content-['*'] after:text-red-500 after:text-lg after:ml-1">Jumlah</th>
                                    <th className="pb-3 text-[14px] text-[#999999] font-semibold w-1/12 text-left">Satuan</th>
                                    <th className="pb-3 text-[14px] text-[#999999] font-semibold w-1/12">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, index) => (
                                    <tr key={index}>
                                        <td className="pt-3">
                                            <Select
                                                options={productOptions}
                                                value={productOptions.find(opt => opt.value === row.namaProduk)}
                                                onChange={(selected) => {
                                                    const updated = [...rows];
                                                    updated[index] = {
                                                        ...updated[index],
                                                        productId: selected?._id || "",
                                                        productName: selected?.value || "",
                                                        productSku: selected?.sku || "",
                                                        unit: selected?.unit || "",
                                                    };
                                                    setRows(updated);
                                                }}
                                                className="w-full"
                                                classNamePrefix="select"
                                                placeholder="Pilih Produk"
                                                styles={customSelectStyles}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                placeholder="SKU"
                                                value={row.productSku}
                                                onChange={(e) =>
                                                    handleChange(setRows, rows, index, "productSku", e.target.value)
                                                }
                                                className="border rounded p-2 text-sm w-full"
                                                required
                                            /></td>
                                        <td>
                                            <input
                                                type="number"
                                                placeholder="Qty"
                                                value={row.quantity}
                                                onChange={(e) =>
                                                    handleChange(setRows, rows, index, "quantity", e.target.value)
                                                }
                                                className="border rounded p-2 text-sm w-full"
                                                min="0"
                                                step="0.01"
                                                required
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                placeholder="Satuan"
                                                value={row.unit}
                                                onChange={(e) =>
                                                    handleChange(setRows, rows, index, "unit", e.target.value)
                                                }
                                                className="border rounded p-2 text-sm lowercase"
                                                required
                                            />
                                        </td>
                                        <td className="text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRow(index)}
                                                className="text-red-500 hover:underline"
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                            </tbody>
                        </table>

                        {/* Tombol */}
                        <div className="flex gap-2 px-3 mb-[150px] text-[14px]">
                            <button
                                type="button"
                                onClick={handleAddRow}
                                className="text-[#005249]"
                            >
                                + Tambah Produk
                            </button>
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-0 left-64 right-0 flex justify-between items-center border-t px-3 py-3 bg-white z-50">
                    {/* <div className="">
                        <h3 className="block text-[#999999] text-[14px]">Kolom bertanda <b className="text-red-600">*</b> wajib diisi</h3>
                        <span className="text-[18px] text-[#999999]">
                            Grand Total: Rp {grandTotal.toLocaleString('id-ID')}
                        </span>
                    </div> */}
                    <div className="flex space-x-2">
                        <Link
                            to="/admin/inventory/in"
                            className="border border-[#005429] text-[#005429] hover:bg-[#005429] hover:text-white text-sm px-3 py-1.5 rounded cursor-pointer"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            className="bg-[#005429] text-white text-sm px-3 py-1.5 rounded"
                        >
                            Simpan
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateStock;