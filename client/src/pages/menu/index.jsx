import React, { useEffect, useState } from "react";
import axios from "axios";
import CreateMenu from "./create";
import UpdateMenu from "./update";

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [editingMenu, setEditingMenu] = useState(null);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get("/api/menu");
      setMenuItems(response.data);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  const deleteMenuItem = async (id) => {
    try {
      await axios.delete(`/api/menu/${id}`);
      fetchMenuItems();
    } catch (error) {
      console.error("Error deleting menu item:", error);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Menu Items</h1>

      <button
        onClick={() => setEditingMenu("create")}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Add Menu Item
      </button>

      {menuItems.map((item) => (
        <div key={item._id} className="border p-4 mb-4">
          <h2 className="text-lg font-bold">{item.name}</h2>
          <p>{item.description}</p>
          <p>Price: ${item.price}</p>
          <p>Category: {item.category}</p>
          <p>Stock: {item.stock}</p>
          <p>
            Toppings:{" "}
            {item.toppings.map((topping) => (
              <span key={topping._id}>{topping.name}, </span>
            ))}
          </p>
          <p>
            Add-ons:{" "}
            {item.addOns.map((addOn) => (
              <span key={addOn._id}>{addOn.name}, </span>
            ))}
          </p>
          <button
            onClick={() => setEditingMenu(item)}
            className="bg-yellow-500 text-white px-4 py-2 rounded mr-2"
          >
            Edit
          </button>
          <button
            onClick={() => deleteMenuItem(item._id)}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Delete
          </button>
        </div>
      ))}

      {editingMenu === "create" && (
        <CreateMenu fetchMenuItems={fetchMenuItems} onCancel={() => setEditingMenu(null)} />
      )}

      {editingMenu && editingMenu !== "create" && (
        <UpdateMenu
          menuItem={editingMenu}
          fetchMenuItems={fetchMenuItems}
          onCancel={() => setEditingMenu(null)}
        />
      )}
    </div>
  );
};

export default Menu;
