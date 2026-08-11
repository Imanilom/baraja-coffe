import { useState, useEffect } from "react";
import axios from '@/lib/axios';
import { Link } from "react-router-dom";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

const PaymentMethodList = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get('/api/paymentMethode');
      if (response.data.success) {
        setPaymentMethods(response.data.data);
      } else {
        setError(response.data.message || 'Gagal mengambil data');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus metode pembayaran ini?")) {
      try {
        const res = await axios.delete(`/api/paymentMethode/${id}`);
        if (res.data.success) {
          fetchPaymentMethods();
        } else {
          alert('Gagal menghapus data');
        }
      } catch (err) {
        alert('Terjadi kesalahan saat menghapus');
      }
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen Payment Method</h1>
        <Link
          to="/admin/payment-method/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FaPlus /> Tambah Payment Method
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th scope="col" className="px-6 py-3">No</th>
              <th scope="col" className="px-6 py-3">Nama</th>
              <th scope="col" className="px-6 py-3">Bank Code</th>
              <th scope="col" className="px-6 py-3">Tipe Data</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paymentMethods.length > 0 ? (
              paymentMethods.map((pm, index) => (
                <tr key={pm._id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{pm.name}</td>
                  <td className="px-6 py-4">{pm.bank_code}</td>
                  <td className="px-6 py-4">
                    {pm.isBank && <span className="mr-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Bank</span>}
                    {pm.isCash && <span className="mr-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Cash</span>}
                    {pm.isDigital && <span className="mr-2 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Digital</span>}
                    {pm.groOnly && <span className="mr-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">GRO Only</span>}
                  </td>
                  <td className="px-6 py-4">
                    {pm.isActive ? (
                      <span className="text-green-600 font-semibold">Aktif</span>
                    ) : (
                      <span className="text-red-600 font-semibold">Nonaktif</span>
                    )}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => handleDelete(pm._id)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="Hapus"
                    >
                      <FaTrash size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  Tidak ada data metode pembayaran.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentMethodList;
