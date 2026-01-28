import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Monitor, MapPin, Tablet, Smartphone, ShoppingBag, Coffee, Utensils, Loader2 } from 'lucide-react';
import axios from 'axios';
import Select from "react-select";

export default function DeviceCreateForm() {
    const customSelectStyles = {
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

    const [formData, setFormData] = useState({
        deviceId: '',
        outlet: '',
        deviceName: '',
        deviceType: 'tablet',
        // parentDevice: '',
        location: '',
        assignedAreas: [],
        assignedTables: [],
        orderTypes: ['both'],
        notes: ''
    });

    const [tempSelectedOutlet, setTempSelectedOutlet] = useState("");
    const [areas, setAreas] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [devices, setDevices] = useState([]);
    const [loadingAreas, setLoadingAreas] = useState(false);
    const [loadingDevices, setLoadingDevices] = useState(false);
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);

    const deviceTypes = [
        { value: 'tablet', label: 'Tablet', icon: Tablet },
        { value: 'pos', label: 'POS', icon: Monitor },
        { value: 'kiosk', label: 'Kiosk', icon: ShoppingBag },
        { value: 'mobile', label: 'Mobile', icon: Smartphone }
    ];

    const orderTypeOptions = [
        { value: 'food', label: 'Food', icon: Utensils },
        { value: 'beverage', label: 'Beverage', icon: Coffee },
        { value: 'both', label: 'Both', icon: null }
    ];

    useEffect(() => {
        fetchAreas();
        fetchOutlets();
        fetchDevices();
    }, []);

    const fetchOutlets = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/outlet');

            const outletsData = Array.isArray(response.data)
                ? response.data
                : (response.data && Array.isArray(response.data.data))
                    ? response.data.data
                    : [];

            setOutlets(outletsData);
        } catch (err) {
            console.error("Error fetching outlets:", err);
            setOutlets([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDevices = async () => {
        setLoadingDevices(true);
        try {
            const response = await axios.get('/api/devices');

            const devicesData = Array.isArray(response.data)
                ? response.data
                : (response.data && Array.isArray(response.data.data))
                    ? response.data.data
                    : [];

            setDevices(devicesData);
        } catch (err) {
            console.error("Error fetching devices:", err);
            setDevices([]);
        } finally {
            setLoadingDevices(false);
        }
    };

    const fetchAreas = async () => {
        setLoadingAreas(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const areaResponse = await axios.get("/api/areas");
            const areaData = areaResponse.data.data || [];

            setAreas(areaData);
        } catch (error) {
            console.error('Error fetching areas:', error);
        } finally {
            setLoadingAreas(false);
        }
    };

    const options = [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((outlet) => ({
            value: outlet._id,
            label: outlet.name,
        })),
    ];

    const deviceOptions = [
        { value: "", label: "Tidak Ada (Device Utama)" },
        ...devices.map((device) => ({
            value: device._id,
            label: `${device.deviceName} (${device.deviceId})`,
        })),
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleOrderTypeChange = (value) => {
        setFormData(prev => ({
            ...prev,
            orderTypes: prev.orderTypes.includes(value)
                ? prev.orderTypes.filter(t => t !== value)
                : [...prev.orderTypes, value]
        }));
    };

    const handleAreaToggle = (areaCode) => {
        setFormData(prev => {
            const isSelected = prev.assignedAreas.includes(areaCode);
            if (isSelected) {
                const area = areas.find(a => a.area_code === areaCode);
                const tablesToRemove = area?.tables.map(t => t.table_number) || [];
                return {
                    ...prev,
                    assignedAreas: prev.assignedAreas.filter(a => a !== areaCode),
                    assignedTables: prev.assignedTables.filter(t => !tablesToRemove.includes(t))
                };
            } else {
                return {
                    ...prev,
                    assignedAreas: [...prev.assignedAreas, areaCode]
                };
            }
        });
    };

    const handleTableToggle = (tableNumber, areaCode) => {
        setFormData(prev => {
            const isSelected = prev.assignedTables.includes(tableNumber);
            if (isSelected) {
                return {
                    ...prev,
                    assignedTables: prev.assignedTables.filter(t => t !== tableNumber)
                };
            } else {
                const newAreas = prev.assignedAreas.includes(areaCode)
                    ? prev.assignedAreas
                    : [...prev.assignedAreas, areaCode];
                return {
                    ...prev,
                    assignedAreas: newAreas,
                    assignedTables: [...prev.assignedTables, tableNumber]
                };
            }
        });
    };

    const selectAllTablesInArea = (areaCode) => {
        const area = areas.find(a => a.area_code === areaCode);
        if (!area) return;

        const allTableNumbers = area.tables.map(t => t.table_number);
        const allSelected = allTableNumbers.every(tn => formData.assignedTables.includes(tn));

        setFormData(prev => {
            if (allSelected) {
                return {
                    ...prev,
                    assignedTables: prev.assignedTables.filter(t => !allTableNumbers.includes(t))
                };
            } else {
                const newTables = [...prev.assignedTables];
                allTableNumbers.forEach(tn => {
                    if (!newTables.includes(tn)) {
                        newTables.push(tn);
                    }
                });
                return {
                    ...prev,
                    assignedAreas: prev.assignedAreas.includes(areaCode)
                        ? prev.assignedAreas
                        : [...prev.assignedAreas, areaCode],
                    assignedTables: newTables
                };
            }
        });
    };

    const handleSubmit = async () => {
        if (!formData.deviceId || !tempSelectedOutlet || !formData.deviceName || !formData.location) {
            setResponse({
                success: false,
                message: 'Mohon lengkapi semua field yang wajib diisi (Device ID, Outlet ID, Nama Device, dan Lokasi)'
            });
            return;
        }

        setLoading(true);
        setResponse(null);

        try {
            const payload = {
                deviceId: formData.deviceId,
                outlet: tempSelectedOutlet,
                deviceName: formData.deviceName,
                // parentDevice: formData.parentDevice,
                deviceType: formData.deviceType,
                location: formData.location,
                assignedAreas: formData.assignedAreas,
                assignedTables: formData.assignedTables,
                orderTypes: formData.orderTypes,
                notes: formData.notes
            };

            console.log('📤 Sending payload:', payload);

            const response = await axios.post("/api/devices", payload);

            console.log('✅ Response:', response.data);

            setResponse({
                success: true,
                message: response.data.message || 'Device berhasil didaftarkan',
                data: response.data.data
            });

            setFormData({
                deviceId: '',
                outlet: '',
                deviceName: '',
                deviceType: 'tablet',
                // parentDevice: '',
                location: '',
                assignedAreas: [],
                assignedTables: [],
                orderTypes: ['both'],
                notes: ''
            });
            setTempSelectedOutlet("");

        } catch (error) {
            console.error('❌ Error:', error);

            setResponse({
                success: false,
                message: error.response?.data?.message || error.message || 'Gagal mendaftarkan device',
                error: error.response?.data?.error || error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 md:p-8">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                <Monitor className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white">
                                    Device Registration
                                </h1>
                                <p className="text-blue-100 text-sm mt-1">
                                    Tambahkan perangkat baru ke outlet Anda
                                </p>
                            </div>
                        </div>
                    </div>

                    {response && (
                        <div className={`mx-6 mt-6 p-4 rounded-xl border-2 ${response.success
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                            }`}>
                            <div className="flex items-start gap-3">
                                {response.success ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <p className={`font-semibold ${response.success ? 'text-green-900' : 'text-red-900'}`}>
                                        {response.message}
                                    </p>
                                    {response.data && (
                                        <p className="text-sm text-green-700 mt-1">
                                            Device ID: {response.data._id}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-6 md:p-8 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Device ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="deviceId"
                                    value={formData.deviceId}
                                    onChange={handleChange}
                                    placeholder="Contoh: POS-001"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Nama Device <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="deviceName"
                                    value={formData.deviceName}
                                    onChange={handleChange}
                                    placeholder="Contoh: Kasir Utama"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Parent Device (Opsional)
                            </label>
                            <Select
                                className="text-sm"
                                classNamePrefix="react-select"
                                placeholder="Pilih Parent Device"
                                options={deviceOptions}
                                isSearchable
                                isLoading={loadingDevices}
                                value={
                                    deviceOptions.find((opt) => opt.value === formData.parentDevice) || deviceOptions[0]
                                }
                                onChange={(selected) => setFormData(prev => ({ ...prev, parentDevice: selected.value }))}
                                styles={customSelectStyles}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Pilih device induk jika ini adalah device slave/child
                            </p>
                        </div> */}

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Outlet ID <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    className="text-sm"
                                    classNamePrefix="react-select"
                                    placeholder="Pilih Outlet"
                                    options={options}
                                    isSearchable
                                    value={
                                        options.find((opt) => opt.value === tempSelectedOutlet) || options[0]
                                    }
                                    onChange={(selected) => setTempSelectedOutlet(selected.value)}
                                    styles={customSelectStyles}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Lokasi <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="Contoh: Kasir Utama / Bar Depan"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Tipe Device <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {deviceTypes.map(({ value, label, icon: Icon }) => (
                                    <label
                                        key={value}
                                        className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.deviceType === value
                                            ? 'border-blue-500 bg-blue-50 shadow-md'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="deviceType"
                                            value={value}
                                            checked={formData.deviceType === value}
                                            onChange={handleChange}
                                            className="sr-only"
                                        />
                                        <Icon className={`w-6 h-6 mb-2 ${formData.deviceType === value ? 'text-blue-600' : 'text-gray-400'}`} />
                                        <span className={`text-sm font-medium ${formData.deviceType === value ? 'text-blue-700' : 'text-gray-600'}`}>
                                            {label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Tipe Pesanan yang Ditangani
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {orderTypeOptions.map(({ value, label, icon: Icon }) => (
                                    <label
                                        key={value}
                                        className={`flex items-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${formData.orderTypes.includes(value)
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.orderTypes.includes(value)}
                                            onChange={() => handleOrderTypeChange(value)}
                                            className="sr-only"
                                        />
                                        {Icon && <Icon className="w-4 h-4" />}
                                        <span className="font-medium">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border-2 border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-sm font-semibold text-gray-700">
                                    Pilih Area & Meja yang Ditugaskan
                                </label>
                                {loadingAreas && (
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Loading...</span>
                                    </div>
                                )}
                            </div>

                            {loadingAreas ? (
                                <div className="text-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                                </div>
                            ) : areas.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    Tidak ada area yang tersedia
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {areas.map((area) => {
                                        const isAreaSelected = formData.assignedAreas.includes(area.area_code);
                                        const areaTableNumbers = area.tables?.map(t => t.table_number) || [];
                                        const selectedTablesInArea = formData.assignedTables.filter(t =>
                                            areaTableNumbers.includes(t)
                                        ).length;
                                        const allTablesSelected = areaTableNumbers.length > 0 &&
                                            areaTableNumbers.every(tn => formData.assignedTables.includes(tn));

                                        return (
                                            <div
                                                key={area._id}
                                                className={`border-2 rounded-xl overflow-hidden transition-all ${isAreaSelected
                                                    ? 'border-blue-400 bg-white shadow-md'
                                                    : 'border-gray-200 bg-white'
                                                    }`}
                                            >
                                                <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b">
                                                    <div className="flex items-center justify-between">
                                                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                                                            <input
                                                                type="checkbox"
                                                                checked={isAreaSelected}
                                                                onChange={() => handleAreaToggle(area.area_code)}
                                                                className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                                            />
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-lg text-gray-800">
                                                                        Area {area.area_code}
                                                                    </span>
                                                                    <span className="text-gray-600">- {area.area_name}</span>
                                                                </div>
                                                                <div className="text-sm text-gray-500 mt-1">
                                                                    Kapasitas: {area.capacity} orang · {area.totalTables} meja
                                                                    {selectedTablesInArea > 0 && (
                                                                        <span className="ml-2 text-blue-600 font-medium">
                                                                            ({selectedTablesInArea} meja dipilih)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => selectAllTablesInArea(area.area_code)}
                                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${allTablesSelected
                                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                }`}
                                                        >
                                                            {allTablesSelected ? 'Batalkan Semua' : 'Pilih Semua Meja'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {area.tables && area.tables.length > 0 && (
                                                    <div className="p-4">
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                                            {area.tables.map((table) => {
                                                                const isTableSelected = formData.assignedTables.includes(table.table_number);
                                                                return (
                                                                    <label
                                                                        key={table._id}
                                                                        className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${isTableSelected
                                                                            ? 'border-green-500 bg-green-50 shadow-sm'
                                                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                                            }`}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isTableSelected}
                                                                            onChange={() => handleTableToggle(table.table_number, area.area_code)}
                                                                            className="w-4 h-4 rounded border-2 border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500"
                                                                        />
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className={`text-sm font-bold truncate ${isTableSelected ? 'text-green-700' : 'text-gray-700'}`}>
                                                                                {table.table_number}
                                                                            </div>
                                                                            <div className={`text-xs ${isTableSelected ? 'text-green-600' : 'text-gray-500'}`}>
                                                                                {table.seats} org
                                                                            </div>
                                                                        </div>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {(formData.assignedAreas.length > 0 || formData.assignedTables.length > 0) && (
                                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="text-sm font-semibold text-blue-900 mb-2">Summary:</div>
                                    <div className="flex flex-wrap gap-2 text-sm text-blue-700">
                                        <span>{formData.assignedAreas.length} area dipilih</span>
                                        <span>·</span>
                                        <span>{formData.assignedTables.length} meja dipilih</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Catatan (Opsional)
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Tambahkan catatan atau informasi tambahan tentang device ini..."
                                rows="3"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors resize-none"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Memproses...
                                    </span>
                                ) : (
                                    'Daftarkan Device'
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">Informasi Penting:</p>
                            <ul className="space-y-1 list-disc list-inside">
                                <li>Device ID harus unik untuk setiap outlet</li>
                                {/* <li>Parent Device digunakan untuk hierarchi device (opsional)</li> */}
                                <li>Pilih area akan otomatis menampilkan daftar meja di area tersebut</li>
                                <li>Pilih meja otomatis akan memilih area nya juga</li>
                                <li>Device akan aktif secara default setelah registrasi</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}