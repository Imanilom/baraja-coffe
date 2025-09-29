import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaBoxes, FaChevronRight, FaBell, FaUser } from "react-icons/fa";
import Select from "react-select";

const CreateArea = () => {

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: '#d1d5db',
            minHeight: '34px',
            fontSize: '13px',
            color: '#6b7280',
            boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none',
            '&:hover': {
                borderColor: '#9ca3af',
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#6b7280',
        }),
        input: (provided) => ({
            ...provided,
            color: '#6b7280',
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9ca3af',
            fontSize: '13px',
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '13px',
            color: '#374151',
            backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white',
            cursor: 'pointer',
        }),
    };

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

    const options = [
        { value: "", label: "Semua Outlet" },
        ...outletList.map((o) => ({ value: o._id, label: o.name })),
    ];

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
                outlet_id: selectedOutlet,
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
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex justify-between items-center px-6 py-3 my-3">
                    <div className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                        <span>
                            Pengaturan Area
                        </span>
                        <FaChevronRight />
                        <span>
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
                            <Select
                                options={options}
                                value={
                                    selectedOutlet
                                        ? options.find((opt) => opt.value === selectedOutlet)
                                        : options[0]
                                }
                                onChange={(selected) => setSelectedOutlet(selected.value)}
                                placeholder="Pilih outlet..."
                                className="text-[13px]"
                                classNamePrefix="react-select"
                                styles={customStyles}
                                isSearchable
                            />
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