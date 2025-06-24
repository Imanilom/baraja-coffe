import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaChevronRight, FaShoppingBag, FaBell, FaUser, FaImage, FaCamera, FaInfoCircle, FaGift, FaPizzaSlice, FaChevronDown, FaBoxes, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CreateStock = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        outlet: '',
        tanggal: '',
        catatan: '',
    });

    const [outletList, setOutletList] = useState([]);
    const [productList, setProductList] = useState([]);
    const [showInput, setShowInput] = useState(false);
    const [search, setSearch] = useState('');
    const [tempSelectedOutlet, setTempSelectedOutlet] = useState('');
    const dropdownRef = useRef();

    // ✅ Fetch outlet dari API
    const fetchOutlets = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/outlet');
            // Pastikan response sesuai format
            setOutletList(response.data || []);
        } catch (error) {
            console.error('Gagal fetch outlet:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMenuItems = async () => {
        try {
            const response = await axios.get('/api/menu/menu-items');
            setProductList(response.data || []);
        } catch (error) {
            console.error('Gagal fetch produk:', error);
        }
    };

    useEffect(() => {
        fetchOutlets();
        fetchMenuItems();
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

    const filteredOutlets = outletList.filter((outlet) =>
        outlet.name.toLowerCase().includes(search.toLowerCase())
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
            outlet: tempSelectedOutlet,
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
                    <div className="flex items-center">
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
                    </div>

                    {/* === TANGGAL === */}
                    <div className="flex items-center">
                        <h3 className="w-[140px] block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 mb-2.5 text-[14px]">Tanggal</h3>
                        <input
                            type="date"
                            name="tanggal"
                            value={form.tanggal}
                            onChange={handleFormChange}
                            className="w-full text-[13px] border py-2 px-3 rounded text-left relative flex-1"
                        />
                    </div>

                    {/* === CATATAN === */}
                    <div className="flex items-center">
                        <h3 className="w-[140px] block text-[#999999] text-[14px] mb-2.5">Catatan</h3>
                        <textarea
                            name="catatan"
                            value={form.catatan}
                            onChange={handleFormChange}
                            className="w-full text-[13px] border py-2 px-3 rounded text-left relative flex-1"
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
                                    <th className="pb-3 text-[14px] text-[#999999] font-semibold text-right w-2/12 after:content-['*'] after:text-red-500 after:text-lg after:ml-1">Jumlah</th>
                                    <th className="pb-3 text-[14px] text-[#999999] font-semibold w-1/12 text-left">Satuan</th>
                                    <th className="pb-3 text-[14px] text-[#999999] font-semibold w-2/12 text-right">Harga Beli / Unit</th>
                                    <th className="pb-3 text-[14px] text-[#999999] font-semibold w-3/12 text-right">Total Harga Beli</th>
                                    <th className="pb-3 text-[14px] text-[#999999] font-semibold w-1/12">Aksi</th>
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
                                                type="number"
                                                value={row.jumlah}
                                                onChange={(e) => handleRowChange(index, 'jumlah', e.target.value)}
                                                className="w-full border px-2 py-1 rounded-lg text-right"
                                            />
                                        </td>
                                        <td className="pt-3">
                                            <input
                                                type="text"
                                                value={row.satuan}
                                                onChange={(e) => handleRowChange(index, 'satuan', e.target.value)}
                                                className="w-full border px-2 py-1 rounded-lg"
                                            />
                                        </td>
                                        <td className="pt-3">
                                            <input
                                                type="number"
                                                value={row.hargaBeli}
                                                onChange={(e) => handleRowChange(index, 'hargaBeli', e.target.value)}
                                                className="w-full border px-2 py-1 rounded-lg text-right"
                                            />
                                        </td>
                                        <td className=" text-right">
                                            Rp {row.total.toLocaleString('id-ID')}
                                        </td>
                                        <td className=" text-center">
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
                    <div className="">
                        <h3 className="block text-[#999999] text-[14px]">Kolom bertanda <b className="text-red-600">*</b> wajib diisi</h3>
                        <span className="text-[18px] text-[#999999]">
                            Grand Total: Rp {grandTotal.toLocaleString('id-ID')}
                        </span>
                    </div>
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