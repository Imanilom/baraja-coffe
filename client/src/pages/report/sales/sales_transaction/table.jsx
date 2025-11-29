// import React from "react";
// import { FaSearch } from "react-icons/fa";
// import Select from "react-select";
// import Datepicker from "react-tailwindcss-datepicker";
// import TransactionModal from "./modal";
// import Paginated from "../../../../components/paginated";

// const SalesTransactionTable = ({
//     paginatedData,
//     grandTotalFinal,
//     setSelectedTrx,
//     formatDateTime,
//     formatCurrency,
//     options,
//     selectedOutlet,
//     handleOutletChange,
//     dateRange,
//     handleDateRangeChange,
//     searchTerm,
//     handleSearchChange,
//     customSelectStyles,
//     selectedTrx,
//     receiptRef,
//     currentPage,
//     totalPages,
//     handlePageChange
// }) => {
//     return (
//         <>
//             <div className="flex flex-wrap gap-4 md:justify-between items-center px-6 py-3">
//                 {/* Datepicker */}
//                 <div className="flex flex-col md:w-1/5 w-full">
//                     <div className="relative text-gray-500">
//                         <Datepicker
//                             showFooter
//                             showShortcuts
//                             value={dateRange}
//                             onChange={handleDateRangeChange}
//                             displayFormat="DD-MM-YYYY"
//                             inputClassName="w-full text-[13px] border py-[8px] pr-[25px] pl-[12px] rounded cursor-pointer"
//                             popoverDirection="down"
//                         />
//                     </div>
//                 </div>
//                 <div className="flex items-center flex-wrap gap-3">
//                     {/* Search */}
//                     <div className="relative md:w-64 w-full">
//                         <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//                         <input
//                             type="text"
//                             placeholder="Produk / Pelanggan / Kode Struk"
//                             value={searchTerm}
//                             onChange={(e) => handleSearchChange(e.target.value)}
//                             className="pl-9 pr-3 py-2 w-full border rounded-md text-sm focus:ring-1 focus:ring-green-900 focus:outline-none"
//                         />
//                     </div>
//                     {/* Outlet */}
//                     <div className="relative md:w-64 w-full">
//                         <Select
//                             className="text-sm"
//                             classNamePrefix="react-select"
//                             placeholder="Pilih Outlet"
//                             options={options}
//                             isSearchable
//                             value={
//                                 selectedOutlet
//                                     ? options.find((opt) => opt.value === selectedOutlet)
//                                     : options[0]
//                             }
//                             onChange={handleOutletChange}
//                             styles={customSelectStyles}
//                         />
//                     </div>
//                 </div>
//             </div>
//             <main className="flex-1 px-6">
//                 <div className="bg-white shadow rounded-lg overflow-x-auto">
//                     <table className="min-w-full text-sm text-gray-900">
//                         <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
//                             <tr className="text-left text-[13px]">
//                                 <th className="px-4 py-3 font-semibold w-2/12">Tanggal</th>
//                                 <th className="px-4 py-3 font-semibold w-1/12">Kasir</th>
//                                 <th className="px-4 py-3 font-semibold w-2/12">ID Struk</th>
//                                 <th className="px-4 py-3 font-semibold w-3/12">Produk</th>
//                                 <th className="px-4 py-3 font-semibold w-1/12">Tipe Penjualan</th>
//                                 <th className="px-4 py-3 font-semibold w-2/12 text-right">Total</th>
//                             </tr>
//                         </thead>

//                         {paginatedData.length > 0 ? (
//                             <tbody className="text-sm text-gray-400">
//                                 {paginatedData.map((product, index) => {
//                                     try {
//                                         const orderId = product?.order_id || {};
//                                         const date = product?.createdAt || {};
//                                         const cashier = product?.cashierId || {};
//                                         const orderType = product?.orderType || {};
//                                         let menuNames = [];
//                                         let totalSubtotal = 0;

//                                         if (Array.isArray(product?.items)) {
//                                             menuNames = product.items.map((i) => i?.menuItem.name || "N/A");
//                                             totalSubtotal = product.items.reduce((sum, i) => {
//                                                 return sum + (Number(i?.subtotal) || 0);
//                                             }, 0);
//                                         }

