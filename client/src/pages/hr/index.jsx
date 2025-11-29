import React, { useState } from "react";
import EmployeeManagement from "./EmployeeManagement";
import AttendanceManagement from "./AttendanceManagement";
import FingerprintManagement from "./FingerprintManagement";
import FingerprintActivityMonitor from "./FingerprintActivityMonitor";
import DeviceManagement from "./DeviceManagement";
import SalaryManagement from "./SalaryManagement";

import { FaUsers, FaCalendarAlt, FaFingerprint, FaChartBar, FaHistory, FaMoneyBillWave } from "react-icons/fa";

const HRDashboard = () => {
    const [activeTab, setActiveTab] = useState("employees");

    const tabs = [
        { id: "employees", name: "Karyawan", icon: FaUsers },
        { id: "attendance", name: "Kehadiran", icon: FaCalendarAlt },
        { id: "fingerprint", name: "Fingerprint", icon: FaFingerprint },
        { id: "salary", name: "Penggajian", icon: FaMoneyBillWave }, 
        { id: "activity-monitor", name: "Monitor Aktivitas", icon: FaHistory },
        { id: "device", name: "Devices", icon: FaHistory },
        { id: "reports", name: "Laporan", icon: FaChartBar }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case "employees":
                return <EmployeeManagement />;
            case "attendance":
                return <AttendanceManagement />;
            case "salary":
                return <SalaryManagement />;
            case "fingerprint":
                return <FingerprintManagement />;
            case "activity-monitor":
                return <FingerprintActivityMonitor />;
            case "device":
                return <DeviceManagement />;
            case "reports":
                return <div className="p-6">Laporan HR - Dalam Pengembangan</div>;
            default:
                return <EmployeeManagement />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Tab Navigation */}
            <div className="bg-white border-b">
                <div className="px-6">
                    <nav className="flex space-x-8">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? "border-[#005429] text-[#005429]"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                                >
                                    <Icon className="mr-2" />
                                    {tab.name}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Content */}
            {renderContent()}
        </div>
    );
};

export default HRDashboard;