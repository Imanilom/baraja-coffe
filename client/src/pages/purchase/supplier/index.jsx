import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaChevronRight, FaBell, FaUser, FaSearch, FaBuilding, FaReceipt, FaPencilAlt, FaTrash } from "react-icons/fa";

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

const SupplierManagement = () => {
    const [supplier, setSupplier] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tempName, setTempName] = useState("");
    const [tempPhone, setTempPhone] = useState("");
    const [tempEmail, setTempEmail] = useState("");
    const [tempAddress, setTempAddress] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Safety function to ensure we're always working with arrays
    const ensureArray = (data) => Array.isArray(data) ? data : [];
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const dropdownRef = useRef(null);

    // Fetch supplier and outlets data
    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch supplier data
            const supplierResponse = await axios.get("/api/marketlist/supplier");
            const supplier = (supplierResponse.data.data || []);
            setSupplier(supplier);
            setFilteredData(supplier); // Initialize filtered data with all supplier

            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load data. Please try again later.");
            // Set empty arrays as fallback
            setSupplier([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        applyFilter();
    }, [tempName, tempAddress, tempPhone, tempEmail]);

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (itemId) => {
        try {
            await axios.delete(`/api/marketlist/supplier/${itemId}`);
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    };

    // Paginate the filtered data
    const paginatedData = useMemo(() => {

        // Ensure filteredData is an array before calling slice
        if (!Array.isArray(filteredData)) {
            console.error('filteredData is not an array:', filteredData);
            return [];
        }

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const result = filteredData.slice(startIndex, endIndex);
        return result;
    }, [currentPage, filteredData]);

    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    // Apply filter function
    const applyFilter = () => {

        // Make sure supplier is an array before attempting to filter
        let filtered = ensureArray([...supplier]);

        if (tempName) {
            filtered = filtered.filter(supplier => {
                try {
                    const name = (supplier.name || '').toLowerCase();

                    const searchTerm = tempName.toLowerCase();
                    return name.includes(searchTerm);
                } catch (err) {
                    console.error("Error filtering by search:", err);
                    return false;
                }
            });
        }
        if (tempAddress) {
            filtered = filtered.filter(supplier => {
                try {
                    const address = (supplier.address || '').toLowerCase();

                    const searchTerm = tempAddress.toLowerCase();
                    return address.includes(searchTerm);
                } catch (err) {
                    console.error("Error filtering by search:", err);
                    return false;
                }
            });
        }
        if (tempPhone) {
            filtered = filtered.filter(supplier => {
                try {
                    const phone = (supplier.phone || '').toLowerCase();

                    const searchTerm = tempPhone.toLowerCase();
                    return phone.includes(searchTerm);
                } catch (err) {
                    console.error("Error filtering by search:", err);
                    return false;
                }
            });
        }
        if (tempEmail) {
            filtered = filtered.filter(supplier => {
                try {
                    const email = (supplier.email || '').toLowerCase();

                    const searchTerm = tempEmail.toLowerCase();
                    return email.includes(searchTerm);
                } catch (err) {
                    console.error("Error filtering by search:", err);
                    return false;
                }
            });
        }

        setFilteredData(filtered);
        setCurrentPage(1); // Reset to first page after filter
    };


    // Show loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

    // Show error state
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
        <div className="">
            {/* Header */}
            <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
                <FaBell size={23} className="text-gray-400" />
                <span className="text-[14px]">Hi Baraja</span>
                <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
                    <FaUser size={30} />
                </Link>
            </div>

            {/* Breadcrumb */}
            <div className="px-3 py-2 flex justify-between items-center border-b">
                <div className="flex items-center space-x-2">
                    <FaReceipt size={21} className="text-gray-500 inline-block" />
                    <p className="text-[15px] text-gray-500">Pembelian</p>
                    <FaChevronRight className="text-[15px] text-gray-500" />
                    <span className="text-[15px] text-[#005429]">Supplier</span>
                </div>
                <Link to="/admin/purchase/supplier-create" className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Tambah Supplier</Link>
            </div>

            {/* Filters */}
            <div className="px-[15px] pb-[15px] mb-[60px]">
                <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-12 gap-[10px] items-end rounded bg-slate-50 shadow-slate-200 shadow-md">

                    <div className="flex flex-col col-span-3">
                        <label className="text-[13px] mb-1 text-gray-500">Nama Supplier</label>
                        <div className="relative">
                            <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="text-[13px] border py-[6px] pl-[30px] pr-[25px] rounded w-full"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col col-span-3">
                        <label className="text-[13px] mb-1 text-gray-500">Alamat Supplier</label>
                        <div className="relative">
                            <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search"
                                value={tempAddress}
                                onChange={(e) => setTempAddress(e.target.value)}
                                className="text-[13px] border py-[6px] pl-[30px] pr-[25px] rounded w-full"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col col-span-3">
                        <label className="text-[13px] mb-1 text-gray-500">Telepon Supplier</label>
                        <div className="relative">
                            <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search"
                                value={tempPhone}
                                onChange={(e) => setTempPhone(e.target.value)}
                                className="text-[13px] border py-[6px] pl-[30px] pr-[25px] rounded w-full"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col col-span-3">
                        <label className="text-[13px] mb-1 text-gray-500">Email Supplier</label>
                        <div className="relative">
                            <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search"
                                value={tempEmail}
                                onChange={(e) => setTempEmail(e.target.value)}
                                className="text-[13px] border py-[6px] pl-[30px] pr-[25px] rounded w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded shadow-slate-200 shadow-md">
                    <table className="min-w-full table-auto">
                        <thead className="text-gray-400">
                            <tr className="text-left text-[13px]">
                                <th className="px-4 py-3 font-normal">Supplier ID</th>
                                <th className="px-4 py-3 font-normal">Nama Supplier</th>
                                <th className="px-4 py-3 font-normal">Alamat</th>
                                <th className="px-4 py-3 font-normal">Telepon</th>
                                <th className="px-4 py-3 font-normal">Email</th>
                                <th></th>
                            </tr>
                        </thead>
                        {paginatedData.length > 0 ? (
                            <tbody className="text-sm text-gray-400">
                                {paginatedData.map((data, index) => {
                                    try {
                                        return (
                                            <tr className="text-left text-sm cursor-pointer hover:bg-slate-50" key={data._id}>
                                                <td className="px-4 py-3">
                                                    {data._id || []}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {data.name || []}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {data.address || []}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {data.phone || []}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {data.email || []}
                                                </td>
                                                <td className="p-[15px]">
                                                    {/* Dropdown Menu */}
                                                    <div className="relative text-right">
                                                        <button
                                                            className="px-2 bg-white border border-gray-200 hover:bg-green-800 rounded-sm"
                                                            onClick={() => setOpenDropdown(openDropdown === data._id ? null : data._id)}
                                                        >
                                                            <span className="text-xl text-gray-200 hover:text-white">
                                                                •••
                                                            </span>
                                                        </button>
                                                        {openDropdown === data._id && (
                                                            <div className="absolute text-left text-gray-500 right-0 top-full mt-2 bg-white border rounded-md shadow-md w-[240px] z-10">
                                                                <ul className="w-full">
                                                                    <Link
                                                                        to={`/admin/purchase/supplier-update/${data._id}`}
                                                                        className="bg-transparent flex space-x-[18px] items-center px-[20px] py-[15px] text-sm cursor-pointer hover:bg-gray-100"
                                                                    >
                                                                        <FaPencilAlt size={18} />
                                                                        <span>Ubah</span>
                                                                    </Link>
                                                                    <button className="w-full flex space-x-[18px] items-center px-[20px] py-[15px] text-sm cursor-pointer hover:bg-gray-100"
                                                                        onClick={() => {
                                                                            setItemToDelete(data._id);
                                                                            setIsModalOpen(true);
                                                                        }}>
                                                                        <FaTrash size={18} />
                                                                        <p>Hapus</p>
                                                                    </button>
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    } catch (err) {
                                        console.error(`Error rendering Supplier ${index}:`, err, supplier);
                                        return (
                                            <tr className="text-left text-sm" key={index}>
                                                <td colSpan="5" className="px-4 py-3 text-red-500">
                                                    Error rendering Supplier
                                                </td>
                                            </tr>
                                        );
                                    }
                                })}
                            </tbody>
                        ) : (
                            <tbody>
                                <tr className="py-6 text-center w-full h-96">
                                    <td colSpan={5}>
                                        <div className="flex justify-center items-center min-h-[300px] text-gray-500">
                                            <div className="grid grid-cols-3 gap-6 text-center">
                                                <div className="col-span-3 flex flex-col items-center justify-center space-y-4 max-w-[700px]">
                                                    <FaBuilding size={60} className="text-gray-500" />
                                                    <p className="text-lg font-semibold">Supplier</p>
                                                    <span className="text-sm text-justify">
                                                        Supplier merupakan individu atau perusahaan yang secara berkelanjutan menjual barang kepada Anda.
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        )}
                    </table>
                </div>

                {/* Pagination Controls */}
                {paginatedData.length > 0 && (
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-gray-600">
                            Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} dari {filteredData.length} data
                        </span>
                        {totalPages > 1 && (
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Sebelumnya
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Berikutnya
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]">
                </div>
            </div>

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => handleDelete(itemToDelete)}
            />
        </div>
    );
};

export default SupplierManagement;
