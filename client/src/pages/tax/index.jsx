import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
    FaClipboardList, FaTag, FaStoreAlt, FaSearch,
    FaPencilAlt, FaTrash, FaPlusCircle, FaPlus,
    FaPercent, FaMoneyBillWave
} from "react-icons/fa";
import Header from "../admin/header";
import Select from "react-select";
import Paginated from "../../components/paginated";
import CreateTax from "./create_tax";
import CreateService from "./create_service";
import { toast } from "react-toastify";
import UpdateTax from "./update_tax";

const TaxManagementPage = () => {
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: '#d1d5db',
            minHeight: '42px',
            fontSize: '14px',
            color: '#6b7280',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(0, 84, 41, 0.1)' : 'none',
            borderRadius: '8px',
            '&:hover': {
                borderColor: '#9ca3af',
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#374151',
        }),
        input: (provided) => ({
            ...provided,
            color: '#374151',
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9ca3af',
            fontSize: '14px',
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '14px',
            color: '#374151',
            backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white',
            cursor: 'pointer',
        }),
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalUpdateOpen, setIsModalUpdateOpen] = useState(false);
    const [selectedTaxId, setSelectedTaxId] = useState(null); // TAMBAHKAN INI
    const [isDeleting, setIsDeleting] = useState(false);
    const [isModalServiceOpen, setIsModalServiceOpen] = useState(false);
    const [outlets, setOutlets] = useState([]);
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOutlet();
        fetchTax();
        setLoading(true);
    }, []);

    const fetchOutlet = async () => {
        try {
            const response = await axios.get("/api/outlet");
            setOutlets(Array.isArray(response.data) ? response.data : response.data?.data || []);
        } catch (error) {
            console.error("Error fetching outlets:", error);
            setOutlets([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTax = async () => {
        try {
            const response = await axios.get("/api/tax-service");
            const taxData = response.data.data ? response.data.data : response.data || [];
            setData(taxData);
            setFilteredData(taxData);
        } catch (error) {
            console.error("Error fetching tax data:", error);
            setData([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    };

    const typeOptions = [
        { value: "", label: "Semua Type" },
        { value: "tax", label: "Pajak" },
        { value: "service", label: "Layanan" },
    ];

    // Filter data based on selected outlet and type
    useEffect(() => {
        let filtered = data;

        if (selectedOutlet) {
            filtered = filtered.filter(item => item.outlet === selectedOutlet);
        }

        if (selectedType) {
            filtered = filtered.filter(item => item.type === selectedType);
        }

        setFilteredData(filtered);
        setCurrentPage(1);
    }, [selectedOutlet, selectedType, data]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    const paginatedData = useMemo(() => {
        if (!Array.isArray(filteredData)) {
            return [];
        }
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, endIndex);
    }, [currentPage, filteredData]);

    const handleDelete = async (id) => {
        const isConfirmed = window.confirm("Apakah Anda yakin ingin menghapus data ini?");
        if (!isConfirmed) return;

        setIsDeleting(true);
        try {
            await axios.delete(`/api/tax-service/${id}`);
            toast.success("Data berhasil dihapus");
            fetchTax();
        } catch (error) {
            console.error("Error deleting data:", error);
            const errorMessage = error.response?.data?.error ||
                error.response?.data?.message ||
                "Gagal menghapus data";
            toast.error(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    // TAMBAHKAN FUNGSI INI
    const handleEdit = (taxId) => {
        setSelectedTaxId(taxId);
        setIsModalUpdateOpen(true);
    };

    // TAMBAHKAN FUNGSI INI
    const handleCloseUpdate = () => {
        setIsModalUpdateOpen(false);
        setSelectedTaxId(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-[#005429] border-b-[#005429] border-l-transparent border-r-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Memuat data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="px-6 py-5">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                <FaTag className="text-[#005429]" />
                                Pajak & Service Charge
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Kelola pajak dan biaya layanan untuk outlet Anda
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsModalServiceOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-sm hover:shadow-md"
                            >
                                <FaPlus /> Tambah Service
                            </button>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-[#005429] hover:bg-[#003d1f] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-sm hover:shadow-md"
                            >
                                <FaPlus /> Tambah Pajak
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Data</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{data.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <FaTag className="text-[#005429] text-xl" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Hasil Filter</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{filteredData.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <FaSearch className="text-blue-600 text-xl" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Halaman</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{currentPage} / {totalPages || 1}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <FaClipboardList className="text-purple-600 text-xl" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Outlet</label>
                            <Select
                                name="outlet"
                                value={
                                    outlets
                                        .map((p) => ({ value: p._id, label: p.name }))
                                        .find((o) => o.value === selectedOutlet) || null
                                }
                                options={[
                                    { value: "", label: "Semua Outlet" },
                                    ...outlets.map((p) => ({ value: p._id, label: p.name }))
                                ]}
                                isSearchable
                                placeholder="Pilih Outlet"
                                styles={customSelectStyles}
                                onChange={(selectedOption) =>
                                    setSelectedOutlet(selectedOption ? selectedOption.value : "")
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipe</label>
                            <Select
                                name="type"
                                value={typeOptions.find((opt) => opt.value === selectedType) || typeOptions[0]}
                                onChange={(selected) => setSelectedType(selected.value)}
                                options={typeOptions}
                                styles={customSelectStyles}
                                placeholder="Pilih Type"
                                isSearchable
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                                        Nama
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                                        Tipe
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-800 uppercase tracking-wider">
                                        Jumlah
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-800 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((item) => (
                                        <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                                        <FaTag className="text-[#005429]" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${item.type === 'tax'
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                                    }`}>
                                                    {item.type === 'tax' ? 'Pajak' : 'Layanan'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {item.percentage != null ? (
                                                        <>
                                                            <FaPercent className="text-gray-400 text-xs" />
                                                            <span className="text-sm font-semibold text-gray-900">{item.percentage}%</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaMoneyBillWave className="text-gray-400 text-xs" />
                                                            <span className="text-sm font-semibold text-gray-900">Rp {item.fixedFee?.toLocaleString('id-ID')}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(item._id)}
                                                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                    >
                                                        <FaPencilAlt size={14} />
                                                        <span>Ubah</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item._id)}
                                                        disabled={isDeleting}
                                                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        <FaTrash size={14} />
                                                        <span>Hapus</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-16 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                    <FaTag className="text-gray-400 text-3xl" />
                                                </div>
                                                <p className="text-gray-500 font-medium mb-1">
                                                    Tidak ada data pajak & service
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    Klik tombol 'Tambah Pajak' atau 'Tambah Service' untuk membuat data baru
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {paginatedData.length > 0 && (
                    <div className="mt-6">
                        <Paginated
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            totalPages={totalPages}
                        />
                    </div>
                )}
            </div>

            <CreateTax
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={(data) => {
                    fetchTax();
                }}
            />

            <CreateService
                isOpen={isModalServiceOpen}
                onClose={() => setIsModalServiceOpen(false)}
                onSuccess={(data) => {
                    fetchTax();
                }}
            />

            <UpdateTax
                isOpen={isModalUpdateOpen}
                onClose={handleCloseUpdate}
                taxId={selectedTaxId}
            />
        </div>
    );
};

export default TaxManagementPage;