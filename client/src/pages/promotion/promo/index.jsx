import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaCut, FaBell, FaUser, FaChevronRight } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import axios from "axios";

const PromoList = () => {
  const [promos, setPromos] = useState([]);
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
    <div className="max-w-8xl mx-auto">
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
          <FaCut size={21} className="text-gray-500 inline-block" />
          <p className="text-[15px] text-gray-500">Promo</p>
          <FaChevronRight className="text-[15px] text-gray-500" />
          <Link to="/admin/promo-khusus" className="text-[15px] text-gray-500">Promo Khusus</Link>
        </div>
        <Link
          to="/admin/promo-khusus-create"
          className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
        >
          Tambah Promo
        </Link>
      </div>
      <div className="px-[15px] pb-[15px]">
        <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-3 gap-[10px] items-end rounded bg-slate-50 shadow-slate-200 shadow-md">
          {/* <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
            className="p-2 border rounded w-full"
          /> */}
          <div className="relative">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 py-[10px] px-[15px]">
        {filteredPromos.map((promo) => (
          <div
            key={promo._id}
            className="flex bg-green-50 border border-green-700 rounded-xl shadow-md overflow-hidden mb-6 max-w-3xl w-full"
          >
            {/* Kiri: Informasi Promo */}
            <div className="w-3/4 p-5 bg-green-50 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{promo.name}</h3>
                <p className="text-sm text-gray-600">
                  Customer Type: <span className="font-medium">{promo.customerType}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Valid:{" "}
                  {new Date(promo.validFrom).toLocaleDateString("id-ID")} –{" "}
                  {new Date(promo.validTo).toLocaleDateString("id-ID")}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${promo.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-700"
                    }`}
                >
                  {promo.isActive ? "Active" : "Inactive"}
                </span>
                <a
                  href={`#`}
                  className="text-xs text-green-800 hover:underline font-medium"
                >
                  Edit
                </a>
              </div>
            </div>

            {/* Kanan: Diskon */}
            <div className="w-1/4 relative bg-green-800 text-white flex items-center justify-center">
              {/* Efek Sobekan Atas dan Bawah */}
              <div className="absolute top-0 left-0 w-5 h-5 bg-green-50 rounded-br-full"></div>
              <div className="absolute bottom-0 left-0 w-5 h-5 bg-green-50 rounded-tr-full"></div>

              <div className="text-center px-3 py-6">
                <p className="text-sm font-light">Discount</p>
                <h2 className="text-3xl font-extrabold leading-tight">
                  {promo.discountAmount}
                  <span className="text-xl ml-1">
                    {promo.discountType === "percentage" ? "%" : "USD"}
                  </span>
                </h2>
              </div>
            </div>
          </div>

        ))}
      </div>
    </div>
  );
};

export default PromoList;