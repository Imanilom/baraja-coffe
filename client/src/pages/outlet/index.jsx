import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  FaClipboardList, FaBell, FaUser, FaStoreAlt,
  FaBullseye, FaReceipt, FaSearch, FaPencilAlt,
  FaTrash,
  FaPlus, FaMapMarkerAlt, FaPhone
} from "react-icons/fa";
import Header from "../admin/header";
import Paginated from "../../components/paginated";

const OutletManagementPage = () => {
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
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-[#005429] border-b-[#005429] border-l-transparent border-r-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data outlet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <FaStoreAlt className="text-[#005429]" />
                Manajemen Outlet
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kelola semua outlet toko Anda di sini
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/outlet-create")}
              className="bg-[#005429] hover:bg-[#003d1f] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-sm hover:shadow-md"
            >
              <FaPlus /> Tambah Outlet
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Outlet</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{outlets.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FaStoreAlt className="text-[#005429] text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Hasil Pencarian</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{filteredOutlets.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FaSearch className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Halaman</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{currentPage} / {totalPages || 1}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FaClipboardList className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative max-w-md">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama outlet atau kota..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-sm border border-gray-300 py-3 pl-11 pr-4 rounded-lg focus:ring-2 focus:ring-[#005429] focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Outlet Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Outlet
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Kota
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Telepon
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Pajak
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Tipe Penjualan
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedOutlets.length > 0 ? (
                  paginatedOutlets.map((outlet) => (
                    <tr key={outlet._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                            <FaStoreAlt className="text-[#005429]" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{outlet.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-700">
                          <FaMapMarkerAlt className="text-gray-400 mr-2" />
                          <span className="uppercase">{outlet.city}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-700">
                          <FaPhone className="text-gray-400 mr-2" />
                          {outlet.contactNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Tanpa Pajak
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          Tanpa tipe penjualan
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/update-outlet/${outlet._id}`}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <FaPencilAlt size={14} />
                            <span>Ubah</span>
                          </Link>
                          <button
                            onClick={() => handleDeleteOutlet(outlet._id)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <FaTrash size={14} />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <FaStoreAlt className="text-gray-400 text-3xl" />
                        </div>
                        <p className="text-gray-500 font-medium mb-1">
                          {searchTerm ? "Tidak ditemukan outlet yang sesuai" : "Belum ada outlet"}
                        </p>
                        <p className="text-sm text-gray-400">
                          {searchTerm ? "Coba kata kunci pencarian lain" : "Klik tombol 'Tambah Outlet' untuk membuat outlet baru"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {paginatedOutlets.length > 0 && (
          <div className="mt-6">
            <Paginated
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OutletManagementPage;