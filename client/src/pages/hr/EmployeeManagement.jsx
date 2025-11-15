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
    FaUserTie
} from "react-icons/fa";
import Select from "react-select";

const EmployeeManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [formData, setFormData] = useState({
        userId: "",
        employeeId: "",
        nik: "",
        npwp: "",
        bpjsKesehatan: "",
        bpjsKetenagakerjaan: "",
        position: "",
        department: "",
        joinDate: "",
        employmentStatus: "permanent",
        employmentType: "fulltime",
        basicSalary: 0,
        bankAccount: "",
        supervisor: ""
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
        { value: "permanent", label: "Permanent" },
        { value: "contract", label: "Contract" },
        { value: "probation", label: "Probation" }
    ];
    const employmentTypes = [
        { value: "fulltime", label: "Full Time" },
        { value: "parttime", label: "Part Time" },
        { value: "freelance", label: "Freelance" }
    ];

    // Fetch employees
    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await axios.get(`/api/hr/employees?${params}`);
            setEmployees(response.data.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching employees:", err);
            setError("Gagal memuat data karyawan");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedEmployee) {
                await axios.put(`/api/hr/employees/${selectedEmployee._id}`, formData);
            } else {
                await axios.post('/api/hr/employees', formData);
            }
            setShowModal(false);
            setSelectedEmployee(null);
            setFormData({
                userId: "", employeeId: "", nik: "", npwp: "", bpjsKesehatan: "", 
                bpjsKetenagakerjaan: "", position: "", department: "", joinDate: "",
                employmentStatus: "permanent", employmentType: "fulltime", basicSalary: 0,
                bankAccount: "", supervisor: ""
            });
            fetchEmployees();
        } catch (err) {
            console.error("Error saving employee:", err);
            setError("Gagal menyimpan data karyawan");
        }
    };

    const handleEdit = (employee) => {
        setSelectedEmployee(employee);
        setFormData({
            userId: employee.user?._id || "",
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
            bankAccount: employee.bankAccount || "",
            supervisor: employee.supervisor?._id || ""
        });
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

            {/* Filters */}
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

            {/* Employee Table */}
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

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">
                                {selectedEmployee ? 'Edit Karyawan' : 'Tambah Karyawan'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                                        <input
                                            type="text"
                                            name="employeeId"
                                            value={formData.employeeId}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">NIK</label>
                                        <input
                                            type="text"
                                            name="nik"
                                            value={formData.nik}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Posisi</label>
                                        <input
                                            type="text"
                                            name="position"
                                            value={formData.position}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Departemen</label>
                                        <select
                                            name="department"
                                            value={formData.department}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                            required
                                        >
                                            <option value="">Pilih Departemen</option>
                                            {departments.map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Gaji Pokok</label>
                                        <input
                                            type="number"
                                            name="basicSalary"
                                            value={formData.basicSalary}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Tanggal Bergabung</label>
                                        <input
                                            type="date"
                                            name="joinDate"
                                            value={formData.joinDate}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setSelectedEmployee(null);
                                        }}
                                        className="px-4 py-2 text-sm border rounded text-gray-700 hover:bg-gray-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm bg-[#005429] text-white rounded hover:bg-[#004225]"
                                    >
                                        {selectedEmployee ? 'Update' : 'Simpan'}
                                    </button>
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