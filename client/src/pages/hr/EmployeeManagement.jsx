import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { 
    FaUsers, 
    FaChevronRight, 
    FaSearch, 
    FaEdit, 
    FaTrash, 
    FaPlus,
    FaEye,
    FaMoneyBillWave,
    FaIdCard,
    FaBuilding,
    FaUserTie,
    FaUser,
    FaBriefcase,
    FaUniversity,
    FaGift
} from "react-icons/fa";

const EmployeeManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [users, setUsers] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [activeTab, setActiveTab] = useState('basic');

    const [formData, setFormData] = useState({
        // Basic Information
        user: "",
        employeeId: "",
        nik: "",
        npwp: "",
        bpjsKesehatan: "",
        bpjsKetenagakerjaan: "",
        
        // Employment Information
        position: "",
        department: "",
        joinDate: "",
        employmentStatus: "probation",
        employmentType: "fulltime",
        basicSalary: 0,
        supervisor: "",
        
        // Bank Account
        bankAccount: {
            bankName: "",
            accountNumber: "",
            accountHolder: ""
        },
        
        // Allowances
        allowances: {
            departmental: 0,
            childcare: 0,
            transport: 0,
            meal: 0,
            health: 0,
            other: 0
        }
    });

    const [filters, setFilters] = useState({
        department: "",
        position: "",
        employmentStatus: "",
        employmentType: "",
        isActive: "true",
        search: ""
    });

    const departments = ["HR", "Finance", "IT", "Operations", "Marketing", "Sales"];
    const positions = ["Manager", "Supervisor", "Staff", "Director", "Coordinator"];
    const employmentStatuses = [
        { value: "probation", label: "Probation" },
        { value: "permanent", label: "Permanent" },
        { value: "contract", label: "Contract" },
        { value: "intern", label: "Intern" }
    ];
    const employmentTypes = [
        { value: "fulltime", label: "Full Time" },
        { value: "parttime", label: "Part Time" },
        { value: "freelance", label: "Freelance" }
    ];

    const tabs = [
        { id: 'basic', label: 'Informasi Dasar', icon: FaUser },
        { id: 'employment', label: 'Detail Pekerjaan', icon: FaBriefcase },
        { id: 'bank', label: 'Informasi Bank', icon: FaUniversity },
        { id: 'allowances', label: 'Tunjangan', icon: FaGift }
    ];

    // Fetch data
    const fetchData = async () => {
        setLoading(true);
        try {
            const [employeesRes, usersRes] = await Promise.all([
                axios.get('/api/hr/employees'),
                axios.get('/api/user/staff')
            ]);

            setEmployees(employeesRes.data.data || employeesRes.data);
            setSupervisors(employeesRes.data.data || employeesRes.data);
            
            const usersData = Array.isArray(usersRes.data) 
                ? usersRes.data 
                : usersRes.data?.data || [];
            setUsers(usersData);

            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Gagal memuat data");
        } finally {
            setLoading(false);
        }
    };

    // Fetch employees with filters
    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await axios.get(`/api/hr/employees?${params}`);
            setEmployees(response.data.data || response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching employees:", err);
            setError("Gagal memuat data karyawan");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [filters]);

    // Validasi form
    const validateForm = () => {
        const errors = {};

        // Validasi tab basic
        if (!formData.user) errors.user = "User wajib dipilih";
        if (!formData.employeeId.trim()) errors.employeeId = "Employee ID wajib diisi";
        if (!formData.nik.trim()) errors.nik = "NIK wajib diisi";
        if (formData.nik && !/^\d{16}$/.test(formData.nik)) errors.nik = "NIK harus 16 digit angka";
        if (formData.npwp && !/^\d{15}$/.test(formData.npwp)) errors.npwp = "NPWP harus 15 digit angka";

        // Validasi tab employment
        if (!formData.position.trim()) errors.position = "Posisi wajib diisi";
        if (!formData.department.trim()) errors.department = "Departemen wajib diisi";
        if (!formData.joinDate) errors.joinDate = "Tanggal bergabung wajib diisi";
        if (!formData.basicSalary || formData.basicSalary <= 0) errors.basicSalary = "Gaji pokok harus lebih dari 0";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateCurrentTab = () => {
        const errors = {};

        switch (activeTab) {
            case 'basic':
                if (!formData.user) errors.user = "User wajib dipilih";
                if (!formData.employeeId.trim()) errors.employeeId = "Employee ID wajib diisi";
                if (!formData.nik.trim()) errors.nik = "NIK wajib diisi";
                if (formData.nik && !/^\d{16}$/.test(formData.nik)) errors.nik = "NIK harus 16 digit angka";
                if (formData.npwp && !/^\d{15}$/.test(formData.npwp)) errors.npwp = "NPWP harus 15 digit angka";
                break;
            case 'employment':
                if (!formData.position.trim()) errors.position = "Posisi wajib diisi";
                if (!formData.department.trim()) errors.department = "Departemen wajib diisi";
                if (!formData.joinDate) errors.joinDate = "Tanggal bergabung wajib diisi";
                if (!formData.basicSalary || formData.basicSalary <= 0) errors.basicSalary = "Gaji pokok harus lebih dari 0";
                break;
            case 'bank':
                if (formData.bankAccount.accountNumber && !formData.bankAccount.bankName) {
                    errors.bankName = "Nama bank wajib diisi jika nomor rekening diisi";
                }
                if (formData.bankAccount.bankName && !formData.bankAccount.accountNumber) {
                    errors.accountNumber = "Nomor rekening wajib diisi jika nama bank diisi";
                }
                break;
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const handleNestedChange = (category, field, value) => {
        setFormData(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: value
            }
        }));
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    const handleNextTab = () => {
        if (!validateCurrentTab()) {
            alert("Harap lengkapi data yang wajib diisi sebelum melanjutkan!");
            return;
        }

        const currentIndex = tabs.findIndex(t => t.id === activeTab);
        if (currentIndex < tabs.length - 1) {
            setActiveTab(tabs[currentIndex + 1].id);
        }
    };

    const handlePreviousTab = () => {
        const currentIndex = tabs.findIndex(t => t.id === activeTab);
        if (currentIndex > 0) {
            setActiveTab(tabs[currentIndex - 1].id);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            alert("Harap lengkapi semua data yang wajib diisi!");
            return;
        }

        try {
            if (selectedEmployee) {
                await axios.put(`/api/hr/employees/${selectedEmployee._id}`, formData);
            } else {
                await axios.post('/api/hr/employees', formData);
            }
            setShowModal(false);
            resetForm();
            fetchEmployees();
        } catch (err) {
            console.error("Error saving employee:", err);
            setError("Gagal menyimpan data karyawan");
        }
    };

    const handleEdit = (employee) => {
        setSelectedEmployee(employee);
        setFormData({
            user: employee.user?._id || "",
            employeeId: employee.employeeId,
            nik: employee.nik,
            npwp: employee.npwp || "",
            bpjsKesehatan: employee.bpjsKesehatan || "",
            bpjsKetenagakerjaan: employee.bpjsKetenagakerjaan || "",
            position: employee.position,
            department: employee.department,
            joinDate: employee.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : "",
            employmentStatus: employee.employmentStatus,
            employmentType: employee.employmentType,
            basicSalary: employee.basicSalary,
            supervisor: employee.supervisor?._id || "",
            bankAccount: employee.bankAccount || {
                bankName: "",
                accountNumber: "",
                accountHolder: ""
            },
            allowances: employee.allowances || {
                departmental: 0,
                childcare: 0,
                transport: 0,
                meal: 0,
                health: 0,
                other: 0
            }
        });
        setActiveTab('basic');
        setFormErrors({});
        setShowModal(true);
    };

    const handleDeactivate = async (employeeId) => {
        if (window.confirm("Apakah Anda yakin ingin menonaktifkan karyawan ini?")) {
            try {
                await axios.patch(`/api/hr/employees/${employeeId}/deactivate`);
                fetchEmployees();
            } catch (err) {
                console.error("Error deactivating employee:", err);
                setError("Gagal menonaktifkan karyawan");
            }
        }
    };

    const resetForm = () => {
        setFormData({
            user: "",
            employeeId: "",
            nik: "",
            npwp: "",
            bpjsKesehatan: "",
            bpjsKetenagakerjaan: "",
            position: "",
            department: "",
            joinDate: "",
            employmentStatus: "probation",
            employmentType: "fulltime",
            basicSalary: 0,
            supervisor: "",
            bankAccount: {
                bankName: "",
                accountNumber: "",
                accountHolder: ""
            },
            allowances: {
                departmental: 0,
                childcare: 0,
                transport: 0,
                meal: 0,
                health: 0,
                other: 0
            }
        });
        setFormErrors({});
        setSelectedEmployee(null);
        setActiveTab('basic');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#005429]"></div></div>;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-xl text-green-900 font-semibold">
                    <FaUsers />
                    <span>Manajemen Karyawan</span>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-[#005429] text-white px-4 py-2 rounded text-sm"
                >
                    <FaPlus />
                    Tambah Karyawan
                </button>
            </div>

            {/* Filters - tetap sama */}
            <div className="grid grid-cols-6 gap-4 mb-6 p-4 bg-white rounded-lg shadow">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departemen</label>
                    <select
                        value={filters.department}
                        onChange={(e) => handleFilterChange('department', e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                    >
                        <option value="">Semua</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Posisi</label>
                    <select
                        value={filters.position}
                        onChange={(e) => handleFilterChange('position', e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                    >
                        <option value="">Semua</option>
                        {positions.map(pos => (
                            <option key={pos} value={pos}>{pos}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        value={filters.employmentStatus}
                        onChange={(e) => handleFilterChange('employmentStatus', e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                    >
                        <option value="">Semua</option>
                        {employmentStatuses.map(status => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                    <select
                        value={filters.employmentType}
                        onChange={(e) => handleFilterChange('employmentType', e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                    >
                        <option value="">Semua</option>
                        {employmentTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Aktif</label>
                    <select
                        value={filters.isActive}
                        onChange={(e) => handleFilterChange('isActive', e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                    >
                        <option value="true">Aktif</option>
                        <option value="false">Nonaktif</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cari</label>
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari karyawan..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full border rounded pl-10 pr-3 py-2 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Employee Table - tetap sama */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Karyawan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posisi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departemen</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gaji</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {employees.map(employee => (
                            <tr key={employee._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                            <FaUserTie className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {employee.user?.username || 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {employee.employeeId}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                        {employee.position}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">{employee.department}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        employee.isActive 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {employee.isActive ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {formatCurrency(employee.basicSalary)}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(employee)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDeactivate(employee._id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Enhanced Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">
                                {selectedEmployee ? 'Edit Karyawan' : 'Tambah Karyawan'}
                            </h3>
                            
                            {/* Tab Navigation */}
                            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all whitespace-nowrap ${
                                                activeTab === tab.id
                                                    ? 'text-[#005429] border-b-2 border-[#005429]'
                                                    : 'text-gray-600 hover:text-gray-800'
                                            }`}
                                        >
                                            <Icon className="text-lg" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <form onSubmit={handleSubmit}>
                                {/* Basic Information Tab */}
                                {activeTab === 'basic' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    User <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="user"
                                                    value={formData.user}
                                                    onChange={handleInputChange}
                                                    className={`mt-1 block w-full border rounded px-3 py-2 text-sm ${
                                                        formErrors.user ? 'border-red-500' : ''
                                                    }`}
                                                    required
                                                >
                                                    <option value="">Pilih User</option>
                                                    {users.map(user => (
                                                        <option key={user._id} value={user._id}>
                                                            {user.username} ({user.email})
                                                        </option>
                                                    ))}
                                                </select>
                                                {formErrors.user && (
                                                    <p className="text-red-500 text-xs mt-1">{formErrors.user}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Employee ID <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="employeeId"
                                                    value={formData.employeeId}
                                                    onChange={handleInputChange}
                                                    className={`mt-1 block w-full border rounded px-3 py-2 text-sm ${
                                                        formErrors.employeeId ? 'border-red-500' : ''
                                                    }`}
                                                    required
                                                />
                                                {formErrors.employeeId && (
                                                    <p className="text-red-500 text-xs mt-1">{formErrors.employeeId}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    NIK <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="nik"
                                                    value={formData.nik}
                                                    onChange={handleInputChange}
                                                    className={`mt-1 block w-full border rounded px-3 py-2 text-sm ${
                                                        formErrors.nik ? 'border-red-500' : ''
                                                    }`}
                                                    required
                                                    maxLength="16"
                                                />
                                                {formErrors.nik && (
                                                    <p className="text-red-500 text-xs mt-1">{formErrors.nik}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    NPWP
                                                </label>
                                                <input
                                                    type="text"
                                                    name="npwp"
                                                    value={formData.npwp}
                                                    onChange={handleInputChange}
                                                    className={`mt-1 block w-full border rounded px-3 py-2 text-sm ${
                                                        formErrors.npwp ? 'border-red-500' : ''
                                                    }`}
                                                    maxLength="15"
                                                />
                                                {formErrors.npwp && (
                                                    <p className="text-red-500 text-xs mt-1">{formErrors.npwp}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    BPJS Kesehatan
                                                </label>
                                                <input
                                                    type="text"
                                                    name="bpjsKesehatan"
                                                    value={formData.bpjsKesehatan}
                                                    onChange={handleInputChange}
                                                    className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    BPJS Ketenagakerjaan
                                                </label>
                                                <input
                                                    type="text"
                                                    name="bpjsKetenagakerjaan"
                                                    value={formData.bpjsKetenagakerjaan}
                                                    onChange={handleInputChange}
                                                    className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Employment Details Tab */}
                                {activeTab === 'employment' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Posisi <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="position"
                                                    value={formData.position}
                                                    onChange={handleInputChange}
                                                    className={`mt-1 block w-full border rounded px-3 py-2 text-sm ${
                                                        formErrors.position ? 'border-red-500' : ''
                                                    }`}
                                                    required
                                                />
                                                {formErrors.position && (
                                                    <p className="text-red-500 text-xs mt-1">{formErrors.position}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Departemen <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="department"
                                                    value={formData.department}
                                                    onChange={handleInputChange}
                                                    className={`mt-1 block w-full border rounded px-3 py-2 text-sm ${
                                                        formErrors.department ? 'border-red-500' : ''
                                                    }`}
                                                    required
                                                >
                                                    <option value="">Pilih Departemen</option>
                                                    {departments.map(dept => (
                                                        <option key={dept} value={dept}>{dept}</option>
                                                    ))}
                                                </select>
                                                {formErrors.department && (
                                                    <p className="text-red-500 text-xs mt-1">{formErrors.department}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Tanggal Bergabung <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    name="joinDate"
                                                    value={formData.joinDate}
                                                    onChange={handleInputChange}
                                                    className={`mt-1 block w-full border rounded px-3 py-2 text-sm ${
                                                        formErrors.joinDate ? 'border-red-500' : ''
                                                    }`}
                                                    required
                                                />
                                                {formErrors.joinDate && (
                                                    <p className="text-red-500 text-xs mt-1">{formErrors.joinDate}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Status Kepegawaian <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="employmentStatus"
                                                    value={formData.employmentStatus}
                                                    onChange={handleInputChange}
                                                    className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                                    required
                                                >
                                                    {employmentStatuses.map(status => (
                                                        <option key={status.value} value={status.value}>
                                                            {status.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Tipe Kepegawaian <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="employmentType"
                                                    value={formData.employmentType}
                                                    onChange={handleInputChange}
                                                    className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                                    required
                                                >
                                                    {employmentTypes.map(type => (
                                                        <option key={type.value} value={type.value}>
                                                            {type.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Gaji Pokok <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    name="basicSalary"
                                                    value={formData.basicSalary}
                                                    onChange={handleInputChange}
                                                    className={`mt-1 block w-full border rounded px-3 py-2 text-sm ${
                                                        formErrors.basicSalary ? 'border-red-500' : ''
                                                    }`}
                                                    required
                                                    min="0"
                                                />
                                                {formErrors.basicSalary && (
                                                    <p className="text-red-500 text-xs mt-1">{formErrors.basicSalary}</p>
                                                )}
                                                {formData.basicSalary > 0 && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {formatCurrency(formData.basicSalary)}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Supervisor
                                                </label>
                                                <select
                                                    name="supervisor"
                                                    value={formData.supervisor}
                                                    onChange={handleInputChange}
                                                    className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                                >
                                                    <option value="">Pilih Supervisor</option>
                                                    {supervisors.map(emp => (
                                                        <option key={emp._id} value={emp._id}>
                                                            {emp.employeeId} - {emp.position}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Bank Account Tab */}
                                {activeTab === 'bank' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Nama Bank
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.bankAccount.bankName}
                                                    onChange={(e) => handleNestedChange('bankAccount', 'bankName', e.target.value)}
                                                    className={`mt-1 block w-full border rounded px-3 py-2 text-sm ${
                                                        formErrors.bankName ? 'border-red-500' : ''
                                                    }`}
                                                />
                                                {formErrors.bankName && (
                                                    <p className="text-red-500 text-xs mt-1">{formErrors.bankName}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Nomor Rekening
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.bankAccount.accountNumber}
                                                    onChange={(e) => handleNestedChange('bankAccount', 'accountNumber', e.target.value)}
                                                    className={`mt-1 block w-full border rounded px-3 py-2 text-sm ${
                                                        formErrors.accountNumber ? 'border-red-500' : ''
                                                    }`}
                                                />
                                                {formErrors.accountNumber && (
                                                    <p className="text-red-500 text-xs mt-1">{formErrors.accountNumber}</p>
                                                )}
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Nama Pemegang Rekening
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.bankAccount.accountHolder}
                                                    onChange={(e) => handleNestedChange('bankAccount', 'accountHolder', e.target.value)}
                                                    className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Allowances Tab */}
                                {activeTab === 'allowances' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Tunjangan Jabatan
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.allowances.departmental}
                                                    onChange={(e) => handleNestedChange('allowances', 'departmental', Number(e.target.value))}
                                                    className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                                    min="0"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Tunjangan Anak
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.allowances.childcare}
                                                    onChange={(e) => handleNestedChange('allowances', 'childcare', Number(e.target.value))}
                                                    className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                                    min="0"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Tunjangan Transport
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.allowances.transport}
                                                    onChange={(e) => handleNestedChange('allowances', 'transport', Number(e.target.value))}
                                                    className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                                    min="0"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Tunjangan Makan
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.allowances.meal}
                                                    onChange={(e) => handleNestedChange('allowances', 'meal', Number(e.target.value))}
                                                    className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                                    min="0"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Tunjangan Kesehatan
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.allowances.health}
                                                    onChange={(e) => handleNestedChange('allowances', 'health', Number(e.target.value))}
                                                    className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                                    min="0"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Tunjangan Lainnya
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.allowances.other}
                                                    onChange={(e) => handleNestedChange('allowances', 'other', Number(e.target.value))}
                                                    className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-gray-700">Total Tunjangan:</span>
                                                <span className="font-bold text-green-600">
                                                    {formatCurrency(
                                                        formData.allowances.departmental +
                                                        formData.allowances.childcare +
                                                        formData.allowances.transport +
                                                        formData.allowances.meal +
                                                        formData.allowances.health +
                                                        formData.allowances.other
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex justify-between items-center pt-6 border-t mt-6">
                                    <div className="text-sm text-gray-600">
                                        Langkah {tabs.findIndex(t => t.id === activeTab) + 1} dari {tabs.length}
                                    </div>
                                    <div className="flex space-x-3">
                                        {activeTab !== 'basic' && (
                                            <button
                                                type="button"
                                                onClick={handlePreviousTab}
                                                className="px-4 py-2 text-sm border rounded text-gray-700 hover:bg-gray-50"
                                            >
                                                Sebelumnya
                                            </button>
                                        )}
                                        {activeTab !== 'allowances' && (
                                            <button
                                                type="button"
                                                onClick={handleNextTab}
                                                className="px-4 py-2 text-sm bg-[#005429] text-white rounded hover:bg-[#004225]"
                                            >
                                                Selanjutnya
                                            </button>
                                        )}
                                        {activeTab === 'allowances' && (
                                            <button
                                                type="submit"
                                                className="px-4 py-2 text-sm bg-[#005429] text-white rounded hover:bg-[#004225]"
                                            >
                                                {selectedEmployee ? 'Update' : 'Simpan'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeManagement;