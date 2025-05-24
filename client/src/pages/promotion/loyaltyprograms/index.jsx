import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const LoyaltyIndex = () => {
  const [programs, setPrograms] = useState([]);

  const fetchPrograms = async () => {
    const res = await axios.get('/api/promotion/loyalty');
    setPrograms(Array.isArray(res.data.data) ? res.data.data : []);
  };

  const deleteProgram = async (id) => {
    if (confirm('Are you sure you want to delete this program?')) {
      await axios.delete(`/api/promotion/loyalty/${id}`);
      fetchPrograms();
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Loyalty Programs</h1>
        <Link to="/loyalty/create" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Create</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-md">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Points/Rp</th>
              <th className="text-left px-4 py-2">Active</th>
              <th className="text-left px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((p) => (
              <tr key={p._id} className="border-t">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">{p.consumertype}</td>
                <td className="px-4 py-2">{p.pointsPerRp}</td>
                <td className="px-4 py-2">{p.isActive ? 'Yes' : 'No'}</td>
                <td className="px-4 py-2 flex gap-2">
                  <Link to={`/admin/loyalty/edit/${p._id}`} className="text-blue-600 hover:underline">Edit</Link>
                  <button onClick={() => deleteProgram(p._id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LoyaltyIndex;
