import React from "react";
import { FaSearch } from "react-icons/fa";
import Select from "react-select";
import Datepicker from "react-tailwindcss-datepicker";
import TransactionModal from "./modal";
import Paginated from "../../../../components/Paginated";
import StatusCheckboxFilter from "./status_checkbox";

const TypeTransactionTable = ({
    paginatedData,
    grandTotalFinal,
    setSelectedTrx,
    formatDateTime,
    formatCurrency,
    options,
    selectedOutlet,
    handleOutletChange,
    statusOptions,
    selectedStatus,
    handleStatusChange,
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
    updateStatus,
    isUpdatingStatus
}) => {
    // Helper function untuk styling badge status
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case "Completed":
                return "bg-green-100 text-green-700 border border-green-200";
            case "Pending":
            case "Waiting":
                return "bg-amber-100 text-amber-700 border border-amber-200";
            case "OnProcess":
                return "bg-blue-100 text-blue-700 border border-blue-200";
            case "Cancelled":
                return "bg-red-100 text-red-700 border border-red-200";
            default:
                return "bg-gray-100 text-gray-700 border border-gray-200";
        }
    };

    const getPaymentStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case "settlement":
            case "paid":
            case "completed":
                return "bg-green-100 text-green-700 border border-green-200";
            case "pending":
                return "bg-amber-100 text-amber-700 border border-amber-200";
            case "failed":
            case "expired":
            case "denied":
                return "bg-red-100 text-red-700 border border-red-200";
            default:
                return "bg-gray-100 text-gray-700 border border-gray-200";
        }
    };

    return (
        <>
            <div className="flex flex-wrap gap-4 justify-between items-center px-6 py-4 mb-4">
                <div className="w-64">
                    <Datepicker
                        showFooter
                        showShortcuts
                        value={dateRange}
                        onChange={handleDateRangeChange}
                        displayFormat="DD-MM-YYYY"
                        inputClassName="w-full text-[13px] border border-gray-200 py-2 pr-[25px] pl-[12px] rounded-lg cursor-pointer focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm h-[38px] focus:outline-none"
                        popoverDirection="down"
                    />
                </div>
                
                <div className="flex items-center flex-wrap gap-3">
                    <div className="relative w-72">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                        <input
                            type="text"
                            placeholder="Cari Produk / Pelanggan / ID..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-9 pr-3 py-2 w-full border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm h-[38px] focus:outline-none"
                        />
                    </div>
                    
                    <div className="w-56">
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

                    <StatusCheckboxFilter
                        selectedStatus={selectedStatus}
                        onChange={handleStatusChange}
                    />
                </div>
            </div>
            <main className="flex-1 px-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr className="bg-gray-50/50 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                <th className="px-6 py-4">Waktu</th>
                                <th className="px-6 py-4">Kasir</th>
                                <th className="px-6 py-4">ID Struk</th>
                                <th className="px-6 py-4">Daftar Produk</th>
                                <th className="px-6 py-4">Tipe</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Metode</th>
                                <th className="px-6 py-4 text-right">Total Akhir</th>
                            </tr>
                        </thead>

                        {paginatedData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {paginatedData.map((product, index) => {
                                    try {
                                        const orderId = product?.order_id || {};
                                        const date = product?.createdAt || {};
                                        const cashier = product?.cashierId || {};
                                        const orderType = product?.orderType || {};
                                        const status = product?.status || "N/A";
                                        const paymentStatus = product?.paymentDetails?.status || "-";

                                        // Baca payment method dari array payments (sama seperti sales_transaction)
                                        const payments = product?.payments || [];
                                        const paymentMethods = [];
                                        payments.forEach(p => {
                                            const pStatus = p.status?.toLowerCase();
                                            if (pStatus === "settlement" || pStatus === "paid" || pStatus === "completed" || pStatus === "capture" || pStatus === "partial") {
                                                const methodName = p.method_type || p.method || p.paymentMethod || "N/A";
                                                if (methodName && !paymentMethods.includes(methodName)) {
                                                    paymentMethods.push(methodName);
                                                }
                                            }
                                        });
                                        const paymentMethod = paymentMethods.length > 0
                                            ? paymentMethods.join(", ")
                                            : (product?.actualPaymentMethod || "-");


                                        let menuNames = [];
                                        let totalSubtotal = 0;

                                        if (Array.isArray(product?.items)) {
                                            // ✅ Perbaikan: Ambil nama menu + addons yang dipilih
                                            menuNames = product.items.map((item) => {
                                                try {
                                                    // Nama menu (prioritas: menuItemData → menuItem → fallback)
                                                    const menuName = item?.menuItemData?.name ||
                                                        item?.menuItem?.name ||
                                                        "Produk tidak diketahui";

                                                    // Ambil addon labels yang dipilih
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

                                                    // Gabungkan nama menu dengan addons (jika ada)
                                                    if (addonLabels.length > 0) {
                                                        return `${menuName} ( ${addonLabels.join(', ')} )`;
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

                                        return (
                                            <tr
                                                className="hover:bg-primary/5 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                                                key={product._id}
                                                onClick={() => setSelectedTrx(product)}
                                            >
                                                <td className="px-6 py-4 text-gray-600 font-medium">{formatDateTime(date) || "N/A"}</td>
                                                <td className="px-6 py-4 text-gray-700">{cashier?.username || "-"}</td>
                                                <td className="px-6 py-4 font-mono text-gray-400 text-[11px]">{orderId || "N/A"}</td>
                                                <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{menuNames.join(", ")}</td>
                                                <td className="px-6 py-4 font-medium text-gray-500">{orderType || "N/A"}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(status)}`}>
                                                        {status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-gray-900 font-semibold text-[12px] bg-gray-100 px-2 py-1 rounded">
                                                        {paymentMethod}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-gray-900">
                                                    {formatCurrency(product.grandTotal)}
                                                </td>
                                            </tr>
                                        );
                                    } catch (err) {
                                        console.error(`Error rendering product ${index}:`, err, product);
                                        return (
                                            <tr className="text-left text-sm" key={index}>
                                                <td colSpan="8" className="px-4 py-3 text-red-500">
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
                                    <td colSpan={8}>Tidak ada data ditemukan</td>
                                </tr>
                            </tbody>
                        )}

                        <tfoot className="bg-gray-50/50 font-semibold text-sm border-t">
                            <tr>
                                <td className="px-6 py-4 text-gray-900 border-r border-gray-100 uppercase text-[11px] font-bold tracking-widest" colSpan="6">
                                    Grand Total
                                </td>
                                <td className="px-6 py-4 text-right" colSpan="2">
                                    <span className="bg-primary text-white inline-block px-4 py-1.5 rounded-lg shadow-sm text-base">
                                        {formatCurrency(grandTotalFinal)}
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
                            updateStatus={updateStatus}
                            isUpdatingStatus={isUpdatingStatus}
                        />
                    )}
                </div>
                {/* Pagination Controls */}
                <Paginated
                    currentPage={currentPage}
                    setCurrentPage={handlePageChange}
                    totalPages={totalPages}
                />
            </main>
        </>
    );
};

export default TypeTransactionTable;
