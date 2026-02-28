import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSearch, FaIdBadge, FaThLarge, FaPencilAlt, FaTrash } from "react-icons/fa";
import * as XLSX from "xlsx";
import { useSelector } from "react-redux";
import Paginated from "../../components/paginated";
import Select from "react-select";

const EmployeeManagement = () => {
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: '#d1d5db',
            minHeight: '34px',
            fontSize: '13px',
            color: '#6b7280',
            boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none',
            '&:hover': {
                borderColor: '#9ca3af',
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#6b7280',
        }),
        input: (provided) => ({
            ...provided,
            color: '#6b7280',
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9ca3af',
            fontSize: '13px',
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '13px',
            color: '#374151',
            backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white',
            cursor: 'pointer',
        }),
    };

    const { currentUser } = useSelector((state) => state.user);
    const [employee, setEmployee] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter states
    const [search, setSearch] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [selectedPosition, setSelectedPosition] = useState("");
    const [selectedEmploymentStatus, setSelectedEmploymentStatus] = useState("");
    const [selectedEmploymentType, setSelectedEmploymentType] = useState("");
    const [selectedIsActive, setSelectedIsActive] = useState("");

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const ITEMS_PER_PAGE = 10;

    const [openDropdown, setOpenDropdown] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Department and Position options (you can fetch these dynamically if needed)
    const departmentOptions = [
        { value: "", label: "Semua Department" },
        { value: "HR", label: "HR" },
        { value: "Finance", label: "Finance" },
        { value: "Operations", label: "Operations" },
        { value: "IT", label: "IT" },
        { value: "Marketing", label: "Marketing" },
    ];

    const positionOptions = [
        { value: "", label: "Semua Posisi" },
        { value: "Manager", label: "Manager" },
        { value: "Supervisor", label: "Supervisor" },
        { value: "Staff", label: "Staff" },
        { value: "Cashier", label: "Cashier" },
        { value: "Chef", label: "Chef" },
    ];

    const employmentStatusOptions = [
        { value: "", label: "Semua Status" },
        { value: "probation", label: "Probation" },
        { value: "permanent", label: "Permanent" },
        { value: "contract", label: "Contract" },
        { value: "terminated", label: "Terminated" },
    ];

    const employmentTypeOptions = [
        { value: "", label: "Semua Tipe" },
        { value: "full-time", label: "Full Time" },
        { value: "part-time", label: "Part Time" },
        { value: "freelance", label: "Freelance" },
    ];

    const isActiveOptions = [
        { value: "", label: "Semua" },
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" },
    ];

    const fetchEmployee = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: ITEMS_PER_PAGE,
            };

            if (search) params.search = search;
            if (selectedDepartment) params.department = selectedDepartment;
            if (selectedPosition) params.position = selectedPosition;
            if (selectedEmploymentStatus) params.employmentStatus = selectedEmploymentStatus;
            if (selectedEmploymentType) params.employmentType = selectedEmploymentType;
            if (selectedIsActive) params.isActive = selectedIsActive;

            const employeeResponse = await axios.get("/api/hr/employees", {
                headers: { Authorization: `Bearer ${currentUser.token}` },
                params,
            });

            const { data, totalPages: pages, total: totalCount } = employeeResponse.data;

            setEmployee(data || []);
            setTotalPages(pages || 1);
            setTotal(totalCount || 0);
            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setEmployee([]);
            setError(err.response?.data?.message || "Failed to fetch employees");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployee();
    }, [currentPage, search, selectedDepartment, selectedPosition, selectedEmploymentStatus, selectedEmploymentType, selectedIsActive]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedDepartment, selectedPosition, selectedEmploymentStatus, selectedEmploymentType, selectedIsActive]);

    const formatDate = (date) => {
        if (!date) return "-";
        const d = new Date(date);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    };

    const exportToExcel = () => {
        const dataToExport = employee.map(emp => ({
            "Employee ID": emp.employeeId || "-",
            "NIK": emp.nik || "-",
            "Nama": emp.user?.username || emp.user?.name || "-",
            "Email": emp.user?.email || "-",
            "Department": emp.department || "-",
            "Posisi": emp.position || "-",
            "Status Employment": emp.employmentStatus || "-",
            "Tipe Employment": emp.employmentType || "-",
            "Tanggal Bergabung": formatDate(emp.joinDate),
            "Status": emp.isActive ? "Active" : "Inactive",
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const columnWidths = Object.keys(dataToExport[0] || {}).map(key => ({
            wch: Math.max(key.length + 2, 20)
        }));
        ws['!cols'] = columnWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Karyawan");
        XLSX.writeFile(wb, "Data_Karyawan.xlsx");
    };

    if (loading && currentPage === 1) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

    if (error && employee.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="">
            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-3 my-3">
                <div className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    <span>Karyawan</span>
                    <span className="text-sm text-gray-500">({total} total)</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportToExcel}
                        className="bg-white border border-[#005429] text-[#005429] text-[13px] px-[15px] py-[7px] rounded hover:bg-[#005429] hover:text-white transition"
                        disabled={employee.length === 0}
                    >
                        Export Excel
                    </button>
                    <Link
                        to="/admin/employee-create"
                        className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                    >
                        Tambah
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="px-6 mb-[60px]">
                <div className="flex flex-wrap gap-2 md:justify-end items-center py-3">
                    <div className="relative md:w-64 w-full">
                        <div className="relative">
                            <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="ID / NIK / Posisi / Department"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="text-[13px] border py-2 pl-[30px] pr-[25px] rounded w-full"
                            />
                        </div>
                    </div>

                    <div className="relative md:w-48 w-full">
                        <Select
                            className="text-sm"
                            classNamePrefix="react-select"
                            placeholder="Pilih Department"
                            options={departmentOptions}
                            isSearchable
                            value={departmentOptions.find((opt) => opt.value === selectedDepartment)}
                            onChange={(selected) => setSelectedDepartment(selected.value)}
                            styles={customSelectStyles}
                        />
                    </div>

                    <div className="relative md:w-48 w-full">
                        <Select
                            className="text-sm"
                            classNamePrefix="react-select"
                            placeholder="Pilih Posisi"
                            options={positionOptions}
                            isSearchable
                            value={positionOptions.find((opt) => opt.value === selectedPosition)}
                            onChange={(selected) => setSelectedPosition(selected.value)}
                            styles={customSelectStyles}
                        />
                    </div>

                    <div className="relative md:w-48 w-full">
                        <Select
                            className="text-sm"
                            classNamePrefix="react-select"
                            placeholder="Status Employment"
                            options={employmentStatusOptions}
                            isSearchable
                            value={employmentStatusOptions.find((opt) => opt.value === selectedEmploymentStatus)}
                            onChange={(selected) => setSelectedEmploymentStatus(selected.value)}
                            styles={customSelectStyles}
                        />
                    </div>

                    <div className="relative md:w-48 w-full">
                        <Select
                            className="text-sm"
                            classNamePrefix="react-select"
                            placeholder="Tipe Employment"
                            options={employmentTypeOptions}
                            isSearchable
                            value={employmentTypeOptions.find((opt) => opt.value === selectedEmploymentType)}
                            onChange={(selected) => setSelectedEmploymentType(selected.value)}
                            styles={customSelectStyles}
                        />
                    </div>

                    <div className="relative md:w-48 w-full">
                        <Select
                            className="text-sm"
                            classNamePrefix="react-select"
                            placeholder="Status Active"
                            options={isActiveOptions}
                            value={isActiveOptions.find((opt) => opt.value === selectedIsActive)}
                            onChange={(selected) => setSelectedIsActive(selected.value)}
                            styles={customSelectStyles}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="rounded shadow-slate-200 bg-white shadow-md">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal">Employee ID</th>
                                <th className="px-4 py-3 font-normal">NIK</th>
                                <th className="px-4 py-3 font-normal">Nama</th>
                                <th className="px-4 py-3 font-normal">Department</th>
                                <th className="px-4 py-3 font-normal">Posisi</th>
                                <th className="px-4 py-3 font-normal">Status</th>
                                <th className="px-4 py-3 font-normal">Tipe</th>
                                <th className="px-4 py-3 font-normal">Status</th>
                                <th className="px-4 py-3 font-normal"></th>
                            </tr>
                        </thead>
                        {employee.length > 0 ? (
                            <tbody className="text-sm text-[#999999]">
                                {employee.map((data) => (
                                    <tr className="text-left text-sm cursor-pointer hover:bg-slate-50" key={data._id}>
                                        <td className="px-4 py-3">{data.employeeId || "-"}</td>
                                        <td className="px-4 py-3">{data.nik || "-"}</td>
                                        <td className="px-4 py-3">
                                            {data.user?.username || data.user?.name || "-"}
                                        </td>
                                        <td className="px-4 py-3">{data.department || "-"}</td>
                                        <td className="px-4 py-3">{data.position || "-"}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs rounded-md ${data.employmentStatus === 'permanent' ? 'bg-green-50 text-green-600' :
                                                    data.employmentStatus === 'probation' ? 'bg-yellow-50 text-yellow-600' :
                                                        data.employmentStatus === 'contract' ? 'bg-blue-50 text-blue-600' :
                                                            'bg-red-50 text-red-600'
                                                }`}>
                                                {data.employmentStatus || "-"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 text-xs rounded-md bg-gray-50 text-gray-600">
                                                {data.employmentType || "-"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs rounded-md ${data.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                                }`}>
                                                {data.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="relative text-right">
                                                <button
                                                    className="px-2 bg-white border border-gray-200 hover:bg-green-800 rounded-sm"
                                                    onClick={() => setOpenDropdown(openDropdown === data._id ? null : data._id)}
                                                >
                                                    <span className="text-xl text-gray-200 hover:text-white">•••</span>
                                                </button>
                                                {openDropdown === data._id && (
                                                    <div className="absolute text-left text-gray-500 right-0 top-full mt-2 bg-white border rounded-md shadow-md w-[240px] z-10">
                                                        <ul className="w-full">
                                                            <li className="flex space-x-[18px] items-center px-[20px] py-[15px] text-sm cursor-pointer hover:bg-gray-100">
                                                                <FaPencilAlt size={18} />
                                                                <Link
                                                                    to={`/admin/employee-update/${data._id}`}
                                                                    className="block bg-transparent"
                                                                >
                                                                    Edit
                                                                </Link>
                                                            </li>
                                                            <li className="flex space-x-[18px] items-center px-[20px] py-[15px] text-sm cursor-pointer hover:bg-gray-100">
                                                                <FaTrash size={18} />
                                                                <button onClick={() => {
                                                                    setItemToDelete(data._id);
                                                                    setIsModalOpen(true);
                                                                }}>
                                                                    Delete
                                                                </button>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr className="py-6 text-center w-full h-96">
                                    <td colSpan={9}>Tidak ada data ditemukan</td>
                                </tr>
                            </tbody>
                        )}
                    </table>
                </div>

                {/* Pagination Controls */}
                <Paginated
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                />
            </div>
        </div>
    );
};

export default EmployeeManagement;