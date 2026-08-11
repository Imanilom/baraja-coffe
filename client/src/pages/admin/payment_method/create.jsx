import { useState } from "react";
import axios from '@/lib/axios';
import { useNavigate, Link } from "react-router-dom";
import { FaArrowLeft, FaSave } from "react-icons/fa";

const CreatePaymentMethod = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    icon: "default.png",
    color: "#2196F3",
    payment_method: "",
    payment_method_name: "",
    bank_code: "",
    typeCode: "",
    methodIds: [],
    isBank: false,
    isCash: false,
    isPtBank: false,
    groOnly: false,
    isDigital: true,
    isActive: true
  });

  const availableMethodIds = [
    { id: 'cash', label: 'Cash' },
    { id: 'ewallet', label: 'E-Wallet' },
    { id: 'debit', label: 'Debit' },
    { id: 'banktransfer', label: 'Bank Transfer' },
    { id: 'qris', label: 'QRIS' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleMethodIdsChange = (id) => {
    setFormData(prev => {
      const currentIds = [...prev.methodIds];
      if (currentIds.includes(id)) {
        return { ...prev, methodIds: currentIds.filter(x => x !== id) };
      } else {
        return { ...prev, methodIds: [...currentIds, id] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/paymentMethode', formData);
      if (res.data.success) {
        alert("Payment Method berhasil ditambahkan!");
        navigate("/admin/payment-method");
      } else {
        alert(res.data.message || "Gagal menyimpan data");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat menyimpan data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm w-full max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Link to="/admin/payment-method" className="text-gray-500 hover:text-gray-700 mr-4">
          <FaArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Tambah Payment Method</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Kolom Kiri */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Informasi Dasar</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama (e.g., BCA, QRIS, Tunai)*</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type Code (e.g., BCA, CASH)*</label>
              <input
                type="text"
                name="typeCode"
                value={formData.typeCode}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Code (Unik, e.g., bca, qris)*</label>
              <input
                type="text"
                name="bank_code"
                value={formData.bank_code}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method (Sistem, e.g., bank_transfer)*</label>
              <input
                type="text"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group POS Name (e.g., Bank Transfer)*</label>
              <input
                type="text"
                name="payment_method_name"
                value={formData.payment_method_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Kolom Kanan */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Pengaturan Tambahan</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warna Hex (e.g., #1565C0)</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ditampilkan di Grup POS (Method Ids)</label>
              <div className="flex flex-wrap gap-2">
                {availableMethodIds.map(method => (
                  <label key={method.id} className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded border cursor-pointer hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={formData.methodIds.includes(method.id)}
                      onChange={() => handleMethodIdsChange(method.id)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="isBank" checked={formData.isBank} onChange={handleChange} className="rounded text-blue-600" />
                <span className="text-sm">Is Bank</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="isCash" checked={formData.isCash} onChange={handleChange} className="rounded text-blue-600" />
                <span className="text-sm">Is Cash</span>
              </label>

              <label className="flex items-center space-x-2">
                <input type="checkbox" name="isDigital" checked={formData.isDigital} onChange={handleChange} className="rounded text-blue-600" />
                <span className="text-sm">Is Digital</span>
              </label>

              <label className="flex items-center space-x-2">
                <input type="checkbox" name="isPtBank" checked={formData.isPtBank} onChange={handleChange} className="rounded text-blue-600" />
                <span className="text-sm">PT Bank (Transfer PT)</span>
              </label>

              <label className="flex items-center space-x-2">
                <input type="checkbox" name="groOnly" checked={formData.groOnly} onChange={handleChange} className="rounded text-blue-600" />
                <span className="text-sm">GRO Only</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="rounded text-green-600" />
                <span className="text-sm font-semibold">Aktif</span>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-2 rounded text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            <FaSave /> {loading ? 'Menyimpan...' : 'Simpan Payment Method'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePaymentMethod;
