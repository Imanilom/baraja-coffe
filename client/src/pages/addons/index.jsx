import React, { useEffect, useState } from "react";
import axios from "axios";
import CreateAddon from "./create";
import UpdateAddon from "./update";
import DeleteAddon from "./delete";

const AddonManagement = () => {
  const [addons, setAddons] = useState([]);
  const [editingAddon, setEditingAddon] = useState(null);

  const fetchAddons = async () => {
    try {
      const response = await axios.get("/api/addons");
      setAddons(response.data);
    } catch (error) {
      console.error("Error fetching addons:", error);
    }
  };

  useEffect(() => {
    fetchAddons();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Add-On Management</h1>

      {/* Create Addon Form */}
      <CreateAddon fetchAddons={fetchAddons} />

      {/* Addon Table */}
      <table className="min-w-full bg-white shadow-md rounded mt-6">
        <thead>
          <tr>
            <th className="py-2 px-4 bg-gray-200 text-gray-700">Name</th>
            <th className="py-2 px-4 bg-gray-200 text-gray-700">Type</th>
            <th className="py-2 px-4 bg-gray-200 text-gray-700">Options</th>
            <th className="py-2 px-4 bg-gray-200 text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {addons.map((addon) => (
            <tr key={addon._id} className="border-t">
              <td className="py-2 px-4">{addon.name}</td>
              <td className="py-2 px-4">{addon.type}</td>
              <td className="py-2 px-4">
                {addon.options.map((opt, index) => (
                  <div key={index}>
                    {opt.label} - ${opt.price}
                  </div>
                ))}
              </td>
              <td className="py-2 px-4">
                <button
                  onClick={() => setEditingAddon(addon)}
                  className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                >
                  Edit
                </button>
                <DeleteAddon id={addon._id} fetchAddons={fetchAddons} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Update Addon Form */}
      {editingAddon && (
        <UpdateAddon
          addon={editingAddon}
          fetchAddons={fetchAddons}
          onCancel={() => setEditingAddon(null)}
        />
      )}
    </div>
  );
};

export default AddonManagement;
