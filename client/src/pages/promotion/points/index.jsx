import { useState, useEffect } from "react";
import axios from "axios";
import { FaBell, FaChevronRight, FaCut, FaSearch, FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";
import Header from "../../admin/header";

const initialForm = { name: "", requiredPoints: 0, description: "" };

export default function PointManagement() {
  const [loyaltyLevels, setLoyaltyLevels] = useState([]);
  const [outlets, setOutlet] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [tempSearch, setTempSearch] = useState("");
  const [selectedOption, setSelectedOption] = useState("Per Outlet");

  const options = ["Semua Outlet", "Per Outlet", "Tidak Aktif"];

  const [filters, setFilters] = useState({
    outlet: "",
    isActive: ""
  });

  useEffect(() => {
    fetchLevels();
    fetchOutlet();
  }, []);

  const fetchLevels = async () => {
    try {
      const res = await axios.get("/api/promotion/loyalty-levels");
      setLoyaltyLevels(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOutlet = async () => {
    try {
      const res = await axios.get("/api/outlet");
      setOutlet(res.data.data);
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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
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
    <div className="w-full">
      {/* Breadcrumb */}
      <div className="px-3 py-3 flex justify-between items-center border-b">
        <div className="flex items-center space-x-2">
          <FaCut size={21} className="text-gray-500 inline-block" />
          <Link to="/admin/promotion" className="text-[15px] text-gray-500">Promo</Link>
          <FaChevronRight size={21} className="text-gray-500 inline-block" />
          <p className="text-[15px] text-gray-500">Poin</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="px-[15px] pb-[15px]">
        <div className="my-[13px] py-[10px] px-[15px] grid grid-cols-2 gap-[10px] items-end rounded bg-slate-50 shadow-slate-200 shadow-md">
          <div className="relative">
            <label className="text-[13px] mb-1 text-gray-500">Cari Outlet</label>
            <div className="relative">
              <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Outlet"
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
                className="text-[13px] border py-[6px] pl-[30px] pr-[25px] rounded w-full"
              />
            </div>
          </div>
          <div className="relative">
            <label className="text-[13px] mb-1 text-gray-500">Status :</label>
            <select
              name="isActive"
              value={filters.isActive}
              onChange={handleFilterChange}
              className="w-full text-[13px] text-gray-500 border py-[6px] pr-[25px] pl-[12px] rounded text-left relative after:content-['▼'] after:absolute after:right-2 after:top-1/2 after:-translate-y-1/2 after:text-[10px]"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loyalty Levels Table */}
      <div className="p-4">
        <div className="bg-white shadow rounded overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-3 uppercase text-[14px] text-[#999999] font-semibold">Level Name</th>
                <th className="p-3 uppercase text-[14px] text-[#999999] font-semibold">Description</th>
                <th className="p-3 uppercase text-[14px] text-[#999999] font-semibold text-right">Required Points</th>
                <th className="p-3 uppercase text-[14px] text-[#999999] font-semibold text-right">Points Per Currency</th>
                <th className="p-3 uppercase text-[14px] text-[#999999] font-semibold text-right">Currency Unit</th>
                <th className="p-3 uppercase text-[14px] text-[#999999] font-semibold text-right">Level Up Bonus</th>
                <th className="p-3 uppercase text-[14px] text-[#999999] font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loyaltyLevels.map((level, index) => (
                <tr
                  key={level._id}
                  className={`border-b hover:bg-gray-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <td className="p-3">
                    <span className="font-medium capitalize text-gray-800">{level.name}</span>
                  </td>
                  <td className="p-3 text-gray-600 text-[13px]">{level.description}</td>
                  <td className="p-3 text-right font-semibold text-gray-800">
                    {level.requiredPoints.toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 text-right text-gray-700">{level.pointsPerCurrency}</td>
                  <td className="p-3 text-right text-gray-700">
                    Rp {level.currencyUnit.toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 text-right text-gray-700">{level.levelUpBonusPoints}</td>
                  <td className="p-3">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(level)}
                        className="px-3 py-1.5 bg-yellow-500 text-white text-[13px] rounded hover:bg-yellow-600 transition font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(level._id)}
                        className="px-3 py-1.5 bg-red-600 text-white text-[13px] rounded hover:bg-red-700 transition font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loyaltyLevels.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FaUser className="text-4xl text-gray-300" />
                      <p className="text-[14px]">No loyalty levels found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}