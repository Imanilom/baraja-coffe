import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaClipboardList, FaChevronRight, FaBell, FaUser, FaSearch, FaInfoCircle, FaShoppingCart, FaPencilAlt, FaTrash } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import * as XLSX from "xlsx";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

const TableManagement = () => {
    const [areas, setAreas] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showInput, setShowInput] = useState(false);
    const [search, setSearch] = useState("");
    const [tempSelectedOutlet, setTempSelectedOutlet] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const dropdownRef = useRef(null);

    // Fetch areas and outlets data
    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch active areas
            const areasResponse = await axios.get('/api/areas');
            const areasData = areasResponse.data.data || [];
            setAreas(areasData);

            // Fetch outlets (if needed)
            const outletsResponse = await axios.get('/api/outlet');
            const outletsData = outletsResponse.data.data || [];
            setOutlets(outletsData);

            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load data. Please try again later.");
            setAreas([]);
            setOutlets([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handle area deletion (deactivation)
    const handleDelete = async (areaId) => {
        confirmAlert({
            title: 'Konfirmasi',
            message: 'Apakah Anda yakin ingin menonaktifkan area ini? Meja yang terkait juga akan dinonaktifkan.',
            buttons: [
                {
                    label: 'Ya',
                    onClick: async () => {
                        try {
                            await axios.delete(`/api/areas/${areaId}`);
                            fetchData(); // Refresh data
                        } catch (error) {
                            console.error('Error deleting area:', error);
                            alert('Gagal menonaktifkan area');
                        }
                    }
                },
                {
                    label: 'Tidak',
                    onClick: () => {}
                }
            ]
        });
    };

    // Filter areas based on search
    const filteredAreas = useMemo(() => {
        return areas.filter(area => 
            area.area_name.toLowerCase().includes(search.toLowerCase()) ||
            area.area_code.toLowerCase().includes(search.toLowerCase())
        );
    }, [areas, search]);

    // Paginate the filtered data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredAreas.slice(startIndex, endIndex);
    }, [currentPage, filteredAreas]);

    // Calculate total pages
    const totalPages = Math.ceil(filteredAreas.length / ITEMS_PER_PAGE);

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
            {/* Header */}
            <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
                <FaBell size={23} className="text-gray-400" />
                <span className="text-[14px]">Hi Baraja</span>
                <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
                    <FaUser size={30} />
                </Link>
            </div>

            {/* Breadcrumb */}
            <div className="px-3 py-2 flex justify-between items-center border-b">
                <div className="flex items-center space-x-2">
                    <FaClipboardList size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Pengaturan Meja</p>
                    <FaChevronRight className="text-[15px] text-gray-500" />
                    <span className="text-[15px] text-[#005429]">Atur Meja</span>
                </div>
            </div>

            {/* Filters and Actions */}
            <div className="px-[15px] pb-[15px] mb-[60px]">
                <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-2 gap-[10px] items-end rounded bg-slate-50 shadow-slate-200 shadow-md">
                    <div className="flex flex-col">
                        <label className="text-[13px] mb-1 text-gray-500">Cari Area</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded text-left"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari berdasarkan nama area atau kode"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Link 
                            to="/admin/table-management/table-create" 
                            className="bg-[#005429] border-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                        >
                            + Tambah Area Baru
                        </Link>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-slate-200 shadow-md">
                    <table className="min-w-full table-auto border">
                        <thead className="text-gray-400">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal border">Kode Area</th>
                                <th className="px-4 py-3 font-normal border">Nama Area</th>
                                <th className="px-4 py-3 font-normal border">Kapasitas</th>
                                <th className="px-4 py-3 font-normal border">Biaya Sewa</th>
                                <th className="px-4 py-3 font-normal border">Jumlah Meja</th>
                                <th className="px-4 py-3 font-normal border">Status</th>
                                <th className="px-4 py-3 font-normal border">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-400 text-sm">
                            {paginatedData.map((area) => (
                                <tr key={area._id} className="hover:bg-slate-50">
                                    <td className="border px-4 py-2">{area.area_code}</td>
                                    <td className="border px-4 py-2">{area.area_name}</td>
                                    <td className="border px-4 py-2">{area.capacity} orang</td>
                                    <td className="border px-4 py-2">
                                        {new Intl.NumberFormat('id-ID', {
                                            style: 'currency',
                                            currency: 'IDR'
                                        }).format(area.rentfee)}
                                    </td>
                                    <td className="border px-4 py-2">
                                        {area.tables ? area.tables.length : 0}
                                    </td>
                                    <td className="border px-4 py-2">
                                        <span className={`${area.is_active ? 'text-[#005429]' : 'text-red-500'}`}>
                                            {area.is_active ? 'Aktif' : 'Tidak Aktif'}
                                        </span>
                                    </td>
                                    <td className="border px-4 py-2">
                                        <div className="flex justify-center space-x-2">
                                            <Link 
                                                to={`/admin/table-management/table-update/${area._id}`}
                                                className="text-gray-500 hover:text-blue-500"
                                            >
                                                <FaPencilAlt />
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(area._id)}
                                                className="text-red-500 hover:text-red-700"
                                                disabled={!area.is_active}
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

                {/* Empty state */}
                {filteredAreas.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <FaInfoCircle className="mx-auto text-4xl mb-2" />
                        <p>Tidak ada data area yang ditemukan</p>
                    </div>
                )}

                {/* Pagination Controls */}
                {filteredAreas.length > 0 && (
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-gray-600">
                            Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredAreas.length)} dari {filteredAreas.length} area
                        </span>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sebelumnya
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Berikutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]"></div>
            </div>
        </div>
    );
};

export default TableManagement;