import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaCut, FaBell, FaUser, FaChevronRight, FaSearch, FaPlus } from "react-icons/fa";
import Datepicker from 'react-tailwindcss-datepicker';
import axios from "axios";
import PromoTable from "./promotable";
import Header from "../../admin/header";
import Select from "react-select";

const PromoList = () => {
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

  const statusOptions = [
    { value: "true", label: "Aktif" },
    { value: "false", label: "Tidak Aktif" },
  ];

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

      {/* Breadcrumb */}
      <div className="flex justify-between items-center px-6 py-3 my-3">
        <h1 className="flex gap-2 items-center text-xl text-green-900 font-semibold">
          <Link to="/admin/promotion">Promo</Link>
          <FaChevronRight />
          <span>Promo Khusus</span>
        </h1>
        <Link
          to="/admin/promo-khusus-create"
          className="flex items-center bg-green-900 text-white text-[13px] px-[15px] py-[7px] rounded gap-2"
        >
          <FaPlus />Tambah
        </Link>
      </div>
      <div className="flex items-center justify-between gap-3 py-3 px-4">
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
        <div className="relative">
          <Select
            name="isActive"
            value={statusOptions.find((opt) => opt.value === filters.isActive)}
            onChange={(selected) =>
              handleFilterChange({
                target: { name: "isActive", value: selected.value },
              })
            }
            options={statusOptions}
            placeholder="All Status"
            styles={customSelectStyles}
            isSearchable={false}
          />
        </div>
      </div>
      <div className="py-[10px] px-[15px]">
        <PromoTable filteredPromos={filteredPromos} refreshPromos={fetchPromos} />
      </div>
    </div>
  );
};

export default PromoList;