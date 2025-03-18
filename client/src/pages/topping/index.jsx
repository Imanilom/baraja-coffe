import React, { useEffect, useState } from "react";
import axios from "axios";
import CreateTopping from "./create";
import UpdateTopping from "./update";
import DeleteTopping from "./delete";

const ToppingManagement = () => {
  const [toppings, setToppings] = useState([]);
  const [editingTopping, setEditingTopping] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchToppings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("/api/menu/toppings");
      // Access nested data
      const toppingsArray = response.data?.data;
      if (Array.isArray(toppingsArray)) {
        setToppings(toppingsArray);
      } else {
        console.error("Unexpected API response format:", response.data);
        setToppings([]);
      }
    } catch (err) {
      console.error("Error fetching toppings:", err);
      setError("Failed to load toppings. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchToppings();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Topping Management</h1>
      <a href="/topping-create">
      <button className="bg-blue-500 text-white px-2 py-1 rounded mr-2">Add Topping </button>
      </a>
    

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}

      {/* Loading Indicator */}
      {loading ? (
        <div className="text-center text-gray-700">Loading...</div>
      ) : (
        <table className="min-w-full bg-white shadow-md rounded mt-6">
          <thead>
            <tr>
              <th className="py-2 px-4 bg-gray-200 text-gray-700">Name</th>
              <th className="py-2 px-4 bg-gray-200 text-gray-700">Category</th>
              <th className="py-2 px-4 bg-gray-200 text-gray-700">Price</th>
              <th className="py-2 px-4 bg-gray-200 text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {toppings.length > 0 ? (
              toppings.map((topping) => (
                <tr key={topping._id} className="border-t">
                  <td className="py-2 px-4">{topping.name}</td>
                  <td className="py-2 px-4">{topping.category}</td>
                  <td className="py-2 px-4">IDR {topping.price}</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => setEditingTopping(topping)}
                      className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                    >
                      Edit
                    </button>
                    <DeleteTopping
                      id={topping._id}
                      fetchToppings={fetchToppings}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="3"
                  className="py-4 px-4 text-center text-gray-600"
                >
                  No toppings available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

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
