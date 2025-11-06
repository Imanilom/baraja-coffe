import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaCut, FaChevronRight, FaPercentage, FaMoneyBillWave, FaCalendarAlt, FaStore, FaUsers, FaTag } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../admin/header";
import Select from "react-select";

const CreatePromoPage = () => {
  const navigate = useNavigate();

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? "#005429" : "#e5e7eb",
      minHeight: "42px",
      fontSize: "14px",
      borderRadius: "0.5rem",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(0, 84, 41, 0.1)" : "none",
      "&:hover": { borderColor: "#005429" },
      transition: "all 0.2s",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#1f2937",
      fontSize: "14px",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af",
      fontSize: "14px",
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: "14px",
      color: "#374151",
      backgroundColor: state.isFocused ? "rgba(0, 84, 41, 0.08)" : "white",
      cursor: "pointer",
      "&:active": {
        backgroundColor: "rgba(0, 84, 41, 0.15)",
      },
    }),
  };

  const [promo, setPromo] = useState({
    name: "",
    discountAmount: 0,
    discountType: "percentage",
    customerType: "",
    outlet: [],
    validFrom: new Date().toISOString().split("T")[0],
    validTo: new Date().toISOString().split("T")[0],
    isActive: true,
  });

  const [outlets, setOutlets] = useState([]);
  const [loyaltyLevels, setLoyaltyLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectAll, setSelectAll] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [outletsRes, levelsRes] = await Promise.all([
        axios.get("/api/outlet"),
        axios.get("/api/promotion/loyalty-levels"),
      ]);

      setOutlets(outletsRes.data.data || []);
      setLoyaltyLevels(levelsRes.data.data || []);
      setPromo((prev) => ({
        ...prev,
        customerType: levelsRes.data?.data?.length
          ? levelsRes.data.data[0]._id
          : "",
        outlet: [],
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Gagal memuat data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const customerTypeOptions = loyaltyLevels.map((level) => ({
    value: level._id,
    label: level.name || "N/A",
  }));

  const discountTypeOptions = [
    { value: "percentage", label: "Persentase (%)", icon: <FaPercentage /> },
    { value: "fixed", label: "Nominal (Rp)", icon: <FaMoneyBillWave /> },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPromo((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleOutletChange = (e) => {
    const { value, checked } = e.target;
    setPromo((prev) => {
      let updated = [...prev.outlet];
      updated = checked
        ? [...updated, value]
        : updated.filter((id) => id !== value);
      return { ...prev, outlet: updated };
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setPromo((prev) => ({ ...prev, outlet: [] }));
    } else {
      setPromo((prev) => ({
        ...prev,
        outlet: outlets.map((o) => o._id),
      }));
    }
    setSelectAll(!selectAll);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (promo.outlet.length === 0) {
      setError("Pilih minimal satu outlet.");
      return;
    }

    try {
      setError(null);
      await axios.post("/api/promotion/promo-create", promo);
      navigate("/admin/promo-khusus");
    } catch (err) {
      console.error("Error creating promo:", err);
      setError(err.response?.data?.message || "Gagal membuat promo. Silakan coba lagi.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-[#005429] border-b-[#005429] border-l-transparent border-r-transparent"></div>
        <p className="mt-4 text-gray-600 text-sm">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* Main Content */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Buat Promo Khusus</h1>
          <p className="text-gray-600">Isi formulir di bawah untuk membuat promo baru untuk pelanggan</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-shake">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex space-x-6">
            {/* Basic Info Card */}
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-[#005429] to-[#007038] px-6 py-4">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <FaTag className="mr-2" />
                  Informasi Promo
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Nama Promo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Promo <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={promo.name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 focus:border-[#005429] focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 px-4 py-2.5 rounded-lg transition-all"
                    placeholder="Contoh: Diskon Pelajar 20%"
                    required
                  />
                </div>

                {/* Besar Diskon */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipe & Besar Diskon <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    <Select
                      className="w-48"
                      classNamePrefix="react-select"
                      options={discountTypeOptions}
                      value={discountTypeOptions.find(opt => opt.value === promo.discountType)}
                      onChange={(selected) =>
                        handleInputChange({
                          target: { name: "discountType", value: selected.value },
                        })
                      }
                      isSearchable={false}
                      styles={customSelectStyles}
                    />
                    <div className="flex-1 relative">
                      <input
                        name="discountAmount"
                        type="number"
                        min="0"
                        step={promo.discountType === "percentage" ? "0.01" : "1000"}
                        max={promo.discountType === "percentage" ? "100" : undefined}
                        value={promo.discountAmount}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 focus:border-[#005429] focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 px-4 py-2.5 rounded-lg transition-all"
                        placeholder={promo.discountType === "percentage" ? "Contoh: 20" : "Contoh: 50000"}
                        required
                      />
                      {promo.discountType === "percentage" && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                      )}
                    </div>
                  </div>
                  {promo.discountType === "percentage" && promo.discountAmount > 100 && (
                    <p className="mt-1 text-sm text-red-600">Persentase tidak boleh lebih dari 100%</p>
                  )}
                </div>

                {/* Customer Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <FaUsers className="inline mr-1.5 text-[#005429]" />
                    Tipe Pelanggan <span className="text-red-500">*</span>
                  </label>
                  <Select
                    name="customerType"
                    value={customerTypeOptions.find(
                      (opt) => opt.value === promo.customerType
                    )}
                    onChange={(opt) =>
                      handleInputChange({
                        target: { name: "customerType", value: opt?.value },
                      })
                    }
                    options={customerTypeOptions}
                    placeholder="Pilih tipe pelanggan"
                    className="text-sm"
                    classNamePrefix="react-select"
                    styles={customSelectStyles}
                    isClearable
                    required
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </div>
              </div>
            </div>

            <div className="w-1/2 space-y-6">
              {/* Validity Period Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-[#005429] to-[#007038] px-6 py-4">
                  <h2 className="text-lg font-semibold text-white flex items-center">
                    <FaCalendarAlt className="mr-2" />
                    Periode Berlaku
                  </h2>
                </div>
                <div className="p-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Tanggal Mulai & Berakhir <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1.5">Tanggal Mulai</label>
                      <input
                        type="date"
                        name="validFrom"
                        value={promo.validFrom.slice(0, 10)}
                        onChange={e => setPromo(prev => ({ ...prev, validFrom: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 focus:border-[#005429] focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 rounded-lg transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1.5">Tanggal Berakhir</label>
                      <input
                        type="date"
                        name="validTo"
                        value={promo.validTo.slice(0, 10)}
                        min={promo.validFrom.slice(0, 10)}
                        onChange={e => setPromo(prev => ({ ...prev, validTo: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 focus:border-[#005429] focus:ring-2 focus:ring-[#005429] focus:ring-opacity-20 rounded-lg transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Outlets Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-[#005429] to-[#007038] px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white flex items-center">
                      <FaStore className="mr-2" />
                      Pilih Outlet
                    </h2>
                    <span className="text-white text-sm bg-white/20 px-3 py-1 rounded-full">
                      {promo.outlet.length} / {outlets.length} dipilih
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Outlet yang Berlaku <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-sm text-[#005429] hover:text-[#007038] font-semibold transition"
                    >
                      {selectAll ? "Batalkan Semua" : "Pilih Semua"}
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
                    <div className="">
                      {outlets.map((outlet) => (
                        <label
                          key={outlet._id}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white border border-transparent hover:border-[#005429] hover:shadow-sm transition-all cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            value={outlet._id}
                            checked={promo.outlet.includes(outlet._id)}
                            onChange={handleOutletChange}
                            className="w-4 h-4 text-[#005429] border-gray-300 rounded focus:ring-[#005429] focus:ring-2"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-[#005429] font-medium transition">
                            {outlet.name || "N/A"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {promo.outlet.length === 0 && (
                    <p className="mt-2 text-sm text-amber-600">⚠️ Pilih minimal satu outlet</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Link
              to="/admin/promo-khusus"
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all text-center"
            >
              Batal
            </Link>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-[#005429] to-[#007038] text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all transform"
            >
              Simpan Promo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePromoPage;