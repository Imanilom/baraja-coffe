import React from "react";
import axios from "axios";

const DeleteTopping = ({ id, fetchToppings }) => {
  const handleDelete = async () => {
    try {
      await axios.delete(`/api/menu/toppings/${id}`);
      fetchToppings();
    } catch (error) {
      console.error("Error deleting topping:", error);
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="bg-red-500 text-white px-2 py-1 rounded"
    >
      Delete
    </button>
  );
};

export default DeleteTopping;
