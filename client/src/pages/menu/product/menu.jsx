import React, { useEffect, useState, useMemo, useCallback } from "react";
import { FaPlus } from 'react-icons/fa';
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import MessageAlert from "../../../components/messageAlert";
import MenuTable from "./component/table";

const Menu = () => {
    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: '#d1d5db',
            minHeight: '34px',
            fontSize: '13px',
            color: '#6b7280',
            boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none',
            '&:hover': {
                borderColor: '#9ca3af',
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#6b7280',
        }),
        input: (provided) => ({
            ...provided,
            color: '#6b7280',
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9ca3af',
            fontSize: '13px',
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '13px',
            color: '#374151',
            backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white',
            cursor: 'pointer',
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
        { value: '', label: 'Outlet' },
        ...outlets.map(outlet => ({ value: outlet.name, label: outlet.name }))
    ], [outlets]);

    const categoryOptions = useMemo(() => [
        { value: '', label: 'Semua Kategori' },
        ...category.map(cat => ({ value: cat.name, label: cat.name }))
    ], [category]);

    const statusOptions = [
        { value: '', label: 'Status' },
        { value: true, label: 'Aktif' },
        { value: false, label: 'Tidak Aktif' },
    ];

    const workstationOptions = [
        { value: '', label: 'Tempat' },
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

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
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

            <div className="flex justify-between items-center px-6 py-3 my-3">
                <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    Menu
                </h1>
                <div className="flex items-center gap-3">
                    <Link
                        to="/admin/menu-create"
                        state={{ returnPage: currentPage, returnTab: 'menu' }}
                        className="bg-[#005429] text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
                    >
                        <FaPlus /> Tambah
                    </Link>
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
            />
        </div>
    );
};

export default Menu;