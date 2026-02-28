import React, { useState } from "react";
import { FaPencilAlt, FaReceipt, FaTrashAlt } from "react-icons/fa";
import Select from "react-select";
import CategoryTabs from "./categorytabs";
import { Link, useLocation } from "react-router-dom";
import MenuSkeleton from "./skeleton";
import ConfirmationModalActive from "../dialog/confirmationModalAction";
import axios from "axios";
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
            <div className="px-6">
                {location.pathname === '/admin/menu' && (
                    <CategoryTabs
                        categoryOptions={categoryOptions}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                    />
                )}

                <div className="flex items-center justify-between gap-3 py-3">
                    {/* Search */}
                    <div className="flex items-center flex-1 max-w-sm border rounded-lg px-3 py-2 bg-white shadow-sm">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-gray-400 mr-2"
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
                        <input
                            type="text"
                            placeholder="Cari ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 text-sm border-none focus:ring-0 outline-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Select
                            options={outletOptions}
                            value={outletOptions.find(option => option.value === selectedOutlet) || outletOptions[0]}
                            onChange={(selected) => setSelectedOutlet(selected.value)}
                            styles={customStyles}
                            isSearchable
                        />

                        <Select
                            options={statusOptions}
                            value={statusOptions.find(option => option.value === selectedStatus) || statusOptions[0]}
                            onChange={(selected) => setSelectedStatus(selected.value)}
                            styles={customStyles}
                            isSearchable
                        />

                        {location.pathname === '/admin/menu' && (
                            <Select
                                options={workstationOptions}
                                value={workstationOptions.find(option => option.value === selectedWorkstation) || workstationOptions[0]}
                                onChange={(selected) => setSelectedWorkstation(selected.value)}
                                styles={customStyles}
                                isSearchable
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Menu Table */}
            <div className="w-full px-6">
                {/* Filter Button Status Resep */}
                <div className="mb-3 flex items-center gap-3">
                    <span className="text-gray-600 font-medium text-sm">Filter Resep:</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setRecipeFilter('all')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${recipeFilter === 'all'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Semua
                        </button>
                        <button
                            onClick={() => setRecipeFilter('hasRecipe')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${recipeFilter === 'hasRecipe'
                                ? 'bg-green-600 text-white shadow-sm'
                                : 'text-green-600 hover:bg-gray-200'
                                }`}
                        >
                            <FaReceipt size={14} />
                            Sudah ada resep
                        </button>
                        <button
                            onClick={() => setRecipeFilter('noRecipe')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${recipeFilter === 'noRecipe'
                                ? 'bg-yellow-500 text-white shadow-sm'
                                : 'text-yellow-500 hover:bg-gray-200'
                                }`}
                        >
                            <FaReceipt size={14} />
                            Belum ada resep
                        </button>
                    </div>
                </div>

                <div className="overflow-auto border rounded-lg bg-white">
                    <table className="w-full table-auto text-gray-500">
                        <thead>
                            <tr className="text-sm border-b">
                                <th className="p-3 font-normal text-center w-10">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 accent-[#005429]"
                                        checked={checkAll}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            setCheckAll(isChecked);
                                            setCheckedItems(isChecked ? currentItems.map(item => item.id) : []);
                                        }}
                                    />
                                </th>
                                <th className="py-[15px] font-normal text-left">Produk</th>
                                <th className="py-[15px] font-normal text-left">Kategori</th>
                                <th className="py-[15px] font-normal text-left">Tempat</th>
                                <th className="py-[15px] font-normal text-left">Status</th>
                                <th className="py-[15px] font-normal text-right">Harga</th>
                                <th className="py-[15px] pr-2 font-normal flex justify-end">
                                    {checkedItems.length > 0 && (
                                        <button
                                            onClick={handleDeleteClickBulk}
                                            className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 flex items-center space-x-2"
                                        >
                                            <p>{checkedItems.length}</p> <FaTrashAlt />
                                        </button>
                                    )}
                                </th>
                            </tr>
                        </thead>
                        {currentItems.length > 0 ? (
                            <tbody className="divide-y divide-gray-200 text-sm">
                                {currentItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        {/* Checkbox */}
                                        <td className="p-3 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 accent-[#005429] rounded cursor-pointer"
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
                                        <td className="py-2 w-2/6">
                                            <div className="flex items-center">
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                                                />
                                                <div className="ml-3">
                                                    <p className="font-medium text-gray-800">{item.name}</p>
                                                    <p className="text-xs text-gray-500">ID: {item.id}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Category */}
                                        <td className="py-2 text-gray-700 w-1/6">
                                            {Array.isArray(item.category)
                                                ? item.category.map((category) => category.name).join(", ")
                                                : item.category?.name || "-"}
                                        </td>

                                        <td className="py-2 font-medium text-gray-900 w-1/6">
                                            <span className={item.workstation === "bar" ? "bg-blue-500 px-2 py-1 rounded text-white" : "bg-green-500 px-2 py-1 rounded text-white"}>
                                                {item.workstation}
                                            </span>
                                        </td>

                                        <td className="py-2 text-gray-700 w-1/6">
                                            {/* Toggle Aktif / Tidak Aktif */}
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <div className="relative inline-flex items-center">
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
                                                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-900 transition-colors"></div>
                                                    <div className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
                                                </div>
                                            </label>
                                        </td>

                                        {/* Price */}
                                        <td className="py-2 text-right font-medium text-gray-900 w-1/6">
                                            {formatCurrency(item.originalPrice)}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-2 w-1/6">
                                            <div className="flex items-center justify-end space-x-3">
                                                {/* Resep */}
                                                {hasRecipe(item._id || item.id) ? (
                                                    <Link
                                                        to={`/admin/menu-receipt/${item.id}`}
                                                        className="p-2 rounded-md hover:bg-gray-100 text-green-600"
                                                        title="Resep Tersedia"
                                                    >
                                                        <FaReceipt size={16} />
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        to={`/admin/menu-receipt/${item.id}`}
                                                        className="p-2 rounded-md hover:bg-gray-100 text-yellow-500"
                                                        title="Belum Ada Resep"
                                                    >
                                                        <FaReceipt size={16} />
                                                    </Link>
                                                )}

                                                {/* Edit & Delete */}
                                                {location.pathname === '/admin/menu' ? (
                                                    <div className="flex items-center gap-1">
                                                        <Link
                                                            to={`/admin/menu-update/${item.id}`}
                                                            className="p-2 rounded-md hover:bg-gray-100 text-green-900"
                                                            title="Edit"
                                                        >
                                                            <FaPencilAlt size={16} />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteClick(item)}
                                                            className="p-2 rounded-md hover:bg-red-50 text-red-600"
                                                            title="Hapus"
                                                        >
                                                            <FaTrashAlt size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <Link
                                                        to={`/admin/ticket/edit-ticket/${item.id}`}
                                                        className="p-2 rounded-md hover:bg-gray-100 text-green-900"
                                                        title="Edit"
                                                    >
                                                        <FaPencilAlt size={16} />
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr>
                                    <td colSpan={7} className="py-16 text-center text-gray-500">
                                        Tidak ada data ditemukan
                                    </td>
                                </tr>
                            </tbody>
                        )}
                    </table>
                </div>
            </div>

            <div className="px-6">
                <Paginated
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                />
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