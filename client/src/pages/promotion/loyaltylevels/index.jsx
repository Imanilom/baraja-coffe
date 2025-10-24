import { useState, useEffect } from "react";
import axios from "axios";

const initialForm = { name: "", requiredPoints: 0, description: "" };

export default function LoyaltyLevelManager() {
  const [loyaltyLevels, setLoyaltyLevels] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      const res = await axios.get("/api/promotion/loyalty-levels");
      setLoyaltyLevels(Array.isArray(res.data.data) ? res.data.data : []);

    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/promotion/loyalty-levels/${editingId}`, formData);
      } else {
        await axios.post("/api/promotion/loyalty-levels", formData);
      }
      setFormData(initialForm);
      setEditingId(null);
      fetchLevels();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (level) => {
    setFormData(level);
    setEditingId(level._id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/promotion/loyalty-levels/${id}`);
      fetchLevels();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Loyalty Level Management</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 shadow rounded mb-6">
        <input
          type="text"
          placeholder="Level Name"
          className="w-full p-2 border rounded"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Required Points"
          className="w-full p-2 border rounded"
          value={formData.requiredPoints}
          onChange={(e) => setFormData({ ...formData, requiredPoints: e.target.value })}
          required
        />
        <textarea
          placeholder="Description"
          className="w-full p-2 border rounded"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          {editingId ? "Update Level" : "Add Level"}
        </button>
        {editingId && (
          <button
            type="button"
            className="ml-2 bg-gray-500 text-white px-4 py-2 rounded"
            onClick={() => {
              setFormData(initialForm);
              setEditingId(null);
            }}
          >
            Cancel
          </button>
        )}
      </form>

      <div className="bg-white shadow rounded">
        <table className="w-full text-left border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border">Name</th>
              <th className="p-3 border">Required Points</th>
              <th className="p-3 border">Description</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loyaltyLevels.map((level) => (
              <tr key={level._id}>
                <td className="p-3 border">{level.name}</td>
                <td className="p-3 border">{level.requiredPoints}</td>
                <td className="p-3 border">{level.description}</td>
                <td className="p-3 border space-x-2">
                  <button
                    onClick={() => handleEdit(level)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(level._id)}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {loyaltyLevels.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center p-4 text-gray-500">
                  No loyalty levels found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
