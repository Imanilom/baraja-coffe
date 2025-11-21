import React, { useState } from "react";
import axios from "axios";
import { 
    FaSync, 
    FaTrash, 
    FaInfoCircle, 
    FaExclamationTriangle,
    FaCheckCircle
} from "react-icons/fa";

const DeviceManagement = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleClearBuffer = async () => {
        if (!window.confirm("Apakah Anda yakin ingin membersihkan buffer device? Tindakan ini akan menghapus data historis yang belum terkirim.")) {
            return;
        }

        setLoading(true);
        setMessage("");
        
        try {
            const response = await axios.post('/api/attendance/device/clear-buffer', {
                deviceId: 'X105'
            });
            
            setMessage("Buffer berhasil dibersihkan. Device akan berhenti mengirim data historis.");
        } catch (err) {
            console.error("Error clearing buffer:", err);
            setMessage("Gagal membersihkan buffer device.");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckStatus = async () => {
        setLoading(true);
        setMessage("");
        
        try {
            const response = await axios.get('/api/attendance/device/status?deviceId=X105');
            const data = response.data;
            
            setMessage(`Status Device: ${data.status}. ${data.recommendation}`);
        } catch (err) {
            console.error("Error checking status:", err);
            setMessage("Gagal memeriksa status device.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-xl text-green-900 font-semibold">
                    <FaInfoCircle />
                    <span>Manajemen Device Fingerprint</span>
                </div>
            </div>

            {/* Alert */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                    <FaExclamationTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                    <div>
                        <h3 className="text-sm font-medium text-yellow-800">
                            Device Mengirim Data Historis Berulang
                        </h3>
                        <p className="text-sm text-yellow-700 mt-1">
                            Device terus mengirim data dari tahun 2022. Disarankan untuk membersihkan buffer device.
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow border">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Status Device</h3>
                        <FaInfoCircle className="h-6 w-6 text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                        Periksa status koneksi dan buffer device fingerprint.
                    </p>
                    <button
                        onClick={handleCheckStatus}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        <FaSync className="inline mr-2" />
                        {loading ? 'Memeriksa...' : 'Periksa Status'}
                    </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Bersihkan Buffer</h3>
                        <FaTrash className="h-6 w-6 text-red-500" />
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                        Hapus data historis dari buffer device untuk menghentikan pengiriman berulang.
                    </p>
                    <button
                        onClick={handleClearBuffer}
                        disabled={loading}
                        className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
                    >
                        <FaTrash className="inline mr-2" />
                        {loading ? 'Membersihkan...' : 'Bersihkan Buffer'}
                    </button>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg ${
                    message.includes('berhasil') || message.includes('Status') 
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                    <div className="flex items-center">
                        {message.includes('berhasil') || message.includes('Status') ? (
                            <FaCheckCircle className="h-5 w-5 mr-2" />
                        ) : (
                            <FaExclamationTriangle className="h-5 w-5 mr-2" />
                        )}
                        <span>{message}</span>
                    </div>
                </div>
            )}

            {/* Recommendations */}
            <div className="bg-white p-6 rounded-lg shadow border mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rekomendasi</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                    <li>Reset device fingerprint melalui antarmuka device</li>
                    <li>Pastikan tanggal dan waktu device sudah sesuai</li>
                    <li>Clear semua data transaksi historis dari device</li>
                    <li>Restart device setelah melakukan clear buffer</li>
                    <li>Hubungi technical support device jika masalah berlanjut</li>
                </ul>
            </div>
        </div>
    );
};

export default DeviceManagement;