import React from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const DeleteMenu = () => {
  const { id } = useParams();

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/menu-items/${id}`);
      alert('Menu deleted successfully');
    } catch (error) {
      console.error(error);
      alert('Failed to delete menu');
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-bold mb-4">Delete Menu</h2>
      <p>Are you sure you want to delete this menu item?</p>
      <button
        onClick={handleDelete}
        className="mt-4 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
      >
        Delete
      </button>
    </div>
  );
};

export default DeleteMenu;
