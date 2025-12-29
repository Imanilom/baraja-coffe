// ============================================
// FRONTEND - SalesTransactionTable Component
// File: SalesTransactionTable.jsx (Fixed)
// ============================================

import React from "react";
import { FaSearch } from "react-icons/fa";
import Select from "react-select";
import Datepicker from "react-tailwindcss-datepicker";
import TransactionModal from "./modal";
import Paginated from "../../../../components/paginated";

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
                    <table className="min-w-full text-sm text-gray-900">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr className="text-left text-[13px]">
                                {/* Uncomment untuk enable checkbox selection */}
                                {/* <th className="px-4 py-3 w-12">
                                    <div className="flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            ref={input => {
                                                if (input) {
                                                    input.indeterminate = isSomeSelected;
                                                }
                                            }}
                                            onChange={handleSelectAll}
                                            disabled={isDeleting || paginatedData?.length === 0}
                                            className="w-4 h-4 text-[#005429] bg-gray-100 border-gray-300 rounded focus:ring-[#005429] focus:ring-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                            title="Pilih semua di halaman ini"
                                        />
                                    </div>
                                </th> */}
                                <th className="px-4 py-3 font-semibold w-2/12">Tanggal</th>
                                <th className="px-4 py-3 font-semibold w-1/12">Kasir</th>
                                <th className="px-4 py-3 font-semibold w-1/12">ID Struk</th>
                                <th className="px-4 py-3 font-semibold w-3/12">Produk</th>
                                <th className="px-4 py-3 font-semibold w-1/12">Tipe Penjualan</th>
                                <th className="px-4 py-3 font-semibold w-2/12">Metode Pembayaran</th>
                                <th className="px-4 py-3 font-semibold w-2/12 text-right">Total</th>
                            </tr>
                        </thead>

                        {paginatedData?.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {paginatedData.map((product, index) => {
                                    try {
                                        const orderId = product?.order_id || "N/A";
                                        const date = product?.createdAt;
                                        const cashier = product?.cashierId;
                                        const gro = product?.groId;
                                        const orderType = product?.orderType || "N/A";
                                        const paymentMethod = product?.actualPaymentMethod || "N/A";
                                        const isSelected = selectedItems.includes(product._id);

                                        let menuNames = [];
                                        let totalSubtotal = 0;

                                        // Process regular items
                                        if (Array.isArray(product?.items)) {
                                            menuNames = product.items.map((item) => {
                                                try {
                                                    const menuName = item?.menuItemData?.name ||
                                                        item?.menuItem?.name ||
                                                        "Produk tidak diketahui";

                                                    const addonLabels = [];
                                                    if (Array.isArray(item?.addons)) {
                                                        item.addons.forEach(addon => {
                                                            if (Array.isArray(addon?.options)) {
                                                                addon.options.forEach(option => {
                                                                    if (option?.label) {
                                                                        addonLabels.push(option.label);
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }

                                                    if (addonLabels.length > 0) {
                                                        return `${menuName} (${addonLabels.join(', ')})`;
                                                    }

                                                    return menuName;
                                                } catch (err) {
                                                    console.error('Error processing menu item:', err, item);
                                                    return "Error";
                                                }
                                            });

                                            totalSubtotal = product.items.reduce((sum, i) => {
                                                return sum + (Number(i?.subtotal) || 0);
                                            }, 0);
                                        }

                                        // Process custom amount items
                                        if (Array.isArray(product?.customAmountItems)) {
                                            const customNames = product.customAmountItems.map((customItem) => {
                                                try {
                                                    const customName = customItem?.name || 'Custom Amount';
                                                    return `[Custom] ${customName}`;
                                                } catch (err) {
                                                    console.error('Error processing custom amount item:', err, customItem);
                                                    return "[Custom] Error";
                                                }
                                            });

                                            menuNames = [...menuNames, ...customNames];

                                            const customSubtotal = product.customAmountItems.reduce((sum, i) => {
                                                return sum + (Number(i?.amount) || 0);
                                            }, 0);
                                            totalSubtotal += customSubtotal;
                                        }

                                        // Fallback jika tidak ada produk
                                        if (menuNames.length === 0) {
                                            menuNames = ["Tidak ada produk"];
                                        }

                                        return (
                                            <tr
                                                className={`text-left text-sm transition-colors ${isSelected
                                                    ? 'bg-blue-50 hover:bg-blue-100'
                                                    : 'hover:bg-slate-50'
                                                    }`}
                                                key={product._id || index}
                                            >
                                                {/* Uncomment untuk enable checkbox */}
                                                {/* <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleSelectItem(product._id)}
                                                            disabled={isDeleting}
                                                            className="w-4 h-4 text-[#005429] bg-gray-100 border-gray-300 rounded focus:ring-[#005429] focus:ring-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                </td> */}

                                                {/* Data Cells - Clickable to open modal */}
                                                <td
                                                    className="px-4 py-3 cursor-pointer"
                                                    onClick={() => setSelectedTrx(product)}
                                                >
                                                    {date ? formatDateTime(date) : "N/A"}
                                                </td>
                                                <td
                                                    className="px-4 py-3 cursor-pointer"
                                                    onClick={() => setSelectedTrx(product)}
                                                >
                                                    {gro?.name ? `${gro.name} (GRO)` : cashier?.username || "N/A"}
                                                </td>
                                                <td
                                                    className="px-4 py-3 cursor-pointer"
                                                    onClick={() => setSelectedTrx(product)}
                                                >
                                                    {orderId}
                                                </td>
                                                <td
                                                    className="px-4 py-3 cursor-pointer"
                                                    onClick={() => setSelectedTrx(product)}
                                                >
                                                    {menuNames.join(", ")}
                                                </td>
                                                <td
                                                    className="px-4 py-3 cursor-pointer"
                                                    onClick={() => setSelectedTrx(product)}
                                                >
                                                    {orderType}
                                                </td>
                                                <td
                                                    className="px-4 py-3 cursor-pointer"
                                                    onClick={() => setSelectedTrx(product)}
                                                >
                                                    {paymentMethod}
                                                </td>
                                                <td
                                                    className="px-4 py-3 text-right cursor-pointer"
                                                    onClick={() => setSelectedTrx(product)}
                                                >
                                                    {product?.grandTotal
                                                        ? `Rp ${product.grandTotal.toLocaleString('id-ID')}`
                                                        : "Rp 0"}
                                                </td>
                                            </tr>
                                        );
                                    } catch (err) {
                                        console.error(`Error rendering product ${index}:`, err, product);
                                        return (
                                            <tr className="text-left text-sm" key={`error-${index}`}>
                                                <td colSpan="7" className="px-4 py-3 text-red-500 text-center">
                                                    Error rendering product
                                                </td>
                                            </tr>
                                        );
                                    }
                                })}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr className="py-6 text-center w-full h-96">
                                    <td colSpan={7}>Tidak ada data ditemukan</td>
                                </tr>
                            </tbody>
                        )}

                        <tfoot className="border-t font-semibold text-sm">
                            <tr>
                                <td className="px-4 py-2" colSpan="6">
                                    Grand Total
                                </td>
                                <td className="px-2 py-2 text-right rounded">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full text-right">
                                        Rp {grandTotalFinal?.toLocaleString('id-ID') || '0'}
                                    </p>
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