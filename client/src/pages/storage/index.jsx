import React, { useState, useEffect } from "react";
import axios from "axios";

const StorageManagementPage = () => {
  const [rawMaterials, setRawMaterials] = useState([]);
  const [stockOpnames, setStockOpnames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawMaterialResponse = await axios.get("/api/storage/raw-material");
        const stockOpnameResponse = await axios.get("/api/storage/stock-opname");
        setRawMaterials(rawMaterialResponse.data.data || []);
        setStockOpnames(stockOpnameResponse.data.data || []);
      } catch (err) {
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-6">Storage Management</h1>

        {loading ? (
          <div className="text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Raw Materials</h2>
              {rawMaterials.length === 0 ? (
                <p className="text-gray-600">No raw materials available.</p>
              ) : (
                <table className="table-auto w-full bg-white shadow-md rounded-lg">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Quantity</th>
                      <th className="px-4 py-2">Unit</th>
                      <th className="px-4 py-2">Minimum Stock</th>
                      <th className="px-4 py-2">Supplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawMaterials.map((material) => (
                      <tr key={material._id} className="hover:bg-gray-100">
                        <td className="border px-4 py-2">{material.name}</td>
                        <td className="border px-4 py-2">{material.quantity}</td>
                        <td className="border px-4 py-2">{material.unit}</td>
                        <td className="border px-4 py-2">{material.minimumStock}</td>
                        <td className="border px-4 py-2">{material.supplier || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Stock Opnames</h2>
              {stockOpnames.length === 0 ? (
                <p className="text-gray-600">No stock opnames available.</p>
              ) : (
                <table className="table-auto w-full bg-white shadow-md rounded-lg">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-4 py-2">Item Type</th>
                      <th className="px-4 py-2">Initial Stock</th>
                      <th className="px-4 py-2">Final Stock</th>
                      <th className="px-4 py-2">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockOpnames.map((opname) => (
                      <tr key={opname._id} className="hover:bg-gray-100">
                        <td className="border px-4 py-2">{opname.itemType}</td>
                        <td className="border px-4 py-2">{opname.initialStock}</td>
                        <td className="border px-4 py-2">{opname.finalStock}</td>
                        <td className="border px-4 py-2">{opname.remarks || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default StorageManagementPage;
