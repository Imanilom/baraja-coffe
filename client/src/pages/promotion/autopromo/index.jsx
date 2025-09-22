import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaCut, FaBell, FaUser, FaChevronRight, FaPlus } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import axios from "axios";
import Select from "react-select";
import PromoTable from "./promotable";
import Header from "../../admin/header";
import MessageAlertPromotion from "../messageAlertPromotion";
import PromoTabs from "./tabs";

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
      <div className="flex justify-between items-center px-6 py-3 my-3 bg-white">
        <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
          <Link to="/admin/promotion">Promo</Link>
          <FaChevronRight />
          <span>Promo Otomatis</span>
        </h1>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/promo-otomatis-create"
            className="bg-[#005429] text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
          >
            <FaPlus /> Tambah
          </Link>
        </div>
      </div>

      <MessageAlertPromotion />

      <div className="px-[15px]">
        <PromoTabs
          activeTab={activeTab}
          handleTabChange={handleTabChange}
          totalAktif={totalAktif}
          totalTidakAktif={totalTidakAktif}
        />
      </div>

      <div className="flex items-center justify-between gap-3 py-3 px-4">
        {/* Datepicker */}
        <div className="flex items-center flex-1 max-w-xs border rounded px-3 py-2 bg-white shadow-sm">
          <Datepicker
            showFooter
            showShortcuts
            value={filters.date}
            onChange={handleDateRangeChange}
            displayFormat="DD-MM-YYYY"
            inputClassName="w-full text-sm border-none focus:ring-0 outline-none cursor-pointer"
            popoverDirection="down"
          />
        </div>

        {/* Outlet & Promo Type */}
        <div className="flex items-center w-64 gap-2 justify-end">
          {/* Outlet */}
          <div className="flex items-center max-w-xs w-full">
            <Select
              name="outlet"
              value={
                outlets
                  .map((p) => ({ value: p._id, label: p.name }))
                  .find((o) => o.value === filters.outlet) || null
              }
              options={outlets.map((p) => ({ value: p._id, label: p.name }))}
              isSearchable
              placeholder="Pilih Outlet"
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
          <div className="flex items-center max-w-xs w-full">
            <Select
              name="promoType"
              value={
                filters.promoType
                  ? {
                    value: filters.promoType,
                    label: promoTypeOptions.find(
                      (opt) => opt.value === filters.promoType
                    )?.label,
                  }
                  : null
              }
              onChange={(selected) =>
                setFilters((prev) => ({
                  ...prev,
                  promoType: selected ? selected.value : "",
                }))
              }
              placeholder="Pilih Tipe"
              options={promoTypeOptions}
              styles={customSelectStyles}
              isSearchable
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
