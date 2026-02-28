import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Save, ArrowLeft, Award, Users, Gift, Percent, CheckCircle2 } from "lucide-react";

const UpdateLoyaltyProgram = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    consumerType: "",
    pointsPerRp: 100,
    registrationPoints: 50,
    firstTransactionPoints: 100,
    pointsToDiscountRatio: 100,
    discountValuePerPoint: 50,
    isActive: true,
  });

  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [programRes, levelsRes] = await Promise.all([
          axios.get(`/api/promotion/loyalty/${id}`),
          axios.get(`/api/promotion/loyalty-levels`),
        ]);

        setForm(programRes.data.data);
        setLevels(levelsRes.data.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/promotion/loyalty/${id}`, form);
      console.log(form);
      alert("Loyalty program updated successfully");
      navigate("/admin/loyalty");
    } catch (err) {
      console.error("Failed to update:", err);
      alert("Failed to update loyalty program.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading program details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/admin/loyalty")}
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors mb-4 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Programs</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-xl shadow-lg">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Loyalty Program</h1>
              <p className="text-gray-600 mt-1">Update program details and settings</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Basic Information Section */}
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-indigo-600" />
                </div>
                Basic Information
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Program Name *
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                    placeholder="Enter program name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none resize-none"
                    placeholder="Describe your loyalty program"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Consumer Type *
                  </label>
                  <select
                    name="consumerType"
                    value={form.consumerType}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none appearance-none bg-white cursor-pointer"
                    required
                  >
                    <option value="">Select Consumer Type</option>
                    {levels.map((level) => (
                      <option key={level._id} value={level.name}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Points Configuration Section */}
            <div className="p-8 bg-gradient-to-br from-purple-50 to-indigo-50 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Gift className="w-5 h-5 text-purple-600" />
                </div>
                Points & Rewards Configuration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Points per Rp
                  </label>
                  <input
                    type="number"
                    name="pointsPerRp"
                    value={form.pointsPerRp}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">Points earned per rupiah spent</p>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Registration Points
                  </label>
                  <input
                    type="number"
                    name="registrationPoints"
                    value={form.registrationPoints}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">Bonus points on registration</p>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Transaction Points
                  </label>
                  <input
                    type="number"
                    name="firstTransactionPoints"
                    value={form.firstTransactionPoints}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">Bonus points on first purchase</p>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-purple-600" />
                    Points to Discount Ratio
                  </label>
                  <input
                    type="number"
                    name="pointsToDiscountRatio"
                    value={form.pointsToDiscountRatio}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">Points needed for discount</p>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-100 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Discount Value per Point
                  </label>
                  <input
                    type="number"
                    name="discountValuePerPoint"
                    value={form.discountValuePerPoint}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">Discount amount per loyalty point</p>
                </div>
              </div>
            </div>

            {/* Status & Actions Section */}
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={form.isActive}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-600 peer-checked:to-purple-600"></div>
                    </label>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">Program Status</span>
                        {form.isActive && (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {form.isActive ? "Active and visible to users" : "Inactive and hidden"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate("/admin/loyalty")}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Update Program
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateLoyaltyProgram;