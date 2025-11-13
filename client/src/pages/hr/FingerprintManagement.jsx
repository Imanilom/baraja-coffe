import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
    FaFingerprint, 
    FaSync, 
    FaCheckCircle, 
    FaTimesCircle,
    FaUserPlus,
    FaQrcode
} from "react-icons/fa";

const FingerprintManagement = () => {
    const [fingerprints, setFingerprints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [formData, setFormData] = useState({
        employeeId: "",
        fingerprintIndex: 0,
        deviceUserId: ""
    });

    const fetchFingerprints = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/hr/fingerprints/device-users');
            setFingerprints(response.data.data);
        } catch (err) {
            console.error("Error fetching fingerprints:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFingerprints();
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const deviceUsers = fingerprints.map(fp => fp.deviceUserId);
            await axios.post('/api/hr/fingerprints/bulk-sync', { deviceUsers });
            alert('Sync berhasil!');
        } catch (err) {
            console.error("Error syncing:", err);
            alert('Gagal sync dengan device');
        } finally {
            setSyncing(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/hr/fingerprints/register', formData);
            setShowRegisterModal(false);
            setFormData({ employeeId: "", fingerprintIndex: 0, deviceUserId: "" });
            fetchFingerprints();
            alert('Fingerprint berhasil diregistrasi');
        } catch (err) {
            console.error("Error registering fingerprint:", err);
            alert('Gagal registrasi fingerprint');
        }
    };

    const handleDeactivate = async (fingerprintId) => {
        if (window.confirm("Apakah Anda yakin ingin menonaktifkan fingerprint ini?")) {
            try {
                await axios.patch(`/api/hr/fingerprints/${fingerprintId}/deactivate`);
                fetchFingerprints();
            } catch (err) {
                console.error("Error deactivating fingerprint:", err);
            }
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#005429]"></div></div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-xl text-green-900 font-semibold">
                    <FaFingerprint />
                    <span>Manajemen Fingerprint</span>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                    >
                        <FaSync className={syncing ? "animate-spin" : ""} />
                        {syncing ? 'Syncing...' : 'Sync Device'}
                    </button>
                    <button
                        onClick={() => setShowRegisterModal(true)}
                        className="flex items-center gap-2 bg-[#005429] text-white px-4 py-2 rounded text-sm"
                    >
                        <FaUserPlus />
                        Registrasi Fingerprint
                    </button>
                </div>
            </div>

            {/* Fingerprint Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fingerprints.map(fp => (
                    <div key={fp.deviceUserId} className="bg-white rounded-lg shadow border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-green-100 rounded-full">
                                    <FaFingerprint className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">
                                        {fp.employeeName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {fp.position}
                                    </div>
                                </div>
                            </div>
                            <div className={`p-1 rounded-full ${fp.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                                {fp.isActive ? 
                                    <FaCheckCircle className="h-5 w-5 text-green-600" /> :
                                    <FaTimesCircle className="h-5 w-5 text-red-600" />
                                }
                            </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Device User ID:</span>
                                <span className="font-mono font-semibold">{fp.deviceUserId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Finger Index:</span>
                                <span className="font-semibold">{fp.fingerprintIndex}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Employee ID:</span>
                                <span className="font-semibold">{fp.employeeId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Last Synced:</span>
                                <span className="font-semibold">
                                    {fp.lastSynced ? new Date(fp.lastSynced).toLocaleDateString('id-ID') : 'Never'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 flex space-x-2">
                            <button
                                onClick={() => handleDeactivate(fp._id)}
                                className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700"
                            >
                                Nonaktifkan
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Registration Modal */}
            {showRegisterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Registrasi Fingerprint Baru</h3>
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                                    <input
                                        type="text"
                                        value={formData.employeeId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                                        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Device User ID</label>
                                    <input
                                        type="text"
                                        value={formData.deviceUserId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, deviceUserId: e.target.value }))}
                                        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Finger Index</label>
                                    <select
                                        value={formData.fingerprintIndex}
                                        onChange={(e) => setFormData(prev => ({ ...prev, fingerprintIndex: parseInt(e.target.value) }))}
                                        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                        required
                                    >
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(index => (
                                            <option key={index} value={index}>Jari {index + 1}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowRegisterModal(false)}
                                        className="px-4 py-2 text-sm border rounded text-gray-700 hover:bg-gray-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm bg-[#005429] text-white rounded hover:bg-[#004225]"
                                    >
                                        Registrasi
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FingerprintManagement;