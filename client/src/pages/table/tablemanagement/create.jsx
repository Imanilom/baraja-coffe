import { useState, useEffect } from "react";
import axios from "axios";
import { FaTimes } from "react-icons/fa";
import Select from "react-select";
import { toast } from "react-toastify";

const CreateArea = ({ isOpen, onClose, onSuccess }) => {
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
    const [selectedOutlet, setSelectedOutlet] = useState('');

    const fetchOutlets = async () => {
        try {
            const response = await axios.get('/api/outlet');
            setOutletList(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch outlets:', error);
            toast.error('Gagal memuat daftar outlet');
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchOutlets();
        }
    }, [isOpen]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setForm({
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
            setSelectedOutlet('');
        }
    }, [isOpen]);

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
        { value: "", label: "Pilih Outlet" },
        ...outletList.map((o) => ({ value: o._id, label: o.name })),
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedOutlet) {
            toast.error("Harus memilih outlet");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('/api/areas', {
                ...form,
                outlet_id: selectedOutlet,
                area_code: form.area_code.toUpperCase()
            });

            if (response.data.success) {
                toast.success("Area berhasil dibuat");

                if (onSuccess) {
                    onSuccess(response.data);
                }

                setTimeout(() => {
                    onClose();
                }, 100);
            }
        } catch (error) {
            console.error('Error creating area:', error);
            const errorMessage = error.response?.data?.message || 'Gagal membuat area';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay Background */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Side Drawer - Slide from Right */}
            <div className={`fixed right-0 top-0 h-full w-full md:w-[550px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Modal Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b bg-white">
                    <h2 className="text-xl font-semibold text-green-900">
                        Tambah Area
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                        disabled={loading}
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {/* Outlet Selection */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Outlet <span className="text-red-500">*</span>
                        </label>
                        <Select
                            options={options}
                            value={options.find(opt => opt.value === selectedOutlet) || options[0]}
                            onChange={(selected) => setSelectedOutlet(selected.value)}
                            placeholder="Pilih outlet..."
                            className="text-[13px]"
                            classNamePrefix="react-select"
                            styles={customStyles}
                            isSearchable
                        />
                    </div>

                    {/* Area Code */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Kode Area <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="area_code"
                            value={form.area_code}
                            onChange={handleInputChange}
                            className="w-full text-[13px] border py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-green-600 uppercase"
                            placeholder="Masukkan kode area"
                            required
                        />
                    </div>

                    {/* Area Name */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Nama Area <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="area_name"
                            value={form.area_name}
                            onChange={handleInputChange}
                            className="w-full text-[13px] border py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                            placeholder="Masukkan nama area"
                            required
                        />
                    </div>

                    {/* Capacity */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Kapasitas <span className="text-red-500">*</span>
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
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Biaya Sewa <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                            <input
                                type="number"
                                name="rentfee"
                                value={form.rentfee}
                                onChange={handleInputChange}
                                min="0"
                                className="w-full text-[13px] border py-2 px-3 rounded pl-8 focus:outline-none focus:ring-2 focus:ring-green-600"
                                placeholder="0"
                                required
                            />
                        </div>
                    </div>

                    {/* Room Size */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Ukuran Ruangan <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="number"
                                    name="width"
                                    value={form.roomSize.width}
                                    onChange={handleRoomSizeChange}
                                    min="0"
                                    step="0.1"
                                    className="w-24 text-[13px] border py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
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
                                    className="w-24 text-[13px] border py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                                    placeholder="Panjang"
                                    required
                                />
                                <select
                                    value={form.roomSize.unit}
                                    onChange={handleUnitChange}
                                    className="text-[13px] border py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
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
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Deskripsi
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleInputChange}
                            className="w-full text-[13px] border py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                            rows="3"
                            placeholder="Masukkan deskripsi (opsional)"
                        />
                    </div>

                    {/* Status */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
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

                {/* Modal Footer - Fixed at Bottom */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition"
                        disabled={loading}
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default CreateArea;