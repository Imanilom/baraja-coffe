import React from "react";
import { FaArrowLeft, FaPrint, FaDownload } from "react-icons/fa";

const SalaryDetail = ({ salary, onBack }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (!salary) return null;

    const earnings = salary.earnings || {};
    const deductions = salary.deductions || {};
    const attendanceSummary = salary.attendanceSummary || {};

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
                        <h1 className="text-2xl font-bold text-gray-900">Detail Gaji</h1>
                        <p className="text-gray-600">
                            {salary.employee?.user?.username} - {salary.employee?.employeeId}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded">
                        <FaPrint />
                        Cetak
                    </button>
                    <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded">
                        <FaDownload />
                        Export
                    </button>
                </div>
            </div>

            {/* Period and Status */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="grid grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Periode</label>
                        <p className="text-lg font-semibold">
                            {new Date(salary.period.year, salary.period.month - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Status</label>
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                            salary.status === 'paid' ? 'bg-green-100 text-green-800' :
                            salary.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            salary.status === 'calculated' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            {salary.status}
                        </span>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Gaji Pokok</label>
                        <p className="text-lg font-semibold">{formatCurrency(earnings.basicSalary)}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500">Gaji Bersih</label>
                        <p className="text-lg font-semibold text-green-600">{formatCurrency(salary.netSalary)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Earnings */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-green-700">Pendapatan</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span>Gaji Pokok</span>
                            <span>{formatCurrency(earnings.basicSalary)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Gaji Prorata</span>
                            <span>{formatCurrency(earnings.prorataSalary)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Lembur 1</span>
                            <span>{formatCurrency(earnings.overtime1)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Lembur 2</span>
                            <span>{formatCurrency(earnings.overtime2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tunjangan Jabatan</span>
                            <span>{formatCurrency(earnings.departmentalAllowance)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tunjangan Anak</span>
                            <span>{formatCurrency(earnings.childcareAllowance)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-semibold">
                            <span>Total Pendapatan</span>
                            <span>{formatCurrency(earnings.totalEarnings)}</span>
                        </div>
                    </div>
                </div>

                {/* Deductions */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-red-700">Potongan</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span>BPJS Kesehatan</span>
                            <span>{formatCurrency(deductions.bpjsKesehatan)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>BPJS Ketenagakerjaan</span>
                            <span>{formatCurrency(deductions.bpjsKetenagakerjaan)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Human Error</span>
                            <span>{formatCurrency(deductions.humanError)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Absensi</span>
                            <span>{formatCurrency(deductions.absence)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Pinjaman</span>
                            <span>{formatCurrency(deductions.loan)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-semibold">
                            <span>Total Potongan</span>
                            <span>{formatCurrency(deductions.totalDeductions)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Summary */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Rekap Kehadiran</h3>
                <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{attendanceSummary.fingerprintTappingDays}</div>
                        <div className="text-sm text-gray-600">Hari Fingerprint</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{attendanceSummary.totalWorkingDays}</div>
                        <div className="text-sm text-gray-600">Hari Kerja</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{attendanceSummary.sickDays}</div>
                        <div className="text-sm text-gray-600">Hari Sakit</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{attendanceSummary.leaveDays}</div>
                        <div className="text-sm text-gray-600">Hari Cuti</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalaryDetail; 