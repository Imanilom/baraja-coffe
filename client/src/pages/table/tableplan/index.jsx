import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaChevronRight, FaIdBadge, FaPencilAlt, FaExpand, FaCompress, FaSave, FaTimes, FaPlus, FaEdit, FaTrash, FaQrcode } from "react-icons/fa";
import Select from "react-select";
import QRCode from 'qrcode';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TablePlanManagement = () => {
    const [outlets, setOutlets] = useState([]);
    const [areas, setAreas] = useState([]);
    const [selectedArea, setSelectedArea] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panning, setPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    // Drag & Drop states
    const [draggingTable, setDraggingTable] = useState(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [tablePositions, setTablePositions] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saving, setSaving] = useState(false);

    // Add/Edit table states
    const [showTableForm, setShowTableForm] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [tableForm, setTableForm] = useState({
        table_number: '',
        area_id: '',
        seats: 4,
        table_type: 'regular',
        shape: 'rectangle',
        position: { x: 2, y: 2 },
        size: { width: 1, height: 1 },
        status: 'available'
    });

    const containerRef = useRef(null);
    const scale = 100 * zoomLevel;

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const outletsResponse = await axios.get('/api/outlet');
                setOutlets(outletsResponse.data.data || []);

                const areasResponse = await axios.get('/api/areas');
                const areasData = areasResponse.data.data || [];
                setAreas(areasData);

                if (areasData.length > 0) {
                    setSelectedArea(areasData[0]);
                    initializeTablePositions(areasData[0]);
                    setOffset({ x: 0, y: 0 });
                }

                setError(null);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Initialize table positions from area data
    const initializeTablePositions = (area) => {
        const positions = {};
        area.tables?.forEach(table => {
            positions[table._id] = {
                x: table.position.x,
                y: table.position.y
            };
        });
        setTablePositions(positions);
    };

    // Handle area change
    const handleAreaChange = (areaId) => {
        const area = areas.find(a => a._id === areaId);
        setSelectedArea(area);
        initializeTablePositions(area);
        setOffset({ x: 0, y: 0 });
        setHasUnsavedChanges(false);
    };

    // Handle table drag start
    const handleTableDragStart = (e, table) => {
        e.stopPropagation();
        setDraggingTable(table._id);

        const rect = containerRef.current.getBoundingClientRect();
        const currentPos = tablePositions[table._id] || table.position;

        setDragStart({
            x: e.clientX,
            y: e.clientY,
            initialX: currentPos.x,
            initialY: currentPos.y
        });
    };

    // Handle table drag move
    const handleTableDragMove = (e) => {
        if (!draggingTable) return;

        const deltaX = (e.clientX - dragStart.x) / scale;
        const deltaY = (e.clientY - dragStart.y) / scale;

        let newX = dragStart.initialX + deltaX;
        let newY = dragStart.initialY + deltaY;

        // Constrain within area bounds
        if (selectedArea) {
            newX = Math.max(0.5, Math.min(selectedArea.roomSize.width - 0.5, newX));
            newY = Math.max(0.5, Math.min(selectedArea.roomSize.height - 0.5, newY));
        }

        setTablePositions(prev => ({
            ...prev,
            [draggingTable]: { x: newX, y: newY }
        }));

        setHasUnsavedChanges(true);
    };

    // Handle table drag end
    const handleTableDragEnd = () => {
        setDraggingTable(null);
    };

    const options = areas.map(area => ({
        value: area._id,
        label: `${area.area_name} (${area.area_code}) - ${area.roomSize.width}x${area.roomSize.height}${area.roomSize.unit}`,
    }));

    // Add drag event listeners
    useEffect(() => {
        if (draggingTable) {
            window.addEventListener('mousemove', handleTableDragMove);
            window.addEventListener('mouseup', handleTableDragEnd);
            return () => {
                window.removeEventListener('mousemove', handleTableDragMove);
                window.removeEventListener('mouseup', handleTableDragEnd);
            };
        }
    }, [draggingTable, dragStart, scale]);

    // Save table positions
    const handleSavePositions = async () => {
        setSaving(true);
        try {
            // Prepare update data - hanya kirim meja yang posisinya berubah
            const updates = selectedArea.tables
                .filter(table => tablePositions[table._id]) // Hanya yang di-drag
                .map(table => ({
                    tableId: table._id,
                    position: tablePositions[table._id]
                }));

            if (updates.length === 0) {
                alert('Tidak ada perubahan untuk disimpan');
                setSaving(false);
                return;
            }

            // Send bulk update request
            const response = await axios.put(`/api/areas/tables/bulk-update`, {
                updates
            });

            // Check if all updates succeeded
            if (response.data.errors && response.data.errors.length > 0) {
                console.error('Some updates failed:', response.data.errors);
                alert(`${response.data.updated} meja berhasil disimpan, ${response.data.failed} gagal. Cek console untuk detail.`);
            } else {
                alert('Semua posisi meja berhasil disimpan!');
            }

            // Refresh data dari server untuk memastikan sinkron
            const areasResponse = await axios.get('/api/areas');
            const areasData = areasResponse.data.data || [];
            setAreas(areasData);

            const updatedArea = areasData.find(a => a._id === selectedArea._id);
            if (updatedArea) {
                setSelectedArea(updatedArea);
                initializeTablePositions(updatedArea);
            }

            setHasUnsavedChanges(false);

        } catch (err) {
            console.error('Error saving positions:', err);
            console.error('Error details:', err.response?.data);
            alert(`Gagal menyimpan posisi meja: ${err.response?.data?.message || err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadTableQR = async (table) => {
        try {
            // Data QR hanya string nama meja
            const qrData = `https://order.barajacoffee.com/auto-session?outlet=67cbc9560f025d897d69f889&table=${table.table_number}`;

            // Generate QR Code
            const qrCodeDataURL = await QRCode.toDataURL(qrData, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#005429',
                    light: '#FFFFFF'
                }
            });

            // Create download link
            const link = document.createElement('a');
            link.href = qrCodeDataURL;
            link.download = `QR-${table.table_number}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`QR Code ${table.table_number} berhasil didownload`);
        } catch (error) {
            console.error('Error generating QR code:', error);
            toast.error('Gagal generate QR code');
        }
    };

    // Cancel position changes
    const handleCancelChanges = () => {
        initializeTablePositions(selectedArea);
        setHasUnsavedChanges(false);
    };

    // Open add table form
    const handleAddTable = () => {
        setEditingTable(null);
        setTableForm({
            table_number: '',
            area_id: selectedArea?._id || '',
            seats: 4,
            table_type: 'regular',
            shape: 'rectangle',
            position: { x: 2, y: 2 },
            size: { width: 1, height: 1 },
            status: 'available'
        });
        setShowTableForm(true);
    };

    // Open edit table form
    const handleEditTable = (table) => {
        setEditingTable(table);
        setTableForm({
            table_number: table.table_number,
            seats: table.seats,
            table_type: table.table_type,
            shape: table.shape,
            position: tablePositions[table._id] || table.position,
            size: table.size || { width: 1, height: 1 },
            status: table.status
        });
        setShowTableForm(true);
    };

    // Submit table form (add or edit)
    const handleSubmitTable = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editingTable) {
                // Update existing table
                await axios.put(`/api/areas/tables/${editingTable._id}`, tableForm);
                alert('Meja berhasil diperbarui!');
            } else {
                await axios.post(`/api/areas/tables`, tableForm);
                alert('Meja berhasil diperbarui!');
            }

            // Refresh area data
            const areasResponse = await axios.get('/api/areas');
            const areasData = areasResponse.data.data || [];
            setAreas(areasData);

            const updatedArea = areasData.find(a => a._id === selectedArea._id);
            setSelectedArea(updatedArea);
            initializeTablePositions(updatedArea);

            setShowTableForm(false);
            setEditingTable(null);
        } catch (err) {
            console.error('Error saving table:', err);
            alert('Gagal menyimpan meja. Silakan coba lagi.');
        } finally {
            setSaving(false);
        }
    };

    // Delete table
    const handleDeleteTable = async (table) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus meja ${table.table_number}?`)) {
            return;
        }

        setSaving(true);
        try {
            await axios.delete(`/api/areas/tables/${table._id}`);

            // Refresh area data
            const areasResponse = await axios.get('/api/areas');
            const areasData = areasResponse.data.data || [];
            setAreas(areasData);

            const updatedArea = areasData.find(a => a._id === selectedArea._id);
            setSelectedArea(updatedArea);
            initializeTablePositions(updatedArea);

            alert('Meja berhasil dihapus!');
        } catch (err) {
            console.error('Error deleting table:', err);
            alert('Gagal menghapus meja. Silakan coba lagi.');
        } finally {
            setSaving(false);
        }
    };

    const formatStatus = (status) => {
        switch (status) {
            case 'available': return 'Tersedia';
            case 'occupied': return 'Terisi';
            case 'reserved': return 'Dipesan';
            case 'maintenance': return 'Perbaikan';
            default: return status;
        }
    };

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
    const handleResetView = () => {
        setZoomLevel(1);
        setOffset({ x: 0, y: 0 });
    };

    const handlePanStart = (e) => {
        if (draggingTable) return;
        e.preventDefault();
        setPanning(true);
        setPanStart({
            x: e.clientX - offset.x,
            y: e.clientY - offset.y
        });
    };

    const handlePanMove = (e) => {
        if (!panning) return;

        const newOffset = {
            x: e.clientX - panStart.x,
            y: e.clientY - panStart.y
        };

        if (selectedArea && containerRef.current) {
            const containerWidth = containerRef.current.clientWidth;
            const containerHeight = containerRef.current.clientHeight;
            const areaWidth = selectedArea.roomSize.width * scale;
            const areaHeight = selectedArea.roomSize.height * scale;

            const maxX = Math.max(0, areaWidth - containerWidth);
            const maxY = Math.max(0, areaHeight - containerHeight);

            newOffset.x = Math.min(0, Math.max(-maxX, newOffset.x));
            newOffset.y = Math.min(0, Math.max(-maxY, newOffset.y));
        }

        setOffset(newOffset);
    };

    const handlePanEnd = () => setPanning(false);

    useEffect(() => {
        if (panning) {
            window.addEventListener('mousemove', handlePanMove);
            window.addEventListener('mouseup', handlePanEnd);
            return () => {
                window.removeEventListener('mousemove', handlePanMove);
                window.removeEventListener('mouseup', handlePanEnd);
            };
        }
    }, [panning, panStart]);

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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <div className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <span>Pengaturan Meja</span>
                    <FaChevronRight />
                    <span>Denah Meja</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-6 pb-6">
                {/* Area Selection */}
                <div className="flex items-center space-x-4">
                    <div className="flex-1 flex justify-end ">
                        <Select
                            className="text-[13px] w-1/5"
                            styles={customStyles}
                            options={options}
                            value={options.find(opt => opt.value === (selectedArea?._id || "")) || null}
                            onChange={(selected) => handleAreaChange(selected?.value)}
                            placeholder="Pilih Area..."
                            isClearable
                        />
                    </div>
                </div>

                {/* Unsaved Changes Warning */}
                {hasUnsavedChanges && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded flex items-center justify-between">
                        <span className="text-sm text-yellow-800">
                            Ada perubahan yang belum disimpan
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCancelChanges}
                                className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded flex items-center gap-1"
                            >
                                <FaTimes size={12} /> Batal
                            </button>
                            <button
                                onClick={handleSavePositions}
                                disabled={saving}
                                className="px-3 py-1 text-sm bg-[#005429] text-white hover:bg-[#006d34] rounded flex items-center gap-1 disabled:opacity-50"
                            >
                                <FaSave size={12} /> {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Area Visualization */}
                {selectedArea && (
                    <div className="mt-4 rounded shadow-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                                {selectedArea.area_name} ({selectedArea.area_code})
                            </h3>
                            <div className="flex items-center space-x-2">
                                <div className="text-sm text-gray-600">
                                    Ukuran: {selectedArea.roomSize.width} x {selectedArea.roomSize.height} {selectedArea.roomSize.unit}
                                </div>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={handleZoomIn}
                                        className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                        title="Zoom In"
                                    >
                                        <FaExpand size={14} />
                                    </button>
                                    <button
                                        onClick={handleZoomOut}
                                        className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                        title="Zoom Out"
                                    >
                                        <FaCompress size={14} />
                                    </button>
                                    <button
                                        onClick={handleResetView}
                                        className="p-1 bg-gray-200 rounded hover:bg-gray-300 text-xs"
                                        title="Reset View"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div
                            ref={containerRef}
                            className="relative border-2 border-gray-300 bg-gray-50 rounded-md overflow-hidden"
                            style={{
                                height: '500px',
                                width: '100%',
                                cursor: panning ? 'grabbing' : draggingTable ? 'grabbing' : 'grab',
                                touchAction: 'none'
                            }}
                            onMouseDown={handlePanStart}
                        >
                            <div
                                className="absolute inset-0"
                                style={{
                                    transform: `translate(${offset.x}px, ${offset.y}px)`,
                                    width: '100%',
                                    height: '500px'
                                }}
                            >
                                {/* Grid background */}
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        backgroundImage: 'linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)',
                                        backgroundSize: `${10 * zoomLevel}px ${10 * zoomLevel}px`
                                    }}
                                >
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            backgroundImage: 'linear-gradient(to right, #ddd 1px, transparent 1px), linear-gradient(to bottom, #ddd 1px, transparent 1px)',
                                            backgroundSize: `${100 * zoomLevel}px ${100 * zoomLevel}px`
                                        }}
                                    />
                                </div>

                                {/* Area name label */}
                                <div className="absolute top-2 left-2 bg-white bg-opacity-70 px-2 py-1 rounded text-sm font-medium shadow-sm">
                                    {selectedArea.area_name}
                                </div>

                                {/* Tables */}
                                {selectedArea.tables?.map((table) => {
                                    const pos = tablePositions[table._id] || table.position;
                                    return (
                                        <div
                                            key={table._id}
                                            className={`absolute flex flex-col items-center justify-center rounded border-2 
                                                ${draggingTable === table._id ? 'cursor-grabbing shadow-lg' : 'cursor-move'}
                                                ${table.status === 'available' ? 'border-green-500 bg-white hover:bg-green-200' :
                                                    table.status === 'occupied' ? 'border-red-500 bg-red-100 hover:bg-red-200' :
                                                        table.status === 'reserved' ? 'border-yellow-500 bg-yellow-100 hover:bg-yellow-200' :
                                                            'border-gray-500 bg-gray-100 hover:bg-gray-200'}`}
                                            style={{
                                                left: `${pos.x * scale}px`,
                                                top: `${pos.y * scale}px`,
                                                width: `${table.size?.width ? table.size.width * scale : 0.8 * scale}px`,
                                                height: `${table.size?.height ? table.size.height * scale : 0.8 * scale}px`,
                                                borderRadius: table.shape === 'circle' ? '50%' :
                                                    table.shape === 'oval' ? '50%' : '4px',
                                                transform: 'translate(-50%, -50%)',
                                                transition: draggingTable === table._id ? 'none' : 'background-color 0.2s',
                                                zIndex: draggingTable === table._id ? 100 : 10
                                            }}
                                            onMouseDown={(e) => handleTableDragStart(e, table)}
                                        >
                                            <div className="text-sm font-semibold text-center">
                                                {table.table_number}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                {table.seats} kursi
                                            </div>
                                            <div className={`text-xs font-medium mt-1 
                                                ${table.status === 'available' ? 'text-green-600' :
                                                    table.status === 'occupied' ? 'text-red-600' :
                                                        table.status === 'reserved' ? 'text-yellow-600' :
                                                            'text-gray-600'}`}>
                                                {formatStatus(table.status)}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Scale indicator */}
                                <div className="absolute bottom-2 right-2 bg-white bg-opacity-70 px-2 py-1 rounded text-xs text-gray-500 shadow-sm">
                                    Skala: 1m = {Math.round(100 * zoomLevel)}px ({zoomLevel.toFixed(1)}x)
                                </div>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
                            💡 Tips: Klik dan drag meja untuk memindahkan posisi. Jangan lupa simpan perubahan setelah selesai.
                        </div>

                        {/* Table List */}
                        <div className="mt-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold">Daftar Meja</h4>
                                <button
                                    onClick={handleAddTable}
                                    className="px-3 py-1 bg-[#005429] text-white text-sm rounded hover:bg-[#006d34] flex items-center gap-1"
                                >
                                    <FaPlus size={12} /> Tambah Meja
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {selectedArea.tables?.map(table => {
                                    const pos = tablePositions[table._id] || table.position;
                                    return (
                                        <div
                                            key={table._id}
                                            className={`p-3 rounded border hover:shadow-md transition-shadow
                                                ${table.status === 'available' ? 'border-green-300 bg-white' :
                                                    table.status === 'occupied' ? 'border-red-300 bg-red-50' :
                                                        table.status === 'reserved' ? 'border-yellow-300 bg-yellow-50' :
                                                            'border-gray-300 bg-gray-50'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold">{table.table_number}</h4>
                                                    <p className="text-sm text-gray-600">
                                                        {table.seats} kursi • {table.table_type} • {table.shape}
                                                    </p>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded 
                                                    ${table.status === 'available' ? 'bg-green-100 text-green-800' :
                                                        table.status === 'occupied' ? 'bg-red-100 text-red-800' :
                                                            table.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'}`}>
                                                    {formatStatus(table.status)}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex justify-between text-xs text-gray-500">
                                                <span>Posisi: ({pos.x.toFixed(1)}, {pos.y.toFixed(1)})</span>
                                                <span>Ukuran: {table.size?.width?.toFixed(1) || '0.8'}x{table.size?.height?.toFixed(1) || '0.8'}m</span>
                                            </div>
                                            <div className="mt-2 flex gap-2">
                                                <button
                                                    onClick={() => handleEditTable(table)}
                                                    className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-1"
                                                >
                                                    <FaEdit size={10} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTable(table)}
                                                    className="flex-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center gap-1"
                                                >
                                                    <FaTrash size={10} /> Hapus
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadTableQR(table)}
                                                    className="flex-1 px-2 py-1 text-xs bg-green-900 text-white rounded hover:bg-green-600 flex items-center justify-center gap-1"
                                                >
                                                    <FaQrcode size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Table Form Modal */}
            {showTableForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold">
                                {editingTable ? 'Edit Meja' : 'Tambah Meja Baru'}
                            </h3>
                            <button
                                onClick={() => setShowTableForm(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitTable} className="p-4">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nomor Meja</label>
                                    <input
                                        type="text"
                                        value={tableForm.table_number}
                                        onChange={(e) => setTableForm({ ...tableForm, table_number: e.target.value })}
                                        className="w-full border rounded px-3 py-2 text-sm uppercase"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Jumlah Kursi</label>
                                    <input
                                        type="number"
                                        value={tableForm.seats}
                                        onChange={(e) => setTableForm({ ...tableForm, seats: parseInt(e.target.value) })}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        min="1"
                                        required
                                    />
                                </div>
                                <div>
                                    <select value={tableForm.area_id || selectedArea?._id}>
                                        {areas.map(area => (
                                            <option key={area._id} value={area._id}>
                                                {area.area_name} ({area.area_code}) - {area.roomSize.width}x{area.roomSize.height}{area.roomSize.unit}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tipe Meja</label>
                                    <select
                                        value={tableForm.table_type}
                                        onChange={(e) => setTableForm({ ...tableForm, table_type: e.target.value })}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                    >
                                        <option value="regular">Regular</option>
                                        <option value="vip">VIP</option>
                                        <option value="outdoor">Outdoor</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Bentuk</label>
                                    <select
                                        value={tableForm.shape}
                                        onChange={(e) => setTableForm({ ...tableForm, shape: e.target.value })}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                    >
                                        <option value="rectangle">Persegi Panjang</option>
                                        <option value="square">Persegi</option>
                                        <option value="circle">Lingkaran</option>
                                        <option value="oval">Oval</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Lebar (m)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={tableForm.size.width}
                                            onChange={(e) => setTableForm({
                                                ...tableForm,
                                                size: { ...tableForm.size, width: parseFloat(e.target.value) }
                                            })}
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            min="0.5"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Tinggi (m)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={tableForm.size.height}
                                            onChange={(e) => setTableForm({
                                                ...tableForm,
                                                size: { ...tableForm.size, height: parseFloat(e.target.value) }
                                            })}
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            min="0.5"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Posisi X (m)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={tableForm.position.x}
                                            onChange={(e) => setTableForm({
                                                ...tableForm,
                                                position: { ...tableForm.position, x: parseFloat(e.target.value) }
                                            })}
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            min="0"
                                            max={selectedArea?.roomSize.width}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Posisi Y (m)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={tableForm.position.y}
                                            onChange={(e) => setTableForm({
                                                ...tableForm,
                                                position: { ...tableForm.position, y: parseFloat(e.target.value) }
                                            })}
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            min="0"
                                            max={selectedArea?.roomSize.height}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Status</label>
                                    <select
                                        value={tableForm.status}
                                        onChange={(e) => setTableForm({ ...tableForm, status: e.target.value })}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                    >
                                        <option value="available">Tersedia</option>
                                        <option value="occupied">Terisi</option>
                                        <option value="reserved">Dipesan</option>
                                        <option value="maintenance">Perbaikan</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTableForm(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-[#005429] text-white rounded text-sm hover:bg-[#006d34] disabled:opacity-50"
                                >
                                    {saving ? 'Menyimpan...' : editingTable ? 'Update' : 'Tambah'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TablePlanManagement;