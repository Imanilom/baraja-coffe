import React from "react";
import axios from "axios";

const DeleteMenu = ({ id, fetchMenus }) => {
    const handleDelete = async () => {
        try {
            await axios.delete(`/api/menu/menu-items/${id}`);
            fetchMenus();
        } catch (error) {
            console.error("Error deleting menu:", error);
        }
    };

    return (
        <button
            onClick={handleDelete}
        >
            Delete
        </button>
    );
};

export default DeleteMenu;
