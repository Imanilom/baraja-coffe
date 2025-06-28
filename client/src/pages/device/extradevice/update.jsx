import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaChevronRight, FaShoppingBag, FaBell, FaUser, FaImage, FaCamera, FaInfoCircle, FaGift, FaPizzaSlice, FaChevronDown, FaBoxes, FaTrash, FaReceipt, FaTabletAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const UpdateExtraDevice = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        supplier: '',
        tanggal: '',
        catatan: '',
    });

    const [supplierList, setSupplierList] = useState([]);
    const [outlet, setOutlet] = useState([]);
    const [showInput, setShowInput] = useState(false);
    const [showInputOutlet, setShowInputOutlet] = useState(false);
    const [search, setSearch] = useState('');
    const [searchOutlet, setSearchOutlet] = useState('');
    const [tempSelectedSupplier, setTempSelectedSupplier] = useState('');
    const [tempSelectedOutlet, setTempSelectedOutlet] = useState('');
    const dropdownRef = useRef();

    // ✅ Fetch supplier dari API
    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/marketlist/supplier');
            // Pastikan response sesuai format
            setSupplierList(response.data.data || []);

            const responseOutlet = await axios.get('/api/outlet');
            setOutlet(responseOutlet.data || []);
        } catch (error) {
            console.error('Gagal fetch supplier:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowInput(false);
                setShowInputOutlet(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredSupplier = supplierList.filter((supplier) =>
        supplier.name.toLowerCase().includes(search.toLowerCase())
    );

    const filteredOutlet = outlet.filter((outlet) =>
        outlet.name.toLowerCase().includes(searchOutlet.toLowerCase())
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
            <form onSubmit={handleSubmit} className="space-y-6 mb-[60px]">
                <div className="px-3 py-3 flex justify-between items-center border-b">
                    <div className="flex items-center space-x-2">
                        <FaTabletAlt size={22} className="text-gray-400 inline-block" />
                        <span
                            className="text-gray-400 inline-block"
                        >
                            Perangkat
                        </span>
                        <FaChevronRight size={22} className="text-gray-400 inline-block" />
                        <span
                            className="text-gray-400 inline-block"
                        >
                            Ubah Perangkat
                        </span>
                    </div>
                </div>
                {/* === FORM INPUT ATAS === */}
                <div className="grid px-3 grid-cols-1 w-full md:w-1/2 gap-4">

                    {/* === Device === */}
                    <div className="flex items-center">
                        <h3 className="w-[140px] block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 text-[14px]">
                            Nama Perangkat
                        </h3>
                        <div className="relative flex-1">
                            <input
                                type="text"
                                name="device"
                                value={form.device}
                                onChange={handleFormChange}
                                className="w-full text-[13px] border py-2 px-3 rounded text-left"
                            />
                        </div>
                    </div>


                    <div className="flex">
                        <div className="w-full flex justify-between text-[14px] text-[#999999]">
                            <h3>Dapat digunakan di seluruh outlet</h3>
                            <div className="flex space-x-2">
                                <h3>Tidak</h3>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-4 peer-focus:ring-blue-300 
                    peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                    peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 
                    after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
                    after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005429]"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* === OUTLET CUSTOM === */}
                    <div className="flex items-center">
                        <h3 className="w-[140px] block text-[#999999]">
                            Outlet
                        </h3>
                        <div className="relative flex-1">
                            {!showInputOutlet ? (
                                <button
                                    type="button"
                                    className="w-full text-[13px] text-gray-500 border py-2 px-3 rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]"
                                    onClick={() => setShowInputOutlet(true)}
                                >
                                    {tempSelectedOutlet || 'Pilih Outlet'}
                                </button>
                            ) : (
                                <input
                                    type="text"
                                    className="w-full text-[13px] border py-2 px-3 rounded text-left relative flex-1"
                                    value={searchOutlet}
                                    onChange={(e) => setSearchOutlet(e.target.value)}
                                    autoFocus
                                    placeholder="Cari Outlet..."
                                />
                            )}
                            {showInputOutlet && (
                                <ul
                                    className="absolute z-10 bg-white border mt-1 w-full rounded shadow-md max-h-48 overflow-auto"
                                    ref={dropdownRef}
                                >
                                    {filteredOutlet.length > 0 ? (
                                        filteredOutlet.map((outlet, idx) => (
                                            <li
                                                key={idx}
                                                onClick={() => {
                                                    setTempSelectedOutlet(outlet.name);
                                                    setShowInputOutlet(false);
                                                    setSearchOutlet('');
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
                </div>


                <div className="fixed bottom-0 left-64 right-0 flex justify-between border-t px-3 py-4 z-50 bg-white">
                    <div className="flex items-center">
                        <h3 className="block text-[#999999] text-[14px]">Kolom bertanda <b className="text-red-600">*</b> wajib diisi</h3>
                    </div>
                    <div className="flex space-x-2 py-2">
                        <Link
                            to="/admin/billing/device"
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

export default UpdateExtraDevice;