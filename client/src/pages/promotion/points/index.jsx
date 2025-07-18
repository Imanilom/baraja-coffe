import { useState, useEffect } from "react";
import axios from "axios";
import { FaBell, FaChevronRight, FaCut, FaSearch, FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";

const initialForm = { name: "", requiredPoints: 0, description: "" };

export default function PointManagement() {
  const [loyaltyLevels, setLoyaltyLevels] = useState([]);
  const [outlets, setOutlet] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [tempSearch, setTempSearch] = useState("");

  const [selectedOption, setSelectedOption] = useState("Per Outlet"); // Default aktif

  const options = ["Semua Outlet", "Per Outlet", "Tidak Aktif"];

  useEffect(() => {
    fetchLevels();
    fetchOutlet();
  }, []);

  const [filters, setFilters] = useState({
    outlet: "",
    isActive: ""
  });

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
  }

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
      <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
        <FaBell size={23} className="text-gray-400" />
        <span className="text-[14px]">Hi Baraja</span>
        <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
          <FaUser size={30} />
        </Link>
      </div>

      {/* Breadcrumb */}
      <div className="px-3 py-3 flex justify-between items-center border-b">
        <div className="flex items-center space-x-2">
          <FaCut size={21} className="text-gray-500 inline-block" />
          <p className="text-[15px] text-gray-500">Promo</p>
          <FaChevronRight size={21} className="text-gray-500 inline-block" />
          <p className="text-[15px] text-gray-500">Poin</p>
        </div>
      </div>
      {/* <h1 className="text-[14px] font-bold mb-4 uppercase">Pengaturan Poin</h1> */}

      {/* <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 shadow rounded mb-6">
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
      </form> */}

      <div className="flex justify-between items-center text-[14px] text-[#999999] px-4 py-4">
        <h4 className="uppercase font-semibold">Pengaturan saat ini</h4>
        <div className="flex border border-[#999999] rounded font-semibold">
          {options.map((option, index) => (
            <button
              key={option}
              onClick={() => setSelectedOption(option)}
              className={`py-2 px-3 transition-colors duration-200 ${selectedOption === option
                ? "bg-[#005429] text-white"
                : "text-[#999999] hover:bg-[#005429] hover:text-white"
                } ${index == 0 ? "rounded-l border-[#999999]" : ""
                } ${index == 2 ? "rounded-r border-[#999999]" : ""
                }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

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

      <div className="p-4">
        <div className="bg-white shadow rounded">
          <table className="w-full text-left">
            <thead className="border-b">
              <tr>
                <th className="p-3 uppercase text-[14px] text-[#999999]">outlet</th>
                <th className="p-3 uppercase text-[14px] text-[#999999] text-right">poin registrasi</th>
                <th className="p-3 uppercase text-[14px] text-[#999999] text-right">nominal (Rp)</th>
                <th className="p-3 uppercase text-[14px] text-[#999999] text-right">poin transaksi</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {outlets.map((outlet) => (
                <tr key={outlet._id}>
                  <td className="p-3">{outlet.name}</td>
                  <td className="p-3 text-right">0</td>
                  <td className="p-3 text-right">0</td>
                  <td className="p-3 text-right">0</td>
                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => handleEdit(outlet)}
                      className="px-3 py-1 bg-yellow-500 text-white rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(outlet._id)}
                      className="px-3 py-1 bg-red-600 text-white rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {outlets.length === 0 && (
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
      {/* <div className="p-4">
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
      </div> */}
    </div>
  );
}
