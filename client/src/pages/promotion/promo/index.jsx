import { useEffect, useState } from "react";
import axios from "axios";

const PromoList = () => {
  const [promos, setPromos] = useState([]);
  const [filteredPromos, setFilteredPromos] = useState([]);
  const [filters, setFilters] = useState({ date: "", outlet: "", isActive: "" });

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      const response = await axios.get("/api/promotion/promos");
      setPromos(response.data);
      setFilteredPromos(response.data);
    } catch (error) {
      console.error("Error fetching promos", error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  useEffect(() => {
    let filtered = promos;
    if (filters.date) {
      filtered = filtered.filter((promo) =>
        new Date(promo.validFrom) <= new Date(filters.date) && new Date(promo.validTo) >= new Date(filters.date)
      );
    }
    if (filters.outlet) {
      filtered = filtered.filter((promo) => promo.outlet.some((o) => o._id === filters.outlet));
    }
    if (filters.isActive) {
      filtered = filtered.filter((promo) => promo.isActive.toString() === filters.isActive);
    }
    setFilteredPromos(filtered);
  }, [filters, promos]);

  return (
    <div className="max-w-8xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Promo List</h2>
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
        <select
          name="isActive"
          value={filters.isActive}
          onChange={handleFilterChange}
          className="p-2 border rounded w-1/3"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPromos.map((promo) => (
          <div key={promo._id} className="p-4 border rounded shadow">
            <h3 className="text-lg font-semibold">{promo.name}</h3>
            <p className="text-sm">Discount: {promo.discountAmount} {promo.discountType === "percentage" ? "%" : "USD"}</p>
            <p className="text-sm">Customer Type: {promo.customerType}</p>
            <p className="text-sm">Valid From: {new Date(promo.validFrom).toLocaleDateString()}</p>
            <p className="text-sm">Valid To: {new Date(promo.validTo).toLocaleDateString()}</p>
            <p className={`text-sm font-semibold ${promo.isActive ? "text-green-500" : "text-red-500"}`}>
              {promo.isActive ? "Active" : "Inactive"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromoList;