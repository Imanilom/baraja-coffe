import React, { useState } from "react";

const outlets = [
  { id: 1, name: "Outlet 1", image: "https://placehold.co/300x200/png" },
  { id: 2, name: "Outlet 2", image: "https://placehold.co/300x200/png" },
  { id: 3, name: "Outlet 3", image: "https://placehold.co/300x200/png" },
];

const menuItems = [
  {
    id: 1,
    name: "Cappuccino",
    price: 30000,
    category: "Coffee",
    image: "https://placehold.co/600x400/png",
    toppings: [
      { id: 1, name: "Whipped Cream", price: 8000 },
      { id: 2, name: "Caramel Drizzle", price: 9000 },
    ],
    addons: [
      { id: 1, name: "Extra Shot", price: 10000 },
      { id: 2, name: "Oat Milk", price: 8000 },
    ],
  },
  {
    id: 2,
    name: "Latte",
    price: 28000,
    category: "Coffee",
    image: "https://placehold.co/600x400/png",
    toppings: [
      { id: 3, name: "Vanilla Syrup", price: 6000 },
      { id: 4, name: "Chocolate Chips", price: 8000 },
    ],
    addons: [
      { id: 3, name: "Soy Milk", price: 8000 },
      { id: 4, name: "Cinnamon Sprinkle", price: 4000 },
    ],
  },
  {
    id: 3,
    name: "Snacks",
    price: 28000,
    category: "Snacks",
    image: "https://placehold.co/600x400/png",
    toppings: [
      { id: 3, name: "Vanilla Syrup", price: 6000 },
      { id: 4, name: "Chocolate Chips", price: 8000 },
    ],
    addons: [
      { id: 3, name: "Soy Milk", price: 8000 },
      { id: 4, name: "Cinnamon Sprinkle", price: 4000 },
    ],
  },
];

export default function OrderPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);  // Added for category selection
  const [cart, setCart] = useState([]);

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

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

  const steps = {
    1: <OutletSelection outlets={outlets} setSelectedOutlet={setSelectedOutlet} setCurrentStep={setCurrentStep} />,
    2: (
      <MenuSelection
        selectedOutlet={selectedOutlet}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}  // Pass the category state
        menuItems={menuItems}
        onAddToCart={handleAddToCart}
        setCurrentStep={setCurrentStep}
        handleBack={handleBack}
      />
    ),
    3: <CartPage cart={cart} setCurrentStep={setCurrentStep} calculateGrandTotal={calculateGrandTotal} handleBack={handleBack} />,
    4: <OrderSummary cart={cart} calculateGrandTotal={calculateGrandTotal} setCurrentStep={setCurrentStep} handleBack={handleBack} />,
    5: <PaymentPage handleBack={handleBack} />,
  };

  return <div className="container mx-auto p-4 font-sans text-gray-800">{steps[currentStep]}</div>;
}

const OutletSelection = ({ outlets, setSelectedOutlet, setCurrentStep }) => (
  <div>
    <h1 className="text-2xl font-bold mb-4 text-center">Select an Outlet</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {outlets.map((outlet) => (
        <div
          key={outlet.id}
          className="p-4 border rounded shadow hover:shadow-lg transition-shadow duration-300 cursor-pointer bg-white"
          onClick={() => {
            setSelectedOutlet(outlet);
            setCurrentStep(2);
          }}
        >
          <img src={outlet.image} alt={outlet.name} className="w-full h-40 object-cover rounded mb-2" />
          <h3 className="text-lg font-bold text-center">{outlet.name}</h3>
        </div>
      ))}
    </div>
  </div>
);

