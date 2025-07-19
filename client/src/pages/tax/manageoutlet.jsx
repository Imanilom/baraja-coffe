import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { FaClipboardList, FaBell, FaUser, FaSearch, FaChevronRight } from "react-icons/fa";

const CreateManageOutlet = () => {
    const { id } = useParams(); // tax/service ID
    const navigate = useNavigate();

    const [outlets, setOutlets] = useState([]);
    const [filteredOutlets, setFilteredOutlets] = useState([]);
    const [selectedOutlets, setSelectedOutlets] = useState([]);
    const [tax, setTax] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [tempSearch, setTempSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOutlets();
        fetchTaxData();
        setLoading(true);
    }, []);

    useEffect(() => {
        const filtered = outlets.filter((outlet) =>
            (outlet.name + outlet.city).toLowerCase().includes(tempSearch.toLowerCase())
        );
        setFilteredOutlets(filtered);
    }, [tempSearch, outlets]);

    const fetchOutlets = async () => {
        try {
            const res = await axios.get("/api/outlet");
            setOutlets(res.data.data || []);
            setFilteredOutlets(res.data.data || []);
        } catch (err) {
            console.error("Gagal fetch outlet:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTaxData = async () => {
        try {
            const res = await axios.get(`/api/tax-service/${id}`);
            setTax(res.data);
            setSelectedOutlets((res.data.appliesToOutlets || []).map((o) => o._id));
        } catch (err) {
            console.error("Gagal fetch data pajak:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleOutlet = (outletId) => {
        setSelectedOutlets((prev) =>
            prev.includes(outletId)
                ? prev.filter((id) => id !== outletId)
                : [...prev, outletId]
        );
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedOutlets([]);
        } else {
            const allIds = filteredOutlets.map((o) => o._id);
            setSelectedOutlets(allIds);
        }
        setSelectAll(!selectAll);
    };

    const handleUpdate = async () => {
        try {
            const payload = {
                appliesToOutlets: selectedOutlets, // ← ini akan menggantikan semua outlet sebelumnya
            };
            console.log(payload);
            await axios.put(`/api/tax-service/${id}`, payload);
            // alert("Outlet berhasil diperbarui.");
            navigate("/admin/tax-and-service");
        } catch (err) {
            console.error("Gagal update outlet:", err);
            alert("Gagal menyimpan perubahan.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

    return (
        <div className="overflow-y-auto pb-[100px]">
            {/* Header */}
            <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
                <FaBell size={23} className="text-gray-400" />
                <span className="text-[14px]">Hi Baraja</span>
                <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
                    <FaUser size={30} />
                </Link>
            </div>

            {/* Form */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdate();
                }}
            >
                {/* Header / Breadcrumb */}
                <div className="px-3 py-2 flex justify-between items-center border-b">
                    <div className="flex items-center space-x-2 text-gray-500 text-[15px]">
                        <FaClipboardList size={21} />
                        <p>Pajak & Service Charge</p>
                        <FaChevronRight size={18} />
                        <p>{tax.name}</p>
                        <FaChevronRight size={18} />
                        <p>Tambahkan Ke Outlet</p>
                    </div>
                    <div className="flex space-x-2">
                        <Link
                            to="/admin/tax-and-service"
                            className="bg-white text-[#005429] text-[13px] px-[15px] py-[7px] hover:bg-[#005429] border border-[#005429] hover:text-white rounded"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                        >
                            Simpan
                        </button>
                    </div>
                </div>

                {/* Filter & Table */}
                <div className="px-[15px] text-[#999999]">
                    {/* Filter */}
                    <div className="grid grid-cols-2 gap-[10px] mt-4">
                        <div className="relative pb-[10px]">
                            <label className="block text-[13px] mb-1 text-gray-500 py-[7px]">Tampilkan</label>
                            <select
                                className="w-full text-[13px] text-gray-500 border py-[6px] px-[12px] rounded"
                            >
                                <option>Semua</option>
                                <option>Dipilih</option>
                            </select>
                        </div>
                        <div className="relative pb-[10px]">
                            <label className="block text-[13px] mb-1 text-gray-500 py-[7px]">Cari Outlet / Kota</label>
                            <div className="relative">
                                <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari..."
                                    value={tempSearch}
                                    onChange={(e) => setTempSearch(e.target.value)}
                                    className="text-[13px] border py-[6px] pl-[30px] pr-[12px] rounded w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tabel Outlet */}
                    <div className="mt-4 rounded shadow p-4 bg-white">
                        <table className="w-full table-auto text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 font-semibold">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={selectAll}
                                                onChange={handleSelectAll}
                                                className="form-checkbox h-4 w-4 text-green-600"
                                            />
                                            <span className="uppercase">Outlet</span>
                                        </div>
                                    </th>
                                    <th className="text-left py-2 font-semibold uppercase">Kota</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOutlets.map((outlet) => {
                                    return (
                                        <tr key={outlet._id} className="border-b hover:bg-gray-50">
                                            <td className="py-4 w-1/2">
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedOutlets.includes(String(outlet._id))}
                                                        onChange={() => toggleOutlet(outlet._id)}
                                                        className="form-checkbox h-4 w-4 text-green-600"
                                                    />
                                                    <span>{outlet.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 uppercase">{outlet.city}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </form>


            <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
                <div className="w-full h-[2px] bg-[#005429]"></div>
            </div>
        </div>
    );
};

export default CreateManageOutlet;
