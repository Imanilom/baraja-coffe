import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import axios from "axios";
import Select from "react-select";
import { toast } from "react-toastify";
import BundlingForm from "./bundlingform";
import DiscountByProductForm from "./discountbyproduct";

const CreateAutoPromoModal = ({ isOpen, onClose, onSuccess }) => {
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();

  const [formData, setFormData] = useState({
    name: "",
    promoType: "discount_on_quantity",
    conditions: {},
    discount: 0,
    bundlePrice: "",
    outlet: [],
    customerType: "",
    validFrom: startOfDay,
    validTo: endOfDay,
    isActive: true,
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const [outlets, setOutlets] = useState([]);
  const [products, setProducts] = useState([]);
  const [loyaltyLevels, setLoyaltyLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

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
    { value: "discount_on_quantity", label: "Diskon dengan Qty" },
    { value: "discount_on_total", label: "Diskon dengan Total" },
    { value: "product_specific", label: "Diskon dengan Produk" },
    { value: "buy_x_get_y", label: "Beli X Gratis Y" },
    { value: "bundling", label: "Bundling" },
  ];

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoading(true);
        try {
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
          toast.error("Gagal memuat data");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        promoType: "discount_on_quantity",
        conditions: {},
        discount: 0,
        bundlePrice: "",
        outlet: [],
        customerType: "",
        validFrom: startOfDay,
        validTo: endOfDay,
        isActive: true,
      });
      setErrors({});
    }
  }, [isOpen]);

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
    if (!formData.outlet.length) newErrors.outlet = "Pilih minimal satu outlet!";
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
        if (!formData.bundlePrice || formData.bundlePrice <= 0) newErrors.bundlePrice = "Harga bundel wajib diisi!";
        break;
      case "product_specific":
        if (!formData.conditions?.products?.length)
          newErrors.products = "Tambahkan minimal 1 produk dengan diskon!";
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

    setSubmitting(true);
    try {
      const response = await axios.post("/api/promotion/autopromo-create", payload);
      if (response.data.success) {
        toast.success("Promo berhasil dibuat!");

        if (onSuccess) {
          onSuccess(response.data);
        }

        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal membuat promo");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" onClick={onClose} />

      <div className={`fixed right-0 top-0 h-full w-full md:w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center px-6 py-4 border-b bg-white">
          <h2 className="text-xl font-semibold text-green-900">Tambah Promo Otomatis</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition" disabled={submitting}>
            <FaTimes size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Promo <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Masukkan nama promo"
                  className={`w-full px-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 ${errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-600"}`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Promo <span className="text-red-500">*</span></label>
                <Select
                  name="promoType"
                  value={{ value: formData.promoType, label: promoTypeOptions.find(opt => opt.value === formData.promoType)?.label }}
                  onChange={selected => setFormData(prev => ({ ...prev, promoType: selected.value, conditions: {}, discount: 0, bundlePrice: "" }))}
                  options={promoTypeOptions}
                  styles={customSelectStyles}
                />
              </div>

              {formData.promoType === "discount_on_quantity" && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimal Pembelian <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      name="minQuantity"
                      value={formData.conditions?.minQuantity || ""}
                      onChange={handleConditionChange}
                      className={`w-full px-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 ${errors.minQuantity ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-600"}`}
                    />
                    {errors.minQuantity && <p className="text-red-500 text-xs mt-1">{errors.minQuantity}</p>}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Potongan (%) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount || ""}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 ${errors.discount ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-600"}`}
                    />
                    {errors.discount && <p className="text-red-500 text-xs mt-1">{errors.discount}</p>}
                  </div>
                </>
              )}

              {formData.promoType === "discount_on_total" && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimal Harga <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      name="minTotal"
                      value={formData.conditions?.minTotal || ""}
                      onChange={handleConditionChange}
                      className={`w-full px-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 ${errors.minTotal ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-600"}`}
                    />
                    {errors.minTotal && <p className="text-red-500 text-xs mt-1">{errors.minTotal}</p>}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Potongan (Rp) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount || ""}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 ${errors.discount ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-600"}`}
                    />
                    {errors.discount && <p className="text-red-500 text-xs mt-1">{errors.discount}</p>}
                  </div>
                </>
              )}

              {formData.promoType === "buy_x_get_y" && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pembelian Produk <span className="text-red-500">*</span></label>
                    <Select
                      value={products.map(p => ({ value: p.id, label: p.name })).find(opt => opt.value === formData.conditions?.buyProduct) || null}
                      onChange={selected => setFormData(prev => ({ ...prev, conditions: { ...prev.conditions, buyProduct: selected.value } }))}
                      options={products.map(p => ({ value: p.id, label: p.name }))}
                      styles={customSelectStyles}
                      placeholder="Pilih produk..."
                    />
                    {errors.buyProduct && <p className="text-red-500 text-xs mt-1">{errors.buyProduct}</p>}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mendapatkan Produk <span className="text-red-500">*</span></label>
                    <Select
                      value={products.map(p => ({ value: p.id, label: p.name })).find(opt => opt.value === formData.conditions?.getProduct) || null}
                      onChange={selected => setFormData(prev => ({ ...prev, conditions: { ...prev.conditions, getProduct: selected.value } }))}
                      options={products.map(p => ({ value: p.id, label: p.name }))}
                      styles={customSelectStyles}
                      placeholder="Pilih produk..."
                    />
                    {errors.getProduct && <p className="text-red-500 text-xs mt-1">{errors.getProduct}</p>}
                  </div>
                </>
              )}

              {formData.promoType === "bundling" && (
                <BundlingForm products={products} formData={formData} setFormData={setFormData} />
              )}

              {formData.promoType === "product_specific" && (
                <DiscountByProductForm
                  products={products}
                  formData={formData}
                  setFormData={setFormData}
                  errors={errors}
                  formatCurrency={formatCurrency}
                />
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Outlet <span className="text-red-500">*</span></label>
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {outlets.map((o) => (
                    <label key={o._id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.outlet?.includes(o._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prev) => ({ ...prev, outlet: [...(prev.outlet || []), o._id] }));
                          } else {
                            setFormData((prev) => ({ ...prev, outlet: (prev.outlet || []).filter((id) => id !== o._id) }));
                          }
                        }}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      {o.name}
                    </label>
                  ))}
                </div>
                {errors.outlet && <p className="text-red-500 text-xs mt-1">{errors.outlet}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Promo <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    name="validFrom"
                    value={formData.validFrom.slice(0, 10)}
                    onChange={e => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                    className={`w-1/2 px-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 ${errors.date ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-600"}`}
                  />
                  <input
                    type="date"
                    name="validTo"
                    value={formData.validTo.slice(0, 10)}
                    onChange={e => setFormData(prev => ({ ...prev, validTo: e.target.value }))}
                    className={`w-1/2 px-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 ${errors.date ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-green-600"}`}
                  />
                </div>
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition" disabled={submitting}>
            Batal
          </button>
          <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition disabled:opacity-50" disabled={submitting || loading}>
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </>
  );
};

export default CreateAutoPromoModal;