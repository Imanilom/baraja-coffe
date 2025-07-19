import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaCut, FaBell, FaUser, FaChevronRight } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import axios from "axios";
import PromoTable from "./promotable";

const RunningAutoPromos = () => {
  const [promos, setPromos] = useState([]);
  const [activeTab, setActiveTab] = useState("aktif");

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  const [filteredPromos, setFilteredPromos] = useState([]);
  const [filters, setFilters] = useState({
    date: {
      startDate: null,
      endDate: null,
    },
    outlet: "",
    promoType: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all running auto promos
  const fetchPromos = useCallback(async () => {
    try {
      const response = await axios.get("/api/promotion/autopromos");
      setPromos(response.data);
      setFilteredPromos(response.data);
    } catch (error) {
      console.error("Error fetching promos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateRangeChange = (value) => {
    setFilters((prev) => ({
      ...prev,
      date: value, // { startDate, endDate }
    }));
  };

  // Apply filters
  useEffect(() => {
    // let filtered = [...promos];

    //   const selectedDate = new Date(filters.date);
    //   filtered = filtered.filter((promo) => {
    //     const validFrom = new Date(promo.validFrom);
    //     const validTo = new Date(promo.validTo);
    //     return selectedDate >= validFrom && selectedDate <= validTo;
    //   });

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

    // Filter by outlet
    if (filters.outlet) {
      filtered = filtered.filter((promo) => promo.outlet?._id === filters.outlet);
    }

    // Filter by promo type
    if (filters.promoType) {
      filtered = filtered.filter((promo) => promo.promoType === filters.promoType);
    }

    setFilteredPromos(filtered);
  }, [filters, promos]);

  // Filter berdasarkan isActive
  const promosAktif = promos.filter(promo => promo.isActive === true);
  const promosTidakAktif = promos.filter(promo => promo.isActive === false);
  const totalAktif = promos.filter(promo => promo.isActive === true).length;
  const totalTidakAktif = promos.filter(promo => promo.isActive === false).length;

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
          <Link to="/admin/promotion" className="text-[15px] text-gray-500">Promo</Link>
          <FaChevronRight className="text-[15px] text-gray-500" />
          <Link to="/admin/promo-khusus" className="text-[15px] text-gray-500">Promo Otomatis</Link>
        </div>
      </div>

      <div className="px-[15px] pt-[15px]">
        <div className="flex justify-between items-center py-[10px] px-[15px]">
          <h3 className="text-gray-500 font-semibold">3 Promo</h3>
          <Link
            to="/admin/promo-otomatis-create"
            className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
          >
            Tambah Promo
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-3 py-4">
        <button
          className={`bg-white border-b-2 py-2 hover:border-b-[#005429] ${activeTab === "aktif" ? "border-b-[#005429]" : "border-b-white"
            }`}
          onClick={() => handleTabChange("aktif")}
        >
          <div className="flex justify-between items-center border-l border-l-gray-200 p-4">
            <div className="flex space-x-4">
              <h2 className="text-gray-400 ml-2 text-sm">Aktif</h2>
            </div>
            <div className="text-sm text-gray-400">({totalAktif})</div>
          </div>
        </button>

        <button
          className={`bg-white border-b-2 py-2 hover:border-b-[#005429] ${activeTab === "akan-datang" ? "border-b-[#005429]" : "border-b-white"
            }`}
          onClick={() => handleTabChange("akan-datang")}
        >
          <div className="flex justify-between items-center border-l border-l-gray-200 p-4">
            <div className="flex space-x-4 items-center">
              <h2 className="text-gray-400 ml-2 text-sm">Akan Datang</h2>
              <span className="relative group">
                <div className="absolute z-10 left-1/2 -translate-x-1/2 mt-2 w-[280px] text-justify bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none">
                  Opsi Tambahan merupakan produk pelengkap yang dijual bersamaan dengan produk utama. (Contoh: Nasi Goreng memiliki opsi tambahan ekstra telur dan ekstra bakso)
                </div>
              </span>
            </div>
            <div className="text-sm text-gray-400">(0)</div>
          </div>
        </button>

        <button
          className={`bg-white border-b-2 py-2 hover:border-b-[#005429] ${activeTab === "tidak-berlaku" ? "border-b-[#005429]" : "border-b-white"
            }`}
          onClick={() => handleTabChange("tidak-berlaku")}
        >
          <div className="flex justify-between items-center border-l border-l-gray-200 p-4">
            <div className="flex space-x-4">
              <h2 className="text-gray-400 ml-2 text-sm">Tidak Berlaku</h2>
            </div>
            <div className="text-sm text-gray-400">({totalTidakAktif})</div>
          </div>
        </button>
      </div>
      <div className="px-[15px] pb-[15px]">
        <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-3 gap-[10px] items-end rounded bg-slate-50 shadow-slate-200 shadow-md">
          {/* <input
          type="date"
          name="date"
          value={filters.date}
          onChange={handleFilterChange}
          className="p-2 border rounded w-1/3"
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
              {Array.from(new Set(promos.map((p) => p.outlet?._id))).map((outletId) => {
                const outlet = promos.find((p) => p.outlet?._id === outletId)?.outlet;
                return (
                  <option key={outletId} value={outletId}>
                    {outlet?.name || "Unknown"}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="relative">
            <label className="text-[13px] mb-1 text-gray-500">Promo Type :</label>
            <select
              name="promoType"
              value={filters.promoType}
              onChange={handleFilterChange}
              className="w-full text-[13px] text-gray-500 border py-[6px] pr-[25px] pl-[12px] rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]"
            >
              <option value="">All Promo Types</option>
              <option value="discount_on_quantity">Discount on Quantity</option>
              <option value="discount_on_total">Discount on Total</option>
              <option value="buy_x_get_y">Buy X Get Y</option>
              <option value="bundling">Bundling</option>
            </select>
          </div>
        </div>
      </div>

      {/* Konten Berdasarkan Tab yang Aktif */}
      <div className="mt-6">
        {activeTab === "aktif" && (
          <div className="py-[10px] px-[15px]">
            <PromoTable filteredPromos={promosAktif} refreshPromos={fetchPromos} />
          </div>
        )}
        {activeTab === "akan-datang" && (
          <div>
          </div>
        )}
        {activeTab === "tidak-berlaku" && (
          <div className="py-[10px] px-[15px]">
            <PromoTable filteredPromos={promosTidakAktif} refreshPromos={fetchPromos} />
          </div>
        )}
      </div>
      {/* Filters */}

      {/* Promo List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 py-[10px] px-[15px]">
        {/* {filteredPromos.length > 0 ? (
          filteredPromos.map((promo) => (
            <div key={promo._id} className="p-4 border rounded shadow bg-gray-50">
              <h3 className="text-lg font-semibold">{promo.name}</h3>
              <p className="text-sm">Type: {promo.promoType}</p>
              <p className="text-sm">Outlet: {promo.outlet?.name || "Unknown"}</p>
              <p className="text-sm">
                Valid From: {new Intl.DateTimeFormat("id-ID").format(new Date(promo.validFrom))}
              </p>
              <p className="text-sm">
                Valid To: {new Intl.DateTimeFormat("id-ID").format(new Date(promo.validTo))}
              </p>
              <p className="text-sm">
                Discount:{" "}
                {promo.promoType === "buy_x_get_y"
                  ? `Buy ${promo.conditions?.buyProduct?.name || "Unknown"}, Get ${promo.conditions?.getProduct?.name || "Unknown"
                  }`
                  : `${promo.discount} ${promo.promoType === "discount_on_total" ? "IDR" : "%"
                  }`}
              </p>
              <p
                className={`text-sm font-semibold ${promo.isActive ? "text-green-500" : "text-red-500"
                  }`}
              >
                Status: {promo.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          ))
        ) : (
          <p>No promos found matching the filters.</p>
        )} */}
      </div>
    </div>
  );
};

export default RunningAutoPromos;
