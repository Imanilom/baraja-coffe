import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaArrowLeft, FaCalculator, FaUsers } from "react-icons/fa";

const SalaryCalculator = ({ onBack }) => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [period, setPeriod] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);

    useEffect(() => {
        fetchActiveEmployees();
    }, []);

    const fetchActiveEmployees = async () => {
        try {
            const response = await axios.get('/api/hr/employees?isActive=true');
            setEmployees(response.data.data);
        } catch (err) {
            console.error("Error fetching employees:", err);
        }
    };

    const handleCalculateAll = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/api/hr/salaries/calculate-all', period);
            setResults(response.data);
        } catch (err) {
            console.error("Error calculating salaries:", err);
            alert("Gagal menghitung gaji: " + err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCalculateSelected = async () => {
        if (selectedEmployees.length === 0) {
            alert("Pilih karyawan terlebih dahulu");
            return;
        }

        setLoading(true);
        try {
            const promises = selectedEmployees.map(employeeId =>
                axios.post('/api/hr/salaries/calculate', {
                    employeeId,
                    ...period
                })
            );
            
            const results = await Promise.allSettled(promises);
            const success = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            
            setResults({
                success: success,
                failed: failed,
                details: results
            });
        } catch (err) {
            console.error("Error calculating salaries:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleEmployeeSelection = (employeeId) => {
        setSelectedEmployees(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    const selectAllEmployees = () => {
        setSelectedEmployees(employees.map(emp => emp._id));
    };

    const clearSelection = () => {
        setSelectedEmployees([]);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                    <FaArrowLeft />
                    Kembali
                </button>
                <div className="flex items-center gap-2 text-xl text-green-900 font-semibold">
                    <FaCalculator />
                    <span>Hitung Penggajian</span>
                </div>
            </div>

            {/* Period Selection */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Pilih Periode</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                        <select
                            value={period.month}
                            onChange={(e) => setPeriod(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                            className="w-full border rounded px-3 py-2"
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
                            value={period.year}
                            onChange={(e) => setPeriod(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                            className="w-full border rounded px-3 py-2"
                        >
                            {Array.from({ length: 5 }, (_, i) => {
                                const year = new Date().getFullYear() - 2 + i;
                                return <option key={year} value={year}>{year}</option>;
                            })}
                        </select>
                    </div>
                </div>
            </div>

            {/* Employee Selection */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Pilih Karyawan</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={selectAllEmployees}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                            Pilih Semua
                        </button>
                        <button
                            onClick={clearSelection}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                            Hapus Pilihan
                        </button>
                    </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Pilih</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Karyawan</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Posisi</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Departemen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {employees.map(employee => (
                                <tr key={employee._id}>
                                    <td className="px-4 py-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedEmployees.includes(employee._id)}
                                            onChange={() => toggleEmployeeSelection(employee._id)}
                                            className="rounded"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="text-sm font-medium text-gray-900">
                                            {employee.user?.username}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {employee.employeeId}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900">
                                        {employee.position}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900">
                                        {employee.department}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
                <button
                    onClick={handleCalculateAll}
                    disabled={loading}
                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:opacity-50"
                >
                    <FaUsers />
                    Hitung Semua Karyawan
                </button>
                
                <button
                    onClick={handleCalculateSelected}
                    disabled={loading || selectedEmployees.length === 0}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    <FaCalculator />
                    Hitung Yang Dipilih ({selectedEmployees.length})
                </button>
            </div>

            {/* Results */}
            {results && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Hasil Perhitungan</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 p-4 rounded border border-green-200">
                            <div className="text-2xl font-bold text-green-600">{results.success || results.results?.success?.length}</div>
                            <div className="text-sm text-green-700">Berhasil Dihitung</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded border border-red-200">
                            <div className="text-2xl font-bold text-red-600">{results.failed || results.results?.failed?.length}</div>
                            <div className="text-sm text-red-700">Gagal Dihitung</div>
                        </div>
                    </div>
                    
                    {results.results?.failed?.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-medium text-red-700 mb-2">Karyawan yang gagal:</h4>
                            <ul className="text-sm text-red-600">
                                {results.results.failed.map((fail, index) => (
                                    <li key={index}>• {fail.employee} - {fail.reason}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {loading && (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#005429]"></div>
                    <span className="ml-2">Menghitung gaji...</span>
                </div>
            )}
        </div>
    );
};

export default SalaryCalculator;