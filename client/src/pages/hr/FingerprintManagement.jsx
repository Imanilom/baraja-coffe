import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
    FaFingerprint, 
    FaSync, 
    FaCheckCircle, 
    FaTimesCircle,
    FaUserPlus,
    FaSearch,
    FaEdit,
    FaTrash
} from "react-icons/fa";

const FingerprintManagement = () => {
    const [fingerprints, setFingerprints] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFingerprint, setSelectedFingerprint] = useState(null);
    const [formData, setFormData] = useState({
        employeeId: "",
        fingerprintData: "",
        fingerprintIndex: 0,
        deviceId: "",
        deviceUserId: ""
    });

    // Fetch fingerprints dan employees
    const fetchFingerprints = async () => {
        setLoading(true);
        try {
            const [fingerprintsRes, employeesRes] = await Promise.all([
                axios.get('/api/hr/fingerprints/device-users'),
                axios.get('/api/hr/employees?limit=1000')
            ]);
            
            setFingerprints(fingerprintsRes.data.data);
            setEmployees(employeesRes.data.data);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFingerprints();
    }, []);

    // Filter fingerprints berdasarkan search term
    const filteredFingerprints = fingerprints.filter(fp => 
        fp.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fp.deviceUserId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fp.position?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSync = async () => {
        setSyncing(true);
        try {
            const deviceUsers = fingerprints.map(fp => fp.deviceUserId);
            await axios.post('/api/hr/fingerprints/bulk-sync', { deviceUsers });
            alert('Sync berhasil!');
            fetchFingerprints(); // Refresh data setelah sync
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
            setFormData({ 
                employeeId: "", 
                fingerprintData: "", 
                fingerprintIndex: 0, 
                deviceId: "", 
                deviceUserId: "" 
            });
            fetchFingerprints();
            alert('Fingerprint berhasil diregistrasi');
        } catch (err) {
            console.error("Error registering fingerprint:", err);
            alert(err.response?.data?.message || 'Gagal registrasi fingerprint');
        }
    };

    const handleEdit = (fingerprint) => {
        setSelectedFingerprint(fingerprint);
        setFormData({
            employeeId: fingerprint.employee?._id || "",
            fingerprintData: fingerprint.fingerprintData || "",
            fingerprintIndex: fingerprint.fingerprintIndex || 0,
            deviceId: fingerprint.deviceId || "",
            deviceUserId: fingerprint.deviceUserId || ""
        });
        setShowEditModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/hr/fingerprints/${selectedFingerprint._id}/device-user`, {
                deviceUserId: formData.deviceUserId
            });
            setShowEditModal(false);
            setSelectedFingerprint(null);
            setFormData({ 
                employeeId: "", 
                fingerprintData: "", 
                fingerprintIndex: 0, 
                deviceId: "", 
                deviceUserId: "" 
            });
            fetchFingerprints();
            alert('Device User ID berhasil diupdate');
        } catch (err) {
            console.error("Error updating fingerprint:", err);
            alert(err.response?.data?.message || 'Gagal update fingerprint');
        }
    };

    const handleDeactivate = async (fingerprintId) => {
        if (window.confirm("Apakah Anda yakin ingin menonaktifkan fingerprint ini?")) {
            try {
                await axios.patch(`/api/hr/fingerprints/${fingerprintId}/deactivate`);
                fetchFingerprints();
                alert('Fingerprint berhasil dinonaktifkan');
            } catch (err) {
                console.error("Error deactivating fingerprint:", err);
                alert('Gagal menonaktifkan fingerprint');
            }
        }
    };

    const handleDelete = async (fingerprintId) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus fingerprint ini? Tindakan ini tidak dapat dibatalkan.")) {
            try {
                await axios.delete(`/api/hr/fingerprints/${fingerprintId}`);
                fetchFingerprints();
                alert('Fingerprint berhasil dihapus');
            } catch (err) {
                console.error("Error deleting fingerprint:", err);
                alert('Gagal menghapus fingerprint');
            }
        }
    };

    const handleReactivate = async (fingerprintId) => {
        try {
            await axios.patch(`/api/hr/fingerprints/${fingerprintId}/deactivate`, {
                isActive: true
            });
            fetchFingerprints();
            alert('Fingerprint berhasil diaktifkan kembali');
        } catch (err) {
            console.error("Error reactivating fingerprint:", err);
            alert('Gagal mengaktifkan fingerprint');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#005429]"></div>
        </div>
    );

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

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari berdasarkan nama, employee ID, atau device user ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#005429] focus:border-transparent"
                    />
                </div>
            </div>

            {/* Fingerprint Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFingerprints.map(fp => (
                    <div key={fp._id || fp.deviceUserId} className="bg-white rounded-lg shadow border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-full ${
                                    fp.isActive ? 'bg-green-100' : 'bg-gray-100'
                                }`}>
                                    <FaFingerprint className={`h-6 w-6 ${
                                        fp.isActive ? 'text-green-600' : 'text-gray-400'
                                    }`} />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">
                                        {fp.employeeName || fp.employee?.user?.username || 'N/A'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {fp.position || fp.employee?.position}
                                    </div>
                                </div>
                            </div>
                            <div className={`p-1 rounded-full ${
                                fp.isActive ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                                {fp.isActive ? 
                                    <FaCheckCircle className="h-5 w-5 text-green-600" /> :
                                    <FaTimesCircle className="h-5 w-5 text-red-600" />
                                }
                            </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Device User ID:</span>
                                <span className="font-mono font-semibold text-xs">{fp.deviceUserId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Finger Index:</span>
                                <span className="font-semibold">Jari {fp.fingerprintIndex + 1}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Employee ID:</span>
                                <span className="font-semibold">{fp.employeeId || fp.employee?.employeeId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Departemen:</span>
                                <span className="font-semibold">{fp.employee?.department}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Device ID:</span>
                                <span className="font-semibold">{fp.deviceId || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Last Synced:</span>
                                <span className="font-semibold text-xs">
                                    {fp.lastSynced ? 
                                        new Date(fp.lastSynced).toLocaleString('id-ID') : 
                                        'Never'
                                    }
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 flex space-x-2">
                            <button
                                onClick={() => handleEdit(fp)}
                                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
                            >
                                <FaEdit className="inline mr-1" />
                                Edit
                            </button>
                            {fp.isActive ? (
                                <button
                                    onClick={() => handleDeactivate(fp._id)}
                                    className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700"
                                >
                                    <FaTimesCircle className="inline mr-1" />
                                    Nonaktifkan
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleReactivate(fp._id)}
                                        className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700"
                                    >
                                        <FaCheckCircle className="inline mr-1" />
                                        Aktifkan
                                    </button>
                                    <button
                                        onClick={() => handleDelete(fp._id)}
                                        className="flex-1 bg-red-800 text-white py-2 px-3 rounded text-sm hover:bg-red-900"
                                    >
                                        <FaTrash className="inline mr-1" />
                                        Hapus
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredFingerprints.length === 0 && !loading && (
                <div className="text-center py-12">
                    <FaFingerprint className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada fingerprint</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Mulai dengan meregistrasi fingerprint pertama'}
                    </p>
                </div>
            )}

            {/* Registration Modal */}
            {showRegisterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Registrasi Fingerprint Baru</h3>
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Karyawan</label>
                                    <select
                                        value={formData.employeeId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                                        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                        required
                                    >
                                        <option value="">Pilih Karyawan</option>
                                        {employees.filter(emp => emp.isActive).map(emp => (
                                            <option key={emp._id} value={emp._id}>
                                                {emp.employeeId} - {emp.user?.username} - {emp.position}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Device User ID</label>
                                    <input
                                        type="text"
                                        value={formData.deviceUserId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, deviceUserId: e.target.value }))}
                                        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                        placeholder="Contoh: 001, 002, ..."
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Fingerprint Data</label>
                                    <textarea
                                        value={formData.fingerprintData}
                                        onChange={(e) => setFormData(prev => ({ ...prev, fingerprintData: e.target.value }))}
                                        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                        placeholder="Data template fingerprint (hex string)"
                                        rows="3"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Device ID (Opsional)</label>
                                    <input
                                        type="text"
                                        value={formData.deviceId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, deviceId: e.target.value }))}
                                        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                        placeholder="ID device fingerprint"
                                    />
                                </div>
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowRegisterModal(false);
                                            setFormData({ 
                                                employeeId: "", 
                                                fingerprintData: "", 
                                                fingerprintIndex: 0, 
                                                deviceId: "", 
                                                deviceUserId: "" 
                                            });
                                        }}
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

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Edit Device User ID</h3>
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Karyawan</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {selectedFingerprint?.employeeName || selectedFingerprint?.employee?.user?.username}
                                    </p>
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
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setSelectedFingerprint(null);
                                            setFormData({ 
                                                employeeId: "", 
                                                fingerprintData: "", 
                                                fingerprintIndex: 0, 
                                                deviceId: "", 
                                                deviceUserId: "" 
                                            });
                                        }}
                                        className="px-4 py-2 text-sm border rounded text-gray-700 hover:bg-gray-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm bg-[#005429] text-white rounded hover:bg-[#004225]"
                                    >
                                        Update
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