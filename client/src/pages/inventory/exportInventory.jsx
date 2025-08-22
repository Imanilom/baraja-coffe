import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { exportToExcel } from "../../utils/exportHelper";
import Datepicker from "react-tailwindcss-datepicker";
import axios from "axios";

const ExportInventory = ({ isOpen, onClose }) => {
    const [products, setProduct] = useState([]);
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

    const fetchProduct = async () => {
        const productResponse = await axios.get('/api/menu/menu-items');
        const productData = productResponse.data.data || [];
        setProduct(productData)
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

    useEffect(() => {
        fetchProduct();
        fetchCategory();
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

    const handleExport = () => {
        const formatDateTime = (isoString) => {
            const date = new Date(isoString);
            const pad = (num) => String(num).padStart(2, '0');
            return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        };

        const filterItem = (item) => {
            const noFilterSelected =
                selectedMainTypes.length === 0 &&
                selectedCategories.length === 0;

            if (noFilterSelected) return true;

            const menuItem = item.menuItem || {};
            const mainCat = menuItem.mainCategory;
            const cat = menuItem.category;
            const work = menuItem.workstation;

            const isMainCategoryChecked = mainCategory.find((m) => m.name === mainCat)?.type || "";
            const isCategoryChecked = selectedCategories.some((id) =>
                categories.find((c) => c._id === id)
            );
            const isWorkstationChecked = selectedCategories.some((id) => workstation.includes(id));

            const isCategoryMatch = selectedCategories.includes(cat);
            const isWorkstationMatch = selectedCategories.includes(work);
            const isMainCategoryMatch = selectedMainTypes.includes(isMainCategoryChecked);

            if (isMainCategoryChecked && !isCategoryChecked && !isWorkstationChecked) {
                return isMainCategoryMatch;
            }
            if (isMainCategoryChecked && isCategoryChecked && !isWorkstationChecked) {
                return isCategoryMatch;
            }
            if (!isMainCategoryChecked && !isCategoryChecked && isWorkstationChecked) {
                return isWorkstationMatch;
            }
            if (isMainCategoryChecked && !isCategoryChecked && isWorkstationChecked) {
                return isMainCategoryMatch && isWorkstationMatch;
            }
            if (isMainCategoryChecked && isCategoryChecked && isWorkstationChecked) {
                return isCategoryMatch || isWorkstationMatch;
            }

            return true;
        };

        // === FILTER PRODUK ===
        const filtered = products.filter((product) => {
            const tanggal = new Date(product.createdAt);
            const start = dateRange.startDate ? new Date(dateRange.startDate) : null;
            const end = dateRange.endDate ? new Date(dateRange.endDate) : null;
            if (start) start.setHours(0, 0, 0, 0);
            if (end) end.setHours(23, 59, 59, 999);

            const inDateRange = (!start || tanggal >= start) && (!end || tanggal <= end);
            const filteredItems = product.items ? product.items.filter(filterItem) : [];

            return inDateRange && filteredItems.length > 0;
        });

        // === DATA EXPORT ===
        const exportData = filtered.flatMap((product) => {
            const filteredItems = product.items ? product.items.filter(filterItem) : [];
            if (filteredItems.length === 0) return [];

            return filteredItems.map((item) => {
                const categoryObj = categories.find(c => c._id === item.menuItem?.category);
                return {
                    "Nama Produk": (product.name || "-"),
                    "Kategori": categoryObj?.name || "-",
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
        const fileName = `Stok ${startLabel} - ${endLabel}.xlsx`;

        const headerInfo = [
            ["Tanggal", `${startLabel} - ${endLabel}`],
        ];

        console.table(exportData);
        // exportToExcel(exportData, fileName, headerInfo);
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
                        <p className="text-sm font-medium text-gray-700 mb-2">Pilih Main Kategori</p>
                        <div className="flex flex-wrap gap-3">
                            {mainCategory.map((mainCat) => (
                                <label key={mainCat.name} className="inline-flex items-center text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        className="mr-2 accent-[#005429]"
                                        checked={selectedMainTypes.includes(mainCat.type)}
                                        onChange={() => {
                                            setSelectedMainTypes((prev) => {
                                                if (prev.includes(mainCat.type)) {
                                                    // 🔴 Kalau di-uncheck, hapus mainCat.type
                                                    const updatedMainTypes = prev.filter((t) => t !== mainCat.type);

                                                    // 🔴 Uncheck semua kategori yang terkait mainCat.type
                                                    setSelectedCategories((prevCats) =>
                                                        prevCats.filter(
                                                            (catId) =>
                                                                !categories.some(
                                                                    (cat) => cat._id === catId && cat.type === mainCat.type
                                                                )
                                                        )
                                                    );

                                                    return updatedMainTypes;
                                                } else {
                                                    // ✅ Kalau di-check, tambahkan mainCat.type
                                                    return [...prev, mainCat.type];
                                                }
                                            });
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

                    {selectedMainTypes && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Pilih Kategori</p>
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

                    {/* Tombol Ekspor */}
                    <div className="pt-4">
                        <button
                            onClick={handleExport}
                            className="w-full bg-white hover:bg-[#005429] hover:text-white border-[#005429] border text-[#005429] py-2 px-4 rounded-lg text-sm font-medium transition"
                        >
                            Ekspor ke Excel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportInventory;

