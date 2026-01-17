import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
    FaArrowLeft, 
    FaFileExport, 
    FaPrint, 
    FaDownload, 
    FaChartBar,
    FaUsers,
    FaMoneyBillWave,
    FaReceipt
} from "react-icons/fa";

const SalaryReport = ({ period, onBack }) => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [detailedView, setDetailedView] = useState(false);

    useEffect(() => {
        fetchReportData();
    }, [period]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (period.month) params.append('month', period.month);
            if (period.year) params.append('year', period.year);

            const response = await axios.get(`/api/hr/salaries/summary?${params}`);
            setReportData(response.data);
        } catch (err) {
            console.error("Error fetching report data:", err);
            alert("Gagal memuat data laporan");
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        setExportLoading(true);
        try {
            // Implement PDF export logic here
            alert("Fitur export PDF akan diimplementasikan");
        } catch (err) {
            console.error("Error exporting PDF:", err);
            alert("Gagal mengexport PDF");
        } finally {
            setExportLoading(false);
        }
    };

    const handleExportExcel = async () => {
        setExportLoading(true);
        try {
            // Implement Excel export logic here
            alert("Fitur export Excel akan diimplementasikan");
        } catch (err) {
            console.error("Error exporting Excel:", err);
            alert("Gagal mengexport Excel");
        } finally {
            setExportLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatNumber = (number) => {
        return new Intl.NumberFormat('id-ID').format(number);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#005429]"></div>
                <span className="ml-2">Memuat laporan...</span>
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className="text-center py-8 text-gray-500">
                Tidak ada data laporan untuk periode yang dipilih
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <FaArrowLeft />
                        Kembali
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Laporan Penggajian</h1>
                        <p className="text-gray-600">
                            Periode: {new Date(period.year, period.month - 1).toLocaleString('id-ID', { 
                                month: 'long', 
                                year: 'numeric' 
                            })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setDetailedView(!detailedView)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm"
                    >
                        <FaChartBar />
                        {detailedView ? 'Tampilan Ringkas' : 'Tampilan Detail'}
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={exportLoading}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                    >
                        <FaFileExport />
                        Export PDF
                    </button>
                    <button
                        onClick={handleExportExcel}
                        disabled={exportLoading}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                    >
                        <FaDownload />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow text-center">
                    <div className="flex justify-center items-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
                        <FaUsers className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {formatNumber(reportData.totalEmployees)}
                    </div>
                    <div className="text-sm text-gray-500">Total Karyawan</div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow text-center">
                    <div className="flex justify-center items-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
                        <FaMoneyBillWave className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(reportData.totalNetSalary)}
                    </div>
                    <div className="text-sm text-gray-500">Total Gaji Bersih</div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow text-center">
                    <div className="flex justify-center items-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
                        <FaReceipt className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(reportData.totalGrossSalary)}
                    </div>
                    <div className="text-sm text-gray-500">Total Gaji Kotor</div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow text-center">
                    <div className="flex justify-center items-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-3">
                        <FaChartBar className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(reportData.totalDeductions)}
                    </div>
                    <div className="text-sm text-gray-500">Total Potongan</div>
                </div>
            </div>

            {/* Department Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Breakdown per Departemen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(reportData.byDepartment).map(([dept, data]) => (
                        <div key={dept} className="border rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">{dept}</h4>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span>Jumlah Karyawan:</span>
                                    <span className="font-medium">{data.count}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total Gaji Kotor:</span>
                                    <span className="font-medium text-purple-600">
                                        {formatCurrency(data.totalGrossSalary)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total Gaji Bersih:</span>
                                    <span className="font-medium text-green-600">
                                        {formatCurrency(data.totalNetSalary)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Rata-rata per Karyawan:</span>
                                    <span className="font-medium text-blue-600">
                                        {formatCurrency(data.totalNetSalary / data.count)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detailed Statistics */}
            {detailedView && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Statistik Detail</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-gray-700 mb-3">Analisis Pendapatan</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Total Gaji Pokok:</span>
                                    <span className="font-medium">
                                        {formatCurrency(reportData.totalGrossSalary - reportData.totalOvertime)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total Lembur:</span>
                                    <span className="font-medium text-orange-600">
                                        {formatCurrency(reportData.totalOvertime)}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                    <span className="font-semibold">Total Pendapatan:</span>
                                    <span className="font-semibold text-purple-600">
                                        {formatCurrency(reportData.totalGrossSalary)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-medium text-gray-700 mb-3">Analisis Potongan</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Rata-rata Gaji per Karyawan:</span>
                                    <span className="font-medium">
                                        {formatCurrency(reportData.totalNetSalary / reportData.totalEmployees)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Rata-rata Potongan per Karyawan:</span>
                                    <span className="font-medium text-red-600">
                                        {formatCurrency(reportData.totalDeductions / reportData.totalEmployees)}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                    <span className="font-semibold">Efisiensi Penggajian:</span>
                                    <span className="font-semibold text-green-600">
                                        {((reportData.totalNetSalary / reportData.totalGrossSalary) * 100).toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Section */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Visualisasi Data</h3>
                <div className="grid grid-cols-2 gap-6">
                    {/* Department Distribution */}
                    <div>
                        <h4 className="font-medium text-gray-700 mb-3">Distribusi per Departemen</h4>
                        <div className="space-y-2">
                            {Object.entries(reportData.byDepartment).map(([dept, data]) => {
                                const percentage = (data.totalNetSalary / reportData.totalNetSalary * 100).toFixed(1);
                                return (
                                    <div key={dept} className="flex items-center justify-between">
                                        <span className="text-sm">{dept}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-blue-600 h-2 rounded-full" 
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium w-12 text-right">
                                                {percentage}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Cost Analysis */}
                    <div>
                        <h4 className="font-medium text-gray-700 mb-3">Analisis Biaya</h4>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Gaji Bersih</span>
                                    <span>{formatCurrency(reportData.totalNetSalary)}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-green-600 h-2 rounded-full" 
                                        style={{ 
                                            width: `${(reportData.totalNetSalary / reportData.totalGrossSalary * 100).toFixed(1)}%` 
                                        }}
                                    ></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Potongan</span>
                                    <span>{formatCurrency(reportData.totalDeductions)}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-red-600 h-2 rounded-full" 
                                        style={{ 
                                            width: `${(reportData.totalDeductions / reportData.totalGrossSalary * 100).toFixed(1)}%` 
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Catatan Laporan</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Laporan ini dibuat otomatis berdasarkan data penggajian periode {new Date(period.year, period.month - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</li>
                    <li>• Data termasuk semua karyawan aktif yang memiliki perhitungan gaji untuk periode tersebut</li>
                    <li>• Total lembur termasuk lembur normal dan lembur hari libur</li>
                    <li>• Potongan termasuk BPJS, pajak, dan potongan lainnya</li>
                </ul>
            </div>

            {/* Print Section (hidden for screen, visible for print) */}
            <div className="hidden print:block">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold">Laporan Penggajian</h1>
                    <p className="text-lg">
                        Periode: {new Date(period.year, period.month - 1).toLocaleString('id-ID', { 
                            month: 'long', 
                            year: 'numeric' 
                        })}
                    </p>
                    <p className="text-sm text-gray-600">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
                </div>
                
                <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2">Departemen</th>
                            <th className="border border-gray-300 px-4 py-2">Jumlah Karyawan</th>
                            <th className="border border-gray-300 px-4 py-2">Total Gaji Kotor</th>
                            <th className="border border-gray-300 px-4 py-2">Total Gaji Bersih</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(reportData.byDepartment).map(([dept, data]) => (
                            <tr key={dept}>
                                <td className="border border-gray-300 px-4 py-2">{dept}</td>
                                <td className="border border-gray-300 px-4 py-2 text-center">{data.count}</td>
                                <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(data.totalGrossSalary)}</td>
                                <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(data.totalNetSalary)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-50 font-semibold">
                            <td className="border border-gray-300 px-4 py-2">TOTAL</td>
                            <td className="border border-gray-300 px-4 py-2 text-center">{reportData.totalEmployees}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(reportData.totalGrossSalary)}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(reportData.totalNetSalary)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Action Buttons for Print */}
            <div className="flex justify-center gap-4 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                    <FaPrint />
                    Cetak Laporan
                </button>
            </div>

            {exportLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#005429]"></div>
                            <span>Mengexport laporan...</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalaryReport;