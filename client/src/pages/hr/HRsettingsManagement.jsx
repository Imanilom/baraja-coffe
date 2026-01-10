import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { 
    FaCog, 
    FaBuilding, 
    FaClock, 
    FaCalculator, 
    FaShieldAlt, 
    FaMoneyBillWave,
    FaSave,
    FaUndo,
    FaCheckCircle,
    FaExclamationTriangle,
    FaEye,
    FaHistory,
    FaChartLine,
    FaUserCheck,
    FaPercent,
    FaSync
} from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const HRSettingsManagement = () => {
    const [activeSection, setActiveSection] = useState("attendance");
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [validation, setValidation] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [companyId, setCompanyId] = useState("");
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);

    const sections = [
        { id: "attendance", name: "Presensi", icon: FaClock, color: "bg-green-500" },
        { id: "salaryCalculation", name: "Perhitungan Gaji", icon: FaCalculator, color: "bg-purple-500" },
        { id: "bpjs", name: "BPJS", icon: FaShieldAlt, color: "bg-yellow-500" },
        { id: "deductions", name: "Potongan", icon: FaMoneyBillWave, color: "bg-red-500" }
    ];

    // Initial state for settings - DIPINDAHKAN KE DALAM useState
    const [initialSettings] = useState({
        attendance: {
            toleranceLate: 15,
            workHoursPerDay: 8,
            workDaysPerWeek: 6,
            requiredTappingPerDay: 1
        },
        salaryCalculation: {
            prorataFormula: "basicSalary / totalWorkingDays",
            overtime1Rate: 1.5,
            overtime2Rate: 2.0,
            maxOvertimeHours: 4
        },
        bpjs: {
            kesehatanRateEmployee: 0.01,
            kesehatanRateEmployer: 0.04,
            ketenagakerjaanRateEmployee: 0.02,
            ketenagakerjaanRateEmployer: 0.037,
            maxSalaryBpjs: 12000000
        },
        deductions: {
            humanErrorDeduction: 0,
            absenceDeductionRate: 1
        }
    });

    // Fetch companies on mount
    useEffect(() => {
        fetchCompanies();
    }, []);

    // Fetch settings when company changes
    useEffect(() => {
        if (companyId) {
            fetchSettings();
            validateSettings();
        }
    }, [companyId]);

    const fetchCompanies = async () => {
        try {
            const response = await axios.get("/api/hr/companies");
            setCompanies(response.data.data || []);
            
            // Auto-select first company if available
            if (response.data.data?.length > 0) {
                setCompanyId(response.data.data[0]._id);
                setSelectedCompany(response.data.data[0]);
            }
        } catch (error) {
            console.error("Error fetching companies:", error);
            toast.error("Gagal memuat daftar perusahaan");
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        if (!companyId) {
            toast.warning("Silakan pilih perusahaan terlebih dahulu");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(`/api/hr/settings?companyId=${companyId}`);
            if (response.data.data) {
                // Merge with initial settings to ensure all fields exist
                const fetchedSettings = response.data.data;
                
                const mergedSettings = {
                    attendance: {
                        ...initialSettings.attendance,
                        ...(fetchedSettings.attendance || {})
                    },
                    salaryCalculation: {
                        ...initialSettings.salaryCalculation,
                        ...(fetchedSettings.salaryCalculation || {})
                    },
                    bpjs: {
                        ...initialSettings.bpjs,
                        ...(fetchedSettings.bpjs || {})
                    },
                    deductions: {
                        ...initialSettings.deductions,
                        ...(fetchedSettings.deductions || {})
                    },
                    _id: fetchedSettings._id,
                    company: fetchedSettings.company,
                    createdAt: fetchedSettings.createdAt,
                    updatedAt: fetchedSettings.updatedAt
                };
                
                setSettings(mergedSettings);
                
                if (response.data.isDefault) {
                    toast.info("Settings belum dikonfigurasi. Menggunakan nilai default perusahaan.");
                }
            } else {
                // Use initial settings if no data
                setSettings({
                    ...initialSettings,
                    company: { _id: companyId, name: selectedCompany?.name }
                });
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("Gagal memuat pengaturan");
            setSettings({
                ...initialSettings,
                company: { _id: companyId, name: selectedCompany?.name }
            });
        } finally {
            setLoading(false);
        }
    };

    const validateSettings = async () => {
        if (!companyId) return;
        
        try {
            const response = await axios.get(`/api/hr/settings/validate?companyId=${companyId}`);
            setValidation(response.data);
        } catch (error) {
            console.error("Error validating settings:", error);
            setValidation({
                valid: false,
                message: "Tidak dapat memvalidasi pengaturan",
                issues: ["Endpoint validasi tidak ditemukan"],
                warnings: []
            });
        }
    };

    const handleCompanyChange = (e) => {
        const selectedId = e.target.value;
        setCompanyId(selectedId);
        
        const company = companies.find(c => c._id === selectedId);
        setSelectedCompany(company);
        setSettings(null); // Reset settings ketika perusahaan berubah
    };

    const handleInputChange = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleSaveSettings = async () => {
        if (!companyId) {
            toast.error("Silakan pilih perusahaan terlebih dahulu");
            return;
        }

        if (!settings) {
            toast.error("Tidak ada pengaturan untuk disimpan");
            return;
        }

        setSaving(true);
        try {
            const settingsToSend = {
                company: companyId,
                attendance: settings.attendance,
                salaryCalculation: settings.salaryCalculation,
                bpjs: settings.bpjs,
                deductions: settings.deductions
            };
            
            const response = await axios.post("/api/hr/settings", settingsToSend);
            
            // Update settings dengan response
            setSettings(prev => ({
                ...prev,
                ...response.data.data
            }));
            
            toast.success(response.data.message);
            validateSettings();
        } catch (error) {
            console.error("Error saving settings:", error);
            if (error.response?.data?.errors) {
                error.response.data.errors.forEach(err => {
                    toast.error(`${err.field}: ${err.message}`);
                });
            } else {
                toast.error(error.response?.data?.message || "Gagal menyimpan pengaturan");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleResetSection = async () => {
        if (!companyId) {
            toast.error("Silakan pilih perusahaan terlebih dahulu");
            return;
        }

        if (window.confirm(`Reset ${getSectionName(activeSection)} ke nilai default?`)) {
            try {
                const response = await axios.patch(`/api/hr/settings/section/${activeSection}`, {
                    companyId: companyId
                });
                setSettings(prev => ({
                    ...prev,
                    [activeSection]: response.data.data
                }));
                toast.success(response.data.message);
            } catch (error) {
                console.error("Error resetting section:", error);
                toast.error("Gagal mereset pengaturan");
            }
        }
    };

    const handleResetAll = async () => {
        if (!companyId) {
            toast.error("Silakan pilih perusahaan terlebih dahulu");
            return;
        }

        if (window.confirm("Reset semua pengaturan ke nilai default perusahaan?")) {
            try {
                const response = await axios.post(`/api/hr/settings/${companyId}/reset`);
                setSettings(response.data.data);
                toast.success(response.data.message);
                validateSettings();
            } catch (error) {
                console.error("Error resetting settings:", error);
                toast.error("Gagal mereset pengaturan");
            }
        }
    };

    const handleBpjsPreview = async () => {
        if (!companyId) {
            toast.error("Silakan pilih perusahaan terlebih dahulu");
            return;
        }

        const salary = prompt("Masukkan gaji pokok untuk preview BPJS:", "5000000");
        if (salary && !isNaN(salary)) {
            try {
                const response = await axios.get(`/api/hr/settings/preview/bpjs?companyId=${companyId}&salary=${salary}`);
                setPreviewData({
                    type: "bpjs",
                    data: response.data.data
                });
            } catch (error) {
                console.error("Error getting BPJS preview:", error);
                toast.error("Gagal menghitung preview BPJS");
            }
        }
    };

    const handleOvertimePreview = async () => {
        if (!companyId) {
            toast.error("Silakan pilih perusahaan terlebih dahulu");
            return;
        }

        const basicSalary = prompt("Masukkan gaji pokok:", "5000000");
        if (basicSalary && !isNaN(basicSalary)) {
            const overtime1Hours = prompt("Jam lembur normal:", "10");
            const overtime2Hours = prompt("Jam lembur hari libur:", "0");
            
            try {
                const response = await axios.get(`/api/hr/settings/preview/overtime`, {
                    params: {
                        companyId,
                        basicSalary,
                        overtime1Hours: overtime1Hours || 0,
                        overtime2Hours: overtime2Hours || 0
                    }
                });
                setPreviewData({
                    type: "overtime",
                    data: response.data.data
                });
            } catch (error) {
                console.error("Error getting overtime preview:", error);
                toast.error("Gagal menghitung preview lembur");
            }
        }
    };

    const getSectionName = (sectionId) => {
        return sections.find(s => s.id === sectionId)?.name || sectionId;
    };

    const formatPercentage = (value) => {
        return `${(value * 100).toFixed(1)}%`;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const renderCompanySelector = () => {
        return (
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pilih Perusahaan
                            </label>
                            <select
                                value={companyId}
                                onChange={handleCompanyChange}
                                className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[300px]"
                            >
                                <option value="">-- Pilih Perusahaan --</option>
                                {companies.map(company => (
                                    <option key={company._id} value={company._id}>
                                        {company.name} ({company.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        {selectedCompany && (
                            <div className="text-sm text-gray-600">
                                <div className="font-medium">{selectedCompany.name}</div>
                                <div className="text-xs">{selectedCompany.address}</div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={fetchSettings}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                        <FaSync className={loading ? "animate-spin" : ""} />
                        {loading ? "Memuat..." : "Refresh"}
                    </button>
                </div>
            </div>
        );
    };

    const renderAttendanceSection = () => {
        if (!settings || !settings.attendance) return null;

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Toleransi Keterlambatan (menit)
                        </label>
                        <input
                            type="number"
                            value={settings.attendance.toleranceLate || 15}
                            onChange={(e) => handleInputChange("attendance", "toleranceLate", parseInt(e.target.value) || 0)}
                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            min="0"
                            max="120"
                        />
                        <p className="text-xs text-gray-500 mt-1">Karyawan tidak dianggap terlambat jika datang dalam toleransi ini</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Jam Kerja per Hari
                        </label>
                        <input
                            type="number"
                            value={settings.attendance.workHoursPerDay || 8}
                            onChange={(e) => handleInputChange("attendance", "workHoursPerDay", parseInt(e.target.value) || 0)}
                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            min="1"
                            max="24"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hari Kerja per Minggu
                        </label>
                        <input
                            type="number"
                            value={settings.attendance.workDaysPerWeek || 6}
                            onChange={(e) => handleInputChange("attendance", "workDaysPerWeek", parseInt(e.target.value) || 0)}
                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            min="1"
                            max="7"
                        />
                        <p className="text-xs text-gray-500 mt-1">6 = Senin-Sabtu, 5 = Senin-Jumat</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimal Tapping per Hari
                        </label>
                        <input
                            type="number"
                            value={settings.attendance.requiredTappingPerDay || 1}
                            onChange={(e) => handleInputChange("attendance", "requiredTappingPerDay", parseInt(e.target.value) || 0)}
                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            min="1"
                            max="4"
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimal jumlah fingerprint tapping yang valid per hari</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderSalarySection = () => {
        if (!settings || !settings.salaryCalculation) return null;

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Formula Prorata
                        </label>
                        <input
                            type="text"
                            value={settings.salaryCalculation.prorataFormula || "basicSalary / totalWorkingDays"}
                            onChange={(e) => handleInputChange("salaryCalculation", "prorataFormula", e.target.value)}
                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            disabled
                        />
                        <p className="text-xs text-gray-500 mt-1">Formula untuk menghitung gaji prorata</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rate Lembur Normal (x)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={settings.salaryCalculation.overtime1Rate || 1.5}
                            onChange={(e) => handleInputChange("salaryCalculation", "overtime1Rate", parseFloat(e.target.value) || 0)}
                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            min="1"
                            max="5"
                        />
                        <p className="text-xs text-gray-500 mt-1">Contoh: 1.5 = 1.5x upah per jam</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rate Lembur Libur (x)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={settings.salaryCalculation.overtime2Rate || 2.0}
                            onChange={(e) => handleInputChange("salaryCalculation", "overtime2Rate", parseFloat(e.target.value) || 0)}
                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            min="1"
                            max="5"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maksimal Jam Lembur per Hari
                        </label>
                        <input
                            type="number"
                            value={settings.salaryCalculation.maxOvertimeHours || 4}
                            onChange={(e) => handleInputChange("salaryCalculation", "maxOvertimeHours", parseInt(e.target.value) || 0)}
                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            min="0"
                            max="12"
                        />
                        <p className="text-xs text-gray-500 mt-1">Jam lembur yang dihitung maksimal per hari</p>
                    </div>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                    <button
                        onClick={handleOvertimePreview}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        <FaCalculator />
                        Preview Perhitungan Lembur
                    </button>
                </div>
            </div>
        );
    };

    const renderBpjsSection = () => {
        if (!settings || !settings.bpjs) return null;

        return (
            <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2">Batas Maksimal Perhitungan</h3>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Batas Gaji untuk BPJS
                        </label>
                        <input
                            type="number"
                            value={settings.bpjs.maxSalaryBpjs || 12000000}
                            onChange={(e) => handleInputChange("bpjs", "maxSalaryBpjs", parseInt(e.target.value) || 0)}
                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                            min="1000000"
                        />
                        <p className="text-xs text-gray-500 mt-1">Gaji di atas batas ini tetap dihitung dengan batas maksimal</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 mb-4">BPJS Kesehatan</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rate Karyawan
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={settings.bpjs.kesehatanRateEmployee || 0.01}
                                        onChange={(e) => handleInputChange("bpjs", "kesehatanRateEmployee", parseFloat(e.target.value) || 0)}
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                        min="0"
                                        max="0.1"
                                    />
                                    <span className="ml-2 text-gray-600">({formatPercentage(settings.bpjs.kesehatanRateEmployee || 0.01)})</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rate Perusahaan
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={settings.bpjs.kesehatanRateEmployer || 0.04}
                                        onChange={(e) => handleInputChange("bpjs", "kesehatanRateEmployer", parseFloat(e.target.value) || 0)}
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                        min="0"
                                        max="0.1"
                                    />
                                    <span className="ml-2 text-gray-600">({formatPercentage(settings.bpjs.kesehatanRateEmployer || 0.04)})</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 mb-4">BPJS Ketenagakerjaan</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rate Karyawan
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={settings.bpjs.ketenagakerjaanRateEmployee || 0.02}
                                        onChange={(e) => handleInputChange("bpjs", "ketenagakerjaanRateEmployee", parseFloat(e.target.value) || 0)}
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                        min="0"
                                        max="0.1"
                                    />
                                    <span className="ml-2 text-gray-600">({formatPercentage(settings.bpjs.ketenagakerjaanRateEmployee || 0.02)})</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rate Perusahaan
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={settings.bpjs.ketenagakerjaanRateEmployer || 0.037}
                                        onChange={(e) => handleInputChange("bpjs", "ketenagakerjaanRateEmployer", parseFloat(e.target.value) || 0)}
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                        min="0"
                                        max="0.1"
                                    />
                                    <span className="ml-2 text-gray-600">({formatPercentage(settings.bpjs.ketenagakerjaanRateEmployer || 0.037)})</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                    <button
                        onClick={handleBpjsPreview}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        <FaPercent />
                        Preview Perhitungan BPJS
                    </button>
                </div>
            </div>
        );
    };

    const renderDeductionsSection = () => {
        if (!settings || !settings.deductions) return null;

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Potongan Human Error
                        </label>
                        <input
                            type="number"
                            value={settings.deductions.humanErrorDeduction || 0}
                            onChange={(e) => handleInputChange("deductions", "humanErrorDeduction", parseInt(e.target.value) || 0)}
                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            min="0"
                        />
                        <p className="text-xs text-gray-500 mt-1">Potongan tetap untuk kesalahan manusia</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rate Potongan Absen (x)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={settings.deductions.absenceDeductionRate || 1}
                            onChange={(e) => handleInputChange("deductions", "absenceDeductionRate", parseFloat(e.target.value) || 0)}
                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            min="0"
                            max="2"
                        />
                        <p className="text-xs text-gray-500 mt-1">1 = potongan normal, 1.5 = potongan 1.5x rate harian</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderPreviewModal = () => {
        if (!previewData) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold">
                                {previewData.type === "bpjs" ? "Preview Perhitungan BPJS" : "Preview Perhitungan Lembur"}
                            </h3>
                            <button
                                onClick={() => setPreviewData(null)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        {previewData.type === "bpjs" && previewData.data && (
                            <div className="space-y-4">
                                {previewData.data.company && (
                                    <div className="bg-blue-50 p-3 rounded mb-4">
                                        <div className="text-sm text-gray-600">Perusahaan</div>
                                        <div className="font-semibold">{previewData.data.company.name}</div>
                                        <div className="text-xs text-gray-500">{previewData.data.company.code}</div>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded">
                                        <div className="text-sm text-gray-600">Gaji Karyawan</div>
                                        <div className="font-semibold">{formatCurrency(previewData.data.employeeSalary)}</div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded">
                                        <div className="text-sm text-gray-600">Basis Perhitungan</div>
                                        <div className="font-semibold">{formatCurrency(previewData.data.baseSalaryForCalculation)}</div>
                                        {previewData.data.isCapped && (
                                            <div className="text-xs text-yellow-600 mt-1">*Dibatasi maksimal BPJS</div>
                                        )}
                                    </div>
                                </div>

                                <div className="border rounded-lg p-4">
                                    <h4 className="font-medium mb-3">BPJS Kesehatan</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-sm text-gray-600">Karyawan</div>
                                            <div className="font-semibold">{formatCurrency(previewData.data.bpjsKesehatan.employeeAmount)}</div>
                                            <div className="text-xs text-gray-500">{formatPercentage(previewData.data.bpjsKesehatan.employeeRate)}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Perusahaan</div>
                                            <div className="font-semibold">{formatCurrency(previewData.data.bpjsKesehatan.employerAmount)}</div>
                                            <div className="text-xs text-gray-500">{formatPercentage(previewData.data.bpjsKesehatan.employerRate)}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Total</div>
                                            <div className="font-semibold text-green-600">{formatCurrency(previewData.data.bpjsKesehatan.totalAmount)}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border rounded-lg p-4">
                                    <h4 className="font-medium mb-3">BPJS Ketenagakerjaan</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-sm text-gray-600">Karyawan</div>
                                            <div className="font-semibold">{formatCurrency(previewData.data.bpjsKetenagakerjaan.employeeAmount)}</div>
                                            <div className="text-xs text-gray-500">{formatPercentage(previewData.data.bpjsKetenagakerjaan.employeeRate)}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Perusahaan</div>
                                            <div className="font-semibold">{formatCurrency(previewData.data.bpjsKetenagakerjaan.employerAmount)}</div>
                                            <div className="text-xs text-gray-500">{formatPercentage(previewData.data.bpjsKetenagakerjaan.employerRate)}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Total</div>
                                            <div className="font-semibold text-green-600">{formatCurrency(previewData.data.bpjsKetenagakerjaan.totalAmount)}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                    <div className="bg-blue-50 p-3 rounded">
                                        <div className="text-sm text-gray-600">Total Potongan Karyawan</div>
                                        <div className="font-semibold text-red-600">{formatCurrency(previewData.data.totals.totalEmployeeDeduction)}</div>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded">
                                        <div className="text-sm text-gray-600">Total Kontribusi Perusahaan</div>
                                        <div className="font-semibold">{formatCurrency(previewData.data.totals.totalEmployerContribution)}</div>
                                    </div>
                                    <div className="bg-purple-50 p-3 rounded">
                                        <div className="text-sm text-gray-600">Total BPJS</div>
                                        <div className="font-semibold text-purple-600">{formatCurrency(previewData.data.totals.totalBPJS)}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {previewData.type === "overtime" && previewData.data && (
                            <div className="space-y-4">
                                {previewData.data.company && (
                                    <div className="bg-blue-50 p-3 rounded mb-4">
                                        <div className="text-sm text-gray-600">Perusahaan</div>
                                        <div className="font-semibold">{previewData.data.company.name}</div>
                                        <div className="text-xs text-gray-500">{previewData.data.company.code}</div>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded">
                                        <div className="text-sm text-gray-600">Gaji Pokok</div>
                                        <div className="font-semibold">{formatCurrency(previewData.data.salary)}</div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded">
                                        <div className="text-sm text-gray-600">Hari Kerja/Bulan</div>
                                        <div className="font-semibold">{previewData.data.workingDaysInMonth} hari</div>
                                    </div>
                                </div>

                                <div className="border rounded-lg p-4">
                                    <h4 className="font-medium mb-3">Rate Perhitungan</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-sm text-gray-600">Rate Harian</div>
                                            <div className="font-semibold">{formatCurrency(previewData.data.dailyRate)}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Rate Per Jam</div>
                                            <div className="font-semibold">{formatCurrency(previewData.data.hourlyRate)}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Jam Kerja/Hari</div>
                                            <div className="font-semibold">{previewData.data.workSettings?.workHoursPerDay || 8} jam</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border rounded-lg p-4">
                                    <h4 className="font-medium mb-3">Perhitungan Lembur</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span>Lembur Normal ({previewData.data.overtimeInput.overtime1Hours} jam)</span>
                                            <span className="font-semibold">{formatCurrency(previewData.data.overtimeCalculation.overtime1.pay)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Lembur Libur ({previewData.data.overtimeInput.overtime2Hours} jam)</span>
                                            <span className="font-semibold">{formatCurrency(previewData.data.overtimeCalculation.overtime2.pay)}</span>
                                        </div>
                                        <div className="pt-3 border-t flex justify-between items-center">
                                            <span className="font-medium">Total Lembur</span>
                                            <span className="font-semibold text-green-600">{formatCurrency(previewData.data.overtimeCalculation.totalOvertimePay)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600 mb-1">Persentase dari Gaji</div>
                                    <div className="text-lg font-semibold">{previewData.data.summary.overtimeAsPercentageOfSalary}%</div>
                                    <div className="text-xs text-gray-500 mt-1">Total lembur dibandingkan gaji pokok</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderValidationStatus = () => {
        if (!validation) return null;

        return (
            <div className={`p-4 rounded-lg ${validation.valid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-start">
                    {validation.valid ? (
                        <FaCheckCircle className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                    ) : (
                        <FaExclamationTriangle className="text-yellow-500 mt-1 mr-3 flex-shrink-0" />
                    )}
                    <div>
                        <h4 className={`font-medium ${validation.valid ? 'text-green-800' : 'text-yellow-800'}`}>
                            {validation.message}
                        </h4>
                        
                        {validation.issues && validation.issues.length > 0 && (
                            <ul className="mt-2 space-y-1">
                                {validation.issues.map((issue, index) => (
                                    <li key={index} className="text-sm text-yellow-700">• {issue}</li>
                                ))}
                            </ul>
                        )}
                        
                        {validation.warnings && validation.warnings.length > 0 && (
                            <ul className="mt-2 space-y-1">
                                {validation.warnings.map((warning, index) => (
                                    <li key={index} className="text-sm text-blue-700">⚠ {warning}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderSectionContent = () => {
        if (loading && !settings) {
            return (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#005429]"></div>
                </div>
            );
        }

        if (!settings) {
            return (
                <div className="text-center py-10">
                    <p className="text-gray-500">Silakan pilih perusahaan terlebih dahulu</p>
                </div>
            );
        }

        switch (activeSection) {
            case "attendance":
                return renderAttendanceSection();
            case "salaryCalculation":
                return renderSalarySection();
            case "bpjs":
                return renderBpjsSection();
            case "deductions":
                return renderDeductionsSection();
            default:
                return (
                    <div className="text-center py-10">
                        <p className="text-gray-500">Section tidak ditemukan</p>
                    </div>
                );
        }
    };

    return (
        <div className="p-6">
            <ToastContainer position="top-right" autoClose={3000} />
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-xl text-green-900 font-semibold">
                    <FaCog />
                    <span>Pengaturan HR</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleResetAll}
                        disabled={!companyId || saving}
                        className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 disabled:opacity-50"
                    >
                        <FaUndo />
                        Reset Semua
                    </button>
                    <button
                        onClick={handleSaveSettings}
                        disabled={!companyId || saving || !settings}
                        className="flex items-center gap-2 bg-[#005429] text-white px-4 py-2 rounded text-sm hover:bg-[#004020] disabled:opacity-50"
                    >
                        <FaSave />
                        {saving ? "Menyimpan..." : "Simpan Pengaturan"}
                    </button>
                </div>
            </div>

            {/* Company Selector */}
            {renderCompanySelector()}

            {/* Validation Status */}
            {companyId && renderValidationStatus()}

            {/* Section Navigation */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {sections.map(section => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            disabled={!companyId}
                            className={`flex flex-col items-center p-4 rounded-lg transition-all ${
                                isActive 
                                    ? `${section.color} text-white shadow-lg transform scale-105` 
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                            } ${!companyId ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Icon className="text-2xl mb-2" />
                            <span className="text-sm font-medium">{section.name}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {getSectionName(activeSection)}
                    </h3>
                    {companyId && settings && (
                        <button
                            onClick={handleResetSection}
                            disabled={saving}
                            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 disabled:opacity-50"
                        >
                            <FaUndo className="text-xs" />
                            Reset Section
                        </button>
                    )}
                </div>

                {renderSectionContent()}
            </div>

            {/* Settings Summary */}
            {!loading && settings && companyId && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-500 mb-1">Perusahaan</div>
                        <div className="font-semibold truncate">{selectedCompany?.name || "Belum diisi"}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-500 mb-1">Jam Kerja</div>
                        <div className="font-semibold">{settings.attendance?.workHoursPerDay || 8} jam/hari</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-500 mb-1">Rate Lembur</div>
                        <div className="font-semibold">
                            {settings.salaryCalculation?.overtime1Rate || 1.5}x normal, {settings.salaryCalculation?.overtime2Rate || 2.0}x libur
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {renderPreviewModal()}
        </div>
    );
};

export default HRSettingsManagement;