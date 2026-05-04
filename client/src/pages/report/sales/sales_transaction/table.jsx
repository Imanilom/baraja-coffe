// ============================================
// FRONTEND - SalesTransactionTable Component
// File: SalesTransactionTable.jsx (Fixed)
// ============================================

import React from "react";
import { FaSearch } from "react-icons/fa";
import Select from "react-select";
import Datepicker from "react-tailwindcss-datepicker";
import TransactionModal from "./modal";
import Paginated from "../../../../components/Paginated";

const SalesTransactionTable = ({
    paginatedData,
    grandTotalFinal,
    setSelectedTrx,
    formatDateTime,
    formatCurrency,
    options,
    selectedOutlet,
    handleOutletChange,
    dateRange,
    handleDateRangeChange,
    searchTerm,
    handleSearchChange,
    customSelectStyles,
    selectedTrx,
    receiptRef,
    currentPage,
    totalPages,
    handlePageChange,
    // Props for delete functionality (optional)
    selectedItems = [],
    handleSelectItem,
    handleSelectAll,
    isDeleting = false
}) => {

    // Check if all items on current page are selected
    const isAllSelected = paginatedData?.length > 0 &&
        paginatedData.every(item => selectedItems.includes(item._id));

    // Check if some items are selected (for indeterminate state)
    const isSomeSelected = paginatedData?.some(item => selectedItems.includes(item._id)) && !isAllSelected;

    return (
        <>
            <div className="flex flex-wrap gap-4 md:justify-between items-center px-6 py-3">
                {/* Datepicker */}
                <div className="flex flex-col md:w-1/5 w-full">
                    <div className="relative text-gray-500">
                        <Datepicker
                            showFooter
                            showShortcuts
                            value={dateRange}
                            onChange={handleDateRangeChange}
                            displayFormat="DD-MM-YYYY"
                            inputClassName="w-full text-[13px] border py-[8px] pr-[25px] pl-[12px] rounded cursor-pointer"
                            popoverDirection="down"
                        />
                    </div>
                </div>
                <div className="flex items-center flex-wrap gap-3">
                    {/* Search */}
                    <div className="relative md:w-64 w-full">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Produk / Pelanggan / Kode Struk"
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-9 pr-3 py-2 w-full border rounded-md text-sm focus:ring-1 focus:ring-green-900 focus:outline-none"
                        />
                    </div>
                    {/* Outlet */}
                    <div className="relative md:w-64 w-full">
                        <Select
                            className="text-sm"
                            classNamePrefix="react-select"
                            placeholder="Pilih Outlet"
                            options={options}
                            isSearchable
                            value={
                                selectedOutlet
                                    ? options.find((opt) => opt.value === selectedOutlet)
                                    : options[0]
                            }
                            onChange={handleOutletChange}
                            styles={customSelectStyles}
                        />
                    </div>
                </div>
            </div>

            <main className="flex-1 px-6">
                <div className="bg-white shadow rounded-lg overflow-x-auto">
                    <table className="min-w-full text-xs text-gray-700">
                        <thead>
                            <tr className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                                <th className="px-5 py-3 font-bold w-2/12">Tanggal</th>
                                <th className="px-5 py-3 font-bold w-1/12">Kasir</th>
                                <th className="px-5 py-3 font-bold w-1/12">ID Struk</th>
                                <th className="px-5 py-3 font-bold w-3/12">Produk</th>
                                <th className="px-5 py-3 font-bold w-1/12 text-center">Tipe</th>
                                <th className="px-5 py-3 font-bold w-1/12">Pembayaran</th>
                                <th className="px-5 py-3 font-bold w-1/12 text-right">DP</th>
                                <th className="px-5 py-3 font-bold w-1/12 text-right">Pelunasan</th>
                                <th className="px-5 py-3 font-bold w-1/12 text-center">Status</th>
                                <th className="px-5 py-3 font-bold w-1/12 text-right">Total</th>
                            </tr>
                        </thead>

                        {paginatedData?.length > 0 ? (
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {paginatedData.map((product, index) => {
                                    try {
                                        const orderId = product?.order_id || "N/A";
                                        const date = product?.createdAt;
                                        const cashier = product?.cashierId;
                                        const gro = product?.groId;
                                        const orderType = product?.orderType || "N/A";
                                        const isSelected = selectedItems.includes(product._id);

                                        // Payment logic
                                        const payments = product?.payments || [];
                                        const paymentMethods = [];
                                        let dpAmount = 0;
                                        let pelunasanAmount = 0;

                                        payments.forEach(p => {
                                            const status = p.status?.toLowerCase();
                                            if (status === "settlement" || status === "paid" || status === "completed" || status === "capture" || status === "partial") {
                                                let methodName = p.method_type || p.method || "N/A";
                                                if (!paymentMethods.includes(methodName)) paymentMethods.push(methodName);
                                                if (p.paymentType === "Down Payment") dpAmount += p.amount || 0;
                                                else pelunasanAmount += p.amount || 0;
                                            }
                                        });

                                        const displayPaymentMethod = paymentMethods.length > 0 ? paymentMethods.join(", ") : (product?.actualPaymentMethod || "N/A");

                                        // Status Pembayaran logic
                                        let statusPembayaran = "N/A";
                                        if (dpAmount > 0 && pelunasanAmount === 0) statusPembayaran = "DP";
                                        else if (pelunasanAmount > 0 || product?.status === "Completed") statusPembayaran = "Lunas";

                                        let menuNames = [];
                                        if (Array.isArray(product?.items)) {
                                            menuNames = product.items.map((item) => {
                                                const menuName = item?.menuItemData?.name || item?.menuItem?.name || "Produk";
                                                const addonLabels = [];
                                                if (Array.isArray(item?.addons)) {
                                                    item.addons.forEach(addon => {
                                                        if (Array.isArray(addon?.options)) {
                                                            addon.options.forEach(option => { if (option?.label) addonLabels.push(option.label); });
                                                        }
                                                    });
                                                }
                                                return addonLabels.length > 0 ? `${menuName} (${addonLabels.join(', ')})` : menuName;
                                            });
                                        }

                                        if (Array.isArray(product?.customAmountItems)) {
                                            const customNames = product.customAmountItems.map((ci) => `[Custom] ${ci?.name || 'Item'}`);
                                            menuNames = [...menuNames, ...customNames];
                                        }

                                        if (menuNames.length === 0) menuNames = ["-"];

                                        return (
                                            <tr
                                                key={product._id || index}
                                                className={`hover:bg-gray-50/50 transition-colors duration-150 cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
                                                onClick={() => setSelectedTrx(product)}
                                            >
                                                <td className="px-5 py-2.5 text-gray-500 font-medium text-[11px]">
                                                    {date ? formatDateTime(date) : "N/A"}
                                                </td>
                                                <td className="px-5 py-2.5 font-bold text-gray-800">
                                                    {gro?.name ? `${gro.name} (GRO)` : cashier?.username || "N/A"}
                                                </td>
                                                <td className="px-5 py-2.5 font-black text-primary tracking-tight">
                                                    {orderId}
                                                </td>
                                                <td className="px-5 py-2.5">
                                                    <div className="max-w-[200px] truncate font-medium text-gray-600 text-[11px]" title={menuNames.join(", ")}>
                                                        {menuNames.join(", ")}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-2.5 text-center">
                                                    <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-black rounded uppercase tracking-tighter">
                                                        {orderType}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-2.5 font-medium text-gray-500 text-[10px]">
                                                    {displayPaymentMethod}
                                                </td>
                                                <td className="px-5 py-2.5 text-right font-medium text-gray-600 text-[11px]">
                                                    {dpAmount > 0 ? formatCurrency(dpAmount) : "-"}
                                                </td>
                                                <td className="px-5 py-2.5 text-right font-medium text-gray-600 text-[11px]">
                                                    {pelunasanAmount > 0 ? formatCurrency(pelunasanAmount) : "-"}
                                                </td>
                                                <td className="px-5 py-2.5 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight ${statusPembayaran === "Lunas" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                                                        {statusPembayaran}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-2.5 text-right font-black text-gray-900 text-[11px]">
                                                    {formatCurrency(product?.grandTotal || 0)}
                                                </td>
                                            </tr>
                                        );
                                    } catch (err) {
                                        return <tr key={index}><td colSpan="10" className="px-5 py-3 text-red-500 text-center text-xs">Error</td></tr>;
                                    }
                                })}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr className="py-6 text-center w-full h-96">
                                    <td colSpan={10}>Tidak ada data ditemukan</td>
                                </tr>
                            </tbody>
                        )}

                        <tfoot className="border-t font-bold text-xs bg-gray-50/50">
                            <tr>
                                <td className="px-5 py-3 text-gray-900 border-r border-gray-100" colSpan="9">
                                    Grand Total
                                </td>
                                <td className="px-5 py-3 text-right font-black">
                                    <span className="bg-primary text-white px-3 py-1 rounded shadow-md shadow-primary/10">
                                        {formatCurrency(grandTotalFinal || 0)}
                                    </span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    {selectedTrx && (
                        <TransactionModal
                            selectedTrx={selectedTrx}
                            setSelectedTrx={setSelectedTrx}
                            receiptRef={receiptRef}
                            formatDateTime={formatDateTime}
                            formatCurrency={formatCurrency}
                        />
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <Paginated
                        currentPage={currentPage}
                        setCurrentPage={handlePageChange}
                        totalPages={totalPages}
                    />
                )}
            </main>
        </>
    );
};

export default SalesTransactionTable;
