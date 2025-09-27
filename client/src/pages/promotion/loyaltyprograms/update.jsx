import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const UpdateLoyaltyProgram = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    consumertype: "",
    pointsPerRp: 100,
    registrationPoints: 50,
    firstTransactionPoints: 100,
    pointsToDiscountRatio: 100,
    discountValuePerPoint: 50,
    isActive: true,
  });

  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState([]);

  // Fetch loyalty program by ID
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
      alert("Loyalty program updated successfully");
      navigate("/admin/loyalty");
    } catch (err) {
      console.error("Failed to update:", err);
      alert("Failed to update loyalty program.");
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded mt-10">
      <h1 className="text-2xl font-semibold mb-6">Edit Loyalty Program</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium">Consumer Type</label>
          <select
            name="consumertype"
            value={form.consumertype}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          >
            <option value="">-- Select Consumer Type --</option>
            {levels.map((level) => (
              <option key={level._id} value={level.name}>
                {level.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">Points per Rp</label>
            <input
              type="number"
              name="pointsPerRp"
              value={form.pointsPerRp}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium">Registration Points</label>
            <input
              type="number"
              name="registrationPoints"
              value={form.registrationPoints}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium">First Transaction Points</label>
            <input
              type="number"
              name="firstTransactionPoints"
              value={form.firstTransactionPoints}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium">Points to Discount Ratio</label>
            <input
              type="number"
              name="pointsToDiscountRatio"
              value={form.pointsToDiscountRatio}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium">Discount Value per Point</label>
            <input
              type="number"
              name="discountValuePerPoint"
              value={form.discountValuePerPoint}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="flex items-center mt-4">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={handleChange}
            className="mr-2"
          />
          <label className="font-medium">Active</label>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Update Program
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateLoyaltyProgram;
