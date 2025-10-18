import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaCut, FaChevronRight } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../admin/header";
import Select from "react-select";

const CreatePromoPage = () => {
  const navigate = useNavigate();

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? "#005429" : "#d1d5db",
      minHeight: "38px",
      fontSize: "14px",
      borderRadius: "0.375rem",
      boxShadow: state.isFocused ? "0 0 0 1px #005429" : "none",
      "&:hover": { borderColor: "#005429" },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#374151",
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
      backgroundColor: state.isFocused ? "rgba(0, 84, 41, 0.1)" : "white",
      cursor: "pointer",
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

  // Fetch data
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
      setError("Failed to load data. Please try again.");
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

  // Opsi untuk discountType
  const discountTypeOptions = [
    { value: "percentage", label: "%" },
    { value: "fixed", label: "Rp" },
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await axios.post("/api/promotion/promo-create", promo);
      navigate("/admin/promo-khusus");
    } catch (err) {
      console.error("Error creating promo:", err);
      setError("Failed to create promo. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-2">Error</p>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-[#005429] text-white px-4 py-2 rounded-md"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto">
      <Header />

      {/* Toolbar */}
      <div className="px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b bg-white">
        <div className="flex items-center flex-wrap text-gray-500 text-sm space-x-1">
          <FaCut className="text-gray-500" />
          <p>Promo</p>
          <FaChevronRight size={12} />
          <Link to="/admin/promo-khusus">Promo Khusus</Link>
          <FaChevronRight size={12} />
          <Link to="/admin/promo-khusus-create" className="font-semibold">
            Tambah Promo Khusus
          </Link>
        </div>
      </div>

      {/* Form */}
      <form
        id="promo-form"
        onSubmit={handleSubmit}
        className="bg-slate-50 px-4 sm:px-6 py-8 max-w-7xl mx-auto"
      >
        <div className="bg-white rounded-lg p-6 sm:p-10 shadow-md space-y-6">
          {/* Nama Promo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <label className="text-sm font-semibold">Nama Promo</label>
            <input
              name="name"
              type="text"
              value={promo.name}
              onChange={handleInputChange}
              className="col-span-2 border border-gray-300 focus:border-green-600 focus:ring-green-600 p-2 rounded-md"
              placeholder="Contoh: Diskon Pelajar"
              required
            />
          </div>

          {/* Besar Diskon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <label className="text-sm font-semibold">Besar Diskon</label>
            <div className="col-span-2 flex items-center space-x-3">
              <Select
                className="w-[70px] text-sm"
                classNamePrefix="react-select"
                options={discountTypeOptions}
                value={discountTypeOptions.find(opt => opt.value === promo.discountType)}
                onChange={(selected) =>
                  handleInputChange({
                    target: { name: "discountType", value: selected.value },
                  })
                }
                isSearchable={false} // karena cuma 2 opsi
                styles={customSelectStyles}
              />
              <input
                name="discountAmount"
                type="number"
                value={promo.discountAmount}
                onChange={handleInputChange}
                className="flex-1 border border-gray-300 focus:border-green-600 focus:ring-green-600 p-2 rounded-md"
                required
              />
            </div>
          </div>

          {/* Customer Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <label className="text-sm font-semibold">Customer Type</label>
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
              placeholder="Select Customer Type"
              className="col-span-2 text-sm"
              classNamePrefix="react-select"
              styles={customSelectStyles}
              isClearable
              required
            />
          </div>

          {/* Validity Dates */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">
                Valid From
              </label>
              <input
                name="validFrom"
                type="date"
                value={promo.validFrom}
                onChange={handleInputChange}
                className="w-full border border-gray-300 focus:border-green-600 focus:ring-green-600 p-2 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">
                Valid To
              </label>
              <input
                name="validTo"
                type="date"
                value={promo.validTo}
                onChange={handleInputChange}
                className="w-full border border-gray-300 focus:border-green-600 focus:ring-green-600 p-2 rounded-md"
                required
              />
            </div>
          </div> */}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Tanggal Promo</label>
            <div className="flex gap-2">
              <input
                type="date"
                name="validFrom"
                value={promo.validFrom.slice(0, 10)}
                onChange={e => setPromo(prev => ({ ...prev, validFrom: e.target.value }))}
                className={`w-1/2 px-4 py-2 border rounded-md`}
              />
              <input
                type="date"
                name="validTo"
                value={promo.validTo.slice(0, 10)}
                onChange={e => setPromo(prev => ({ ...prev, validTo: e.target.value }))}
                className={`w-1/2 px-4 py-2 border rounded-md`}
              />
            </div>
          </div>

          {/* Outlets */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Select Outlets
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 rounded-md border border-gray-200 p-3 max-h-48 overflow-y-auto">
              {outlets.map((outlet) => (
                <label
                  key={outlet._id}
                  className="flex items-center space-x-2 text-sm"
                >
                  <input
                    type="checkbox"
                    value={outlet._id}
                    checked={promo.outlet.includes(outlet._id)}
                    onChange={handleOutletChange}
                    className="form-checkbox text-green-600 rounded"
                  />
                  <span>{outlet.name || "N/A"}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-3 sm:mt-0">
            <Link
              to="/admin/promo-khusus"
              className="bg-white text-[#005429] border border-[#005429] text-sm px-4 py-2 rounded-md hover:bg-gray-50 transition"
            >
              Batal
            </Link>
            <button
              type="submit"
              form="promo-form"
              className="bg-[#005429] text-white text-sm px-4 py-2 rounded-md hover:bg-green-700 transition"
            >
              Tambah Promo
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePromoPage;
