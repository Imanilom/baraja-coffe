import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaCut, FaBell, FaUser, FaChevronRight, FaSearch } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import axios from "axios";
import PromoTable from "./promotable";

const PromoList = () => {
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

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      setError(null);
      const response = await axios.get("/api/promotion/promos");
      setPromos(response.data);
      setFilteredPromos(response.data);
    } catch (error) {
      console.error("Error fetching promos", error);
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
      date: value, // { startDate, endDate }
    }));
  };

  useEffect(() => {
    let filtered = promos;

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
    if (filters.outlet) {
      filtered = filtered.filter((promo) => promo.outlet.some((o) => o._id === filters.outlet));
    }
    if (filters.isActive) {
      filtered = filtered.filter((promo) => promo.isActive.toString() === filters.isActive);
    }
    setFilteredPromos(filtered);
  }, [filters, promos]);

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
    <div className="max-w-8xl mx-auto mb-[60px]">
      {/* Header */}
      <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
        <FaBell size={23} className="text-gray-400" />
        <span className="text-[14px]">Hi Baraja</span>
        <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
          <FaUser size={30} />
        </Link>
      </div>

      {/* Breadcrumb */}
      <div className="px-3 py-3 flex justify-between items-center border-b">
        <div className="flex items-center space-x-2">
          <FaCut size={21} className="text-gray-500 inline-block" />
          <Link to="/admin/promotion" className="text-[15px] text-gray-500">Promo</Link>
          <FaChevronRight className="text-[15px] text-gray-500" />
          <Link to="/admin/promo-khusus" className="text-[15px] text-gray-500">Promo Khusus</Link>
        </div>
      </div>
      <div className="px-[15px] pt-[15px]">
        <div className="flex justify-between items-center py-[10px] px-[15px]">
          <h3 className="text-gray-500 font-semibold">3 Promo</h3>
          <Link
            to="/admin/promo-khusus-create"
            className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
          >
            Tambah Promo
          </Link>
        </div>
      </div>
      <div className="px-[15px] pb-[15px]">
        <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-2 gap-[10px] items-end rounded bg-slate-50 shadow-slate-200 shadow-md">
          {/* <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
            className="p-2 border rounded w-full"
          /> */}
          {/* <div className="relative">
            <label className="text-[13px] mb-1 text-gray-500">Tanggal :</label>
            <Datepicker
              showFooter
              showShortcuts
              value={filters.date}
              onChange={handleDateRangeChange}
              displayFormat="DD-MM-YYYY"
              inputClassName="w-full text-[13px] border py-[6px] pr-[25px] pl-[12px] rounded cursor-pointer"
              popoverDirection="down"
            />
          </div>
          <div className="relative">
            <label className="text-[13px] mb-1 text-gray-500">Outlet :</label>
            <select
              name="outlet"
              value={filters.outlet}
              onChange={handleFilterChange}
              className="w-full text-[13px] text-gray-500 border py-[6px] pr-[25px] pl-[12px] rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]"
            >
              <option value="">All Outlets</option>
              {Array.from(
                new Set(promos.flatMap((p) => p.outlet.map((o) => o._id)))
              ).map((outletId, index) => {
                const outletName = promos.find((p) => p.outlet.some((o) => o._id === outletId))?.outlet.find((o) => o._id === outletId)?.name || "Unknown";
                return (
                  <option key={`${outletId}-${index}`} value={outletId}>
                    {outletName}
                  </option>
                );
              })}
            </select>
          </div> */}
          <div className="relative">
            <label className="text-[13px] mb-1 text-gray-500">Cari Promo</label>
            <div className="relative">
              <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Promo"
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
                className="text-[13px] border py-[6px] pl-[30px] pr-[25px] rounded w-full"
              />
            </div>
          </div>
          <div className="relative">
            <label className="text-[13px] mb-1 text-gray-500">Status :</label>
            <select
              name="isActive"
              value={filters.isActive}
              onChange={handleFilterChange}
              className="w-full text-[13px] text-gray-500 border py-[6px] pr-[25px] pl-[12px] rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>
      <div className="py-[10px] px-[15px]">
        <PromoTable filteredPromos={filteredPromos} refreshPromos={fetchPromos} />
      </div>

      <div className="bg-white w-full h-[50px] fixed bottom-0 shadow-[0_-1px_4px_rgba(0,0,0,0.1)]">
        <div className="w-full h-[2px] bg-[#005429]">
        </div>
      </div>
    </div>
  );
};

export default PromoList;