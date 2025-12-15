import axios from "axios";
import React, { useState, useEffect, useMemo } from "react";
import { FaClipboardList, FaChevronRight, FaSearch, FaFileExcel } from "react-icons/fa";
import * as XLSX from 'xlsx';

const StockManagement = () => {
    const [productStock, setProductStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);

    const ITEMS_PER_PAGE = 50;

    // Fetch stock data
    useEffect(() => {
        const fetchStockData = async () => {
            try {
                setLoading(true);

                // Simulasi delay untuk loading
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Kode asli untuk production (uncomment saat API sudah siap)
                const productResponse = await axios.get("/api/marketlist/products");
                const products = productResponse.data.data || [];

                const stockResponse = await axios.get("/api/product/stock/all");
                const stockData = stockResponse.data.data || [];

                const stockMap = {};
                if (stockData && stockData.length > 0) {
                    stockData.forEach((s) => {
                        try {
                            if (s?.productId?._id) {
                                stockMap[s.productId._id] = s;
                            }
                        } catch (error) {
                            console.error("Error processing stock item:", s, error);
                        }
                    });
                }

                const mergedData = await Promise.all(
                    products.map(async (prod) => {
                        const stockItem = stockMap[prod._id] || null;

                        let movements = [];
                        if (stockItem?.productId?._id) {
                            try {
                                const movementResponse = await axios.get(
                                    `/api/product/stock/${stockItem.productId._id}/movements`
                                );
                                movements = movementResponse.data?.data?.movements || [];
                            } catch (err) {
                                console.error(`No movements for product: ${prod.name}`, err.message);
                            }
                        }

                        return {
                            ...prod,
                            stock: stockItem?.stock || 0,
                            stockData: stockItem || null,
                            movements,
                        };
                    })
                );

                setProductStock(mergedData);
                setFilteredData(mergedData);
                setError(null);

            } catch (err) {
                console.error("Error fetching stock:", err);
                setError(`Failed to load stock data: ${err.message}`);
                setProductStock([]);
                setFilteredData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStockData();
    }, []);

    // Filter data berdasarkan pencarian
    useEffect(() => {
        if (!search) {
            setFilteredData(productStock);
            setCurrentPage(1);
            return;
        }

        const searchLower = search.toLowerCase();
        const filtered = productStock.filter(product => {
            const name = (product.name || '').toLowerCase();
            const sku = (product.sku || '').toLowerCase();
            const barcode = (product.barcode || '').toLowerCase();
            const category = (product.category || '').toLowerCase();

            return name.includes(searchLower) ||
                sku.includes(searchLower) ||
                barcode.includes(searchLower) ||
                category.includes(searchLower);
        });

        setFilteredData(filtered);
        setCurrentPage(1);
    }, [search, productStock]);

    // Paginate data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, endIndex);
    }, [currentPage, filteredData]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Calculate grand total
    const grandTotalStock = useMemo(() => {
        return filteredData.reduce((total, product) => {
            return total + ((product.stock || 0) * (product.price || 0));
        }, 0);
    }, [filteredData]);

    // Get stock status
    const getStockStatus = (product) => {
        const stock = product.stockData !== null ? product.stockData.currentStock : 0;
        const minStock = product.stockData !== null ? product.stockData.minStock : 0;

        if (stock === 0) {
            return { text: 'Habis', color: 'text-red-600 bg-red-50' };
        } else if (stock <= minStock) {
            return { text: 'Akan Habis', color: 'text-orange-600 bg-orange-50' };
        }
        return { text: 'Tersedia', color: 'text-green-600 bg-green-50' };
    };

    // Export to Excel Function
    const exportToExcel = () => {
        try {
            // Prepare data for export
            const exportData = filteredData.map((product, index) => {
                const stock = product.stockData !== null ? product.stockData.currentStock : 0;
                const minStock = product.stockData !== null ? product.stockData.minStock : 0;
                const status = getStockStatus(product);
                const nilaiStockPerUnit = product.price || 0;
                const nilaiStock = stock * nilaiStockPerUnit;

                return {
                    'No': index + 1,
                    'Nama Produk': product.name || '-',
                    'SKU': product.sku || '-',
                    'Kategori': product.category || '-',
                    'Barcode': product.barcode || '-',
                    'Stok Saat Ini': stock,
                    'Stok Minimum': minStock,
                    'Satuan': product.unit || '-',
                    'Status': status.text,
                    'Harga per Unit': nilaiStockPerUnit,
                    'Nilai Total Stok': nilaiStock
                };
            });

            // Create workbook
            const wb = XLSX.utils.book_new();

            // Create main worksheet
            const ws = XLSX.utils.json_to_sheet([]);

            // Add company header
            XLSX.utils.sheet_add_aoa(ws, [
                ['LAPORAN STOK PRODUK'],
                ['Tanggal Export: ' + new Date().toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })],
                [''],
                ['DETAIL STOK']
            ], { origin: 'A1' });

            // Add data starting from row 12
            XLSX.utils.sheet_add_json(ws, exportData, { origin: 'A12' });

            // Add grand total row
            const lastRow = 12 + exportData.length;
            XLSX.utils.sheet_add_aoa(ws, [
                ['', '', '', '', '', '', '', '', '', 'GRAND TOTAL:', grandTotalStock]
            ], { origin: `A${lastRow}` });

            // Set column widths
            ws['!cols'] = [
                { wch: 5 },   // No
                { wch: 30 },  // Nama Produk
                { wch: 15 },  // SKU
                { wch: 15 },  // Kategori
                { wch: 15 },  // Barcode
                { wch: 12 },  // Stok Saat Ini
                { wch: 12 },  // Stok Minimum
                { wch: 10 },  // Satuan
                { wch: 12 },  // Status
                { wch: 15 },  // Harga per Unit
                { wch: 18 }   // Nilai Total Stok
            ];

            // Apply styles (basic styling for SheetJS)
            const range = XLSX.utils.decode_range(ws['!ref']);

            // Style header cells
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const address = XLSX.utils.encode_col(C) + "1";
                if (!ws[address]) continue;
                ws[address].s = {
                    font: { bold: true, sz: 14 },
                    alignment: { horizontal: "center" }
                };
            }

            // Format currency columns
            for (let R = 12; R <= lastRow; ++R) {
                // Harga per Unit (column J)
                const priceCell = 'J' + R;
                if (ws[priceCell] && typeof ws[priceCell].v === 'number') {
                    ws[priceCell].z = '#,##0';
                }

                // Nilai Total Stok (column K)
                const totalCell = 'K' + R;
                if (ws[totalCell] && typeof ws[totalCell].v === 'number') {
                    ws[totalCell].z = '#,##0';
                }
            }

            // Format grand total in summary
            if (ws['B9']) {
                ws['B9'].z = '#,##0';
            }

            // Format grand total at bottom
            const grandTotalCell = 'K' + lastRow;
            if (ws[grandTotalCell]) {
                ws[grandTotalCell].z = '#,##0';
            }

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Laporan Stok');

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `Laporan_Stok_${timestamp}.xlsx`;

            // Write file
            XLSX.writeFile(wb, filename);

            // Show success message
            alert('File Excel berhasil diexport!');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Gagal mengexport file Excel. Silakan coba lagi.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded hover:bg-[#003d1f]"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb */}
            <div className="bg-white px-6 py-3 border-b">
                <div className="flex items-center space-x-2 text-sm">
                    <FaClipboardList size={16} className="text-gray-500" />
                    <span className="text-gray-500">Laporan</span>
                    <FaChevronRight className="text-xs text-gray-400" />
                    <span className="text-gray-500">Laporan Operational</span>
                    <FaChevronRight className="text-xs text-gray-400" />
                    <span className="text-[#005429] font-medium">Stok</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-6">
                {/* Search and Actions */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex justify-between items-center gap-4">
                        <div className="flex-1 max-w-md relative">
                            <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari produk, SKU, barcode, atau kategori..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full text-sm border border-gray-300 py-2 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005429] focus:border-transparent"
                            />
                        </div>
                        <button
                            onClick={exportToExcel}
                            className="bg-[#005429] text-white text-sm px-6 py-2 rounded-lg hover:bg-[#003d1f] transition-colors flex items-center gap-2"
                        >
                            <FaFileExcel className="w-4 h-4" />
                            Ekspor Excel
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-500 mb-1">Total Produk</p>
                        <p className="text-2xl font-semibold text-gray-800">{filteredData.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-500 mb-1">Stok Tersedia</p>
                        <p className="text-2xl font-semibold text-green-600">
                            {filteredData.filter(p => (p.stockData !== null ? p.stockData.currentStock : 0) > (p.stockData !== null ? p.stockData.minStock : 0)).length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-500 mb-1">Akan Habis</p>
                        <p className="text-2xl font-semibold text-orange-600">
                            {filteredData.filter(p => (p.stockData !== null ? p.stockData.currentStock : 0) > 0 && (p.stockData !== null ? p.stockData.currentStock : 0) <= (p.stockData !== null ? p.stockData.minStock : 0)).length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <p className="text-sm text-gray-500 mb-1">Stok Habis</p>
                        <p className="text-2xl font-semibold text-red-600">
                            {filteredData.filter(p => (p.stockData !== null ? p.stockData.currentStock : 0) === 0).length}
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Produk
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        SKU
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Kategori
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Barcode
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stok
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Harga/Unit
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nilai Stok
                                    </th>
                                </tr>
                            </thead>
                            {paginatedData.length > 0 ? (
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedData.map((product) => {
                                        const nilaiStockPerUnit = product.price || 0;
                                        const nilaiStock = (product.stock || 0) * nilaiStockPerUnit;
                                        const status = getStockStatus(product);

                                        return (
                                            <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {product.name || "-"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {product.sku || "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {product.category || "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {product.barcode || "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {product.stockData !== null ? product.stockData.currentStock : 0}
                                                    </span>
                                                    <span className="text-xs text-gray-500 ml-1">
                                                        {product.unit || ""}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                                                        {status.text}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                    {formatCurrency(nilaiStockPerUnit)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                                    {formatCurrency(nilaiStock)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            ) : (
                                <tbody>
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <FaClipboardList size={48} className="mb-3 opacity-50" />
                                                <p className="text-sm">Tidak ada data ditemukan</p>
                                                {search && (
                                                    <p className="text-xs mt-1">
                                                        Coba ubah kata kunci pencarian Anda
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            )}
                            {paginatedData.length > 0 && (
                                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-sm font-semibold text-gray-700">
                                            Grand Total Nilai Stok
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-bold text-[#005429]">
                                                {formatCurrency(grandTotalStock)}
                                            </span>
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {/* Pagination */}
                    {paginatedData.length > 0 && totalPages > 1 && (
                        <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-200">
                            <div className="text-sm text-gray-700">
                                Menampilkan <span className="font-medium">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> - <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}</span> dari <span className="font-medium">{filteredData.length}</span> data
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                                >
                                    Sebelumnya
                                </button>
                                <div className="flex items-center px-3 text-sm text-gray-700">
                                    Halaman <span className="font-medium mx-1">{currentPage}</span> dari <span className="font-medium ml-1">{totalPages}</span>
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                                >
                                    Berikutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockManagement;