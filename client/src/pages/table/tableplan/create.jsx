import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaChevronRight, FaBell, FaUser, FaBoxes, FaSave, FaTimes, FaArrowsAlt, FaExpandArrowsAlt } from 'react-icons/fa';

const TableForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [areas, setAreas] = useState([]);
    const [form, setForm] = useState({
        table_number: '',
        area_id: '',
        seats: 4,
        table_type: 'regular',
        shape: 'rectangle',
        size: { width: 0.8, height: 0.8 },
        position: { x: 0, y: 0 },
        status: 'available',
        is_available: true,
        is_active: true
    });
    const [errors, setErrors] = useState({});
    const [areaSize, setAreaSize] = useState({ width: 10, height: 10, unit: 'm' });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
    const [selectedArea, setSelectedArea] = useState(null);
    const [existingTables, setExistingTables] = useState([]);
    const [canvasScale, setCanvasScale] = useState(1); // State untuk zoom

    const areaRef = useRef(null);
    const tableRef = useRef(null);
    const resizeHandleRef = useRef(null);
    const canvasContainerRef = useRef(null);

    const baseScale = 100; // Skala dasar 1m = 100px

    useEffect(() => {
        const fetchData = async () => {
            try {
                const areasResponse = await axios.get('/api/areas');
                const areasData = areasResponse.data.data || [];
                setAreas(areasData);

                if (id) {
                    const tableResponse = await axios.get(`/api/areas/tables/${id}`);
                    const tableData = tableResponse.data.data;

                    setForm({
                        table_number: tableData.table_number,
                        area_id: tableData.area_id._id,
                        seats: tableData.seats,
                        table_type: tableData.table_type,
                        shape: tableData.shape,
                        size: tableData.size || { width: 0.8, height: 0.8 },
                        position: tableData.position,
                        status: tableData.status,
                        is_available: tableData.is_available,
                        is_active: tableData.is_active
                    });

                    const area = areasData.find(a => a._id === tableData.area_id._id);
                    if (area) {
                        setAreaSize({
                            width: area.roomSize.width,
                            height: area.roomSize.height,
                            unit: area.roomSize.unit || 'm'
                        });
                        setSelectedArea(area);
                        // Filter out current table
                        const otherTables = (area.tables || []).filter(t => t._id !== id);
                        setExistingTables(otherTables);
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Handle zoom dengan mouse wheel
    useEffect(() => {
        const handleWheel = (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setCanvasScale(prev => Math.max(0.3, Math.min(2, prev + delta)));
            }
        };

        const canvasContainer = canvasContainerRef.current;
        if (canvasContainer) {
            canvasContainer.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            if (canvasContainer) {
                canvasContainer.removeEventListener('wheel', handleWheel);
            }
        };
    }, []);

    const handleChange = async (e) => {
        const { name, value } = e.target;

        if (name === 'area_id') {
            const area = areas.find(a => a._id === value);
            if (area) {
                setAreaSize({
                    width: area.roomSize.width,
                    height: area.roomSize.height,
                    unit: area.roomSize.unit || 'm'
                });
                setSelectedArea(area);
                
                // Reset position to center of area
                setForm(prev => ({
                    ...prev,
                    area_id: value,
                    position: { 
                        x: area.roomSize.width / 2, 
                        y: area.roomSize.height / 2 
                    }
                }));

                // Reset zoom ketika ganti area
                setCanvasScale(1);

                // Load tables from the area data (same as TablePlanManagement)
                const tablesInArea = area.tables || [];
                
                // Jika mode edit, filter out current table
                const filteredTables = id 
                    ? tablesInArea.filter(t => t._id !== id)
                    : [...tablesInArea]; // shallow copy untuk create
                
                setExistingTables(filteredTables);
            } else {
                setSelectedArea(null);
                setExistingTables([]);
            }
            return;
        }

        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSizeChange = (e) => {
        const { name, value } = e.target;
        const numValue = parseFloat(value) || 0;
        setForm(prev => ({
            ...prev,
            size: {
                ...prev.size,
                [name]: numValue
            }
        }));
    };

    const handlePositionChange = (e) => {
        const { name, value } = e.target;
        const numValue = parseFloat(value) || 0;
        setForm(prev => ({
            ...prev,
            position: {
                ...prev.position,
                [name]: numValue
            }
        }));
    };

    const handleDragStart = (e) => {
        e.preventDefault();
        setIsDragging(true);
        const tableRect = tableRef.current.getBoundingClientRect();
        const offsetX = e.clientX - tableRect.left - tableRect.width / 2;
        const offsetY = e.clientY - tableRect.top - tableRect.height / 2;
        setResizeStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
    };

    const handleDrag = (e) => {
        if (!isDragging || !areaRef.current) return;
        const areaRect = areaRef.current.getBoundingClientRect();
        const x = (e.clientX - areaRect.left) / (baseScale * canvasScale);
        const y = (e.clientY - areaRect.top) / (baseScale * canvasScale);

        const halfWidth = form.size.width / 2;
        const halfHeight = form.size.height / 2;
        const boundedX = Math.max(halfWidth, Math.min(x, areaSize.width - halfWidth));
        const boundedY = Math.max(halfHeight, Math.min(y, areaSize.height - halfHeight));

        setForm(prev => ({
            ...prev,
            position: { x: boundedX, y: boundedY }
        }));
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const handleResizeStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setResizeStart({ x: e.clientX, y: e.clientY });
    };

    const handleResize = (e) => {
        if (!isResizing || !areaRef.current) return;
        const deltaX = (e.clientX - resizeStart.x) / (baseScale * canvasScale);
        const deltaY = (e.clientY - resizeStart.y) / (baseScale * canvasScale);

        let newWidth = form.size.width + deltaX;
        let newHeight = form.size.height + deltaY;
        newWidth = Math.max(0.5, Math.min(5, newWidth));
        newHeight = Math.max(0.5, Math.min(5, newHeight));

        const boundedX = Math.max(newWidth / 2, Math.min(form.position.x, areaSize.width - newWidth / 2));
        const boundedY = Math.max(newHeight / 2, Math.min(form.position.y, areaSize.height - newHeight / 2));

        setForm(prev => ({
            ...prev,
            size: { width: newWidth, height: newHeight },
            position: { x: boundedX, y: boundedY }
        }));
        setResizeStart({ x: e.clientX, y: e.clientY });
    };

    const handleResizeEnd = () => {
        setIsResizing(false);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging) handleDrag(e);
            if (isResizing) handleResize(e);
        };
        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('mouseleave', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mouseleave', handleMouseUp);
        };
    }, [isDragging, isResizing]);
    
    // Format status text (sama seperti di TablePlanManagement)
    const formatStatus = (status) => {
        switch (status) {
            case 'available': return 'Tersedia';
            case 'occupied': return 'Terisi';
            case 'reserved': return 'Dipesan';
            case 'maintenance': return 'Perbaikan';
            default: return status;
        }
    };

    // Render existing tables dengan style yang sama seperti TablePlanManagement
    const renderExistingTable = (table) => {
        const width = table.size?.width ?? 0.8;
        const height = table.size?.height ?? 0.8;
        
        return (
            <div
                key={table._id}
                className={`absolute flex flex-col items-center justify-center rounded cursor-pointer border-2 
                    ${table.status === 'available' ? 'border-green-500 bg-green-100 hover:bg-green-200' :
                      table.status === 'occupied' ? 'border-red-500 bg-red-100 hover:bg-red-200' :
                      table.status === 'reserved' ? 'border-yellow-500 bg-yellow-100 hover:bg-yellow-200' :
                      'border-gray-500 bg-gray-100 hover:bg-gray-200'}`}
                style={{
                    left: `${table.position.x * baseScale * canvasScale}px`,
                    top: `${table.position.y * baseScale * canvasScale}px`,
                    width: `${width * baseScale * canvasScale}px`,
                    height: `${height * baseScale * canvasScale}px`,
                    borderRadius: table.shape === 'circle' || table.shape === 'oval' ? '50%' : '4px',
                    transform: 'translate(-50%, -50%)',
                    transition: 'background-color 0.2s',
                    userSelect: 'none',
                    pointerEvents: 'none' // Non-editable
                }}
            >
                <div className="text-sm font-semibold text-center pointer-events-none">
                    {table.table_number}
                </div>
                <div className="text-xs text-gray-600 pointer-events-none">
                    {table.seats} kursi
                </div>
                <div className={`text-xs font-medium mt-1 pointer-events-none
                    ${table.status === 'available' ? 'text-green-600' :
                      table.status === 'occupied' ? 'text-red-600' :
                      table.status === 'reserved' ? 'text-yellow-600' :
                      'text-gray-600'}`}>
                    {formatStatus(table.status)}
                </div>
            </div>
        );
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.table_number) newErrors.table_number = 'Nomor meja wajib diisi';
        if (!form.area_id) newErrors.area_id = 'Area wajib dipilih';

        const minX = form.size.width / 2;
        const maxX = areaSize.width - form.size.width / 2;
        const minY = form.size.height / 2;
        const maxY = areaSize.height - form.size.height / 2;

        if (form.position.x < minX || form.position.x > maxX) {
            newErrors.position = `Posisi X harus antara ${minX.toFixed(1)} dan ${maxX.toFixed(1)}`;
        }
        if (form.position.y < minY || form.position.y > maxY) {
            newErrors.position = `Posisi Y harus antara ${minY.toFixed(1)} dan ${maxY.toFixed(1)}`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            if (id) {
                await axios.put(`/api/areas/tables/${id}`, form);
            } else {
                await axios.post('/api/areas/tables', form);
            }
            navigate('/admin/table-management');
        } catch (error) {
            console.error('Error saving table:', error);
            if (error.response?.data?.message) {
                setErrors({ ...errors, server: error.response.data.message });
            } else {
                setErrors({ ...errors, server: 'Terjadi kesalahan saat menyimpan data' });
            }
        }
    };

    // Fungsi untuk reset zoom
    const resetZoom = () => {
        setCanvasScale(1);
    };

    // Fungsi untuk zoom in/out
    const zoomIn = () => {
        setCanvasScale(prev => Math.min(2, prev + 0.1));
    };

    const zoomOut = () => {
        setCanvasScale(prev => Math.max(0.3, prev - 0.1));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Header */}
            <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
                <FaBell size={23} className="text-gray-400" />
                <span className="text-[14px]">Hi Baraja</span>
                <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
                    <FaUser size={30} />
                </Link>
            </div>

            {/* Breadcrumb */}
            <div className="px-3 py-2 flex justify-between items-center border-b">
                <div className="flex items-center space-x-2">
                    <FaBoxes size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Pengaturan Meja</p>
                    <FaChevronRight size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">
                        {id ? 'Edit Meja' : 'Tambah Meja'}
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="px-4 py-4">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                    {errors.server && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                            {errors.server}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column - Form Fields */}
                        <div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Nomor Meja <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="table_number"
                                    value={form.table_number}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded ${errors.table_number ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="A01"
                                />
                                {errors.table_number && (
                                    <p className="text-red-500 text-xs mt-1">{errors.table_number}</p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Area <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="area_id"
                                    value={form.area_id}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded ${errors.area_id ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="">Pilih Area</option>
                                    {areas.map(area => (
                                        <option key={area._id} value={area._id}>
                                            {area.area_name} ({area.area_code}) - {area.roomSize.width}x{area.roomSize.height}{area.roomSize.unit}
                                        </option>
                                    ))}
                                </select>
                                {errors.area_id && (
                                    <p className="text-red-500 text-xs mt-1">{errors.area_id}</p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Jumlah Kursi
                                </label>
                                <input
                                    type="number"
                                    name="seats"
                                    min="1"
                                    value={form.seats}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Tipe Meja
                                </label>
                                <select
                                    name="table_type"
                                    value={form.table_type}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                >
                                    <option value="regular">Regular</option>
                                    <option value="vip">VIP</option>
                                    <option value="family">Family</option>
                                    <option value="couple">Couple</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Bentuk Meja
                                </label>
                                <select
                                    name="shape"
                                    value={form.shape}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                >
                                    <option value="rectangle">Persegi Panjang</option>
                                    <option value="square">Persegi</option>
                                    <option value="circle">Lingkaran</option>
                                    <option value="oval">Oval</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>

                            <div className="mb-4 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-2">
                                        Lebar (m)
                                    </label>
                                    <input
                                        type="number"
                                        name="width"
                                        min="0.5"
                                        max="5"
                                        step="0.1"
                                        value={form.size.width}
                                        onChange={handleSizeChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-2">
                                        Panjang (m)
                                    </label>
                                    <input
                                        type="number"
                                        name="height"
                                        min="0.5"
                                        max="5"
                                        step="0.1"
                                        value={form.size.height}
                                        onChange={handleSizeChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Position Editor */}
                        <div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Posisi Meja
                                </label>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-gray-700 text-xs mb-1">
                                            X (0-{areaSize.width})
                                        </label>
                                        <input
                                            type="number"
                                            name="x"
                                            min="0"
                                            max={areaSize.width}
                                            step="0.1"
                                            value={form.position.x.toFixed(1)}
                                            onChange={handlePositionChange}
                                            className={`w-full px-3 py-2 border ${errors.position ? 'border-red-500' : 'border-gray-300'} rounded`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-xs mb-1">
                                            Y (0-{areaSize.height})
                                        </label>
                                        <input
                                            type="number"
                                            name="y"
                                            min="0"
                                            max={areaSize.height}
                                            step="0.1"
                                            value={form.position.y.toFixed(1)}
                                            onChange={handlePositionChange}
                                            className={`w-full px-3 py-2 border ${errors.position ? 'border-red-500' : 'border-gray-300'} rounded`}
                                        />
                                    </div>
                                </div>
                                {errors.position && (
                                    <p className="text-red-500 text-xs mt-1 mb-2">{errors.position}</p>
                                )}

                                <div className="relative">
                                    {selectedArea ? (
                                        <div className="mb-2 flex justify-between items-center">
                                            <div className="text-sm text-gray-600">
                                                Zoom: {Math.round(canvasScale * 100)}%
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={zoomOut}
                                                    className="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                                                >
                                                    -
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={resetZoom}
                                                    className="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                                                >
                                                    100%
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={zoomIn}
                                                    className="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    ) : null}

                                    {selectedArea ? (
                                        <div
                                            ref={canvasContainerRef}
                                            className="relative border-2 border-gray-300 bg-gray-50 rounded-md overflow-auto"
                                            style={{
                                                maxHeight: '500px',
                                                maxWidth: '100%',
                                            }}
                                        >
                                            <div
                                                ref={areaRef}
                                                className="relative"
                                                style={{
                                                    height: `${areaSize.height * baseScale * canvasScale}px`,
                                                    width: `${areaSize.width * baseScale * canvasScale}px`,
                                                    minHeight: '200px',
                                                    minWidth: '100%',
                                                    backgroundImage: 'linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)',
                                                    backgroundSize: `${100 * canvasScale}px ${100 * canvasScale}px`
                                                }}
                                            >
                                                {/* Grid background */}
                                                <div
                                                    className="absolute inset-0"
                                                    style={{
                                                        backgroundImage: 'linear-gradient(to right, #ddd 1px, transparent 1px), linear-gradient(to bottom, #ddd 1px, transparent 1px)',
                                                        backgroundSize: `${100 * canvasScale}px ${100 * canvasScale}px`
                                                    }}
                                                />

                                                <div className="absolute top-2 left-2 bg-white bg-opacity-70 px-2 py-1 rounded text-sm font-medium">
                                                    {selectedArea.area_name}
                                                </div>

                                                <div className="absolute top-2 right-2 bg-white bg-opacity-70 px-2 py-1 rounded text-sm">
                                                    {areaSize.width}m × {areaSize.height}m
                                                </div>

                                                {/* Informasi jumlah meja yang sudah ada */}
                                                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-70 px-2 py-1 rounded text-sm">
                                                    Meja tersedia: {existingTables.length}
                                                </div>

                                                {/* Existing tables (non-editable) - menggunakan style yang sama */}
                                                {existingTables.map(renderExistingTable)}

                                                {/* Current table (editable) */}
                                                <div
                                                    ref={tableRef}
                                                    className={`absolute flex flex-col items-center justify-center rounded cursor-move border-2 
                                                        ${form.status === 'available' ? 'border-green-500 bg-green-100' : 
                                                        form.status === 'occupied' ? 'border-red-500 bg-red-100' :
                                                        form.status === 'reserved' ? 'border-yellow-500 bg-yellow-100' :
                                                        'border-gray-500 bg-gray-100'}`}
                                                    style={{
                                                        left: `${form.position.x * baseScale * canvasScale}px`,
                                                        top: `${form.position.y * baseScale * canvasScale}px`,
                                                        width: `${form.size.width * baseScale * canvasScale}px`,
                                                        height: `${form.size.height * baseScale * canvasScale}px`,
                                                        borderRadius: form.shape === 'circle' || form.shape === 'oval' ? '50%' : '4px',
                                                        transform: 'translate(-50%, -50%)',
                                                        userSelect: 'none',
                                                        zIndex: 20 // Lebih tinggi agar di atas existing tables
                                                    }}
                                                    onMouseDown={handleDragStart}
                                                >
                                                    <div className="text-sm font-semibold text-center pointer-events-none">
                                                        {form.table_number || 'Meja Baru'}
                                                    </div>
                                                    <div className="text-xs text-gray-600 pointer-events-none">
                                                        {form.seats} kursi
                                                    </div>
                                                    <div className={`text-xs font-medium mt-1 pointer-events-none
                                                        ${form.status === 'available' ? 'text-green-600' :
                                                          form.status === 'occupied' ? 'text-red-600' :
                                                          form.status === 'reserved' ? 'text-yellow-600' :
                                                          'text-gray-600'}`}>
                                                        {formatStatus(form.status)}
                                                    </div>

                                                    <div
                                                        ref={resizeHandleRef}
                                                        className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-tl cursor-nwse-resize opacity-80 hover:opacity-100"
                                                        onMouseDown={handleResizeStart}
                                                    >
                                                        <FaExpandArrowsAlt className="text-white text-xs absolute -bottom-0.5 -right-0.5" />
                                                    </div>
                                                </div>

                                                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                                                    Skala: 1m = {Math.round(baseScale * canvasScale)}px
                                                    {canvasScale !== 1 && ` (${Math.round(canvasScale * 100)}%)`}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-gray-300 bg-gray-100 rounded-md p-8 text-center">
                                            <p className="text-gray-500">Silakan pilih area terlebih dahulu untuk menampilkan denah</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                >
                                    <option value="available">Tersedia</option>
                                    <option value="occupied">Terisi</option>
                                    <option value="reserved">Dipesan</option>
                                    <option value="maintenance">Perbaikan</option>
                                </select>
                            </div>

                            <div className="mb-4 flex items-center">
                                <input
                                    type="checkbox"
                                    name="is_available"
                                    id="is_available"
                                    checked={form.is_available}
                                    onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                                    className="mr-2"
                                />
                                <label htmlFor="is_available" className="text-gray-700 text-sm font-medium">
                                    Tersedia untuk pemesanan
                                </label>
                            </div>

                            <div className="mb-4 flex items-center">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    id="is_active"
                                    checked={form.is_active}
                                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                    className="mr-2"
                                />
                                <label htmlFor="is_active" className="text-gray-700 text-sm font-medium">
                                    Aktif
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end space-x-4">
                        <Link
                            to="/admin/table-plan"
                            className="flex items-center px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                        >
                            <FaTimes className="mr-2" /> Batal
                        </Link>
                        <button
                            type="submit"
                            className="flex items-center px-4 py-2 bg-[#005429] text-white rounded hover:bg-[#004020]"
                        >
                            <FaSave className="mr-2" /> Simpan
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]"></div>
            </div>
        </div>
    );
};

export default TableForm;