import React, { useState, useEffect, useRef } from "react";
import axios from '@/lib/axios';
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
            area_id: selectedArea._id, // Ensure area_id is preserved
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
            if (updatedArea) {
                setSelectedArea(updatedArea);
                initializeTablePositions(updatedArea);
            }

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
            if (updatedArea) {
                setSelectedArea(updatedArea);
                initializeTablePositions(updatedArea);
            }

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
            borderColor: 'rgba(255, 255, 255, 0.5)',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            minHeight: '40px',
            fontSize: '14px',
            color: '#005429',
            boxShadow: state.isFocused ? '0 0 0 2px #005429' : '0 1px 3px rgba(0,0,0,0.1)',
            borderRadius: '0.5rem',
            '&:hover': {
                borderColor: '#005429',
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#005429',
            fontWeight: '600',
        }),
        input: (provided) => ({
            ...provided,
            color: '#005429',
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#6b7280',
            fontSize: '14px',
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            zIndex: 9999,
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '14px',
            color: state.isSelected ? 'white' : '#005429',
            backgroundColor: state.isSelected ? '#005429' : state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'transparent',
            cursor: 'pointer',
        }),
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-red-500 text-center bg-white p-6 rounded-lg shadow-xl border border-red-100">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded hover:bg-[#004220] transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-gray-50/50">
            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-4">
                <div className="flex gap-2 items-center text-xl text-[#005429] font-bold">
                    <span>Pengaturan Meja</span>
                    <FaChevronRight className="text-sm" />
                    <span>Denah Meja</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-6 pb-6 space-y-6">

                {/* Control Bar */}
                <div className="relative z-50 flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white/40 backdrop-blur-md border border-white/50 shadow-lg">
                    <div className="w-full md:w-1/3">
                        <label className="text-xs font-semibold text-[#005429] uppercase tracking-wider mb-1 block pl-1">Area Restoran</label>
                        <Select
                            styles={customStyles}
                            options={options}
                            value={options.find(opt => opt.value === (selectedArea?._id || "")) || null}
                            onChange={(selected) => handleAreaChange(selected?.value)}
                            placeholder="Pilih Area..."
                            isClearable
                            className="w-full"
                        />
                    </div>

                    {/* Unsaved Changes & Actions */}
                    <div className="flex items-center gap-3">
                        {hasUnsavedChanges && (
                            <div className="flex items-center gap-3 px-4 py-2 bg-yellow-50/80 border border-yellow-200 rounded-lg shadow-sm">
                                <span className="text-sm text-yellow-800 font-medium">
                                    Perubahan belum disimpan
                                </span>
                                <div className="h-4 w-[1px] bg-yellow-300"></div>
                                <button
                                    onClick={handleCancelChanges}
                                    className="p-1.5 text-yellow-700 hover:bg-yellow-100 rounded transition-colors"
                                    title="Batal"
                                >
                                    <FaTimes size={14} />
                                </button>
                                <button
                                    onClick={handleSavePositions}
                                    disabled={saving}
                                    className="px-3 py-1.5 text-xs font-bold bg-[#005429] text-white hover:bg-[#004220] rounded shadow transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <FaSave /> {saving ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        )}
                        {!hasUnsavedChanges && selectedArea && (
                            <button
                                onClick={handleSavePositions} // Explicitly allow saving even if no drag changes detected (sometimes manual edits happen)
                                className="px-4 py-2 bg-white/80 border border-[#005429]/20 text-[#005429] hover:bg-[#005429] hover:text-white rounded-lg shadow-sm transition-all flex items-center gap-2 text-sm font-semibold"
                            >
                                <FaSave /> Simpan Posisi
                            </button>
                        )}
                    </div>
                </div>

                {/* Area Visualization */}
                {selectedArea && (
                    <div className="rounded-2xl overflow-hidden bg-white/40 backdrop-blur-md border border-white/50 shadow-xl">
                        {/* Toolbar */}
                        <div className="flex justify-between items-center p-4 bg-white/50 border-b border-white/50">
                            <div>
                                <h3 className="text-lg font-bold text-[#005429]">
                                    {selectedArea.area_name}
                                </h3>
                                <p className="text-sm text-gray-500 font-medium">
                                    {selectedArea.area_code} • {selectedArea.roomSize.width} x {selectedArea.roomSize.height} {selectedArea.roomSize.unit}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 bg-white/60 p-1 rounded-lg border border-white/50 shadow-sm">
                                <button
                                    onClick={handleZoomOut}
                                    className="p-2 text-gray-600 hover:text-[#005429] hover:bg-green-50 rounded-md transition-colors"
                                    title="Zoom Out"
                                >
                                    <FaCompress size={16} />
                                </button>
                                <div className="h-6 w-[1px] bg-gray-300"></div>
                                <span className="text-xs font-bold text-gray-500 min-w-[3rem] text-center">
                                    {Math.round(zoomLevel * 100)}%
                                </span>
                                <div className="h-6 w-[1px] bg-gray-300"></div>
                                <button
                                    onClick={handleZoomIn}
                                    className="p-2 text-gray-600 hover:text-[#005429] hover:bg-green-50 rounded-md transition-colors"
                                    title="Zoom In"
                                >
                                    <FaExpand size={16} />
                                </button>
                                <button
                                    onClick={handleResetView}
                                    className="ml-2 px-3 py-1 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Canvas */}
                        <div
                            ref={containerRef}
                            className="relative bg-gray-100/50 overflow-hidden group"
                            style={{
                                height: '600px',
                                width: '100%',
                                cursor: panning ? 'grabbing' : draggingTable ? 'grabbing' : 'grab',
                                touchAction: 'none'
                            }}
                            onMouseDown={handlePanStart}
                        >
                            <div
                                className="absolute inset-0 transition-transform duration-75 ease-out"
                                style={{
                                    transform: `translate(${offset.x}px, ${offset.y}px)`,
                                    width: '100%',
                                    height: '600px'
                                }}
                            >
                                {/* Premium Grid background */}
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
                                        backgroundSize: `${20 * zoomLevel}px ${20 * zoomLevel}px`,
                                        opacity: 0.5
                                    }}
                                ></div>

                                {/* Area Boundary Highlight (optional) */}
                                <div
                                    className="absolute border-2 border-dashed border-[#005429]/20 pointer-events-none"
                                    style={{
                                        width: `${selectedArea.roomSize.width * scale}px`,
                                        height: `${selectedArea.roomSize.height * scale}px`,
                                        left: 0,
                                        top: 0,
                                    }}
                                />

                                {/* Tables */}
                                {selectedArea.tables?.map((table) => {
                                    const pos = tablePositions[table._id] || table.position;
                                    const isDragging = draggingTable === table._id;

                                    // Status Styles
                                    let statusColor = "bg-white border-[#005429]";
                                    let statusText = "text-[#005429]";
                                    let statusShadow = "shadow-md hover:shadow-xl shadow-green-900/10";

                                    if (table.status === 'occupied') {
                                        statusColor = "bg-red-50 border-red-500";
                                        statusText = "text-red-600";
                                        statusShadow = "shadow-md hover:shadow-xl shadow-red-900/10";
                                    } else if (table.status === 'reserved') {
                                        statusColor = "bg-yellow-50 border-yellow-500";
                                        statusText = "text-yellow-600";
                                        statusShadow = "shadow-md hover:shadow-xl shadow-yellow-900/10";
                                    } else if (table.status === 'maintenance') {
                                        statusColor = "bg-gray-100 border-gray-400";
                                        statusText = "text-gray-500";
                                    }

                                    return (
                                        <div
                                            key={table._id}
                                            className={`absolute flex flex-col items-center justify-center rounded-lg border-2 backdrop-blur-sm transition-all
                                                ${statusColor} ${statusShadow} ${statusText}
                                                ${isDragging ? 'cursor-grabbing scale-105 z-50 ring-4 ring-green-400/30' : 'cursor-move z-10'}
                                            `}
                                            style={{
                                                left: `${pos.x * scale}px`,
                                                top: `${pos.y * scale}px`,
                                                width: `${table.size?.width ? table.size.width * scale : 0.8 * scale}px`,
                                                height: `${table.size?.height ? table.size.height * scale : 0.8 * scale}px`,
                                                borderRadius: table.shape === 'circle' ? '50%' :
                                                    table.shape === 'oval' ? '50%' : '12px',
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                            onMouseDown={(e) => handleTableDragStart(e, table)}
                                        >
                                            <div className="text-sm font-bold pointer-events-none">
                                                {table.table_number}
                                            </div>
                                            <div className="text-[10px] font-medium opacity-80 pointer-events-none">
                                                {table.seats} Pax
                                            </div>

                                            {/* Status Indicator Dot */}
                                            <div className={`absolute top-1 right-1 w-2 h-2 rounded-full 
                                                ${table.status === 'available' ? 'bg-green-500' :
                                                    table.status === 'occupied' ? 'bg-red-500' :
                                                        table.status === 'reserved' ? 'bg-yellow-500' : 'bg-gray-400'
                                                }`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Overlay Instructions when not interacting */}
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-white shadow-lg text-xs font-semibold text-[#005429] pointer-events-none flex items-center gap-2">
                                💡 <span className="text-gray-600">Drag meja untuk pindah posisi • Scroll/Button untuk Zoom</span>
                            </div>
                        </div>

                        {/* Table List / Management Panel */}
                        <div className="p-6 bg-white/60 border-t border-white/50">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h4 className="text-lg font-bold text-[#005429]">Daftar Meja</h4>
                                    <p className="text-xs text-gray-500">Kelola detail meja di area ini</p>
                                </div>
                                <button
                                    onClick={handleAddTable}
                                    className="px-4 py-2 bg-[#005429] text-white text-sm font-semibold rounded-lg hover:bg-[#004220] hover:shadow-lg transition-all flex items-center gap-2"
                                >
                                    <FaPlus /> Tambah Meja
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {selectedArea.tables?.map(table => {
                                    const pos = tablePositions[table._id] || table.position;
                                    return (
                                        <div
                                            key={table._id}
                                            className="group bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#005429]/30 transition-all duration-300 relative overflow-hidden"
                                        >
                                            {/* Top Status Bar */}
                                            <div className={`absolute top-0 left-0 w-full h-1 
                                                ${table.status === 'available' ? 'bg-green-500' :
                                                    table.status === 'occupied' ? 'bg-red-500' :
                                                        table.status === 'reserved' ? 'bg-yellow-500' : 'bg-gray-400'
                                                }`}
                                            />

                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-lg font-bold text-[#005429]">{table.table_number}</h4>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide
                                                    ${table.status === 'available' ? 'bg-green-100 text-green-700' :
                                                        table.status === 'occupied' ? 'bg-red-100 text-red-700' :
                                                            table.status === 'reserved' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-gray-100 text-gray-700'}`}>
                                                    {formatStatus(table.status)}
                                                </span>
                                            </div>

                                            <div className="space-y-1 mb-4">
                                                <p className="text-xs text-gray-500 flex items-center justify-between">
                                                    <span>Kapasitas:</span>
                                                    <span className="font-semibold text-gray-700">{table.seats} Kursi</span>
                                                </p>
                                                <p className="text-xs text-gray-500 flex items-center justify-between">
                                                    <span>Tipe:</span>
                                                    <span className="font-semibold text-gray-700 capitalize">{table.table_type}</span>
                                                </p>
                                            </div>

                                            <div className="flex gap-1 pt-2 border-t border-dashed border-gray-200 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditTable(table)}
                                                    className="flex-1 py-1.5 text-xs font-semibold bg-gray-50 text-blue-600 rounded hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <FaEdit /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTable(table)}
                                                    className="flex-1 py-1.5 text-xs font-semibold bg-gray-50 text-red-600 rounded hover:bg-red-50 hover:text-red-700 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <FaTrash /> Hapus
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadTableQR(table)}
                                                    className="py-1.5 px-2 text-xs font-semibold bg-gray-50 text-green-600 rounded hover:bg-green-50 hover:text-green-700 transition-colors flex items-center justify-center"
                                                    title="Download QR"
                                                >
                                                    <FaQrcode />
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-[#005429]">
                                {editingTable ? 'Edit Informasi Meja' : 'Tambah Meja Baru'}
                            </h3>
                            <button
                                onClick={() => setShowTableForm(false)}
                                className="text-gray-400 hover:text-red-500 transition-colors rounded-full p-1 hover:bg-red-50"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitTable} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nomor Meja</label>
                                    <input
                                        type="text"
                                        value={tableForm.table_number}
                                        onChange={(e) => setTableForm({ ...tableForm, table_number: e.target.value })}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005429] focus:border-transparent outline-none transition-all"
                                        placeholder="Contoh: A1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Area</label>
                                    <select
                                        value={tableForm.area_id || selectedArea?._id}
                                        disabled
                                        className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                                    >
                                        {areas.map(area => (
                                            <option key={area._id} value={area._id}>
                                                {area.area_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Jumlah Kursi</label>
                                    <input
                                        type="number"
                                        value={tableForm.seats}
                                        onChange={(e) => setTableForm({ ...tableForm, seats: parseInt(e.target.value) })}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005429] focus:border-transparent outline-none transition-all"
                                        min="1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                                    <select
                                        value={tableForm.status}
                                        onChange={(e) => setTableForm({ ...tableForm, status: e.target.value })}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005429] focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="available">Tersedia</option>
                                        <option value="occupied">Terisi</option>
                                        <option value="reserved">Dipesan</option>
                                        <option value="maintenance">Perbaikan</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tipe Meja</label>
                                    <select
                                        value={tableForm.table_type}
                                        onChange={(e) => setTableForm({ ...tableForm, table_type: e.target.value })}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005429] focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="regular">Regular</option>
                                        <option value="vip">VIP</option>
                                        <option value="outdoor">Outdoor</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bentuk</label>
                                    <select
                                        value={tableForm.shape}
                                        onChange={(e) => setTableForm({ ...tableForm, shape: e.target.value })}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005429] focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="rectangle">Persegi Panjang</option>
                                        <option value="square">Persegi</option>
                                        <option value="circle">Lingkaran</option>
                                        <option value="oval">Oval</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">Dimensi & Posisi (Meter)</h4>
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="block text-[10px] text-gray-500 mb-1">Lebar</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={tableForm.size.width}
                                            onChange={(e) => setTableForm({
                                                ...tableForm,
                                                size: { ...tableForm.size, width: parseFloat(e.target.value) }
                                            })}
                                            className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#005429]"
                                            min="0.5"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 mb-1">Panjang</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={tableForm.size.height}
                                            onChange={(e) => setTableForm({
                                                ...tableForm,
                                                size: { ...tableForm.size, height: parseFloat(e.target.value) }
                                            })}
                                            className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#005429]"
                                            min="0.5"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] text-gray-500 mb-1">Posisi X</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={tableForm.position.x}
                                            onChange={(e) => setTableForm({
                                                ...tableForm,
                                                position: { ...tableForm.position, x: parseFloat(e.target.value) }
                                            })}
                                            className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#005429]"
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 mb-1">Posisi Y</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={tableForm.position.y}
                                            onChange={(e) => setTableForm({
                                                ...tableForm,
                                                position: { ...tableForm.position, y: parseFloat(e.target.value) }
                                            })}
                                            className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#005429]"
                                            min="0"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTableForm(false)}
                                    className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-3 bg-[#005429] text-white font-bold rounded-xl hover:bg-[#004220] shadow-lg hover:shadow-[#005429]/30 transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Menyimpan...' : editingTable ? 'Simpan Perubahan' : 'Tambah Meja'}
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