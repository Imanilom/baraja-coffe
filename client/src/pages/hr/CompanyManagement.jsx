import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
    FaBuilding, 
    FaPlus, 
    FaEdit, 
    FaTrash, 
    FaEye, 
    FaCheck, 
    FaTimes,
    FaCog,
    FaCopy,
    FaHistory,
    FaChartBar,
    FaSearch,
    FaFilter,
    FaFileExport,
    FaSync
} from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CompanyManagement = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [filters, setFilters] = useState({
        search: "",
        isActive: "all"
    });
    const [activeTab, setActiveTab] = useState("list"); // list, settings, history
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [settings, setSettings] = useState(null);
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        address: "",
        phone: "",
        email: "",
        taxId: "",
        isActive: true
    });

    // Fetch companies on component mount
    useEffect(() => {
        fetchCompanies();
    }, [filters]);

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.isActive !== "all") params.append('isActive', filters.isActive);

            const response = await axios.get(`/api/hr/companies?${params}`);
            setCompanies(response.data.data || []);
            setError(null);
        } catch (err) {
            console.error("Error fetching companies:", err);
            setError("Gagal memuat data perusahaan");
            toast.error("Gagal memuat data perusahaan");
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanySettings = async (companyId) => {
        try {
            const response = await axios.get(`/api/hr/companies/${companyId}/settings`);
            setSettings(response.data.data);
        } catch (err) {
            console.error("Error fetching company settings:", err);
            toast.error("Gagal memuat pengaturan perusahaan");
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleEditCompany = (company) => {
        setEditingCompany(company);
        setFormData({
            code: company.code,
            name: company.name,
            address: company.address || "",
            phone: company.phone || "",
            email: company.email || "",
            taxId: company.taxId || "",
            isActive: company.isActive
        });
        setShowModal(true);
    };

    const handleViewSettings = async (company) => {
        setSelectedCompany(company);
        setActiveTab("settings");
        await fetchCompanySettings(company._id);
    };

    const handleNewCompany = () => {
        setEditingCompany(null);
        setFormData({
            code: "",
            name: "",
            address: "",
            phone: "",
            email: "",
            taxId: "",
            isActive: true
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.code.trim()) {
            toast.error("Kode perusahaan harus diisi");
            return;
        }
        if (!formData.name.trim()) {
            toast.error("Nama perusahaan harus diisi");
            return;
        }

        try {
            if (editingCompany) {
                // Update existing company
                await axios.put(`/api/hr/companies/${editingCompany._id}`, formData);
                toast.success("Perusahaan berhasil diperbarui");
            } else {
                // Create new company
                await axios.post('/api/hr/companies', formData);
                toast.success("Perusahaan berhasil dibuat");
            }
            
            setShowModal(false);
            fetchCompanies();
        } catch (err) {
            console.error("Error saving company:", err);
            const errorMsg = err.response?.data?.message || "Gagal menyimpan perusahaan";
            toast.error(errorMsg);
        }
    };

    const handleDeactivateCompany = async (company) => {
        if (!window.confirm(`Deaktivasi perusahaan ${company.name}?`)) return;
        
        try {
            await axios.patch(`/api/hr/companies/${company._id}/deactivate`);
            toast.success("Perusahaan berhasil dideaktivasi");
            fetchCompanies();
        } catch (err) {
            console.error("Error deactivating company:", err);
            toast.error("Gagal mendeaktivasi perusahaan");
        }
    };

    const handleActivateCompany = async (company) => {
        if (!window.confirm(`Aktivasi perusahaan ${company.name}?`)) return;
        
        try {
            await axios.patch(`/api/hr/companies/${company._id}/activate`);
            toast.success("Perusahaan berhasil diaktivasi");
            fetchCompanies();
        } catch (err) {
            console.error("Error activating company:", err);
            toast.error("Gagal mengaktivasi perusahaan");
        }
    };

    const handleDuplicateCompany = async (company) => {
        if (!window.confirm(`Duplikasi perusahaan ${company.name}?`)) return;
        
        try {
            const duplicateData = {
                ...company,
                code: `${company.code}_COPY`,
                name: `${company.name} (Copy)`
            };
            delete duplicateData._id;
            delete duplicateData.createdAt;
            delete duplicateData.updatedAt;
            
            await axios.post('/api/hr/companies', duplicateData);
            toast.success("Perusahaan berhasil diduplikasi");
            fetchCompanies();
        } catch (err) {
            console.error("Error duplicating company:", err);
            toast.error("Gagal menduplikasi perusahaan");
        }
    };

    const handleUpdateSettings = async () => {
        if (!selectedCompany) return;
        
        try {
            await axios.put(`/api/hr/companies/${selectedCompany._id}/settings`, settings);
            toast.success("Pengaturan perusahaan berhasil diperbarui");
            fetchCompanySettings(selectedCompany._id);
        } catch (err) {
            console.error("Error updating company settings:", err);
            toast.error("Gagal memperbarui pengaturan");
        }
    };

    const handleExportCompanies = () => {
        // Simple export to CSV
        const headers = ['Kode', 'Nama', 'Alamat', 'Telepon', 'Email', 'NPWP', 'Status', 'Dibuat'];
        const csvData = companies.map(company => [
            company.code,
            company.name,
            company.address,
            company.phone,
            company.email,
            company.taxId,
            company.isActive ? 'Aktif' : 'Nonaktif',
            new Date(company.createdAt).toLocaleDateString('id-ID')
        ]);
        
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `companies_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast.success("Data perusahaan berhasil diexport");
    };

    const renderCompanyList = () => {
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
                        <FaBuilding />
                        <span>Manajemen Perusahaan</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExportCompanies}
                            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                        >
                            <FaFileExport />
                            Export
                        </button>
                        <button
                            onClick={handleNewCompany}
                            className="flex items-center gap-2 bg-[#005429] text-white px-4 py-2 rounded text-sm hover:bg-[#004020]"
                        >
                            <FaPlus />
                            Tambah Perusahaan
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cari Perusahaan</label>
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari kode atau nama..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full border rounded pl-10 pr-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={filters.isActive}
                            onChange={(e) => handleFilterChange('isActive', e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm"
                        >
                            <option value="all">Semua Status</option>
                            <option value="true">Aktif</option>
                            <option value="false">Nonaktif</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={fetchCompanies}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                            <FaSync />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-gray-900">
                            {companies.length}
                        </div>
                        <div className="text-sm text-gray-500">Total Perusahaan</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-green-600">
                            {companies.filter(c => c.isActive).length}
                        </div>
                        <div className="text-sm text-gray-500">Perusahaan Aktif</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-red-600">
                            {companies.filter(c => !c.isActive).length}
                        </div>
                        <div className="text-sm text-gray-500">Perusahaan Nonaktif</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-blue-600">
                            {new Set(companies.map(c => c.code.substring(0, 3))).size}
                        </div>
                        <div className="text-sm text-gray-500">Jenis Kode</div>
                    </div>
                </div>

                {/* Companies Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Perusahaan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontak</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NPWP</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dibuat</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {companies.map(company => (
                                <tr key={company._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{company.code}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{company.name}</div>
                                        <div className="text-sm text-gray-500 truncate max-w-xs">{company.address}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{company.phone}</div>
                                        <div className="text-sm text-gray-500">{company.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {company.taxId || "-"}
                                    </td>
                                    <td className="px-6 py-4">
                                        {company.isActive ? (
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                Aktif
                                            </span>
                                        ) : (
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                Nonaktif
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {new Date(company.createdAt).toLocaleDateString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleViewSettings(company)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Pengaturan"
                                            >
                                                <FaCog />
                                            </button>
                                            <button
                                                onClick={() => handleEditCompany(company)}
                                                className="text-yellow-600 hover:text-yellow-900"
                                                title="Edit"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleDuplicateCompany(company)}
                                                className="text-purple-600 hover:text-purple-900"
                                                title="Duplikat"
                                            >
                                                <FaCopy />
                                            </button>
                                            {company.isActive ? (
                                                <button
                                                    onClick={() => handleDeactivateCompany(company)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Deaktivasi"
                                                >
                                                    <FaTimes />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleActivateCompany(company)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Aktivasi"
                                                >
                                                    <FaCheck />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {companies.length === 0 && !loading && (
                        <div className="text-center py-8 text-gray-500">
                            Tidak ada data perusahaan
                            {filters.search && ` untuk pencarian "${filters.search}"`}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderCompanySettings = () => {
        if (!selectedCompany || !settings) {
            return (
                <div className="flex justify-center items-center h-64">
                    <div className="text-gray-500">Memuat pengaturan...</div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xl text-green-900 font-semibold">
                        <FaCog />
                        <span>Pengaturan Perusahaan</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab("list")}
                            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                        >
                            <FaBuilding />
                            Kembali ke Daftar
                        </button>
                    </div>
                </div>

                {/* Company Info */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {selectedCompany.name} ({selectedCompany.code})
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm text-gray-500">Alamat</div>
                            <div className="font-medium">{selectedCompany.address || "-"}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Telepon</div>
                            <div className="font-medium">{selectedCompany.phone || "-"}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Email</div>
                            <div className="font-medium">{selectedCompany.email || "-"}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">NPWP</div>
                            <div className="font-medium">{selectedCompany.taxId || "-"}</div>
                        </div>
                    </div>
                </div>

                {/* Settings Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Attendance Settings */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h4 className="font-semibold text-gray-900 mb-4">Pengaturan Presensi</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Toleransi Keterlambatan (menit)
                                </label>
                                <input
                                    type="number"
                                    value={settings.attendance?.toleranceLate || 15}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        attendance: { ...prev.attendance, toleranceLate: parseInt(e.target.value) }
                                    }))}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                    min="0"
                                    max="120"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jam Kerja per Hari
                                </label>
                                <input
                                    type="number"
                                    value={settings.attendance?.workHoursPerDay || 8}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        attendance: { ...prev.attendance, workHoursPerDay: parseInt(e.target.value) }
                                    }))}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                    min="1"
                                    max="24"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hari Kerja per Minggu
                                </label>
                                <input
                                    type="number"
                                    value={settings.attendance?.workDaysPerWeek || 6}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        attendance: { ...prev.attendance, workDaysPerWeek: parseInt(e.target.value) }
                                    }))}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                    min="1"
                                    max="7"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Salary Calculation Settings */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h4 className="font-semibold text-gray-900 mb-4">Pengaturan Gaji</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rate Lembur Normal (x)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={settings.salaryCalculation?.overtime1Rate || 1.5}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        salaryCalculation: { ...prev.salaryCalculation, overtime1Rate: parseFloat(e.target.value) }
                                    }))}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                    min="1"
                                    max="5"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rate Lembur Libur (x)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={settings.salaryCalculation?.overtime2Rate || 2.0}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        salaryCalculation: { ...prev.salaryCalculation, overtime2Rate: parseFloat(e.target.value) }
                                    }))}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                    min="1"
                                    max="5"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Maksimal Jam Lembur per Hari
                                </label>
                                <input
                                    type="number"
                                    value={settings.salaryCalculation?.maxOvertimeHours || 4}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        salaryCalculation: { ...prev.salaryCalculation, maxOvertimeHours: parseInt(e.target.value) }
                                    }))}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                    min="0"
                                    max="12"
                                />
                            </div>
                        </div>
                    </div>

                    {/* BPJS Settings */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h4 className="font-semibold text-gray-900 mb-4">Pengaturan BPJS</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Batas Gaji untuk BPJS
                                </label>
                                <input
                                    type="number"
                                    value={settings.bpjs?.maxSalaryBpjs || 12000000}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        bpjs: { ...prev.bpjs, maxSalaryBpjs: parseInt(e.target.value) }
                                    }))}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                    min="1000000"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Rate Kesehatan Karyawan (%)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={settings.bpjs?.kesehatanRateEmployee ? settings.bpjs.kesehatanRateEmployee * 100 : 1}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            bpjs: { ...prev.bpjs, kesehatanRateEmployee: parseFloat(e.target.value) / 100 }
                                        }))}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        min="0"
                                        max="10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Rate Ketenagakerjaan Karyawan (%)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={settings.bpjs?.ketenagakerjaanRateEmployee ? settings.bpjs.ketenagakerjaanRateEmployee * 100 : 2}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            bpjs: { ...prev.bpjs, ketenagakerjaanRateEmployee: parseFloat(e.target.value) / 100 }
                                        }))}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        min="0"
                                        max="10"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Deductions Settings */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h4 className="font-semibold text-gray-900 mb-4">Pengaturan Potongan</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Potongan Human Error
                                </label>
                                <input
                                    type="number"
                                    value={settings.deductions?.humanErrorDeduction || 0}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        deductions: { ...prev.deductions, humanErrorDeduction: parseInt(e.target.value) }
                                    }))}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rate Potongan Absen (x)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={settings.deductions?.absenceDeductionRate || 1}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        deductions: { ...prev.deductions, absenceDeductionRate: parseFloat(e.target.value) }
                                    }))}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                    min="0"
                                    max="2"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleUpdateSettings}
                        className="bg-[#005429] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#004020] flex items-center gap-2"
                    >
                        <FaCog />
                        Simpan Pengaturan
                    </button>
                </div>
            </div>
        );
    };

    const renderModal = () => {
        if (!showModal) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-md w-full">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {editingCompany ? 'Edit Perusahaan' : 'Tambah Perusahaan Baru'}
                        </h3>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kode Perusahaan *
                                </label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                    placeholder="CTH001"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Perusahaan *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                    placeholder="PT. Contoh Indonesia"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Alamat
                                </label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                    rows="2"
                                    placeholder="Jl. Contoh No. 123, Jakarta"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Telepon
                                    </label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        placeholder="021-12345678"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        placeholder="info@contoh.com"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    NPWP
                                </label>
                                <input
                                    type="text"
                                    name="taxId"
                                    value={formData.taxId}
                                    onChange={handleInputChange}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                    placeholder="12.345.678.9-012.345"
                                />
                            </div>
                            
                            {editingCompany && (
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-blue-600 rounded"
                                    />
                                    <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                                        Perusahaan Aktif
                                    </label>
                                </div>
                            )}
                            
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-[#005429] rounded hover:bg-[#004020]"
                                >
                                    {editingCompany ? 'Update' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6">
            <ToastContainer position="top-right" autoClose={3000} />
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            
            {activeTab === "list" ? renderCompanyList() : renderCompanySettings()}
            
            {renderModal()}
        </div>
    );
};

export default CompanyManagement;