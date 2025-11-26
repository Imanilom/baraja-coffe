import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
    FaSync, 
    FaTrash, 
    FaInfoCircle, 
    FaExclamationTriangle,
    FaCheckCircle,
    FaRadiation,
    FaServer
} from "react-icons/fa";

const DeviceBufferManagement = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const fetchBufferStatus = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/adms/device/buffer-status');
            setDevices(response.data.devices);
        } catch (err) {
            console.error("Error fetching buffer status:", err);
            setMessage("Gagal memuat status device.");
        } finally {
            setLoading(false);
        }
    };

    const handleForceClear = async (deviceIp = null) => {
        if (!window.confirm(
            deviceIp ? 
            `Force clear buffer untuk device ${deviceIp}?` :
            "Force clear buffer untuk semua device?"
        )) {
            return;
        }

        setLoading(true);
        setMessage("");
        
        try {
            const response = await axios.post('/api/adms/device/force-clear-buffer', {
                deviceIp: deviceIp
            });
            
            setMessage(response.data.message);
            fetchBufferStatus(); // Refresh status
        } catch (err) {
            console.error("Error force clearing buffer:", err);
            setMessage("Gagal membersihkan buffer device.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBufferStatus();
        
        // Auto refresh every 30 seconds
        const interval = setInterval(fetchBufferStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-xl text-green-900 font-semibold">
                    <FaServer />
                    <span>Device Buffer Management</span>
                </div>
                <button
                    onClick={fetchBufferStatus}
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                >
                    <FaSync className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="text-2xl font-bold text-gray-900">{devices.length}</div>
                    <div className="text-sm text-gray-600">Total Devices</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="text-2xl font-bold text-yellow-600">
                        {devices.filter(d => d.isStuckInLoop).length}
                    </div>
                    <div className="text-sm text-gray-600">Stuck in Loop</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="text-2xl font-bold text-blue-600">
                        {devices.reduce((sum, d) => sum + d.requestCount, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Requests</div>
                </div>
            </div>

            {/* Device List */}
            <div className="space-y-4">
                {devices.map(device => (
                    <div key={device.deviceIp} className={`bg-white rounded-lg shadow border p-4 ${
                        device.isStuckInLoop ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-3">
                                <FaServer className={`h-6 w-6 ${
                                    device.isStuckInLoop ? 'text-red-500' : 'text-green-500'
                                }`} />
                                <div>
                                    <div className="font-semibold text-gray-900">
                                        {device.deviceIp}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Requests: {device.requestCount} | Historical: {device.historicalCount}
                                    </div>
                                </div>
                            </div>
                            {device.isStuckInLoop && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <FaRadiation className="mr-1" />
                                    STUCK
                                </span>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                                <span className="text-gray-500">First Seen:</span>
                                <div className="font-medium">{new Date(device.firstSeen).toLocaleTimeString()}</div>
                            </div>
                            <div>
                                <span className="text-gray-500">Last Request:</span>
                                <div className="font-medium">{new Date(device.lastRequest).toLocaleTimeString()}</div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                {device.recommendation}
                            </div>
                            <button
                                onClick={() => handleForceClear(device.deviceIp)}
                                disabled={loading}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                            >
                                <FaTrash className="inline mr-1" />
                                Force Clear
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {devices.length === 0 && !loading && (
                <div className="text-center py-12">
                    <FaServer className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada device aktif</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Device akan muncul ketika mengirim data ke sistem
                    </p>
                </div>
            )}

            {/* Global Actions */}
            {devices.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Global Actions</h3>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => handleForceClear()}
                            disabled={loading}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                        >
                            <FaTrash className="inline mr-2" />
                            Force Clear All Devices
                        </button>
                        <button
                            onClick={fetchBufferStatus}
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            <FaSync className="inline mr-2" />
                            Refresh Status
                        </button>
                    </div>
                </div>
            )}

            {/* Message */}
            {message && (
                <div className={`mt-4 p-4 rounded-lg ${
                    message.includes('berhasil') ? 
                    'bg-green-50 border border-green-200 text-green-800' : 
                    'bg-red-50 border border-red-200 text-red-800'
                }`}>
                    <div className="flex items-center">
                        {message.includes('berhasil') ? (
                            <FaCheckCircle className="h-5 w-5 mr-2" />
                        ) : (
                            <FaExclamationTriangle className="h-5 w-5 mr-2" />
                        )}
                        <span>{message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeviceBufferManagement;  