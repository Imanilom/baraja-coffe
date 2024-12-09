import React, { useEffect, useState } from "react";
import axios from "axios";
import CreateTopping from "./create";
import UpdateTopping from "./update";
import DeleteTopping from "./delete";

const ToppingManagement = () => {
  const [toppings, setToppings] = useState([]);
  const [editingTopping, setEditingTopping] = useState(null);

  const fetchToppings = async () => {
    try {
      const response = await axios.get("/api/toppings");
      setToppings(response.data);
    } catch (error) {
      console.error("Error fetching toppings:", error);
    }
  };

  useEffect(() => {
    fetchToppings();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Topping Management</h1>

      {/* Create Topping Form */}
      <CreateTopping fetchToppings={fetchToppings} />

      {/* Topping Table */}
      <table className="min-w-full bg-white shadow-md rounded mt-6">
        <thead>
          <tr>
            <th className="py-2 px-4 bg-gray-200 text-gray-700">Name</th>
            <th className="py-2 px-4 bg-gray-200 text-gray-700">Price</th>
            <th className="py-2 px-4 bg-gray-200 text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {toppings.map((topping) => (
            <tr key={topping._id} className="border-t">
              <td className="py-2 px-4">{topping.name}</td>
              <td className="py-2 px-4">{topping.price}</td>
              <td className="py-2 px-4">
                <button
                  onClick={() => setEditingTopping(topping)}
                  className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                >
                  Edit
                </button>
                <DeleteTopping id={topping._id} fetchToppings={fetchToppings} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Update Topping Form */}
      {editingTopping && (
        <UpdateTopping
          topping={editingTopping}
          fetchToppings={fetchToppings}
          onCancel={() => setEditingTopping(null)}
        />
      )}
    </div>
  );
};

export default ToppingManagement;