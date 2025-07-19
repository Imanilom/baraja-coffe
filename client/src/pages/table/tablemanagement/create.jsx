import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaChevronRight, FaShoppingBag, FaBell, FaUser, FaImage, FaCamera, FaInfoCircle, FaGift, FaPizzaSlice, FaChevronDown, FaBoxes, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CreateTable = () => {
    const navigate = useNavigate();
    const [value, setValue] = useState(0); // default value
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        status: '0',
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
            setProductList(response.data || []);
        } catch (error) {
            console.error('Gagal fetch produk:', error);
        }
    };

    useEffect(() => {
        fetchOutlets();
        fetchMenuItems();
    }, []);

    const handleDecrease = () => {
        setValue((prev) => Math.max(0, prev - 1));
    };

    const handleIncrease = () => {
        setValue((prev) => Math.min(99, prev + 1));
    };

    const handleChange = (e) => {
        let inputVal = e.target.value.replace(/\D/g, ""); // remove non-digits
        if (inputVal.length > 2) inputVal = inputVal.slice(0, 2); // max 2 digits
        setValue(inputVal === "" ? 0 : parseInt(inputVal));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm((prevData) => ({
            ...prevData,
            [name]: value,
        }));
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
                            Pengaturan Meja
                        </span>
                        <FaChevronRight size={22} className="text-gray-400 inline-block" />
                        <span
                            className="text-gray-400 inline-block"
                        >
                            Tambah Area
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

                    {/* === NAMA AREA === */}
                    <div className="flex items-center">
                        <h3 className="w-[140px] block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 mb-2.5 text-[14px]">Nama Area</h3>
                        <input
                            type="text"
                            name="name_area"
                            value={form.namearea}
                            onChange={handleFormChange}
                            className="w-full text-[13px] border py-2 px-3 rounded text-left relative flex-1"
                        />
                    </div>

                    <div className="flex items-center text-[#999999]">
                        <label className="w-[140px] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 text-[14px]">
                            Status Area
                        </label>
                        <div className="flex-1 space-x-4">
                            <label className="text-[14px]">
                                <input
                                    type="radio"
                                    name="status"
                                    value="1"
                                    checked={form.status === '1'}
                                    onChange={handleInputChange}
                                    className="form-radio"
                                /> Aktif
                            </label>
                            <label className="text-[14px]">
                                <input
                                    type="radio"
                                    name="status"
                                    value="0"
                                    checked={form.status === '0'}
                                    onChange={handleInputChange}
                                    className="form-radio"
                                /> Non Aktif
                            </label>
                        </div>
                    </div>
                </div>
                {/* === TABEL PRODUK === */}
                <div className="relative">
                    {/* Tombol */}
                    <div className="w-3/4 mb-[10px] flex gap-2 px-3 text-[14px] justify-end">
                        <button
                            type="button"
                            onClick={handleAddRow}
                            className="bg-[#005429] text-white rounded px-3 py-2"
                        >
                            + Tambah Meja
                        </button>
                    </div>
                    <div className="px-3 relative mb-10">
                        <table className="table-auto w-3/4 border-gray-300">
                            <thead className="border">
                                <tr className="">
                                    <th className="w-1/4 border text-[14px] text-[#999999] font-semibold text-left after:content-['*'] after:text-red-500 after:text-lg after:ml-1">Nama Meja</th>
                                    <th className="w-1/4 border text-[14px] text-[#999999] font-semibold text-left">Kapasitas</th>
                                    <th className="w-1/4 border text-[14px] text-[#999999] font-semibold">
                                        <div className=" flex justify-between items-center">
                                            <div className="">
                                                <p>Batas Waktu</p>
                                            </div>
                                            <div className="flex items-center">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" />
                                                    <div className="w-8 h-[17px] bg-gray-200 rounded-full peer-focus:ring-2 peer-focus:ring-blue-300 
        peer-checked:after:translate-x-4 rtl:peer-checked:after:-translate-x-4
        peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
        after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
        after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#005429]">
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </th>
                                    <th className="w-1/4 border text-[14px] text-[#999999] font-semibold">
                                        <div className="flex justify-between items-center">
                                            <div className="">
                                                <p>Waktu Pengingat</p>
                                            </div>
                                            <div className="flex items-center">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" />
                                                    <div className="w-8 h-[17px] bg-gray-200 rounded-full peer-focus:ring-2 peer-focus:ring-blue-300 
        peer-checked:after:translate-x-4 rtl:peer-checked:after:-translate-x-4
        peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
        after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
        after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#005429]">
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, index) => (
                                    <tr key={index}>
                                        <td className="border">
                                            <input
                                                type="text"
                                                value={row.namaProduk}
                                                onChange={(e) => handleRowChange(index, 'namaProduk', e.target.value)}
                                                className="w-full px-2 py-1 rounded-lg focus:outline-none focus:ring-0 focus:border-none"
                                            />
                                        </td>
                                        <td className="border">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={handleDecrease}
                                                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                                                >
                                                    -
                                                </button>

                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    value={value}
                                                    onChange={handleChange}
                                                    className="w-16 text-center border border-gray-300 rounded py-1 px-2 focus:outline-none focus:ring-1 focus:ring-green-600"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={handleIncrease}
                                                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                                                >
                                                    +
                                                </button>
                                                <span className="text-sm text-gray-600">orang</span>
                                            </div>
                                        </td>
                                        <td className="border">
                                            <input
                                                type="number"
                                                value={row.satuan}
                                                onChange={(e) => handleRowChange(index, 'satuan', e.target.value)}
                                                className="w-1/2 px-2 py-1 rounded-lg focus:outline-none focus:ring-0 focus:border-none"
                                            />
                                            <span className="text-sm text-gray-600">menit</span>
                                        </td>
                                        <td className="border flex items-center">
                                            <input
                                                type="number"
                                                value={row.waktu}
                                                onChange={(e) => handleRowChange(index, 'waktu', e.target.value)}
                                                className="w-1/2 px-2 py-1 rounded-lg focus:outline-none focus:ring-0 focus:border-none"
                                            />
                                            <span className="text-sm text-gray-600">menit</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRow(index)}
                                                className="w-full flex justify-center text-red-500 hover:underline"
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="fixed bottom-0 left-64 right-0 flex justify-end items-center border-t px-3 py-3 bg-white z-50">
                    <div className="flex space-x-2">
                        <Link
                            to="/admin/table-management"
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

export default CreateTable;