import React, { useState, useEffect } from "react";
import axios from "axios";
import CreatePromotion from "./create";
import UpdatePromotion from "./update";

const PromotionManagement = () => {
  const [promotions, setPromotions] = useState([]);
  const [editingPromotion, setEditingPromotion] = useState(null);

  const fetchPromotions = async () => {
    try {
      const response = await axios.get("/api/promotion");
      setPromotions(response.data);
      
    } catch (error) {
      console.error("Error fetching promotions:", error);
    }
  };

  const deletePromotion = async (id) => {
    if (!window.confirm("Are you sure you want to delete this promotion?")) return;
    try {
      await axios.delete(`/api/promotion/${id}`);
      fetchPromotions();
    } catch (error) {
      console.error("Error deleting promotion:", error);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Promotion Management</h1>
      <CreatePromotion fetchPromotions={fetchPromotions} />

      <table className="w-full border-collapse border border-gray-300 mt-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2">Title</th>
            <th className="border border-gray-300 px-4 py-2">Discount</th>
            <th className="border border-gray-300 px-4 py-2">Date Range</th>
            <th className="border border-gray-300 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {promotions.map((promotion) => (
            <tr key={promotion._id} className="text-center">
              <td className="border border-gray-300 px-4 py-2">{promotion.title}</td>
              <td className="border border-gray-300 px-4 py-2">{promotion.discountPercentage}%</td>
              <td className="border border-gray-300 px-4 py-2">
                {new Date(promotion.startDate).toLocaleDateString()} -{" "}
                {new Date(promotion.endDate).toLocaleDateString()}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <button
                  onClick={() => setEditingPromotion(promotion)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => deletePromotion(promotion._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingPromotion && (
        <UpdatePromotion
          promotion={editingPromotion}
          onClose={() => setEditingPromotion(null)}
          fetchPromotions={fetchPromotions}
        />
      )}
    </div>
  );
};

export default PromotionManagement;
