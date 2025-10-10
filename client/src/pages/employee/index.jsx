import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSearch, FaIdBadge, FaThLarge, FaPencilAlt, FaTrash } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import { useSelector } from "react-redux";
import Paginated from "../../components/paginated";
import Select from "react-select";


const EmployeeManagement = () => {

    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: '#d1d5db', // Tailwind border-gray-300
            minHeight: '34px',
            fontSize: '13px',
            color: '#6b7280', // text-gray-500
            boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none', // blue-500 on focus
            '&:hover': {
                borderColor: '#9ca3af', // Tailwind border-gray-400
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#6b7280', // text-gray-500
        }),
        input: (provided) => ({
            ...provided,
            color: '#6b7280', // text-gray-500 for typed text
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9ca3af', // text-gray-400
            fontSize: '13px',
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '13px',
            color: '#374151', // gray-700
            backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white', // blue-50
            cursor: 'pointer',
        }),
    };
    const { currentUser } = useSelector((state) => state.user);
    const [employee, setEmployee] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showInput, setShowInput] = useState(false);
    const [search, setSearch] = useState("");
    const [tempSelectedOutlet, setTempSelectedOutlet] = useState("");
    const [roles, setRoles] = useState([]);
    const [tempSelectedRoles, setTempSelectedRoles] = useState("");
    const [tempSearch, setTempSearch] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    const [openDropdown, setOpenDropdown] = useState([]);

    // Safety function to ensure we're always working with arrays
    const ensureArray = (data) => Array.isArray(data) ? data : [];
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const dropdownRef = useRef(null);

    // Calculate the total subtotal first
    const totalSubtotal = selectedTrx && selectedTrx.items ? selectedTrx.items.reduce((acc, item) => acc + item.subtotal, 0) : 0;

    // Calculate PB1 as 10% of the total subtotal
    const pb1 = 10000;

    // Calculate the final total
    const finalTotal = totalSubtotal + pb1;

    const fetchEmployee = async () => {
        setLoading(true);
        try {
            const employeeResponse = await axios.get("/api/user/staff", {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });

            // handle kalau backend return object { data: [] } atau langsung array
            const rawData = Array.isArray(employeeResponse.data)
                ? employeeResponse.data
                : employeeResponse.data.data || [];

            // filter yang bukan customer
            const employeeData = rawData.filter(emp => emp.role?.name !== "customer");

            setEmployee(employeeData);
            setFilteredData(employeeData);
            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setEmployee([]);
        } finally {
            setLoading(false);
        }
    }

    const fetchOutlet = async () => {
        setLoading(true);
        try {
            const outletsResponse = await axios.get('/api/outlet');

            // Ensure outletsResponse.data is an array
            const outletsData = Array.isArray(outletsResponse.data) ?
                outletsResponse.data :
                (outletsResponse.data && Array.isArray(outletsResponse.data.data)) ?
                    outletsResponse.data.data : [];

            setOutlets(outletsData);
            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setOutlets([]);
        } finally {
            setLoading(false);
        }
    }

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const roleResponse = await axios.get('/api/roles', {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            const getRoles = roleResponse.data.data ? roleResponse.data.data : roleResponse.data;

            setRoles(getRoles);
            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setRoles([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchEmployee();
        fetchOutlet();
        fetchRoles();
    }, []);

    const options = [
        { value: "", label: "Semua Outlet" },
        ...outlets.map((outlet) => ({
            value: outlet._id,
            label: outlet.name,
        })),
    ];

    const roleOptions = [
        { value: "", label: "Semua Type" },
        ...roles.map((role) => ({
            value: role._id,
            label: role.name,
        })),
    ];

    // Paginate the filtered data
    const paginatedData = useMemo(() => {

        // Ensure filteredData is an array before calling slice
        if (!Array.isArray(filteredData)) {
            console.error('filteredData is not an array:', filteredData);
            return [];
        }

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const result = filteredData.slice(startIndex, endIndex);
        return result;
    }, [currentPage, filteredData]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDateTime = (datetime) => {
        const date = new Date(datetime);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const formatDate = (dat) => {
        const date = new Date(dat);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
    };

    const formatTime = (time) => {
        const date = new Date(time);
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    // Export current data to Excel
    const exportToExcel = () => {
        // Prepare data for export
        const dataToExport = filteredData.map(product => {
            const item = product.items?.[0] || {};
            const menuItem = item.menuItem || {};

            return {
                "Waktu": new Date(product.createdAt).toLocaleDateString('id-ID'),
                "Kasir": product.cashier?.username || "-",
                "ID Struk": product._id,
                "Produk": menuItem.name || "-",
                "Tipe Penjualan": product.orderType,
                "Total (Rp)": (item.subtotal || 0) + pb1,
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);

        // Set auto width untuk tiap kolom
        const columnWidths = Object.keys(dataToExport[0]).map(key => ({
            wch: Math.max(key.length + 2, 20)  // minimal lebar 20 kolom
        }));
        worksheet['!cols'] = columnWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Penjualan");
        XLSX.writeFile(wb, "Data_Transaksi_Penjualan.xlsx");
    };

    const applyFilter = useCallback(() => {

        // Make sure products is an array before attempting to filter
        let filtered = ensureArray([...employee]);

        // Filter by search term (product name, category, or SKU)
        if (tempSearch) {
            filtered = filtered.filter(employee => {
                try {
                    const searchTerm = tempSearch.toLowerCase();

                    // Employee adalah object, bukan array
                    const name = (employee.name || '').toLowerCase();

                    return name.includes(searchTerm);
                } catch (err) {
                    console.error("Error filtering by search:", err);
                    return false;
                }
            });
        }

        if (tempSelectedRoles) {
            filtered = filtered.filter(employee => {
                try {
                    // Cek apakah employee punya role
                    const employeeRoleId = employee.role?._id || employee.roleId;

                    return employeeRoleId === tempSelectedRoles;
                } catch (err) {
                    console.error("Error filtering by role:", err);
                    return false;
                }
            });
        }

        // Filter by outlet
        if (tempSelectedOutlet) {
            filtered = filtered.filter(employee => {
                try {
                    // Cek apakah employee punya outlet dan outlet adalah array
                    if (!employee.outlet || !Array.isArray(employee.outlet)) {
                        return false;
                    }

                    // Cek apakah ada outlet yang sesuai dengan tempSelectedOutlet
                    return employee.outlet.some(outlet => outlet._id === tempSelectedOutlet);
                } catch (err) {
                    console.error("Error filtering by outlet:", err);
                    return false;
                }
            });
        }

        setFilteredData(filtered);
        setCurrentPage(1); // Reset to first page after filter
    }, [employee, tempSearch, tempSelectedOutlet, tempSelectedRoles]);

    // Auto-apply filter whenever dependencies change
    useEffect(() => {
        applyFilter();
    }, [applyFilter]);

    // Initial load
    useEffect(() => {
        applyFilter();
    }, []);


    // Show loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

    // Show error state
    if (error) {
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
                </div>
                <Link to="/admin/employee-create" className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Tambah</Link>
            </div>

            {/* Filters */}
            <div className="px-6 mb-[60px]">
                <div className="flex flex-wrap gap-2 md:justify-end items-center py-3">

                    <div className="relative md:w-64 w-full">
                        <div className="relative">
                            <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Nama / Email"
                                value={tempSearch}
                                onChange={(e) => setTempSearch(e.target.value)}
                                className="text-[13px] border py-2 pl-[30px] pr-[25px] rounded w-full"
                            />
                        </div>
                    </div>

                    <div className="relative md:w-48 w-full">
                        <Select
                            className="text-sm"
                            classNamePrefix="react-select"
                            placeholder="Pilih Outlet"
                            options={options}
                            isSearchable
                            value={
                                options.find((opt) => opt.value === tempSelectedOutlet) || options[0]
                            }
                            onChange={(selected) => setTempSelectedOutlet(selected.value)}
                            styles={customSelectStyles}
                        />
                    </div>

                    <div className="relative md:w-48 w-full">
                        <Select
                            className="text-sm"
                            classNamePrefix="react-select"
                            placeholder="Pilih Type"
                            options={roleOptions}
                            isSearchable
                            value={
                                roleOptions.find((opt) => opt.value === tempSelectedRoles) || options[0]
                            }
                            onChange={(selected) => setTempSelectedRoles(selected.value)}
                            styles={customSelectStyles}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="rounded shadow-slate-200 bg-white shadow-md">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal">Nama</th>
                                <th className="px-4 py-3 font-normal">Jenis</th>
                                <th className="px-4 py-3 font-normal">Outlet</th>
                                <th className="px-4 py-3 font-normal"></th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-sm text-[#999999]">
                                {paginatedData.map((data, index) => {
                                    try {
                                        return (
                                            <tr className="text-left text-sm cursor-pointer hover:bg-slate-50" key={data._id}>
                                                <td className="px-4 py-3">
                                                    {data.username || []}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {data.role?.name || []}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2 flex-wrap">
                                                        {data.outlet && data.outlet.length > 0 ? (
                                                            <div className="flex gap-2 flex-wrap">
                                                                {data.outlet.slice(0, 3).map((o, i) => (
                                                                    <span
                                                                        key={i}
                                                                        className="px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-600"
                                                                    >
                                                                        {o.outletId?.name}
                                                                    </span>
                                                                ))}
                                                                {data.outlet.length > 3 && (
                                                                    <span className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-600">
                                                                        +{data.outlet.length - 3}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            "-"
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">

                                                    {/* Dropdown Menu */}
                                                    <div className="relative text-right">
                                                        <button
                                                            className="px-2 bg-white border border-gray-200 hover:bg-green-800 rounded-sm"
                                                            onClick={() => setOpenDropdown(openDropdown === data._id ? null : data._id)}
                                                        >
                                                            <span className="text-xl text-gray-200 hover:text-white">
                                                                •••
                                                            </span>
                                                        </button>
                                                        {openDropdown === data._id && (
                                                            <div className="absolute text-left text-gray-500 right-0 top-full mt-2 bg-white border rounded-md shadow-md w-[240px] z-10">
                                                                <ul className="w-full">
                                                                    <li className="flex space-x-[18px] items-center px-[20px] py-[15px] text-sm cursor-pointer hover:bg-gray-100">
                                                                        <FaPencilAlt size={18} />
                                                                        <Link
                                                                            to={`/admin/menu-update/${data._id}`}
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
                                        );
                                    } catch (err) {
                                        console.error(`Error rendering product ${index}:`, err, employee);
                                        return (
                                            <tr className="text-left text-sm" key={index}>
                                                <td colSpan="4" className="px-4 py-3 text-red-500">
                                                    Error rendering employee
                                                </td>
                                            </tr>
                                        );
                                    }
                                })}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr className="py-6 text-center w-full h-96">
                                    <td colSpan={4}>Tidak ada data ditemukan</td>
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
