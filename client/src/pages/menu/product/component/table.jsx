import React, { useState } from "react";
import { FaPencilAlt, FaReceipt, FaTrashAlt } from "react-icons/fa";
import Select from "react-select";
import CategoryTabs from "./categorytabs";
import { Link, useLocation } from "react-router-dom";
import MenuSkeleton from "./skeleton";
import ConfirmationModalActive from "../dialog/confirmationModalAction";
import axios from '@/lib/axios';
import Paginated from "../../../../components/paginated";
import ConfirmModal from "../../../../components/modal/confirmmodal";
import ConfirmModalBulkDelete from "../../../../components/modal/confirmModalBulkDelete";

export default function MenuTable({
    categoryOptions,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    outletOptions,
    selectedOutlet,
    setSelectedOutlet,
    statusOptions,
    selectedStatus,
    setSelectedStatus,
    setSelectedWorkstation,
    selectedWorkstation,
    checkAll,
    setCheckAll,
    checkedItems,
    setCheckedItems,
    currentItems,
    workstationOptions,
    formatCurrency,
    setCurrentPage,
    totalPages,
    handleDeleteSelected,
    customStyles,
    currentPage,
    loading,
    fetchData,
    onDeleteSuccess,
    onStatusUpdate,
    recipes,
    hasRecipe,
    recipeFilter,
    setRecipeFilter
}) {

    const location = useLocation();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalBulkOpen, setIsModalBulkOpen] = useState(false);
    const [newStatus, setNewStatus] = useState(null);
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Handler untuk membuka modal delete
    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setIsModalOpen(true);
    };

    const handleDeleteClickBulk = () => {
        setIsModalBulkOpen(true);
    };

    // Handler untuk menutup modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setItemToDelete(null);
    };

    const handleCloseModalBulk = () => {
        setIsModalBulkOpen(false);
    };

    // Handler untuk konfirmasi delete
    const handleConfirmDelete = async () => {
        try {
            await axios.delete(`/api/menu/menu-items/${itemToDelete.id}`);
            await fetchData();

            if (onDeleteSuccess) {
                onDeleteSuccess(`Menu "${itemToDelete.name}" berhasil dihapus`);
            }

        } catch (error) {
            console.error("Error deleting item:", error);

            if (onDeleteSuccess) {
                onDeleteSuccess(null, 'Gagal menghapus menu. Silakan coba lagi.');
            }
        } finally {
            handleCloseModal();
        }
    };

    // Handler untuk konfirmasi bulk delete
    const handleConfirmBulkDelete = async () => {
        try {
            await handleDeleteSelected();
            handleCloseModalBulk();
        } catch (error) {
            console.error("Error bulk deleting items:", error);
            handleCloseModalBulk();
        }
    };

    // Handler untuk update status
    const handleUpdate = async (itemId, newStatus) => {
        try {
            await axios.put(`/api/menu/menu-items/activated/${itemId}`, { isActive: newStatus });
            await fetchData();

            if (onStatusUpdate) {
                onStatusUpdate(`Menu berhasil ${newStatus ? "diaktifkan" : "dinonaktifkan"}`);
            }
        } catch (error) {
            console.error("Error updating menu:", error);

            if (onStatusUpdate) {
                onStatusUpdate(null, 'Gagal mengubah status menu. Silakan coba lagi.');
            }
        }
    };

    if (loading) return <MenuSkeleton />;

    return (
        <>
            <div className="space-y-6 font-['Inter',sans-serif]">
                {/* Control Panel */}
                <div className="relative z-[50] bg-white/80 backdrop-blur-xl border border-slate-200/60 p-4 sm:p-5 rounded-2xl shadow-sm">
                    {location.pathname === '/admin/menu' && (
                        <div className="mb-5 border-b border-slate-200/60 pb-5">
                            <CategoryTabs
                                categoryOptions={categoryOptions}
                                selectedCategory={selectedCategory}
                                setSelectedCategory={setSelectedCategory}
                            />
                        </div>
                    )}

                    <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
                        {/* Search */}
                        <div className="relative flex-1 w-full xl:max-w-md group transition-all duration-300 focus-within:ring-2 ring-[#005429]/20 rounded-xl">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-slate-400 group-focus-within:text-[#005429] transition-colors"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z"
                                    />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari menu, SKU, atau barcode..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#005429] transition-all shadow-sm hover:bg-white"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            <div className="w-40">
                                <Select
                                    options={outletOptions}
                                    value={outletOptions.find(option => option.value === selectedOutlet) || outletOptions[0]}
                                    onChange={(selected) => setSelectedOutlet(selected.value)}
                                    styles={customStyles}
                                    isSearchable={false}
                                    placeholder="Outlet"
                                />
                            </div>

                            <div className="w-36">
                                <Select
                                    options={statusOptions}
                                    value={statusOptions.find(option => option.value === selectedStatus) || statusOptions[0]}
                                    onChange={(selected) => setSelectedStatus(selected.value)}
                                    styles={customStyles}
                                    isSearchable={false}
                                    placeholder="Status"
                                />
                            </div>

                            {location.pathname === '/admin/menu' && (
                                <div className="w-36">
                                    <Select
                                        options={workstationOptions}
                                        value={workstationOptions.find(option => option.value === selectedWorkstation) || workstationOptions[0]}
                                        onChange={(selected) => setSelectedWorkstation(selected.value)}
                                        styles={customStyles}
                                        isSearchable={false}
                                        placeholder="Tempat"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Filter Resep */}
                    <div className="mt-5 flex items-center gap-3 pt-4 border-t border-slate-200/60">
                        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hidden sm:block">Filter Resep:</span>
                        <div className="flex gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm h-[42px] overflow-x-auto w-full sm:w-auto">
                            <button
                                onClick={() => setRecipeFilter('all')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${recipeFilter === 'all'
                                    ? 'bg-[#005429] text-white shadow-sm'
                                    : 'text-slate-500 hover:bg-white'
                                    }`}
                            >
                                Semua
                            </button>
                            <button
                                onClick={() => setRecipeFilter('hasRecipe')}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${recipeFilter === 'hasRecipe'
                                    ? 'bg-green-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:bg-white'
                                    }`}
                            >
                                <FaReceipt /> Ada Resep
                            </button>
                            <button
                                onClick={() => setRecipeFilter('noRecipe')}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${recipeFilter === 'noRecipe'
                                    ? 'bg-orange-500 text-white shadow-sm'
                                    : 'text-slate-500 hover:bg-white'
                                    }`}
                            >
                                <FaReceipt /> Tanpa Resep
                            </button>
                        </div>
                    </div>
                </div>

                {/* Menu Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mt-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200/80">
                                <tr>
                                    <th className="p-4 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-[#005429] border-gray-300 rounded focus:ring-[#005429] accent-[#005429] cursor-pointer"
                                            checked={checkAll}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;
                                                setCheckAll(isChecked);
                                                setCheckedItems(isChecked ? currentItems.map(item => item.id) : []);
                                            }}
                                        />
                                    </th>
                                    <th className="p-4">Produk</th>
                                    <th className="p-4">Kategori</th>
                                    <th className="p-4">Tempat</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Harga</th>
                                    <th className="p-4 text-right">
                                        {checkedItems.length > 0 && (
                                            <button
                                                onClick={handleDeleteClickBulk}
                                                className="bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 ml-auto text-xs font-bold border border-red-100"
                                            >
                                                <span>{checkedItems.length}</span> <FaTrashAlt />
                                            </button>
                                        )}
                                        {checkedItems.length === 0 && "Aksi"}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {currentItems.length > 0 ? (
                                    currentItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            {/* Checkbox */}
                                            <td className="p-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-[#005429] border-slate-300 rounded focus:ring-[#005429] accent-[#005429] cursor-pointer"
                                                    checked={checkedItems.includes(item.id)}
                                                    onChange={(e) => {
                                                        const isChecked = e.target.checked;
                                                        setCheckedItems((prev) => {
                                                            const updated = isChecked
                                                                ? [...prev, item.id]
                                                                : prev.filter((id) => id !== item.id);
                                                            setCheckAll(updated.length === currentItems.length);
                                                            return updated;
                                                        });
                                                    }}
                                                />
                                            </td>

                                            {/* Image + Name */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative w-12 h-12 rounded-xl group-hover:scale-105 transition-transform duration-300 shadow-sm overflow-hidden border border-slate-100">
                                                        <img
                                                            src={item.imageUrl}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm group-hover:text-[#005429] transition-colors">{item.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono tracking-wide mt-0.5">ID: {item.id}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="p-4">
                                                <span className="text-slate-600 font-bold text-xs bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 inline-block">
                                                    {Array.isArray(item.category)
                                                        ? item.category.map((category) => category.name).join(", ")
                                                        : item.category?.name || "-"}
                                                </span>
                                            </td>

                                            {/* Workstation */}
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${item.workstation === "bar"
                                                    ? "bg-blue-50 text-blue-700 border-blue-100"
                                                    : "bg-orange-50 text-orange-700 border-orange-100"
                                                    }`}>
                                                    {item.workstation === 'bar' ? 'Bar' : 'Dapur'}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="p-4">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.isActive}
                                                        onChange={() => {
                                                            setSelectedMenu(item);
                                                            setNewStatus(!item.isActive);
                                                            setIsConfirmOpen(true);
                                                        }}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#005429]"></div>
                                                    <span className={`ml-2 text-xs font-medium ${item.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {item.isActive ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </label>
                                            </td>

                                            {/* Price */}
                                            <td className="p-4 text-right">
                                                <span className="font-black text-slate-800 text-base tracking-tight">
                                                    {formatCurrency(item.originalPrice)}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    {/* Resep */}
                                                    {hasRecipe(item._id || item.id) ? (
                                                        <Link
                                                            to={`/admin/menu-receipt/${item.id}`}
                                                            className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-100 transition-colors"
                                                            title="Lihat Resep"
                                                        >
                                                            <FaReceipt size={14} />
                                                        </Link>
                                                    ) : (
                                                        <Link
                                                            to={`/admin/menu-receipt/${item.id}`}
                                                            className="p-2 rounded-lg bg-orange-50 text-orange-500 hover:bg-orange-100 border border-orange-100 transition-colors"
                                                            title="Buat Resep"
                                                        >
                                                            <FaReceipt size={14} />
                                                        </Link>
                                                    )}

                                                    {/* Edit & Delete */}
                                                    {location.pathname === '/admin/menu' ? (
                                                        <>
                                                            <Link
                                                                to={`/admin/menu-update/${item.id}`}
                                                                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <FaPencilAlt size={14} />
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDeleteClick(item)}
                                                                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-colors"
                                                                title="Hapus"
                                                            >
                                                                <FaTrashAlt size={14} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <Link
                                                            to={`/admin/ticket/edit-ticket/${item.id}`}
                                                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <FaPencilAlt size={14} />
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <div className="bg-slate-50 p-4 rounded-full mb-3 border border-slate-100">
                                                    <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-600 font-['Outfit',sans-serif]">Tidak ada menu ditemukan</h3>
                                                <p className="text-sm mt-1 text-slate-500 font-medium">Coba sesuaikan filter pencarianmu</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    <div className="p-4 border-t border-slate-200/80 bg-slate-50/30">
                        <Paginated
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            totalPages={totalPages}
                        />
                    </div>
                </div>
            </div>

            {/* Modal Konfirmasi Status */}
            <ConfirmationModalActive
                isOpen={isConfirmOpen}
                menu={selectedMenu}
                newStatus={newStatus}
                onClose={() => {
                    setIsConfirmOpen(false);
                    setSelectedMenu(null);
                    setNewStatus(null);
                }}
                onConfirm={async () => {
                    await handleUpdate(selectedMenu.id, newStatus);
                    setIsConfirmOpen(false);
                    setSelectedMenu(null);
                    setNewStatus(null);
                }}
            />

            {/* Modal Konfirmasi Delete */}
            <ConfirmModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmDelete}
                title="Hapus Menu"
                message={`Apakah Anda yakin ingin menghapus "${itemToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Ya, Hapus"
                cancelText="Batal"
            />

            {/* Modal Konfirmasi Bulk Delete */}
            <ConfirmModalBulkDelete
                isOpen={isModalBulkOpen}
                onClose={handleCloseModalBulk}
                onConfirm={handleConfirmBulkDelete}
                title="Hapus Menu"
                message={`Apakah Anda yakin ingin menghapus ${checkedItems.length} menu yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Ya, Hapus"
                cancelText="Batal"
            />
        </>
    )
}