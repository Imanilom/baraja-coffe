import React from "react";
import { FaChevronLeft, FaChevronRight, FaPencilAlt, FaReceipt, FaTrashAlt } from "react-icons/fa";
import Select from "react-select";
import CategoryTabs from "./filters/categorytabs";
import { Link } from "react-router-dom";
import MenuSkeleton from "./skeleton";

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
    checkAll,
    setCheckAll,
    checkedItems,
    setCheckedItems,
    currentItems,
    setSelectedMenu,
    setNewStatus,
    setIsConfirmOpen,
    formatCurrency,
    setCurrentPage,
    totalPages,
    menuItems,
    itemsPerPage,
    handleDeleteSelected,
    customStyles,
    currentPage,
    loading
}) {

    if (loading) return <MenuSkeleton />;

    return (
        <>
            <div className="px-[15px]">
                <CategoryTabs
                    categoryOptions={categoryOptions}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                />

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
                    </div>
                </div>
            </div>

            {/* Menu Table */}
            <div className="w-full">
                <div className="overflow-auto border rounded-lg mx-[15px]">
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
                                <th className="py-[15px] font-normal text-left">Status</th>
                                <th className="py-[15px] font-normal text-right">Harga</th>
                                <th className="py-[15px] font-normal w-20">
                                    {checkedItems.length > 0 && (
                                        <button
                                            onClick={handleDeleteSelected}
                                            className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 flex justify-center items-center space-x-2"
                                        >
                                            <p>{checkedItems.length}</p> <FaTrashAlt />
                                        </button>
                                    )}</th>
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
                                                    src={item.imageUrl || "https://via.placeholder.com/100"}
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

                                        <td className="py-2 text-gray-700 w-1/6">
                                            {/* Toggle Aktif / Tidak Aktif */}
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <span
                                                    className={`text-xs font-medium ${item.isActive ? "text-green-900" : "text-gray-500"
                                                        }`}
                                                >
                                                    {item.isActive ? "Aktif" : "Tidak Aktif"}
                                                </span>
                                                <div className="relative inline-flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.isActive}
                                                        // onChange={() => handleUpdate(item.id, item.isActive)}
                                                        onChange={() => {
                                                            setSelectedMenu(item);
                                                            setNewStatus(!item.isActive);
                                                            setIsConfirmOpen(true);
                                                        }}
                                                        className="sr-only peer"
                                                    />
                                                    {/* Background toggle */}
                                                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-900 transition-colors"></div>
                                                    {/* Lingkaran slider */}
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
                                                <Link
                                                    to={`/admin/menu-receipt/${item.id}`}
                                                    className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
                                                    title="Kelola Resep"
                                                >
                                                    <FaReceipt size={16} />
                                                </Link>

                                                {/* Edit */}
                                                <Link
                                                    to={`/admin/menu-update/${item.id}`}
                                                    className="p-2 rounded-md hover:bg-gray-100 text-green-900"
                                                    title="Edit"
                                                >
                                                    <FaPencilAlt size={16} />
                                                </Link>
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

            {/* Pagination */}
            <div className="flex justify-end mx-3 items-center mt-6 gap-2 flex-wrap">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >

                    <FaChevronLeft />
                </button>

                {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;

                    // Show page numbers for first, last, current ±2
                    if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                        return (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1 rounded border ${currentPage === page
                                    ? "bg-[#005429] text-white"
                                    : "bg-gray-100 text-gray-800"
                                    }`}
                            >
                                {page}
                            </button>
                        );
                    }

                    // Show "..." when skipping
                    if (
                        (page === currentPage - 3 && page > 1) ||
                        (page === currentPage + 3 && page < totalPages)
                    ) {
                        return (
                            <span key={page} className="px-2">
                                ...
                            </span>
                        );
                    }

                    return null;
                })}

                <button
                    onClick={() =>
                        setCurrentPage(prev =>
                            prev < Math.ceil(menuItems.length / itemsPerPage) ? prev + 1 : prev
                        )
                    }
                    disabled={currentPage >= Math.ceil(menuItems.length / itemsPerPage)}
                    className="px-2 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FaChevronRight />
                </button>
            </div>
        </>
    )
}