//                                         return (
//                                             <tr
//                                                 className="text-left text-sm cursor-pointer hover:bg-slate-50"
//                                                 key={product._id}
//                                                 onClick={() => setSelectedTrx(product)}
//                                             >
//                                                 <td className="px-4 py-3">{formatDateTime(date) || "N/A"}</td>
//                                                 <td className="px-4 py-3">{cashier?.username || "-"}</td>
//                                                 <td className="px-4 py-3">{orderId || "N/A"}</td>
//                                                 <td className="px-4 py-3">{menuNames.join(", ")}</td>
//                                                 <td className="px-4 py-3">{orderType || "N/A"}</td>
//                                                 <td className="px-4 py-3 text-right">
//                                                     {product.grandTotal.toLocaleString() || ""}
//                                                 </td>
//                                             </tr>
//                                         );
//                                     } catch (err) {
//                                         console.error(`Error rendering product ${index}:`, err, product);
//                                         return (
//                                             <tr className="text-left text-sm" key={index}>
//                                                 <td colSpan="7" className="px-4 py-3 text-red-500">
//                                                     Error rendering product
//                                                 </td>
//                                             </tr>
//                                         );
//                                     }
//                                 })}
//                             </tbody>
//                         ) : (
//                             <tbody>
//                                 <tr className="py-6 text-center w-full h-96">
//                                     <td colSpan={7}>Tidak ada data ditemukan</td>
//                                 </tr>
//                             </tbody>
//                         )}

//                         <tfoot className="border-t font-semibold text-sm">
//                             <tr>
//                                 <td className="px-4 py-2" colSpan="4">
//                                     Grand Total
//                                 </td>
//                                 <td className="px-2 py-2 text-right rounded" colSpan="2">
//                                     <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full text-right">
//                                         Rp {grandTotalFinal.toLocaleString()}
//                                     </p>
//                                 </td>
//                             </tr>
//                         </tfoot>
//                     </table>
//                     {selectedTrx && (
//                         <TransactionModal
//                             selectedTrx={selectedTrx}
//                             setSelectedTrx={setSelectedTrx}
//                             receiptRef={receiptRef}
//                             formatDateTime={formatDateTime}
//                             formatCurrency={formatCurrency}
//                         />
//                     )}
//                 </div>
//                 {/* Pagination Controls */}
//                 <Paginated
//                     currentPage={currentPage}
//                     setCurrentPage={handlePageChange}
//                     totalPages={totalPages}
//                 />
//             </main>
//         </>
//     );
// };

// export default SalesTransactionTable;

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
    handlePageChange
}) => {
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
                                <th className="px-4 py-3 font-semibold w-2/12">Tanggal</th>
                                <th className="px-4 py-3 font-semibold w-1/12">Kasir</th>
                                <th className="px-4 py-3 font-semibold w-1/12">ID Struk</th>
                                <th className="px-4 py-3 font-semibold w-3/12">Produk</th>
                                <th className="px-4 py-3 font-semibold w-1/12">Tipe Penjualan</th>
                                <th className="px-4 py-3 font-semibold w-2/12">Metode Pembayaran</th>
                                <th className="px-4 py-3 font-semibold w-2/12 text-right">Total</th>
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
                                        const paymentMethod = product?.actualPaymentMethod || product?.paymentMethod || "N/A";

                                        let menuNames = [];
                                        let totalSubtotal = 0;

                                        if (Array.isArray(product?.items)) {
                                            menuNames = product.items.map((i) => i?.menuItem.name || "N/A");
                                            totalSubtotal = product.items.reduce((sum, i) => {
                                                return sum + (Number(i?.subtotal) || 0);
                                            }, 0);
                                        }

                                        return (
                                            <tr
                                                className="text-left text-sm cursor-pointer hover:bg-slate-50"
                                                key={product._id}
                                                onClick={() => setSelectedTrx(product)}
                                            >
                                                <td className="px-4 py-3">{formatDateTime(date) || "N/A"}</td>
                                                <td className="px-4 py-3">{cashier?.username || "-"}</td>
                                                <td className="px-4 py-3">{orderId || "N/A"}</td>
                                                <td className="px-4 py-3">{menuNames.join(", ")}</td>
                                                <td className="px-4 py-3">{orderType || "N/A"}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-1">
                                                        <span>{paymentMethod}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {product.grandTotal.toLocaleString() || ""}
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

                        <tfoot className="border-t font-semibold text-sm">
                            <tr>
                                <td className="px-4 py-2" colSpan="5">
                                    Grand Total
                                </td>
                                <td className="px-2 py-2 text-right rounded" colSpan="2">
                                    <p className="bg-gray-100 inline-block px-2 py-[2px] rounded-full text-right">
                                        Rp {grandTotalFinal.toLocaleString()}
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
                <Paginated
                    currentPage={currentPage}
                    setCurrentPage={handlePageChange}
                    totalPages={totalPages}
                />
            </main>
        </>
    );
};

export default SalesTransactionTable;