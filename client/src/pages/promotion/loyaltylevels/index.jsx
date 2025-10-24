import { useState, useEffect } from "react";
import axios from "axios";
import { Star, Trophy, Plus, Edit2, Trash2, X, Award, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";

const initialForm = { name: "", requiredPoints: 0, description: "" };

export default function LoyaltyLevelManager() {
  const [loyaltyLevels, setLoyaltyLevels] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

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
      setShowForm(false);
      fetchLevels();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (level) => {
    setFormData(level);
    setEditingId(level._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this loyalty level?")) {
      try {
        await axios.delete(`/api/promotion/loyalty-levels/${id}`);
        fetchLevels();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCancel = () => {
    setFormData(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const getLevelIcon = (index) => {
    const icons = [Star, Trophy, Award, TrendingUp];
    const Icon = icons[index % icons.length];
    return <Icon size={24} />;
  };

  const getLevelColor = (index) => {
    const colors = [
      { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "text-blue-600" },
      { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", icon: "text-purple-600" },
      { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", icon: "text-yellow-600" },
      { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: "text-green-600" }
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="p-6">
      <div className="flex gap-2 items-center text-xl text-green-900 font-semibold">
        <Link to="/admin/promotion">Promo</Link>
        <FaChevronRight />
        <span>Level Kesetiaan</span>
      </div>

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              {showForm ? <X size={20} /> : <Plus size={20} />}
              {showForm ? "Close Form" : "Add New Level"}
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Award className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Levels</p>
                <p className="text-3xl font-bold text-gray-800">{loyaltyLevels.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Star className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Highest Points</p>
                <p className="text-3xl font-bold text-gray-800">
                  {loyaltyLevels.length > 0 ? Math.max(...loyaltyLevels.map(l => l.requiredPoints)).toLocaleString() : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <TrendingUp className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Entry Level</p>
                <p className="text-3xl font-bold text-gray-800">
                  {loyaltyLevels.length > 0 ? Math.min(...loyaltyLevels.map(l => l.requiredPoints)).toLocaleString() : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-purple-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              {editingId ? <Edit2 className="text-purple-600" size={28} /> : <Plus className="text-purple-600" size={28} />}
              {editingId ? "Edit Loyalty Level" : "Create New Loyalty Level"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Level Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Bronze, Silver, Gold"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Required Points *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 1000"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
                    value={formData.requiredPoints}
                    onChange={(e) => setFormData({ ...formData, requiredPoints: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Describe the benefits and perks of this level..."
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition h-32 resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-semibold"
                >
                  {editingId ? "Update Level" : "Create Level"}
                </button>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loyalty Levels Grid */}
        {/* <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Active Loyalty Levels</h2>

          {loyaltyLevels.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <Trophy className="mx-auto mb-4 text-gray-300" size={64} />
              <p className="text-gray-500 text-lg mb-2">No loyalty levels found</p>
              <p className="text-gray-400 mb-6">Create your first loyalty level to get started</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Add First Level
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loyaltyLevels
                .sort((a, b) => a.requiredPoints - b.requiredPoints)
                .map((level, index) => {
                  const colors = getLevelColor(index);
                  return (
                    <div
                      key={level._id}
                      className={`${colors.bg} border-2 ${colors.border} rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden`}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`${colors.icon} bg-white p-3 rounded-lg shadow-sm`}>
                              {getLevelIcon(index)}
                            </div>
                            <div>
                              <h3 className={`text-xl font-bold ${colors.text}`}>
                                {level.name}
                              </h3>
                              <p className="text-sm text-gray-600">Level {index + 1}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className={`text-3xl font-bold ${colors.text}`}>
                              {level.requiredPoints.toLocaleString()}
                            </span>
                            <span className="text-gray-600">points</span>
                          </div>
                          <div className="bg-white/60 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colors.text.replace('text-', 'bg-')}`}
                              style={{ width: `${Math.min((level.requiredPoints / Math.max(...loyaltyLevels.map(l => l.requiredPoints))) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        {level.description && (
                          <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                            {level.description}
                          </p>
                        )}

                        <div className="flex gap-2 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleEdit(level)}
                            className="flex-1 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition font-semibold flex items-center justify-center gap-2"
                          >
                            <Edit2 size={16} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(level._id)}
                            className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-semibold flex items-center justify-center gap-2"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div> */}

        {/* Table View for Desktop */}
        {loyaltyLevels.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Detailed View</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Level</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Required Points</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loyaltyLevels
                    .sort((a, b) => a.requiredPoints - b.requiredPoints)
                    .map((level, index) => {
                      const colors = getLevelColor(index);
                      return (
                        <tr key={level._id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div className={`${colors.icon}`}>
                              {getLevelIcon(index)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-gray-800">{level.name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-bold ${colors.text}`}>
                              {level.requiredPoints.toLocaleString()} pts
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-md">
                            <span className="text-gray-600 text-sm">
                              {level.description || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(level)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(level._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}