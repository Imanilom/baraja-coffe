import React, { useEffect, useState } from "react";
import axios from "axios";
import CreateVoucher from "./create";

const Voucher = () => {
  const [vouchers, setVouchers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const itemsPerPage = 5; // Jumlah voucher per halaman

  // Fetch daftar voucher
  const fetchVouchers = async () => {
    try {
      const response = await axios.get("/api/vouchers");
      setVouchers(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
    }
  };

  // Hapus voucher
  const deleteVoucher = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this voucher?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`/api/vouchers/${id}`);
      fetchVouchers();
    } catch (error) {
      console.error("Error deleting voucher:", error);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVouchers = vouchers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(vouchers.length / itemsPerPage);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Vouchers</h1>

      {/* Tombol untuk membuat voucher */}
      <button
        onClick={() => setIsCreating(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Add Voucher
      </button>

      {/* Komponen CreateVoucher */}
      {isCreating && (
        <CreateVoucher
          fetchVouchers={fetchVouchers}
          onClose={() => setIsCreating(false)}
        />
      )}

      {/* Tabel daftar voucher */}
      <div className="overflow-x-auto">
        <table className="table-auto w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Code</th>
              <th className="border px-4 py-2">Description</th>
              <th className="border px-4 py-2">Discount</th>
              <th className="border px-4 py-2">Min Order</th>
              <th className="border px-4 py-2">Start Date</th>
              <th className="border px-4 py-2">End Date</th>
              <th className="border px-4 py-2">Max Claims</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentVouchers.map((voucher) => (
              <tr key={voucher._id}>
                <td className="border px-4 py-2">{voucher.code}</td>
                <td className="border px-4 py-2">{voucher.description}</td>
                <td className="border px-4 py-2">${voucher.discountAmount}</td>
                <td className="border px-4 py-2">${voucher.minimumOrder}</td>
                <td className="border px-4 py-2">{voucher.startDate}</td>
                <td className="border px-4 py-2">{voucher.endDate}</td>
                <td className="border px-4 py-2">{voucher.maxClaims}</td>
                <td className="border px-4 py-2">
                  <button
                    onClick={() => deleteVoucher(voucher._id)}
                    className="bg-red-500 text-white px-4 py-2 rounded mr-2"
                  >
                    Delete
                  </button>
                  <button
                    className="bg-yellow-500 text-white px-4 py-2 rounded"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-4 py-2 mx-1 rounded ${
              currentPage === i + 1
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Voucher;
