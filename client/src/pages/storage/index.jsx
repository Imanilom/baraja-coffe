import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const RawMaterialsPage = () => {
  const [rawMaterials, setRawMaterials] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState(""); // Default: All Outlets
  const [selectedStatus, setSelectedStatus] = useState(""); // Default: All Status
  const [loading, setLoading] = useState(true); // Track loading state
  const [error, setError] = useState(null); // Handle errors gracefully
  const [currentPage, setCurrentPage] = useState(1); // Current page
  const itemsPerPage = 15; // Maximum items per page

  // Calculate paginated materials
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMaterials = rawMaterials.slice(indexOfFirstItem, indexOfLastItem);

  // Total pages
  const totalPages = Math.ceil(rawMaterials.length / itemsPerPage);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchOutlets();
        await fetchRawMaterials();
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures this runs once on mount

  // Fetch raw materials based on filters
  const fetchRawMaterials = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get("/api/storage/raw-material", {
        params: {
          outletId: selectedOutlet || "", // Send empty string for "All Outlets"
          status: selectedStatus || "" // Send empty string for "All Status"
        }
      });

      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setRawMaterials(response.data.data); // Ambil array dari properti 'data'
      } else {
        setRawMaterials([]); // Fallback ke array kosong jika data tidak valid
        console.warn("Invalid or empty response from API.");
      }
    } catch (error) {
      console.error("Error fetching raw materials:", error);
      setError("Failed to load raw materials. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch outlets for the dropdown
  const fetchOutlets = async () => {
    try {
      const response = await axios.get("/api/outlet");
      if (response.data && Array.isArray(response.data)) {
        setOutlets(response.data);
      } else {
        setOutlets([]); // Fallback to empty array if data is invalid
      }
    } catch (error) {
      console.error("Error fetching outlets:", error);
      setError("Failed to load outlets. Please try again later.");
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="container mx-auto p-4 relative">
      {/* Stok Masuk Button */}
      <Link to="/admin/storage-create">
        <button
          className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Stok Masuk
        </button>
      </Link>
      <h1 className="text-2xl font-bold mb-4">Raw Materials</h1>

      {/* Filters Section */}
      <div className="flex space-x-4 mb-4">
        {/* Outlet Dropdown */}
        <select
          className="border p-2 rounded w-64"
          value={selectedOutlet}
          onChange={(e) => setSelectedOutlet(e.target.value)}
        >
          <option value="">All Outlets</option>
          {outlets.map((outlet) => (
            <option key={outlet._id} value={outlet._id}>
              {outlet.name || "N/A"}
            </option>
          ))}
        </select>

        {/* Status Dropdown */}
        <select
          className="border p-2 rounded w-64"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Available">Available</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
          <option value="Overstocked">Overstocked</option>
          <option value="Expired">Expired</option>
        </select>

        {/* Filter Button */}
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={(e) => {
            e.preventDefault();
            fetchRawMaterials();
          }}
        >
          Filter
        </button>
      </div>

      {/* Loading Indicator */}
      {loading && <p className="text-center text-gray-600">Loading...</p>}

      {/* Error Message */}
      {error && <p className="text-red-500">{error}</p>}

      {/* Table Section */}
      {!loading && currentMaterials.length > 0 && (
        <table className="w-full border-collapse border border-gray-300 mt-4">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Name</th>
              <th className="border p-2">Category</th>
              <th className="border p-2">Quantity</th>
              <th className="border p-2">Unit</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Outlet</th>
            </tr>
          </thead>
          <tbody>
            {currentMaterials.map((material) => (
              <tr key={material._id} className="hover:bg-gray-100">
                <td className="border p-2">{material.name || "N/A"}</td>
                <td className="border p-2">{material.category?.name || "N/A"}</td>
                <td className="border p-2">
                  {material.quantity !== undefined ? material.quantity : "N/A"}
                </td>
                <td className="border p-2">{material.unit || "N/A"}</td>
                <td className="border p-2">{material.status || "N/A"}</td>
                <td className="border p-2">
                  {material.availableAt?.name || "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* No Data Message */}
      {!loading && currentMaterials.length === 0 && (
        <p className="text-center text-gray-500">No materials found.</p>
      )}

      {/* Pagination Section */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-gray-600">
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, rawMaterials.length)} of {rawMaterials.length} entries
        </p>
        <div>
          <button
            className={`px-4 py-2 mr-2 ${
              currentPage === 1 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"
            } rounded`}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <button
            className={`px-4 py-2 ${
              currentPage === totalPages ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"
            } rounded`}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default RawMaterialsPage;