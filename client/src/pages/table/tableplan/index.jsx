import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaChevronRight, FaBell, FaUser, FaSearch, FaIdBadge, FaBoxes, FaPencilAlt, FaTrash, FaExpand, FaCompress } from "react-icons/fa";
import DetailMejaModal from "./detailtablemodal";

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

    const containerRef = useRef(null);
    const navigate = useNavigate();

    // Fixed scale: 1 meter = 100 pixels
    const scale = 100 * zoomLevel;

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch outlets
                const outletsResponse = await axios.get('/api/outlet');
                setOutlets(outletsResponse.data.data || []);

                // Fetch areas with tables
                const areasResponse = await axios.get('/api/areas');
                const areasData = areasResponse.data.data || [];
                setAreas(areasData);

                if (areasData.length > 0) {
                    setSelectedArea(areasData[0]);
                    // Center the view on the first area
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

    // Handle table click
    const handleTableClick = (table) => {
        setSelectedTable(table);
        setShowDetail(true);
    };

    // Format status text
    const formatStatus = (status) => {
        switch (status) {
            case 'available': return 'Tersedia';
            case 'occupied': return 'Terisi';
            case 'reserved': return 'Dipesan';
            case 'maintenance': return 'Perbaikan';
            default: return status;
        }
    };

    // Handle zoom in
    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 0.1, 2)); // Max zoom 2x
    };

    // Handle zoom out
    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 0.1, 0.5)); // Min zoom 0.5x
    };

    // Handle pan start
    const handlePanStart = (e) => {
        e.preventDefault();
        setPanning(true);
        setPanStart({
            x: e.clientX - offset.x,
            y: e.clientY - offset.y
        });
    };

    // Handle pan move
    const handlePanMove = (e) => {
        if (!panning) return;
        
        const newOffset = {
            x: e.clientX - panStart.x,
            y: e.clientY - panStart.y
        };
        
        // Calculate bounds based on area size and container size
        if (selectedArea && containerRef.current) {
            const containerWidth = containerRef.current.clientWidth;
            const containerHeight = containerRef.current.clientHeight;
            const areaWidth = selectedArea.roomSize.width * scale;
            const areaHeight = selectedArea.roomSize.height * scale;
            
            // Limit panning to keep the area visible
            const maxX = Math.max(0, areaWidth - containerWidth);
            const maxY = Math.max(0, areaHeight - containerHeight);
            
            newOffset.x = Math.min(0, Math.max(-maxX, newOffset.x));
            newOffset.y = Math.min(0, Math.max(-maxY, newOffset.y));
        }
        
        setOffset(newOffset);
    };

    // Handle pan end
    const handlePanEnd = () => {
        setPanning(false);
    };

    // Reset view
    const handleResetView = () => {
        setZoomLevel(1);
        setOffset({ x: 0, y: 0 });
    };

    // Add event listeners for panning
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

    // Show loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

    // Show error state
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
                    <FaIdBadge size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Pengaturan Meja</p>
                    <FaChevronRight size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Denah Meja</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-[15px] pb-[15px] mb-[60px]">
                {/* Area Selection */}
                <div className="my-[13px] py-[10px] px-[15px] rounded bg-slate-50 shadow-slate-200 shadow-md">
                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <label className="text-[13px] mb-1 text-gray-500">Pilih Area</label>
                            <select
                                className="w-full text-[13px] border py-[6px] px-[12px] rounded"
                                value={selectedArea?._id || ''}
                                onChange={(e) => {
                                    const areaId = e.target.value;
                                    const area = areas.find(a => a._id === areaId);
                                    setSelectedArea(area);
                                    setOffset({ x: 0, y: 0 }); // Reset offset when changing area
                                }}
                            >
                                {areas.map(area => (
                                    <option key={area._id} value={area._id}>
                                        {area.area_name} ({area.area_code}) - {area.roomSize.width}x{area.roomSize.height}{area.roomSize.unit}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Area Visualization */}
                {selectedArea && (
                    <div className="mt-4 rounded shadow-slate-200 shadow-md p-4">
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
                                cursor: panning ? 'grabbing' : 'grab',
                                touchAction: 'none'
                            }}
                            onMouseDown={handlePanStart}
                        >
                            {/* Area container with panning and zoom */}
                            <div 
                                className="absolute inset-0"
                                style={{
                                    transform: `translate(${offset.x}px, ${offset.y}px)`,
                                    width: `${selectedArea.roomSize.width * scale}px`,
                                    height: `${selectedArea.roomSize.height * scale}px`
                                }}
                            >
                                {/* Grid background (minor grid - 10cm) */}
                                <div 
                                    className="absolute inset-0"
                                    style={{
                                        backgroundImage: 'linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)',
                                        backgroundSize: `${10 * zoomLevel}px ${10 * zoomLevel}px` // 10cm grid
                                    }}
                                >
                                    {/* Major grid lines (1m) */}
                                    <div 
                                        className="absolute inset-0"
                                        style={{
                                            backgroundImage: 'linear-gradient(to right, #ddd 1px, transparent 1px), linear-gradient(to bottom, #ddd 1px, transparent 1px)',
                                            backgroundSize: `${100 * zoomLevel}px ${100 * zoomLevel}px` // 1m grid
                                        }}
                                    />
                                </div>

                                {/* Area name label */}
                                <div className="absolute top-2 left-2 bg-white bg-opacity-70 px-2 py-1 rounded text-sm font-medium shadow-sm">
                                    {selectedArea.area_name}
                                </div>

                                {/* Tables */}
                                {selectedArea.tables?.map((table) => (
                                    <div
                                        key={table._id}
                                        className={`absolute flex flex-col items-center justify-center rounded cursor-pointer border-2 
                                            ${table.status === 'available' ? 'border-green-500 bg-green-100 hover:bg-green-200' : 
                                              table.status === 'occupied' ? 'border-red-500 bg-red-100 hover:bg-red-200' :
                                              table.status === 'reserved' ? 'border-yellow-500 bg-yellow-100 hover:bg-yellow-200' :
                                              'border-gray-500 bg-gray-100 hover:bg-gray-200'}`}
                                        style={{
                                            left: `${table.position.x * scale}px`,
                                            top: `${table.position.y * scale}px`,
                                            width: `${table.size?.width ? table.size.width * scale : 0.8 * scale}px`,
                                            height: `${table.size?.height ? table.size.height * scale : 0.8 * scale}px`,
                                            borderRadius: table.shape === 'circle' ? '50%' : 
                                                         table.shape === 'oval' ? '50%' : '4px',
                                            transform: 'translate(-50%, -50%)',
                                            transition: 'background-color 0.2s',
                                            zIndex: 10
                                        }}
                                        onClick={() => handleTableClick(table)}
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
                                ))}

                                {/* Scale indicator */}
                                <div className="absolute bottom-2 right-2 bg-white bg-opacity-70 px-2 py-1 rounded text-xs text-gray-500 shadow-sm">
                                    Skala: 1m = {Math.round(100 * zoomLevel)}px ({zoomLevel.toFixed(1)}x)
                                </div>
                            </div>
                        </div>

                        {/* Table Info */}
                        <div className="mt-4">
                            <h4 className="font-semibold mb-2">Daftar Meja</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {selectedArea.tables?.map(table => (
                                    <div 
                                        key={table._id} 
                                        className={`p-3 rounded border cursor-pointer hover:shadow-md transition-shadow
                                            ${table.status === 'available' ? 'border-green-300 bg-green-50 hover:bg-green-100' : 
                                              table.status === 'occupied' ? 'border-red-300 bg-red-50 hover:bg-red-100' :
                                              table.status === 'reserved' ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100' :
                                              'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                                        onClick={() => handleTableClick(table)}
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
                                            <span>Posisi: ({table.position.x.toFixed(1)}, {table.position.y.toFixed(1)})</span>
                                            <span>Ukuran: {table.size?.width?.toFixed(1) || '0.8'}x{table.size?.height?.toFixed(1) || '0.8'}m</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Button */}
                <button
                    onClick={() => selectedArea && navigate(`/admin/table-management/table-update/${selectedArea._id}`)}
                    className="fixed right-5 bottom-20 bg-[#005429] text-white px-4 py-2 rounded text-sm hover:bg-[#006d34] flex items-center gap-2 shadow-lg"
                >
                    <FaPencilAlt /> Edit Area
                </button>

                 <button
                    onClick={() => navigate(`/admin/table-plan/create`)}
                    className="fixed right-5 bottom-20 bg-[#005429] text-white px-4 py-2 rounded text-sm hover:bg-[#006d34] flex items-center gap-2 shadow-lg"
                >
                    <FaPencilAlt /> Add Table
                </button>
            </div>

            {/* Table Detail Modal */}
            {selectedTable && (
                <DetailMejaModal
                    isOpen={showDetail}
                    onClose={() => setShowDetail(false)}
                    data={{
                        tableName: selectedTable.table_number,
                        areaName: selectedArea?.area_name || '',
                        areaStatus: selectedArea?.is_active ? 'Aktif' : 'Nonaktif',
                        seats: selectedTable.seats,
                        tableType: selectedTable.table_type,
                        shape: selectedTable.shape,
                        position: `(${selectedTable.position.x.toFixed(1)}, ${selectedTable.position.y.toFixed(1)})`,
                        size: `${selectedTable.size?.width?.toFixed(1) || '0.8'} x ${selectedTable.size?.height?.toFixed(1) || '0.8'} m`,
                        status: formatStatus(selectedTable.status),
                        isAvailable: selectedTable.is_available ? 'Ya' : 'Tidak'
                    }}
                />
            )}

            
           
        </div>
    );
};

export default TablePlanManagement;