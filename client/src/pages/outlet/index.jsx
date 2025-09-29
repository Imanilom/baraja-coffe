import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  FaClipboardList, FaBell, FaUser, FaStoreAlt,
  FaBullseye, FaReceipt, FaSearch, FaPencilAlt,
  FaTrash, FaEllipsisV,
  FaPlus
} from "react-icons/fa";
import Header from "../admin/header";
import Paginated from "../../components/paginated";

const OutletManagementPage = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/outlet");
        setOutlets(Array.isArray(response.data) ? response.data : response.data?.data || []);

      } catch (error) {
        console.error("Error fetching outlets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOutlets();
  }, []);

  const filteredOutlets = useMemo(() => {
    return outlets.filter(outlet =>
      outlet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      outlet.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [outlets, searchTerm]);

  const paginatedOutlets = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOutlets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredOutlets]);

  const totalPages = Math.ceil(filteredOutlets.length / ITEMS_PER_PAGE);

  const handleDeleteOutlet = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus outlet ini?")) return;

    try {
      await axios.delete(`/api/outlet/${id}`);
      setOutlets(prev => prev.filter(outlet => outlet._id !== id));
    } catch (error) {
      alert("Gagal menghapus outlet");
      console.error("Delete error:", error);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
      </div>
    );
  }

  return (
    <div className="">

      {/* Breadcrumb */}
      <div className="flex justify-between items-center px-6 py-3 my-3">
        <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
          Outlet
        </h1>
        <button
          onClick={() => navigate("/admin/outlet-create")}
          className="bg-[#005429] text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
        >
          <FaPlus /> Tambah
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-[15px]">
        <div className="flex flex-col">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Outlet / Kota"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="text-[13px] border py-2 pl-[30px] pr-[12px] rounded w-1/4"
            />
          </div>
        </div>
      </div>

      {/* Outlet Table */}
      <div className="p-4">
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-[14px] border-b">
              <tr>
                <th className="px-[15px] py-[21px] font-normal">Outlet</th>
                <th className="px-[15px] py-[21px] font-normal">Kota</th>
                <th className="px-[15px] py-[21px] font-normal">Telepon</th>
                <th className="px-[15px] py-[21px] font-normal">Pajak</th>
                <th className="px-[15px] py-[21px] font-normal">Tipe Penjualan</th>
                <th className="px-[15px] py-[21px] font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedOutlets.length > 0 ? (
                paginatedOutlets.map((outlet) => (
                  <tr key={outlet._id} className="bg-white text-[14px] hover:bg-gray-50">
                    <td className="p-[15px]">{outlet.name}</td>
                    <td className="p-[15px] uppercase">{outlet.city}</td>
                    <td className="p-[15px]">{outlet.contactNumber}</td>
                    <td className="p-[15px]">Tanpa Pajak</td>
                    <td className="p-[15px]">Tanpa tipe penjualan</td>
                    <td className="p-[15px] text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === outlet._id ? null : outlet._id)}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          <FaEllipsisV className="text-gray-500" />
                        </button>
                        {openDropdown === outlet._id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
                            <Link
                              to={`/admin/update-outlet/${outlet._id}`}
                              className="block px-4 py-3 text-sm hover:bg-gray-100"
                            >
                              <div className="flex items-center space-x-2">
                                <FaPencilAlt size={14} />
                                <span>Ubah</span>
                              </div>
                            </Link>
                            <button
                              onClick={() => handleDeleteOutlet(outlet._id)}
                              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 text-red-600"
                            >
                              <div className="flex items-center space-x-2">
                                <FaTrash size={14} />
                                <span>Hapus</span>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-6 text-center h-96 text-gray-500">
                    {searchTerm ? "Tidak ditemukan outlet yang sesuai" : "Tidak ada outlet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Paginated
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />
    </div>
  );
};

export default OutletManagementPage;