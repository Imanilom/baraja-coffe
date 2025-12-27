import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
    FaMoneyBillWave, 
    FaPlus, 
    FaSearch, 
    FaEdit, 
    FaEye, 
    FaCheck, 
    FaTimes,
    FaCalculator,
    FaFileExport,
    FaChartBar
} from "react-icons/fa";
import SalaryCalculator from "./SalaryCalculator";
import SalaryDetail from "./SalaryDetail";
import SalaryReport from "./SalaryReport";

const SalaryManagement = () => {
    const [activeView, setActiveView] = useState("list"); // list, calculate, detail, report
    const [salaries, setSalaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSalary, setSelectedSalary] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    const [filters, setFilters] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        status: "",
        employee: ""
    });

    // Fetch salaries by period
    const fetchSalaries = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.month) params.append('month', filters.month);
            if (filters.year) params.append('year', filters.year);

            const response = await axios.get(`/api/hr/salaries/period?${params}`);
            setSalaries(response.data.data || response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching salaries:", err);
            setError("Gagal memuat data gaji");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeView === "list") {
            fetchSalaries();
        }
    }, [filters, activeView]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleCalculateSalary = () => {
        setSelectedSalary(null);
        setActiveView("calculate");
    };

    const handleViewDetail = (salary) => {
        setSelectedSalary(salary);
        setActiveView("detail");
    };

    const handleApproveSalary = async (salaryId) => {
        try {
            await axios.patch(`/api/hr/salaries/${salaryId}/approve`, {
                approvedBy: "current-user-id" // Ini harus diambil dari context/auth
            });
            fetchSalaries();
        } catch (err) {
            console.error("Error approving salary:", err);
            setError("Gagal menyetujui gaji");
        }
    };

    const handleMarkAsPaid = async (salaryId) => {
        try {
            await axios.patch(`/api/hr/salaries/${salaryId}/mark-paid`, {
                paidBy: "current-user-id", // Ini harus diambil dari context/auth
                paymentMethod: "transfer"
            });
            fetchSalaries();
        } catch (err) {
            console.error("Error marking salary as paid:", err);
            setError("Gagal menandai gaji sebagai dibayar");
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
            calculated: { color: 'bg-blue-100 text-blue-800', label: 'Terhitung' },
            approved: { color: 'bg-green-100 text-green-800', label: 'Disetujui' },
            paid: { color: 'bg-purple-100 text-purple-800', label: 'Dibayar' },
            cancelled: { color: 'bg-red-100 text-red-800', label: 'Dibatalkan' }
        };
        
        const config = statusConfig[status] || statusConfig.draft;
        return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const renderContent = () => {
        switch (activeView) {
            case "calculate":
                return <SalaryCalculator onBack={() => setActiveView("list")} />;
            case "detail":
                return <SalaryDetail salary={selectedSalary} onBack={() => setActiveView("list")} />;
            case "report":
                return <SalaryReport period={filters} onBack={() => setActiveView("list")} />;
            default:
                return renderSalaryList();
        }
    };

    const renderSalaryList = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#005429]"></div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xl text-green-900 font-semibold">
                        <FaMoneyBillWave />
                        <span>Manajemen Penggajian</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveView("report")}
                            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded text-sm"
                        >
                            <FaChartBar />
                            Laporan
                        </button>
                        <button
                            onClick={handleCalculateSalary}
                            className="flex items-center gap-2 bg-[#005429] text-white px-4 py-2 rounded text-sm"
                        >
                            <FaCalculator />
                            Hitung Gaji
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-5 gap-4 p-4 bg-white rounded-lg shadow">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                        <select
                            value={filters.month}
                            onChange={(e) => handleFilterChange('month', e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {new Date(2000, i).toLocaleString('id-ID', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                        <select
                            value={filters.year}
                            onChange={(e) => handleFilterChange('year', e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm"
                        >
                            {Array.from({ length: 5 }, (_, i) => {
                                const year = new Date().getFullYear() - 2 + i;
                                return <option key={year} value={year}>{year}</option>;
                            })}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm"
                        >
                            <option value="">Semua Status</option>
                            <option value="draft">Draft</option>
                            <option value="calculated">Terhitung</option>
                            <option value="approved">Disetujui</option>
                            <option value="paid">Dibayar</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cari Karyawan</label>
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Nama karyawan..."
                                value={filters.employee}
                                onChange={(e) => handleFilterChange('employee', e.target.value)}
                                className="w-full border rounded pl-10 pr-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={fetchSalaries}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                        >
                            Terapkan Filter
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-gray-900">
                            {salaries.length}
                        </div>
                        <div className="text-sm text-gray-500">Total Karyawan</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(salaries.reduce((sum, s) => sum + s.netSalary, 0))}
                        </div>
                        <div className="text-sm text-gray-500">Total Gaji Bersih</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(salaries.reduce((sum, s) => sum + s.earnings?.totalEarnings || 0, 0))}
                        </div>
                        <div className="text-sm text-gray-500">Total Pendapatan</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(salaries.reduce((sum, s) => sum + s.deductions?.totalDeductions || 0, 0))}
                        </div>
                        <div className="text-sm text-gray-500">Total Potongan</div>
                    </div>
                </div>

                {/* Salary Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Karyawan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periode</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pendapatan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Potongan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bersih</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {salaries.map(salary => (
                                <tr key={salary._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {salary.employee?.user?.username || salary.employee?.employeeId}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {salary.employee?.position} - {salary.employee?.department}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {new Date(salary.period.year, salary.period.month - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {formatCurrency(salary.earnings?.totalEarnings || salary.totalEarnings)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {formatCurrency(salary.deductions?.totalDeductions || salary.totalDeductions)}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-green-600">
                                        {formatCurrency(salary.netSalary)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(salary.status)}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleViewDetail(salary)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Detail"
                                            >
                                                <FaEye />
                                            </button>
                                            {salary.status === 'calculated' && (
                                                <button
                                                    onClick={() => handleApproveSalary(salary._id)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Setujui"
                                                >
                                                    <FaCheck />
                                                </button>
                                            )}
                                            {salary.status === 'approved' && (
                                                <button
                                                    onClick={() => handleMarkAsPaid(salary._id)}
                                                    className="text-purple-600 hover:text-purple-900"
                                                    title="Tandai Dibayar"
                                                >
                                                    <FaMoneyBillWave />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {salaries.length === 0 && !loading && (
                        <div className="text-center py-8 text-gray-500">
                            Tidak ada data gaji untuk periode yang dipilih
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="p-6">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            {renderContent()}
        </div>
    );
};

export default SalaryManagement;