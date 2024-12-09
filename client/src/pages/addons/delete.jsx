import React from "react";
import axios from "axios";

const DeleteAddon = ({ id, fetchAddons }) => {
  const handleDelete = async () => {
    try {
      await axios.delete(`/api/addons/${id}`);
      fetchAddons();
    } catch (error) {
      console.error("Error deleting addon:", error);
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

export default DeleteAddon;
