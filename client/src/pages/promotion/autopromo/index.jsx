import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const RunningAutoPromos = () => {
  const [promos, setPromos] = useState([]);
  const [filteredPromos, setFilteredPromos] = useState([]);
  const [filters, setFilters] = useState({
    date: "",
    outlet: "",
    promoType: "",
  });

  // Fetch all running auto promos
  const fetchPromos = useCallback(async () => {
    try {
      const response = await axios.get("/api/promotion/autopromos");
      setPromos(response.data);
      setFilteredPromos(response.data);
    } catch (error) {
      console.error("Error fetching promos:", error);
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

  // Apply filters
  useEffect(() => {
    let filtered = [...promos];

    // Filter by date
    if (filters.date) {
      const selectedDate = new Date(filters.date);
      filtered = filtered.filter((promo) => {
        const validFrom = new Date(promo.validFrom);
        const validTo = new Date(promo.validTo);
        return selectedDate >= validFrom && selectedDate <= validTo;
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

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Auto Promotion</h2>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <input
          type="date"
          name="date"
          value={filters.date}
          onChange={handleFilterChange}
          className="p-2 border rounded w-1/3"
        />
        <select
          name="outlet"
          value={filters.outlet}
          onChange={handleFilterChange}
          className="p-2 border rounded w-1/3"
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
        <select
          name="promoType"
          value={filters.promoType}
          onChange={handleFilterChange}
          className="p-2 border rounded w-1/3"
        >
          <option value="">All Promo Types</option>
          <option value="discount_on_quantity">Discount on Quantity</option>
          <option value="discount_on_total">Discount on Total</option>
          <option value="buy_x_get_y">Buy X Get Y</option>
          <option value="bundling">Bundling</option>
        </select>
      </div>

      {/* Promo List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPromos.length > 0 ? (
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
                  ? `Buy ${promo.conditions?.buyProduct?.name || "Unknown"}, Get ${
                      promo.conditions?.getProduct?.name || "Unknown"
                    }`
                  : `${promo.discount} ${
                      promo.promoType === "discount_on_total" ? "%" : "IDR"
                    }`}
              </p>
              <p
                className={`text-sm font-semibold ${
                  promo.isActive ? "text-green-500" : "text-red-500"
                }`}
              >
                Status: {promo.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          ))
        ) : (
          <p>No promos found matching the filters.</p>
        )}
      </div>
    </div>
  );
};

export default RunningAutoPromos;
