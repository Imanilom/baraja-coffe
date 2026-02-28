import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
    FaCalendarAlt, 
    FaSearch, 
    FaClock,
    FaCheckCircle,
    FaTimesCircle,
    FaExclamationTriangle
} from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';

const AttendanceManagement = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(),
        endDate: new Date()
    });

    const fetchAttendanceData = async () => {
        setLoading(true);
        try {
            const start = dateRange.startDate?.toISOString().split('T')[0];
            const end = dateRange.endDate?.toISOString().split('T')[0];
            
            const response = await axios.get(`/api/hr/attendance/summary?startDate=${start}&endDate=${end}`);
            setAttendanceData(response.data);
            
            // Calculate summary
            const totalPresent = response.data.reduce((sum, item) => sum + item.totalPresent, 0);
            const totalLate = response.data.reduce((sum, item) => sum + item.totalLate, 0);
            const totalAbsent = response.data.reduce((sum, item) => sum + item.totalAbsent, 0);
            
            setSummary({ totalPresent, totalLate, totalAbsent });
        } catch (err) {
            console.error("Error fetching attendance:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendanceData();
    }, [dateRange]);

    const getStatusBadge = (employee) => {
        const totalDays = employee.totalPresent + employee.totalLate + employee.totalAbsent;
        const attendanceRate = (employee.totalPresent / totalDays) * 100;
        
        if (attendanceRate >= 90) {
            return { color: 'bg-green-100 text-green-800', text: 'Excellent' };
        } else if (attendanceRate >= 80) {
            return { color: 'bg-blue-100 text-blue-800', text: 'Good' };
        } else if (attendanceRate >= 70) {
            return { color: 'bg-yellow-100 text-yellow-800', text: 'Fair' };
        } else {
            return { color: 'bg-red-100 text-red-800', text: 'Poor' };
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#005429]"></div></div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-xl text-green-900 font-semibold">
                    <FaCalendarAlt />
                    <span>Manajemen Kehadiran</span>
                </div>
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
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow border">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold text-green-600">{summary.totalPresent || 0}</div>
                            <div className="text-sm text-gray-600">Hadir</div>
                        </div>
                        <FaCheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold text-yellow-600">{summary.totalLate || 0}</div>
                            <div className="text-sm text-gray-600">Terlambat</div>
                        </div>
                        <FaExclamationTriangle className="h-8 w-8 text-yellow-500" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold text-red-600">{summary.totalAbsent || 0}</div>
                            <div className="text-sm text-gray-600">Tidak Hadir</div>
                        </div>
                        <FaTimesCircle className="h-8 w-8 text-red-500" />
                    </div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Karyawan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hadir</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Terlambat</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tidak Hadir</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Jam</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {attendanceData.map((item, index) => {
                            const status = getStatusBadge(item);
                            return (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {item.user?.username || 'N/A'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {item.employee?.position} - {item.employee?.department}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-green-600 font-semibold">
                                            {item.totalPresent}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-yellow-600 font-semibold">
                                            {item.totalLate}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-red-600 font-semibold">
                                            {item.totalAbsent}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <FaClock className="mr-1 text-gray-400" />
                                            {item.totalWorkHours?.toFixed(1) || 0} jam
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                                            {status.text}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendanceManagement;