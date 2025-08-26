import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaBoxes, FaChevronRight, FaBell, FaUser } from "react-icons/fa";

const CreateArea = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        area_code: '',
        area_name: '',
        capacity: 1,
        description: '',
        rentfee: 0,
        roomSize: {
            width: 1,
            height: 1,
            unit: 'm'
        },
        is_active: true
    });

    const [outletList, setOutletList] = useState([]);
    const [showInput, setShowInput] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedOutlet, setSelectedOutlet] = useState('');
    const dropdownRef = useRef();

    const fetchOutlets = async () => {
        try {
            const response = await axios.get('/api/outlet');
            setOutletList(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch outlets:', error);
        }
    };

    useEffect(() => {
        fetchOutlets();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: name === 'is_active' ? e.target.checked : value
        }));
    };

    const handleCapacityChange = (operation) => {
        setForm(prev => ({
            ...prev,
            capacity: operation === 'increase' 
                ? Math.min(99, prev.capacity + 1)
                : Math.max(1, prev.capacity - 1)
        }));
    };

    const handleUnitChange = (e) => {
        setForm(prev => ({
            ...prev,
            roomSize: {
                ...prev.roomSize,
                unit: e.target.value
            }
        }));
    };

    const handleRoomSizeChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            roomSize: {
                ...prev.roomSize,
                [name]: parseFloat(value) || 0
            }
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post('/api/areas', {
                ...form,
                area_code: form.area_code.toUpperCase()
            });
            
            if (response.data.success) {
                navigate('/admin/table-management');
            }
        } catch (error) {
            console.error('Error creating area:', error);
            alert(error.response?.data?.message || 'Error creating area');
        } finally {
            setLoading(false);
        }
    };

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
                        <span className="text-gray-400 inline-block">
                            Pengaturan Area
                        </span>
                        <FaChevronRight size={22} className="text-gray-400 inline-block" />
                        <span className="text-gray-400 inline-block">
                            Tambah Area
                        </span>
                    </div>
                </div>
                
                {/* Area Information */}
                <div className="grid px-3 grid-cols-1 w-full md:w-1/2 gap-4">
                    {/* Outlet Selection */}
                    <div className="flex items-center">
                        <label className="w-[140px] block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 text-[14px]">
                            Outlet
                        </label>
                        <div className="relative flex-1">
                            {!showInput ? (
                                <button
                                    type="button"
                                    className="w-full text-[13px] text-gray-500 border py-2 px-3 rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]"
                                    onClick={() => setShowInput(true)}
                                >
                                    {selectedOutlet || 'Pilih Outlet'}
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
                                                    setSelectedOutlet(outlet.name);
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

                    {/* Area Code */}
                    <div className="flex items-center">
                        <label className="w-[140px] block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 text-[14px]">
                            Kode Area
                        </label>
                        <input
                            type="text"
                            name="area_code"
                            value={form.area_code}
                            onChange={handleInputChange}
                            className="w-full text-[13px] border py-2 px-3 rounded text-left relative flex-1 uppercase"
                            required
                        />
                    </div>

                    {/* Area Name */}
                    <div className="flex items-center">
                        <label className="w-[140px] block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 text-[14px]">
                            Nama Area
                        </label>
                        <input
                            type="text"
                            name="area_name"
                            value={form.area_name}
                            onChange={handleInputChange}
                            className="w-full text-[13px] border py-2 px-3 rounded text-left relative flex-1"
                            required
                        />
                    </div>

                    {/* Capacity */}
                    <div className="flex items-center">
                        <label className="w-[140px] block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 text-[14px]">
                            Kapasitas
                        </label>
                        <div className="flex items-center space-x-2">
                            <button
                                type="button"
                                onClick={() => handleCapacityChange('decrease')}
                                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                name="capacity"
                                value={form.capacity}
                                onChange={handleInputChange}
                                min="1"
                                max="99"
                                className="w-16 text-center border border-gray-300 rounded py-1 px-2 focus:outline-none focus:ring-1 focus:ring-green-600"
                            />
                            <button
                                type="button"
                                onClick={() => handleCapacityChange('increase')}
                                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                            >
                                +
                            </button>
                            <span className="text-sm text-gray-600">orang</span>
                        </div>
                    </div>

                    {/* Rent Fee */}
                    <div className="flex items-center">
                        <label className="w-[140px] block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 text-[14px]">
                            Biaya Sewa
                        </label>
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2">Rp</span>
                            <input
                                type="number"
                                name="rentfee"
                                value={form.rentfee}
                                onChange={handleInputChange}
                                min="0"
                                className="w-full text-[13px] border py-2 px-3 rounded text-left pl-8"
                                required
                            />
                        </div>
                    </div>

                     {/* Room Size */}
                    <div className="flex items-center">
                        <label className="w-[140px] block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 text-[14px]">
                            Ukuran Ruangan
                        </label>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="number"
                                    name="width"
                                    value={form.roomSize.width}
                                    onChange={handleRoomSizeChange}
                                    min="0"
                                    step="0.1"
                                    className="w-20 text-[13px] border py-2 px-3 rounded text-left"
                                    placeholder="Lebar"
                                    required
                                />
                                <span className="text-sm">x</span>
                                <input
                                    type="number"
                                    name="height"
                                    value={form.roomSize.height}
                                    onChange={handleRoomSizeChange}
                                    min="0"
                                    step="0.1"
                                    className="w-20 text-[13px] border py-2 px-3 rounded text-left"
                                    placeholder="Panjang"
                                    required
                                />
                                <select
                                    value={form.roomSize.unit}
                                    onChange={handleUnitChange}
                                    className="text-[13px] border py-2 px-3 rounded"
                                >
                                    <option value="m">meter</option>
                                    <option value="cm">centimeter</option>
                                    <option value="ft">feet</option>
                                </select>
                            </div>
                            <p className="text-xs text-gray-500">
                                Ukuran ruangan diperlukan untuk penempatan meja
                            </p>
                        </div>
                    </div>


                    {/* Description */}
                    <div className="flex items-center">
                        <label className="w-[140px] block text-[#999999] text-[14px]">
                            Deskripsi
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleInputChange}
                            className="w-full text-[13px] border py-2 px-3 rounded text-left relative flex-1"
                            rows="3"
                        />
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                        <label className="w-[140px] block text-[#999999] text-[14px]">
                            Status
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={form.is_active}
                                onChange={handleInputChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005429]"></div>
                            <span className="ml-3 text-sm font-medium text-gray-900">
                                {form.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                        </label>
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
                            disabled={loading}
                            className="bg-[#005429] text-white text-sm px-3 py-1.5 rounded disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateArea;