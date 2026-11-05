import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from '@/lib/axios';
import { FaPlus, FaSearch, FaMapMarkerAlt, FaPhoneAlt, FaPencilAlt, FaTrashAlt, FaStore } from 'react-icons/fa';
import Paginated from '../../components/paginated';
import ConfirmModal from '../../components/modal/confirmmodal';
import MessageAlert from '../../components/messageAlert';

const OutletManagementPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal states
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    
    // Alert states
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    const [alertKey, setAlertKey] = useState(0);

    const itemsPerPage = 10;
    const currentPage = parseInt(searchParams.get('page')) || 1;

    const fetchOutlets = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/outlet');
            setOutlets(res.data.data || res.data || []);
        } catch (error) {
            console.error("Gagal mengambil data outlet:", error);
            showAlert('Gagal memuat data outlet. Silakan coba lagi.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOutlets();
    }, [fetchOutlets]);

    const showAlert = (message, type = 'success') => {
        setAlertMessage(message);
        setAlertType(type);
        setAlertKey(prev => prev + 1);
    };

    // Filter outlets
    const filteredOutlets = useMemo(() => {
        return outlets.filter((outlet) => {
            const searchLower = searchQuery.toLowerCase();
            return (
                (outlet.name && outlet.name.toLowerCase().includes(searchLower)) ||
                (outlet.city && outlet.city.toLowerCase().includes(searchLower)) ||
                (outlet.address && outlet.address.toLowerCase().includes(searchLower))
            );
        });
    }, [outlets, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredOutlets.length / itemsPerPage);
    const currentItems = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredOutlets.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredOutlets, currentPage, itemsPerPage]);

    const handlePageChange = (newPage) => {
        const pageNumber = typeof newPage === 'function' ? newPage(currentPage) : newPage;
        setSearchParams({ page: pageNumber.toString() });
    };

    // Reset pagination on search
    useEffect(() => {
        if (searchQuery && currentPage !== 1) {
            setSearchParams({ page: '1' });
        }
    }, [searchQuery, currentPage, setSearchParams]);

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        
        try {
            await axios.delete(`/api/outlet/${itemToDelete._id}`);
            showAlert(`Outlet "${itemToDelete.name}" berhasil dihapus.`);
            fetchOutlets();
        } catch (error) {
            console.error("Error deleting outlet:", error);
            showAlert('Gagal menghapus outlet. Pastikan tidak ada data yang terkait.', 'error');
        } finally {
            setIsConfirmOpen(false);
            setItemToDelete(null);
        }
    };

    return (
        <div className="w-full font-['Inter',sans-serif]">
            <MessageAlert
                key={alertKey}
                type={alertType}
                message={alertMessage}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight font-['Outfit',sans-serif]">Daftar Outlet</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Kelola data cabang dan lokasi restoran</p>
                </div>
                <Link
                    to="/admin/outlet-create"
                    className="bg-[#005429] hover:bg-[#004220] text-white px-5 py-2.5 rounded-xl shadow-lg shadow-[#005429]/20 hover:shadow-xl hover:shadow-[#005429]/30 transition-all flex items-center gap-2 text-sm font-bold w-full sm:w-auto justify-center"
                >
                    <FaPlus /> Tambah Outlet
                </Link>
            </div>

            <div className="space-y-6">
                {/* Control Panel */}
                <div className="relative z-10 bg-white/80 backdrop-blur-xl border border-slate-200/60 p-4 sm:p-5 rounded-2xl shadow-sm">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Search */}
                        <div className="relative flex-1 w-full md:max-w-md group transition-all duration-300 focus-within:ring-2 ring-[#005429]/20 rounded-xl">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FaSearch className="h-4 w-4 text-slate-400 group-focus-within:text-[#005429] transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari nama outlet, kota, atau alamat..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#005429] transition-all shadow-sm hover:bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mt-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200/80">
                                <tr>
                                    <th className="p-4 w-16 text-center">No</th>
                                    <th className="p-4">Informasi Outlet</th>
                                    <th className="p-4">Lokasi</th>
                                    <th className="p-4">Kontak</th>
                                    <th className="p-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center">
                                            <div className="flex justify-center items-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#005429]"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : currentItems.length > 0 ? (
                                    currentItems.map((item, index) => (
                                        <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-4 text-center text-slate-500 font-medium">
                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                            </td>
                                            
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50 group-hover:scale-105 transition-transform">
                                                        <FaStore size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm group-hover:text-[#005429] transition-colors">{item.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono tracking-wide mt-0.5">ID: {item._id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            <td className="p-4">
                                                <div className="flex items-start gap-2">
                                                    <FaMapMarkerAlt className="text-slate-400 mt-1 flex-shrink-0" />
                                                    <div>
                                                        <p className="font-bold text-slate-700 text-xs">{item.city || '-'}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 max-w-[250px] leading-relaxed">{item.address || '-'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <FaPhoneAlt className="text-slate-400" />
                                                    <span className="font-semibold text-slate-600 text-xs">{item.contactNumber || '-'}</span>
                                                </div>
                                            </td>
                                            
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        to={`/admin/update-outlet/${item._id}`}
                                                        className="p-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 transition-colors"
                                                        title="Edit Outlet"
                                                    >
                                                        <FaPencilAlt size={14} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteClick(item)}
                                                        className="p-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-colors"
                                                        title="Hapus Outlet"
                                                    >
                                                        <FaTrashAlt size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <div className="bg-slate-50 p-4 rounded-full mb-3 border border-slate-100">
                                                    <FaStore className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-600 font-['Outfit',sans-serif]">Tidak ada outlet ditemukan</h3>
                                                <p className="text-sm mt-1 text-slate-500 font-medium">Coba sesuaikan kata kunci pencarianmu</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    {!loading && filteredOutlets.length > 0 && (
                        <div className="p-4 border-t border-slate-200/80 bg-slate-50/30">
                            <Paginated
                                currentPage={currentPage}
                                setCurrentPage={handlePageChange}
                                totalPages={totalPages}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Hapus Outlet"
                message={`Apakah Anda yakin ingin menghapus outlet "${itemToDelete?.name}"? Tindakan ini tidak dapat dibatalkan dan dapat mempengaruhi data transaksi yang terkait.`}
                confirmText="Ya, Hapus"
                cancelText="Batal"
            />
        </div>
    );
};

export default OutletManagementPage;
