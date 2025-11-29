import React, { useEffect, useState, useRef } from "react";
import Select from "react-select";
import { FaBox, FaTag, FaBell, FaUser, FaShoppingBag, FaPencilAlt, FaTrash, FaReceipt, FaTrashAlt, FaChevronRight, FaChevronLeft, FaEyeSlash, FaEye, FaPlus, FaDownload, FaBoxes } from 'react-icons/fa';
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Header from "../admin/header";
import ConfirmationModalActive from "./confirmationModalAction";
import MessageAlertMenu from "../../components/messageAlert";
import CategoryTabs from "./filters/categorytabs";
import MenuTable from "./table";
import MenuCategoryTabs from "./tabs";

const ConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-md text-center w-96">
                <FaTrash className="text-red-500 mx-auto mb-4" size={72} />
                <h2 className="text-lg font-bold">Konfirmasi Penghapusan</h2>
                <p>Apakah Anda yakin ingin menghapus item ini?</p>
                <div className="flex justify-center mt-4">
                    <button onClick={onClose} className="mr-2 px-4 py-2 bg-gray-300 rounded">Batal</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded">Hapus</button>
                </div>
            </div>
        </div>
    );
};

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

    const location = useLocation();
    const navigate = useNavigate();
    const [menuItems, setMenuItems] = useState([]);
    const [category, setCategory] = useState([]);
    const [status, setStatus] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [error, setError] = useState(null);
    const [checkedItems, setCheckedItems] = useState([]);
    const [checkAll, setCheckAll] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [loading, setLoading] = useState(true);

    // State sementara (input filter)
    const [tempSelectedOutlet, setTempSelectedOutlet] = useState("");
    const [tempSelectedStatus, setTempSelectedStatus] = useState("");
    const [tempSearch, setTempSearch] = useState("");

    // State final (filter aktif)
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedWorkstation, setSelectedWorkstation] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchData = async () => {
        setLoading(true);
        try {
            const menuResponse = await axios.get('/api/menu/all-menu-items-backoffice');
            setMenuItems(menuResponse.data.data.filter((menu) => menu.mainCategory !== "event"));

            const outletsResponse = await axios.get('/api/outlet');
            setOutlets(outletsResponse.data.data);

            const categoryResponse = await axios.get('/api/menu/categories');
            const excludedCategories = ["Event", "Ruangan", "Sparkling"];

            setCategory(
                categoryResponse.data.data.filter((cat) =>
                    !excludedCategories.includes(cat.name) &&
                    !excludedCategories.includes(cat.parentCategory)
                )
            );

            setStatus([
                { id: "ya", name: "Ya" },
                { id: "tidak", name: "Tidak" }
            ]);

            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load data. Please try again later.");
            setMenuItems([]);
            setOutlets([]);
            setCategory([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedOutlet, selectedCategory, selectedStatus, searchQuery, selectedWorkstation]);

    const outletOptions = [
        { value: '', label: 'Outlet' },
        ...outlets.map(outlet => ({ value: outlet.name, label: outlet.name }))
    ];

    const categoryOptions = [
        { value: '', label: 'Semua Kategori' },
        ...category.map(category => ({ value: category.name, label: category.name }))
    ];

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

    const filteredMenuItems = menuItems.filter((item) => {
        const matchOutlet =
            selectedOutlet === '' ||
            item.availableAt.some(outlet => outlet.name === selectedOutlet);
        const matchCategory = selectedCategory === '' || item.category?.name === selectedCategory;
        const matchStatus = selectedStatus === '' || item.isActive === selectedStatus;
        const matchWorkstation = selectedWorkstation === '' || item.workstation === selectedWorkstation;

        const matchSearch =
            searchQuery === '' ||
            item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.barcode?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchOutlet && matchCategory && matchStatus && matchSearch && matchWorkstation;
    });

    const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredMenuItems.slice(indexOfFirstItem, indexOfLastItem);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleDelete = async (itemId) => {
        try {
            await axios.delete(`/api/menu/menu-items/${itemId}`);
            fetchData();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    };

    const handleDeleteSelected = async () => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus data terpilih?")) return;
        try {
            await axios.delete("/api/menu/menu-items", {
                data: { id: checkedItems }
            });
            setCheckedItems([]);
            setCheckAll(false);
            fetchData();
        } catch (error) {
            console.error("Gagal menghapus:", error);
        }
    };

    // Error State
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

            <div className="flex justify-between items-center px-6 py-3 my-3">
                <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    Menu
                </h1>
                <div className="flex items-center gap-3">
                    {/* <button
            onClick={() => console.log('Ekspor Produk')}
            className="flex items-center gap-2 bg-white text-[#005429] px-4 py-2 rounded border border-[#005429] hover:text-white hover:bg-[#005429] text-[13px]"
          >
            <FaDownload /> Ekspor
          </button> */}

                    <Link
                        to="/admin/menu-create"
                        className="bg-[#005429] text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
                    >
                        <FaPlus /> Tambah
                    </Link>
                </div>
            </div>

            <MessageAlertMenu />

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
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
                menuItems={menuItems}
                itemsPerPage={itemsPerPage}
                handleDeleteSelected={handleDeleteSelected}
                customStyles={customStyles}
                currentPage={currentPage}
                loading={loading}
                fetchData={fetchData}
            />


            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => handleDelete(itemToDelete)}
            />
        </div>
    );
};

export default Menu;
