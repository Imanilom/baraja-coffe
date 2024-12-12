import React, { useState, useEffect } from "react";
import axios from "axios";
import CreateVoucher from "./create";
import UpdateVoucher from "./update";

const VoucherManagement = () => {
  const [vouchers, setVouchers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);

  const fetchVouchers = async () => {
    try {
      const response = await axios.get("/api/vouchers");
      setVouchers(response.data);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
    }
  };

  const handleDelete = async (id) => {
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Voucher Management</h1>
      <button
        onClick={() => setShowCreateModal(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Create Voucher
      </button>
      <table className="w-full mt-4 border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Code</th>
            <th className="border p-2">Discount</th>
            <th className="border p-2">Minimum Order</th>
            <th className="border p-2">Start Date</th>
            <th className="border p-2">End Date</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {vouchers.map((voucher) => (
            <tr key={voucher._id} className="text-center">
              <td className="border p-2">{voucher.code}</td>
              <td className="border p-2">{voucher.discountAmount}</td>
              <td className="border p-2">{voucher.minimumOrder}</td>
              <td className="border p-2">
                {new Date(voucher.startDate).toLocaleDateString()}
              </td>
              <td className="border p-2">
                {new Date(voucher.endDate).toLocaleDateString()}
              </td>
              <td className="border p-2">
                <button
                  onClick={() => setEditingVoucher(voucher)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(voucher._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showCreateModal && (
        <CreateVoucher
          onClose={() => setShowCreateModal(false)}
          fetchVouchers={fetchVouchers}
        />
      )}

      {editingVoucher && (
        <UpdateVoucher
          voucher={editingVoucher}
          onClose={() => setEditingVoucher(null)}
          fetchVouchers={fetchVouchers}
        />
      )}
    </div>
  );
};

export default VoucherManagement;
