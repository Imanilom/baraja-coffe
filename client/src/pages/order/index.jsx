import React, { useState } from "react";

const menuItems = [
  {
    id: 1,
    name: "Cappuccino",
    price: 30000,
    image: "https://placehold.co/600x400/png",
    toppings: [
      { id: 1, name: "Whipped Cream", price: 5000 },
      { id: 2, name: "Caramel Drizzle", price: 7000 },
    ],
    addons: [
      { id: 1, name: "Extra Shot", price: 10000 },
      { id: 2, name: "Oat Milk", price: 8000 },
    ],
  },
  {
    id: 2,
    name: "Latte",
    price: 25000,
    image: "https://placehold.co/600x400/png",
    toppings: [
      { id: 3, name: "Vanilla Syrup", price: 6000 },
      { id: 4, name: "Chocolate Chips", price: 5000 },
    ],
    addons: [
      { id: 3, name: "Soy Milk", price: 8000 },
      { id: 4, name: "Cinnamon Sprinkle", price: 4000 },
    ],
  },
];

const OrderPage = () => {
  const [cart, setCart] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddToCart = (menuItem, quantity, selectedToppings, selectedAddons) => {
    const toppingCost = selectedToppings.reduce((acc, topping) => acc + topping.price, 0);
    const addonCost = selectedAddons.reduce((acc, addon) => acc + addon.price, 0);

    const itemTotal = (menuItem.price + toppingCost + addonCost) * quantity;

    const newCartItem = {
      ...menuItem,
      quantity,
      selectedToppings,
      selectedAddons,
      itemTotal,
    };

    setCart((prevCart) => [...prevCart, newCartItem]);
  };

  const calculateGrandTotal = () => {
    return cart.reduce((acc, item) => acc + item.itemTotal, 0);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Menu Order</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((menuItem) => (
          <MenuItemCard key={menuItem.id} menuItem={menuItem} onAddToCart={handleAddToCart} />
        ))}
      </div>

      <h2 className="text-xl font-bold mt-8">Cart</h2>
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="mt-4">
          {cart.map((item, index) => (
            <div key={index} className="p-4 mb-4 border rounded shadow">
              <h3 className="font-bold">{item.name}</h3>
              <p>Quantity: {item.quantity}</p>
              <p>Toppings: {item.selectedToppings.map((t) => t.name).join(", ") || "None"}</p>
              <p>Add-ons: {item.selectedAddons.map((a) => a.name).join(", ") || "None"}</p>
              <p>Total: Rp{item.itemTotal.toLocaleString()}</p>
            </div>
          ))}
          <button
            className="mt-4 px-6 py-2 bg-green-500 text-white rounded hover:bg-green-700"
            onClick={() => setIsModalOpen(true)}
          >
            Grand Total: Rp{calculateGrandTotal().toLocaleString()}
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">Order Details</h3>
            {cart.map((item, index) => (
              <div key={index} className="mb-2">
                <p>
                  <span className="font-bold">{item.name}</span> x {item.quantity}
                </p>
                <p>Toppings: {item.selectedToppings.map((t) => t.name).join(", ") || "None"}</p>
                <p>Add-ons: {item.selectedAddons.map((a) => a.name).join(", ") || "None"}</p>
                <p>Item Total: Rp{item.itemTotal.toLocaleString()}</p>
              </div>
            ))}
            <button
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const MenuItemCard = ({ menuItem, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);

  const handleToppingChange = (topping) => {
    setSelectedToppings((prev) =>
      prev.includes(topping) ? prev.filter((t) => t !== topping) : [...prev, topping]
    );
  };

  const handleAddonChange = (addon) => {
    setSelectedAddons((prev) =>
      prev.includes(addon) ? prev.filter((a) => a !== addon) : [...prev, addon]
    );
  };

  return (
    <div className="p-4 border rounded shadow">
      <img src={menuItem.image} alt={menuItem.name} className="w-full h-40 object-cover rounded" />
      <h3 className="font-bold text-lg mt-2">{menuItem.name}</h3>
      <p>Price: Rp{menuItem.price.toLocaleString()}</p>

      <div className="mt-2">
        <label className="block font-bold">Quantity:</label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          className="mt-1 p-1 border rounded w-full"
        />
      </div>

      <div className="mt-2">
        <label className="block font-bold">Toppings:</label>
        <div className="grid grid-cols-2 gap-2">
          {menuItem.toppings.map((topping) => (
            <div key={topping.id} className="flex items-center">
              <input
                type="checkbox"
                value={topping.id}
                onChange={() => handleToppingChange(topping)}
                className="mr-2"
              />
              <span>{topping.name} (Rp{topping.price.toLocaleString()})</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2">
        <label className="block font-bold">Add-ons:</label>
        <div className="grid grid-cols-2 gap-2">
          {menuItem.addons.map((addon) => (
            <div key={addon.id} className="flex items-center">
              <input
                type="checkbox"
                value={addon.id}
                onChange={() => handleAddonChange(addon)}
                className="mr-2"
              />
              <span>{addon.name} (Rp{addon.price.toLocaleString()})</span>
            </div>
          ))}
        </div>
      </div>

      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 w-full"
        onClick={() => onAddToCart(menuItem, quantity, selectedToppings, selectedAddons)}
      >
        Add to Cart
      </button>
    </div>
  );
};

export default OrderPage;
