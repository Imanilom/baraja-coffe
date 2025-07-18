import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaCut, FaBell, FaUser, FaChevronRight } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CreateAutoPromo = () => {
  const navigate = useNavigate();
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

        setOutlets(outletsRes.data.data || []);
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
        navigate("/admin/promo-otomatis")
      } else {
        alert("Failed to create promo");
      }
    } catch (error) {
      console.error("Error creating promo:", error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-2">Error</p>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex justify-end px-3 items-center py-4 space-x-2 border-b">
        <FaBell size={23} className="text-gray-400" />
        <span className="text-[14px]">Hi Baraja</span>
        <Link to="/admin/menu" className="text-gray-400 inline-block text-2xl">
          <FaUser size={30} />
        </Link>
      </div>

      {/* Breadcrumb */}
      <form onSubmit={handleSubmit}>
        <div className="px-3 py-2 flex justify-between items-center border-b">
          <div className="flex items-center space-x-2">
            <FaCut size={21} className="text-gray-500 inline-block" />
            <p className="text-[15px] text-gray-500">Promo</p>
            <FaChevronRight className="text-[15px] text-gray-500" />
            <Link to="/admin/promo-otomatis" className="text-[15px] text-gray-500">Promo Otomatis</Link>
            <FaChevronRight className="text-[15px] text-gray-500" />
            <Link to="/admin/promo-otomatis-create" className="text-[15px] text-gray-500">Tambah Promo Otomatis</Link>
          </div>

          <div className="flex space-x-2">
            <Link to="/admin/promo-otomatis"
              className="bg-white text-[#005429] border border-[#005429] text-[13px] px-[15px] py-[7px] rounded">
              Batal
            </Link>
            <button
              type="submit"
              className="bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
            >
              Tambah Promo
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-6">
          <div className="w-full mx-auto p-12 bg-white shadow-lg rounded-lg space-y-6">

            {/* Promo Name */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Promo Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter promo name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                required
              />
            </div>

            {/* Promo Type */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Promo Type</label>
              <select
                name="promoType"
                value={formData.promoType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
              >
                <option value="discount_on_quantity">Discount on Quantity</option>
                <option value="discount_on_total">Discount on Total</option>
                <option value="buy_x_get_y">Buy X Get Y</option>
                <option value="bundling">Bundling</option>
              </select>
            </div>

            {/* Conditional Fields */}
            {formData.promoType === "discount_on_quantity" && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Minimum Quantity</label>
                <input
                  type="number"
                  name="minQuantity"
                  value={formData.conditions?.minQuantity || ""}
                  onChange={handleConditionChange}
                  placeholder="Min Quantity"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                  required
                />
              </div>
            )}

            {formData.promoType === "discount_on_total" && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Minimum Total</label>
                <input
                  type="number"
                  name="minTotal"
                  value={formData.conditions?.minTotal || ""}
                  onChange={handleConditionChange}
                  placeholder="Min Total"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                  required
                />
              </div>
            )}

            {formData.promoType === "buy_x_get_y" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Buy Product</label>
                  <select
                    name="buyProduct"
                    value={formData.conditions?.buyProduct || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        conditions: { ...prev.conditions, buyProduct: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Get Product</label>
                  <select
                    name="getProduct"
                    value={formData.conditions?.getProduct || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        conditions: { ...prev.conditions, getProduct: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {formData.promoType === "bundling" && (
              <div className="space-y-4">
                <fieldset className="space-y-2">
                  <legend className="text-sm font-semibold text-gray-700">Bundle Products</legend>
                  {formData.conditions?.bundleProducts?.map((bundle, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={bundle.product || ""}
                        onChange={(e) => {
                          const updated = [...formData.conditions.bundleProducts];
                          updated[index].product = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            conditions: { ...prev.conditions, bundleProducts: updated },
                          }));
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={bundle.quantity || ""}
                        onChange={(e) => {
                          const updated = [...formData.conditions.bundleProducts];
                          updated[index].quantity = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            conditions: { ...prev.conditions, bundleProducts: updated },
                          }));
                        }}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...formData.conditions.bundleProducts];
                          updated.splice(index, 1);
                          setFormData((prev) => ({
                            ...prev,
                            conditions: { ...prev.conditions, bundleProducts: updated },
                          }));
                        }}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        conditions: {
                          ...prev.conditions,
                          bundleProducts: [...(prev.conditions.bundleProducts || []), { product: "", quantity: "" }],
                        },
                      }))
                    }
                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Add Product
                  </button>
                </fieldset>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Bundle Price</label>
                  <input
                    type="number"
                    name="bundlePrice"
                    value={formData.bundlePrice || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                    required
                  />
                </div>
              </div>
            )}

            {/* Discount */}
            {formData.promoType !== "buy_x_get_y" && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Discount</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount || ""}
                  onChange={handleChange}
                  placeholder="Discount Amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                  required
                />
              </div>
            )}

            {/* Customer Type */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Customer Type</label>
              <select
                name="customerType"
                value={formData.customerType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                required
              >
                <option value="">All Customers</option>
                {loyaltyLevels.map((level) => (
                  <option key={level._id} value={level._id}>{level.name}</option>
                ))}
              </select>
            </div>

            {/* Outlet */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Outlet</label>
              <select
                name="outlet"
                value={formData.outlet}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                required
              >
                <option value="">Select Outlet</option>
                {outlets.map((outlet) => (
                  <option key={outlet._id} value={outlet._id}>{outlet.name}</option>
                ))}
              </select>
            </div>

            {/* Valid Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Valid From</label>
                <input
                  type="date"
                  name="validFrom"
                  value={formData.validFrom}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Valid To</label>
                <input
                  type="date"
                  name="validTo"
                  value={formData.validTo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                  required
                />
              </div>
            </div>

            {/* Active */}
            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="accent-blue-600"
              />
              <label className="ml-2 text-sm text-gray-700">Active</label>
            </div>
          </div>

        </div>
      </form>
    </div>


  );
};

export default CreateAutoPromo;