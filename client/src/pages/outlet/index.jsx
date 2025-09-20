import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  FaClipboardList, FaBell, FaUser, FaStoreAlt,
  FaBullseye, FaReceipt, FaSearch, FaPencilAlt,
  FaTrash, FaEllipsisV
} from "react-icons/fa";
import Header from "../admin/header";

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
    <div className="pb-[100px]">
      {/* Header */}
      <Header />

      {/* Breadcrumb */}
      <div className="px-3 py-2 flex justify-between items-center border-b">
        <div className="flex items-center space-x-2">
          <FaStoreAlt size={21} className="text-gray-500" />
          <p className="text-[15px] text-gray-500">Outlet</p>
        </div>
        <button
          onClick={() => navigate("/admin/outlet-create")}
          className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
        >
          Tambah Outlet
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="px-[15px]">
        <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-4 py-4">
          <div className="bg-white border-b-2 border-b-[#005429]">
            <div className="flex justify-between items-center p-4">
              <div className="flex space-x-4">
                <FaStoreAlt size={24} className="text-gray-400" />
                <h2 className="text-gray-400 text-sm">Outlet</h2>
              </div>
              <div className="text-sm text-gray-400">
                ({outlets.length})
              </div>
            </div>
          </div>

          <Link
            to="/admin/tax-and-service"
            className="bg-white border-b-2 border-b-white hover:border-b-[#005429] border-l border-l-gray-200"
          >
            <div className="flex justify-between items-center p-4">
              <div className="flex space-x-4">
                <FaClipboardList size={24} className="text-gray-400" />
                <h2 className="text-gray-400 text-sm">Pajak & Service</h2>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/target-sales"
            className="bg-white border-b-2 border-b-white hover:border-b-[#005429] border-l border-l-gray-200"
          >
            <div className="flex justify-between items-center p-4">
              <div className="flex space-x-4">
                <FaBullseye size={24} className="text-gray-400" />
                <h2 className="text-gray-400 text-sm">Target Penjualan</h2>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/receipt-design"
            className="bg-white border-b-2 border-b-white hover:border-b-[#005429] border-l border-l-gray-200"
          >
            <div className="flex justify-between items-center p-4">
              <div className="flex space-x-4">
                <FaReceipt size={24} className="text-gray-400" />
                <h2 className="text-gray-400 text-sm">Desain Struk</h2>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-[15px]">
        <div className="my-[13px] py-[10px] px-[15px] rounded bg-slate-50 shadow-md">
          <div className="flex flex-col">
            <label className="text-[13px] mb-1 text-gray-500">Cari</label>
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
                className="text-[13px] border py-[6px] pl-[30px] pr-[12px] rounded w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Outlet Table */}
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500 shadow-lg">
            <thead className="text-[14px]">
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

      {/* Pagination */}
      {filteredOutlets.length > 0 && (
        <div className="flex justify-between items-center mt-4 px-[15px]">
          <span className="text-sm text-gray-500">
            Menampilkan <b>{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</b> – <b>{Math.min(currentPage * ITEMS_PER_PAGE, filteredOutlets.length)}</b> dari <b>{filteredOutlets.length}</b> data
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded disabled:opacity-50"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
        <div className="w-full h-[2px] bg-[#005429]"></div>
      </div>
    </div>
  );
};

export default OutletManagementPage;