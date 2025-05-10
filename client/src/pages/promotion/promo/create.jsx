import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const CreatePromoPage = () => {
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
      alert("Promo created successfully!");
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
    } catch (err) {
      console.error("Error creating promo:", err);
      setError("Failed to create promo. Please try again.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      {loading && <p className="text-center text-gray-600">Loading data...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Promo Name</label>
            <input
              name="name"
              type="text"
              value={promo.name}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Discount Amount</label>
            <input
              name="discountAmount"
              type="number"
              min="0"
              value={promo.discountAmount}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Discount Type</label>
            <select
              name="discountType"
              value={promo.discountType}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
              required
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Customer Type</label>
            <select
              name="customerType"
              value={promo.customerType}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
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

          <div>
            <label className="block font-medium mb-1">Select Outlets</label>
            <div className="grid grid-cols-2 gap-2">
              {outlets.map((outlet) => (
                <label key={outlet._id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    value={outlet._id}
                    checked={promo.outlet.includes(outlet._id)}
                    onChange={handleOutletChange}
                    className="form-checkbox"
                  />
                  <span>{outlet.name || "N/A"}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Valid From</label>
            <input
              name="validFrom"
              type="date"
              value={promo.validFrom}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Valid To</label>
            <input
              name="validTo"
              type="date"
              value={promo.validTo}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                name="isActive"
                type="checkbox"
                checked={promo.isActive}
                onChange={handleInputChange}
                className="mr-2"
              />
              Is Active
            </label>
          </div>

          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Create Promo
          </button>
        </form>
      )}
    </div>
  );
};

export default CreatePromoPage;
