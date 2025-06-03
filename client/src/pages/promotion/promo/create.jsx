import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaCut, FaBell, FaUser, FaChevronRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const CreatePromoPage = () => {
  const navigate = useNavigate();
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

  // Fetch outlets & loyalty levels
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [outletsRes, levelsRes] = await Promise.all([
        axios.get("/api/outlet"),
        axios.get("/api/promotion/loyalty-levels"),
      ]);

      setOutlets(outletsRes.data || []);
      setLoyaltyLevels(levelsRes.data.data || []);

      setPromo((prev) => ({
        ...prev,
        customerType: levelsRes.data?.length ? levelsRes.data[0]._id : "",
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

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPromo((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle outlet selection (checkbox multi-select)
  const handleOutletChange = (e) => {
    const { value, checked } = e.target;

    setPromo((prev) => {
      let updatedOutlets = [...prev.outlet];

      if (checked) {
        updatedOutlets.push(value);
      } else {
        updatedOutlets = updatedOutlets.filter((id) => id !== value);
      }

      return { ...prev, outlet: updatedOutlets };
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      console.log(promo);
      await axios.post("/api/promotion/promo-create", promo);
      fetchData(); // Refresh data after creation
      setPromo({
        name: "",
        discountAmount: 0,
        discountType: "percentage",
        customerType: loyaltyLevels?.length ? loyaltyLevels[0]._id : "",
        outlet: [],
        validFrom: new Date().toISOString().split("T")[0],
        validTo: new Date().toISOString().split("T")[0],
        isActive: true,
      });
      navigate("/admin/promo-khusus");
    } catch (err) {
      console.error("Error creating promo:", err);
      setError("Failed to create promo. Please try again.");
    }
  };

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

      <form onSubmit={handleSubmit}>
        <div className="px-3 py-2 flex justify-between items-center border-b">
          <div className="flex items-center space-x-2">
            <FaCut size={21} className="text-gray-500 inline-block" />
            <p className="text-[15px] text-gray-500">Promo</p>
            <FaChevronRight className="text-[15px] text-gray-500" />
            <Link to="/admin/promo-khusus" className="text-[15px] text-gray-500">Promo Khusus</Link>
            <FaChevronRight className="text-[15px] text-gray-500" />
            <Link to="/admin/promo-khusus-create" className="text-[15px] text-gray-500">Tambah Promo Khusus</Link>
          </div>

          <div className="flex space-x-2">
            <Link to="/admin/promo-khusus"
              className="bg-white text-[#005429] border border-[#005429] text-[13px] px-[15px] py-[7px] rounded">
              Batal
            </Link>
            <button
              type="submit"
              className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
            >
              Tambah Promo
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-6">
          <div className="w-full mx-auto bg-white p-12 shadow-md space-y-6">

            {/* Promo Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Promo Name</label>
              <input
                name="name"
                type="text"
                value={promo.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 focus:border-green-600 focus:ring-green-600 p-2 rounded-md"
                placeholder="e.g. Weekend Special"
                required
              />
            </div>

            {/* Discount Amount + Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Discount Amount</label>
                <input
                  name="discountAmount"
                  type="number"
                  min="0"
                  value={promo.discountAmount}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 focus:border-green-600 focus:ring-green-600 p-2 rounded-md"
                  placeholder="e.g. 10"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Discount Type</label>
                <select
                  name="discountType"
                  value={promo.discountType}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 focus:border-green-600 focus:ring-green-600 p-2 rounded-md"
                  required
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (USD)</option>
                </select>
              </div>
            </div>

            {/* Customer Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Type</label>
              <select
                name="customerType"
                value={promo.customerType}
                onChange={handleInputChange}
                className="w-full border border-gray-300 focus:border-green-600 focus:ring-green-600 p-2 rounded-md"
                required
              >
                <option value="" disabled hidden>Select Customer Type</option>
                {loyaltyLevels.map((level) => (
                  <option key={level._id} value={level._id}>
                    {level.name || "N/A"}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Outlets */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Outlets</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-gray-200 rounded-md p-3 max-h-40 overflow-y-auto">
                {outlets.map((outlet) => (
                  <label key={outlet._id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={outlet._id}
                      checked={promo.outlet.includes(outlet._id)}
                      onChange={handleOutletChange}
                      className="form-checkbox text-green-600"
                    />
                    <span className="text-sm text-gray-700">{outlet.name || "N/A"}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Validity Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Valid From</label>
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">Valid To</label>
                <input
                  name="validTo"
                  type="date"
                  value={promo.validTo}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 focus:border-green-600 focus:ring-green-600 p-2 rounded-md"
                  required
                />
              </div>
            </div>

            {/* Is Active */}
            <div className="flex items-center space-x-2">
              <input
                name="isActive"
                type="checkbox"
                checked={promo.isActive}
                onChange={handleInputChange}
                className="form-checkbox text-green-600"
              />
              <label className="text-sm font-semibold text-gray-700">Is Active</label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePromoPage;
