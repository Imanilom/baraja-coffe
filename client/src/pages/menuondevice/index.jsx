import React, { useState, useEffect } from 'react';
import { GripVertical, Plus, Trash2, Save, RefreshCw, Search } from 'lucide-react';
import Select from 'react-select';

const DeviceMenuManager = () => {
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [availableMenus, setAvailableMenus] = useState([]);
    const [assignedMenus, setAssignedMenus] = useState([]);
    const [loading, setLoading] = useState(false);
    const [draggedItem, setDraggedItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [searchAvailable, setSearchAvailable] = useState('');
    const [searchAssigned, setSearchAssigned] = useState('');

    // Fetch devices
    useEffect(() => {
        fetchDevices();
    }, []);

    // Fetch menus when component mounts
    useEffect(() => {
        fetchMenus();
    }, []);

    // Fetch assigned menus when device changes
    useEffect(() => {
        if (selectedDevice) {
            fetchAssignedMenus();
        } else {
            setAssignedMenus([]);
        }
    }, [selectedDevice]);

    const fetchDevices = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/devices');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const data = result.data ? result.data : result;
            setDevices(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching devices:', error);
            setError('Gagal memuat perangkat: ' + error.message);
            setDevices([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMenus = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/menu/all-menu-items-backoffice');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const menuData = result.data ? result.data : result;

            // Transform menu data to flatten the structure
            const transformedMenus = Array.isArray(menuData) ? menuData.map(menu => ({
                _id: menu.id || menu._id,
                name: menu.name,
                category: menu.category?.name || menu.mainCategory,
                price: menu.discountedPrice || menu.originalPrice || 0,
                description: menu.description,
                workstation: menu.workstation,
                isActive: menu.isActive,
                imageUrl: menu.imageUrl || 'https://img.barajacoffee.com/uploads/placeholder.webp'
            })) : [];

            setAvailableMenus(transformedMenus);
        } catch (error) {
            console.error('Error fetching menus:', error);
            setError('Gagal memuat menu: ' + error.message);
            setAvailableMenus([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignedMenus = async () => {
        // You can implement this to fetch already assigned menus for the device
        // For now, reset to empty
        setAssignedMenus([]);
    };

    const handleDragStart = (e, item, source) => {
        setDraggedItem({ item, source });
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDropToAssigned = (e) => {
        e.preventDefault();
        if (!selectedDevice) {
            alert('Silakan pilih perangkat terlebih dahulu');
            return;
        }

        if (draggedItem && draggedItem.source === 'available') {
            const exists = assignedMenus.find(m => m._id === draggedItem.item._id);
            if (!exists) {
                setAssignedMenus([...assignedMenus, draggedItem.item]);
            }
        }
        setDraggedItem(null);
    };

    const handleDropToAvailable = (e) => {
        e.preventDefault();
        if (draggedItem && draggedItem.source === 'assigned') {
            setAssignedMenus(assignedMenus.filter(m => m._id !== draggedItem.item._id));
        }
        setDraggedItem(null);
    };

    const addToAssigned = (menu) => {
        if (!selectedDevice) {
            alert('Silakan pilih perangkat terlebih dahulu');
            return;
        }
        const exists = assignedMenus.find(m => m._id === menu._id);
        if (!exists) {
            setAssignedMenus([...assignedMenus, menu]);
        }
    };

    const removeFromAssigned = (menuId) => {
        setAssignedMenus(assignedMenus.filter(m => m._id !== menuId));
    };

    const handleSave = async () => {
        if (!selectedDevice) {
            alert('Silakan pilih perangkat terlebih dahulu');
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            const payload = {
                device_id: selectedDevice,
                menu_ids: assignedMenus.map(m => m._id)
            };

            const response = await fetch('/api/device-menu-assignment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            alert('Pengaturan menu berhasil disimpan!');
        } catch (error) {
            console.error('Error saving:', error);
            setError('Gagal menyimpan pengaturan menu: ' + error.message);
            alert('Gagal menyimpan pengaturan menu. Periksa console untuk detail.');
        } finally {
            setIsSaving(false);
        }
    };

    const selectedDeviceInfo = devices.find(d => d._id === selectedDevice);

    // Filter menus based on search
    const filteredAvailableMenus = availableMenus.filter(menu =>
        menu.name.toLowerCase().includes(searchAvailable.toLowerCase()) ||
        menu.category.toLowerCase().includes(searchAvailable.toLowerCase())
    );

    const filteredAssignedMenus = assignedMenus.filter(menu =>
        menu.name.toLowerCase().includes(searchAssigned.toLowerCase()) ||
        menu.category.toLowerCase().includes(searchAssigned.toLowerCase())
    );

    // Custom styles for react-select
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

    // Transform devices to react-select options
    const deviceOptions = devices.map(device => ({
        value: device._id,
        label: `${device.deviceName || device.name} (${device.deviceId})`,
        data: device
    }));

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Kelola Menu Perangkat</h1>
                    <p className="text-gray-600">Atur item menu ke perangkat dengan drag and drop</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Device Selection */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pilih Perangkat
                    </label>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <Select
                                value={deviceOptions.find(opt => opt.value === selectedDevice) || null}
                                onChange={(option) => setSelectedDevice(option ? option.value : '')}
                                options={deviceOptions}
                                styles={customSelectStyles}
                                placeholder="-- Pilih Perangkat --"
                                isClearable
                                isDisabled={loading}
                                isSearchable
                                noOptionsMessage={() => "Tidak ada perangkat ditemukan"}
                            />
                        </div>
                        <button
                            onClick={fetchDevices}
                            disabled={loading}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Muat Ulang
                        </button>
                    </div>
                    {selectedDeviceInfo && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-blue-900">
                                        {selectedDeviceInfo.deviceName}
                                    </p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        {selectedDeviceInfo.deviceId} • {selectedDeviceInfo.location} • {selectedDeviceInfo.deviceType}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${selectedDeviceInfo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {selectedDeviceInfo.isActive ? 'Aktif' : 'Tidak Aktif'}
                                    </span>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${selectedDeviceInfo.isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {selectedDeviceInfo.isOnline ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Available Menus */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Menu Tersedia</h2>

                        {/* Search Bar */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Cari menu..."
                                value={searchAvailable}
                                onChange={(e) => setSearchAvailable(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div
                            onDragOver={handleDragOver}
                            onDrop={handleDropToAvailable}
                            className="space-y-2 min-h-[500px] max-h-[600px] overflow-y-auto"
                        >
                            {loading ? (
                                <div className="text-center py-8 text-gray-500">Memuat menu...</div>
                            ) : filteredAvailableMenus.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    {searchAvailable ? 'Menu tidak ditemukan' : 'Tidak ada menu tersedia'}
                                </div>
                            ) : (
                                filteredAvailableMenus.map(menu => (
                                    <div
                                        key={menu._id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, menu, 'available')}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-move group"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <GripVertical className="w-5 h-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                                            <img
                                                src={menu.imageUrl}
                                                alt={menu.name}
                                                className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                                                onError={(e) => {
                                                    e.target.src = 'https://img.barajacoffee.com/uploads/placeholder.webp';
                                                }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">{menu.name}</div>
                                                <div className="text-sm text-gray-500 truncate">{menu.category}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                                                Rp {menu.price?.toLocaleString('id-ID')}
                                            </span>
                                            <button
                                                onClick={() => addToAssigned(menu)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={!selectedDevice}
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Assigned Menus */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Menu Terpilih
                                {selectedDeviceInfo && (
                                    <span className="text-sm font-normal text-gray-600 ml-2">
                                        ({selectedDeviceInfo.deviceName})
                                    </span>
                                )}
                            </h2>
                            <button
                                onClick={handleSave}
                                disabled={!selectedDevice || isSaving || assignedMenus.length === 0}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>

                        {/* Search Bar */}
                        {assignedMenus.length > 0 && (
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Cari menu terpilih..."
                                    value={searchAssigned}
                                    onChange={(e) => setSearchAssigned(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        )}

                        <div
                            onDragOver={handleDragOver}
                            onDrop={handleDropToAssigned}
                            className={`space-y-2 h-[600px] overflow-y-auto border-2 border-dashed rounded-lg p-4 ${selectedDevice ? 'border-blue-300 bg-blue-50/30' : 'border-gray-300 bg-gray-50'
                                }`}
                        >
                            {!selectedDevice ? (
                                <div className="text-center py-16 text-gray-500">
                                    Silakan pilih perangkat terlebih dahulu
                                </div>
                            ) : filteredAssignedMenus.length === 0 ? (
                                <div className="text-center py-16 text-gray-500">
                                    {searchAssigned ? 'Menu tidak ditemukan' : assignedMenus.length === 0 ? 'Seret menu ke sini atau klik tombol +' : 'Menu tidak ditemukan'}
                                </div>
                            ) : (
                                filteredAssignedMenus.map(menu => (
                                    <div
                                        key={menu._id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, menu, 'assigned')}
                                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all cursor-move group"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <GripVertical className="w-5 h-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                                            <img
                                                src={menu.imageUrl}
                                                alt={menu.name}
                                                className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                                                onError={(e) => {
                                                    e.target.src = 'https://img.barajacoffee.com/uploads/placeholder.webp';
                                                }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">{menu.name}</div>
                                                <div className="text-sm text-gray-500 truncate">{menu.category}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                                                Rp {menu.price?.toLocaleString('id-ID')}
                                            </span>
                                            <button
                                                onClick={() => removeFromAssigned(menu._id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeviceMenuManager;