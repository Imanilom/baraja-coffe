import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
    FaFingerprint, 
    FaSync, 
    FaCheckCircle, 
    FaTimesCircle,
    FaHistory,
    FaCalendarAlt
} from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';

const FingerprintActivityMonitor = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 hari lalu
        endDate: new Date()
    });

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (dateRange.startDate) {
                params.append('startDate', dateRange.startDate.toISOString());
            }
            if (dateRange.endDate) {
                params.append('endDate', dateRange.endDate.toISOString());
            }

            const response = await axios.get(`/api/adms/fingerprint/activities?${params}`);
            setActivities(response.data.data);
        } catch (err) {
            console.error("Error fetching activities:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [dateRange]);

    const getStatusColor = (activity) => {
        if (activity.isMapped) {
            return activity.lastStatus === 'checkIn' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
        } else {
            return activity.lastStatus === 'checkIn' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800';
        }
    };

    const getStatusText = (activity) => {
        if (activity.isMapped) {
            return activity.lastStatus === 'checkIn' ? 'Check-In (Mapped)' : 'Check-Out (Mapped)';
        } else {
            return activity.lastStatus === 'checkIn' ? 'Check-In (Unmapped)' : 'Check-Out (Unmapped)';
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
                    <FaHistory />
                    <span>Monitoring Aktivitas Fingerprint</span>
                </div>
                <div className="flex space-x-3 items-center">
                    <div className="w-64">
                        <Datepicker
                            value={dateRange}
                            onChange={setDateRange}
                            showShortcuts={true}
                            displayFormat="DD-MM-YYYY"
                            inputClassName="w-full text-sm border py-2 px-3 rounded"
                            separator="to"
                        />
                    </div>
                    <button
                        onClick={fetchActivities}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm"
                    >
                        <FaSync />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="text-2xl font-bold text-gray-900">{activities.length}</div>
                    <div className="text-sm text-gray-600">Total Aktivitas</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="text-2xl font-bold text-green-600">
                        {activities.filter(a => a.isMapped).length}
                    </div>
                    <div className="text-sm text-gray-600">Terkait Karyawan</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="text-2xl font-bold text-yellow-600">
                        {activities.filter(a => !a.isMapped).length}
                    </div>
                    <div className="text-sm text-gray-600">Belum Terkait</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="text-2xl font-bold text-blue-600">
                        {activities.filter(a => a.lastStatus === 'checkIn').length}
                    </div>
                    <div className="text-sm text-gray-600">Check-In</div>
                </div>
            </div>

            {/* Activity Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Karyawan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Aktivitas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {activities.map(activity => (
                            <tr key={activity._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <FaFingerprint className={`h-5 w-5 ${
                                            activity.isMapped ? 'text-green-500' : 'text-yellow-500'
                                        }`} />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {activity.username}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {activity.deviceUserId}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activity)}`}>
                                        {getStatusText(activity)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {activity.isMapped && activity.mappedToEmployee ? (
                                        <div className="text-sm text-gray-900">
                                            {activity.mappedToEmployee.user?.username}
                                            <div className="text-xs text-gray-500">
                                                {activity.mappedToEmployee.employeeId}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-yellow-600">Belum dipetakan</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {new Date(activity.lastActivity).toLocaleString('id-ID')}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {activity.activityCount} kali
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {activities.length === 0 && (
                <div className="text-center py-12">
                    <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada aktivitas</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Tidak ada aktivitas fingerprint dalam rentang tanggal yang dipilih
                    </p>
                </div>
            )}
        </div>
    );
};

export default FingerprintActivityMonitor;