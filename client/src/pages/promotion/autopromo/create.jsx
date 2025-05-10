import { useState, useEffect } from "react";
import axios from "axios";

const CreateAutoPromo = () => {
  const [formData, setFormData] = useState({
    name: "",
    promoType: "discount_on_quantity",
    conditions: {},
    discount: 0,
    bundlePrice: "",
    outlet: "",
    customerType: "", // Added for loyalty levels
    validFrom: new Date().toISOString().split("T")[0],
    validTo: new Date().toISOString().split("T")[0],
    isActive: true,
  });

  const [outlets, setOutlets] = useState([]);
  const [products, setProducts] = useState([]);
  const [loyaltyLevels, setLoyaltyLevels] = useState([]); // Loyalty levels data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch outlets, products, and loyalty levels
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const [outletsRes, productsRes, loyaltyLevelsRes] = await Promise.all([
          axios.get("/api/outlet"),
          axios.get("/api/menu/menu-items"),
          axios.get("/api/promotion/loyalty-levels"),
        ]);

        setOutlets(outletsRes.data || []);
        setProducts(productsRes.data.data || []);
        setLoyaltyLevels(loyaltyLevelsRes.data.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleConditionChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(formData);
    try {
      const response = await fetch("/api/promotion/autopromo-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Promo created successfully");
      } else {
        alert("Failed to create promo");
      }
    } catch (error) {
      console.error("Error creating promo:", error);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">Create Auto Promo</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Promo Name */}
          <input
            type="text"
            name="name"
            placeholder="Promo Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />

          {/* Promo Type */}
          <select
            name="promoType"
            value={formData.promoType}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="discount_on_quantity">Discount on Quantity</option>
            <option value="discount_on_total">Discount on Total</option>
            <option value="buy_x_get_y">Buy X Get Y</option>
            <option value="bundling">Bundling</option>
          </select>

          {/* Dynamic Fields Based on Promo Type */}
          {formData.promoType === "discount_on_quantity" && (
            <>
              <label>Minimum Quantity:</label>
              <input
                type="number"
                name="minQuantity"
                placeholder="Min Quantity"
                value={formData.conditions?.minQuantity || ""}
                onChange={handleConditionChange}
                className="w-full p-2 border rounded"
                required
              />
            </>
          )}

          {formData.promoType === "discount_on_total" && (
            <>
              <label>Minimum Total:</label>
              <input
                type="number"
                name="minTotal"
                placeholder="Min Total"
                value={formData.conditions?.minTotal || ""}
                onChange={handleConditionChange}
                className="w-full p-2 border rounded"
                required
              />
            </>
          )}

          {formData.promoType === "buy_x_get_y" && (
            <>
              <label>Buy Product:</label>
              <select
                name="buyProduct"
                value={formData.conditions?.buyProduct || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    conditions: {
                      ...prev.conditions,
                      buyProduct: e.target.value,
                    },
                  }))
                }
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>

              <label>Get Product:</label>
              <select
                name="getProduct"
                value={formData.conditions?.getProduct || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    conditions: {
                      ...prev.conditions,
                      getProduct: e.target.value,
                    },
                  }))
                }
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </>
          )}

          {formData.promoType === "bundling" && (
            <>
              <label>Bundle Products:</label>
              <div className="space-y-2">
                {Array.isArray(formData.conditions?.bundleProducts) &&
                  formData.conditions.bundleProducts.map((bundle, index) => (
                    <div key={index} className="flex space-x-2">
                      <select
                        name={`bundleProducts[${index}].product`}
                        value={bundle.product || ""}
                        onChange={(e) => {
                          const newBundleProducts = [...formData.conditions.bundleProducts];
                          newBundleProducts[index].product = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            conditions: {
                              ...prev.conditions,
                              bundleProducts: newBundleProducts,
                            },
                          }));
                        }}
                        className="w-full p-2 border rounded"
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        name={`bundleProducts[${index}].quantity`}
                        placeholder="Quantity"
                        value={bundle.quantity || ""}
                        onChange={(e) => {
                          const newBundleProducts = [...formData.conditions.bundleProducts];
                          newBundleProducts[index].quantity = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            conditions: {
                              ...prev.conditions,
                              bundleProducts: newBundleProducts,
                            },
                          }));
                        }}
                        className="w-1/3 p-2 border rounded"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newBundleProducts = [...formData.conditions.bundleProducts];
                          newBundleProducts.splice(index, 1);
                          setFormData((prev) => ({
                            ...prev,
                            conditions: {
                              ...prev.conditions,
                              bundleProducts: newBundleProducts,
                            },
                          }));
                        }}
                        className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    conditions: {
                      ...prev.conditions,
                      bundleProducts: [
                        ...(prev.conditions.bundleProducts || []),
                        { product: "", quantity: "" },
                      ],
                    },
                  }))
                }
                className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                Add Bundle Product
              </button>

              <label>Bundle Price:</label>
              <input
                type="number"
                name="bundlePrice"
                placeholder="Bundle Price"
                value={formData.bundlePrice || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </>
          )}

          {/* Discount Field (Not Required for Buy X Get Y) */}
          {formData.promoType !== "buy_x_get_y" && (
            <>
              <label>Discount:</label>
              <input
                type="number"
                name="discount"
                placeholder="Discount Amount"
                value={formData.discount || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </>
          )}

          {/* Customer Type (Loyalty Levels) */}
          <label>Select Customer Type:</label>
          <select
            name="customerType"
            value={formData.customerType}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">All Customers</option>
            {loyaltyLevels.map((level) => (
              <option key={level._id} value={level._id}>
                {level.name}
              </option>
            ))}
          </select>

          {/* Outlet */}
          <label>Select Outlet:</label>
          <select
            name="outlet"
            value={formData.outlet}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Outlet</option>
            {outlets.map((outlet) => (
              <option key={outlet._id} value={outlet._id}>
                {outlet.name}
              </option>
            ))}
          </select>

          {/* Validity Dates */}
          <label>Valid From:</label>
          <input
            type="date"
            name="validFrom"
            value={formData.validFrom}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
          <label>Valid To:</label>
          <input
            type="date"
            name="validTo"
            value={formData.validTo}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />

          {/* Active Checkbox */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            <span>Active</span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Create Promo
          </button>
        </form>
      )}
    </div>
  );
};

export default CreateAutoPromo;