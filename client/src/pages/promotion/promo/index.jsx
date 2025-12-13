import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaCut, FaChevronRight, FaSearch, FaPlus, FaFilter, FaTimes, FaCalendarAlt, FaStore, FaToggleOn, FaToggleOff } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import axios from "axios";
import PromoTable from "./promotable";
import Header from "../../admin/header";
import Select from "react-select";

const PromoList = () => {
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#005429' : '#e5e7eb',
      minHeight: '42px',
      fontSize: '14px',
      borderRadius: '0.5rem',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(0, 84, 41, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#005429',
      },
      transition: 'all 0.2s',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1f2937',
      fontSize: '14px',
    }),
    input: (provided) => ({
      ...provided,
      color: '#1f2937',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
      fontSize: '14px',
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: '14px',
      color: '#374151',
      backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.08)' : 'white',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: 'rgba(0, 84, 41, 0.15)',
      },
    }),
  };

  const [promos, setPromos] = useState([]);
  const [tempSearch, setTempSearch] = useState("");
  const [filteredPromos, setFilteredPromos] = useState([]);
  const [filters, setFilters] = useState({
    date: {
      startDate: null,
      endDate: null,
    },
    outlet: "",
    isActive: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [outlets, setOutlets] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const [promosRes, outletsRes] = await Promise.all([
        axios.get("/api/promotion/promos"),
        axios.get("/api/outlet")
      ]);
      setPromos(promosRes.data);
      setFilteredPromos(promosRes.data);
      setOutlets(outletsRes.data.data || []);
    } catch (error) {
      console.error("Error fetching data", error);
      setError("Gagal memuat data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleDateRangeChange = (value) => {
    setFilters((prev) => ({
      ...prev,
      date: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      date: {
        startDate: null,
        endDate: null,
      },
      outlet: "",
      isActive: ""
    });
    setTempSearch("");
  };

  const activeFilterCount = () => {
    let count = 0;
    if (filters.date.startDate && filters.date.endDate) count++;
    if (filters.outlet) count++;
    if (filters.isActive) count++;
    if (tempSearch) count++;
    return count;
  };

  useEffect(() => {
    let filtered = promos;

    // Filter by search
    if (tempSearch) {
      filtered = filtered.filter((promo) =>
        promo.name.toLowerCase().includes(tempSearch.toLowerCase())
      );
    }

    // Filter by date
    if (filters.date.startDate && filters.date.endDate) {
      const start = new Date(filters.date.startDate);
      const end = new Date(filters.date.endDate);

      filtered = filtered.filter((promo) => {
        const validFrom = new Date(promo.validFrom);
        const validTo = new Date(promo.validTo);
        return validFrom <= end && validTo >= start;
      });
    }

    // Filter by outlet
    if (filters.outlet) {
      filtered = filtered.filter((promo) =>
        promo.outlet.some((o) => o._id === filters.outlet)
      );
    }

    // Filter by status
    if (filters.isActive) {
      filtered = filtered.filter((promo) =>
        promo.isActive.toString() === filters.isActive
      );
    }

    setFilteredPromos(filtered);
  }, [filters, promos, tempSearch]);

  const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "true", label: "Aktif" },
    { value: "false", label: "Tidak Aktif" },
  ];

  const outletOptions = [
    { value: "", label: "Semua Outlet" },
    ...outlets.map(outlet => ({
      value: outlet._id,
      label: outlet.name
    }))
  ];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-[#005429] border-b-[#005429] border-l-transparent border-r-transparent"></div>
        <p className="mt-4 text-gray-600 text-sm">Memuat data promo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-xl font-semibold mb-2 text-gray-900">Terjadi Kesalahan</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#005429] hover:bg-[#007038] text-white px-6 py-2.5 rounded-lg font-medium transition-all"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Breadcrumb */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm">
              <FaCut className="text-[#005429]" />
              <Link to="/admin/promotion" className="text-gray-600 hover:text-[#005429] transition font-medium">
                Promo
              </Link>
              <FaChevronRight size={10} className="text-gray-400" />
              <span className="text-[#005429] font-semibold">Promo Khusus</span>
            </div>

            {/* Add Button */}
            <Link
              to="/admin/promo-khusus-create"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#005429] to-[#007038] hover:shadow-lg text-white px-6 py-2.5 rounded-lg font-semibold transition-all transform hover:scale-105"
            >
              <FaPlus className="text-sm" />
              Tambah Promo
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title & Stats */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manajemen Promo Khusus</h1>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-600">Total Promo</p>
              <p className="text-2xl font-bold text-gray-900">{promos.length}</p>
            </div>
            <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-600">Promo Aktif</p>
              <p className="text-2xl font-bold text-green-600">
                {promos.filter(p => p.isActive).length}
              </p>
            </div>
            <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-600">Hasil Filter</p>
              <p className="text-2xl font-bold text-blue-600">{filteredPromos.length}</p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          {/* Filter Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-gray-700 hover:text-[#005429] font-semibold transition"
              >
                <FaFilter className="text-[#005429]" />
                Filter & Pencarian
                {activeFilterCount() > 0 && (
                  <span className="bg-[#005429] text-white text-xs px-2 py-0.5 rounded-full">
                    {activeFilterCount()}
                  </span>
                )}
              </button>
            </div>
            {activeFilterCount() > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium transition"
              >
                <FaTimes />
                Hapus Filter
              </button>
            )}
          </div>

          {/* Filter Content */}
          {showFilters && (
            <div className="p-6 space-y-4 bg-gray-50">
              {/* Search Bar */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaSearch className="inline mr-1.5 text-[#005429]" />
                  Cari Nama Promo
                </label>
                <div className="relative">
                  <FaSearch className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ketik nama promo..."
                    value={tempSearch}
                    onChange={(e) => setTempSearch(e.target.value)}
                    className="w-full text-sm border border-gray-300 focus:border-[#005429] focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 py-2.5 pl-11 pr-4 rounded-lg transition-all"
                  />
                  {tempSearch && (
                    <button
                      onClick={() => setTempSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <FaCalendarAlt className="inline mr-1.5 text-[#005429]" />
                    Periode Tanggal
                  </label>
                  <Datepicker
                    value={filters.date}
                    onChange={handleDateRangeChange}
                    showShortcuts={true}
                    placeholder="Pilih rentang tanggal"
                    displayFormat="DD/MM/YYYY"
                    inputClassName="w-full text-sm border border-gray-300 focus:border-[#005429] focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 py-2.5 px-4 rounded-lg transition-all"
                    toggleClassName="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>

                {/* Outlet Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <FaStore className="inline mr-1.5 text-[#005429]" />
                    Filter Outlet
                  </label>
                  <Select
                    name="outlet"
                    value={outletOptions.find((opt) => opt.value === filters.outlet)}
                    onChange={(selected) =>
                      handleFilterChange({
                        target: { name: "outlet", value: selected.value },
                      })
                    }
                    options={outletOptions}
                    placeholder="Pilih outlet"
                    styles={customSelectStyles}
                    isSearchable={true}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <FaToggleOn className="inline mr-1.5 text-[#005429]" />
                    Status Promo
                  </label>
                  <Select
                    name="isActive"
                    value={statusOptions.find((opt) => opt.value === filters.isActive)}
                    onChange={(selected) =>
                      handleFilterChange({
                        target: { name: "isActive", value: selected.value },
                      })
                    }
                    options={statusOptions}
                    placeholder="Pilih status"
                    styles={customSelectStyles}
                    isSearchable={false}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredPromos.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSearch className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak Ada Data</h3>
              <p className="text-gray-600 mb-6">
                {activeFilterCount() > 0
                  ? "Tidak ada promo yang sesuai dengan filter Anda."
                  : "Belum ada promo yang dibuat."}
              </p>
              {activeFilterCount() === 0 && (
                <Link
                  to="/admin/promo-khusus-create"
                  className="inline-flex items-center gap-2 bg-[#005429] hover:bg-[#007038] text-white px-6 py-2.5 rounded-lg font-medium transition-all"
                >
                  <FaPlus />
                  Tambah Promo Pertama
                </Link>
              )}
            </div>
          ) : (
            <PromoTable filteredPromos={filteredPromos} refreshPromos={fetchData} />
          )}
        </div>
      </div>
    </div>
  );
};

export default PromoList;