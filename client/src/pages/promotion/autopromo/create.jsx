import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaCut, FaChevronRight } from "react-icons/fa";
import axios from "axios";
import Select from "react-select";
import Header from "../../admin/header";
import Datepicker from "react-tailwindcss-datepicker";

const CreateAutoPromo = () => {
  const navigate = useNavigate();
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();

  const [formData, setFormData] = useState({
    name: "",
    promoType: "discount_on_quantity",
    conditions: {},
    discount: 0,
    bundlePrice: "",
    outlet: "",
    customerType: "",
    validFrom: startOfDay,
    validTo: endOfDay,
    isActive: true,
  });

  const [outlets, setOutlets] = useState([]);
  const [products, setProducts] = useState([]);
  const [loyaltyLevels, setLoyaltyLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({}); // state untuk validasi

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: '#d1d5db',
      minHeight: '34px',
      fontSize: '13px',
      color: '#6b7280',
      boxShadow: state.isFocused ? '0 0 0 1px #005429' : 'none',
      '&:hover': { borderColor: '#9ca3af' },
    }),
    singleValue: (provided) => ({ ...provided, color: '#6b7280' }),
    input: (provided) => ({ ...provided, color: '#6b7280' }),
    placeholder: (provided) => ({ ...provided, color: '#9ca3af', fontSize: '13px' }),
    option: (provided, state) => ({
      ...provided,
      fontSize: '13px',
      color: '#374151',
      backgroundColor: state.isFocused ? 'rgba(0, 84, 41, 0.1)' : 'white',
      cursor: 'pointer',
    }),
  };

  const promoTypeOptions = [
    { value: "discount_on_quantity", label: "Discount on Quantity" },
    { value: "discount_on_total", label: "Discount on Total" },
    { value: "buy_x_get_y", label: "Buy X Get Y" },
    { value: "bundling", label: "Bundling" },
  ];

  // Fetch data
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
        console.error(err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleConditionChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, conditions: { ...prev.conditions, [name]: value } }));
  };

  const validate = () => {
    let newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Nama promo wajib diisi!";
    if (!formData.outlet) newErrors.outlet = "Pilih outlet!";
    if (!formData.validFrom || !formData.validTo) newErrors.date = "Pilih tanggal mulai dan akhir!";
    if (formData.validFrom && formData.validTo && new Date(formData.validFrom) > new Date(formData.validTo))
      newErrors.date = "Tanggal mulai tidak boleh lebih besar dari tanggal akhir!";

    switch (formData.promoType) {
      case "discount_on_quantity":
        if (!formData.conditions?.minQuantity) newErrors.minQuantity = "Minimal pembelian wajib diisi!";
        if (!formData.discount || formData.discount <= 0) newErrors.discount = "Potongan harus lebih dari 0!";
        break;
      case "discount_on_total":
        if (!formData.conditions?.minTotal) newErrors.minTotal = "Minimal total wajib diisi!";
        if (!formData.discount || formData.discount <= 0) newErrors.discount = "Potongan harus lebih dari 0!";
        break;
      case "buy_x_get_y":
        if (!formData.conditions?.buyProduct) newErrors.buyProduct = "Pilih produk pembelian!";
        if (!formData.conditions?.getProduct) newErrors.getProduct = "Pilih produk yang didapat!";
        break;
      case "bundling":
        if (!formData.conditions?.bundleProducts?.length) newErrors.bundleProducts = "Tambahkan minimal 1 produk bundel!";
        formData.conditions?.bundleProducts?.forEach((b, i) => {
          if (!b.product) newErrors[`bundleProduct_${i}`] = "Produk bundel wajib dipilih!";
          if (!b.quantity) newErrors[`bundleQty_${i}`] = "Qty bundel wajib diisi!";
        });
        if (!formData.bundlePrice || formData.bundlePrice <= 0) newErrors.bundlePrice = "Harga bundel wajib diisi!";
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name,
      promoType: formData.promoType,
      conditions: formData.conditions,
      discount: formData.discount,
      bundlePrice: formData.bundlePrice,
      outlet: formData.outlet,
      consumerType: formData.customerType,
      validFrom: formData.validFrom,
      validTo: formData.validTo,
      isActive: formData.isActive ? 1 : 0,
    };

    try {
      const response = await axios.post("/api/promotion/autopromo-create", payload);
      if (response.data.success) {
        alert("Promo berhasil dibuat!");
        navigate("/admin/promo-otomatis");
      } else {
        alert("Gagal membuat promo. Cek kembali data Anda.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat membuat promo.");
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-red-500 text-center">
        <p className="text-xl font-semibold mb-2">Error</p>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 bg-[#005429] text-white px-4 py-2 rounded">Refresh</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-full">
      <Header />

      <div className="px-3 py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2 text-sm text-gray-500 w-full sm:w-auto whitespace-nowrap">
          <FaCut size={18} />
          <p>Promo</p>
          <FaChevronRight />
          <span>Promo Otomatis</span>
          <FaChevronRight />
          <span>Tambah Promo</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-3xl mx-auto p-6 md:p-10 bg-white shadow-lg rounded-lg space-y-6">

          {/* Promo Name */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Promo</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Masukan Promo"
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 ${errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-[#005429]"
                }`}
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          {/* Promo Type */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Tipe Promo</label>
            <Select
              name="promoType"
              value={{ value: formData.promoType, label: promoTypeOptions.find(opt => opt.value === formData.promoType)?.label }}
              onChange={selected => setFormData(prev => ({ ...prev, promoType: selected.value, conditions: {}, discount: 0, bundlePrice: "" }))}
              options={promoTypeOptions}
              styles={customSelectStyles}
            />
          </div>

          {/* Conditional Fields */}
          {formData.promoType === "discount_on_quantity" && (
            <>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Minimal Pembelian</label>
                <input
                  type="number"
                  name="minQuantity"
                  value={formData.conditions?.minQuantity || ""}
                  onChange={handleConditionChange}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 ${errors.minQuantity ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-[#005429]"
                    }`}
                />
                {errors.minQuantity && <p className="text-red-500 text-sm">{errors.minQuantity}</p>}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Potongan (%)</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount || ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 ${errors.discount ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-[#005429]"
                    }`}
                />
                {errors.discount && <p className="text-red-500 text-sm">{errors.discount}</p>}
              </div>
            </>
          )}

          {formData.promoType === "discount_on_total" && (
            <>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Minimal Harga</label>
                <input
                  type="number"
                  name="minTotal"
                  value={formData.conditions?.minTotal || ""}
                  onChange={handleConditionChange}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 ${errors.minTotal ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-[#005429]"
                    }`}
                />
                {errors.minTotal && <p className="text-red-500 text-sm">{errors.minTotal}</p>}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Potongan (Rp.)</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount || ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 ${errors.discount ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-[#005429]"
                    }`}
                />
                {errors.discount && <p className="text-red-500 text-sm">{errors.discount}</p>}
              </div>
            </>
          )}

          {formData.promoType === "buy_x_get_y" && (
            <>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Pembelian Produk</label>
                <Select
                  value={products.map(p => ({ value: p.id, label: p.name })).find(opt => opt.value === formData.conditions?.buyProduct) || null}
                  onChange={selected => setFormData(prev => ({ ...prev, conditions: { ...prev.conditions, buyProduct: selected.value } }))}
                  options={products.map(p => ({ value: p.id, label: p.name }))}
                  styles={customSelectStyles}
                />
                {errors.buyProduct && <p className="text-red-500 text-sm">{errors.buyProduct}</p>}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Mendapatkan Produk</label>
                <Select
                  value={products.map(p => ({ value: p.id, label: p.name })).find(opt => opt.value === formData.conditions?.getProduct) || null}
                  onChange={selected => setFormData(prev => ({ ...prev, conditions: { ...prev.conditions, getProduct: selected.value } }))}
                  options={products.map(p => ({ value: p.id, label: p.name }))}
                  styles={customSelectStyles}
                />
                {errors.getProduct && <p className="text-red-500 text-sm">{errors.getProduct}</p>}
              </div>
            </>
          )}

          {formData.promoType === "bundling" && (
            <>
              <fieldset className="space-y-3">
                <legend className="block text-sm font-medium text-gray-700">Produk Bundling</legend>
                {(formData.conditions.bundleProducts || []).map((b, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Select
                      value={products.map(p => ({ value: p.id, label: p.name })).find(opt => opt.value === b.product) || null}
                      onChange={selected => {
                        const newBundles = [...formData.conditions.bundleProducts];
                        newBundles[idx].product = selected.value;
                        setFormData(prev => ({ ...prev, conditions: { ...prev.conditions, bundleProducts: newBundles } }));
                      }}
                      options={products.map(p => ({ value: p.id, label: p.name }))}
                      styles={customSelectStyles}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={b.quantity || ""}
                      onChange={e => {
                        const newBundles = [...formData.conditions.bundleProducts];
                        newBundles[idx].quantity = e.target.value;
                        setFormData(prev => ({ ...prev, conditions: { ...prev.conditions, bundleProducts: newBundles } }));
                      }}
                      className={`px-2 py-1 border rounded-md ${errors[`bundleQty_${idx}`] ? "border-red-500" : "border-gray-300"
                        }`}
                    />
                    {errors[`bundleProduct_${idx}`] && <p className="text-red-500 text-sm">{errors[`bundleProduct_${idx}`]}</p>}
                    {errors[`bundleQty_${idx}`] && <p className="text-red-500 text-sm">{errors[`bundleQty_${idx}`]}</p>}
                  </div>
                ))}
                <button type="button" onClick={() => {
                  const newBundles = [...(formData.conditions.bundleProducts || []), { product: "", quantity: "" }];
                  setFormData(prev => ({ ...prev, conditions: { ...prev.conditions, bundleProducts: newBundles } }));
                }} className="text-sm text-[#005429]">Tambah Produk</button>
                {errors.bundleProducts && <p className="text-red-500 text-sm">{errors.bundleProducts}</p>}
              </fieldset>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Harga Bundel</label>
                <input
                  type="number"
                  name="bundlePrice"
                  value={formData.bundlePrice || ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 ${errors.bundlePrice ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-[#005429]"
                    }`}
                />
                {errors.bundlePrice && <p className="text-red-500 text-sm">{errors.bundlePrice}</p>}
              </div>
            </>
          )}

          {/* Outlet */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Outlet</label>
            <Select
              name="outlet"
              value={outlets.map(o => ({ value: o._id, label: o.name })).find(o => o.value === formData.outlet) || null}
              options={outlets.map(o => ({ value: o._id, label: o.name }))}
              onChange={selected => setFormData(prev => ({ ...prev, outlet: selected ? selected.value : "" }))}
              styles={customSelectStyles}
            />
            {errors.outlet && <p className="text-red-500 text-sm">{errors.outlet}</p>}
          </div>

          {/* Valid Dates */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Tanggal Promo</label>
            <div className="flex gap-2">
              <input
                type="date"
                name="validFrom"
                value={formData.validFrom.slice(0, 10)}
                onChange={e => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                className={`w-1/2 px-4 py-2 border rounded-md ${errors.date ? "border-red-500" : "border-gray-300"
                  }`}
              />
              <input
                type="date"
                name="validTo"
                value={formData.validTo.slice(0, 10)}
                onChange={e => setFormData(prev => ({ ...prev, validTo: e.target.value }))}
                className={`w-1/2 px-4 py-2 border rounded-md ${errors.date ? "border-red-500" : "border-gray-300"
                  }`}
              />
            </div>
            {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end flex-col md:flex-row gap-3">
            <Link to="/admin/promo-otomatis" className="w-full md:w-auto text-center bg-white text-[#005429] border border-[#005429] text-sm px-5 py-2 rounded">
              Batal
            </Link>
            <button type="submit" className="w-full md:w-auto bg-[#005429] text-white text-sm px-5 py-2 rounded hover:bg-[#007a3a]">
              Tambah Promo
            </button>
          </div>

        </div>
      </form>
    </div>
  );
};

export default CreateAutoPromo;
