import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaChevronRight, FaShoppingBag, FaBell, FaUser, FaImage, FaCamera, FaInfoCircle, FaGift, FaPizzaSlice, FaChevronDown, FaBoxes, FaTrash, FaReceipt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CreateShoppingList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        supplier: '',
        tanggal: '',
        catatan: '',
    });

    const [supplierList, setSupplierList] = useState([]);
    const [showInput, setShowInput] = useState(false);
    const [search, setSearch] = useState('');
    const [tempSelectedSupplier, setTempSelectedSupplier] = useState('');
    const dropdownRef = useRef();

    // ✅ Fetch supplier dari API
    const fetchSupplier = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/marketlist/supplier');
            // Pastikan response sesuai format
            setSupplierList(response.data.data || []);
        } catch (error) {
            console.error('Gagal fetch supplier:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSupplier();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowInput(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredSupplier = supplierList.filter((supplier) =>
        supplier.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleFormChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const [rows, setRows] = useState([
        { namaProduk: '', jumlah: '', satuan: '', hargaBeli: '', total: 0 },
    ]);

    const handleRowChange = (index, field, value) => {
        const updatedRows = [...rows];
        updatedRows[index][field] = value;
        const jumlah = parseFloat(updatedRows[index].jumlah) || 0;
        const harga = parseFloat(updatedRows[index].hargaBeli) || 0;
        updatedRows[index].total = jumlah * harga;
        setRows(updatedRows);
    };

    const handleAddRow = () => {
        setRows([...rows, { namaProduk: '', jumlah: '', satuan: '', hargaBeli: '', total: 0 }]);
    };

    const handleRemoveRow = (index) => {
        setRows(rows.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            supplier: tempSelectedSupplier,
            detailProduk: rows,
        };
        console.log('Data terkirim:', payload);
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
            <form onSubmit={handleSubmit} className="space-y-6 mb-[60px]">
                <div className="px-3 py-3 flex justify-between items-center border-b">
                    <div className="flex items-center space-x-2">
                        <FaReceipt size={22} className="text-gray-400 inline-block" />
                        <span
                            className="text-gray-400 inline-block"
                        >
                            Pembelian
                        </span>
                        <FaChevronRight size={22} className="text-gray-400 inline-block" />
                        <span
                            className="text-gray-400 inline-block"
                        >
                            Daftar Belanja
                        </span>
                        <FaChevronRight size={22} className="text-gray-400 inline-block" />
                        <span
                            className="text-gray-400 inline-block"
                        >
                            Kelola Daftar Belanja
                        </span>
                    </div>
                </div>

                {/* === TABEL PRODUK === */}
                <div className="relative">
                    <div className="px-3 relative mb-10">
                        <table className="table-auto w-full border-gray-300" cellPadding={10}>
                            <thead className="border-b">
                                <tr className="">
                                    <th className="pb-3 text-[14px] text-[#999999] font-semibold text-left w-3/12 uppercase">Nama Produk</th>
                                    <th className="pb-3 text-[14px] text-[#999999] font-semibold text-left w-2/12 uppercase">Brand</th>
                                    <th className="pb-3 text-[14px] text-[#999999] font-semibold text-left w-3/12 uppercase">Supplier</th>
                                    <th className="pb-3 text-[14px] text-[#999999] font-semibold text-right w-1/12 uppercase">Jumlah</th>
                                    <th className="pb-3 text-[14px] text-[#999999] font-semibold text-left w-1/12 uppercase">Satuan</th>
                                    <th className="pb-3 text-[14px] text-[#999999] font-semibold text-right w-2/12 uppercase">Harga Satuan</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, index) => (
                                    <tr key={index}>
                                        <td className="pt-3">
                                            <input
                                                type="text"
                                                value={row.namaProduk}
                                                onChange={(e) => handleRowChange(index, 'namaProduk', e.target.value)}
                                                className="w-full border px-2 py-1 rounded-lg"
                                            />
                                        </td>
                                        <td className="pt-3">
                                            <input
                                                type="text"
                                                value={row.brand}
                                                onChange={(e) => handleRowChange(index, 'brand', e.target.value)}
                                                className="w-full border px-2 py-1 rounded-lg"
                                            />
                                        </td>
                                        <td className="pt-3">
                                            <input
                                                type="text"
                                                value={row.supplier}
                                                onChange={(e) => handleRowChange(index, 'supplier', e.target.value)}
                                                className="w-full border px-2 py-1 rounded-lg"
                                            />
                                        </td>
                                        <td className="pt-3">
                                            <input
                                                type="number"
                                                value={row.jumlah}
                                                onChange={(e) => handleRowChange(index, 'jumlah', e.target.value)}
                                                className="w-full border px-2 py-1 rounded-lg text-right"
                                            />
                                        </td>
                                        <td className=" text-right">
                                            <input
                                                type="text"
                                                value={row.satuan}
                                                onChange={(e) => handleRowChange(index, 'satuan', e.target.value)}
                                                className="w-full border px-2 py-1 rounded-lg"
                                            />
                                        </td>
                                        <td className=" text-center">
                                            <input
                                                type="number"
                                                value={row.hargaSatuan}
                                                onChange={(e) => handleRowChange(index, 'hargaSatuan', e.target.value)}
                                                className="w-full border px-2 py-1 rounded-lg text-right"
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


                <div className="fixed bottom-0 left-64 right-0 flex justify-between border-t px-3 z-50 bg-white">
                    <div className="flex text-[#999999] text-[14px] items-center">
                        <div className="border-r py-4 pr-4">
                            <h3>0 Produk</h3>
                        </div>
                        <h3 className="pl-4">Kolom bertanda <b className="text-red-600">*</b> wajib diisi</h3>
                    </div>
                    <div className="flex space-x-2 text-[#999999] text-[14px]">
                        <div className="flex items-center">
                            <button
                                type="submit"
                                className="border border-[#005429] text-[#005429] hover:bg-[#005429] hover:text-white text-sm px-3 py-1.5 rounded"
                            >
                                Tambah Produk
                            </button>
                        </div>
                        <div className="border-r">
                        </div>
                        <div className="flex items-center space-x-2">
                            <Link
                                to="/admin/purchase/shopping-list"
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
                </div>
            </form>
        </div>
    );
};

export default CreateShoppingList;