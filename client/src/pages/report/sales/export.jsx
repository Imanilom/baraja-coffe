import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { exportToExcel } from "../../../utils/exportHelper";
import Datepicker from "react-tailwindcss-datepicker";
import axios from "axios";

const ExportFilter = ({ isOpen, onClose }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [orders, setOrders] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [selectedMainTypes, setSelectedMainTypes] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [dateRange, setDateRange] = useState({
        startDate: dayjs(),
        endDate: dayjs(),
    });

    const mainCategory = [{ name: "makanan", type: "food" }, { name: "minuman", type: "beverage" }];
    const workstation = ["kitchen", "bar"];

    const [selectedCategories, setSelectedCategories] = useState([]);

    const fetchOrder = async () => {
        const orderResponse = await axios.get('/api/orders');
        const orderData = orderResponse.data.data || [];
        // Filter hanya berdasarkan status Completed, TIDAK filter orderType
        const filteredOrders = orderData.filter(order => order.status === 'Completed');
        console.log('Total orders fetched:', filteredOrders.length);
        console.log('Order types:', [...new Set(filteredOrders.map(o => o.orderType))]);
        setOrders(filteredOrders)
    }

    const fetchCategory = async () => {
        const categoryResponse = await axios.get('/api/menu/categories');
        const categoryData = categoryResponse.data.data || [];
        const mainCategory = categoryData.filter((cat) => !cat.parentCategory);
        setCategories(mainCategory);

        // Sub Category
        const groupedSubCategories = {};
        categoryData.forEach((cat) => {
            if (cat.parentCategory) {
                const parentId = cat.parentCategory._id || cat.parentCategory;
                if (!groupedSubCategories[parentId]) {
                    groupedSubCategories[parentId] = [];
                }
                groupedSubCategories[parentId].push(cat);
            }
        });

        setSubCategories(groupedSubCategories);
    }

    const fetchOutlet = async () => {
        const outletResponse = await axios.get('/api/outlet');
        const outletData = outletResponse.data.data;
        setOutlets(outletData);
    }

    useEffect(() => {
        fetchOrder();
        fetchCategory();
        fetchOutlet();
    }, [])

    const handleDateChange = (newValue) => {
        setDateRange(newValue);
    };

    const handleCheckboxChange = (category) => {
        setSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        );
    };

    const handleExport = async () => {
        setIsExporting(true);

        try {
            // Filter orders berdasarkan tanggal
            const filtered = orders.filter((order) => {
                const tanggal = new Date(order.createdAt);
                const start = dateRange.startDate ? new Date(dateRange.startDate) : null;
                const end = dateRange.endDate ? new Date(dateRange.endDate) : null;
                if (start) start.setHours(0, 0, 0, 0);
                if (end) end.setHours(23, 59, 59, 999);
                const inDateRange = (!start || tanggal >= start) && (!end || tanggal <= end);

                return inDateRange;
            });

            const formatDateTime = (isoString) => {
                const date = new Date(isoString);
                const pad = (num) => String(num).padStart(2, '0');
                return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
            };

            const exportData = filtered.flatMap((order) => {
                const outletObj = outlets.find(o => o._id === order.outlet._id);
                const outletName = outletObj?.name || '';
                const outletCode = outletObj?._id || '';

                // Cek apakah ada filter kategori yang dipilih
                const noFilterSelected =
                    selectedMainTypes.length === 0 &&
                    selectedCategories.length === 0;

                // Filter items berdasarkan kategori yang dipilih
                const filteredItems = noFilterSelected
                    ? order.items
                    : order.items.filter((item) => {
                        const menuItem = item.menuItem || {};
                        const mainCat = menuItem.mainCategory;
                        const cat = menuItem.category;
                        const work = menuItem.workstation;

                        // Cek apakah main category cocok dengan yang dipilih
                        const mainCatObj = mainCategory.find((m) => m.name === mainCat);
                        const isMainCategoryMatch = mainCatObj && selectedMainTypes.includes(mainCatObj.type);

                        // Cek apakah category cocok dengan yang dipilih
                        const isCategoryMatch = selectedCategories.includes(cat);

                        // Cek apakah workstation cocok dengan yang dipilih
                        const isWorkstationMatch = selectedCategories.includes(work);

                        // Jika ada filter main category dan cocok
                        if (selectedMainTypes.length > 0 && !isMainCategoryMatch) {
                            return false;
                        }

                        // Jika ada filter category/workstation
                        if (selectedCategories.length > 0) {
                            return isCategoryMatch || isWorkstationMatch;
                        }

                        return true;
                    });

                // Jika tidak ada item yang cocok setelah filter, skip order ini
                if (filteredItems.length === 0) return [];

                // Hitung total dari filtered items saja
                const filteredItemsSubtotal = filteredItems.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0);

                // Hitung proporsi untuk tax dan service charge
                const originalItemsSubtotal = order.items.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0);
                const proportion = originalItemsSubtotal > 0 ? filteredItemsSubtotal / originalItemsSubtotal : 0;

                const proportionalTax = (order.totalTax || 0) * proportion;
                const proportionalServiceCharge = (order.totalServiceFee || 0) * proportion;
                const filteredGrandTotal = filteredItemsSubtotal + proportionalTax + proportionalServiceCharge;

                // Map setiap item ke baris Excel
                return filteredItems.map((item, index) => {

                    return {
                        "Tanggal & Waktu": formatDateTime(order.createdAt),
                        "ID Struk": order.order_id || '-',
                        "Status Pembayaran": order.status || '-',
                        "ID / Kode Outlet": outletCode,
                        "Outlet": outletName,
                        "Tipe Penjualan": order.orderType || '-',
                        "Kasir": order.cashierId?.username || '-',
                        "No. Hp Pelanggan": '-',
                        "Nama Pelanggan": order.user || '-',
                        "SKU": '-',
                        "Nama Produk": item.menuItem?.name || '-',
                        "Kategori": item.menuItem?.category.name || '-',
                        "Jumlah Produk": item.quantity || 0,
                        "Harga Produk": item.menuItem?.price || 0,
                        "Penjualan Kotor": Number(item.subtotal) || 0,
                        "Diskon Produk": 0,
                        "Subtotal": index === 0 ? filteredItemsSubtotal : '-',
                        "Diskon Transaksi": 0,
                        "Pajak": index === 0 ? Math.round(proportionalTax) : '-',
                        "Service Charge": index === 0 ? Math.round(proportionalServiceCharge) : '-',
                        "Pembulatan": 0,
                        "Poin Ditukar": 0,
                        "Biaya Admin": 0,
                        "Total": index === 0 ? Math.round(filteredGrandTotal) : '-',
                        "Metode Pembayaran": order.paymentMethod || '-',
                        "Pembayaran": index === 0 ? Math.round(filteredGrandTotal) : '-',
                        "Kode Voucher": '-'
                    };
                });
            });

            const formatDate = (dateStr) => {
                if (!dateStr) return "semua-tanggal";
                const date = new Date(dateStr);
                const dd = String(date.getDate()).padStart(2, '0');
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const yyyy = date.getFullYear();
                return `${dd}-${mm}-${yyyy}`;
            };

            const startLabel = formatDate(dateRange.startDate);
            const endLabel = formatDate(dateRange.endDate);
            const fileName = `Penjualan ${startLabel} - ${endLabel}.xlsx`;

            const headerInfo = [
                ["Tanggal", `${startLabel} - ${endLabel}`],
                ["Status Transaksi", "Completed"],
                ["Tipe Penjualan", "Semua Tipe"],
            ];

            await new Promise(resolve => setTimeout(resolve, 500));

            exportToExcel(exportData, fileName, headerInfo);
        } catch (error) {
            console.error('Error exporting:', error);
            alert('Terjadi kesalahan saat mengekspor data');
        } finally {
            setIsExporting(false);
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-md shadow-2xl p-8 max-w-2xl w-full relative">
                {/* Tombol Tutup */}
                <div className="flex justify-between mb-6">
                    {/* Header */}
                    <h2 className="text-2xl font-semibold text-gray-800">Ekspor Data</h2>

                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-500 text-3xl"
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>

                {/* Konten */}
                <div className="space-y-6">

                    {/* Pilih Tanggal */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Tanggal</label>
                        <Datepicker
                            showFooter
                            showShortcuts
                            value={dateRange}
                            onChange={handleDateChange}
                            displayFormat="DD-MM-YYYY"
                            inputClassName="w-full border border-gray-300 p-2 rounded-lg focus:ring-1 focus:ring-[#005429] focus:outline-none"
                            popoverDirection="down"
                        />
                    </div>

                    {/* Main Kategori */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Pilih Main Kategori (Opsional)</p>
                        <div className="flex flex-wrap gap-3">
                            {mainCategory.map((mainCat) => (
                                <label key={mainCat.name} className="inline-flex items-center text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        className="mr-2 accent-[#005429]"
                                        checked={selectedMainTypes.includes(mainCat.type)}
                                        onChange={() => {
                                            setSelectedMainTypes((prev) =>
                                                prev.includes(mainCat.type)
                                                    ? prev.filter((t) => t !== mainCat.type)
                                                    : [...prev, mainCat.type]
                                            );
                                        }}
                                    />
                                    {mainCat.name
                                        .split(' ')
                                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ')
                                    }
                                </label>
                            ))}
                        </div>
                    </div>

                    {selectedMainTypes.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Pilih Kategori (Opsional)</p>
                            <div className="flex flex-wrap gap-3">
                                {categories
                                    .filter((cat) => selectedMainTypes.includes(cat.type))
                                    .map((category) => (
                                        <label key={category._id} className="inline-flex items-center text-sm text-gray-600">
                                            <input
                                                type="checkbox"
                                                className="mr-2 accent-[#005429]"
                                                checked={selectedCategories.includes(category._id)}
                                                onChange={() => handleCheckboxChange(category._id)}
                                            />
                                            {category.name}
                                        </label>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Workstation */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Tempat (Opsional)</p>
                        <div className="flex flex-wrap gap-3">
                            {workstation.map((work) => (
                                <label key={work} className="inline-flex items-center text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        className="mr-2 accent-[#005429]"
                                        checked={selectedCategories.includes(work)}
                                        onChange={() => handleCheckboxChange(work)}
                                    />
                                    {work
                                        .split(' ')
                                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ')
                                    }
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-800">
                            💡 <strong>Info:</strong> Jika tidak ada filter kategori/tempat yang dipilih, semua data dalam rentang tanggal akan diekspor.
                        </p>
                    </div>

                    {/* Tombol Ekspor */}
                    <div className="pt-4">
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${isExporting
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-white hover:bg-[#005429] hover:text-white border-[#005429] border text-[#005429]'
                                }`}
                        >
                            {isExporting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Mengekspor...</span>
                                </>
                            ) : (
                                'Ekspor ke Excel'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportFilter;