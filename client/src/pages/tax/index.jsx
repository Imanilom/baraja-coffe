import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { FaClipboardList, FaBell, FaUser, FaTag, FaStoreAlt, FaBullseye, FaReceipt, FaSearch, FaPencilAlt, FaTrash, FaPlusCircle, FaPlus } from "react-icons/fa";
import Header from "../admin/header";
import Select from "react-select";

const TaxManagementPage = () => {
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderColor: '#d1d5db', // Tailwind border-gray-300
            minHeight: '34px',
            fontSize: '13px',
            color: '#6b7280', // text-gray-500
            boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none', // blue-500 on focus
            '&:hover': {
                borderColor: '#9ca3af', // Tailwind border-gray-400
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#6b7280', // text-gray-500
        }),
        input: (provided) => ({
            ...provided,
            color: '#6b7280', // text-gray-500 for typed text
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9ca3af', // text-gray-400
            fontSize: '13px',
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '13px',
            color: '#374151', // gray-700
            backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white', // blue-50
            cursor: 'pointer',
        }),
    };
    const [openDropdown, setOpenDropdown] = useState(null);
    const [outlets, setOutlets] = useState([]);
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;
    // Calculate total pages based on filtered data
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);


    useEffect(() => {
        fetchOutlet();
        fetchTax();
        setLoading(true);
    }, []);

    const fetchOutlet = async () => {
        try {
            const response = await axios.get("/api/outlet");
            setOutlets(Array.isArray(response.data) ? response.data : response.data?.data || []);
        } catch (error) {
            console.error("Error fetching outlets:", error);
            setOutlets([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTax = async () => {
        try {
            const data = await axios.get("/api/tax-service/")
            setData(data.data || []);
            setFilteredData(data.data || []);
        } catch (error) {
            console.error("Error fetching outlets:", error);
            setData([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOutlet = async (id) => {
        try {
            const response = await axios.delete(`/api/outlet/${id}`);
            alert(response.data.message);
            fetchData();
        } catch (error) {
            alert("Error deleting outlet.");
        }
    };

    const outletOptions = [
        { value: "", label: "Semua Outlet" },
        outlets.map((outlet) => ({
            value: outlet._id,
            label: outlet.name,
        })),
    ];

    const typeOptions = [
        { value: "", label: "Semua Type" },
        { value: "tax", label: "Pajak" },
        { value: "service", label: "Layanan" },
    ];

    const handleChange = (selected, actionMeta) => {
        setFilteredData((prev) => ({
            ...prev,
            [actionMeta.name]: selected.value,
        }));
    };

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

    return (
        <div className="overflow-y-auto pb-[100px]">
            {/* Header */}
            <Header />

            {/* Breadcrumb */}
            <div className="flex justify-between items-center px-6 py-3 my-3 bg-white">
                <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                    Pajak & Service Charge
                </h1>
                <div className="flex space-x-2">
                    <Link to="/admin/service-create" className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded flex items-center gap-2"><FaPlus />Tambah Service</Link>
                    <Link to="/admin/tax-create" className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded flex items-center gap-2"><FaPlus />Tambah Pajak</Link>
                </div>
            </div>

            <div className="px-[15px] flex justify-between">
                <div className="relative pb-[10px] w-1/4">
                    <Select
                        name="outlet"
                        value={
                            outlets
                                .map((p) => ({ value: p._id, label: p.name }))
                                .find((o) => o.value === filteredData.outlet) || null
                        }
                        options={outlets.map((p) => ({ value: p._id, label: p.name }))}
                        isSearchable
                        placeholder="Pilih Outlet"
                        styles={customSelectStyles}
                        onChange={(selectedOption) =>
                            setFilteredData((prev) => ({
                                ...prev,
                                outlet: selectedOption ? selectedOption.value : "",
                            }))
                        }
                    />
                </div>
                <div className="relative pb-[10px] w-1/4">
                    <Select
                        name="type"
                        value={typeOptions.find((opt) => opt.value === filteredData.type) || typeOptions[0]}
                        onChange={handleChange}
                        options={typeOptions}
                        styles={customSelectStyles}
                        placeholder="Pilih Type"
                        isSearchable
                    />
                </div>
            </div>

            <div className="p-4">
                <table className="min-w-full text-sm text-left text-gray-500 shadow-lg">
                    <thead className="text-[14px]">
                        <tr>
                            <th className="px-[15px] py-[21px] font-normal">Nama</th>
                            <th className="px-[15px] py-[21px] font-normal">Tipe</th>
                            <th className="px-[15px] py-[21px] font-normal text-right">Jumlah</th>
                            <th className="px-[15px] py-[21px] font-normal"></th>
                        </tr>
                    </thead>
                    {paginatedData.length > 0 ? (
                        <tbody>
                            {paginatedData.map((data) => (
                                <tr key={data._id} className="bg-white text-[14px]">
                                    <td className="p-[15px]">{data.name}</td>
                                    <td className="p-[15px]">{data.type}</td>
                                    <td className="p-[15px] text-right">
                                        {data.percentage != null
                                            ? `${data.percentage}%`
                                            : `Rp ${data.fixedFee}`}
                                    </td>
                                    <td className="p-[15px]">

                                        {/* Dropdown Menu */}
                                        <div className="relative text-right">
                                            <button
                                                className="px-2 bg-white border border-gray-200 hover:border-[#005429] hover:bg-[#005429] rounded-sm"
                                                onClick={() => setOpenDropdown(openDropdown === data._id ? null : data._id)}
                                            >
                                                <span className="text-xl text-gray-200 hover:text-white">
                                                    •••
                                                </span>
                                            </button>
                                            {openDropdown === data._id && (
                                                <div className="absolute text-left right-0 top-full mt-2 bg-white border rounded-md shadow-md w-52 z-10">
                                                    <ul className="">
                                                        <Link className="px-4 py-4 text-sm cursor-pointer hover:bg-gray-100 bg-transparent flex items-center space-x-4 text-[14px]"
                                                            to={`/admin/tax-and-service/${data._id}/manage-to-outlet`}
                                                        >
                                                            <FaPlusCircle size={18} />
                                                            <span>Tambahkan Ke Outlet</span>
                                                        </Link>
                                                        <Link className="px-4 py-4 text-sm cursor-pointer hover:bg-gray-100 bg-transparent flex items-center space-x-4 text-[14px]"
                                                            to={`/admin/tax-update/${data._id}`}
                                                        >
                                                            <FaPencilAlt size={18} />
                                                            <span>Ubah</span>
                                                        </Link>
                                                        <li className="px-4 py-4 text-sm cursor-pointer hover:bg-gray-100">
                                                            <button
                                                                onClick={() => handleDeleteOutlet(data._id)}
                                                                className="text-red-600 flex items-center space-x-4 text-[14px]"
                                                            >
                                                                <FaTrash size={18} />
                                                                <span>Hapus</span>
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                    ) : (
                        <tbody>
                            <tr className="py-6 text-center w-full h-96 text-gray-500">
                                <td colSpan={4}>TIDAK ADA PAJAK DAN SERVICE</td>
                            </tr>
                        </tbody>
                    )}
                </table>
            </div>


            {/* Pagination */}
            {paginatedData.length > 0 && (
                <div className="flex justify-between items-center mt-4 px-[15px]">
                    <span className="text-sm text-gray-500">
                        Menampilkan <b>{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</b> – <b>{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}</b> dari <b>{filteredData.length}</b> data
                    </span>
                    {currentPage === 1 ? (
                        <div className="flex"></div>
                    ) : (
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


            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]">
                </div>
            </div>
        </div>
    );
};

export default TaxManagementPage;