const MenuSelection = ({ selectedOutlet, selectedCategory, setSelectedCategory, menuItems, onAddToCart, setCurrentStep, handleBack }) => {
  const categories = [...new Set(menuItems.map(item => item.category))];  // Extract unique categories
  const categorizedMenu = menuItems.filter(item => !selectedCategory || item.category === selectedCategory);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-center">Menu - {selectedOutlet?.name}</h1>
      
      {/* Category Selector */}
      <div className="mb-6 flex overflow-x-auto">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 mx-2 rounded-full transition-all duration-200 ${
              selectedCategory === category ? "bg-green-800 text-white" : "bg-gray-200 text-gray-800"
            } hover:bg-green-800 hover:text-white`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categorizedMenu.length > 0 ? (
          categorizedMenu.map((menuItem) => (
            <MenuItemCard key={menuItem.id} menuItem={menuItem} onAddToCart={onAddToCart} />
          ))
        ) : (
          <p className="text-center text-gray-600">No items available in this category.</p>
        )}
      </div>

      <div className="flex justify-between mt-4">
        <button
          className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 shadow-md"
          onClick={handleBack}
        >
          Back
        </button>
        <button
          className="px-6 py-2 bg-green-800 text-white rounded hover:bg-green-900 shadow-md"
          onClick={() => setCurrentStep(3)}
        >
          Go to Cart
        </button>
      </div>
    </div>
  );
};

const MenuItemCard = ({ menuItem, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);

  const handleAddToCart = () => {
    onAddToCart(menuItem, quantity, selectedToppings, selectedAddons);
  };

  return (
    <div className="p-4 border rounded shadow-md bg-white">
      <img src={menuItem.image} alt={menuItem.name} className="w-full h-40 object-cover rounded mb-4" />
      <h3 className="font-semibold text-lg">{menuItem.name}</h3>
      <p className="text-gray-900">Price: Rp{menuItem.price.toLocaleString()}</p>

      <div className="mt-2">
        <h4 className="text-sm font-medium">Quantity</h4>
        <input
          type="number"
          value={quantity}
          min="1"
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          className="w-full p-2 mt-1 border rounded"
        />
      </div>

      <div className="mt-2">
        <h4 className="text-sm font-medium">Toppings</h4>
        {menuItem.toppings.map((topping) => (
          <div key={topping.id}>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedToppings((prev) => [...prev, topping]);
                  } else {
                    setSelectedToppings((prev) => prev.filter((item) => item.id !== topping.id));
                  }
                }}
              />
              <span className="ml-2">{topping.name} (+Rp{topping.price.toLocaleString()})</span>
            </label>
          </div>
        ))}
      </div>

      <div className="mt-2">
        <h4 className="text-sm font-medium">Add-ons</h4>
        {menuItem.addons.map((addon) => (
          <div key={addon.id}>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedAddons((prev) => [...prev, addon]);
                  } else {
                    setSelectedAddons((prev) => prev.filter((item) => item.id !== addon.id));
                  }
                }}
              />
              <span className="ml-2">{addon.name} (+Rp{addon.price.toLocaleString()})</span>
            </label>
          </div>
        ))}
      </div>

      <button
        onClick={handleAddToCart}
        className="mt-4 w-full bg-green-800 text-white py-2 rounded hover:bg-green-900"
      >
        Add to Cart
      </button>
    </div>
  );
};

const CartPage = ({ cart, setCurrentStep, calculateGrandTotal, handleBack }) => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-center">Your Cart</h1>
      {cart.length > 0 ? (
        <div>
          <ul className="space-y-4">
            {cart.map((item, index) => (
              <li key={index} className="flex justify-between">
                <div>
                  <p>{item.name} (x{item.quantity})</p>
                  {item.selectedToppings.length > 0 && (
                    <p className="text-sm text-gray-600">
                      Toppings: {item.selectedToppings.map(t => t.name).join(", ")}
                    </p>
                  )}
                  {item.selectedAddons.length > 0 && (
                    <p className="text-sm text-gray-600">
                      Add-ons: {item.selectedAddons.map(a => a.name).join(", ")}
                    </p>
                  )}
                </div>
                <div className="font-semibold">
                  Rp{item.itemTotal.toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 font-semibold text-xl">
            Total: Rp{calculateGrandTotal().toLocaleString()}
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-600">Your cart is empty.</p>
      )}

      <div className="flex justify-between mt-4">
        <button
          className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 shadow-md"
          onClick={handleBack}
        >
          Back
        </button>
        <button
          className="px-6 py-2 bg-green-800 text-white rounded hover:bg-green-900 shadow-md"
          onClick={() => setCurrentStep(4)}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

const OrderSummary = ({ cart, calculateGrandTotal, setCurrentStep, handleBack }) => (
  <div>
    <h1 className="text-2xl font-bold mb-4 text-center">Order Summary</h1>
    <div>
      <ul className="space-y-4">
        {cart.map((item, index) => (
          <li key={index} className="flex justify-between">
            <div>
              <p>{item.name} (x{item.quantity})</p>
              {item.selectedToppings.length > 0 && (
                <p className="text-sm text-gray-600">
                  Toppings: {item.selectedToppings.map(t => t.name).join(", ")}
                </p>
              )}
              {item.selectedAddons.length > 0 && (
                <p className="text-sm text-gray-600">
                  Add-ons: {item.selectedAddons.map(a => a.name).join(", ")}
                </p>
              )}
            </div>
            <div className="font-semibold">
              Rp{item.itemTotal.toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 font-semibold text-xl">
        Total: Rp{calculateGrandTotal().toLocaleString()}
      </div>
    </div>

    <div className="flex justify-between mt-4">
      <button
        className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 shadow-md"
        onClick={handleBack}
      >
        Back
      </button>
      <button
        className="px-6 py-2 bg-green-800 text-white rounded hover:bg-green-900 shadow-md"
        onClick={() => setCurrentStep(5)}
      >
        Proceed to Payment
      </button>
    </div>
  </div>
);

const PaymentPage = ({ handleBack }) => (
  <div>
    <h1 className="text-2xl font-bold mb-4 text-center">Payment</h1>
    <p className="text-center">Please choose your payment method:</p>
    {/* Payment options can go here */}
    <div className="mt-4 flex justify-center">
      <button
        className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 shadow-md"
        onClick={handleBack}
      >
        Back
      </button>
    </div>
  </div>
);
