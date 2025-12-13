import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { FaChevronRight, FaUser, FaBriefcase, FaUniversity, FaMoneyBillWave, FaGift, FaIdCard } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

const CreateEmployee = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [activeTab, setActiveTab] = useState('basic');

    const [formData, setFormData] = useState({
        userId: '',
        employeeId: '',
        nik: '',
        npwp: '',
        bpjsKesehatan: '',
        bpjsKetenagakerjaan: '',
        position: '',
        department: '',
        joinDate: '',
        employmentStatus: 'permanent',
        employmentType: 'fulltime',
        basicSalary: 0,
        supervisor: null,
        bankAccount: {
            bankName: '',
            accountNumber: '',
            accountHolder: ''
        },
        deductions: {
            bpjsKesehatanEmployee: 0,
            bpjsKesehatanEmployer: 0,
            bpjsKetenagakerjaanEmployee: 0,
            bpjsKetenagakerjaanEmployer: 0,
            tax: 0,
            other: 0
        },
        allowances: {
            childcare: 0,
            departmental: 0,
            housing: 0,
            transport: 0,
            meal: 0,
            health: 0,
            other: 0
        }
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const usersResponse = await axios.get('/api/user/staff');
            const usersData = Array.isArray(usersResponse.data)
                ? usersResponse.data
                : usersResponse.data?.data || [];
            setUsers(usersData);

            const employeesResponse = await axios.get('/api/hr/employees');
            const employeesData = Array.isArray(employeesResponse.data)
                ? employeesResponse.data
                : employeesResponse.data?.data || [];
            setSupervisors(employeesData);

            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Gagal memuat data. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNestedChange = (category, field, value) => {
        setFormData(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // // Validasi: Pastikan di tab terakhir sebelum submit
        // console.log('Submit triggered!');
        // console.log('Active tab:', activeTab);
        // console.log('Should submit?', activeTab === 'allowances');

        // // Validasi: Pastikan di tab terakhir sebelum submit
        // if (activeTab !== 'allowances') {
        //     console.log('Not in allowances tab, blocking submit');
        //     return;
        // }

        // console.log('Proceeding with actual submit...');
        setLoading(true);

        try {
            const response = await axios.post('/api/hr/employees', formData);

            if (response.status === 201) {
                alert('Karyawan berhasil ditambahkan!');
                navigate('/admin/employee');
            }
        } catch (err) {
            console.error("Error creating employee:", err);
            alert(err.response?.data?.message || 'Gagal menambahkan karyawan');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    const tabs = [
        { id: 'basic', label: 'Informasi Dasar', icon: FaUser },
        { id: 'employment', label: 'Detail Pekerjaan', icon: FaBriefcase },
        { id: 'bank', label: 'Informasi Bank', icon: FaUniversity },
        { id: 'deductions', label: 'Potongan', icon: FaMoneyBillWave },
        { id: 'allowances', label: 'Tunjangan', icon: FaGift }
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#005429] mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Memuat data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
                    <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </div>
                    <p className="text-xl font-semibold text-gray-800 mb-2">Terjadi Kesalahan</p>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={fetchData}
                        className="bg-[#005429] text-white px-6 py-2.5 rounded-lg hover:bg-[#00642f] transition-colors font-medium"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                    {/* Header Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="flex gap-2 items-center text-sm text-gray-500 mb-2">
                                    <Link to="/admin/employee" className="hover:text-[#005429] transition-colors">Karyawan</Link>
                                    <FaChevronRight className="text-xs" />
                                    <span className="text-gray-700 font-medium">Tambah Karyawan Baru</span>
                                </div>
                                <h1 className="text-2xl font-bold text-gray-800">Form Data Karyawan</h1>
                                <p className="text-sm text-gray-500 mt-1">Lengkapi semua informasi karyawan dengan teliti</p>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="flex border-b border-gray-200 overflow-x-auto">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-6 py-4 font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                            ? 'text-[#005429] border-b-3 border-[#005429] bg-green-50'
                                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon className={`text-lg ${activeTab === tab.id ? 'text-[#005429]' : 'text-gray-400'}`} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tab Content */}
                        <div className="p-8">
                            {/* Basic Information Tab */}
                            {activeTab === 'basic' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="bg-[#005429] p-3 rounded-lg">
                                            <FaIdCard className="text-white text-xl" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">Informasi Dasar Karyawan</h2>
                                            <p className="text-sm text-gray-500">Data identitas dan informasi personal</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Pilih User <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="userId"
                                                value={formData.userId}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                            >
                                                <option value="">-- Pilih User --</option>
                                                {users.map(user => (
                                                    <option key={user._id} value={user._id}>
                                                        {user.username} ({user.email})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Employee ID <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="employeeId"
                                                value={formData.employeeId}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Contoh: EMP001"
                                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                NIK (Nomor Induk Kependudukan) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="nik"
                                                value={formData.nik}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="16 digit NIK"
                                                maxLength="16"
                                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                NPWP (Nomor Pokok Wajib Pajak)
                                            </label>
                                            <input
                                                type="text"
                                                name="npwp"
                                                value={formData.npwp}
                                                onChange={handleInputChange}
                                                placeholder="15 digit NPWP"
                                                maxLength="15"
                                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Nomor BPJS Kesehatan
                                            </label>
                                            <input
                                                type="text"
                                                name="bpjsKesehatan"
                                                value={formData.bpjsKesehatan}
                                                onChange={handleInputChange}
                                                placeholder="Nomor BPJS Kesehatan"
                                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Nomor BPJS Ketenagakerjaan
                                            </label>
                                            <input
                                                type="text"
                                                name="bpjsKetenagakerjaan"
                                                value={formData.bpjsKetenagakerjaan}
                                                onChange={handleInputChange}
                                                placeholder="Nomor BPJS Ketenagakerjaan"
                                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Employment Details Tab */}
                            {activeTab === 'employment' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="bg-[#005429] p-3 rounded-lg">
                                            <FaBriefcase className="text-white text-xl" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">Detail Pekerjaan</h2>
                                            <p className="text-sm text-gray-500">Informasi posisi dan status kepegawaian</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Posisi / Jabatan <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="position"
                                                value={formData.position}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Contoh: HR Manager"
                                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Departemen <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="department"
                                                value={formData.department}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Contoh: Human Resources"
                                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Tanggal Bergabung <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="joinDate"
                                                value={formData.joinDate}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Status Kepegawaian <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="employmentStatus"
                                                value={formData.employmentStatus}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                            >
                                                <option value="permanent">Karyawan Tetap</option>
                                                <option value="contract">Karyawan Kontrak</option>
                                                <option value="probation">Masa Probasi</option>
                                                <option value="internship">Magang</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Tipe Kepegawaian <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="employmentType"
                                                value={formData.employmentType}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                            >
                                                <option value="full-time">Full Time</option>
                                                <option value="part-time">Part Time</option>
                                                <option value="freelance">Freelance</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Gaji Pokok <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3.5 text-gray-500 font-medium">Rp</span>
                                                <input
                                                    type="number"
                                                    name="basicSalary"
                                                    value={formData.basicSalary}
                                                    onChange={handleInputChange}
                                                    required
                                                    placeholder="0"
                                                    className="w-full border-2 border-gray-200 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                                />
                                            </div>
                                            {formData.basicSalary > 0 && (
                                                <p className="text-sm text-gray-500 mt-1">{formatCurrency(formData.basicSalary)}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Supervisor / Atasan
                                            </label>
                                            <select
                                                name="supervisor"
                                                value={formData.supervisor}
                                                onChange={handleInputChange}
                                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                            >
                                                <option value="">-- Pilih Supervisor --</option>
                                                {supervisors.map(emp => (
                                                    <option key={emp._id} value={emp._id}>
                                                        {emp.user?.name || emp.employeeId} - {emp.position}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bank Account Tab */}
                            {activeTab === 'bank' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="bg-[#005429] p-3 rounded-lg">
                                            <FaUniversity className="text-white text-xl" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">Informasi Rekening Bank</h2>
                                            <p className="text-sm text-gray-500">Data rekening untuk pembayaran gaji</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Nama Bank
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.bankAccount.bankName}
                                                onChange={(e) => handleNestedChange('bankAccount', 'bankName', e.target.value)}
                                                placeholder="Contoh: Bank Mandiri"
                                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Nomor Rekening
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.bankAccount.accountNumber}
                                                onChange={(e) => handleNestedChange('bankAccount', 'accountNumber', e.target.value)}
                                                placeholder="Nomor rekening bank"
                                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Nama Pemegang Rekening
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.bankAccount.accountHolder}
                                                onChange={(e) => handleNestedChange('bankAccount', 'accountHolder', e.target.value)}
                                                placeholder="Nama sesuai buku rekening"
                                                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-blue-700">
                                                    Pastikan data rekening bank sesuai dengan dokumen resmi untuk menghindari kesalahan transfer gaji.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Deductions Tab */}
                            {activeTab === 'deductions' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="bg-[#005429] p-3 rounded-lg">
                                            <FaMoneyBillWave className="text-white text-xl" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">Potongan Gaji</h2>
                                            <p className="text-sm text-gray-500">Iuran BPJS dan potongan lainnya</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-r from-blue-50 to-sky-50 p-4 rounded-lg border border-blue-200">
                                            <h3 className="font-semibold text-gray-800 mb-3">BPJS Ketenagakerjaan</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700">Iuran Karyawan</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-3 text-gray-500">Rp</span>
                                                        <input
                                                            type="number"
                                                            value={formData.deductions.bpjsKetenagakerjaanEmployee}
                                                            onChange={(e) => handleNestedChange('deductions', 'bpjsKetenagakerjaanEmployee', Number(e.target.value))}
                                                            placeholder="0"
                                                            className="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700">Iuran Perusahaan</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-3 text-gray-500">Rp</span>
                                                        <input
                                                            type="number"
                                                            value={formData.deductions.bpjsKetenagakerjaanEmployer}
                                                            onChange={(e) => handleNestedChange('deductions', 'bpjsKetenagakerjaanEmployer', Number(e.target.value))}
                                                            placeholder="0"
                                                            className="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200">
                                            <h3 className="font-semibold text-gray-800 mb-3">Potongan Lainnya</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700">Pajak Penghasilan (PPh 21)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-3 text-gray-500">Rp</span>
                                                        <input
                                                            type="number"
                                                            value={formData.deductions.tax}
                                                            onChange={(e) => handleNestedChange('deductions', 'tax', Number(e.target.value))}
                                                            placeholder="0"
                                                            className="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700">Potongan Lain</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-3 text-gray-500">Rp</span>
                                                        <input
                                                            type="number"
                                                            value={formData.deductions.other}
                                                            onChange={(e) => handleNestedChange('deductions', 'other', Number(e.target.value))}
                                                            placeholder="0"
                                                            className="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-gray-700">Total Potongan</span>
                                                <span className="text-xl font-bold text-red-600">
                                                    {formatCurrency(
                                                        formData.deductions.bpjsKesehatanEmployee +
                                                        formData.deductions.bpjsKesehatanEmployer +
                                                        formData.deductions.bpjsKetenagakerjaanEmployee +
                                                        formData.deductions.bpjsKetenagakerjaanEmployer +
                                                        formData.deductions.tax +
                                                        formData.deductions.other
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Allowances Tab */}
                            {activeTab === 'allowances' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="bg-[#005429] p-3 rounded-lg">
                                            <FaGift className="text-white text-xl" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">Tunjangan Karyawan</h2>
                                            <p className="text-sm text-gray-500">Benefit dan fasilitas tambahan</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Tunjangan Anak
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3.5 text-gray-500 font-medium">Rp</span>
                                                <input
                                                    type="number"
                                                    value={formData.allowances.childcare}
                                                    onChange={(e) => handleNestedChange('allowances', 'childcare', Number(e.target.value))}
                                                    placeholder="0"
                                                    className="w-full border-2 border-gray-200 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Tunjangan Departemen
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3.5 text-gray-500 font-medium">Rp</span>
                                                <input
                                                    type="number"
                                                    value={formData.allowances.departmental}
                                                    onChange={(e) => handleNestedChange('allowances', 'departmental', Number(e.target.value))}
                                                    placeholder="0"
                                                    className="w-full border-2 border-gray-200 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Tunjangan Perumahan
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3.5 text-gray-500 font-medium">Rp</span>
                                                <input
                                                    type="number"
                                                    value={formData.allowances.housing}
                                                    onChange={(e) => handleNestedChange('allowances', 'housing', Number(e.target.value))}
                                                    placeholder="0"
                                                    className="w-full border-2 border-gray-200 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Tunjangan Transport
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3.5 text-gray-500 font-medium">Rp</span>
                                                <input
                                                    type="number"
                                                    value={formData.allowances.transport}
                                                    onChange={(e) => handleNestedChange('allowances', 'transport', Number(e.target.value))}
                                                    placeholder="0"
                                                    className="w-full border-2 border-gray-200 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Tunjangan Makan
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3.5 text-gray-500 font-medium">Rp</span>
                                                <input
                                                    type="number"
                                                    value={formData.allowances.meal}
                                                    onChange={(e) => handleNestedChange('allowances', 'meal', Number(e.target.value))}
                                                    placeholder="0"
                                                    className="w-full border-2 border-gray-200 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Tunjangan Kesehatan
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3.5 text-gray-500 font-medium">Rp</span>
                                                <input
                                                    type="number"
                                                    value={formData.allowances.health}
                                                    onChange={(e) => handleNestedChange('allowances', 'health', Number(e.target.value))}
                                                    placeholder="0"
                                                    className="w-full border-2 border-gray-200 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Tunjangan Lainnya
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3.5 text-gray-500 font-medium">Rp</span>
                                                <input
                                                    type="number"
                                                    value={formData.allowances.other}
                                                    onChange={(e) => handleNestedChange('allowances', 'other', Number(e.target.value))}
                                                    placeholder="0"
                                                    className="w-full border-2 border-gray-200 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-[#005429] focus:ring-2 focus:ring-green-100 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-lg font-semibold text-gray-700">Total Tunjangan</span>
                                            <span className="text-2xl font-bold text-green-600">
                                                {formatCurrency(
                                                    formData.allowances.childcare +
                                                    formData.allowances.departmental +
                                                    formData.allowances.housing +
                                                    formData.allowances.transport +
                                                    formData.allowances.meal +
                                                    formData.allowances.health +
                                                    formData.allowances.other
                                                )}
                                            </span>
                                        </div>
                                        <div className="border-t border-green-300 pt-4">
                                            <div className="flex justify-between items-center text-sm mb-2">
                                                <span className="text-gray-600">Gaji Pokok</span>
                                                <span className="font-medium">{formatCurrency(Number(formData.basicSalary) || 0)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm mb-2">
                                                <span className="text-gray-600">Total Tunjangan</span>
                                                <span className="font-medium text-green-600">
                                                    + {formatCurrency(
                                                        Number(formData.allowances.childcare || 0) +
                                                        Number(formData.allowances.departmental || 0) +
                                                        Number(formData.allowances.housing || 0) +
                                                        Number(formData.allowances.transport || 0) +
                                                        Number(formData.allowances.meal || 0) +
                                                        Number(formData.allowances.health || 0) +
                                                        Number(formData.allowances.other || 0)
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm mb-3">
                                                <span className="text-gray-600">Total Potongan</span>
                                                <span className="font-medium text-red-600">
                                                    - {formatCurrency(
                                                        Number(formData.deductions.bpjsKesehatanEmployee || 0) +
                                                        Number(formData.deductions.bpjsKetenagakerjaanEmployee || 0) +
                                                        Number(formData.deductions.tax || 0) +
                                                        Number(formData.deductions.other || 0)
                                                    )}
                                                </span>
                                            </div>
                                            <div className="border-t-2 border-green-400 pt-3 flex justify-between items-center">
                                                <span className="text-lg font-bold text-gray-800">Gaji Bersih (Take Home Pay)</span>
                                                <span className="text-2xl font-bold text-green-700">
                                                    {formatCurrency(
                                                        Number(formData.basicSalary || 0) +
                                                        (Number(formData.allowances.childcare || 0) +
                                                            Number(formData.allowances.departmental || 0) +
                                                            Number(formData.allowances.housing || 0) +
                                                            Number(formData.allowances.transport || 0) +
                                                            Number(formData.allowances.meal || 0) +
                                                            Number(formData.allowances.health || 0) +
                                                            Number(formData.allowances.other || 0)) -
                                                        (Number(formData.deductions.bpjsKesehatanEmployee || 0) +
                                                            Number(formData.deductions.bpjsKetenagakerjaanEmployee || 0) +
                                                            Number(formData.deductions.tax || 0) +
                                                            Number(formData.deductions.other || 0))
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky bottom-0">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                <span className="font-medium text-gray-800">Langkah {tabs.findIndex(t => t.id === activeTab) + 1}</span> dari {tabs.length}
                            </div>
                            <div className="flex space-x-3">
                                {activeTab !== 'basic' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentIndex = tabs.findIndex(t => t.id === activeTab);
                                            if (currentIndex > 0) {
                                                setActiveTab(tabs[currentIndex - 1].id);
                                            }
                                        }}
                                        className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                                    >
                                        Sebelumnya
                                    </button>
                                )}
                                {activeTab !== 'allowances' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentIndex = tabs.findIndex(t => t.id === activeTab);
                                            if (currentIndex < tabs.length - 1) {
                                                setActiveTab(tabs[currentIndex + 1].id);
                                            }
                                        }}
                                        className="px-5 py-2.5 bg-[#005429] text-white rounded-lg hover:bg-[#00642f] transition-all font-medium"
                                    >
                                        Selanjutnya
                                    </button>
                                )}
                                {activeTab === 'allowances' && (
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-[#005429] text-white rounded-lg hover:bg-[#00642f] transition-all font-medium shadow-lg shadow-green-900/20 disabled:opacity-50"
                                        disabled={loading}
                                    >
                                        {loading ? 'Menyimpan...' : 'Simpan Data Karyawan'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEmployee;