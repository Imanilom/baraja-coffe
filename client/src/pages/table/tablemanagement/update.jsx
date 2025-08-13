import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";
import { FaBoxes, FaChevronRight } from "react-icons/fa";

const UpdateArea = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        area_code: '',
        area_name: '',
        capacity: 1,
        description: '',
        rentfee: 0,
        roomSize: {
            width: { type: Number, required: true, min: 1 },
            height: { type: Number, required: true, min: 1 },
            unit: { type: String, enum: ['m', 'cm', 'px'], default: 'm' }
        },  
        is_active: true
    });

    useEffect(() => {
        const fetchAreaData = async () => {
            try {
                const response = await axios.get(`/api/areas/${id}`);
                const { area_code, area_name, capacity, description, rentfee, roomSize, is_active } = response.data.data;
                
                setForm({
                    area_code,
                    area_name,
                    capacity,
                    description,
                    rentfee,
                    roomSize: {
                        width: roomSize.width || 0,
                        height: roomSize.height || 0,
                        unit: roomSize.unit || 'm'
                    },
                    is_active
                });
            } catch (error) {
                console.error('Error fetching area:', error);
                navigate('/admin/table-management', { replace: true });
            } finally {
                setLoading(false);
            }
        };

        fetchAreaData();
    }, [id, navigate]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(`/api/areas/${id}`, {
                ...form,
                area_code: form.area_code.toUpperCase()
            });
            
            if (response.data.success) {
                navigate('/admin/table-management');
            }
        } catch (error) {
            console.error('Error updating area:', error);
            alert(error.response?.data?.message || 'Error updating area');
        }
    };

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
                        <span className="text-gray-400 inline-block">
                            Pengaturan Area
                        </span>
                        <FaChevronRight size={22} className="text-gray-400 inline-block" />
                        <span className="text-gray-400 inline-block">
                            Edit Area
                        </span>
                    </div>
                </div>
                
                {/* Area Information */}
                <div className="grid px-3 grid-cols-1 w-full md:w-1/2 gap-4">
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

export default UpdateArea;