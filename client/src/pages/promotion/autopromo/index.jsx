import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaCut, FaBell, FaUser, FaChevronRight } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import axios from "axios";
import Select from "react-select";
import PromoTable from "./promotable";
import Header from "../../admin/header";
import MessageAlertPromotion from "../messageAlertPromotion";

const RunningAutoPromos = () => {
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
  const [promos, setPromos] = useState([]);
  const [activeTab, setActiveTab] = useState("aktif");
  const [outlets, setOutlet] = useState([]);

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

  const fetchOutlet = async () => {
    const response = await axios.get("/api/outlet");
    setOutlet(response.data.data ? response.data.data : response.data);
  }

  const promoTypeOptions = [
    { value: "discount_on_quantity", label: "Discount on Quantity" },
    { value: "discount_on_total", label: "Discount on Total" },
    { value: "buy_x_get_y", label: "Buy X Get Y" },
    { value: "bundling", label: "Bundling" },
  ];

  useEffect(() => {
    fetchPromos();
    fetchOutlet();
  }, []);

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
      <Header />

      {/* Breadcrumb */}
      <div className="px-3 py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2 text-sm text-gray-500 w-full sm:w-auto whitespace-nowrap">
          <FaCut size={18} />
          <Link to="/admin/promotion">Promo</Link>
          <FaChevronRight />
          <span>Promo Otomatis</span>
        </div>
        <div className="w-full py-4 hidden sm:block"></div>
      </div>

      <MessageAlertPromotion />

      <div className="px-[15px] pt-[15px]">
        <div className="flex justify-between items-center py-[10px] px-[15px]">
          <h3 className="text-gray-500 font-semibold">{filteredPromos.length} Promo</h3>
          <Link
            to="/admin/promo-otomatis-create"
            className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
          >
            Tambah Promo
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 py-4">
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
      <div className="px-4 pb-4">
        <div className="my-4 py-3 px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end rounded-lg bg-slate-50 shadow-md shadow-slate-200">

          {/* Datepicker */}
          <div className="flex flex-col">
            <label className="text-sm mb-1 text-gray-600">Tanggal :</label>
            <Datepicker
              showFooter
              showShortcuts
              value={filters.date}
              onChange={handleDateRangeChange}
              displayFormat="DD-MM-YYYY"
              inputClassName="w-full text-sm border py-2 pr-8 pl-3 rounded cursor-pointer"
              popoverDirection="down"
            />
          </div>

          {/* Outlet */}
          <div className="flex flex-col">
            <label className="text-sm mb-1 text-gray-600">Outlet :</label>
            <Select
              name="outlet"
              value={
                outlets
                  .map((p) => ({ value: p._id, label: p.name }))
                  .find((o) => o.value === filters.outlet) || null
              }
              options={outlets.map((p) => ({ value: p._id, label: p.name }))}
              isSearchable
              placeholder="Select Outlet"
              styles={customSelectStyles}
              onChange={(selectedOption) =>
                setFilters((prev) => ({
                  ...prev,
                  outlet: selectedOption ? selectedOption.value : "",
                }))
              }
            />
          </div>

          {/* Promo Type */}
          <div className="flex flex-col">
            <label className="text-sm mb-1 text-gray-600">Promo Tipe :</label>
            <Select
              name="promoType"
              value={{
                value: filters.promoType,
                label:
                  promoTypeOptions.find((opt) => opt.value === filters.promoType)?.label,
              }}
              onChange={(selected) =>
                setFilters((prev) => ({ ...prev, promoType: selected.value }))
              }
              placeholder="Select Tipe"
              options={promoTypeOptions}
              className="text-sm"
              styles={customSelectStyles}
            />
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
        {activeTab === "tidak-berlaku" && (
          <div className="py-[10px] px-[15px]">
            <PromoTable filteredPromos={promosTidakAktif} refreshPromos={fetchPromos} />
          </div>
        )}
      </div>
    </div>
  );
};

export default RunningAutoPromos;
