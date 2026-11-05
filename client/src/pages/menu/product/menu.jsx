import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { FaPlus, FaTags, FaDownload, FaUpload } from 'react-icons/fa';
import axios from '@/lib/axios';
import { Link, useSearchParams } from "react-router-dom";
import MessageAlert from "../../../components/messageAlert";
import MenuTable from "./component/table";
import BulkPriceUpdateModal from "./dialog/bulkPriceUpdateModal";
import BulkPriceImportModal from "./dialog/bulkPriceImportModal";
import { exportMenuItemsExcel } from "@/utils/exportMenuItemsExcel";

const Menu = () => {
    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            backgroundColor: '#f8fafc',
            borderColor: state.isFocused ? '#005429' : '#e2e8f0',
            minHeight: '42px',
            fontSize: '13px',
            fontWeight: '700',
            color: '#1e293b',
            boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none',
            borderRadius: '0.75rem',
            padding: '2px',
            '&:hover': {
                borderColor: '#005429',
                backgroundColor: '#ffffff',
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#1e293b',
            fontWeight: '700',
        }),
        input: (provided) => ({
            ...provided,
            color: '#1e293b',
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#94a3b8',
            fontSize: '12px',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid #e2e8f0',
            borderRadius: '1rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            overflow: 'hidden',
            padding: '4px',
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '13px',
            fontWeight: '600',
            color: state.isSelected ? 'white' : '#334155',
            backgroundColor: state.isSelected ? '#005429' : state.isFocused ? '#f1f5f9' : 'transparent',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            margin: '2px 0',
        }),
    };

    const [searchParams, setSearchParams] = useSearchParams();

    const [menuItems, setMenuItems] = useState([]);
    const [category, setCategory] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [error, setError] = useState(null);
    const [checkedItems, setCheckedItems] = useState([]);
    const [checkAll, setCheckAll] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
    const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const importFileRef = useRef(null);

    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState("success");
    const [alertKey, setAlertKey] = useState(0);

    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedWorkstation, setSelectedWorkstation] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [recipeFilter, setRecipeFilter] = useState('all');

    const itemsPerPage = 10;
    const currentPage = parseInt(searchParams.get('page')) || 1;

    // Memoized recipe map untuk performa lebih baik
    const recipeMap = useMemo(() => {
        const map = new Set();
        if (Array.isArray(recipes)) {
            recipes.forEach(recipe => {
                const menuId = recipe.menuItemId?._id || recipe.menuItemId;
                if (menuId) map.add(menuId.toString());
            });
        }
        return map;
    }, [recipes]);

    // Optimized hasRecipe function
    const hasRecipe = useCallback((menuId) => {
        return recipeMap.has(menuId?.toString());
    }, [recipeMap]);

    // Fetch all data in parallel
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [menuResponse, outletsResponse, categoryResponse, recipesResponse] = await Promise.all([
                axios.get('/api/menu/all-menu-items-backoffice'),
                axios.get('/api/outlet'),
                axios.get('/api/menu/categories'),
                axios.get('/api/product/recipes')
            ]);

            setMenuItems(menuResponse.data.data || []);
            setOutlets(outletsResponse.data.data || []);
            setCategory(categoryResponse.data.data || []);

            const recipeData = Array.isArray(recipesResponse.data)
                ? recipesResponse.data
                : recipesResponse.data?.data || [];
            setRecipes(recipeData);

            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load data. Please try again later.");
            setMenuItems([]);
            setOutlets([]);
            setCategory([]);
            setRecipes([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (searchParams.get('openBulkPrice') === 'true') {
            setIsBulkPriceModalOpen(true);
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('openBulkPrice');
            setSearchParams(newParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const handlePageChange = useCallback((newPage) => {
        const pageNumber = typeof newPage === 'function' ? newPage(currentPage) : newPage;
        setSearchParams({ page: pageNumber.toString() });
    }, [currentPage, setSearchParams]);

    // Reset to page 1 when filters change
    const [isInitialRender, setIsInitialRender] = useState(true);
    useEffect(() => {
        if (isInitialRender) {
            setIsInitialRender(false);
            return;
        }
        if (currentPage !== 1) {
            setSearchParams({ page: '1' });
        }
    }, [selectedOutlet, selectedCategory, selectedStatus, searchQuery, selectedWorkstation, recipeFilter]);

    const outletOptions = useMemo(() => [
        { value: '', label: 'Semua Outlet' },
        ...outlets.map(outlet => ({ value: outlet.name, label: outlet.name }))
    ], [outlets]);

    const categoryOptions = useMemo(() => [
        { value: '', label: 'Semua Kategori' },
        ...category.map(cat => ({ value: cat.name, label: cat.name }))
    ], [category]);

    const statusOptions = [
        { value: '', label: 'Semua Status' },
        { value: true, label: 'Aktif' },
        { value: false, label: 'Tidak Aktif' },
    ];

    const workstationOptions = [
        { value: '', label: 'Semua Tempat' },
        { value: 'bar', label: 'Bar' },
        { value: 'kitchen', label: 'Dapur' },
    ];

    // Optimized filtering with useMemo
    const filteredMenuItems = useMemo(() => {
        return menuItems.filter((item) => {
            const matchOutlet = !selectedOutlet ||
                item.availableAt?.some(outlet => outlet.name === selectedOutlet);
            const matchCategory = !selectedCategory || item.category?.name === selectedCategory;
            const matchStatus = selectedStatus === '' || item.isActive === selectedStatus;
            const matchWorkstation = !selectedWorkstation || item.workstation === selectedWorkstation;

            const matchSearch = !searchQuery ||
                item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.barcode?.toLowerCase().includes(searchQuery.toLowerCase());

            const itemId = item.id || item._id;
            const matchRecipe = recipeFilter === 'all' ||
                (recipeFilter === 'hasRecipe' ? hasRecipe(itemId) : !hasRecipe(itemId));

            return matchOutlet && matchCategory && matchStatus && matchSearch && matchWorkstation && matchRecipe;
        });
    }, [menuItems, selectedOutlet, selectedCategory, selectedStatus, selectedWorkstation, searchQuery, recipeFilter, hasRecipe]);

    const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage);
    const currentItems = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredMenuItems.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredMenuItems, currentPage, itemsPerPage]);

    const formatCurrency = useCallback((amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }, []);

    const handleDeleteSelected = useCallback(async () => {
        try {
            await axios.delete("/api/menu/menu-items", {
                data: { id: checkedItems }
            });
            setCheckedItems([]);
            setCheckAll(false);
            await fetchData();

            setAlertMessage(`${checkedItems.length} menu berhasil dihapus`);
            setAlertType("success");
            setAlertKey(prev => prev + 1);
        } catch (error) {
            console.error("Gagal menghapus:", error);
            setAlertMessage('Gagal menghapus menu. Silakan coba lagi.');
            setAlertType("error");
            setAlertKey(prev => prev + 1);
        }
    }, [checkedItems, fetchData]);

    const handleDeleteSuccess = useCallback((successMsg, errorMsg) => {
        if (successMsg) {
            setAlertMessage(successMsg);
            setAlertType("success");
            setAlertKey(prev => prev + 1);
        } else if (errorMsg) {
            setAlertMessage(errorMsg);
            setAlertType("error");
            setAlertKey(prev => prev + 1);
        }
    }, []);

    const handleStatusUpdate = useCallback((successMsg, errorMsg) => {
        if (successMsg) {
            setAlertMessage(successMsg);
            setAlertType("success");
            setAlertKey(prev => prev + 1);
        } else if (errorMsg) {
            setAlertMessage(errorMsg);
            setAlertType("error");
            setAlertKey(prev => prev + 1);
        }
    }, []);

    // Calculate stats widgets
    const stats = useMemo(() => {
        const total = menuItems.length;
        const active = menuItems.filter(item => item.isActive).length;
        const inactive = total - active;
        const noRecipe = menuItems.filter(item => !hasRecipe(item.id || item._id)).length;
        return { total, active, inactive, noRecipe };
    }, [menuItems, hasRecipe]);

    // Handle export excel
    const handleExportExcel = useCallback(async () => {
        try {
            await exportMenuItemsExcel(menuItems);
            setAlertMessage("Daftar menu berhasil diexport ke Excel");
            setAlertType("success");
            setAlertKey(prev => prev + 1);
        } catch (err) {
            console.error("Gagal export excel:", err);
            setAlertMessage("Gagal export excel. Silakan coba lagi.");
            setAlertType("error");
            setAlertKey(prev => prev + 1);
        }
    }, [menuItems]);

    // Handle bulk status update
    const handleBulkStatusUpdate = useCallback(async (newStatus) => {
        try {
            setLoading(true);
            await Promise.all(checkedItems.map(id => 
                axios.put(`/api/menu/menu-items/activated/${id}`, { isActive: newStatus })
            ));
            setCheckedItems([]);
            setCheckAll(false);
            await fetchData();

            setAlertMessage(`${checkedItems.length} menu berhasil ${newStatus ? "diaktifkan" : "dinonaktifkan"}`);
            setAlertType("success");
            setAlertKey(prev => prev + 1);
        } catch (error) {
            console.error("Gagal mengupdate status secara massal:", error);
            setAlertMessage('Gagal mengubah status menu secara massal. Silakan coba lagi.');
            setAlertType("error");
            setAlertKey(prev => prev + 1);
        } finally {
            setLoading(false);
        }
    }, [checkedItems, fetchData]);

    // Handle importing Excel file
    const handleImportFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset file input so same file can be uploaded again
        e.target.value = "";

        setImportFile(file);
        setIsBulkImportModalOpen(true);
    };

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen bg-transparent">
                <div className="text-red-500 text-center bg-white/50 backdrop-blur p-6 rounded-xl border border-red-100 shadow-lg">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded-lg shadow hover:bg-[#004220] transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <MessageAlert
                key={alertKey}
                type={alertType}
                message={alertMessage}
            />

            <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight font-['Outfit',sans-serif]">Daftar Menu</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Kelola informasi produk dan harga</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => importFileRef.current.click()}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-sm font-semibold"
                    >
                        <FaUpload /> Import Excel
                    </button>
                    <input
                        type="file"
                        ref={importFileRef}
                        accept=".xlsx"
                        className="hidden"
                        onChange={handleImportFileChange}
                    />
                    <button
                        onClick={handleExportExcel}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-sm font-semibold"
                    >
                        <FaDownload /> Export Excel
                    </button>
                    <button
                        onClick={() => setIsBulkPriceModalOpen(true)}
                        className="bg-white border border-[#005429] text-[#005429] hover:bg-[#005429]/5 px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-sm font-semibold"
                    >
                        <FaTags /> Ubah Harga Massal
                    </button>
                    <Link
                        to="/admin/menu-create"
                        state={{ returnPage: currentPage, returnTab: 'menu' }}
                        className="bg-[#005429] hover:bg-[#004220] text-white px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm font-semibold"
                    >
                        <FaPlus /> Tambah Produk
                    </Link>
                </div>
            </div>

            {/* Stats Cards Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Produk */}
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 p-5 rounded-2xl shadow-sm flex items-center justify-between group hover:shadow-md transition-all duration-300">
                    <div>
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Total Produk</p>
                        <p className="text-2xl font-black text-slate-800 mt-1 font-['Outfit',sans-serif]">{stats.total}</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-[#005429]/10 group-hover:text-[#005429] group-hover:border-[#005429]/20 transition-all duration-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                </div>

                {/* Produk Aktif */}
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 p-5 rounded-2xl shadow-sm flex items-center justify-between group hover:shadow-md transition-all duration-300">
                    <div>
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Produk Aktif</p>
                        <p className="text-2xl font-black text-emerald-600 mt-1 font-['Outfit',sans-serif]">{stats.active}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50/50 border border-emerald-100/50 rounded-xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>

                {/* Produk Nonaktif */}
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 p-5 rounded-2xl shadow-sm flex items-center justify-between group hover:shadow-md transition-all duration-300">
                    <div>
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Produk Nonaktif</p>
                        <p className="text-2xl font-black text-slate-600 mt-1 font-['Outfit',sans-serif]">{stats.inactive}</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-100/50 border border-slate-200/20 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-slate-500 group-hover:text-white transition-all duration-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>

                {/* Tanpa Resep */}
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 p-5 rounded-2xl shadow-sm flex items-center justify-between group hover:shadow-md transition-all duration-300">
                    <div>
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Tanpa Resep</p>
                        <p className="text-2xl font-black text-amber-600 mt-1 font-['Outfit',sans-serif]">{stats.noRecipe}</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-50/50 border border-amber-100/50 rounded-xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                </div>
            </div>

            <MenuTable
                categoryOptions={categoryOptions}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                outletOptions={outletOptions}
                selectedOutlet={selectedOutlet}
                setSelectedOutlet={setSelectedOutlet}
                statusOptions={statusOptions}
                workstationOptions={workstationOptions}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
                setSelectedWorkstation={setSelectedWorkstation}
                selectedWorkstation={selectedWorkstation}
                checkAll={checkAll}
                setCheckAll={setCheckAll}
                checkedItems={checkedItems}
                setCheckedItems={setCheckedItems}
                currentItems={currentItems}
                formatCurrency={formatCurrency}
                setCurrentPage={handlePageChange}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                handleDeleteSelected={handleDeleteSelected}
                customStyles={customStyles}
                currentPage={currentPage}
                loading={loading}
                fetchData={fetchData}
                onDeleteSuccess={handleDeleteSuccess}
                onStatusUpdate={handleStatusUpdate}
                hasRecipe={hasRecipe}
                recipeFilter={recipeFilter}
                setRecipeFilter={setRecipeFilter}
                handleBulkStatusUpdate={handleBulkStatusUpdate}
            />

            <BulkPriceUpdateModal
                isOpen={isBulkPriceModalOpen}
                onClose={() => setIsBulkPriceModalOpen(false)}
                menuItems={menuItems}
                categories={category}
                fetchData={fetchData}
            />

            <BulkPriceImportModal
                isOpen={isBulkImportModalOpen}
                onClose={() => {
                    setIsBulkImportModalOpen(false);
                    setImportFile(null);
                }}
                file={importFile}
                menuItems={menuItems}
                fetchData={fetchData}
            />
        </div>
    );
};

export default Menu;